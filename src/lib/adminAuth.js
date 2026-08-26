import { verifySessionToken } from "./session";
import { dbFindOne } from "./db";

export async function requireSuperAdmin(request) {
  const sessionCookie = request.cookies.get("session")?.value;
  if (sessionCookie) {
    const session = await verifySessionToken(sessionCookie);
    if (session?.role === "superadmin" && session?.userId) {
      return { id: session.userId, role: session.role, username: session.username };
    }
  }

  // Check Bearer token if provided
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (token) {
    const payload = await verifySessionToken(token);
    if (payload?.role === "superadmin") {
      return { id: payload.userId, role: payload.role, username: payload.username };
    }
  }

  return null;
}

export async function requireCampAdmin(request, requiredCampId = null) {
  const sessionCookie = request.cookies.get("session")?.value;
  if (!sessionCookie) return null;

  const session = await verifySessionToken(sessionCookie);
  if (!session || !session.userId) return null;

  if (session.role === "superadmin") {
    return { id: session.userId, role: "superadmin", campId: session.campId || "system" };
  }

  if (session.role === "admin") {
    if (requiredCampId && session.campId !== requiredCampId) {
      return null;
    }
    return { id: session.userId, role: "admin", campId: session.campId };
  }

  return null;
}
