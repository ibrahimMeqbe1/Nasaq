import { NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "../../../../lib/supabaseAdmin";
import { requireSuperAdmin } from "../../../../lib/adminAuth";

export async function POST(request) {
  try {
    if (!isAdminConfigured || !supabaseAdmin) {
      return NextResponse.json({ success: false, error: "الخادم غير مهيأ" }, { status: 503 });
    }
    if (!(await requireSuperAdmin(request))) {
      return NextResponse.json({ success: false, error: "غير مصرح بتنفيذ الحذف" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const campId = String(body.campId || "").trim();
    const confirmation = String(body.confirmation || "").trim();
    if (!campId || confirmation !== campId || campId === "system") {
      return NextResponse.json({ success: false, error: "تأكيد معرّف المخيم غير صحيح" }, { status: 400 });
    }

    const { data: camp, error: campLookupError } = await supabaseAdmin
      .from("camps")
      .select("id, name")
      .eq("id", campId)
      .maybeSingle();
    if (campLookupError) throw campLookupError;
    if (!camp) {
      return NextResponse.json({ success: false, error: "المخيم غير موجود" }, { status: 404 });
    }

    const { data: managers, error: managerError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("camp_id", campId);
    if (managerError) throw managerError;

    // حذف بيانات قاعدة البيانات يتم داخل معاملة واحدة. بمجرد حذف ملف المستخدم
    // تتوقف سياسات RLS عن منحه أي وصول حتى لو بقي رمز Auth قديم صالحًا مؤقتًا.
    const { data: deleted, error: deleteDataError } = await supabaseAdmin.rpc("delete_camp_data", {
      target_camp_id: campId,
    });
    if (deleteDataError) throw deleteDataError;

    let authAccountsDeleted = 0;
    const warnings = [];
    for (const manager of managers || []) {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(manager.id)) {
        continue;
      }
      const { error } = await supabaseAdmin.auth.admin.deleteUser(manager.id);
      if (error && !/not found/i.test(error.message || "")) {
        warnings.push("حُذفت بيانات المخيم، لكن تعذر تنظيف أحد حسابات المصادقة تلقائيًا.");
      } else {
        authAccountsDeleted += 1;
      }
    }

    return NextResponse.json({
      success: true,
      camp: { id: camp.id, name: camp.name },
      deleted: { ...deleted, authAccounts: authAccountsDeleted },
      warnings,
    });
  } catch (error) {
    console.error("delete-camp API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "فشل حذف المخيم" },
      { status: 500 }
    );
  }
}
