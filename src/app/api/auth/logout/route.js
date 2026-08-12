import { NextResponse } from "next/server";
import { clearSessionCookie } from "../../../../lib/session";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "تم تسجيل الخروج بنجاح" });
  return clearSessionCookie(response);
}

export async function GET() {
  const response = NextResponse.json({ success: true, message: "تم تسجيل الخروج بنجاح" });
  return clearSessionCookie(response);
}
