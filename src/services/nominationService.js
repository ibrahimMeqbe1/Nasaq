import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { encryptData, decryptData } from "../utils/security";
import { assertSupabaseSuccess, createRecordId } from "./helpers";
import { enqueueMutation } from "../lib/syncEngine";

const loadDefaultNominations = async () => (await import("./nominationsDefault.json")).default;

const initLocalStorage = () => {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem("kareem_camp_nominations_v3") && !localStorage.getItem("kareem_camp_nominations_cleared")) {
    localStorage.setItem("kareem_camp_nominations_v3", encryptData([]));
  }
};

const demoSubscribers = new Set();
const notifyDemoSubscribers = () => {
  demoSubscribers.forEach((cb) => cb());
};

const getDemoNominations = (campId) => {
  if (typeof window === "undefined") return [];
  initLocalStorage();
  const ciphertext = localStorage.getItem("kareem_camp_nominations_v3");
  const data = ciphertext ? decryptData(ciphertext) : null;
  const nominations = data || [];

  const filtered = nominations.filter((n) => {
    if (!n.campId || n.campId === "kareem") {
      return campId === "kareem";
    }
    return n.campId === campId;
  });

  return filtered.sort((a, b) => (a.serialNo || 0) - (b.serialNo || 0));
};

const mapSupabaseNominationToJS = (row) => ({
  id: row.id,
  campId: row.camp_id,
  serialNo: row.serial_no || 0,
  name: row.name,
  idNumber: row.id_number || "",
  gender: row.gender || "ذكر",
  status: row.status || "متزوج",
  phone: row.phone || "",
  phoneAlt: row.phone_alt || "",
  wifeName: row.wife_name || "",
  wifeId: row.wife_id || "",
  wife2Name: row.wife_2_name || "",
  wife2Id: row.wife_2_id || "",
  membersCount: row.members_count || 1,
  age_0_2_male: row.age_0_2_male || 0,
  age_0_2_female: row.age_0_2_female || 0,
  age_3_5_male: row.age_3_5_male || 0,
  age_3_5_female: row.age_3_5_female || 0,
  age_6_18_male: row.age_6_18_male || 0,
  age_6_18_female: row.age_6_18_female || 0,
  age_19_60_male: row.age_19_60_male || 0,
  age_19_60_female: row.age_19_60_female || 0,
  age_over_60_male: row.age_over_60_male || 0,
  age_over_60_female: row.age_over_60_female || 0,
  hasDisabled: row.has_disabled || 0,
  hasChronicDisease: row.has_chronic_disease || 0,
  isLactatingOrPregnant: row.is_lactating_or_pregnant || 0,
  isFemaleHeaded: row.is_female_headed || 0,
  currentAddress: row.current_address || row.location || "",
  originalAddress: row.original_address || "",
  governorate: row.governorate || "شمال غزة",
  campName: row.camp_name || "نظام إدارة المخيمات",
  shelterManager: row.shelter_manager || "",
  shelterPhone: row.shelter_phone || "",
  shelterPhoneAlt: row.shelter_phone_alt || "",
  shelterAddress: row.shelter_address || "",
  shelterGps: row.shelter_gps || "",
  dob: row.dob || row.birth_date || row.date_of_birth || row.birthDate || "",
  wifeDob: row.wife_dob || row.wife_birth_date || row.wife_date_of_birth || row.wifeDob || "",
  notes: row.notes || "",
  createdAt: row.created_at || new Date().toISOString(),
});

