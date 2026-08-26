import { NextResponse } from "next/server";
import { dbFind, dbInsertOne, dbUpdateOne } from "../../../lib/db";
import { requireCampAdmin, requireSuperAdmin } from "../../../lib/adminAuth";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const campId = searchParams.get("campId");

    const superAdmin = await requireSuperAdmin(request);
    if (superAdmin) {
      const requests = await dbFind("paymentRequests", {}, { createdAt: -1 });
      return NextResponse.json({ success: true, requests });
    }

    if (campId) {
      const campAdmin = await requireCampAdmin(request, campId);
      if (!campAdmin) return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 403 });

      const requests = await dbFind("paymentRequests", { campId }, { createdAt: -1 });
      return NextResponse.json({ success: true, requests });
    }

    return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 403 });
  } catch (error) {
    console.error("Payment requests GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const campId = String(body.campId || "").trim();

    const auth = (await requireSuperAdmin(request)) || (await requireCampAdmin(request, campId));
    if (!auth) return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 403 });

    const newRequest = {
      id: `payreq_${Date.now()}`,
      campId,
      campName: String(body.campName || "").trim(),
      managerName: String(body.managerName || "").trim(),
      managerPhone: String(body.managerPhone || "").trim(),
      requestedMonths: Number(body.requestedMonths || 12),
      receiptUrl: String(body.receiptUrl || "").trim(),
      notes: String(body.notes || "").trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    await dbInsertOne("paymentRequests", newRequest);
    return NextResponse.json({ success: true, request: newRequest });
  } catch (error) {
    console.error("Payment requests POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 403 });

    const body = await request.json();
    const id = String(body.id || "").trim();
    const status = String(body.status || "approved").trim();

    await dbUpdateOne("paymentRequests", { id }, { status });
    return NextResponse.json({ success: true, message: "تم تحديث حالة طلب التجديد بنجاح" });
  } catch (error) {
    console.error("Payment requests PUT error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
