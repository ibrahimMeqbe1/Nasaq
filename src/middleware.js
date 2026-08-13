import { NextResponse } from "next/server";
import { jwtVerify } from "jose/jwt/verify";

// المسارات التي تتطلب حماية ومصادقة على مستوى السيرفر
const publicRoutes = ["/login"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET is not configured");
    }
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)"],
};
