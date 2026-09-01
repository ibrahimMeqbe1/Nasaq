import { supabase, isSupabaseConfigured } from "../lib/supabase";
import {
  assertSupabaseSuccess,
  createRecordId,
  localStorageGet,
  localStorageSet,
  mapFamilyToSupabase,
  mapFamilyToLocal,
} from "./helpers";
import { enqueueMutation } from "../lib/syncEngine";

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

// ─── Subscribers pub/sub ──────────────────────────────────────────────────────

const demoSubscribers = new Set();
const notifyDemoSubscribers = () => {
  demoSubscribers.forEach((cb) => cb());
};

// ─── Supabase mapper ──────────────────────────────────────────────────────────

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

  // Central Database API with local cache
  initLocalStorage();
  const fetchFromApi = async () => {
    try {
      const res = await fetch(`/api/families?campId=${encodeURIComponent(campId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.families)) {
          if (data.families.length > 0 || localStorage.getItem(FAMILIES_CLEARED_KEY) === "true") {
            saveFamiliesToLocal(data.families);
            callback(data.families, null);
            return;
          }
        }
      }
    } catch (e) {
      console.warn("API families sync notice:", e);
    }
    callback(getDemoFamilies(campId), null);
  };

  fetchFromApi();

  const wrapper = () => fetchFromApi();
  demoSubscribers.add(wrapper);
  return () => demoSubscribers.delete(wrapper);
};

/**
 * إضافة عائلة جديدة
 */
export const addFamily = async (campId, familyData) => {
  const effectiveCampId = (campId && campId !== "system") ? campId : "kareem";
  const id = familyData.id || createRecordId("family");
  const localFamily = mapFamilyToLocal(effectiveCampId, familyData, id);

  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from("families")
      .insert([mapFamilyToSupabase(effectiveCampId, familyData, id)]);
    assertSupabaseSuccess(error, "حفظ العائلة");
    return id;
  }

  // Save to Central API or Enqueue Offline
  let apiSucceeded = false;
  try {
    const res = await fetch("/api/families", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campId: effectiveCampId, family: { ...familyData, id } }),
    });
    if (res.ok) {
      apiSucceeded = true;
    } else {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "تعذر حفظ العائلة في قاعدة البيانات");
    }
  } catch (e) {
    console.warn("API save notice (Offline Mode):", e);
    throw e;
  }

  localStorage.removeItem(FAMILIES_CLEARED_KEY);
  initLocalStorage();
  const families = getFamiliesFromLocal().filter((f) => f.id !== id);
  families.push(localFamily);
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

  // Update in Central API or Enqueue Offline
  let apiSucceeded = false;
  try {
    const res = await fetch("/api/families", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...familyData }),
    });
    if (res.ok) {
      apiSucceeded = true;
    } else {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "تعذر تحديث بيانات العائلة");
    }
  } catch (e) {
    console.warn("API update notice (Offline Mode):", e);
    throw e;
  }

  initLocalStorage();
  const families = getFamiliesFromLocal();
  const index = families.findIndex((f) => f.id === id);
  if (index !== -1) {
    families[index] = { ...families[index], ...updatedData };
    saveFamiliesToLocal(families);
  }
  notifyDemoSubscribers();
  return true;
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

  // Delete in Central API or Enqueue Offline
  let apiSucceeded = false;
  try {
    const res = await fetch(`/api/families?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) {
      apiSucceeded = true;
    } else {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "تعذر حذف سجل العائلة");
    }
  } catch (e) {
    console.warn("API delete notice (Offline Mode):", e);
    throw e;
  }

  initLocalStorage();
  saveFamiliesToLocal(getFamiliesFromLocal().filter((f) => f.id !== id));
  notifyDemoSubscribers();
  return true;
};

/**
 * استيراد العائلات الافتراضية
 */
export const importDefaultFamiliesToSupabase = async (campId) => {
  const defaultFamilies = await loadDefaultFamilies();
  return await batchAddFamilies(campId, defaultFamilies);
};

export const importDefaultFamiliesToFirestore = importDefaultFamiliesToSupabase;

/**
 * استيراد دفعة عائلات دفعة واحدة
 */
export const batchAddFamilies = async (campId, familyList) => {
  if (!familyList || familyList.length === 0) return true;
  const effectiveCampId = (campId && campId !== "system") ? campId : "kareem";

  if (isSupabaseConfigured) {
    const rows = familyList.map((family) =>
      mapFamilyToSupabase(effectiveCampId, family, family.id || createRecordId("family"))
    );
    const chunkSize = 100;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const { error } = await supabase.from("families").upsert(rows.slice(i, i + chunkSize));
      assertSupabaseSuccess(error, "استيراد سجلات العائلات");
    }
    return true;
  }

  const mappedBatch = familyList.map((f) =>
    mapFamilyToLocal(effectiveCampId, f, f.id || createRecordId("family"))
  );

  // Save to Central API or Enqueue Offline
  let apiSucceeded = false;
  try {
    const res = await fetch("/api/families", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campId: effectiveCampId,
        action: "batch",
        families: mappedBatch,
      }),
    });
    if (res.ok) {
      apiSucceeded = true;
    } else {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "فشل حفظ الدفعة في قاعدة البيانات");
    }
  } catch (e) {
    console.error("API batch save error:", e);
    throw e;
  }

  localStorage.removeItem(FAMILIES_CLEARED_KEY);
  initLocalStorage();
  const existing = getFamiliesFromLocal();
  saveFamiliesToLocal([...existing, ...mappedBatch]);
  notifyDemoSubscribers();
  return true;
};

/**
 * حذف جميع عائلات المخيم الحالي
 */
export const deleteAllFamilies = async (campId) => {
  const effectiveCampId = (campId && campId !== "system") ? campId : "kareem";
  if (isSupabaseConfigured) {
    const { error } = await supabase.from("families").delete().eq("camp_id", effectiveCampId);
    assertSupabaseSuccess(error, "مسح كشف العائلات");
    return true;
  }

  // Delete all in Central API or Enqueue Offline
  let apiSucceeded = false;
  try {
    const res = await fetch(`/api/families?campId=${encodeURIComponent(effectiveCampId)}&action=all`, { method: "DELETE" });
    if (res.ok) {
      apiSucceeded = true;
    } else {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "فشل مسح كشف العائلات");
    }
  } catch (e) {
    console.error("API delete all error:", e);
    throw e;
  }

  saveFamiliesToLocal([]);
  localStorage.setItem(FAMILIES_CLEARED_KEY, "true");
  notifyDemoSubscribers();
  return true;
};
