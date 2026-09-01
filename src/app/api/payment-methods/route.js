import { NextResponse } from "next/server";
import { dbFind, dbUpdateOne } from "../../../lib/db";
import { requireSuperAdmin } from "../../../lib/adminAuth";

export async function GET() {
  try {
    const list = await dbFind("paymentMethods", {}, null, 1);
    const methods = list[0] || {
      bankOfPalestine: "حساب بنك فلسطين: 1234567-001-9010",
      jawwalPay: "محفظة جوال باي: 0599099693",
      palPay: "محفظة بال باي: 987654",
    };
    return NextResponse.json({ success: true, paymentMethods: methods });
  } catch (error) {
    console.error("Payment methods GET error:", error);
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
    const payload = {
      id: "default_payments",
      bankOfPalestine: String(body.bankOfPalestine || "").trim(),
      jawwalPay: String(body.jawwalPay || "").trim(),
      palPay: String(body.palPay || "").trim(),
      updatedAt: new Date().toISOString(),
    };

    await dbUpdateOne("paymentMethods", { id: "default_payments" }, payload, { upsert: true });

    return NextResponse.json({ success: true, paymentMethods: payload });
  } catch (error) {
    console.error("Payment methods POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
