import { NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "../../../../lib/supabaseAdmin";
import { hashPassword } from "../../../../lib/auth";

// يتحقق أن صاحب الطلب مسجل دخول فعلاً وأنه superadmin، بالاعتماد على
// access_token المُرسل بترويسة Authorization، قبل تنفيذ أي عملية إنشاء.
async function requireSuperAdmin(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const { data: userRes, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !userRes?.user) return null;

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", userRes.user.id)
    .maybeSingle();

  if (profile?.role !== "superadmin") return null;
  return userRes.user;
}

export async function POST(request) {
  try {
    if (!isAdminConfigured || !supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: "الخادم غير مهيأ (SUPABASE_SERVICE_ROLE_KEY مفقود)." },
        { status: 500 }
      );
    }

    const caller = await requireSuperAdmin(request);
    if (!caller) {
      return NextResponse.json(
        { success: false, error: "غير مصرح لك بتنفيذ هذا الإجراء" },
        { status: 403 }
      );
    }

    const { id, name, managerName, managerPhone, adminUsername, adminPassword, expiryDate } =
      await request.json();

    if (!id || !name || !adminUsername || !adminPassword) {
      return NextResponse.json(
        { success: false, error: "بيانات المخيم أو حساب المدير ناقصة" },
        { status: 400 }
      );
    }

    const { error: campError } = await supabaseAdmin.from("camps").upsert([{
      id, name, manager_name: managerName, phone: managerPhone,
      is_active: true, subscription_expiry: expiryDate,
    }]);
    if (campError) throw campError;

    const email = adminUsername.includes("@") ? adminUsername : `${adminUsername.toLowerCase()}@camp.com`;

    // أنشئ حساب Supabase Auth حقيقي لمدير المخيم الجديد (وليس صفاً نصياً فقط)
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { username: adminUsername, role: "admin", campId: id },
    });
    if (createErr) throw createErr;

    const { error: userError } = await supabaseAdmin.from("users").upsert([{
      id: created.user.id,
      username: adminUsername,
      password: hashPassword(adminPassword),
      role: "admin",
      camp_id: id,
      name,
    }]);
    if (userError) throw userError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("create-camp API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "حدث خطأ أثناء إنشاء المخيم" },
      { status: 500 }
    );
  }
}
