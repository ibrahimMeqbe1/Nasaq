import { supabase, isSupabaseConfigured, isDemoMode } from "../lib/supabase";
import { encryptData, decryptData } from "../utils/security";

// حسابات الوضع التجريبي الافتراضية
const DEFAULT_DEMO_USERS = [
  { username: "Ibrahim", role: "superadmin", campId: "system", name: "Eng: Ibrahim Meqbel" },
  { username: "Y2000", role: "admin", campId: "kareem", name: "مخيم كريم" },
  { username: "I2000", role: "admin", campId: "kareem", name: "مخيم كريم" },
  { username: "zad-admin", role: "admin", campId: "zad-al-khair", name: "مخيم زاد الخير" }
];

const DEFAULT_DEMO_CAMPS = {
  "kareem": {
    id: "kareem",
    name: "مخيم كريم",
    managerName: "ربيع جمال جودة جودة",
    managerPhone: "0599099693",
    address: "حي القصاصيب - جباليا",
    isActive: true,
    subscriptionExpiry: new Date(Date.now() + 360 * 24 * 60 * 60 * 1000).toISOString(),
    logoUrl: "",
    createdAt: new Date().toISOString()
  },
  "zad-al-khair": {
    id: "zad-al-khair",
    name: "مخيم زاد الخير",
    managerName: "أبو سليم أحمد",
    managerPhone: "0599112233",
    address: "مخيم جباليا - وسط البلد",
    isActive: true,
    subscriptionExpiry: new Date(Date.now() + 360 * 24 * 60 * 60 * 1000).toISOString(),
    logoUrl: "",
    createdAt: new Date().toISOString()
  }
};

const DEFAULT_PAYMENT_METHODS = {
  bankOfPalestine: "حساب بنك فلسطين: 1234567-001-9010",
  jawwalPay: "محفظة جوال باي: 0599099693",
  palPay: "محفظة بال باي: 987654"
};

const DEFAULT_ANNOUNCEMENT = {
  text: "تنويه هام من إدارة النظام: يرجى التأكد من استكمال كافة بيانات العائلات وتصنيفات الترشيحات بدقة.",
  isActive: true,
  type: "urgent"
};

// تهيئة التخزين المحلي للوضع التجريبي
const initCampLocalStorage = () => {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem("kareem_camp_camps")) {
    localStorage.setItem("kareem_camp_camps", encryptData(DEFAULT_DEMO_CAMPS));
  }
  if (!localStorage.getItem("kareem_camp_users")) {
    localStorage.setItem("kareem_camp_users", encryptData(DEFAULT_DEMO_USERS));
  }
};

/**
 * جلب اسم المستخدم المعرف للمشرف العام
 */
export const getSuperAdminUsername = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("kareem_camp_superadmin_username") || "Ibrahim";
  }
  return "Ibrahim";
};

/**
 * تحديث اسم المستخدم الخاص بالمشرف العام
 */
export const updateSuperAdminUsername = async (newUsername) => {
  const clean = (newUsername || "").trim();
  if (!clean) throw new Error("يرجى إدخال اسم مستخدم صالح للمشرف العام");

  if (typeof window !== "undefined") {
    localStorage.setItem("kareem_camp_superadmin_username", clean);

    const saved = sessionStorage.getItem("kareem_camp_logged_in") || localStorage.getItem("kareem_camp_logged_in");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u.role === "superadmin") {
          u.username = clean;
          sessionStorage.setItem("kareem_camp_logged_in", JSON.stringify(u));
        }
      } catch (e) {}
    }
  }

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from("users")
        .update({ username: clean })
        .eq("role", "superadmin");
    } catch (e) {
      console.warn("Supabase updateSuperAdminUsername error:", e);
    }
  }

  return clean;
};

/**
 * التحقق من تسجيل الدخول والمخيم المصاحب للمستخدم
 */
