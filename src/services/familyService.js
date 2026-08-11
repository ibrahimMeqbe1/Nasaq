import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { encryptData, decryptData } from "../utils/security";
import {
  localStorageGet,
  localStorageSet,
  mapFamilyToSupabase,
  mapFamilyToLocal,
} from "./helpers";
import defaultFamilies from "./familiesDefault.json";

// ─── Constants ────────────────────────────────────────────────────────────────

const FAMILIES_KEY = "kareem_camp_families_v5";
const FAMILIES_CLEARED_KEY = "kareem_camp_families_cleared";

// ─── Local Storage helpers ────────────────────────────────────────────────────

const getFamiliesFromLocal = () => localStorageGet(FAMILIES_KEY, []);

const saveFamiliesToLocal = (families) => localStorageSet(FAMILIES_KEY, families);

const initLocalStorage = () => {
  if (typeof window === "undefined") return;
  const existing = localStorage.getItem(FAMILIES_KEY);
  if (!existing && localStorage.getItem(FAMILIES_CLEARED_KEY) !== "true") {
    saveFamiliesToLocal(defaultFamilies);
  }
};

// ─── Demo subscriber pub/sub ─────────────────────────────────────────────────

const demoSubscribers = new Set();

const notifyDemoSubscribers = () => {
  demoSubscribers.forEach((cb) => cb());
};

// ─── Supabase mapper ─────────────────────────────────────────────────────────

const mapSupabaseFamilyToJS = (row) => {
  let dob =
    row.dob || row.birth_date || row.date_of_birth || row.birthDate || row.birthdate || "";
  let wifeDob =
    row.wife_dob ||
    row.wife_birth_date ||
    row.wife_date_of_birth ||
    row.wifeDob ||
    row.wifebirthdate ||
    "";

  // مطابقة تلقائية لتواريخ الميلاد من القائمة الافتراضية في حال كانت فارغة
  const match = defaultFamilies.find(
    (df) => (df.idNumber && df.idNumber === row.id_number) || df.id === row.id
  );
  if (match) {
    if (!dob || dob === "-") dob = match.dob;
    if (!wifeDob || wifeDob === "-") wifeDob = match.wifeDob;
  }

  return {
    id: row.id,
    campId: row.camp_id,
    name: row.name,
    idNumber: row.id_number || "",
    phone: row.phone || "",
    membersCount: row.members_count || 1,
    location: row.location || "",
    status: row.status || "",
    dob: dob || "",
    wifeName: row.wife_name || "",
    wifeId: row.wife_id || "",
    wifeDob: wifeDob || "",
    notes: row.notes || "",
    createdAt: row.created_at || new Date().toISOString(),
  };
};

// ─── Demo data reader ─────────────────────────────────────────────────────────

