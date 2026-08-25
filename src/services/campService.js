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

      // An empty array is a valid production result. Falling back to the local
      // demo records here made deleted camps reappear after a page refresh.
      return (data || []).map(mapCampRow);
    } catch (err) {
      console.error("Supabase get all camps error:", err);
      throw new Error("تعذر تحميل المخيمات من قاعدة البيانات. حاول مرة أخرى.");
    }
  }

  initCampLocalStorage();
  return Object.values(getCampsFromLocal());
};

// ─── Create camp ──────────────────────────────────────────────────────────────

export const createCamp = async (campData) => {
  const { id, name, managerName, managerPhone, adminUsername, adminPassword, trialPeriod } = campData;
  const expiryDate = calcTrialExpiry(trialPeriod);

  if (isSupabaseConfigured) {
    try {
      // الإنشاء لازم يصير عبر مسار سيرفر محمي (service role)، مش إدراج مباشر
      // من المتصفح، عشان: 1) الباسورد يتشفر صح، 2) يتربط حساب Supabase Auth
      // حقيقي للمدير الجديد، 3) RLS ما يمنع العملية أصلاً.
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
      if (!data.success) throw new Error(data.error || "فشل إنشاء المخيم");
      return data;
    } catch (err) {
      console.error("Supabase create camp error:", err);
      return {
        success: false,
        error: err?.name === "AbortError" || err?.name === "TimeoutError"
          ? "استغرق إنشاء المخيم وقتًا طويلًا. تحقق من الاتصال وحاول مرة أخرى."
          : err.message,
      };
    }
  }

  initCampLocalStorage();
  const camps = getCampsFromLocal();
  if (camps[id]) return { success: false, error: "معرّف المخيم مستخدم بالفعل" };

  camps[id] = { id, name, managerName, managerPhone, address: "", isActive: true,
    subscriptionExpiry: expiryDate.toISOString(), logoUrl: "", createdAt: new Date().toISOString() };
  saveCampsToLocal(camps);

  const users = getUsersFromLocal();
  users.push({ username: adminUsername, password: adminPassword, role: "admin", campId: id, name });
  saveUsersToLocal(users);

  return { success: true };
};

export const deleteCampPermanently = async (campId) => {
  if (!campId || campId === "system") {
    return { success: false, error: "معرّف المخيم غير صالح للحذف" };
  }

  if (isSupabaseConfigured) {
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
  }

  initCampLocalStorage();
  const camps = getCampsFromLocal();
  if (!camps[campId]) return { success: false, error: "المخيم غير موجود" };
  delete camps[campId];
  saveCampsToLocal(camps);
  saveUsersToLocal(getUsersFromLocal().filter((item) => item.campId !== campId));
  return { success: true, deleted: { local: true } };
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
  if (typeof window !== "undefined") {
    localStorage.setItem(PAYMENT_METHODS_KEY, JSON.stringify(methods));
  }
  return { success: true };
};

// ─── Renewal requests ─────────────────────────────────────────────────────────

export const submitRenewalRequest = async (requestData) => {
  const { campId, campName, requestedMonths, notes } = requestData;
  const newRequest = {
    id: createRecordId("request"),
    camp_id: campId,
    camp_name: campName,
    requested_months: parseInt(requestedMonths) || 1,
    notes: notes || "",
    status: "pending",
    request_date: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    const { error } = await supabase.from("renewal_requests").insert([newRequest]);
    assertSupabaseSuccess(error, "إرسال طلب التجديد");
    return { success: true };
  }

  initCampLocalStorage();
  const requests = localStorageGetJSON(PAYMENT_REQUESTS_KEY, []);
  requests.push({
    id: newRequest.id, campId, campName,
    requestedMonths: newRequest.requested_months,
    notes: newRequest.notes, status: "pending", createdAt: newRequest.request_date,
  });
  localStorage.setItem(PAYMENT_REQUESTS_KEY, JSON.stringify(requests));
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

  return localStorageGetJSON(PAYMENT_REQUESTS_KEY, []);
};

export const approveRenewalRequest = async (requestId, campId, monthsCount = 1) => {
  if (isSupabaseConfigured) {
    const { error } = await supabase.rpc("approve_renewal_request", {
      target_request_id: requestId,
      target_camp_id: campId,
      months_to_add: Math.max(1, parseInt(monthsCount) || 1),
    });
    assertSupabaseSuccess(error, "اعتماد طلب التجديد");
    return { success: true };
  }

  initCampLocalStorage();
  const requests = localStorageGetJSON(PAYMENT_REQUESTS_KEY, []);
  const camps = getCampsFromLocal();

  const reqIndex = requests.findIndex((r) => r.id === requestId);
  if (reqIndex !== -1) {
    requests[reqIndex].status = "approved";
    requests[reqIndex].resolvedAt = new Date().toISOString();
  }

  if (camps[campId]) {
    const baseDate = new Date(camps[campId].subscriptionExpiry) > new Date()
      ? new Date(camps[campId].subscriptionExpiry) : new Date();
    baseDate.setMonth(baseDate.getMonth() + monthsCount);
    camps[campId].subscriptionExpiry = baseDate.toISOString();
    camps[campId].isActive = true;
  }

  localStorage.setItem(PAYMENT_REQUESTS_KEY, JSON.stringify(requests));
  saveCampsToLocal(camps);
  return { success: true };
};