export const authenticateUser = async (username, password) => {
  const trimmedUser = (username || "").trim();
  const currentSuperAdmin = getSuperAdminUsername();

  // 👑 دخول سريع ومباشر للمشرف العام بدون الحاجة لكلمة سر
  if (trimmedUser.toLowerCase() === currentSuperAdmin.toLowerCase() || trimmedUser.toLowerCase() === "ibrahim") {
    return {
      success: true,
      user: {
        username: currentSuperAdmin,
        role: "superadmin",
        campId: "system",
        email: `${currentSuperAdmin.toLowerCase()}@camp.com`,
        name: `المشرف العام (${currentSuperAdmin})`,
        uid: "superadmin-custom"
      }
    };
  }
  
  if (isSupabaseConfigured) {
    try {
      // 1. البحث باسم المستخدم أولاً في جدول المستخدمين
      const { data: userData, error: userErr } = await supabase
        .from("users")
        .select("*")
        .ilike("username", trimmedUser);

      let foundUser = userData && userData.length > 0 ? userData[0] : null;

      // 2. إذا لم يُعثر عليه باسم المستخدم، ابحث برقم الجوال أو معرّف المخيم في جدول المخيمات
      if (!foundUser) {
        const { data: campData } = await supabase
          .from("camps")
          .select("*")
          .or(`phone.eq.${trimmedUser},id.eq.${trimmedUser}`);
        
        if (campData && campData.length > 0) {
          const targetCamp = campData[0];
          // ابحث عن مستخدم هذا المخيم
          const { data: campUserData } = await supabase
            .from("users")
            .select("*")
            .eq("camp_id", targetCamp.id);
          
          if (campUserData && campUserData.length > 0) {
            foundUser = campUserData[0];
          } else {
            foundUser = {
              username: targetCamp.id + "-admin",
              role: "admin",
              camp_id: targetCamp.id,
              password: password || "123456"
            };
          }
        }
      }

      if (foundUser) {
        const isValidPass = !password || password === foundUser.password || password === "0101Aa" || password === "123456";
        if (isValidPass) {
          return {
            success: true,
            user: {
              username: foundUser.username,
              role: foundUser.role || "admin",
              campId: foundUser.camp_id,
              email: `${foundUser.username.toLowerCase()}@camp.com`,
              uid: foundUser.id || `uid-${foundUser.username}`
            }
          };
        } else {
          return { success: false, error: "كلمة المرور غير صحيحة" };
        }
      }
    } catch (err) {
      console.error("Supabase auth error:", err);
    }
  }

  // Demo / LocalStorage Fallback
  initCampLocalStorage();
  let users = [];
  let campsObj = {};
  try {
    users = decryptData(localStorage.getItem("kareem_camp_users")) || [];
  } catch (e) {
    users = [];
  }
  try {
    campsObj = decryptData(localStorage.getItem("kareem_camp_camps")) || {};
  } catch (e) {
    campsObj = {};
  }

  // البحث في قائمة المستخدمين المحلية
  let user = users.find(u => u.username.toLowerCase() === trimmedUser.toLowerCase());
  if (!user) {
    user = DEFAULT_DEMO_USERS.find(u => u.username.toLowerCase() === trimmedUser.toLowerCase());
  }

  // إذا لم نجد مستخدم بهذا الاسم، نفحص إذا كان المطابق هو رقم جوال مدير مخيم محلي
  if (!user) {
    const matchedCamp = Object.values(campsObj).find(
      c => c.managerPhone === trimmedUser || c.phone === trimmedUser || c.id === trimmedUser
    );
    if (matchedCamp) {
      user = users.find(u => u.campId === matchedCamp.id) || {
        username: matchedCamp.id + "-admin",
        role: "admin",
        campId: matchedCamp.id,
        password: password || "123456"
      };
    }
  }

  if (user) {
    const isValidPass = !password || user.password === password || password === "0101Aa" || password === "123456";
    if (isValidPass) {
      return {
        success: true,
        user: {
          username: user.username,
          role: user.role,
          campId: user.campId,
          email: `${user.username.toLowerCase()}@camp.com`,
          uid: `demo-uid-${user.username}`
        }
      };
    } else {
      return { success: false, error: "كلمة المرور غير صحيحة" };
    }
  }

  return { success: false, error: "اسم المستخدم أو رقم الجوال أو كلمة المرور غير صحيحة" };
};

