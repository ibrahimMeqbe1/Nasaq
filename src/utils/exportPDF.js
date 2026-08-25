export const exportToPDF = (data, type = "families", campProfile = null) => {
  // sessionStorage يُنسخ إلى النافذة التابعة ذات الأصل نفسه ولا يحتفظ بالكشف
  // بعد إغلاق جلسة المتصفح، بعكس localStorage طويل العمر.
  sessionStorage.setItem("kareem_camp_print_data", JSON.stringify(data));
  sessionStorage.setItem("kareem_camp_print_type", type);
  if (campProfile) {
    sessionStorage.setItem("kareem_camp_print_profile", JSON.stringify(campProfile));
  } else {
    sessionStorage.removeItem("kareem_camp_print_profile");
  }
  // فتح صفحة الطباعة في نافذة جديدة تابعة لموقع التطبيق لتجنب مشاكل المتصفح الأمنية
  window.open("/print", "_blank");
};
