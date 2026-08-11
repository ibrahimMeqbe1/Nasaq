import { encryptData, decryptData } from "../utils/security";

// ─── localStorage helpers ────────────────────────────────────────────────────

export const localStorageGet = (key, fallback = null) => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (decryptData(raw) ?? fallback) : fallback;
  } catch {
    return fallback;
  }
};

export const localStorageSet = (key, data) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, encryptData(data));
};

export const localStorageGetJSON = (key, fallback = null) => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

// ─── Family mappers ──────────────────────────────────────────────────────────

/** تحويل بيانات العائلة من صيغة JS إلى صيغة Supabase (snake_case) */
export const mapFamilyToSupabase = (campId, data, id) => ({
  id,
  camp_id: campId,
  name: (data.name || "").trim(),
  id_number: (data.idNumber || "").trim(),
  phone: (data.phone || "").trim(),
  members_count: parseInt(data.membersCount) || 1,
  location: (data.location || "").trim(),
  status: (data.status || "أعزب").trim(),
  dob: (data.dob || "").trim(),
  wife_name: (data.wifeName || "").trim(),
  wife_id: (data.wifeId || "").trim(),
  wife_dob: (data.wifeDob || "").trim(),
  notes: (data.notes || "").trim(),
  created_at: data.createdAt || new Date().toISOString(),
});

/** تحويل بيانات العائلة من صيغة JS إلى صيغة localStorage (camelCase) */
export const mapFamilyToLocal = (campId, data, id) => ({
  id,
  campId,
  name: (data.name || "").trim(),
  idNumber: (data.idNumber || "").trim(),
  phone: (data.phone || "").trim(),
  membersCount: parseInt(data.membersCount) || 1,
  location: (data.location || "").trim(),
  status: (data.status || "أعزب").trim(),
  dob: (data.dob || "").trim(),
  wifeName: (data.wifeName || "").trim(),
  wifeId: (data.wifeId || "").trim(),
  wifeDob: (data.wifeDob || "").trim(),
  notes: (data.notes || "").trim(),
  createdAt: data.createdAt || new Date().toISOString(),
});

// ─── Camp mapper ─────────────────────────────────────────────────────────────

/** تحويل صف مخيم من Supabase إلى صيغة JS الموحدة */
export const mapCampRow = (row) => ({
  id: row.id,
  name: row.name,
  managerName: row.manager_name || "",
  managerPhone: row.phone || row.manager_phone || "",
  address: row.location || row.address || "",
  isActive: row.is_active ?? true,
  subscriptionExpiry:
    row.subscription_expiry || oneYearFromNow(),
  logoUrl: row.logo_url || "",
  createdAt: row.created_at,
});

// ─── Date helpers ────────────────────────────────────────────────────────────

export const oneYearFromNow = () =>
  new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

/** حساب تاريخ انتهاء الاشتراك بناءً على نوع الفترة */
export const calcTrialExpiry = (trialPeriod) => {
  const TRIAL_PERIODS = {
    "1-hour":    (d) => d.setHours(d.getHours() + 1),
    "1-day":     (d) => d.setDate(d.getDate() + 1),
    "1-week":    (d) => d.setDate(d.getDate() + 7),
    "1-month":   (d) => d.setMonth(d.getMonth() + 1),
    "6-months":  (d) => d.setMonth(d.getMonth() + 6),
    "1-year":    (d) => d.setFullYear(d.getFullYear() + 1),
    "unlimited": (d) => d.setFullYear(d.getFullYear() + 50),
  };
  const date = new Date();
  const apply = TRIAL_PERIODS[trialPeriod] || ((d) => d.setDate(d.getDate() + 30));
  apply(date);
  return date;
};
