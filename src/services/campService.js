import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { encryptData, decryptData } from "../utils/security";
import {
  localStorageGet,
  localStorageSet,
  localStorageGetJSON,
  assertSupabaseSuccess,
  createRecordId,
  mapCampRow,
  calcTrialExpiry,
  oneYearFromNow,
} from "./helpers";

// ─── Constants ────────────────────────────────────────────────────────────────

const CAMPS_KEY = "kareem_camp_camps";
const USERS_KEY = "kareem_camp_users";
const PAYMENT_METHODS_KEY = "kareem_camp_payment_methods";
const PAYMENT_REQUESTS_KEY = "kareem_camp_payment_requests";
const ANNOUNCEMENT_KEY = "kareem_camp_announcement";
const SUPERADMIN_USERNAME_KEY = "kareem_camp_superadmin_username";

// ─── Default data ─────────────────────────────────────────────────────────────

const DEFAULT_DEMO_USERS = [
  { username: "Ibrahim", role: "superadmin", campId: "system", name: "Eng: Ibrahim Meqbel" },
  { username: "Y2000",   role: "admin",      campId: "kareem",        name: "مخيم كريم" },
  { username: "I2000",   role: "admin",      campId: "kareem",        name: "مخيم كريم" },
  { username: "zad-admin", role: "admin",    campId: "zad-al-khair",  name: "مخيم زاد الخير" },
];

const DEFAULT_DEMO_CAMPS = {
  kareem: {
    id: "kareem",
    name: "مخيم كريم",
    managerName: "ربيع جمال جودة جودة",
    managerPhone: "0599099693",
    address: "حي القصاصيب - جباليا",
    isActive: true,
    subscriptionExpiry: oneYearFromNow(),
    logoUrl: "",
    createdAt: new Date().toISOString(),
  },
  "zad-al-khair": {
    id: "zad-al-khair",
    name: "مخيم زاد الخير",
    managerName: "أبو سليم أحمد",
    managerPhone: "0599112233",
    address: "مخيم جباليا - وسط البلد",
    isActive: true,
    subscriptionExpiry: oneYearFromNow(),
    logoUrl: "",
    createdAt: new Date().toISOString(),
  },
};

const DEFAULT_PAYMENT_METHODS = {
  bankOfPalestine: "حساب بنك فلسطين: 1234567-001-9010",
  jawwalPay: "محفظة جوال باي: 0599099693",
  palPay: "محفظة بال باي: 987654",
};

const DEFAULT_ANNOUNCEMENT = {
  text: "تنويه هام من إدارة النظام: يرجى التأكد من استكمال كافة بيانات العائلات وتصنيفات الترشيحات بدقة.",
  isActive: true,
  type: "urgent",
};

// ─── Local storage helpers ────────────────────────────────────────────────────

const getCampsFromLocal = () => localStorageGet(CAMPS_KEY, {});
const saveCampsToLocal = (camps) => localStorageSet(CAMPS_KEY, camps);

const getUsersFromLocal = () => localStorageGet(USERS_KEY, []);
const saveUsersToLocal = (users) => localStorageSet(USERS_KEY, users);

const initCampLocalStorage = () => {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(CAMPS_KEY)) saveCampsToLocal(DEFAULT_DEMO_CAMPS);
  if (!localStorage.getItem(USERS_KEY)) saveUsersToLocal(DEFAULT_DEMO_USERS);
};

// ─── Super Admin username ─────────────────────────────────────────────────────

export const getSuperAdminUsername = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(SUPERADMIN_USERNAME_KEY) || "Ibrahim";
  }
  return "Ibrahim";
};

export const updateSuperAdminUsername = async (newUsername) => {
  const clean = (newUsername || "").trim();
  if (!clean) throw new Error("يرجى إدخال اسم مستخدم صالح للمشرف العام");

  if (isSupabaseConfigured) {
    const { error } = await supabase.from("users").update({ username: clean }).eq("role", "superadmin");
    assertSupabaseSuccess(error, "تحديث اسم المشرف العام");
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(SUPERADMIN_USERNAME_KEY, clean);
    const saved = sessionStorage.getItem("kareem_camp_logged_in");
    if (saved) {
      try {
        const currentUser = JSON.parse(saved);
        if (currentUser.role === "superadmin") {
          currentUser.username = clean;
          sessionStorage.setItem("kareem_camp_logged_in", JSON.stringify(currentUser));
        }
      } catch {}
    }
  }

  return clean;
};

// ─── Authentication ───────────────────────────────────────────────────────────

