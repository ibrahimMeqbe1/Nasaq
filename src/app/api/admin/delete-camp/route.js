import { NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "../../../../lib/supabaseAdmin";

async function requireSuperAdmin(request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token || !supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  return profile?.role === "superadmin" ? data.user : null;
}

async function deleteRows(table, campId) {
  const { data, error } = await supabaseAdmin
    .from(table)
    .delete()
    .eq("camp_id", campId)
    .select("id");
  if (error) throw new Error(`تعذر حذف بيانات ${table}: ${error.message}`);
  return data?.length || 0;
}

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

    // Revoke access first. A retry remains safe if a later database deletion fails.
    for (const manager of managers || []) {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(manager.id)) {
        continue;
      }
      const { error } = await supabaseAdmin.auth.admin.deleteUser(manager.id);
      if (error && !/not found/i.test(error.message || "")) {
        throw new Error(`تعذر حذف حساب مدير المخيم: ${error.message}`);
      }
    }

    const deleted = {};
    deleted.families = await deleteRows("families", campId);
    deleted.nominations = await deleteRows("nominations", campId);
    deleted.renewalRequests = await deleteRows("renewal_requests", campId);
    deleted.users = await deleteRows("users", campId);

    const { data: deletedCamp, error: campDeleteError } = await supabaseAdmin
      .from("camps")
      .delete()
      .eq("id", campId)
      .select("id")
      .maybeSingle();
    if (campDeleteError) throw campDeleteError;
    if (!deletedCamp) throw new Error("لم يتم حذف سجل المخيم");

    return NextResponse.json({
      success: true,
      camp: { id: camp.id, name: camp.name },
      deleted,
    });
  } catch (error) {
    console.error("delete-camp API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "فشل حذف المخيم" },
      { status: 500 }
    );
  }
}