export const subscribeNominations = (campId, callback) => {
  if (isSupabaseConfigured) {
    const fetchAndNotify = async () => {
      try {
        const { data, error } = await supabase
          .from("nominations")
          .select("*")
          .eq("camp_id", campId)
          .order("created_at", { ascending: true });
        assertSupabaseSuccess(error, "تحميل كشف الترشيحات");
        callback((data || []).map(mapSupabaseNominationToJS), null);
      } catch (error) {
        callback(null, error);
      }
    };

    fetchAndNotify();

    const channel = supabase
      .channel(`nominations_${campId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nominations", filter: `camp_id=eq.${campId}` },
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
      const res = await fetch(`/api/nominations?campId=${encodeURIComponent(campId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.nominations)) {
          if (data.nominations.length > 0 || localStorage.getItem("kareem_camp_nominations_cleared") === "true") {
            localStorage.setItem("kareem_camp_nominations_v3", encryptData(data.nominations));
            callback(data.nominations, null);
            return;
          }
        }
      }
    } catch (e) {
      console.warn("API nominations sync notice:", e);
    }
    callback(getDemoNominations(campId), null);
  };

  fetchFromApi();

  const wrapper = () => fetchFromApi();
  demoSubscribers.add(wrapper);
  return () => demoSubscribers.delete(wrapper);
};

const cleanPhone = (val) => {
  if (!val) return "";
  let str = String(val).trim();
  if (/^\d+$/.test(str)) {
    if (!str.startsWith("0") && str.length === 9) {
      str = "0" + str;
    }
  }
  return str;
};

const getNum = (val) => {
  const parsed = parseInt(val);
  return isNaN(parsed) ? 0 : parsed;
};

const mapNominationToSupabase = (campId, nomData, id) => ({
  ...(id !== undefined && { id }),
  ...(campId !== undefined && campId !== null && { camp_id: campId }),
  serial_no: getNum(nomData.serialNo),
  name: (nomData.name || "").trim(),
  id_number: (nomData.idNumber || "").trim(),
  gender: nomData.gender || "ذكر",
  status: nomData.status || "متزوج",
  phone: cleanPhone(nomData.phone),
  phone_alt: cleanPhone(nomData.phoneAlt),
  wife_name: (nomData.wifeName || "").trim(),
  wife_id: (nomData.wifeId || "").trim(),
  wife_2_name: (nomData.wife2Name || "").trim(),
  wife_2_id: (nomData.wife2Id || "").trim(),
  members_count: getNum(nomData.membersCount) || 1,
  age_0_2_male: getNum(nomData.age_0_2_male ?? nomData.age02Male),
  age_0_2_female: getNum(nomData.age_0_2_female ?? nomData.age02Female),
  age_3_5_male: getNum(nomData.age_3_5_male ?? nomData.age35Male),
  age_3_5_female: getNum(nomData.age_3_5_female ?? nomData.age35Female),
  age_6_18_male: getNum(nomData.age_6_18_male ?? nomData.age618Male),
  age_6_18_female: getNum(nomData.age_6_18_female ?? nomData.age618Female),
  age_19_60_male: getNum(nomData.age_19_60_male ?? nomData.age1960Male),
  age_19_60_female: getNum(nomData.age_19_60_female ?? nomData.age1960Female),
  age_over_60_male: getNum(nomData.age_over_60_male ?? nomData.ageOver60Male),
  age_over_60_female: getNum(nomData.age_over_60_female ?? nomData.ageOver60Female),
  has_disabled: nomData.hasDisabled ? 1 : 0,
  has_chronic_disease: nomData.hasChronicDisease ? 1 : 0,
  is_lactating_or_pregnant: nomData.isLactatingOrPregnant ? 1 : 0,
  is_female_headed: nomData.isFemaleHeaded ? 1 : 0,
  is_child_headed: nomData.isChildHeaded ? 1 : 0,
  location: (nomData.currentAddress || nomData.location || "").trim(),
  current_address: (nomData.currentAddress || nomData.location || "").trim(),
  original_address: (nomData.originalAddress || "").trim(),
  governorate: nomData.governorate || "شمال غزة",
  camp_name: (nomData.campName || "").trim(),
  shelter_manager: (nomData.shelterManager || "").trim(),
  shelter_phone: cleanPhone(nomData.shelterPhone),
  shelter_phone_alt: cleanPhone(nomData.shelterPhoneAlt),
  shelter_address: (nomData.shelterAddress || "").trim(),
  shelter_gps: (nomData.shelterGps || "").trim(),
  dob: (nomData.dob || "").trim(),
  wife_dob: (nomData.wifeDob || "").trim(),
  notes: (nomData.notes || "").trim(),
  ...(nomData.createdAt && { created_at: nomData.createdAt }),
});