export const authenticateUser = async (username, password) => {
  const trimmedUser = (username || "").trim();
  const trimmedPass = (password || "").trim();

  if (!trimmedUser || !trimmedPass) {
    return { success: false, error: "يرجى إدخال اسم المستخدم وكلمة المرور." };
  }

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: trimmedUser, password: trimmedPass }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "تعذر تسجيل الدخول." };
    }
    if (isSupabaseConfigured && data.access_token && data.refresh_token) {
      const { error } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (error) return { success: false, error: "تعذر إنشاء جلسة قاعدة البيانات." };
    }
    return data;
  } catch (apiErr) {
    console.error("Authentication API unavailable:", apiErr);
    return { success: false, error: "تعذر الوصول إلى خادم المصادقة. حاول مرة أخرى." };
  }
};

// ─── Camp profile ─────────────────────────────────────────────────────────────

export const getCampProfile = async (campId) => {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("camps")
      .select("*")
      .eq("id", campId)
      .maybeSingle();
    assertSupabaseSuccess(error, "تحميل بيانات المخيم");
    if (!data) throw new Error("لم يتم العثور على المخيم المرتبط بهذا الحساب.");
    return mapCampRow(data);
  }

  try {
    const res = await fetch(`/api/camps?campId=${encodeURIComponent(campId)}`, {
      credentials: "same-origin",
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success && data.camp) {
      return data.camp;
    }
  } catch (e) {
    console.warn("getCampProfile API notice:", e);
  }

  initCampLocalStorage();
  const camps = getCampsFromLocal();
  return camps[campId] || {
    id: campId,
    name: campId === "kareem" ? "مخيم كريم" : "مخيم " + campId,
    managerName: "ربيع جمال جودة جودة",
    managerPhone: "0599099693",
    address: "غزة",
    isActive: true,
    subscriptionExpiry: oneYearFromNow(),
  };
};

export const updateCampProfile = async (campId, updatedFields) => {
  if (isSupabaseConfigured) {
    const payload = {};
    if (updatedFields.name !== undefined)               payload.name = updatedFields.name;
    if (updatedFields.managerName !== undefined)        payload.manager_name = updatedFields.managerName;
    if (updatedFields.managerPhone !== undefined)       payload.phone = updatedFields.managerPhone;
    if (updatedFields.address !== undefined)            payload.location = updatedFields.address;
    if (updatedFields.subscriptionExpiry !== undefined) payload.subscription_expiry = updatedFields.subscriptionExpiry;
    if (updatedFields.isActive !== undefined)           payload.is_active = updatedFields.isActive;
    if (updatedFields.logoUrl !== undefined)            payload.logo_url = updatedFields.logoUrl;

    if (Object.keys(payload).length > 0) {
      const { data, error } = await supabase.from("camps").update(payload).eq("id", campId).select("id");
      assertSupabaseSuccess(error, "تحديث بيانات المخيم");
      if (!data?.length) throw new Error("لم يتم العثور على المخيم أو لا تملك صلاحية تعديله.");
    }
    return { success: true };
  }

  const res = await fetch("/api/camps", {
    method: "PUT",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: campId, ...updatedFields }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || "فشل تحديث بيانات المخيم");
  }

  initCampLocalStorage();
  const camps = getCampsFromLocal();
  camps[campId] = camps[campId]
    ? { ...camps[campId], ...updatedFields }
    : { id: campId, name: campId, ...updatedFields };
  saveCampsToLocal(camps);
  return { success: true };
};

// ─── All camps (Super Admin) ──────────────────────────────────────────────────

export const getAllCamps = async () => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("camps")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map(mapCampRow);
    } catch (err) {
      console.error("Supabase get all camps error:", err);
      throw new Error("تعذر تحميل المخيمات من قاعدة البيانات. حاول مرة أخرى.");
    }
  }

  try {
    const res = await fetch("/api/camps", { credentials: "same-origin" });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success && Array.isArray(data.camps)) {
      return data.camps;
    }
  } catch (err) {
    console.warn("getAllCamps API notice:", err);
  }

  initCampLocalStorage();
  return Object.values(getCampsFromLocal());
};

// ─── Create camp ──────────────────────────────────────────────────────────────

