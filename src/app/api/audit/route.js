import { NextResponse } from "next/server";
import { dbFind } from "../../../lib/db";
import { requireSuperAdmin } from "../../../lib/adminAuth";

export async function GET(request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const logs = await dbFind("auditLogs", {}, { createdAt: -1 }, limit);
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error("Audit API GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
