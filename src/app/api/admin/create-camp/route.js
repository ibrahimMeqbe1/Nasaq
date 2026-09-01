import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbFindOne, dbInsertOne } from "../../../../lib/db";
import { requireSuperAdmin } from "../../../../lib/adminAuth";
import { PASSWORD_REQUIREMENT_MESSAGE, isPasswordAllowed } from "../../../../lib/passwordPolicy";

export async function POST(request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) {
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

    const existingCamp = await dbFindOne("camps", { id: cleanId });
    if (existingCamp) {
      return NextResponse.json(
        { success: false, error: "معرّف المخيم مستخدم بالفعل. اختر معرّفًا آخر." },
        { status: 409 }
      );
    }

    const existingUser = await dbFindOne("users", { username: cleanUsername });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "اسم المستخدم مستخدم بالفعل. اختر اسمًا آخر." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // 1. إنشاء سجل المخيم
    const campDoc = {
      id: cleanId,
      name: cleanName,
      managerName: cleanManagerName,
      managerPhone: cleanManagerPhone,
      address: String(body.address || "").trim(),
      isActive: true,
      subscriptionExpiry: expiryDate,
      logoUrl: String(body.logoUrl || "").trim(),
      createdAt: new Date().toISOString(),
    };
    await dbInsertOne("camps", campDoc);

    // 2. إنشاء حساب مدير المخيم
    const userDoc = {
      id: `user_${cleanId}_${Date.now()}`,
      username: cleanUsername,
      passwordHash,
      role: "admin",
      campId: cleanId,
      name: cleanManagerName || cleanName,
      createdAt: new Date().toISOString(),
    };
    await dbInsertOne("users", userDoc);

    return NextResponse.json({
      success: true,
      username: cleanUsername,
      campId: cleanId,
      message: "تم إنشاء المخيم وحساب المدير بنجاح!",
    });
  } catch (error) {
    console.error("create-camp API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "حدث خطأ أثناء إنشاء المخيم." },
      { status: 500 }
    );
  }
}