/**
 * إضافة ترشيح جديد
 */
export const addNomination = async (campId, nomData) => {
  const customId = nomData.id || createRecordId("nom");

  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from("nominations")
      .insert([{ ...mapNominationToSupabase(campId, nomData, customId), created_at: new Date().toISOString() }]);
    assertSupabaseSuccess(error, "حفظ الترشيح");
    return customId;
  }

  const newNomination = {
    ...nomData,
    id: customId,
    campId,
    serialNo: nomData.serialNo || 0,
    name: (nomData.name || "").trim(),
    idNumber: (nomData.idNumber || "").trim(),
    gender: nomData.gender || "ذكر",
    status: nomData.status || "متزوج",
    phone: cleanPhone(nomData.phone),
    phoneAlt: cleanPhone(nomData.phoneAlt),
    wifeName: nomData.wifeName ? nomData.wifeName.trim() : "",
    wifeId: nomData.wifeId ? nomData.wifeId.trim() : "",
    wife2Name: nomData.wife2Name ? nomData.wife2Name.trim() : "",
    wife2Id: nomData.wife2Id ? nomData.wife2Id.trim() : "",
    membersCount: getNum(nomData.membersCount) || 1,
    hasDisabled: nomData.hasDisabled ? 1 : 0,
    hasChronicDisease: nomData.hasChronicDisease ? 1 : 0,
    isLactatingOrPregnant: nomData.isLactatingOrPregnant ? 1 : 0,
    isFemaleHeaded: nomData.isFemaleHeaded ? 1 : 0,
    currentAddress: nomData.currentAddress ? nomData.currentAddress.trim() : "",
    originalAddress: nomData.originalAddress ? nomData.originalAddress.trim() : "",
    governorate: nomData.governorate || "شمال غزة",
    campName: nomData.campName ? nomData.campName.trim() : "نظام إدارة المخيمات",
    shelterManager: nomData.shelterManager ? nomData.shelterManager.trim() : "",
    shelterPhone: cleanPhone(nomData.shelterPhone),
    shelterPhoneAlt: cleanPhone(nomData.shelterPhoneAlt),
    shelterAddress: nomData.shelterAddress ? nomData.shelterAddress.trim() : "",
    shelterGps: nomData.shelterGps ? nomData.shelterGps.trim() : "",
    createdAt: new Date().toISOString(),
  };

  // Save to Central API or Enqueue Offline
  let apiSucceeded = false;
  try {
    const res = await fetch("/api/nominations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campId, nomination: newNomination }),
    });
    if (res.ok) apiSucceeded = true;
  } catch (e) {
    console.warn("API save nomination notice (Offline Mode):", e);
  }

  if (!apiSucceeded) {
    enqueueMutation({
      entity: "nomination",
      type: "add",
      campId,
      payload: newNomination,
    });
  }

  localStorage.removeItem("kareem_camp_nominations_cleared");
  initLocalStorage();
  const ciphertext = localStorage.getItem("kareem_camp_nominations_v3");
  let nominations = ciphertext ? decryptData(ciphertext) : [];
  nominations = nominations.filter((n) => n.id !== customId);
  nominations.push(newNomination);
  localStorage.setItem("kareem_camp_nominations_v3", encryptData(nominations));
  notifyDemoSubscribers();
  return customId;
};

/**
 * تعديل ترشيح
 */