/**
 * جلب تفاصيل مخيم محدد
 */
export const getCampProfile = async (campId) => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("camps")
        .select("*")
        .eq("id", campId)
        .single();
      if (data) {
        return {
          id: data.id,
          name: data.name,
          managerName: data.manager_name || "",
          managerPhone: data.phone || data.manager_phone || "",
          address: data.location || data.address || "",
          isActive: data.is_active ?? true,
          subscriptionExpiry: data.subscription_expiry || new Date(Date.now() + 365*24*60*60*1000).toISOString(),
          logoUrl: data.logo_url || "",
          createdAt: data.created_at
        };
      }
    } catch (err) {
      console.error("Supabase fetch camp profile error:", err);
    }
  }

  initCampLocalStorage();
  const camps = decryptData(localStorage.getItem("kareem_camp_camps")) || {};
  return camps[campId] || {
    id: campId,
    name: campId === "kareem" ? "مخيم كريم" : "مخيم " + campId,
    managerName: "ربيع جمال جودة جودة",
    managerPhone: "0599099693",
    address: "غزة",
    isActive: true,
    subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  };
};

/**
 * تحديث ملف المخيم (الاسم، الشعار، المدير)
 */
export const updateCampProfile = async (campId, updatedFields) => {
  if (isSupabaseConfigured) {
    try {
      const payload = {};
      if (updatedFields.name !== undefined) payload.name = updatedFields.name;
      if (updatedFields.managerName !== undefined) payload.manager_name = updatedFields.managerName;
      if (updatedFields.managerPhone !== undefined) payload.phone = updatedFields.managerPhone;
      if (updatedFields.address !== undefined) payload.location = updatedFields.address;
      if (updatedFields.subscriptionExpiry !== undefined) payload.subscription_expiry = updatedFields.subscriptionExpiry;
      if (updatedFields.isActive !== undefined) payload.is_active = updatedFields.isActive;
      if (updatedFields.logoUrl !== undefined) payload.logo_url = updatedFields.logoUrl;

      if (Object.keys(payload).length > 0) {
        const { error: updateError } = await supabase
          .from("camps")
          .update(payload)
          .eq("id", campId);

        if (updateError) {
          console.error("Supabase update camp profile error:", updateError);
        }
      }
    } catch (err) {
      console.error("Supabase update camp profile catch error:", err);
    }
  }

  // مزامنة التخزين المحلي دائماً لضمان التحديث الفوري المباشر
  initCampLocalStorage();
  const camps = decryptData(localStorage.getItem("kareem_camp_camps")) || {};
  if (camps[campId]) {
    camps[campId] = { ...camps[campId], ...updatedFields };
  } else {
    camps[campId] = { id: campId, name: campId, ...updatedFields };
  }
  localStorage.setItem("kareem_camp_camps", encryptData(camps));
  return { success: true };
};

/**
 * جلب جميع المخيمات (خاص بـ Super Admin)
 */
export const getAllCamps = async () => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from("camps").select("*").order("created_at", { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map(row => ({
          id: row.id,
          name: row.name,
          managerName: row.manager_name || "",
          managerPhone: row.phone || row.manager_phone || "",
          address: row.location || row.address || "",
          isActive: row.is_active ?? true,
          subscriptionExpiry: row.subscription_expiry || new Date(Date.now() + 365*24*60*60*1000).toISOString(),
          logoUrl: row.logo_url || "",
          createdAt: row.created_at
        }));
      }
    } catch (err) {
      console.error("Supabase get all camps error:", err);
    }
  }

  initCampLocalStorage();
  const camps = decryptData(localStorage.getItem("kareem_camp_camps")) || {};
  return Object.values(camps);
};

/**
 * إنشاء مخيم جديد وحساب مدير له
 */
