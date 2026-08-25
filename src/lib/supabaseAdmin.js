import { createClient } from "@supabase/supabase-js";

// ⚠️ هذا الملف يُستخدم فقط داخل مسارات API على السيرفر (src/app/api/**/route.js).
// لا تستورد هذا الملف أبداً داخل أي مكون أو خدمة تعمل على المتصفح (client component/service)،
// لأن SUPABASE_SERVICE_ROLE_KEY يتجاوز كل سياسات RLS بالكامل.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
// المفتاح السري الجديد بتسمية Supabase (sb_secret_...) — يدعم الاسم القديم كذلك للتوافق
const serviceRoleKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

const fetchWithTimeout = async (url, options = {}) => {
  const timeoutSignal = AbortSignal.timeout(12000);
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeoutSignal])
    : timeoutSignal;
  return fetch(url, { ...options, signal });
};

export const isAdminConfigured = Boolean(supabaseUrl && serviceRoleKey);

export const supabaseAdmin = isAdminConfigured
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: { fetch: fetchWithTimeout },
    })
  : null;