export const updateNomination = async (id, nomData) => {
  const updatedNom = {
    ...nomData,
    name: (nomData.name || "").trim(),
    idNumber: (nomData.idNumber || "").trim(),
    gender: nomData.gender || "ذكر",
    status: nomData.status || "متزوج",
    phone: cleanPhone(nomData.phone),
    phoneAlt: cleanPhone(nomData.phoneAlt),
    wifeName: nomData.wifeName ? nomData.wifeName.trim() : "",
    wifeId: nomData.wifeId ? nomData.wifeId.trim() : "",
    wife2Name: nomData.wife2Name ? nomData.wife2Name.trim() : "",
    wife2Id: nomData.wife2Id ? nomData.wife2Id.trim() : "",
    membersCount: getNum(nomData.membersCount) || 1,
    hasDisabled: nomData.hasDisabled ? 1 : 0,
    hasChronicDisease: nomData.hasChronicDisease ? 1 : 0,
    isLactatingOrPregnant: nomData.isLactatingOrPregnant ? 1 : 0,
    isFemaleHeaded: nomData.isFemaleHeaded ? 1 : 0,
    isChildHeaded: nomData.isChildHeaded ? 1 : 0,
    currentAddress: nomData.currentAddress ? nomData.currentAddress.trim() : "",
    originalAddress: nomData.originalAddress ? nomData.originalAddress.trim() : "",
    governorate: nomData.governorate || "شمال غزة",
    campName: nomData.campName ? nomData.campName.trim() : "نظام إدارة المخيمات",
    shelterManager: nomData.shelterManager ? nomData.shelterManager.trim() : "",
    shelterPhone: cleanPhone(nomData.shelterPhone),
    shelterPhoneAlt: cleanPhone(nomData.shelterPhoneAlt),
    shelterAddress: nomData.shelterAddress ? nomData.shelterAddress.trim() : "",
    shelterGps: nomData.shelterGps ? nomData.shelterGps.trim() : "",
  };

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("nominations")
      .update(mapNominationToSupabase(null, nomData))
      .eq("id", id)
      .select("id");
    assertSupabaseSuccess(error, "تحديث الترشيح");
    if (!data?.length) throw new Error("لم يتم العثور على الترشيح أو لا تملك صلاحية تعديله.");
    return true;
  }

  // Update in Central API or Enqueue Offline
  let apiSucceeded = false;
  try {
    const res = await fetch("/api/nominations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updatedNom }),
    });
    if (res.ok) apiSucceeded = true;
  } catch (e) {
    console.warn("API update nomination notice (Offline Mode):", e);
  }

  if (!apiSucceeded) {
    enqueueMutation({
      entity: "nomination",
      type: "update",
      recordId: id,
      payload: { id, ...updatedNom },
    });
  }

  initLocalStorage();
  const ciphertext = localStorage.getItem("kareem_camp_nominations_v3");
  const nominations = ciphertext ? decryptData(ciphertext) : [];
  const index = nominations.findIndex((n) => n.id === id);
  if (index !== -1) {
    nominations[index] = { ...nominations[index], ...updatedNom };
    localStorage.setItem("kareem_camp_nominations_v3", encryptData(nominations));
  }
  notifyDemoSubscribers();
  return true;
};

/**
 * حذف ترشيح
 */
