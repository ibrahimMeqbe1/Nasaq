import { NextResponse } from "next/server";

// User provisioning is intentionally disabled here. Accounts must be created by the
// protected super-admin flow so callers cannot choose their own role or camp.
function gone() {
  return NextResponse.json(
    { success: false, error: "استخدم لوحة المشرف العام لإدارة الحسابات" },
    { status: 410, headers: { "Cache-Control": "no-store" } }
  );
}

export const POST = gone;
export const PUT = gone;
