import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET || "kareem_camp_super_secret_jwt_key_2026_x89f7a2b91c"
);

// المسارات التي تتطلب حماية ومصادقة على مستوى السيرفر
const protectedRoutes = ["/super-admin", "/admin"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get("session")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, secretKey);

    // حماية صفحة superadmin ومنع الوصول إليها لغير الحسابات ذات الدور superadmin
    if (pathname.startsWith("/super-admin") && payload.role !== "superadmin") {
      const homeUrl = new URL("/", request.url);
      return NextResponse.redirect(homeUrl);
    }

    return NextResponse.next();
  } catch (err) {
    // في حال التوكن منتهي الصلاحية أو تالف، يتم تصفير الكوكي فوراً وإعادة التوجيه لصفحة الدخول
    const loginUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  }
}

export const config = {
  matcher: ["/super-admin/:path*", "/admin/:path*"],
};
