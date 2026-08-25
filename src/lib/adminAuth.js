import { verifySessionToken } from "./session";
import { supabaseAdmin } from "./supabaseAdmin";

async function verifyProfile(userId) {
  if (!userId || !supabaseAdmin) return null;
  const { data: profile, error } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();
  if (error || profile?.role !== "superadmin") return null;
  return profile;
}

export async function requireSuperAdmin(request) {
  const sessionCookie = request.cookies.get("session")?.value;
  if (sessionCookie) {
    const session = await verifySessionToken(sessionCookie);
    if (session?.role === "superadmin" && session?.userId) {
      // The HttpOnly cookie is signed by the server and is already the source
      // used by middleware to authorize the super-admin page. Reusing it here
      // prevents admin actions from failing when the browser's Supabase token
      // expires while the application session is still valid.
      return { id: session.userId, role: session.role };
    }
  }

  // Compatibility fallback for clients that still send a Supabase access token.
  const authHeader = request.headers.get("authorization") || "";
  const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!accessToken || !supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data?.user) return null;
  return verifyProfile(data.user.id);
}
