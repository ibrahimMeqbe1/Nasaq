import { NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "../../../../lib/supabaseAdmin";
import { requireSuperAdmin } from "../../../../lib/adminAuth";

export async function POST(request) {
  try {
    if (!isAdminConfigured || !supabaseAdmin) {
      return NextResponse.json({ success: false, error: "الخادم غير مهيأ" }, { status: 503 });
    }
    if (!(await requireSuperAdmin(request))) {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 403 });
    }

    const body = await request.json();
    const campId = String(body.campId || "").trim();
    const adminUsername = String(body.adminUsername || "").trim();
    const adminPassword = String(body.adminPassword || "");
    if (!campId || !adminUsername) {
      return NextResponse.json({ success: false, error: "معرف المخيم واسم المستخدم مطلوبان" }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9._-]{3,64}$/.test(adminUsername)) {
      return NextResponse.json({ success: false, error: "اسم المستخدم يجب أن يكون من 3 إلى 64 حرفًا إنجليزيًا أو رقمًا" }, { status: 400 });
    }
    if (adminPassword && (adminPassword.length < 10 || !/[A-Za-z]/.test(adminPassword) || !/\d/.test(adminPassword))) {
      return NextResponse.json({ success: false, error: "كلمة المرور الجديدة يجب ألا تقل عن 10 أحرف وتحتوي حرفًا ورقمًا" }, { status: 400 });
    }

    const campPayload = {};
    if (body.name !== undefined) campPayload.name = String(body.name).trim();
    if (body.managerName !== undefined) campPayload.manager_name = String(body.managerName).trim();
    if (body.managerPhone !== undefined) campPayload.phone = String(body.managerPhone).trim();
    if (body.address !== undefined) campPayload.location = String(body.address).trim();
    if (Object.keys(campPayload).length) {
      const { error } = await supabaseAdmin.from("camps").update(campPayload).eq("id", campId);
      if (error) throw error;
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users").select("id").eq("camp_id", campId).eq("role", "admin").limit(1).maybeSingle();
    if (profileError || !profile) throw new Error("لا يوجد حساب مدير مرتبط بهذا المخيم");

    const email = adminUsername.includes("@") ? adminUsername.toLowerCase() : `${adminUsername.toLowerCase()}@camp.com`;
    const authPayload = { email, email_confirm: true, app_metadata: { role: "admin", campId } };
    if (adminPassword) authPayload.password = adminPassword;
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(profile.id, authPayload);
    if (authError) throw authError;

    const userPayload = { username: adminUsername, name: body.name || campId };
    const { error: userError } = await supabaseAdmin.from("users").update(userPayload).eq("id", profile.id);
    if (userError) throw userError;

    return NextResponse.json({ success: true, username: adminUsername });
  } catch (error) {
    console.error("update-camp API error:", error);
    return NextResponse.json({ success: false, error: error.message || "فشل تحديث حساب المخيم" }, { status: 500 });
  }
}
