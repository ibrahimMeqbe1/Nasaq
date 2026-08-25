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
    const campName = String(body.name || "").trim();
    if (!campName) {
      return NextResponse.json({ success: false, error: "اسم المخيم مطلوب" }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9._-]{3,64}$/.test(adminUsername)) {
      return NextResponse.json({ success: false, error: "اسم المستخدم يجب أن يكون من 3 إلى 64 حرفًا إنجليزيًا أو رقمًا" }, { status: 400 });
    }
    if (adminPassword && (adminPassword.length < 10 || !/[A-Za-z]/.test(adminPassword) || !/\d/.test(adminPassword))) {
      return NextResponse.json({ success: false, error: "كلمة المرور الجديدة يجب ألا تقل عن 10 أحرف وتحتوي حرفًا ورقمًا" }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users").select("id").eq("camp_id", campId).eq("role", "admin").limit(1).maybeSingle();
    if (profileError) throw profileError;
    if (!profile) {
      return NextResponse.json({ success: false, error: "لا يوجد حساب مدير مرتبط بهذا المخيم" }, { status: 404 });
    }

    const campPayload = { name: campName };
    if (body.managerName !== undefined) campPayload.manager_name = String(body.managerName).trim();
    if (body.managerPhone !== undefined) campPayload.phone = String(body.managerPhone).trim();
    if (body.address !== undefined) campPayload.location = String(body.address).trim();
    const { data: updatedCamp, error: campError } = await supabaseAdmin
      .from("camps")
      .update(campPayload)
      .eq("id", campId)
      .select("id")
      .maybeSingle();
    if (campError) throw campError;
    if (!updatedCamp) {
      return NextResponse.json({ success: false, error: "المخيم المطلوب غير موجود" }, { status: 404 });
    }

    const email = adminUsername.includes("@") ? adminUsername.toLowerCase() : `${adminUsername.toLowerCase()}@camp.com`;
    const authPayload = { email, email_confirm: true, app_metadata: { role: "admin", campId } };
    if (adminPassword) authPayload.password = adminPassword;
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(profile.id, authPayload);
    if (authError) throw authError;

    const userPayload = { username: adminUsername, name: campName };
    const { data: updatedUser, error: userError } = await supabaseAdmin
      .from("users")
      .update(userPayload)
      .eq("id", profile.id)
      .select("id")
      .maybeSingle();
    if (userError) throw userError;
    if (!updatedUser) throw new Error("تعذر تحديث حساب مدير المخيم");

    return NextResponse.json({ success: true, username: adminUsername });
  } catch (error) {
    console.error("update-camp API error:", error);
    return NextResponse.json({ success: false, error: error.message || "فشل تحديث حساب المخيم" }, { status: 500 });
  }
}