const getDemoFamilies = (campId) => {
  if (typeof window === "undefined") return defaultFamilies;
  initLocalStorage();

  let families = getFamiliesFromLocal();

  // تهيئة البيانات الافتراضية إن كانت فارغة
  if (!families.length && localStorage.getItem(FAMILIES_CLEARED_KEY) !== "true") {
    families = defaultFamilies;
    saveFamiliesToLocal(families);
  } else if (families.length) {
    // تحديث تواريخ الميلاد الناقصة من البيانات الافتراضية
    let updated = false;
    families = families.map((f) => {
      const match = defaultFamilies.find(
        (df) => (df.idNumber && df.idNumber === f.idNumber) || df.id === f.id
      );
      if (match) {
        if (!f.dob || f.dob === "-") { f.dob = match.dob; updated = true; }
        if (!f.wifeDob || f.wifeDob === "-") { f.wifeDob = match.wifeDob; updated = true; }
      }
      return f;
    });
    if (updated) saveFamiliesToLocal(families);
  }

  return families
    .filter((f) => {
      if (!f.campId || f.campId === "kareem") return campId === "kareem";
      return f.campId === campId;
    })
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const subscribeFamilies = (campId, callback) => {
  if (isSupabaseConfigured) {
    const fetchAndNotify = async () => {
      try {
        const { data, error } = await supabase
          .from("families")
          .select("*")
          .order("created_at", { ascending: true });

        if (!error && data) {
          const target = campId || "kareem";
          const filtered = data.filter((f) => (f.camp_id || "kareem") === target);
          callback(filtered.map(mapSupabaseFamilyToJS));
          return;
        }
        callback(getDemoFamilies(campId));
      } catch {
        callback(getDemoFamilies(campId));
      }
    };

    fetchAndNotify();

    const channel = supabase
      .channel(`families_${campId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "families", filter: `camp_id=eq.${campId}` },
        () => fetchAndNotify()
      )
      .subscribe();

    const wrapper = () => fetchAndNotify();
    demoSubscribers.add(wrapper);

    return () => {
      supabase.removeChannel(channel);
      demoSubscribers.delete(wrapper);
    };
  }

  initLocalStorage();
  const wrapper = () => callback(getDemoFamilies(campId));
  demoSubscribers.add(wrapper);
  wrapper();
  return () => demoSubscribers.delete(wrapper);
};

/**
 * إضافة عائلة جديدة
 */
export const addFamily = async (campId, familyData) => {
  const id = familyData.id || "family_" + Date.now();

  if (isSupabaseConfigured) {
    try {
      await supabase.from("families").insert([mapFamilyToSupabase(campId, familyData, id)]);
    } catch (e) {
      console.warn("Supabase addFamily warning:", e);
    }
  }

  localStorage.removeItem(FAMILIES_CLEARED_KEY);
  initLocalStorage();
  const families = getFamiliesFromLocal().filter((f) => f.id !== id);
  families.push(mapFamilyToLocal(campId, familyData, id));
  saveFamiliesToLocal(families);
  notifyDemoSubscribers();
  return id;
};

/**
 * تعديل بيانات عائلة موجودة
 */
export const updateFamily = async (id, familyData) => {
  const updatedData = mapFamilyToLocal(null, familyData, id);

  if (isSupabaseConfigured) {
    try {
      const payload = mapFamilyToSupabase(null, familyData, id);
      // حذف الحقول التي لا تُحدَّث في Supabase بـ update
      delete payload.id;
      delete payload.camp_id;
      delete payload.created_at;
      await supabase.from("families").update(payload).eq("id", id);
    } catch (e) {
      console.warn("Supabase updateFamily warning:", e);
    }
  }

  initLocalStorage();
  const families = getFamiliesFromLocal();
  const index = families.findIndex((f) => f.id === id);
  if (index !== -1) {
    families[index] = { ...families[index], ...updatedData };
    saveFamiliesToLocal(families);
  }
  notifyDemoSubscribers();
};

/**
 * حذف سجل عائلة
 */
export const deleteFamily = async (id) => {
  if (isSupabaseConfigured) {
    try {
      await supabase.from("families").delete().eq("id", id);
    } catch (e) {
      console.warn("Supabase deleteFamily warning:", e);
    }
  }

  initLocalStorage();
  saveFamiliesToLocal(getFamiliesFromLocal().filter((f) => f.id !== id));
  notifyDemoSubscribers();
};

/**
 * استيراد العائلات الافتراضية بالكامل لمخيم محدد
 */
export const importDefaultFamiliesToSupabase = async (campId) => {
  if (!isSupabaseConfigured) {
    return { success: false, error: "النظام يعمل حالياً في الوضع التجريبي. يرجى ربط Supabase." };
  }

  try {
    const rows = defaultFamilies.map((f, i) =>
      mapFamilyToSupabase(campId, f, f.id || `csv-${i}-${Date.now()}`)
    );
    const { error } = await supabase.from("families").upsert(rows);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error during bulk import to Supabase:", error);
    return { success: false, error: error.message };
  }
};

// الاسم القديم للتوافق مع الكود الموجود
export const importDefaultFamiliesToFirestore = importDefaultFamiliesToSupabase;

/**
 * استيراد دفعة عائلات دفعة واحدة بشكل سريع
 */
export const batchAddFamilies = async (campId, familyList) => {
  if (!familyList || familyList.length === 0) return true;

  if (isSupabaseConfigured) {
    try {
      const rows = familyList.map((f, i) =>
        mapFamilyToSupabase(campId, f, f.id || `family_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`)
      );
      const chunkSize = 100;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const { error } = await supabase.from("families").upsert(rows.slice(i, i + chunkSize));
        if (error) console.error("Error upserting families chunk:", error);
      }
    } catch (err) {
      console.warn("Supabase batchAddFamilies error, falling back to local:", err);
    }
  }

  localStorage.removeItem(FAMILIES_CLEARED_KEY);
  initLocalStorage();
  const existing = getFamiliesFromLocal();
  const newEntries = familyList.map((f, i) =>
    mapFamilyToLocal(campId, f, f.id || `family_${Date.now()}_${i}`)
  );
  saveFamiliesToLocal([...existing, ...newEntries]);
  notifyDemoSubscribers();
  return true;
};

/**
 * حذف جميع عائلات المخيم الحالي
 */
export const deleteAllFamilies = async (campId) => {
  if (isSupabaseConfigured) {
    try {
      await supabase.from("families").delete().eq("camp_id", campId);
    } catch (e) {
      console.warn("Supabase deleteAllFamilies error:", e);
    }
  }

  saveFamiliesToLocal([]);
  localStorage.setItem(FAMILIES_CLEARED_KEY, "true");
  notifyDemoSubscribers();
};
