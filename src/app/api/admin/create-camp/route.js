import { NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "../../../../lib/supabaseAdmin";
import { requireSuperAdmin } from "../../../../lib/adminAuth";
import { PASSWORD_REQUIREMENT_MESSAGE, isPasswordAllowed } from "../../../../lib/passwordPolicy";

export async function POST(request) {
  try {
    if (!isAdminConfigured || !supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: "الخادم غير مهيأ لإنشاء المخيمات." },
        { status: 503 }
      );
    }

    if (!(await requireSuperAdmin(request))) {
      return NextResponse.json(
        { success: false, error: "انتهت جلسة المشرف العام. سجّل الدخول من جديد ثم حاول مرة أخرى." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const cleanId = String(body.id || "").trim().toLowerCase();
    const cleanName = String(body.name || "").trim();
    const cleanUsername = String(body.adminUsername || "").trim();
    const cleanManagerName = String(body.managerName || "").trim();
    const cleanManagerPhone = String(body.managerPhone || "").trim();
    const adminPassword = String(body.adminPassword || "");
    const expiryDate = String(body.expiryDate || "");

    if (!cleanId || !cleanName || !cleanUsername || !adminPassword) {
      return NextResponse.json(
        { success: false, error: "بيانات المخيم أو حساب المدير ناقصة." },
        { status: 400 }
      );
    }
    if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(cleanId)) {
      return NextResponse.json(
        { success: false, error: "معرّف المخيم يقبل الأحرف الإنجليزية الصغيرة والأرقام والشرطة فقط." },
        { status: 400 }
      );
    }
    if (!/^[a-zA-Z0-9._-]{3,64}$/.test(cleanUsername)) {
      return NextResponse.json(
        { success: false, error: "اسم المستخدم يجب أن يكون من 3 إلى 64 حرفًا إنجليزيًا أو رقمًا." },
        { status: 400 }
      );
    }
    if (!isPasswordAllowed(adminPassword)) {
      return NextResponse.json(
        { success: false, error: PASSWORD_REQUIREMENT_MESSAGE },
        { status: 400 }
      );
    }
    if (!expiryDate || Number.isNaN(new Date(expiryDate).getTime())) {
      return NextResponse.json(
        { success: false, error: "فترة الاشتراك غير صالحة." },
        { status: 400 }
      );
    }

    const { data: existingCamp, error: existingCampError } = await supabaseAdmin
      .from("camps")
      .select("id")
      .eq("id", cleanId)
      .maybeSingle();
    if (existingCampError) throw existingCampError;
    if (existingCamp) {
      return NextResponse.json(
        { success: false, error: "معرّف المخيم مستخدم بالفعل. اختر معرّفًا آخر." },
        { status: 409 }
      );
    }

    const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
      .from("users")
      .select("id")
      .ilike("username", cleanUsername)
      .maybeSingle();
    if (existingProfileError) throw existingProfileError;
    if (existingProfile) {
      return NextResponse.json(
        { success: false, error: "اسم المستخدم مستخدم بالفعل. اختر اسمًا آخر." },
        { status: 409 }
      );
    }

    const email = `${cleanUsername.toLowerCase()}@camp.com`;
    let createdAuthUserId = null;

    try {
      const { data: created, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password: adminPassword,
          email_confirm: true,
          user_metadata: { username: cleanUsername },
          app_metadata: { role: "admin", campId: cleanId },
        });
      if (createError || !created?.user) {
        throw createError || new Error("تعذر إنشاء حساب المدير.");
      }
      createdAuthUserId = created.user.id;

      const { error: profileError } = await supabaseAdmin.rpc("create_camp_profile", {
        target_camp_id: cleanId,
        target_name: cleanName,
        target_manager_name: cleanManagerName,
        target_phone: cleanManagerPhone,
        target_expiry: expiryDate,
        target_user_id: createdAuthUserId,
        target_username: cleanUsername,
      });
      if (profileError) throw profileError;
    } catch (creationError) {
      if (createdAuthUserId) {
        await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
      }

      if (/already been registered|email_exists/i.test(creationError?.message || "")) {
        return NextResponse.json(
          { success: false, error: "اسم المستخدم مستخدم مسبقًا في حساب آخر. اختر اسمًا مختلفًا." },
          { status: 409 }
        );
      }
      throw creationError;
    }

    return NextResponse.json({
      success: true,
      username: cleanUsername,
      campId: cleanId,
    });
  } catch (error) {
    console.error("create-camp API error:", error);
    const isTimeout = error?.name === "TimeoutError" || error?.name === "AbortError";
    const isConnectionError = /fetch failed|EACCES|ECONN/i.test(
      `${error?.message || ""} ${error?.details || ""}`
    );
    return NextResponse.json(
      {
        success: false,
        error: isTimeout
          ? "استغرق الاتصال بقاعدة البيانات وقتًا طويلًا. حاول مرة أخرى."
          : isConnectionError
            ? "تعذر الاتصال بقاعدة البيانات الآن. تحقق من الإنترنت ثم حاول مرة أخرى."
          : error?.message || "حدث خطأ أثناء إنشاء المخيم.",
      },
      { status: isTimeout ? 504 : isConnectionError ? 503 : 500 }
    );
  }
}
