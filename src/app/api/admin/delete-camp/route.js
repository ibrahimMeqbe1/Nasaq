import { NextResponse } from "next/server";
import { dbFindOne, dbDeleteOne, dbDeleteMany, dbCount } from "../../../../lib/db";
import { requireSuperAdmin } from "../../../../lib/adminAuth";

export async function POST(request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "غير مصرح بتنفيذ الحذف" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const campId = String(body.campId || "").trim();
    const confirmation = String(body.confirmation || "").trim();
    if (!campId || confirmation !== campId || campId === "system") {
      return NextResponse.json({ success: false, error: "تأكيد معرّف المخيم غير صحيح" }, { status: 400 });
    }

    const camp = await dbFindOne("camps", { id: campId });
    if (!camp) {
      return NextResponse.json({ success: false, error: "المخيم غير موجود" }, { status: 404 });
    }

    const [familiesCount, nominationsCount, usersCount] = await Promise.all([
      dbCount("families", { campId }),
      dbCount("nominations", { campId }),
      dbCount("users", { campId }),
    ]);

    // حذف متسلسل لكافة بيانات المخيم
    await Promise.all([
      dbDeleteMany("families", { campId }),
      dbDeleteMany("nominations", { campId }),
      dbDeleteMany("users", { campId }),
      dbDeleteMany("paymentRequests", { campId }),
      dbDeleteMany("backups", { campId }),
      dbDeleteOne("camps", { id: campId }),
    ]);

    return NextResponse.json({
      success: true,
      camp: { id: camp.id, name: camp.name },
      deleted: {
        families: familiesCount,
        nominations: nominationsCount,
        users: usersCount,
      },
    });
  } catch (error) {
    console.error("delete-camp API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "فشل حذف المخيم" },
      { status: 500 }
    );
  }
}
