import { NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "../../../../lib/supabaseAdmin";
import { supabase, isSupabaseConfigured } from "../../../../lib/supabase";
import { verifyPassword, hashPassword } from "../../../../lib/auth";
import { createSessionToken, setSessionCookie } from "../../../../lib/session";

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
    let authData = null;
    let authError = null;
    try {
      const authRes = await dbClient.auth.signInWithPassword({
        email,
        password: cleanPass,
      });
      authData = authRes?.data;
      authError = authRes?.error;
    } catch (e) {
      authError = e;
    }

    // 2. إن فشلت وكان المستخدم بجدول public.users القديم
    if (authError || !authData?.user) {
      let userData = null;

      // أ) محاولة الاستعلام المباشر من public.users
      const { data: directData, error: directErr } = await dbClient
        .from("users")
        .select("*")
        .ilike("username", cleanUser);

      if (directData && directData.length > 0) {
        userData = directData;
      }

      // ب) إن لم تُعد نتائج (بسبب RLS أو الحسابات المضافة يدوياً)، نحاول عبر RPC أمن (get_user_for_login)
      if ((!userData || userData.length === 0) && dbClient.rpc) {
        try {
          const { data: rpcData } = await dbClient.rpc("get_user_for_login", { p_username: cleanUser });
          if (rpcData && rpcData.length > 0) {
            userData = rpcData;
          }
        } catch (rpcErr) {
          console.warn("RPC get_user_for_login warning:", rpcErr);
        }
      }

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
      try {
        if (foundUser.password && !foundUser.password.startsWith("pbkdf2:") && !foundUser.password.startsWith("$2")) {
          const newHash = hashPassword(cleanPass);
          await dbClient.from("users").update({ password: newHash }).eq("id", foundUser.id);
        }
      } catch (updErr) {
        console.warn("Password hash update notice:", updErr);
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

      const userRole = foundUser.role || "admin";
      const userCampId = foundUser.camp_id || "kareem";
      const redirectPath = userRole === "superadmin" ? "/super-admin" : "/";

      const token = await createSessionToken({
        userId: foundUser.id,
        username: foundUser.username,
        role: userRole,
        campId: userCampId,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          username: foundUser.username,
          role: userRole,
          campId: userCampId,
          email,
          name: foundUser.name || foundUser.username,
          uid: foundUser.id,
        },
        redirectPath,
        access_token: authData?.session?.access_token || null,
        refresh_token: authData?.session?.refresh_token || null,
      });

      setSessionCookie(response, token);
      return response;
    }

    const { data: profile } = await dbClient
      .from("users")
      .select("*")
      .eq("id", authData.user.id)
      .maybeSingle();

    const role = profile?.role || authData.user.user_metadata?.role || "admin";
    const campId = profile?.camp_id || authData.user.user_metadata?.campId || "kareem";
    const redirectPath = role === "superadmin" ? "/super-admin" : "/";

    const token = await createSessionToken({
      userId: authData.user.id,
      username: profile?.username || cleanUser,
      role,
      campId,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        username: profile?.username || cleanUser,
        role,
        campId,
        email,
        name: profile?.name || authData.user.user_metadata?.name || cleanUser,
        uid: authData.user.id,
      },
      redirectPath,
      access_token: authData.session?.access_token || null,
      refresh_token: authData.session?.refresh_token || null,
    });

    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("Auth API login error:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ في الخادم أثناء التحقق من بيانات الدخول" },
      { status: 500 }
    );
  }
}


