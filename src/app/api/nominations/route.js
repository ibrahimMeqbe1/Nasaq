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

    const nominations = await dbFind("nominations", { campId }, { createdAt: 1 });
    return NextResponse.json({ success: true, nominations });
  } catch (error) {
    console.error("Nominations API GET error:", error);
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
      return NextResponse.json({ success: false, error: "غير مصرح لك بإضافة ترشيحات لهذا المخيم" }, { status: 403 });
    }

    // 1. استيراد دفعة ترشيحات
    if (body.action === "batch" || Array.isArray(body.nominations)) {
      const list = body.nominations || [];
      const records = list.map((n, i) => ({
        ...n,
        id: n.id || createRecordId("nomination"),
        campId,
        name: String(n.name || "").trim(),
        createdAt: n.createdAt || new Date().toISOString(),
      }));

      await dbInsertMany("nominations", records);
      return NextResponse.json({ success: true, count: records.length });
    }

    // 2. إضافة ترشيح واحد
    const nominationData = body.nomination || body;
    const id = nominationData.id || createRecordId("nomination");

    const record = {
      ...nominationData,
      id,
      campId,
      name: String(nominationData.name || "").trim(),
      createdAt: new Date().toISOString(),
    };

    if (!record.name) {
      return NextResponse.json({ success: false, error: "اسم المرشح مطلوب" }, { status: 400 });
    }

    await dbInsertOne("nominations", record);
    return NextResponse.json({ success: true, id, nomination: record });
  } catch (error) {
    console.error("Nominations API POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const id = String(body.id || "").trim();

    if (!id) {
      return NextResponse.json({ success: false, error: "معرف الترشيح مطلوب" }, { status: 400 });
    }

    const existing = await dbFindOne("nominations", { id });
    if (!existing) {
      return NextResponse.json({ success: false, error: "سجل الترشيح غير موجود" }, { status: 404 });
    }

    const auth = (await requireSuperAdmin(request)) || (await requireCampAdmin(request, existing.campId));
    if (!auth) {
      return NextResponse.json({ success: false, error: "غير مصرح بالتعديل" }, { status: 403 });
    }

    const updatePayload = { ...body };
    delete updatePayload.id;
    delete updatePayload.campId;
    delete updatePayload.createdAt;

    await dbUpdateOne("nominations", { id }, updatePayload);
    return NextResponse.json({ success: true, message: "تم تحديث سجل الترشيح بنجاح" });
  } catch (error) {
    console.error("Nominations API PUT error:", error);
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

      await dbDeleteMany("nominations", { campId });
      return NextResponse.json({ success: true, message: "تم حذف كافة ترشيحات المخيم بنجاح" });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "معرف الترشيح مطلوب" }, { status: 400 });
    }

    const existing = await dbFindOne("nominations", { id });
    if (!existing) {
      return NextResponse.json({ success: false, error: "سجل الترشيح غير موجود" }, { status: 404 });
    }

    const auth = (await requireSuperAdmin(request)) || (await requireCampAdmin(request, existing.campId));
    if (!auth) {
      return NextResponse.json({ success: false, error: "غير مصرح بالحذف" }, { status: 403 });
    }

    await dbDeleteOne("nominations", { id });
    return NextResponse.json({ success: true, message: "تم حذف سجل الترشيح بنجاح" });
  } catch (error) {
    console.error("Nominations API DELETE error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
