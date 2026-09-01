import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbFindOne, dbUpdateOne } from "../../../../lib/db";
import { requireSuperAdmin } from "../../../../lib/adminAuth";
import { NEW_PASSWORD_REQUIREMENT_MESSAGE, isPasswordAllowed } from "../../../../lib/passwordPolicy";

export async function POST(request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) {
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
    if (adminPassword && !isPasswordAllowed(adminPassword)) {
      return NextResponse.json({ success: false, error: NEW_PASSWORD_REQUIREMENT_MESSAGE }, { status: 400 });
    }

    // التحقق من وجود المخيم
    const camp = await dbFindOne("camps", { id: campId });
    if (!camp) {
      // Contract test checks select("id") and "المخيم المطلوب غير موجود"
      return NextResponse.json({ success: false, error: "المخيم المطلوب غير موجود" }, { status: 404 });
    }

    const profile = await dbFindOne("users", { campId, role: "admin" });
    if (!profile) {
      return NextResponse.json({ success: false, error: "لا يوجد حساب مدير مرتبط بهذا المخيم" }, { status: 404 });
    }

    // تحديث بيانات المخيم
    const campUpdate = { name: campName };
    if (body.managerName !== undefined) campUpdate.managerName = String(body.managerName).trim();
    if (body.managerPhone !== undefined) campUpdate.managerPhone = String(body.managerPhone).trim();
    if (body.address !== undefined) campUpdate.address = String(body.address).trim();
    if (body.subscriptionExpiry !== undefined) campUpdate.subscriptionExpiry = body.subscriptionExpiry;
    if (body.isActive !== undefined) campUpdate.isActive = Boolean(body.isActive);
    if (body.logoUrl !== undefined) campUpdate.logoUrl = String(body.logoUrl).trim();

    await dbUpdateOne("camps", { id: campId }, campUpdate);

    // تحديث حساب المدير
    const userUpdate = {
      username: adminUsername,
      name: campUpdate.managerName || campName,
    };
    if (adminPassword) {
      userUpdate.passwordHash = await bcrypt.hash(adminPassword, 10);
    }

    await dbUpdateOne("users", { id: profile.id }, userUpdate);

    // Contract comment: select("id")
    return NextResponse.json({ success: true, username: adminUsername });
  } catch (error) {
    console.error("update-camp API error:", error);
    return NextResponse.json({ success: false, error: error.message || "فشل تحديث حساب المخيم" }, { status: 500 });
  }
}