export const createCamp = async (campData) => {
  const { id, name, managerName, managerPhone, adminUsername, adminPassword, trialPeriod } = campData;
  const expiryDate = calcTrialExpiry(trialPeriod);

  try {
    const res = await fetch("/api/admin/create-camp", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id, name, managerName, managerPhone, adminUsername, adminPassword,
        expiryDate: expiryDate.toISOString(),
      }),
      signal: AbortSignal.timeout(35000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.error || "فشل إنشاء المخيم");
    return data;
  } catch (err) {
    console.error("create camp error:", err);
    return {
      success: false,
      error: err?.name === "AbortError" || err?.name === "TimeoutError"
        ? "استغرق إنشاء المخيم وقتًا طويلًا. تحقق من الاتصال وحاول مرة أخرى."
        : err.message,
    };
  }
};

export const deleteCampPermanently = async (campId) => {
  if (!campId || campId === "system") {
    return { success: false, error: "معرّف المخيم غير صالح للحذف" };
  }

  try {
    const response = await fetch("/api/admin/delete-camp", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ campId, confirmation: campId }),
      signal: AbortSignal.timeout(35000),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) {
      throw new Error(result.error || "فشل حذف المخيم");
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ─── Payment methods ──────────────────────────────────────────────────────────

export const getPaymentMethods = async () => {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "payment_methods")
      .maybeSingle();
    assertSupabaseSuccess(error, "تحميل طرق الدفع");
    return data?.value || DEFAULT_PAYMENT_METHODS;
  }

  try {
    const res = await fetch("/api/payment-methods", { credentials: "same-origin" });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.success && data.paymentMethods) {
        return data.paymentMethods;
      }
    }
  } catch (err) {
    console.warn("Payment methods API error:", err);
  }
  return localStorageGetJSON(PAYMENT_METHODS_KEY) || DEFAULT_PAYMENT_METHODS;
};

export const updatePaymentMethods = async (methods) => {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from("system_settings").upsert([{
      key: "payment_methods",
      value: methods,
      updated_at: new Date().toISOString(),
    }]);
    assertSupabaseSuccess(error, "حفظ طرق الدفع");
    return { success: true };
  }

  try {
    const res = await fetch("/api/payment-methods", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(methods),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      throw new Error(json.error || "فشل حفظ طرق الدفع");
    }
    return { success: true };
  } catch (e) {
    console.warn("API payment-methods update warning:", e);
    throw e;
  }
};

// ─── Renewal requests ─────────────────────────────────────────────────────────

export const submitRenewalRequest = async (requestData) => {
  const { campId, campName, requestedMonths, notes } = requestData;

  const res = await fetch("/api/payment-requests", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      campId,
      campName,
      requestedMonths: parseInt(requestedMonths) || 12,
      notes,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || "فشل إرسال طلب التجديد");
  }
  return { success: true };
};

export const getAllRenewalRequests = async () => {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("renewal_requests")
      .select("*")
      .order("request_date", { ascending: false });
    assertSupabaseSuccess(error, "تحميل طلبات التجديد");
    return (data || []).map((row) => ({
      id: row.id, campId: row.camp_id, campName: row.camp_name,
      requestedMonths: row.requested_months || 1,
      status: row.status || "pending", notes: row.notes || "",
      createdAt: row.request_date,
    }));
  }

  try {
    const res = await fetch("/api/payment-requests", { credentials: "same-origin" });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.success && Array.isArray(data.requests)) {
        return data.requests;
      }
    }
  } catch (e) {
    console.warn("getAllRenewalRequests error:", e);
  }
  return [];
};

export const approveRenewalRequest = async (requestId, campId, monthsCount = 1) => {
  try {
    const campProfile = await getCampProfile(campId);
    const baseDate = campProfile?.subscriptionExpiry && new Date(campProfile.subscriptionExpiry) > new Date()
      ? new Date(campProfile.subscriptionExpiry)
      : new Date();
    baseDate.setMonth(baseDate.getMonth() + (parseInt(monthsCount) || 1));

    await updateCampProfile(campId, {
      subscriptionExpiry: baseDate.toISOString(),
      isActive: true,
    });

    await fetch("/api/payment-requests", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: requestId, status: "approved" }),
    });

    return { success: true };
  } catch (e) {
    console.error("approveRenewalRequest error:", e);
    throw e;
  }
};

export const declineRenewalRequest = async (requestId) => {
  try {
    const res = await fetch("/api/payment-requests", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: requestId, status: "declined" }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      throw new Error(json.error || "فشل رفض طلب التجديد");
    }
    return { success: true };
  } catch (e) {
    console.error("declineRenewalRequest error:", e);
    throw e;
  }
};

// ─── Announcements ────────────────────────────────────────────────────────────

