import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const publicRoutes = [
  "/",
  "/login",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/features",
  "/faq",
  "/robots.txt",
  "/ads.txt",
  "/sitemap.xml",
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const isPublic = publicRoutes.some(
    (route) => pathname === route || (route !== "/" && pathname.startsWith(`${route}/`))
  );

  if (isPublic) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET is not configured");
    }

    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);

    if (pathname.startsWith("/super-admin") && payload.role !== "superadmin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|ads.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)"],
};
