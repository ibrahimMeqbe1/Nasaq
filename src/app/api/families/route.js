import { NextResponse } from "next/server";
import {
  dbFind,
  dbFindOne,
  dbInsertOne,
  dbInsertMany,
  dbUpdateOne,
  dbDeleteOne,
  dbDeleteMany,
} from "../../../lib/db";
import { requireCampAdmin, requireSuperAdmin } from "../../../lib/adminAuth";
import { createRecordId } from "../../../lib/recordIds.mjs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const campId = searchParams.get("campId") || "kareem";

    const families = await dbFind("families", { campId }, { createdAt: 1 });
    return NextResponse.json({ success: true, families });
  } catch (error) {
    console.error("Families API GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const campId = String(body.campId || "").trim();

    if (!campId) {
      return NextResponse.json({ success: false, error: "معرف المخيم مطلوب" }, { status: 400 });
    }

    const auth = (await requireSuperAdmin(request)) || (await requireCampAdmin(request, campId));
    if (!auth) {
      return NextResponse.json({ success: false, error: "غير مصرح لك بإضافة عائلات لهذا المخيم" }, { status: 403 });
    }

    // 1. استيراد دفعة عائلات
    if (body.action === "batch" || Array.isArray(body.families)) {
      const list = body.families || [];
      const records = list.map((f, i) => ({
        id: f.id || createRecordId("family"),
        campId,
        name: String(f.name || "").trim(),
        idNumber: String(f.idNumber || f.id_number || "").trim(),
        phone: String(f.phone || "").trim(),
        membersCount: Number(f.membersCount || f.members_count || 1),
        location: String(f.location || "").trim(),
        status: String(f.status || "").trim(),
        dob: String(f.dob || "").trim(),
        wifeName: String(f.wifeName || f.wife_name || "").trim(),
        wifeId: String(f.wifeId || f.wife_id || "").trim(),
        wifeDob: String(f.wifeDob || f.wife_dob || "").trim(),
        notes: String(f.notes || "").trim(),
        createdAt: f.createdAt || new Date().toISOString(),
      }));

      await dbInsertMany("families", records);
      return NextResponse.json({ success: true, count: records.length });
    }

    // 2. إضافة عائلة واحدة
    const familyData = body.family || body;
    const id = familyData.id || createRecordId("family");

    const record = {
      id,
      campId,
      name: String(familyData.name || "").trim(),
      idNumber: String(familyData.idNumber || "").trim(),
      phone: String(familyData.phone || "").trim(),
      membersCount: Number(familyData.membersCount || 1),
      location: String(familyData.location || "").trim(),
      status: String(familyData.status || "").trim(),
      dob: String(familyData.dob || "").trim(),
      wifeName: String(familyData.wifeName || "").trim(),
      wifeId: String(familyData.wifeId || "").trim(),
      wifeDob: String(familyData.wifeDob || "").trim(),
      notes: String(familyData.notes || "").trim(),
      createdAt: new Date().toISOString(),
    };

    if (!record.name) {
      return NextResponse.json({ success: false, error: "اسم رب الأسرة مطلوب" }, { status: 400 });
    }

    await dbInsertOne("families", record);
    return NextResponse.json({ success: true, id, family: record });
  } catch (error) {
    console.error("Families API POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const id = String(body.id || "").trim();

    if (!id) {
      return NextResponse.json({ success: false, error: "معرف العائلة مطلوب" }, { status: 400 });
    }

    const existing = await dbFindOne("families", { id });
    if (!existing) {
      return NextResponse.json({ success: false, error: "سجل العائلة غير موجود" }, { status: 404 });
    }

    const auth = (await requireSuperAdmin(request)) || (await requireCampAdmin(request, existing.campId));
    if (!auth) {
      return NextResponse.json({ success: false, error: "غير مصرح بالتعديل" }, { status: 403 });
    }

    const updatePayload = {};
    if (body.name !== undefined) updatePayload.name = String(body.name).trim();
    if (body.idNumber !== undefined) updatePayload.idNumber = String(body.idNumber).trim();
    if (body.phone !== undefined) updatePayload.phone = String(body.phone).trim();
    if (body.membersCount !== undefined) updatePayload.membersCount = Number(body.membersCount);
    if (body.location !== undefined) updatePayload.location = String(body.location).trim();
    if (body.status !== undefined) updatePayload.status = String(body.status).trim();
    if (body.dob !== undefined) updatePayload.dob = String(body.dob).trim();
    if (body.wifeName !== undefined) updatePayload.wifeName = String(body.wifeName).trim();
    if (body.wifeId !== undefined) updatePayload.wifeId = String(body.wifeId).trim();
    if (body.wifeDob !== undefined) updatePayload.wifeDob = String(body.wifeDob).trim();
    if (body.notes !== undefined) updatePayload.notes = String(body.notes).trim();

    await dbUpdateOne("families", { id }, updatePayload);
    return NextResponse.json({ success: true, message: "تم تحديث سجل العائلة بنجاح" });
  } catch (error) {
    console.error("Families API PUT error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const campId = searchParams.get("campId");
    const action = searchParams.get("action");

    if (action === "all" && campId) {
      const auth = (await requireSuperAdmin(request)) || (await requireCampAdmin(request, campId));
      if (!auth) return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 403 });

      await dbDeleteMany("families", { campId });
      return NextResponse.json({ success: true, message: "تم حذف كافة عائلات المخيم بنجاح" });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "معرف العائلة مطلوب" }, { status: 400 });
    }

    const existing = await dbFindOne("families", { id });
    if (!existing) {
      return NextResponse.json({ success: false, error: "سجل العائلة غير موجود" }, { status: 404 });
    }

    const auth = (await requireSuperAdmin(request)) || (await requireCampAdmin(request, existing.campId));
    if (!auth) {
      return NextResponse.json({ success: false, error: "غير مصرح بالحذف" }, { status: 403 });
    }

    await dbDeleteOne("families", { id });
    return NextResponse.json({ success: true, message: "تم حذف سجل العائلة بنجاح" });
  } catch (error) {
    console.error("Families API DELETE error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
