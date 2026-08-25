import { supabase, isSupabaseConfigured } from "../lib/supabase";
import {
  assertSupabaseSuccess,
  createRecordId,
  localStorageGet,
  localStorageSet,
  mapFamilyToSupabase,
  mapFamilyToLocal,
} from "./helpers";

const loadDefaultFamilies = async () => (await import("./familiesDefault.json")).default;

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
    saveFamiliesToLocal([]);
  }
};

// ─── Demo subscriber pub/sub ─────────────────────────────────────────────────

const demoSubscribers = new Set();

const notifyDemoSubscribers = () => {
  demoSubscribers.forEach((cb) => cb());
};

// ─── Supabase mapper ─────────────────────────────────────────────────────────

const mapSupabaseFamilyToJS = (row) => {
  return {
    id: row.id,
    campId: row.camp_id,
    name: row.name,
    idNumber: row.id_number || "",
    phone: row.phone || "",
    membersCount: row.members_count || 1,
    location: row.location || "",
    status: row.status || "",
    dob: row.dob || "",
    wifeName: row.wife_name || "",
    wifeId: row.wife_id || "",
    wifeDob: row.wife_dob || "",
    notes: row.notes || "",
    createdAt: row.created_at || new Date().toISOString(),
  };
};

// ─── Demo data reader ─────────────────────────────────────────────────────────

const getDemoFamilies = (campId) => {
  if (typeof window === "undefined") return [];
  initLocalStorage();

  const families = getFamiliesFromLocal();

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
          .eq("camp_id", campId)
          .order("created_at", { ascending: true });
        assertSupabaseSuccess(error, "تحميل سجلات العائلات");
        callback((data || []).map(mapSupabaseFamilyToJS), null);
      } catch (error) {
        callback(null, error);
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
  const id = familyData.id || createRecordId("family");

  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from("families")
      .insert([mapFamilyToSupabase(campId, familyData, id)]);
    assertSupabaseSuccess(error, "حفظ العائلة");
    return id;
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
    const payload = mapFamilyToSupabase(null, familyData, id);
    delete payload.id;
    delete payload.camp_id;
    delete payload.created_at;
    const { data, error } = await supabase
      .from("families")
      .update(payload)
      .eq("id", id)
      .select("id");
    assertSupabaseSuccess(error, "تحديث العائلة");
    if (!data?.length) throw new Error("لم يتم العثور على سجل العائلة أو لا تملك صلاحية تعديله.");
    return true;
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
    const { data, error } = await supabase.from("families").delete().eq("id", id).select("id");
    assertSupabaseSuccess(error, "حذف العائلة");
    if (!data?.length) throw new Error("لم يتم العثور على سجل العائلة أو لا تملك صلاحية حذفه.");
    return true;
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
    const defaultFamilies = await loadDefaultFamilies();
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
    const rows = familyList.map((family) =>
      mapFamilyToSupabase(campId, family, family.id || createRecordId("family"))
    );
    const chunkSize = 100;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const { error } = await supabase.from("families").upsert(rows.slice(i, i + chunkSize));
      assertSupabaseSuccess(error, "استيراد سجلات العائلات");
    }
    return true;
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
    const { error } = await supabase.from("families").delete().eq("camp_id", campId);
    assertSupabaseSuccess(error, "مسح كشف العائلات");
    return true;
  }

  saveFamiliesToLocal([]);
  localStorage.setItem(FAMILIES_CLEARED_KEY, "true");
  notifyDemoSubscribers();
};