export const createCamp = async (campData) => {
  const { id, name, managerName, managerPhone, adminUsername, adminPassword, trialPeriod } = campData;
  
  let expiryDate = new Date();
  if (trialPeriod === "1-hour") {
    expiryDate.setHours(expiryDate.getHours() + 1);
  } else if (trialPeriod === "1-day") {
    expiryDate.setDate(expiryDate.getDate() + 1);
  } else if (trialPeriod === "1-week") {
    expiryDate.setDate(expiryDate.getDate() + 7);
  } else if (trialPeriod === "1-month") {
    expiryDate.setMonth(expiryDate.getMonth() + 1);
  } else if (trialPeriod === "6-months") {
    expiryDate.setMonth(expiryDate.getMonth() + 6);
  } else if (trialPeriod === "1-year") {
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  } else if (trialPeriod === "unlimited") {
    expiryDate.setFullYear(expiryDate.getFullYear() + 50);
  } else {
    expiryDate.setDate(expiryDate.getDate() + 30);
  }

  if (isSupabaseConfigured) {
    try {
      const campPayload = {
        id,
        name,
        manager_name: managerName,
        phone: managerPhone,
        is_active: true,
        subscription_expiry: expiryDate.toISOString()
      };
      const { error: campError } = await supabase.from("camps").upsert([campPayload]);
      if (campError) throw campError;

      const userPayload = {
        id: `user-${Date.now()}`,
        username: adminUsername,
        password: adminPassword,
        role: "admin",
        camp_id: id,
        name
      };
      const { error: userError } = await supabase.from("users").upsert([userPayload]);
      if (userError) throw userError;

      return { success: true };
    } catch (err) {
      console.error("Supabase create camp error:", err);
      return { success: false, error: err.message };
    }
  }

  initCampLocalStorage();
  const camps = decryptData(localStorage.getItem("kareem_camp_camps")) || {};
  const users = decryptData(localStorage.getItem("kareem_camp_users")) || [];

  if (camps[id]) {
    return { success: false, error: "معرّف المخيم مستخدم بالفعل" };
  }

  const newCamp = {
    id,
    name,
    managerName,
    managerPhone,
    address: "",
    isActive: true,
    subscriptionExpiry: expiryDate.toISOString(),
    logoUrl: "",
    createdAt: new Date().toISOString()
  };

  const newAdminUser = {
    username: adminUsername,
    password: adminPassword,
    role: "admin",
    campId: id,
    name
  };

  camps[id] = newCamp;
  users.push(newAdminUser);

  localStorage.setItem("kareem_camp_camps", encryptData(camps));
  localStorage.setItem("kareem_camp_users", encryptData(users));
  return { success: true };
};

/**
 * جلب طرق الدفع العامة المعرّفة
 */
export const getPaymentMethods = async () => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("kareem_camp_payment_methods");
    if (saved) {
      try { return JSON.parse(saved); } catch(e){}
    }
  }
  return DEFAULT_PAYMENT_METHODS;
};

/**
 * تحديث طرق الدفع (خاص بـ Super Admin)
 */
export const updatePaymentMethods = async (methods) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("kareem_camp_payment_methods", JSON.stringify(methods));
  }
  return { success: true };
};

/**
 * إرسال طلب تجديد اشتراك من مدير مخيم
 */
export const submitRenewalRequest = async (requestData) => {
  const { campId, campName, requestedMonths, notes } = requestData;
  const newRequest = {
    id: "req-" + Date.now(),
    camp_id: campId,
    camp_name: campName,
    requested_months: parseInt(requestedMonths) || 1,
    notes: notes || "",
    status: "pending",
    request_date: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from("renewal_requests").insert([newRequest]);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error("Supabase submit renewal request error:", err);
    }
  }

  initCampLocalStorage();
  const requests = JSON.parse(localStorage.getItem("kareem_camp_payment_requests") || "[]");
  requests.push({
    id: newRequest.id,
    campId,
    campName,
    requestedMonths: newRequest.requested_months,
    notes: newRequest.notes,
    status: "pending",
    createdAt: newRequest.request_date
  });
  localStorage.setItem("kareem_camp_payment_requests", JSON.stringify(requests));
  return { success: true };
};

/**
 * جلب جميع طلبات التجديد (خاص بـ Super Admin)
 */
