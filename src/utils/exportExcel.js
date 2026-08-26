/**
 * دالة تحويل وتنسيق تواريخ الميلاد بدقة (تحويل أرقام إكسل المتسلسلة 24427 و 37046 أو ISO إلى تواريخ YYYY-MM-DD)
 */
export const formatDateForExcel = (val) => {
  if (!val || val === "-" || val === "null" || val === "undefined") return "-";
  let str = String(val).trim();
  if (!str) return "-";

  // تحويل أرقام إكسل المتسلسلة (مثل 24427 = 1966-11-18, 37046 = 2001-06-05)
  if (/^\d{4,5}$/.test(str)) {
    const num = parseInt(str);
    if (num >= 7000 && num <= 48500) {
      const dateObj = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(dateObj.getTime())) {
        const y = dateObj.getUTCFullYear();
        const m = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
        const d = String(dateObj.getUTCDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
    }
  }

  if (str.includes("T")) {
    const parts = str.split("T")[0].split("-");
    if (parts.length === 3) return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
  }

  const matchYMD = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (matchYMD) {
    return `${matchYMD[1]}-${matchYMD[2].padStart(2, "0")}-${matchYMD[3].padStart(2, "0")}`;
  }

  const matchDMY = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (matchDMY) {
    return `${matchDMY[3]}-${matchDMY[2].padStart(2, "0")}-${matchDMY[1].padStart(2, "0")}`;
  }

  // تحويل التواريخ بالسنة الثنائية مثل 16/11/66 أو 04/06/01
  const matchShortYear = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2})$/);
  if (matchShortYear) {
    let [, d, m, y] = matchShortYear;
    let yearNum = parseInt(y);
    let fullYear = yearNum > 30 ? 1900 + yearNum : 2000 + yearNum;
    return `${fullYear}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return str;
};

/**
 * تنسيق أرقام الهواتف والهويات لمنع تحويلها لأرقام علمية وللحفاظ على الصفر في البداية
 */
export const formatStringCell = (val) => {
  if (val === null || val === undefined || val === "" || val === "-") return "-";
  let str = String(val).trim();
  if (/^5[69]\d{7}$/.test(str)) {
    str = "0" + str;
  }
  return str;
};

/**
 * تنظيف وتنسيق اسم ورقم هوية الزوجة في حال تداخلهما (مثل 90085810 نهله حسن)
 */
export const cleanWifeDetails = (rawWifeName, rawWifeId) => {
  let wifeName = (rawWifeName || "").trim();
  let wifeId = (rawWifeId || "").trim();

  const match = wifeName.match(/^(\d{8,9})\s+(.+)$/);
  if (match) {
    if (!wifeId || wifeId === "-") {
      wifeId = match[1];
    }
    wifeName = match[2].trim();
  }

  return {
    wifeName: wifeName || "-",
    wifeId: formatStringCell(wifeId)
  };
};

/**
 * توليد وتنزيل كشف Excel بتنسيق وتلوين مطابق 100% لتصميم الـ PDF الرسمي
 * مع ألوان الغابات الزمردية (#0f5132)، الترويسات الكحلية، وحدود الجدول، وتنسيق النص المحمي
 */
const escapeHtml = (value) => String(value ?? "-")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const getColumnWidth = (header, index) => {
  if (index === 0) return 45;
  if (header.includes("اسم")) return 210;
  if (header.includes("هوية") || header.includes("جوال") || header.includes("هاتف")) return 125;
  if (header.includes("تاريخ") || header.includes("ميلاد")) return 110;
  if (header.includes("أفراد") || header.includes("ذكور") || header.includes("إناث") || header.includes("0-2") || header.includes("3-5") || header.includes("6-18") || header.includes("19-60") || header.includes("60+") || header.includes("إعاقة") || header.includes("مزمن") || header.includes("حامل") || header.includes("معيل") || header.includes("يتيم")) return 65;
  if (header.includes("عنوان") || header.includes("مكان") || header.includes("ملاحظات")) return 220;
  return 120;
};

const downloadPdfStyledExcel = (filename, title, metaDetails, headers, rows) => {
  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="content-type" content="text/vnd.ms-excel; charset=UTF-8"/>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${title.replace(/[\/\\?*:[\]]/g, " ").substring(0, 31)}</x:Name>
              <x:WorksheetOptions>
                <x:DisplayRightToLeft/>
                <x:Gridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif; direction: rtl; text-align: right; background-color: #ffffff; margin: 0; padding: 0; }
        table { border-collapse: collapse; width: 100%; direction: rtl; margin-bottom: 20px; table-layout: fixed; }
        .main-header-banner {
          background-color: #0f5132;
          color: #ffffff;
          font-size: 15pt;
          font-weight: 800;
          text-align: center;
          height: 48px;
          vertical-align: middle;
          border: 1.5px solid #0f5132;
        }
        .subtitle-banner {
          background-color: #f1f5f9;
          color: #0f5132;
          font-size: 10pt;
          font-weight: 700;
          text-align: center;
          height: 30px;
          vertical-align: middle;
          border: 1px solid #cbd5e1;
        }
        .th-excel-header {
          background-color: #0f5132;
          color: #ffffff;
          font-size: 10pt;
          font-weight: 800;
          text-align: center;
          height: 38px;
          vertical-align: middle;
          border: 1px solid #0f172a;
          white-space: nowrap;
          padding: 6px 8px;
        }
        .td-excel-cell {
          border: 1px solid #cbd5e1;
          font-size: 9.5pt;
          height: 28px;
          vertical-align: middle;
          padding: 4px 8px;
          color: #000000;
        }
        .td-text-explicit {
          mso-number-format: "\\@";
          text-align: center;
          font-weight: 600;
        }
        .td-center { text-align: center; }
        .td-right { text-align: right; font-weight: 600; }
        .row-even { background-color: #ffffff; }
        .row-odd { background-color: #f8fafc; }
        .signature-cell {
          border: none;
          font-size: 10pt;
          font-weight: 700;
          color: #0f5132;
          height: 60px;
          vertical-align: bottom;
        }
      </style>
    </head>
    <body dir="rtl">
      <table border="1">
        <colgroup>
          ${headers.map((h, i) => `<col width="${getColumnWidth(h, i)}" style="width: ${getColumnWidth(h, i)}pt;" />`).join("")}
        </colgroup>
        
        <!-- 1. ترويسة اسم المنظومة والمخيم -->
        <tr>
          <td colspan="${headers.length}" class="main-header-banner">
            نظام إدارة المخيمات — ${escapeHtml(metaDetails.campName || "كشف رسمي")}
          </td>
        </tr>
        <tr>
          <td colspan="${headers.length}" class="subtitle-banner">
            ${escapeHtml(title)} &nbsp;|&nbsp; مسؤول المخيم: ${escapeHtml(metaDetails.managerName)} &nbsp;|&nbsp; رقم الجوال: ${escapeHtml(metaDetails.managerPhone)} &nbsp;|&nbsp; التاريخ: ${escapeHtml(metaDetails.dateStr)} &nbsp;|&nbsp; إجمالي السجلات: ${escapeHtml(metaDetails.totalCount)}
          </td>
        </tr>

        <!-- سطر فاصل -->
        <tr style="height: 10px;"><td colspan="${headers.length}" style="height: 10px; border: none; background: #ffffff;"></td></tr>

        <!-- 2. ترويسات الجدول الرسمية -->
        <thead>
          <tr>
            ${headers.map((h, i) => `<th class="th-excel-header" width="${getColumnWidth(h, i)}" style="width: ${getColumnWidth(h, i)}pt;">${escapeHtml(h)}</th>`).join("")}
          </tr>
        </thead>

        <!-- 3. صفوف البيانات المتناسقة -->
        <tbody>
          ${rows.map((row, rIdx) => `
            <tr class="${rIdx % 2 === 0 ? "row-even" : "row-odd"}">
              ${row.map(cell => {
                const alignClass = cell.isText ? "td-text-explicit" : cell.align === "center" ? "td-center" : "td-right";
                const displayVal = cell.value !== null && cell.value !== undefined && cell.value !== "" ? String(cell.value) : "-";
                return `<td class="td-excel-cell ${alignClass}">${escapeHtml(displayVal)}</td>`;
              }).join("")}
            </tr>
          `).join("")}
        </tbody>

        <!-- 4. التوقيع والختم -->
        <tfoot>
          <tr style="height: 18px;"><td colspan="${headers.length}" style="border: none;"></td></tr>
          <tr>
            <td colspan="${Math.ceil(headers.length / 2)}" class="signature-cell" style="text-align: right;">
              توقيع مسؤول المخيم: ${escapeHtml(metaDetails.managerName)}<br/><br/>________________________
            </td>
            <td colspan="${Math.floor(headers.length / 2)}" class="signature-cell" style="text-align: left;">
              الختم الرسمي للمخيم<br/><br/>________________________
            </td>
          </tr>
        </tfoot>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(["\ufeff" + html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * تصدير قائمة العائلات بتنسيق وألوان مطابقة لكشف الـ PDF الرسمي 100%
 */
export const exportToExcel = (families, campProfile = null, filterTitle = "") => {
  const campName = campProfile?.name || "نظام إدارة المخيمات";
  const managerName = campProfile?.managerName || "غير محدد";
  const managerPhone = campProfile?.managerPhone || "غير محدد";

  const today = new Date();
  const dateStr = today.toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const headers = [
    "م",
    "اسم رب الأسرة رباعي",
    "رقم الهوية",
    "تاريخ ميلاد رب الأسرة",
    "الحالة الاجتماعية",
    "اسم الزوجة رباعي",
    "رقم هوية الزوجة",
    "تاريخ ميلاد الزوجة",
    "رقم الجوال / الهاتف",
    "عدد أفراد الأسرة",
    "عنوان / مكان السكن",
    "ملاحظات"
  ];

  const rows = (families || []).map((f, index) => {
    const cleanedWife = cleanWifeDetails(f.wifeName || f.wife_name, f.wifeId || f.wife_id);

    return [
      { value: index + 1, align: "center" },
      { value: f.name || "", align: "right" },
      { value: formatStringCell(f.idNumber || f.id_number), isText: true },
      { value: formatDateForExcel(f.dob || f.birthDate || f.dateOfBirth), align: "center" },
      { value: f.status || "متزوج", align: "center" },
      { value: cleanedWife.wifeName, align: "right" },
      { value: cleanedWife.wifeId, isText: true },
      { value: formatDateForExcel(f.wifeDob || f.wife_dob), align: "center" },
      { value: formatStringCell(f.phone), isText: true },
      { value: parseInt(f.membersCount || f.members_count) || 1, align: "center" },
      { value: f.location || f.address || "-", align: "right" },
      { value: f.notes || "-", align: "right" }
    ];
  });

  const title = filterTitle ? `كشف عائلات ${campName} (${filterTitle})` : `كشف عائلات ${campName} العام`;
  const metaDetails = {
    campName,
    managerName,
    managerPhone,
    dateStr,
    totalCount: `${(families || []).length} عائلة`
    ,logoUrl: campProfile?.logoUrl || "/nasaq-logo.png"
  };

  downloadPdfStyledExcel(`${title}.xls`, title, metaDetails, headers, rows);
};

/**
 * تصدير قائمة الترشيحات المفصلة بتنسيق وألوان مطابقة لكشف الـ PDF الرسمي 100%
 */
export const exportNominationsToExcel = (nominations, campProfile = null, filterTitle = "") => {
  const campName = campProfile?.name || "نظام إدارة المخيمات";
  const managerName = campProfile?.managerName || "غير محدد";
  const managerPhone = campProfile?.managerPhone || "غير محدد";

  const today = new Date();
  const dateStr = today.toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const headers = [
    "م",
    "اسم رب الأسرة رباعي",
    "رقم الهوية",
    "تاريخ ميلاد رب الأسرة",
    "الجنس",
    "الحالة الاجتماعية",
    "رقم الجوال الرئيسي",
    "رقم الجوال البديل",
    "اسم الزوجة الأولى رباعي",
    "رقم هوية الزوجة الأولى",
    "تاريخ ميلاد الزوجة الأولى",
    "اسم الزوجة الثانية رباعي",
    "رقم هوية الزوجة الثانية",
    "إجمالي عدد أفراد الأسرة",
    "0-2 ذكور",
    "0-2 إناث",
    "3-5 ذكور",
    "3-5 إناث",
    "6-18 ذكور",
    "6-18 إناث",
    "19-60 ذكور",
    "19-60 إناث",
    "60+ ذكور",
    "60+ إناث",
    "ذوي إعاقة",
    "أمراض مزمنة",
    "حامل/مرضعة",
    "معيل امرأة",
    "معيل طفل يتيم",
    "عنوان السكن الحالي",
    "عنوان السكن الأصلي",
    "المحافظة",
    "اسم المخيم",
    "مدير مركز الإيواء",
    "رقم تواصل المدير",
    "رقم التواصل البديل",
    "عنوان مركز الإيواء بالتفصيل",
    "إحداثيات GPS"
  ];

  const rows = (nominations || []).map((n, index) => {
    const cleanedWife1 = cleanWifeDetails(n.wifeName || n.wife_name, n.wifeId || n.wife_id);
    const cleanedWife2 = cleanWifeDetails(n.wife2Name || n.wife_2_name, n.wife2Id || n.wife_2_id);

    const getNum = (...keys) => {
      for (const k of keys) {
        if (n && n[k] !== undefined && n[k] !== null && n[k] !== "") {
          const val = parseInt(n[k]);
          if (!isNaN(val) && val >= 0) return val;
        }
      }
      return 0;
    };

    const isPos = (...keys) => {
      for (const k of keys) {
        if (n && (n[k] === 1 || n[k] === true || n[k] === "1" || n[k] === "true" || n[k] === "نعم")) {
          return true;
        }
      }
      return false;
    };

    return [
      { value: n.serialNo || index + 1, align: "center" },
      { value: n.name || "", align: "right" },
      { value: formatStringCell(n.idNumber || n.id_number), isText: true },
      { value: formatDateForExcel(n.dob || n.birthDate || n.dateOfBirth), align: "center" },
      { value: n.gender || "ذكر", align: "center" },
      { value: n.status || "متزوج", align: "center" },
      { value: formatStringCell(n.phone), isText: true },
      { value: formatStringCell(n.phoneAlt || n.phone_alt), isText: true },
      { value: cleanedWife1.wifeName, align: "right" },
      { value: cleanedWife1.wifeId, isText: true },
      { value: formatDateForExcel(n.wifeDob || n.wife_dob), align: "center" },
      { value: cleanedWife2.wifeName, align: "right" },
      { value: cleanedWife2.wifeId, isText: true },
      { value: parseInt(n.membersCount || n.members_count) || 1, align: "center" },
      { value: getNum("age_0_2_male", "age02Male"), align: "center" },
      { value: getNum("age_0_2_female", "age02Female"), align: "center" },
      { value: getNum("age_3_5_male", "age35Male"), align: "center" },
      { value: getNum("age_3_5_female", "age35Female"), align: "center" },
      { value: getNum("age_6_18_male", "age618Male"), align: "center" },
      { value: getNum("age_6_18_female", "age618Female"), align: "center" },
      { value: getNum("age_19_60_male", "age1960Male"), align: "center" },
      { value: getNum("age_19_60_female", "age1960Female"), align: "center" },
      { value: getNum("age_over_60_male", "ageOver60Male"), align: "center" },
      { value: getNum("age_over_60_female", "ageOver60Female"), align: "center" },
      { value: isPos("hasDisabled", "has_disabled") ? "1" : "0", align: "center" },
      { value: isPos("hasChronicDisease", "has_chronic_disease") ? "1" : "0", align: "center" },
      { value: isPos("isLactatingOrPregnant", "is_lactating_or_pregnant") ? "1" : "0", align: "center" },
      { value: isPos("isFemaleHeaded", "is_female_headed") ? "1" : "0", align: "center" },
      { value: isPos("isChildHeaded", "is_child_headed", "isOrphanHeaded") || (n.status || "").includes("يتيم") ? "1" : "0", align: "center" },
      { value: n.currentAddress || n.location || "-", align: "right" },
      { value: n.originalAddress || "-", align: "right" },
      { value: n.governorate || "شمال غزة", align: "center" },
      { value: n.campName || campName, align: "right" },
      { value: n.shelterManager || managerName, align: "right" },
      { value: formatStringCell(n.shelterPhone || n.shelter_phone), isText: true },
      { value: formatStringCell(n.shelterPhoneAlt || n.shelter_phone_alt), isText: true },
      { value: n.shelterAddress || "-", align: "right" },
      { value: n.shelterGps || "-", align: "right" }
    ];
  });

  const title = filterTitle ? `كشف ترشيحات ${campName} (${filterTitle})` : `كشف ترشيحات ${campName} العام (المفصل)`;
  const metaDetails = {
    campName,
    managerName,
    managerPhone,
    dateStr,
    totalCount: `${(nominations || []).length} عائلة مرشحة`
    ,logoUrl: campProfile?.logoUrl || "/nasaq-logo.png"
  };

  downloadPdfStyledExcel(`${title}.xls`, title, metaDetails, headers, rows);
};

const downloadStaticTemplate = (url, filename) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const downloadFamiliesTemplate = () =>
  downloadStaticTemplate("/templates/families-template.xlsx", "قالب كشف الأسر الفارغ.xlsx");

export const downloadNominationsTemplate = () =>
  downloadStaticTemplate("/templates/nominations-template.xlsx", "قالب كشف الترشيحات الفارغ.xlsx");
