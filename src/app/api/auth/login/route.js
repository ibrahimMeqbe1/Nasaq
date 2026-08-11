import { NextResponse } from "next/server";
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

    // 1. المصادقة السحابية المباشرة عبر Supabase Auth إن كان متصلاً
    if (isSupabaseConfigured && supabase) {
      const email = cleanUser.includes("@") ? cleanUser : `${cleanUser.toLowerCase()}@camp.com`;
      
      let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: cleanPass,
      });

      if (!authError && authData?.session) {
        const { data: profile } = await supabase
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
          session: authData.session,
        });
      }

      // 2. التحقق من جدول المستخدمين public.users مع ترقية وتوليد جلسة
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .ilike("username", cleanUser);

      if (userData && userData.length > 0) {
        const foundUser = userData[0];
        const isValid = verifyPassword(cleanPass, foundUser.password);

        if (isValid) {
          // ترقية التشفير تلقائياً إلى salted pbkdf2 إن كانت الكلمة القديمة Plaintext
          if (!foundUser.password.startsWith("pbkdf2:")) {
            const newHash = hashPassword(cleanPass);
            await supabase.from("users").update({ password: newHash }).eq("id", foundUser.id);
          }

          // محاولة إنشاء/ربط الحساب بـ Supabase Auth لتوليد جلسة JWT حقيقية
          try {
            const { data: signUpData } = await supabase.auth.signUp({
              email,
              password: cleanPass,
              options: {
                data: {
                  username: foundUser.username,
                  role: foundUser.role || "admin",
                  campId: foundUser.camp_id || "kareem",
                  name: foundUser.name || foundUser.username,
                },
              },
            });
            if (signUpData?.session) {
              authData = signUpData;
            }
          } catch (signUpErr) {
            console.warn("Supabase Auth fallback signUp error:", signUpErr);
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
            session: authData?.session || null,
          });
        }
      }
    }

    return NextResponse.json(
      { success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Auth API login error:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ في الخادم أثناء التحقق من بيانات الدخول" },
      { status: 500 }
    );
  }
}