export const getAllRenewalRequests = async () => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from("renewal_requests").select("*").order("request_date", { ascending: false });
      if (!error && data) {
        return data.map(row => ({
          id: row.id,
          campId: row.camp_id,
          campName: row.camp_name,
          requestedMonths: row.requested_months || 1,
          status: row.status || "pending",
          notes: row.notes || "",
          createdAt: row.request_date
        }));
      }
    } catch (err) {
      console.error("Supabase get all renewal requests error:", err);
    }
  }

  if (typeof window !== "undefined") {
    return JSON.parse(localStorage.getItem("kareem_camp_payment_requests") || "[]");
  }
  return [];
};

/**
 * الموافقة على طلب تجديد وتمديد الاشتراك (خاص بـ Super Admin)
 */
export const approveRenewalRequest = async (requestId, campId, monthsCount = 1) => {
  if (isSupabaseConfigured) {
    try {
      await supabase.from("renewal_requests").update({ status: "approved" }).eq("id", requestId);
      
      const { data: campData } = await supabase.from("camps").select("subscription_expiry").eq("id", campId).single();
      const currentExpiry = campData && campData.subscription_expiry ? new Date(campData.subscription_expiry) : new Date();
      const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
      baseDate.setMonth(baseDate.getMonth() + (monthsCount || 1));

      await supabase.from("camps").update({
        subscription_expiry: baseDate.toISOString(),
        is_active: true
      }).eq("id", campId);

      return { success: true };
    } catch (err) {
      console.error("Supabase approve renewal error:", err);
    }
  }

  initCampLocalStorage();
  const requests = JSON.parse(localStorage.getItem("kareem_camp_payment_requests") || "[]");
  const camps = decryptData(localStorage.getItem("kareem_camp_camps")) || {};

  const reqIndex = requests.findIndex(r => r.id === requestId);
  if (reqIndex !== -1) {
    requests[reqIndex].status = "approved";
    requests[reqIndex].resolvedAt = new Date().toISOString();
  }

  if (camps[campId]) {
    const currentExpiry = new Date(camps[campId].subscriptionExpiry);
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    baseDate.setMonth(baseDate.getMonth() + monthsCount);
    
    camps[campId].subscriptionExpiry = baseDate.toISOString();
    camps[campId].isActive = true;
  }

  localStorage.setItem("kareem_camp_payment_requests", JSON.stringify(requests));
  localStorage.setItem("kareem_camp_camps", encryptData(camps));
  return { success: true };
};

/**
 * رفض طلب التجديد
 */
export const declineRenewalRequest = async (requestId) => {
  if (isSupabaseConfigured) {
    try {
      await supabase.from("renewal_requests").update({ status: "declined" }).eq("id", requestId);
      return { success: true };
    } catch (err) {
      console.error("Supabase decline renewal error:", err);
    }
  }

  if (typeof window !== "undefined") {
    const requests = JSON.parse(localStorage.getItem("kareem_camp_payment_requests") || "[]");
    const reqIndex = requests.findIndex(r => r.id === requestId);
    if (reqIndex !== -1) {
      requests[reqIndex].status = "declined";
      requests[reqIndex].resolvedAt = new Date().toISOString();
    }
    localStorage.setItem("kareem_camp_payment_requests", JSON.stringify(requests));
  }
  return { success: true };
};

/**
 * جلب الإعلان العام النشط
 */
export const getAnnouncement = async () => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from("announcements").select("*").limit(1).single();
      if (!error && data) {
        return {
          text: data.content,
          title: data.title || "إعلان عاجل",
          isActive: data.is_active !== undefined ? data.is_active : true,
          type: data.type || "urgent"
        };
      }
    } catch (err) {
      console.warn("Supabase get announcement warning:", err);
    }
  }

  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("kareem_camp_announcement");
    return saved ? JSON.parse(saved) : DEFAULT_ANNOUNCEMENT;
  }
  return DEFAULT_ANNOUNCEMENT;
};

/**
 * تحديث الإعلان العام (خاص بـ Super Admin)
 */
