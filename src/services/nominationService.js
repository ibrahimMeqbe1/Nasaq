import { supabase, isSupabaseConfigured, isDemoMode } from "../lib/supabase";
import defaultNominations from "./nominationsDefault.json";
import { encryptData, decryptData } from "../utils/security";

const initLocalStorage = () => {
  if (!localStorage.getItem("kareem_camp_nominations_v3") && !localStorage.getItem("kareem_camp_nominations_cleared")) {
    localStorage.setItem("kareem_camp_nominations_v3", encryptData(defaultNominations));
  }
};

const demoSubscribers = new Set();

const notifyDemoSubscribers = () => {
  demoSubscribers.forEach(cb => cb());
};

const getDemoNominations = (campId) => {
  initLocalStorage();
  const ciphertext = localStorage.getItem("kareem_camp_nominations_v3");
  const data = ciphertext ? decryptData(ciphertext) : null;
  const nominations = data || [];
  
  const filtered = nominations.filter(n => {
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
  createdAt: row.created_at || new Date().toISOString()
});

export const subscribeNominations = (campId, callback) => {
  if (isSupabaseConfigured) {
    const fetchAndNotify = async () => {
      try {
        const { data, error } = await supabase
          .from("nominations")
          .select("*")
          .order("created_at", { ascending: true });

        if (!error && data) {
          const target = campId || "kareem";
          const filtered = data.filter(n => (n.camp_id || "kareem") === target);
          callback(filtered.map(mapSupabaseNominationToJS));
          return;
        }

        callback(getDemoNominations(campId));
      } catch (e) {
        callback(getDemoNominations(campId));
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

    const wrapper = () => {
      fetchAndNotify();
    };
    demoSubscribers.add(wrapper);

    return () => {
      supabase.removeChannel(channel);
      demoSubscribers.delete(wrapper);
    };
  }

  initLocalStorage();
  const wrapper = () => {
    callback(getDemoNominations(campId));
  };
  demoSubscribers.add(wrapper);
  wrapper();
  return () => {
    demoSubscribers.delete(wrapper);
  };
};

const cleanPhone = (val) => {
  if (!val) return '';
  let str = String(val).trim();
  if (/^\d+$/.test(str)) {
    if (!str.startsWith('0') && str.length === 9) {
      str = '0' + str;
    }
  }
  return str;
};

const getNum = (val) => {
  const parsed = parseInt(val);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * إضافة ترشيح جديد
 * @param {string} campId - معرّف المخيم
 * @param {Object} nomData - بيانات الترشيح
 */
export const addNomination = async (campId, nomData) => {
  const customId = nomData.id || "nom_" + Date.now();
  
  if (isSupabaseConfigured) {
    try {
      const payload = {
        id: customId,
        camp_id: campId,
        name: nomData.name.trim(),
        id_number: nomData.idNumber.trim(),
        phone: cleanPhone(nomData.phone),
        members_count: getNum(nomData.membersCount) || 1,
        location: nomData.currentAddress ? nomData.currentAddress.trim() : (nomData.location || ""),
        status: nomData.status || "متزوج",
        has_disabled: nomData.hasDisabled ? 1 : 0,
        has_chronic_disease: nomData.hasChronicDisease ? 1 : 0,
        is_lactating_or_pregnant: nomData.isLactatingOrPregnant ? 1 : 0,
        is_female_headed: nomData.isFemaleHeaded ? 1 : 0,
        dob: nomData.dob ? nomData.dob.trim() : "",
        wife_name: nomData.wifeName ? nomData.wifeName.trim() : "",
        wife_id: nomData.wifeId ? nomData.wifeId.trim() : "",
        wife_dob: nomData.wifeDob ? nomData.wifeDob.trim() : "",
        notes: nomData.notes ? nomData.notes.trim() : "",
        created_at: new Date().toISOString()
      };
      await supabase.from("nominations").insert([payload]);
    } catch (e) {
      console.warn("Supabase addNomination warning:", e);
    }
  }

  const newNomination = {
    id: customId,
    campId,
    serialNo: nomData.serialNo || 0,
    name: nomData.name.trim(),
    idNumber: nomData.idNumber.trim(),
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
    createdAt: new Date().toISOString()
  };

  localStorage.removeItem("kareem_camp_nominations_cleared");
  initLocalStorage();
  const ciphertext = localStorage.getItem("kareem_camp_nominations_v3");
  let nominations = ciphertext ? decryptData(ciphertext) : [];
  nominations = nominations.filter(n => n.id !== customId);
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
    name: nomData.name.trim(),
    idNumber: nomData.idNumber.trim(),
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
    shelterGps: nomData.shelterGps ? nomData.shelterGps.trim() : ""
  };

  if (isSupabaseConfigured) {
    try {
      const payload = {
        name: updatedNom.name,
        id_number: updatedNom.idNumber,
        phone: updatedNom.phone,
        members_count: updatedNom.membersCount,
        location: updatedNom.currentAddress,
        status: updatedNom.status,
        has_disabled: updatedNom.hasDisabled,
        has_chronic_disease: updatedNom.hasChronicDisease,
        is_lactating_or_pregnant: updatedNom.isLactatingOrPregnant,
        is_female_headed: updatedNom.isFemaleHeaded,
        dob: nomData.dob ? nomData.dob.trim() : "",
        wife_name: updatedNom.wifeName,
        wife_id: updatedNom.wifeId,
        wife_dob: nomData.wifeDob ? nomData.wifeDob.trim() : "",
        notes: nomData.notes ? nomData.notes.trim() : ""
      };
      await supabase.from("nominations").update(payload).eq("id", id);
    } catch (e) {
      console.warn("Supabase updateNomination warning:", e);
    }
  }

  initLocalStorage();
  const ciphertext = localStorage.getItem("kareem_camp_nominations_v3");
  const nominations = ciphertext ? decryptData(ciphertext) : [];
  const index = nominations.findIndex(n => n.id === id);
  if (index !== -1) {
    nominations[index] = { ...nominations[index], ...updatedNom };
    localStorage.setItem("kareem_camp_nominations_v3", encryptData(nominations));
  }
  notifyDemoSubscribers();
};

/**
 * حذف ترشيح
 */
export const deleteNomination = async (id) => {
  if (isSupabaseConfigured) {
    try {
      await supabase.from("nominations").delete().eq("id", id);
    } catch (e) {
      console.warn("Supabase deleteNomination warning:", e);
    }
  }

  initLocalStorage();
  const ciphertext = localStorage.getItem("kareem_camp_nominations_v3");
  let nominations = ciphertext ? decryptData(ciphertext) : [];
  nominations = nominations.filter(n => n.id !== id);
  localStorage.setItem("kareem_camp_nominations_v3", encryptData(nominations));
  notifyDemoSubscribers();
};

/**
 * استيراد الترشيحات الافتراضية بالكامل لمخيم محدد
 */
export const importDefaultNominationsToFirestore = async (campId) => {
  if (isSupabaseConfigured) {
    try {
      const rows = defaultNominations.map((n, i) => ({
        id: n.id || `nom-csv-${i}-${Date.now()}`,
        camp_id: campId,
        name: n.name,
        id_number: n.idNumber,
        phone: n.phone,
        members_count: parseInt(n.membersCount) || 1,
        location: n.currentAddress || n.location || "",
        status: n.status || "متزوج",
        has_disabled: n.hasDisabled ? 1 : 0,
        has_chronic_disease: n.hasChronicDisease ? 1 : 0,
        is_lactating_or_pregnant: n.isLactatingOrPregnant ? 1 : 0,
        is_female_headed: n.isFemaleHeaded ? 1 : 0,
        dob: n.dob || "",
        wife_name: n.wifeName || "",
        wife_id: n.wifeId || "",
        wife_dob: n.wifeDob || "",
        notes: n.notes || "",
        created_at: n.createdAt || new Date().toISOString()
      }));
      const { error } = await supabase.from("nominations").upsert(rows);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error during bulk import of nominations to Supabase:", error);
      return { success: false, error: error.message };
    }
  }

  return { success: false, error: "النظام يعمل حالياً في الوضع التجريبي. يرجى ربط Supabase." };
};

/**
 * استيراد دفعة ترشيحات دفعة واحدة بشكل سريع
 */
export const batchAddNominations = async (campId, nomList) => {
  if (!nomList || nomList.length === 0) return true;

  if (isSupabaseConfigured) {
    try {
      const rows = nomList.map((nom, i) => ({
        id: nom.id || `nom_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
        camp_id: campId,
        name: (nom.name || "").trim(),
        id_number: (nom.idNumber || "").trim(),
        phone: (nom.phone || "").trim(),
        members_count: parseInt(nom.membersCount) || 1,
        location: nom.currentAddress ? nom.currentAddress.trim() : (nom.location || ""),
        status: nom.status || "متزوج",
        has_disabled: nom.hasDisabled ? 1 : 0,
        has_chronic_disease: nom.hasChronicDisease ? 1 : 0,
        is_lactating_or_pregnant: nom.isLactatingOrPregnant ? 1 : 0,
        is_female_headed: nom.isFemaleHeaded ? 1 : 0,
        dob: (nom.dob || "").trim(),
        wife_name: (nom.wifeName || "").trim(),
        wife_id: (nom.wifeId || "").trim(),
        wife_dob: (nom.wifeDob || "").trim(),
        notes: (nom.notes || "").trim(),
        created_at: nom.createdAt || new Date().toISOString()
      }));
      const chunkSize = 100;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error } = await supabase.from("nominations").upsert(chunk);
        if (error) {
          console.error("Error upserting nominations chunk:", error);
        }
      }
    } catch (err) {
      console.warn("Supabase batchAddNominations error, falling back to local:", err);
    }
  }

  localStorage.removeItem("kareem_camp_nominations_cleared");
  initLocalStorage();
  const ciphertext = localStorage.getItem("kareem_camp_nominations_v3");
  let nominations = ciphertext ? decryptData(ciphertext) : [];
  nominations = [...nominations, ...nomList.map((n, i) => ({
    id: n.id || `nom_${Date.now()}_${i}`,
    campId: campId,
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
    createdAt: n.createdAt || new Date().toISOString()
  }))];
  localStorage.setItem("kareem_camp_nominations_v3", encryptData(nominations));
  notifyDemoSubscribers();
  return true;
};

/**
 * حذف جميع ترشيحات المخيم الحالي
 * @param {string} campId - معرّف المخيم
 */
export const deleteAllNominations = async (campId) => {
  if (isSupabaseConfigured) {
    try {
      await supabase.from("nominations").delete().eq("camp_id", campId);
    } catch (e) {
      console.warn("Supabase deleteAllNominations error:", e);
    }
  }

  localStorage.setItem("kareem_camp_nominations_v3", encryptData([]));
  localStorage.setItem("kareem_camp_nominations_cleared", "true");
  notifyDemoSubscribers();
};
