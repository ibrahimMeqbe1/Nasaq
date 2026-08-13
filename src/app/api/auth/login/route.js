import { NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "../../../../lib/supabaseAdmin";
import { createSessionToken, setSessionCookie } from "../../../../lib/session";

const invalidCredentials = () =>
  NextResponse.json(
    { success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" },
    { status: 401 }
  );

export async function POST(request) {
  try {
    if (!isAdminConfigured || !supabaseAdmin) {
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

    // Accept the account username, camp ID, or exact camp name. The lookup runs
    // only on the server and never exposes the users table to anonymous clients.
    let resolvedProfile = null;
    const { data: usernameProfile } = await supabaseAdmin
      .from("users")
      .select("id, username, role, camp_id, name")
      .ilike("username", username)
      .maybeSingle();
    resolvedProfile = usernameProfile;

    if (!resolvedProfile) {
      let { data: camp } = await supabaseAdmin
        .from("camps")
        .select("id")
        .eq("id", username)
        .maybeSingle();
      if (!camp) {
        const result = await supabaseAdmin
          .from("camps")
          .select("id")
          .ilike("name", username)
          .limit(1)
          .maybeSingle();
        camp = result.data;
      }
      if (camp?.id) {
        const { data: campProfile } = await supabaseAdmin
          .from("users")
          .select("id, username, role, camp_id, name")
          .eq("camp_id", camp.id)
          .eq("role", "admin")
          .limit(1)
          .maybeSingle();
        resolvedProfile = campProfile;
      }
    }

    if (!resolvedProfile) return invalidCredentials();

    const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(resolvedProfile.id);
    const email = authUserData?.user?.email || `${resolvedProfile.username.toLowerCase()}@camp.com`;
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData?.user || !authData?.session) return invalidCredentials();

    // Authorization data must come from the protected profile table, never user_metadata.
    const profile = resolvedProfile.id === authData.user.id ? resolvedProfile : null;

    if (!profile || !["admin", "superadmin"].includes(profile.role)) {
      await supabaseAdmin.auth.signOut({ scope: "local" }).catch(() => {});
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
    return NextResponse.json(
      { success: false, error: "تعذر تسجيل الدخول الآن" },
      { status: 500 }
    );
  }
}