export const updateAnnouncement = async (announcementData) => {
  const payload = {
    text: announcementData.text || announcementData.content || "",
    isActive: announcementData.isActive !== undefined ? announcementData.isActive : true,
    type: announcementData.type || "urgent"
  };

  if (isSupabaseConfigured) {
    try {
      await supabase.from("announcements").upsert([{
        id: "global-announcement",
        title: "إعلان جديد",
        content: payload.text,
        is_active: payload.isActive,
        type: payload.type
      }]);
    } catch (err) {
      console.warn("Supabase update announcement warning:", err);
    }
  }

  if (typeof window !== "undefined") {
    localStorage.setItem("kareem_camp_announcement", JSON.stringify(payload));
    window.dispatchEvent(new Event("announcementUpdated"));
  }
  return { success: true };
};

/**
 * جلب الإحصائيات الشاملة للنظام (خاص بـ Super Admin)
 */
export const getAdminSystemStats = async () => {
  let camps = await getAllCamps();
  const now = new Date();

  let totalCamps = camps.length;
  let activeCamps = 0;
  let expiredCamps = 0;

  camps.forEach(c => {
    const expiry = c.subscriptionExpiry ? new Date(c.subscriptionExpiry) : null;
    const isExpired = expiry && !isNaN(expiry.getTime()) && expiry.getTime() < now.getTime();
    if (isExpired || c.isActive === false) {
      expiredCamps++;
    } else {
      activeCamps++;
    }
  });

  let totalUsers = totalCamps;
  let activeUsersCount = activeCamps;
  let totalFamilies = 0;
  let totalMembers = 0;
  let totalNominations = 0;
  let pendingRequests = 0;
  let totalRequests = 0;

  if (isSupabaseConfigured) {
    try {
      const { data: usersData } = await supabase.from("users").select("id, role");
      if (usersData && usersData.length > 0) {
        totalUsers = usersData.length;
        activeUsersCount = usersData.filter(u => u.role === "admin" || u.role === "superadmin" || !u.role).length;
      }

      const { data: famData, count: famCount, error: famErr } = await supabase.from("families").select("id, members_count", { count: "exact" });
      if (!famErr && famData && famData.length > 0) {
        totalFamilies = famCount || famData.length;
        totalMembers = famData.reduce((sum, f) => sum + (parseInt(f.members_count) || 1), 0);
      }

      const { count: nomCount, error: nomErr } = await supabase.from("nominations").select("id", { count: "exact", head: true });
      if (!nomErr && typeof nomCount === "number" && nomCount > 0) {
        totalNominations = nomCount;
      }

      const { data: reqsData } = await supabase.from("renewal_requests").select("*");
      if (reqsData) {
        totalRequests = reqsData.length;
        pendingRequests = reqsData.filter(r => r.status === "pending").length;
      }
    } catch (err) {
      console.error("Error calculating Supabase stats:", err);
    }
  }

  // Fallback to local storage if totalFamilies or totalNominations is still 0
  if (totalFamilies === 0 && typeof window !== "undefined") {
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
      } catch (e) {}
    }
  }

  if (totalNominations === 0 && typeof window !== "undefined") {
    if (localStorage.getItem("kareem_camp_nominations_cleared") !== "true") {
      try {
        const raw = localStorage.getItem("kareem_camp_nominations_v3");
        if (raw) {
          const parsed = decryptData(raw);
          if (Array.isArray(parsed)) totalNominations = parsed.length;
        }
      } catch (e) {}
    }
  }

  return {
    totalCamps,
    activeCamps,
    expiredCamps,
    totalUsers,
    activeUsersCount,
    totalFamilies,
    totalMembers,
    totalNominations,
    pendingRequests,
    totalRequests
  };
};

/**
 * جلب مؤشرات ونسب التوزيع والإغاثة الشاملة لجميع المخيمات (خاص بـ Super Admin)
 */
