import { NextResponse } from "next/server";
import { dbFind, dbUpdateOne } from "../../../lib/db";
import { requireSuperAdmin } from "../../../lib/adminAuth";

export async function GET() {
  try {
    const list = await dbFind("announcements", {}, { createdAt: -1 }, 1);
    const announcement = list[0] || {
      text: "تنويه هام من إدارة النظام: يرجى التأكد من استكمال كافة بيانات العائلات وتصنيفات الترشيحات بدقة.",
      isActive: true,
      type: "urgent",
    };
    return NextResponse.json({ success: true, announcement });
  } catch (error) {
    console.error("Announcements GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 403 });
    }

    const body = await request.json();
    const announcement = {
      id: "ann_default",
      text: String(body.text || "").trim(),
      isActive: Boolean(body.isActive),
      type: String(body.type || "urgent"),
      updatedAt: new Date().toISOString(),
    };

    await dbUpdateOne("announcements", { id: "ann_default" }, announcement, { upsert: true });

    return NextResponse.json({ success: true, announcement });
  } catch (error) {
    console.error("Announcements POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
