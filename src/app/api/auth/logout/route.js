import { NextResponse } from "next/server";
import { clearSessionCookie } from "../../../../lib/session";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "تم تسجيل الخروج بنجاح" });
  clearSessionCookie(response);
  response.cookies.delete("session");
  return response;
}

export async function GET(request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  clearSessionCookie(response);
  response.cookies.delete("session");
  return response;
}
