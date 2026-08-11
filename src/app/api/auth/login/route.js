import { NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "../../../../lib/supabaseAdmin";
import { supabase, isSupabaseConfigured } from "../../../../lib/supabase";
import { verifyPassword, hashPassword } from "../../../../lib/auth";

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    const cleanUser = (username || "").trim();
    const cleanPass = (password || "").trim();

    if (!cleanUser || !cleanPass) {
      return NextResponse.json(
        { success: false, error: "اسم المستخدم وكلمة المرور مطلوبة" },
        { status: 400 }
      );
    }

    const dbClient = isAdminConfigured && supabaseAdmin ? supabaseAdmin : (isSupabaseConfigured ? supabase : null);

    if (!dbClient) {
      return NextResponse.json(
        { success: false, error: "النظام غير متصل بقاعدة البيانات (يرجى ضبط .env.local)." },
        { status: 500 }
      );
    }

    const email = cleanUser.includes("@") ? cleanUser : `${cleanUser.toLowerCase()}@camp.com`;

    // 1. المحاولة المباشرة عبر Supabase Auth
    let { data: authData, error: authError } = await dbClient.auth.signInWithPassword({
      email,
      password: cleanPass,
    });

    // 2. إن فشلت وكان المستخدم بجدول public.users القديم
    if (authError || !authData?.user) {
      const { data: userData } = await dbClient
        .from("users")
        .select("*")
        .ilike("username", cleanUser);

      const foundUser = userData && userData.length > 0 ? userData[0] : null;
      if (!foundUser) {
        return NextResponse.json(
          { success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" },
          { status: 401 }
        );
      }

      const isValid = verifyPassword(cleanPass, foundUser.password);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" },
          { status: 401 }
        );
      }

      // ترقية التشفير تلقائياً إلى salted pbkdf2 إن كانت الكلمة القديمة Plaintext
      if (!foundUser.password.startsWith("pbkdf2:")) {
        const newHash = hashPassword(cleanPass);
        await dbClient.from("users").update({ password: newHash }).eq("id", foundUser.id);
      }

      // إن كان supabaseAdmin متوفراً، نربط الحساب بـ Auth
      if (isAdminConfigured && supabaseAdmin) {
        try {
          const { data: created } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: cleanPass,
            email_confirm: true,
            user_metadata: { username: foundUser.username, role: foundUser.role, campId: foundUser.camp_id },
          });

          const authUserId = created?.user?.id;
          if (authUserId && authUserId !== foundUser.id) {
            await supabaseAdmin.from("users").update({ id: authUserId }).eq("username", foundUser.username);
          }

          const signInAfterCreate = await supabaseAdmin.auth.signInWithPassword({ email, password: cleanPass });
          if (signInAfterCreate?.data?.user) {
            authData = signInAfterCreate.data;
          }
        } catch (adminErr) {
          console.warn("supabaseAdmin auto signUp warning:", adminErr);
        }
      }

      return NextResponse.json({
        success: true,
        user: {
          username: foundUser.username,
          role: foundUser.role || "admin",
          campId: foundUser.camp_id || "kareem",
          email,
          name: foundUser.name || foundUser.username,
          uid: foundUser.id,
        },
        access_token: authData?.session?.access_token || null,
        refresh_token: authData?.session?.refresh_token || null,
      });
    }

    const { data: profile } = await dbClient
      .from("users")
      .select("*")
      .eq("id", authData.user.id)
      .maybeSingle();

    const role = profile?.role || authData.user.user_metadata?.role || "admin";
    const campId = profile?.camp_id || authData.user.user_metadata?.campId || "kareem";

    return NextResponse.json({
      success: true,
      user: {
        username: profile?.username || cleanUser,
        role,
        campId,
        email,
        name: profile?.name || authData.user.user_metadata?.name || cleanUser,
        uid: authData.user.id,
      },
      access_token: authData.session?.access_token || null,
      refresh_token: authData.session?.refresh_token || null,
    });
  } catch (error) {
    console.error("Auth API login error:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ في الخادم أثناء التحقق من بيانات الدخول" },
      { status: 500 }
    );
  }
}
