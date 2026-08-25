import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin, isAdminConfigured } from "../../../../lib/supabaseAdmin";
import { createSessionToken, setSessionCookie } from "../../../../lib/session";

const invalidCredentials = () =>
  NextResponse.json(
    { success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" },
    { status: 401 }
  );

const fetchWithTimeout = async (url, options = {}) => {
  const timeoutSignal = AbortSignal.timeout(12000);
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeoutSignal])
    : timeoutSignal;
  return fetch(url, { ...options, signal });
};

async function resolveProfileByLogin(username) {
  if (!isAdminConfigured || !supabaseAdmin) return null;

  const { data: usernameProfile, error: usernameError } = await supabaseAdmin
    .from("users")
    .select("id, username, role, camp_id, name")
    .ilike("username", username)
    .maybeSingle();
  if (usernameError) throw usernameError;
  if (usernameProfile) return usernameProfile;

  let { data: camp, error: campIdError } = await supabaseAdmin
    .from("camps")
    .select("id")
    .eq("id", username)
    .maybeSingle();
  if (campIdError) throw campIdError;

  if (!camp) {
    const { data: campByName, error: campNameError } = await supabaseAdmin
      .from("camps")
      .select("id")
      .ilike("name", username)
      .limit(1)
      .maybeSingle();
    if (campNameError) throw campNameError;
    camp = campByName;
  }

  if (!camp?.id) return null;

  const { data: campProfile, error: campProfileError } = await supabaseAdmin
    .from("users")
    .select("id, username, role, camp_id, name")
    .eq("camp_id", camp.id)
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();
  if (campProfileError) throw campProfileError;
  return campProfile;
}

export async function POST(request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    if (!supabaseUrl || !publishableKey) {
      return NextResponse.json(
        { success: false, error: "الخادم غير مهيأ للمصادقة" },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!username || password.length < 6 || username.length > 254 || password.length > 256) {
      return invalidCredentials();
    }

    const authClient = createClient(supabaseUrl, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { fetch: fetchWithTimeout },
    });

    // Try the normal username/email path first. This avoids multiple privileged
    // database round-trips for the common case and keeps login responsive.
    let resolvedProfile = null;
    let email = username.includes("@") ? username : `${username}@camp.com`;
    const profilePromise = resolveProfileByLogin(username);
    const [authResult, profileResult] = await Promise.all([
      authClient.auth.signInWithPassword({ email, password }),
      profilePromise,
    ]);
    let { data: authData, error: authError } = authResult;
    resolvedProfile = profileResult;

    // Camp ID/name login needs server-side resolution, so use it only as a
    // fallback when direct username authentication did not succeed.
    if ((authError || !authData?.session) && resolvedProfile) {
      const resolvedEmail = `${resolvedProfile.username.toLowerCase()}@camp.com`;
      if (resolvedEmail === email) return invalidCredentials();
      email = resolvedEmail;
      ({ data: authData, error: authError } = await authClient.auth.signInWithPassword({
        email,
        password,
      }));
    }

    if (authError || !authData?.user || !authData?.session) return invalidCredentials();

    if (!resolvedProfile) {
      const userClient = createClient(supabaseUrl, publishableKey, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: {
          fetch: fetchWithTimeout,
          headers: { Authorization: `Bearer ${authData.session.access_token}` },
        },
      });
      const { data: ownProfile } = await userClient
        .from("users")
        .select("id, username, role, camp_id, name")
        .eq("id", authData.user.id)
        .maybeSingle();
      resolvedProfile = ownProfile;
    }

    // Authorization data must come from the protected profile table, never user_metadata.
    const profile = resolvedProfile?.id === authData.user.id ? resolvedProfile : null;

    if (!profile || !["admin", "superadmin"].includes(profile.role)) {
      await authClient.auth.signOut({ scope: "local" }).catch(() => {});
      return invalidCredentials();
    }

    const token = await createSessionToken({
      userId: profile.id,
      username: profile.username,
      role: profile.role,
      campId: profile.camp_id,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        username: profile.username,
        role: profile.role,
        campId: profile.camp_id,
        email,
        name: profile.name || profile.username,
        uid: profile.id,
      },
      redirectPath: profile.role === "superadmin" ? "/super-admin" : "/",
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
    });

    setSessionCookie(response, token);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Auth API login error:", error);
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      return NextResponse.json(
        { success: false, error: "تعذر الوصول إلى خدمة المصادقة خلال الوقت المحدد" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { success: false, error: "تعذر تسجيل الدخول الآن" },
      { status: 500 }
    );
  }
}