export const getAnnouncement = async () => {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from("announcements").select("*").limit(1).maybeSingle();
    assertSupabaseSuccess(error, "تحميل الإعلان العام");
    if (!data) return DEFAULT_ANNOUNCEMENT;
    return {
      text: data.content,
      title: data.title || "إعلان عاجل",
      isActive: data.is_active !== undefined ? data.is_active : true,
      type: data.type || "urgent",
    };
  }

  try {
    const res = await fetch("/api/announcements", { credentials: "same-origin" });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.success && data.announcement) {
        return data.announcement;
      }
    }
  } catch (err) {
    console.warn("Announcements API error:", err);
  }
  return DEFAULT_ANNOUNCEMENT;
};

export const updateAnnouncement = async (announcementData) => {
  const payload = {
    text: announcementData.text || announcementData.content || "",
    isActive: announcementData.isActive !== undefined ? announcementData.isActive : true,
    type: announcementData.type || "urgent",
  };

  if (isSupabaseConfigured) {
    const { error } = await supabase.from("announcements").upsert([{
      id: "global-announcement", title: "إعلان عام",
      content: payload.text, is_active: payload.isActive, type: payload.type,
    }]);
    assertSupabaseSuccess(error, "حفظ الإعلان العام");
    if (typeof window !== "undefined") window.dispatchEvent(new Event("announcementUpdated"));
    return { success: true };
  }

  const res = await fetch("/api/announcements", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || "فشل حفظ الإعلان في قاعدة البيانات");
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event("announcementUpdated"));
  return { success: true };
};

// ─── System stats (Super Admin) ───────────────────────────────────────────────

export const getAdminSystemStats = async () => {
  try {
    const res = await fetch("/api/admin/stats", { credentials: "same-origin" });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.stats) {
        return data.stats;
      }
    }
  } catch (err) {
    console.warn("API admin stats fetch warning:", err);
  }

  const camps = await getAllCamps();
  const now = new Date();

  let activeCamps = 0;
  let expiredCamps = 0;
  camps.forEach((c) => {
    const expiry = c.subscriptionExpiry ? new Date(c.subscriptionExpiry) : null;
    const isExpired = expiry && !isNaN(expiry) && expiry < now;
    if (isExpired || c.isActive === false) expiredCamps++;
    else activeCamps++;
  });

  return {
    totalCamps: camps.length,
    activeCamps,
    expiredCamps,
    totalUsers: camps.length,
    activeUsersCount: activeCamps,
    totalFamilies: 0,
    totalMembers: 0,
    totalNominations: 0,
    pendingRequests: 0,
    totalRequests: 0,
  };
};

export const getGlobalSystemMetrics = async () => {
  try {
    const res = await fetch("/api/admin/stats", { credentials: "same-origin" });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.metrics) {
        return data.metrics;
      }
    }
  } catch (err) {
    console.warn("API admin metrics fetch warning:", err);
  }

  return {
    familiesWithSpecialCases: 0,
    totalChildrenCount: 0,
    totalAdultsCount: 0,
    totalSeniorsCount: 0,
    grandAgeTotal: 0,
    totalFamiliesCount: 0,
    totalNominationsCount: 0,
    percentSpecial: 0,
    percentChildren: 0,
    percentAdults: 0,
    percentCoverage: 0,
  };
};

// ─── Camp admin user ──────────────────────────────────────────────────────────

export const getCampAdminUser = async (campId) => {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("users").select("username").eq("camp_id", campId).eq("role", "admin").limit(1).maybeSingle();
    assertSupabaseSuccess(error, "تحميل حساب مدير المخيم");
    if (!data) throw new Error("لا يوجد حساب مدير مرتبط بهذا المخيم.");
    return { username: data.username || "", password: "" };
  }

  try {
    const res = await fetch(`/api/camps?campId=${encodeURIComponent(campId)}`, { credentials: "same-origin" });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.success && data.camp) {
        return { username: data.camp.adminUsername || "", password: "" };
      }
    }
  } catch (e) {
    console.warn("getCampAdminUser error:", e);
  }

  return { username: "", password: "" };
};

export const updateCampFullDetails = async (campId, campDetails) => {
  const { name, managerName, managerPhone, address, adminUsername, adminPassword } = campDetails;

  try {
    const response = await fetch("/api/admin/update-camp", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ campId, name, managerName, managerPhone, address, adminUsername, adminPassword }),
      signal: AbortSignal.timeout(35000),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) throw new Error(result.error || "فشل تحديث حساب المخيم");
    return result;
  } catch (err) {
    console.error("updateCampFullDetails error:", err);
    return { success: false, error: err.message };
  }
};