export const declineRenewalRequest = async (requestId) => {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("renewal_requests")
      .update({ status: "declined" })
      .eq("id", requestId)
      .select("id");
    assertSupabaseSuccess(error, "رفض طلب التجديد");
    if (!data?.length) throw new Error("طلب التجديد غير موجود أو لا تملك صلاحية تعديله.");
    return { success: true };
  }

  const requests = localStorageGetJSON(PAYMENT_REQUESTS_KEY, []);
  const reqIndex = requests.findIndex((r) => r.id === requestId);
  if (reqIndex !== -1) {
    requests[reqIndex].status = "declined";
    requests[reqIndex].resolvedAt = new Date().toISOString();
  }
  localStorage.setItem(PAYMENT_REQUESTS_KEY, JSON.stringify(requests));
  return { success: true };
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

  return localStorageGetJSON(ANNOUNCEMENT_KEY) || DEFAULT_ANNOUNCEMENT;
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

  if (typeof window !== "undefined") {
    localStorage.setItem(ANNOUNCEMENT_KEY, JSON.stringify(payload));
    window.dispatchEvent(new Event("announcementUpdated"));
  }
  return { success: true };
};

// ─── System stats (Super Admin) ───────────────────────────────────────────────

export const getAdminSystemStats = async () => {
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

  let totalUsers = camps.length;
  let activeUsersCount = activeCamps;
  let totalFamilies = 0;
  let totalMembers = 0;
  let totalNominations = 0;
  let pendingRequests = 0;
  let totalRequests = 0;

  if (isSupabaseConfigured) {
    try {
      const { data: usersData } = await supabase.from("users").select("id, role");
      if (usersData?.length) {
        totalUsers = usersData.length;
        activeUsersCount = usersData.filter(
          (u) => u.role === "admin" || u.role === "superadmin" || !u.role
        ).length;
      }

      const { data: famData, count: famCount, error: famErr } = await supabase
        .from("families").select("id, members_count", { count: "exact" });
      if (!famErr && famData?.length) {
        totalFamilies = famCount || famData.length;
        totalMembers = famData.reduce((sum, f) => sum + (parseInt(f.members_count) || 1), 0);
      }

      const { count: nomCount, error: nomErr } = await supabase
        .from("nominations").select("id", { count: "exact", head: true });
      if (!nomErr && typeof nomCount === "number" && nomCount > 0) totalNominations = nomCount;

      const { data: reqsData } = await supabase.from("renewal_requests").select("*");
      if (reqsData) {
        totalRequests = reqsData.length;
        pendingRequests = reqsData.filter((r) => r.status === "pending").length;
      }
    } catch (err) {
      console.error("Error calculating Supabase stats:", err);
    }
  }

  // Demo data is only valid when Supabase is not configured. A valid empty
  // production database must stay empty after camps are deleted.
  if (!isSupabaseConfigured && totalFamilies === 0 && typeof window !== "undefined") {
    if (localStorage.getItem("kareem_camp_families_cleared") !== "true") {
      try {
        const raw = localStorage.getItem("kareem_camp_families_v5");
        if (raw) {
          const parsed = decryptData(raw);
          if (Array.isArray(parsed)) {
            totalFamilies = parsed.length;
            totalMembers = parsed.reduce((sum, f) => sum + (parseInt(f.membersCount) || 1), 0);
          }
        }
      } catch {}
    }
  }

  if (!isSupabaseConfigured && totalNominations === 0 && typeof window !== "undefined") {
    if (localStorage.getItem("kareem_camp_nominations_cleared") !== "true") {
      try {
        const raw = localStorage.getItem("kareem_camp_nominations_v3");
        if (raw) {
          const parsed = decryptData(raw);
          if (Array.isArray(parsed)) totalNominations = parsed.length;
        }
      } catch {}
    }
  }

  return {
    totalCamps: camps.length, activeCamps, expiredCamps,
    totalUsers, activeUsersCount, totalFamilies, totalMembers,
    totalNominations, pendingRequests, totalRequests,
  };
};