export const deleteNomination = async (id) => {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from("nominations").delete().eq("id", id).select("id");
    assertSupabaseSuccess(error, "حذف الترشيح");
    if (!data?.length) throw new Error("لم يتم العثور على الترشيح أو لا تملك صلاحية حذفه.");
    return true;
  }

  // Delete in Central API or Enqueue Offline
  let apiSucceeded = false;
  try {
    const res = await fetch(`/api/nominations?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) apiSucceeded = true;
  } catch (e) {
    console.warn("API delete nomination notice (Offline Mode):", e);
  }

  if (!apiSucceeded) {
    enqueueMutation({
      entity: "nomination",
      type: "delete",
      recordId: id,
    });
  }

  initLocalStorage();
  const ciphertext = localStorage.getItem("kareem_camp_nominations_v3");
  let nominations = ciphertext ? decryptData(ciphertext) : [];
  nominations = nominations.filter((n) => n.id !== id);
  localStorage.setItem("kareem_camp_nominations_v3", encryptData(nominations));
  notifyDemoSubscribers();
  return true;
};

/**
 * استيراد الترشيحات الافتراضية
 */
export const importDefaultNominationsToFirestore = async (campId) => {
  const defaultNominations = await loadDefaultNominations();
  return await batchAddNominations(campId, defaultNominations);
};

/**
 * استيراد دفعة ترشيحات دفعة واحدة
 */
export const batchAddNominations = async (campId, nomList) => {
  if (!nomList || nomList.length === 0) return true;
  const effectiveCampId = (campId && campId !== "system") ? campId : "kareem";

  if (isSupabaseConfigured) {
    const rows = nomList.map((nom) => ({
      ...mapNominationToSupabase(effectiveCampId, nom, nom.id || createRecordId("nom")),
      created_at: nom.createdAt || new Date().toISOString(),
    }));
    const chunkSize = 100;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const { error } = await supabase.from("nominations").upsert(rows.slice(i, i + chunkSize));
      assertSupabaseSuccess(error, "استيراد كشف الترشيحات");
    }
    return true;
  }

  const mappedBatch = nomList.map((n, i) => ({
    ...n,
    id: n.id || createRecordId("nom"),
    campId: effectiveCampId,
    name: (n.name || "").trim(),
    idNumber: (n.idNumber || "").trim(),
    phone: (n.phone || "").trim(),
    membersCount: parseInt(n.membersCount) || 1,
    currentAddress: (n.currentAddress || n.location || "").trim(),
    status: n.status || "متزوج",
    hasDisabled: n.hasDisabled ? 1 : 0,
    hasChronicDisease: n.hasChronicDisease ? 1 : 0,
    isLactatingOrPregnant: n.isLactatingOrPregnant ? 1 : 0,
    isFemaleHeaded: n.isFemaleHeaded ? 1 : 0,
    dob: (n.dob || "").trim(),
    wifeName: (n.wifeName || "").trim(),
    wifeId: (n.wifeId || "").trim(),
    wifeDob: (n.wifeDob || "").trim(),
    notes: (n.notes || "").trim(),
    createdAt: n.createdAt || new Date().toISOString(),
  }));

  // Save to Central API or Enqueue Offline
  let apiSucceeded = false;
  try {
    const res = await fetch("/api/nominations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campId: effectiveCampId,
        action: "batch",
        nominations: mappedBatch,
      }),
    });
    if (res.ok) {
      apiSucceeded = true;
    } else {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "فشل حفظ الترشيحات في قاعدة البيانات");
    }
  } catch (e) {
    console.error("API batch nominations error:", e);
    throw e;
  }

  localStorage.removeItem("kareem_camp_nominations_cleared");
  initLocalStorage();
  const ciphertext = localStorage.getItem("kareem_camp_nominations_v3");
  let nominations = ciphertext ? decryptData(ciphertext) : [];
  localStorage.setItem("kareem_camp_nominations_v3", encryptData([...nominations, ...mappedBatch]));
  notifyDemoSubscribers();
  return true;
};

/**
 * حذف جميع ترشيحات المخيم الحالي
 */
export const deleteAllNominations = async (campId) => {
  const effectiveCampId = (campId && campId !== "system") ? campId : "kareem";
  if (isSupabaseConfigured) {
    const { error } = await supabase.from("nominations").delete().eq("camp_id", effectiveCampId);
    assertSupabaseSuccess(error, "مسح كشف الترشيحات");
    return true;
  }

  // Delete all in Central API or Enqueue Offline
  let apiSucceeded = false;
  try {
    const res = await fetch(`/api/nominations?campId=${encodeURIComponent(effectiveCampId)}&action=all`, { method: "DELETE" });
    if (res.ok) {
      apiSucceeded = true;
    } else {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "فشل مسح كشف الترشيحات");
    }
  } catch (e) {
    console.error("API delete all nominations error:", e);
    throw e;
  }

  localStorage.setItem("kareem_camp_nominations_v3", encryptData([]));
  localStorage.setItem("kareem_camp_nominations_cleared", "true");
  notifyDemoSubscribers();
};
