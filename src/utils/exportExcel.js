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

const downloadPdfStyledExcel = (filename, title, metaDetails, headers, rows) => {
  const resolvedLogoUrl = metaDetails.logoUrl?.startsWith("/")
    ? `${window.location.origin}${metaDetails.logoUrl}`
    : metaDetails.logoUrl;
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
        body { font-family: 'Cairo', 'Tajawal', 'Segoe UI', sans-serif; direction: rtl; text-align: right; background-color: #ffffff; }
        table { border-collapse: collapse; width: 100%; direction: rtl; margin-bottom: 20px; }
        .main-header-banner {
          background-color: #0f5132;
          color: #ffffff;
          font-size: 16pt;
          font-weight: 800;
          text-align: center;
          height: 55px;
          vertical-align: middle;
          border: 2px solid #0f5132;
        }
        .subtitle-banner {
          background-color: #f4f6f4;
          color: #b89647;
          font-size: 11pt;
          font-weight: bold;
          text-align: center;
          height: 32px;
          vertical-align: middle;
          border-left: 5px solid #0f5132;
        }
        .meta-row {
          background-color: #ffffff;
          color: #0f5132;
          font-size: 10.5pt;
          font-weight: 700;
          text-align: right;
          height: 34px;
          vertical-align: middle;
          padding-right: 15px;
          border-bottom: 2px double #0f5132;
        }
        .th-pdf-style {
          background-color: #0f5132;
          color: #ffffff;
          font-size: 11pt;
          font-weight: 900;
          text-align: center;
          height: 42px;
          vertical-align: middle;
          border: 1.5px solid #0f172a;
          white-space: nowrap;
          padding: 6px 12px;
        }
        .td-pdf-style {
          border: 1.5px solid #0f172a;
          font-size: 10pt;
          height: 34px;
          vertical-align: middle;
          padding: 4px 10px;
          font-weight: 600;
          color: #000000;
        }
        .td-text-explicit {
          mso-number-format: "\\@";
          text-align: center;
          font-weight: 700;
        }
        .td-center { text-align: center; }
        .td-right { text-align: right; }
        .row-even { background-color: #ffffff; }
        .row-odd { background-color: #f8fafc; }
        .brand-cell { width: 110px; text-align: center; vertical-align: middle; border: 2px solid #0f5132; }
        .brand-logo { width: 76px; height: 76px; object-fit: contain; }
        .signature { height: 90px; vertical-align: bottom; text-align: center; font-weight: 700; color: #0f5132; }
      </style>
    </head>
    <body dir="rtl">
      <table>
        <!-- 1. ترويسة اسم المنظومة والمخيم باللون الأخضر الزمردي #0f5132 -->
        <tr>
          <td colspan="2" rowspan="3" class="brand-cell">
            ${resolvedLogoUrl ? `<img class="brand-logo" src="${escapeHtml(resolvedLogoUrl)}" alt="شعار المخيم" />` : "شعار المخيم"}
          </td>
          <td colspan="${Math.max(headers.length - 2, 1)}" class="main-header-banner">${escapeHtml(metaDetails.campName || "نظام إدارة المخيمات")}</td>
        </tr>
        <tr>
          <td colspan="${Math.max(headers.length - 2, 1)}" class="subtitle-banner">كشف رسمي صادر عن إدارة المخيم</td>
        </tr>
        <tr>
          <td colspan="${Math.max(headers.length - 2, 1)}" class="meta-row">
            مسؤول المخيم: ${escapeHtml(metaDetails.managerName)} | جوال التواصل: ${escapeHtml(metaDetails.managerPhone)} | التاريخ: ${escapeHtml(metaDetails.dateStr)} | إجمالي السجلات: ${escapeHtml(metaDetails.totalCount)}
          </td>
        </tr>

        <!-- سطر فاصل -->
        <tr><td colspan="${headers.length}" style="height:12px; border:none;"></td></tr>

        <!-- 2. عنوان الكشف الرئيسي -->
        <tr>
          <td colspan="${headers.length}" style="background-color:#f4f6f4; color:#0f5132; font-size:13pt; font-weight:800; text-align:center; height:40px; border:1.5px solid #0f5132;">
            ${escapeHtml(title)}
          </td>
        </tr>

        <!-- سطر فاصل -->
        <tr><td colspan="${headers.length}" style="height:8px; border:none;"></td></tr>

        <!-- 3. ترويسات الجدول بنفس لون ترويسة PDF (#0f5132 مع حدود كحلية #0f172a) -->
        <thead>
          <tr>
            ${headers.map(h => `<th class="th-pdf-style">${escapeHtml(h)}</th>`).join("")}
          </tr>
        </thead>

        <!-- 4. صفوف البيانات بنفس تنسيق وحدود PDF -->
        <tbody>
          ${rows.map((row, rIdx) => `
            <tr class="${rIdx % 2 === 0 ? "row-even" : "row-odd"}">
              ${row.map(cell => {
                const alignClass = cell.isText ? "td-text-explicit" : cell.align === "center" ? "td-center" : "td-right";
                const displayVal = cell.value !== null && cell.value !== undefined && cell.value !== "" ? String(cell.value) : "-";
                return `<td class="td-pdf-style ${alignClass}">${escapeHtml(displayVal)}</td>`;
              }).join("")}
            </tr>
          `).join("")}
        </tbody>
        <tfoot>
          <tr><td colspan="${headers.length}" style="height:18px;border:none"></td></tr>
          <tr>
            <td colspan="${Math.ceil(headers.length / 2)}" class="signature">توقيع مسؤول المخيم: ${escapeHtml(metaDetails.managerName)}<br/><br/>________________________</td>
            <td colspan="${Math.floor(headers.length / 2)}" class="signature">الختم الرسمي<br/><br/>________________________</td>
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
export const exportToExcel = (families, campProfile = null) => {
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

  const title = `كشف عائلات ${campName} العام`;
  const metaDetails = {
    campName,
    managerName,
    managerPhone,
    dateStr,
    totalCount: `${(families || []).length} عائلة`
    ,logoUrl: campProfile?.logoUrl || "/nasaq-logo.png"
  };

  downloadPdfStyledExcel(`كشف عائلات ${campName}.xls`, title, metaDetails, headers, rows);
};

/**
 * تصدير قائمة الترشيحات المفصلة بتنسيق وألوان مطابقة لكشف الـ PDF الرسمي 100%
 */
export const exportNominationsToExcel = (nominations, campProfile = null) => {
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
      { value: parseInt(n.age_0_2_male) || 0, align: "center" },
      { value: parseInt(n.age_0_2_female) || 0, align: "center" },
      { value: parseInt(n.age_3_5_male) || 0, align: "center" },
      { value: parseInt(n.age_3_5_female) || 0, align: "center" },
      { value: parseInt(n.age_6_18_male) || 0, align: "center" },
      { value: parseInt(n.age_6_18_female) || 0, align: "center" },
      { value: parseInt(n.age_19_60_male) || 0, align: "center" },
      { value: parseInt(n.age_19_60_female) || 0, align: "center" },
      { value: parseInt(n.age_over_60_male) || 0, align: "center" },
      { value: parseInt(n.age_over_60_female) || 0, align: "center" },
      { value: n.hasDisabled ? "1" : "0", align: "center" },
      { value: n.hasChronicDisease ? "1" : "0", align: "center" },
      { value: n.isLactatingOrPregnant ? "1" : "0", align: "center" },
      { value: n.isFemaleHeaded ? "1" : "0", align: "center" },
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

  const title = `كشف ترشيحات ${campName} العام (المفصل)`;
  const metaDetails = {
    campName,
    managerName,
    managerPhone,
    dateStr,
    totalCount: `${(nominations || []).length} عائلة مرشحة`
    ,logoUrl: campProfile?.logoUrl || "/nasaq-logo.png"
  };

  downloadPdfStyledExcel(`كشف ترشيحات ${campName}.xls`, title, metaDetails, headers, rows);
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
