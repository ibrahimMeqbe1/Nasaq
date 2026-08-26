import { NextResponse } from "next/server";
import { dbFind, dbFindOne, dbUpdateOne } from "../../../lib/db";
import { requireSuperAdmin, requireCampAdmin } from "../../../lib/adminAuth";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const campId = searchParams.get("campId");

    if (campId) {
      const camp = await dbFindOne("camps", { id: campId });
      if (!camp) {
        return NextResponse.json({ success: false, error: "المخيم غير موجود" }, { status: 404 });
      }
      return NextResponse.json({ success: true, camp });
    }

    // List all camps (requires superadmin or returns basic active camps list)
    const superAdmin = await requireSuperAdmin(request);
    if (superAdmin) {
      const camps = await dbFind("camps", {}, { createdAt: -1 });
      const users = await dbFind("users", { role: "admin" });
      
      const enrichedCamps = camps.map((camp) => {
        const adminUser = users.find((u) => u.campId === camp.id);
        return {
          ...camp,
          adminUsername: adminUser ? adminUser.username : "",
        };
      });

      return NextResponse.json({ success: true, camps: enrichedCamps });
    }

    const camps = await dbFind("camps", { isActive: true }, { name: 1 });
    return NextResponse.json({ success: true, camps });
  } catch (error) {
    console.error("Camps API GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const campId = String(body.id || body.campId || "").trim();

    if (!campId) {
      return NextResponse.json({ success: false, error: "معرف المخيم مطلوب" }, { status: 400 });
    }

    const auth = (await requireSuperAdmin(request)) || (await requireCampAdmin(request, campId));
    if (!auth) {
      return NextResponse.json({ success: false, error: "غير مصرح بالتعديل" }, { status: 403 });
    }

    const updatePayload = {};
    if (body.name !== undefined) updatePayload.name = String(body.name).trim();
    if (body.managerName !== undefined) updatePayload.managerName = String(body.managerName).trim();
    if (body.managerPhone !== undefined) updatePayload.managerPhone = String(body.managerPhone).trim();
    if (body.address !== undefined) updatePayload.address = String(body.address).trim();
    if (body.logoUrl !== undefined) updatePayload.logoUrl = String(body.logoUrl).trim();

    // SuperAdmin only fields
    if (auth.role === "superadmin") {
      if (body.isActive !== undefined) updatePayload.isActive = Boolean(body.isActive);
      if (body.subscriptionExpiry !== undefined) updatePayload.subscriptionExpiry = body.subscriptionExpiry;
    }

    await dbUpdateOne("camps", { id: campId }, updatePayload);

    return NextResponse.json({ success: true, message: "تم تحديث بيانات المخيم بنجاح" });
  } catch (error) {
    console.error("Camps API PUT error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
