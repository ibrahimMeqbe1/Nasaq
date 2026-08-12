import bcrypt from "bcryptjs";
import { supabase } from "./supabase";
import { supabaseAdmin, isAdminConfigured } from "./supabaseAdmin";

const SALT_ROUNDS = 10;

/**
 * 1. دالة حفظ/تعديل حساب مدير المخيم مع التشفير بـ bcryptjs
 */
export async function saveCampWithManager(formData) {
  const { campId, campName, managerName, phone, address, username, password } = formData;

  const cleanCampId = (campId || "").trim();
  const cleanCampName = (campName || "").trim();

  if (!cleanCampId || !cleanCampName) {
    return { success: false, error: "معرّف المخيم واسم المخيم مطلوبان" };
  }

  const dbClient = isAdminConfigured && supabaseAdmin ? supabaseAdmin : supabase;

  if (dbClient) {
    // أ) حفظ/تحديث بيانات المخيم
    const { data: campData, error: campError } = await dbClient
      .from("camps")
      .upsert(
        {
          id: cleanCampId,
          name: cleanCampName,
          manager_name: managerName || "",
          phone: phone || "",
          location: address || "",
        },
        { onConflict: "id" }
      )
      .select()
      .maybeSingle();

    if (campError) return { success: false, error: campError.message };

    // ب) تجهيز بيانات المستخدم
    const userPayload = {
      id: `user-${cleanCampId}`,
      username: username || cleanCampId,
      role: "admin",
      camp_id: cleanCampId,
      name: cleanCampName,
    };

    // ج) تحقق من المستخدم الحالي للحفاظ على كلمة المرور السابقة إن لم يُدخل كلمة جديدة
    const { data: existingUser } = await dbClient
      .from("users")
      .select("id, password")
      .eq("camp_id", cleanCampId)
      .maybeSingle();

    if (existingUser?.id) {
      userPayload.id = existingUser.id;
    }

    if (password && password.trim() !== "") {
      userPayload.password = await bcrypt.hash(password.trim(), SALT_ROUNDS);
    } else if (existingUser?.password) {
      userPayload.password = existingUser.password;
    }

    if (userPayload.password) {
      const { data: userData, error: userError } = await dbClient
        .from("users")
        .upsert(userPayload, { onConflict: "id" })
        .select()
        .maybeSingle();

      if (userError) return { success: false, error: userError.message };
      return { success: true, camp: campData, user: userData };
    }

    return { success: true, camp: campData };
  }

  return { success: true };
}

/**
 * 2. دالة تسجيل الدخول والتحقق عبر bcryptjs
 */
export async function loginUser(username, password) {
  const cleanUser = (username || "").trim();
  const cleanPass = (password || "").trim();

  if (!cleanUser || !cleanPass) {
    return { success: false, error: "يرجى إدخال اسم المستخدم وكلمة المرور." };
  }

  // 1. محاولة تسجيل الدخول عبر مسار API الخاص بالسيرفر (توليد كوكيز httpOnly)
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: cleanUser, password: cleanPass }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) return data;
    } else {
      const data = await res.json().catch(() => null);
      if (data?.error) return { success: false, error: data.error };
    }
  } catch (apiErr) {
    console.warn("API login route fallback to client check:", apiErr);
  }

  // 2. المحاولة المباشرة إن تعذر الوصول للـ API
  const dbClient = isAdminConfigured && supabaseAdmin ? supabaseAdmin : supabase;
  if (!dbClient) return { success: false, error: "قاعدة البيانات غير متصلة" };

  let user = null;
  const { data: userData } = await dbClient
    .from("users")
    .select("*")
    .ilike("username", cleanUser)
    .maybeSingle();

  user = userData;

  if (!user && dbClient.rpc) {
    try {
      const { data: rpcUser } = await dbClient.rpc("get_user_for_login", { p_username: cleanUser });
      if (rpcUser?.length) user = rpcUser[0];
    } catch {}
  }

  if (!user) {
    return { success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" };
  }

  let isMatch = false;
  if (user.password?.startsWith("$2a$") || user.password?.startsWith("$2b$") || user.password?.startsWith("$2y$")) {
    isMatch = await bcrypt.compare(cleanPass, user.password);
  } else {
    isMatch = user.password === cleanPass;
  }

  if (!isMatch) {
    return { success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" };
  }

  const { password: _, ...safeUser } = user;
  return { success: true, user: safeUser };
}

/**
 * 3. دالة Multi-tenant login — التحقق من camp_id وتحديد مسار التوجيه
 */
export async function loginAndRedirect(username, password) {
  const result = await loginUser(username, password);

  if (!result.success) return result;

  const { user } = result;
  const redirectPath = user?.role === "superadmin" ? "/super-admin" : "/";

  return {
    success: true,
    user,
    redirectPath: result.redirectPath || redirectPath,
  };
}