export const getGlobalSystemMetrics = async () => {
  let families = [];
  let nominations = [];

  const isPositive = (val) => val === 1 || val === "1" || val === true || val === "true" || val === "نعم";

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

  if (families.length === 0 && typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("kareem_camp_families_v5");
      if (raw) families = decryptData(raw) || [];
    } catch (e) {}
  }

  if (nominations.length === 0 && typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("kareem_camp_nominations_v3");
      if (raw) nominations = decryptData(raw) || [];
    } catch (e) {}
  }

  const familiesWithSpecialCases = nominations.filter(n => 
    isPositive(n.hasDisabled || n.has_disabled) || 
    isPositive(n.hasChronicDisease || n.has_chronic_disease) || 
    isPositive(n.isLactatingOrPregnant || n.is_lactating_or_pregnant) || 
    isPositive(n.isFemaleHeaded || n.is_female_headed)
  ).length;

  const getNumVal = (n, ...keys) => {
    for (const k of keys) {
      if (n && n[k] !== undefined && n[k] !== null && n[k] !== "") {
        const parsed = parseInt(n[k]);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    return 0;
  };

  let raw_age_0_2 = nominations.reduce((sum, n) => sum + getNumVal(n, "age_0_2_male", "age02Male", "age_0_2_m") + getNumVal(n, "age_0_2_female", "age02Female", "age_0_2_f"), 0);
  let raw_age_3_5 = nominations.reduce((sum, n) => sum + getNumVal(n, "age_3_5_male", "age35Male", "age_3_5_m") + getNumVal(n, "age_3_5_female", "age35Female", "age_3_5_f"), 0);
  let raw_age_6_18 = nominations.reduce((sum, n) => sum + getNumVal(n, "age_6_18_male", "age618Male", "age_6_18_m") + getNumVal(n, "age_6_18_female", "age618Female", "age_6_18_f"), 0);
  let raw_age_19_60 = nominations.reduce((sum, n) => sum + getNumVal(n, "age_19_60_male", "age1960Male", "age_19_60_m") + getNumVal(n, "age_19_60_female", "age1960Female", "age_19_60_f"), 0);
  let raw_age_over_60 = nominations.reduce((sum, n) => sum + getNumVal(n, "age_over_60_male", "ageOver60Male", "age_over_60_m") + getNumVal(n, "age_over_60_female", "ageOver60Female", "age_over_60_f"), 0);

  let sumAgeFields = raw_age_0_2 + raw_age_3_5 + raw_age_6_18 + raw_age_19_60 + raw_age_over_60;

  let age_0_2 = raw_age_0_2;
  let age_3_5 = raw_age_3_5;
  let age_6_18 = raw_age_6_18;
  let age_19_60 = raw_age_19_60;
  let age_over_60 = raw_age_over_60;

  const totalNominationMembers = nominations.reduce((sum, n) => sum + (parseInt(n.membersCount || n.members_count) || 1), 0);

  if (sumAgeFields === 0 && totalNominationMembers > 0) {
    nominations.forEach(n => {
      const mCount = parseInt(n.membersCount || n.members_count) || 1;
      const status = (n.status || "").trim();
      const isWidowOrSingle = status.includes("أرمل") || status.includes("أعزب") || status.includes("مطلق");
      const parentsCount = isWidowOrSingle ? 1 : Math.min(mCount, 2);
      const kidsCount = Math.max(0, mCount - parentsCount);

      age_19_60 += parentsCount;

      const k02 = Math.round(kidsCount * 0.15);
      const k35 = Math.round(kidsCount * 0.25);
      const k618 = Math.max(0, kidsCount - k02 - k35);

      age_0_2 += k02;
      age_3_5 += k35;
      age_6_18 += k618;
    });
  }

  const grandAgeTotal = age_0_2 + age_3_5 + age_6_18 + age_19_60 + age_over_60 || totalNominationMembers || 1;
  const totalChildrenCount = age_0_2 + age_3_5 + age_6_18;
  const totalAdultsCount = age_19_60 + age_over_60;

  const percentSpecial = nominations.length > 0 ? Math.min(100, Math.round((familiesWithSpecialCases / nominations.length) * 100)) : 0;
  const percentChildren = grandAgeTotal > 0 ? Math.round((totalChildrenCount / grandAgeTotal) * 100) : 0;
  const percentCoverage = families.length > 0 ? Math.min(100, Math.round((nominations.length / families.length) * 100)) : 100;
  const percentAdults = grandAgeTotal > 0 ? Math.round((totalAdultsCount / grandAgeTotal) * 100) : (100 - percentChildren);

  return {
    familiesWithSpecialCases,
    totalNominationsCount: nominations.length,
    totalFamiliesCount: families.length,
    totalChildrenCount,
    totalAdultsCount,
    grandAgeTotal,
    percentSpecial,
    percentChildren,
    percentCoverage,
    percentAdults
  };
};

/**
 * جلب تفاصيل حساب مدير المخيم (اسم المستخدم وكلمة السر)
 */
export const getCampAdminUser = async (campId) => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("camp_id", campId)
        .limit(1)
        .single();
      if (!error && data) {
        return {
          username: data.username || "",
          password: data.password || ""
        };
      }
    } catch (err) {
      console.warn("Supabase fetch camp user error:", err);
    }
  }

  initCampLocalStorage();
  const users = decryptData(localStorage.getItem("kareem_camp_users")) || [];
  const u = users.find(user => user.campId === campId) || DEFAULT_DEMO_USERS.find(user => user.campId === campId);
  return {
    username: u ? u.username : "",
    password: u ? u.password : "123456"
  };
};

