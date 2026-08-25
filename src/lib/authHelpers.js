"use client";

import { supabase, isSupabaseConfigured } from "./supabase";

export async function loginUser(username, password) {
  const cleanUser = String(username || "").trim();
  const cleanPass = String(password || "");

  if (!cleanUser || !cleanPass) {
    return { success: false, error: "يرجى إدخال اسم المستخدم وكلمة المرور." };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      return { success: false, error: data.error || "تعذر تسجيل الدخول" };
    }
    if (isSupabaseConfigured && data.access_token && data.refresh_token) {
      const { error } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (error) return { success: false, error: "تعذر إنشاء جلسة آمنة" };
    }
    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      return { success: false, error: "استغرق الاتصال وقتًا طويلًا. تحقق من الإنترنت وحاول مجددًا." };
    }
    return { success: false, error: "تعذر الاتصال بالخادم. حاول مرة أخرى." };
  } finally {
    clearTimeout(timeout);
  }
}

export async function loginAndRedirect(username, password) {
  const result = await loginUser(username, password);
  if (!result.success) return result;
  return {
    ...result,
    redirectPath:
      result.redirectPath || (result.user?.role === "superadmin" ? "/super-admin" : "/"),
  };
}
