import { NextResponse } from "next/server";
import {
  createBackupSnapshot,
  listCampBackups,
  restoreBackupSnapshot,
  checkAndRunAutoWeeklyBackup,
} from "../../../lib/backupEngine";
import { dbFindOne } from "../../../lib/db";
import { requireCampAdmin, requireSuperAdmin } from "../../../lib/adminAuth";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const campId = searchParams.get("campId");
    const backupId = searchParams.get("backupId");

    const auth = (await requireSuperAdmin(request)) || (await requireCampAdmin(request, campId));
    if (!auth) return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 403 });

    // تنزيل نسخة محددة
    if (backupId) {
      const backup = await dbFindOne("backups", { id: backupId });
      if (!backup) {
        return NextResponse.json({ success: false, error: "النسخة الاحتياطية غير موجودة" }, { status: 404 });
      }
      return NextResponse.json({ success: true, backup: backup.snapshot || backup });
    }

    // سرد النسخ السابقة
    const backups = await listCampBackups(campId);
    return NextResponse.json({ success: true, backups }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
      }
    });
  } catch (error) {
    console.error("Backup API GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || "create";
    const campId = String(body.campId || "").trim();

    const auth = (await requireSuperAdmin(request)) || (await requireCampAdmin(request, campId));
    if (!auth) return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 403 });

    // 1. فحص النسخ الأسبوعي التلقائي
    if (action === "auto_check") {
      const result = await checkAndRunAutoWeeklyBackup(campId);
      return NextResponse.json({ success: true, triggered: Boolean(result), backup: result });
    }

    // 2. استعادة نسخة احتياطية
    if (action === "restore") {
      const snapshot = body.snapshot || body.backup;
      if (!snapshot) {
        return NextResponse.json({ success: false, error: "بيانات النسخة الاحتياطية مفقودة" }, { status: 400 });
      }
      const result = await restoreBackupSnapshot(snapshot, auth.role === "superadmin" ? null : campId);
      return NextResponse.json(result);
    }

    // 3. إنشاء نسخة احتياطية فورية (يدوية)
    const backupRecord = await createBackupSnapshot(
      auth.role === "superadmin" && !campId ? null : campId,
      "manual"
    );

    return NextResponse.json({
      success: true,
      message: "تم إنشاء النسخة الاحتياطية بنجاح!",
      backup: backupRecord,
    });
  } catch (error) {
    console.error("Backup API POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