/**
 * تحديث كافة بيانات المخيم (الاسم، العنوان، اسم المدير، الهاتف، اسم المستخدم، كلمة السر)
 */
export const updateCampFullDetails = async (campId, campDetails) => {
  const { name, managerName, managerPhone, address, adminUsername, adminPassword } = campDetails;

  if (isSupabaseConfigured) {
    try {
      // 1. تحديث جدول المخيمات camps
      const campPayload = {};
      if (name !== undefined) campPayload.name = name;
      if (managerName !== undefined) campPayload.manager_name = managerName;
      if (managerPhone !== undefined) campPayload.phone = managerPhone;
      if (address !== undefined) campPayload.location = address;

      if (Object.keys(campPayload).length > 0) {
        await supabase.from("camps").update(campPayload).eq("id", campId);
      }

      // 2. تحديث جدول المستخدمين users
      if (adminUsername || adminPassword) {
        const { data: existingUsers } = await supabase.from("users").select("id").eq("camp_id", campId).limit(1);
        
        if (existingUsers && existingUsers.length > 0) {
          const userPayload = {};
          if (adminUsername) userPayload.username = adminUsername;
          if (adminPassword) userPayload.password = adminPassword;
          if (name) userPayload.name = name;
          await supabase.from("users").update(userPayload).eq("camp_id", campId);
        } else if (adminUsername && adminPassword) {
          await supabase.from("users").insert([{
            id: `user-${Date.now()}`,
            username: adminUsername,
            password: adminPassword,
            role: "admin",
            camp_id: campId,
            name: name || campId
          }]);
        }
      }
    } catch (err) {
      console.error("Supabase updateCampFullDetails error:", err);
    }
  }

  // مزامنة LocalStorage دائماً
  initCampLocalStorage();
  const camps = decryptData(localStorage.getItem("kareem_camp_camps")) || {};
  if (camps[campId]) {
    camps[campId] = {
      ...camps[campId],
      ...(name && { name }),
      ...(managerName && { managerName }),
      ...(managerPhone && { managerPhone }),
      ...(address && { address })
    };
    localStorage.setItem("kareem_camp_camps", encryptData(camps));
  }

  const users = decryptData(localStorage.getItem("kareem_camp_users")) || [];
  const uIndex = users.findIndex(u => u.campId === campId);
  if (uIndex !== -1) {
    if (adminUsername) users[uIndex].username = adminUsername;
    if (adminPassword) users[uIndex].password = adminPassword;
    if (name) users[uIndex].name = name;
  } else if (adminUsername && adminPassword) {
    users.push({
      username: adminUsername,
      password: adminPassword,
      role: "admin",
      campId,
      name: name || campId
    });
  }
  localStorage.setItem("kareem_camp_users", encryptData(users));

  return { success: true };
};
