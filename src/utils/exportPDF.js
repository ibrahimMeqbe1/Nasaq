export const exportToPDF = (data, type = "families", campProfile = null, filterTitle = "") => {
  const payload = JSON.stringify(data || []);
  const profilePayload = campProfile ? JSON.stringify(campProfile) : "";

  try {
    sessionStorage.setItem("kareem_camp_print_data", payload);
    sessionStorage.setItem("kareem_camp_print_type", type);
    if (filterTitle) {
      sessionStorage.setItem("kareem_camp_print_filter_title", filterTitle);
    } else {
      sessionStorage.removeItem("kareem_camp_print_filter_title");
    }
    if (profilePayload) {
      sessionStorage.setItem("kareem_camp_print_profile", profilePayload);
    } else {
      sessionStorage.removeItem("kareem_camp_print_profile");
    }
  } catch (e) {
    console.warn("sessionStorage print save error:", e);
  }

  try {
    localStorage.setItem("kareem_camp_print_data", payload);
    localStorage.setItem("kareem_camp_print_type", type);
    if (filterTitle) {
      localStorage.setItem("kareem_camp_print_filter_title", filterTitle);
    } else {
      localStorage.removeItem("kareem_camp_print_filter_title");
    }
    if (profilePayload) {
      localStorage.setItem("kareem_camp_print_profile", profilePayload);
    } else {
      localStorage.removeItem("kareem_camp_print_profile");
    }
  } catch (e) {
    console.warn("localStorage print save error:", e);
  }

  // فتح صفحة الطباعة في نافذة جديدة تابعة لموقع التطبيق
  window.open("/print", "_blank");
};