export const getGlobalSystemMetrics = async () => {
  let families = [];
  let nominations = [];

  const isPositive = (val) =>
    val === 1 || val === "1" || val === true || val === "true" || val === "نعم";

  if (isSupabaseConfigured) {
    try {
      const { data: famData } = await supabase.from("families").select("*");
      if (famData) families = famData;
      const { data: nomData } = await supabase.from("nominations").select("*");
      if (nomData) nominations = nomData;
    } catch (e) {
      console.warn("Supabase fetch global metrics warning:", e);
    }
  }

  if (!isSupabaseConfigured && families.length === 0 && typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("kareem_camp_families_v5");
      if (raw) families = decryptData(raw) || [];
    } catch {}
  }

  if (!isSupabaseConfigured && nominations.length === 0 && typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("kareem_camp_nominations_v3");
      if (raw) nominations = decryptData(raw) || [];
    } catch {}
  }

  const familiesWithSpecialCases = nominations.filter((n) =>
    isPositive(n.hasDisabled || n.has_disabled) ||
    isPositive(n.hasChronicDisease || n.has_chronic_disease) ||
    isPositive(n.isLactatingOrPregnant || n.is_lactating_or_pregnant) ||
    isPositive(n.isFemaleHeaded || n.is_female_headed)
  ).length;

  const getNumVal = (n, ...keys) => {
    for (const k of keys) {
      if (n?.[k] !== undefined && n[k] !== null && n[k] !== "") {
        const parsed = parseInt(n[k]);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    return 0;
  };

  let age_0_2 = nominations.reduce((s, n) => s + getNumVal(n, "age_0_2_male", "age02Male", "age_0_2_m") + getNumVal(n, "age_0_2_female", "age02Female", "age_0_2_f"), 0);
  let age_3_5 = nominations.reduce((s, n) => s + getNumVal(n, "age_3_5_male", "age35Male") + getNumVal(n, "age_3_5_female", "age35Female"), 0);
  let age_6_18 = nominations.reduce((s, n) => s + getNumVal(n, "age_6_18_male", "age618Male") + getNumVal(n, "age_6_18_female", "age618Female"), 0);
  let age_19_60 = nominations.reduce((s, n) => s + getNumVal(n, "age_19_60_male", "age1960Male") + getNumVal(n, "age_19_60_female", "age1960Female"), 0);
  let age_over_60 = nominations.reduce((s, n) => s + getNumVal(n, "age_over_60_male", "ageOver60Male") + getNumVal(n, "age_over_60_female", "ageOver60Female"), 0);

  const sumAgeFields = age_0_2 + age_3_5 + age_6_18 + age_19_60 + age_over_60;
  const totalNominationMembers = nominations.reduce(
    (s, n) => s + (parseInt(n.membersCount || n.members_count) || 1), 0
  );

  if (sumAgeFields === 0 && totalNominationMembers > 0) {
    nominations.forEach((n) => {
      const mCount = parseInt(n.membersCount || n.members_count) || 1;
      const isWidowOrSingle = ["أرمل", "أعزب", "مطلق"].some((s) => (n.status || "").includes(s));
      const parentsCount = isWidowOrSingle ? 1 : Math.min(mCount, 2);
      const kidsCount = Math.max(0, mCount - parentsCount);
      age_19_60 += parentsCount;
      age_0_2 += Math.round(kidsCount * 0.15);
      age_3_5 += Math.round(kidsCount * 0.25);
      age_6_18 += Math.max(0, kidsCount - Math.round(kidsCount * 0.15) - Math.round(kidsCount * 0.25));
    });
  }

  const grandAgeTotal =
    age_0_2 + age_3_5 + age_6_18 + age_19_60 + age_over_60 || totalNominationMembers;
  const totalChildrenCount = age_0_2 + age_3_5 + age_6_18;
  const totalAdultsCount = age_19_60 + age_over_60;

  return {
    familiesWithSpecialCases,
    totalNominationsCount: nominations.length,
    totalFamiliesCount: families.length,
    totalChildrenCount,
    totalAdultsCount,
    grandAgeTotal,
    percentSpecial: nominations.length ? Math.min(100, Math.round((familiesWithSpecialCases / nominations.length) * 100)) : 0,
    percentChildren: grandAgeTotal ? Math.round((totalChildrenCount / grandAgeTotal) * 100) : 0,
    percentCoverage: families.length
      ? Math.min(100, Math.round((nominations.length / families.length) * 100))
      : 0,
    percentAdults: grandAgeTotal ? Math.round((totalAdultsCount / grandAgeTotal) * 100) : 0,
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

  initCampLocalStorage();
  const users = getUsersFromLocal();
  const u = users.find((u) => u.campId === campId)
    || DEFAULT_DEMO_USERS.find((u) => u.campId === campId);
  return { username: u?.username || "", password: u?.password || "123456" };
};

export const updateCampFullDetails = async (campId, campDetails) => {
  const { name, managerName, managerPhone, address, adminUsername, adminPassword } = campDetails;

  if (isSupabaseConfigured) {
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
      console.error("Supabase updateCampFullDetails error:", err);
      return { success: false, error: err.message };
    }
  }

  initCampLocalStorage();
  const camps = getCampsFromLocal();
  if (camps[campId]) {
    camps[campId] = {
      ...camps[campId],
      ...(name && { name }),
      ...(managerName && { managerName }),
      ...(managerPhone && { managerPhone }),
      ...(address && { address }),
    };
    saveCampsToLocal(camps);
  }

  const users = getUsersFromLocal();
  const uIndex = users.findIndex((u) => u.campId === campId);
  if (uIndex !== -1) {
    if (adminUsername) users[uIndex].username = adminUsername;
    if (adminPassword) users[uIndex].password = adminPassword;
    if (name) users[uIndex].name = name;
  } else if (adminUsername && adminPassword) {
    users.push({ username: adminUsername, password: adminPassword, role: "admin", campId, name: name || campId });
  }
  saveUsersToLocal(users);

  return { success: true };
};
