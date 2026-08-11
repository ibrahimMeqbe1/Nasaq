import { NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "../../../../lib/supabaseAdmin";
import { verifyPassword, hashPassword } from "../../../../lib/auth";

// ملاحظة معمارية مهمة:
// هذا المسار هو المكان الوحيد المسموح فيه استخدام supabaseAdmin (service role).
// بعد التحقق من الهوية هنا، لازم نُرجع access_token + refresh_token حقيقيين
// من Supabase Auth، والمتصفح بعدين بيستدعي supabase.auth.setSession() فيهم
// (شوف campService.js) — وإلا كل استعلامات RLS القادمة من المتصفح رح تُحسب
// "anon" وترجع فاضية أو تُرفض مهما كان المستخدم مسجل دخول حسب الـ UI.

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

    if (!isAdminConfigured || !supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: "الخادم غير مهيأ بشكل صحيح (SUPABASE_SERVICE_ROLE_KEY مفقود)." },
        { status: 500 }
      );
    }

    const email = cleanUser.includes("@") ? cleanUser : `${cleanUser.toLowerCase()}@camp.com`;

    // 1. المحاولة المباشرة: المستخدم موجود فعلاً بـ Supabase Auth
    let { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password: cleanPass,
    });

    // 2. إن فشلت (المستخدم لسا بجدول public.users القديم بس مش بـ Supabase Auth بعد)
    //    نتحقق من كلمة المرور يدوياً، وإذا صحيحة نربط/ننشئ له حساب Auth حقيقي
    if (authError || !authData?.user) {
      const { data: userData } = await supabaseAdmin
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
        await supabaseAdmin.from("users").update({ password: newHash }).eq("id", foundUser.id);
      }

      // إنشاء حساب Supabase Auth مطابق لهذا المستخدم (مرة واحدة فقط لكل مستخدم قديم)
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: cleanPass,
        email_confirm: true,
        user_metadata: { username: foundUser.username, role: foundUser.role, campId: foundUser.camp_id },
      });

      if (createErr && !String(createErr.message || "").toLowerCase().includes("already")) {
        console.error("Auth admin createUser error:", createErr);
        return NextResponse.json(
          { success: false, error: "تعذر ربط الحساب بنظام المصادقة السحابي" },
          { status: 500 }
        );
      }

      const authUserId = created?.user?.id;
      // اجعل id في جدول users مطابقاً لمعرف Supabase Auth حتى تعمل سياسات RLS (auth.uid())
      if (authUserId && authUserId !== foundUser.id) {
        await supabaseAdmin.from("users").update({ id: authUserId }).eq("username", foundUser.username);
      }

      // الآن سجّل الدخول فعلياً للحصول على access_token / refresh_token حقيقيين
      const signInAfterCreate = await supabaseAdmin.auth.signInWithPassword({ email, password: cleanPass });
      authData = signInAfterCreate.data;
      authError = signInAfterCreate.error;

      if (authError || !authData?.user) {
        console.error("Auth sign-in after createUser failed:", authError);
        return NextResponse.json(
          { success: false, error: "تم التحقق من الحساب لكن تعذر إنشاء جلسة الدخول" },
          { status: 500 }
        );
      }
    }

    const { data: profile } = await supabaseAdmin
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
      access_token: authData.session?.access_token,
      refresh_token: authData.session?.refresh_token,
    });
  } catch (error) {
    console.error("Auth API login error:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ في الخادم أثناء التحقق من بيانات الدخول" },
      { status: 500 }
    );
  }
}
