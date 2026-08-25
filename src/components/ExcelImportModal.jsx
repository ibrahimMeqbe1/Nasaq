"use client";

import React, { useState, useRef } from "react";
import { FaFileExcel, FaEye, FaSave, FaTimes, FaExclamationTriangle } from "react-icons/fa";
import { readSheet } from "read-excel-file/browser";
import { formatDateForExcel } from "../utils/exportExcel";

const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
const MAX_IMPORT_ROWS = 10000;

const unwrapExcelCell = (value) => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value !== "object") return value;
  if (value.result !== undefined) return unwrapExcelCell(value.result);
  if (Array.isArray(value.richText)) return value.richText.map((part) => part.text || "").join("");
  if (value.text !== undefined) return value.text;
  if (value.hyperlink !== undefined) return value.text || value.hyperlink;
  return String(value);
};

const parseCsv = (text) => {
  const source = text.replace(/^\uFEFF/, "");
  const firstLine = source.split(/\r?\n/, 1)[0] || "";
  const delimiter = [",", ";", "\t"].sort(
    (a, b) => firstLine.split(b).length - firstLine.split(a).length
  )[0];
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => String(value).trim())) rows.push(row);
  return rows;
};

const readImportRows = async (file, arrayBuffer) => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "csv") {
    return parseCsv(new TextDecoder("utf-8").decode(arrayBuffer));
  }
  if (extension !== "xlsx") {
    throw new Error("يدعم النظام ملفات XLSX وCSV فقط.");
  }

  const rows = await readSheet(arrayBuffer);
  if (!Array.isArray(rows)) {
    throw new Error("تعذر قراءة صفوف ملف Excel. تأكد من أن الملف سليم ويحتوي ورقة بيانات واحدة على الأقل.");
  }
  return rows.map((row) => row.map(unwrapExcelCell));
};

const ExcelImportModal = ({ isOpen, onClose, campId, onImportComplete, importType = "families" }) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Preview & Confirm
  const [fileName, setFileName] = useState("");
  const [excelHeaders, setExcelHeaders] = useState([]);
  const [excelRows, setExcelRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [previewData, setPreviewData] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // التعريفات الخاصة بكل نوع استيراد (عائلات / ترشيحات)
  const schemaDefinitions = importType === "families" ? {
    name: { label: "اسم رب الأسرة رباعي", required: true, aliases: ["اسم رب الأسرة رباعي", "اسم رب الأسرة", "اسم رب الاسرة رباعي", "اسم رب الاسرة", "الاسم رباعي", "الاسم الرباعي", "الاسم", "الأسم", "اسم المعيل", "اسم المواطن"] },
    idNumber: { label: "رقم هوية رب الأسرة", required: true, aliases: ["رقم هوية رب الأسرة", "رقم هوية رب الاسرة", "هوية رب الاسرة", "هوية رب الأسرة", "رقم الهوية", "الهوية", "رقم الهوية الوطنية", "رقم هوية المعيل"] },
    phone: { label: "رقم الهاتف / الجوال", required: true, aliases: ["رقم الهاتف / الجوال", "رقم الجوال", "جوال", "الجوال", "رقم الهاتف", "الهاتف", "تليفون", "رقم التواصل", "موبايل"] },
    membersCount: { label: "عدد أفراد الأسرة", required: false, aliases: ["عدد أفراد الأسرة", "عدد افراد الاسرة", "عدد أفراد الاسرة", "عدد الأفراد", "عدد الافراد", "إجمالي عدد أفراد الأسرة", "اجمالي عدد افراد الاسرة", "الافراد", "العدد", "عدد العائلة"] },
    location: { label: "مكان السكن / المخيم", required: false, aliases: ["مكان السكن / المخيم", "عنوان السكن الحالي", "عنوان السكن الاصلي", "عنوان السكن الأصلي", "مكان السكن", "المخيم", "العنوان", "المنطقة", "عنوان", "السكن", "مكان الاقامة", "العنوان الحالي"] },
    status: { label: "الحالة الاجتماعية", required: false, aliases: ["الحالة الاجتماعية", "الحالة الاجتماعية ( متزوج/ة - ارمل/ه - مطلق/ة - متعدد )", "الحالة", "الوضع الاجتماعي"] },
    dob: { label: "تاريخ ميلاد رب الأسرة", required: false, aliases: ["تاريخ ميلاد رب الأسرة", "تاريخ ميلاد رب الاسرة", "تاريخ الميلاد", "تاريخ ميلاد", "الميلاد", "سنة الميلاد"] },
    wifeName: { label: "اسم الزوجة رباعي", required: false, aliases: ["اسم الزوجة رباعي", "اسم الزوجة", "اسم الزوجه رباعي", "اسم الزوجه", "الزوجة", "الزوجة الأولى"] },
    wifeId: { label: "رقم هوية الزوجة", required: false, aliases: ["رقم هوية الزوجة", "هوية الزوجة", "رقم هوية الزوجه", "هوية الزوجه"] },
    wifeDob: { label: "تاريخ ميلاد الزوجة", required: false, aliases: ["تاريخ ميلاد الزوجة", "ميلاد الزوجة", "تاريخ ميلاد الزوجه", "ميلاد الزوجه"] },
    notes: { label: "ملاحظات", required: false, aliases: ["ملاحظات", "ملاحظه", "ملاحظة", "تنبيهات"] }
  } : {
    // الترشيحات المفصلة
    name: { label: "الاسم رباعي", required: true, aliases: ["اسم رب الأسرة رباعي", "اسم رب الاسرة رباعي", "الاسم رباعي", "الاسم الرباعي", "اسم رب الأسرة", "اسم رب الاسرة", "الاسم", "الأسم"] },
    idNumber: { label: "رقم الهوية", required: true, aliases: ["رقم الهوية", "رقم هوية رب الأسرة", "رقم هوية رب الاسرة", "هوية رب الاسرة", "هوية رب الأسرة", "الهوية"] },
    phone: { label: "رقم الجوال", required: true, aliases: ["رقم الجوال", "جوال", "الجوال", "رقم الهاتف", "الهاتف", "رقم الهاتف / الجوال"] },
    phoneAlt: { label: "رقم الجوال البديل", required: false, aliases: ["رقم الجوال البديل", "الجوال البديل", "هاتف بديل", "رقم الهاتف البديل", "الهاتف البديل", "رقم الجوال الثاني"] },
    dob: { label: "تاريخ ميلاد رب الأسرة", required: false, aliases: ["تاريخ ميلاد رب الأسرة", "تاريخ الميلاد", "تاريخ ميلاد", "الميلاد"] },
    gender: { label: "الجنس", required: false, aliases: ["الجنس ( ذكر / انثى )", "الجنس (ذكر / انثى)", "الجنس", "نوع الجنس", "النوع"] },
    status: { label: "الحالة الاجتماعية", required: false, aliases: ["الحالة الاجتماعية ( متزوج/ة - ارمل/ه - مطلق/ة - متعدد )", "الحالة الاجتماعية", "الحالة", "الوضع الاجتماعي"] },
    wifeName: { label: "اسم الزوجة الأولى رباعي", required: false, aliases: ["اسم الزوجة رباعي", "اسم الزوجة الأولى رباعي", "اسم الزوجة", "اسم الزوجه رباعي", "اسم الزوجه", "الزوجة الأولى", "الزوجة"] },
    wifeId: { label: "رقم هوية الزوجة الأولى", required: false, aliases: ["رقم هوية الزوجة", "هوية الزوجة الأولى", "رقم هوية الزوجة الاولى", "هوية الزوجة", "رقم هوية الزوجه"] },
    wifeDob: { label: "تاريخ ميلاد الزوجة", required: false, aliases: ["تاريخ ميلاد الزوجة", "تاريخ ميلاد الزوجة الأولى", "ميلاد الزوجة"] },
    wife2Name: { label: "اسم الزوجة الثانية رباعي", required: false, aliases: ["اسم الزوجة الثانية رباعي", "اسم الزوجة الثانية", "الزوجة الثانية"] },
    wife2Id: { label: "رقم هوية الزوجة الثانية", required: false, aliases: ["هوية الزوجة الثانية", "رقم هوية الزوجة الثانية"] },
    membersCount: { label: "إجمالي أفراد الأسرة", required: false, aliases: ["إجمالي أفراد الأسرة", "عدد أفراد الأسرة", "الأفراد", "الافراد", "اجمالي عدد أفراد الأسرة", "عدد الأفراد", "العدد"] },
    age_0_2_male: { label: "عدد الذكور (2-0)", required: false, aliases: ["عدد الافراد 0 - 2 (ذكر)", "عدد الأفراد 0 - 2 (ذكر)", "ذكور 2-0", "الذكور 2-0", "ذكر 2-0", "ذكور 0-2", "2-0 ذكور", "2-0 ذكر", "0 - 2 (ذكر)", "0-2 (ذكر)", "ذكر (2-0)", "ذكر (0-2)"] },
    age_0_2_female: { label: "عدد الإناث (2-0)", required: false, aliases: ["عدد الافراد 0 - 2 (أنثى)", "عدد الأفراد 0 - 2 (أنثى)", "إناث 2-0", "اناث 2-0", "الاناث 2-0", "أنثى 2-0", "انثى 2-0", "إناث 0-2", "2-0 إناث", "2-0 انثى", "0 - 2 (أنثى)", "0-2 (أنثى)", "0 - 2 (انثى)", "أنثى (2-0)", "أنثى (0-2)", "أنثى"] },
    age_3_5_male: { label: "عدد الذكور (5-3)", required: false, aliases: ["عدد الافراد 3-5 (ذكر)", "عدد الأفراد 3 - 5 (ذكر)", "ذكور 5-3", "الذكور 5-3", "ذكر 5-3", "ذكور 3-5", "5-3 ذكور", "5-3 ذكر", "3-5 (ذكر)", "3 - 5 (ذكر)", "ذكر (5-3)", "ذكر (3-5)"] },
    age_3_5_female: { label: "عدد الإناث (5-3)", required: false, aliases: ["عدد الافراد 3-5 (أنثى)", "عدد الأفراد 3 - 5 (أنثى)", "إناث 5-3", "اناث 5-3", "الاناث 5-3", "أنثى 5-3", "انثى 5-3", "إناث 3-5", "5-3 إناث", "5-3 انثى", "3-5 (أنثى)", "3 - 5 (أنثى)", "أنثى (5-3)", "أنثى (3-5)"] },
    age_6_18_male: { label: "عدد الذكور (18-6)", required: false, aliases: ["عدد الأفراد 6 - 18 (ذكر)", "عدد الافراد 6 - 18 (ذكر)", "ذكور 18-6", "الذكور 18-6", "ذكر 18-6", "ذكور 6-18", "18-6 ذكور", "18-6 ذكر", "6-18 (ذكر)", "6 - 18 (ذكر)", "ذكر (18-6)", "ذكر (6-18)"] },
    age_6_18_female: { label: "عدد الإناث (18-6)", required: false, aliases: ["عدد الأفراد 6 - 18 (أنثى)", "عدد الافراد 6 - 18 (أنثى)", "إناث 18-6", "اناث 18-6", "الاناث 18-6", "أنثى 18-6", "انثى 18-6", "إناث 6-18", "18-6 إناث", "18-6 انثى", "6-18 (أنثى)", "6 - 18 (أنثى)", "أنثى (18-6)", "أنثى (6-18)"] },
    age_19_60_male: { label: "عدد الذكور (60-19)", required: false, aliases: ["عدد الأفراد 19 - 60 (ذكر)", "عدد الافراد 19 - 60 (ذكر)", "ذكور 60-19", "الذكور 60-19", "ذكر 60-19", "ذكور 19-60", "60-19 ذكور", "60-19 ذكر", "19-60 (ذكر)", "19 - 60 (ذكر)", "ذكر (60-19)", "ذكر (19-60)"] },
    age_19_60_female: { label: "عدد الإناث (60-19)", required: false, aliases: ["عدد الأفراد 19 - 60 (أنثى)", "عدد الافراد 19 - 60 (أنثى)", "إناث 60-19", "اناث 60-19", "الاناث 60-19", "أنثى 60-19", "انثى 60-19", "إناث 19-60", "60-19 إناث", "60-19 انثى", "19-60 (أنثى)", "19 - 60 (أنثى)", "أنثى (60-19)", "أنثى (19-60)"] },
    age_over_60_male: { label: "عدد الذكور (أكثر من 60)", required: false, aliases: ["عدد الأفراد اكثر من 60 (ذكر)", "عدد الافراد اكثر من 60 (ذكر)", "ذكور أكبر من 60", "ذكور اكبر من 60", "ذكر أكبر من 60", "أكثر من 60 ذكور", "أكثر من 60 ذكر", "أكثر من 60 (ذكر)", "اكثر من 60 (ذكر)", "أكبر من 60 (ذكر)"] },
    age_over_60_female: { label: "عدد الإناث (أكثر من 60)", required: false, aliases: ["عدد الأفراد اكثر من 60 (أنثى)", "إناث أكبر من 60", "اناث اكبر من 60", "أنثى أكبر من 60", "أكثر من 60 إناث", "أكثر من 60 انثى", "أكثر من 60 (أنثى)", "اكثر من 60 (أنثى)", "أكبر من 60 (أنثى)"] },
    hasDisabled: { label: "وجود ذوي إعاقة", required: false, aliases: ["الافراد ذوي الاعاقة ( 0 / 1 )", "الافراد ذوي الاعاقة", "ذوي إعاقة", "وجود اعاقة", "معاق", "إعاقة", "اعاقة", "احتياجات خاصة", "ذوي الاعاقة"] },
    hasChronicDisease: { label: "وجود أمراض مزمنة", required: false, aliases: ["الافراد المصابين بامراض مزمنة", "الافراد المصابين بامراض مزمنه", "أمراض مزمنة", "امراض مزمنة", "مرض مزمن", "امراض مزمنه", "المصابين بامراض مزمنة"] },
    isLactatingOrPregnant: { label: "حامل أو مرضعة", required: false, aliases: ["امرأة مرضعة أو حامل ( 1 / 0 )", "امرأة مرضعة أو حامل", "حامل/مرضعة", "حامل", "مرضعة", "حامل او مرضعة", "حامل أو مرضعة"] },
    isFemaleHeaded: { label: "معيل امرأة", required: false, aliases: ["هل تعيل الاسرة امرأة ( 1 / 0 )", "هل تعيل الاسرة امرأة", "معيل امرأة", "معيل امراة", "الأسرة تعيلها امرأة", "تعيلها امرأة"] },
    currentAddress: { label: "عنوان السكن الحالي", required: false, aliases: ["عنوان السكن الحالي", "العنوان الحالي", "مكان السكن", "العنوان", "عنوان", "السكن", "مكان السكن / المخيم"] },
    originalAddress: { label: "عنوان السكن الأصلي", required: false, aliases: ["عنوان السكن الأصلي", "العنوان الأصلي", "عنوان السكن الاصلي", "العنوان الاصلي"] },
    governorate: { label: "المحافظة", required: false, aliases: ["المحافظة", "المحافظه"] },
    campName: { label: "اسم المخيم", required: false, aliases: ["اسم المخيم", "المخيم"] },
    shelterManager: { label: "مدير مركز الايواء", required: false, aliases: ["مدير مركز الايواء", "مدير مركز الإيواء", "مدير مركز ايواء", "المدير"] },
    shelterPhone: { label: "رقم تواصل مدير المركز", required: false, aliases: ["رقم التواصل", "رقم تواصل مدير المركز", "تواصل المدير", "جوال المدير"] },
    shelterPhoneAlt: { label: "رقم التواصل البديل للمركز", required: false, aliases: ["رقم التواصل البديل", "رقم التواصل البديل للمركز", "تواصل بديل للمدير"] },
    shelterAddress: { label: "عنوان مركز الايواء بالتفصيل", required: false, aliases: ["عنوان مركز الايواء بالتفصيل", "عنوان مركز الإيواء بالتفصيل", "عنوان مركز الايواء", "مكان الايواء"] },
    shelterGps: { label: "احداثيات موقع مركز الايواء GPS", required: false, aliases: ["احداثيات موقع مركز الايواء GPS", "احداثيات موقع مركز الإيواء GPS", "احداثيات GPS", "GPS", "الموقع على الخريطة", "رابط الموقع"] }
  };

  if (!isOpen) return null;

  // توحيد النصوص العربية لتسهيل وتدقيق عملية المطابقة التلقائية
  const normalizeArabic = (str) => {
    if (!str) return "";
    return String(str)
      .toLowerCase()
      .replace(/[\r\n]+/g, " ")
      .replace(/[أإآء]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/[^\w\u0600-\u06FF\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  // التعامل مع اختيار الملف وقراءته
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_IMPORT_BYTES) {
      setError("حجم الملف أكبر من 10 ميغابايت. قسّم الكشف ثم أعد المحاولة.");
      e.target.value = "";
      return;
    }

    setFileName(file.name);
    setError("");
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const rows = await readImportRows(file, evt.target.result);
        if (rows.length > MAX_IMPORT_ROWS + 15) {
          throw new Error("يحتوي الملف على أكثر من 10,000 سجل. قسّم الكشف ثم أعد المحاولة.");
        }

        // البحث الذكي عن صف الترويسة الأنسب بأسماء الحقول بدلاً من الاعتماد فقط على امتلاء الخلايا
        let headerRowIndex = -1;
        let maxHeaderScore = -1;

        for (let i = 0; i < Math.min(rows.length, 15); i++) {
          const row = rows[i] || [];
          let score = 0;
          row.forEach(cell => {
            if (!cell) return;
            const normCell = normalizeArabic(String(cell));
            if (
              normCell.includes("اسم") ||
              normCell.includes("هويه") ||
              normCell.includes("جوال") ||
              normCell.includes("هاتف") ||
              normCell.includes("عنوان") ||
              normCell.includes("حاله") ||
              normCell.includes("الرقم") ||
              normCell.includes("no") ||
              normCell.includes("جنس")
            ) {
              score += 10;
            }
          });
          if (score > maxHeaderScore) {
            maxHeaderScore = score;
            headerRowIndex = i;
          }
        }

        if (headerRowIndex === -1 || maxHeaderScore === 0) {
          let maxFilled = 0;
          headerRowIndex = 0;
          for (let i = 0; i < Math.min(rows.length, 10); i++) {
            const row = rows[i] || [];
            const filled = row.filter(c => c !== null && c !== undefined && String(c).trim().length > 0).length;
            if (filled > maxFilled) {
              maxFilled = filled;
              headerRowIndex = i;
            }
          }
        }

        // تنظيف وتسمية الترويسات والتعامل مع الأعمدة المدمجة (الذكور والإناث)
        const rawHeaders = Array.from(rows[headerRowIndex] || []);
        const resolvedHeaders = [];
        for (let i = 0; i < rawHeaders.length; i++) {
          let h = rawHeaders[i];
          h = h ? String(h).replace(/\r?\n|\r/g, " ").replace(/\s+/g, " ").trim() : "";
          
          if (h === "" && i > 0) {
            const prev = resolvedHeaders[i - 1];
            if (prev && (prev.includes("ذكر") || prev.includes("ذكور"))) {
              h = prev.replace("ذكر", "أنثى").replace("ذكور", "إناث");
            } else {
              h = `عمود غير مسمى ${i + 1}`;
            }
          } else if (h === "") {
            h = `عمود غير مسمى ${i + 1}`;
          }
          resolvedHeaders.push(h);
        }

        // ضمان تفرد أسماء الترويسات لتفادي مشاكل الفهرسة
        const counts = {};
        const headers = resolvedHeaders.map((h) => {
          if (!h) return "";
          if (counts[h] === undefined) {
            counts[h] = 0;
            return h;
          } else {
            counts[h]++;
            return `${h} (${counts[h] + 1})`;
          }
        });

        const dataRows = rows.slice(headerRowIndex + 1).filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ""));

        setExcelHeaders(headers);
        setExcelRows(dataRows);

        const initialMapping = {};
        const mappedHeaders = new Set();
        const normHeaders = headers.map(h => normalizeArabic(h));

        // المرحلة الأولى: مطابقة تامة بين العناوين البديلة والترويسات
        Object.entries(schemaDefinitions).forEach(([schemaKey, def]) => {
          const normAliases = def.aliases.map(a => normalizeArabic(a));
          const matchIdx = normHeaders.findIndex((nh, idx) => {
            if (!nh || mappedHeaders.has(headers[idx])) return false;
            if (schemaKey === 'membersCount' && (nh.includes('0 2') || nh.includes('3 5') || nh.includes('6 18') || nh.includes('19 60') || nh.includes('60'))) {
              return false;
            }
            return normAliases.some(alias => nh === alias);
          });
          if (matchIdx !== -1) {
            initialMapping[schemaKey] = headers[matchIdx];
            mappedHeaders.add(headers[matchIdx]);
          }
        });

        // المرحلة الثانية: مطابقة جزئية للأعمدة المتبقية
        Object.entries(schemaDefinitions).forEach(([schemaKey, def]) => {
          if (initialMapping[schemaKey]) return;
          
          const normAliases = def.aliases.map(a => normalizeArabic(a));
          const matchIdx = normHeaders.findIndex((nh, idx) => {
            if (!nh || mappedHeaders.has(headers[idx])) return false;
            if (schemaKey === 'membersCount' && (nh.includes('0 2') || nh.includes('3 5') || nh.includes('6 18') || nh.includes('19 60') || nh.includes('60'))) {
              return false;
            }
            if (schemaKey === 'phoneAlt' && initialMapping['phone'] === headers[idx]) {
              return false;
            }
            if (schemaKey === 'wife2Id' && initialMapping['wifeId'] === headers[idx]) {
              return false;
            }
            if (schemaKey === 'wife2Name' && initialMapping['wifeName'] === headers[idx]) {
              return false;
            }
            return normAliases.some(alias => nh.includes(alias) || alias.includes(nh));
          });
          if (matchIdx !== -1) {
            initialMapping[schemaKey] = headers[matchIdx];
            mappedHeaders.add(headers[matchIdx]);
          } else {
            initialMapping[schemaKey] = "";
          }
        });

        setColumnMapping(initialMapping);
        setStep(2);
      } catch (err) {
        setError(err?.message || "فشل في قراءة الملف. تأكد من أن الملف سليم وغير محمي.");
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("تعذر قراءة الملف من الجهاز. أعد اختياره وحاول مرة أخرى.");
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  // المضي قدماً خطوة المعاينة
  const handleProceedToPreview = () => {
    // التحقق من الحقول المطلوبة
    const missingFields = Object.entries(schemaDefinitions)
      .filter(([key, def]) => def.required && !columnMapping[key])
      .map(([key, def]) => def.label);

    if (missingFields.length > 0) {
      setError(`يرجى تحديد تطابق الأعمدة للحقول الإلزامية التالية: ${missingFields.join("، ")}`);
      return;
    }

    setError("");

    // إنشاء المعاينة بناءً على التطابق
    const mapped = excelRows.map((row) => {
      const record = {};
      Object.entries(columnMapping).forEach(([schemaKey, headerName]) => {
        if (!headerName) {
          // قيم افتراضية للحقول غير المحددة
          if (["age_0_2_male", "age_0_2_female", "age_3_5_male", "age_3_5_female", "age_6_18_male", "age_6_18_female", "age_19_60_male", "age_19_60_female", "age_over_60_male", "age_over_60_female"].includes(schemaKey)) {
            record[schemaKey] = 0;
          } else if (["hasDisabled", "hasChronicDisease", "isLactatingOrPregnant", "isFemaleHeaded"].includes(schemaKey)) {
            record[schemaKey] = 0;
          } else if (schemaKey === "gender") {
            record[schemaKey] = "ذكر";
          } else if (schemaKey === "status") {
            record[schemaKey] = "متزوج";
          } else {
            record[schemaKey] = "";
          }
          return;
        }
        
        const colIndex = excelHeaders.indexOf(headerName);
        const rawVal = colIndex !== -1 ? String(row[colIndex] || "").trim() : "";

        if (schemaKey === "dob" || schemaKey === "wifeDob") {
          record[schemaKey] = formatDateForExcel(rawVal);
        } else if (["hasDisabled", "hasChronicDisease", "isLactatingOrPregnant", "isFemaleHeaded"].includes(schemaKey)) {
          // تحويل نعم/لا أو 1/0 إلى عدد صحيح 0 أو 1
          record[schemaKey] = (rawVal === "1" || rawVal === "نعم" || rawVal.toLowerCase() === "yes" || rawVal.toLowerCase() === "true" || rawVal === "يوجد") ? 1 : 0;
        } else if (["age_0_2_male", "age_0_2_female", "age_3_5_male", "age_3_5_female", "age_6_18_male", "age_6_18_female", "age_19_60_male", "age_19_60_female", "age_over_60_male", "age_over_60_female", "membersCount"].includes(schemaKey)) {
          // تحويل حقول الأرقام
          const parsed = parseInt(rawVal);
          record[schemaKey] = isNaN(parsed) ? 0 : parsed;
        } else {
          record[schemaKey] = rawVal;
        }
      });

      // حساب إجمالي الأفراد تلقائياً إذا لم يكن متوفراً أو كان صفراً
      if (!record.membersCount || record.membersCount === 0) {
        const breakdownSum = 
          (record.age_0_2_male || 0) + (record.age_0_2_female || 0) +
          (record.age_3_5_male || 0) + (record.age_3_5_female || 0) +
          (record.age_6_18_male || 0) + (record.age_6_18_female || 0) +
          (record.age_19_60_male || 0) + (record.age_19_60_female || 0) +
          (record.age_over_60_male || 0) + (record.age_over_60_female || 0);
        record.membersCount = breakdownSum || 1;
      }

      return record;
    }).filter(record => record.name && record.idNumber); // تصفية السجلات الفارغة تماماً من الاسم أو الهوية

    if (mapped.length === 0) {
      setError("لم يتم العثور على أي سجلات صالحة للاستيراد بناءً على التطابق المحدد.");
      return;
    }

    setPreviewData(mapped);
    setStep(3);
  };

  // حفظ وحفظ البيانات في قاعدة البيانات
  const handleSaveImport = async () => {
    setLoading(true);
    setError("");

    try {
      if (onImportComplete) {
        await onImportComplete(previewData);
      }
      onClose();
    } catch (err) {
      setError("حدث خطأ أثناء حفظ البيانات المستوردة: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-large">
        <div className="modal-header">
          <div className="modal-title">
            <FaFileExcel className="modal-header-icon text-success" style={{ fontSize: "1.4rem", marginLeft: "8px" }} />
            <h2>استيراد البيانات من ملف Excel ({importType === "families" ? "عائلات" : "ترشيحات"})</h2>
          </div>
          <button onClick={onClose} className="btn-close">
            <FaTimes />
          </button>
        </div>

        {/* مؤشر الخطوات */}
        <div className="import-stepper">
          <div className={`step-node ${step >= 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}>
            <span>1</span> <p>رفع الملف</p>
          </div>
          <div className="step-divider"></div>
          <div className={`step-node ${step >= 2 ? "active" : ""} ${step > 2 ? "completed" : ""}`}>
            <span>2</span> <p>مطابقة الأعمدة</p>
          </div>
          <div className="step-divider"></div>
          <div className={`step-node ${step >= 3 ? "active" : ""} ${step > 3 ? "completed" : ""}`}>
            <span>3</span> <p>المعاينة والحفظ</p>
          </div>
        </div>

        <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
          {error && (
            <div className="login-error-badge mb-4">
              <FaExclamationTriangle className="inline-icon" /> {error}
            </div>
          )}

          {/* الخطوة 1: اختيار الملف */}
          {step === 1 && (
            <div className="import-file-upload-zone" onClick={triggerFileSelect}>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".xlsx, .csv"
                style={{ display: "none" }} 
              />
              <FaFileExcel className="upload-zone-icon" />
              <h3>اسحب ملف Excel هنا أو اضغط للاختيار</h3>
              <p>يدعم ملفات بصيغة .xlsx أو .csv حتى 10 ميغابايت</p>
              {loading && <div className="spinner mt-3">جاري قراءة الملف...</div>}
            </div>
          )}

          {/* الخطوة 2: مطابقة الحقول */}
          {step === 2 && (
            <div className="column-mapping-container">
              <p className="helper-text mb-4">
                الملف المرفق: <strong>{fileName}</strong>. تطابق حقول النظام مع أعمدة ملف الـ Excel الخاص بك. لقد قمنا ببعض المطابقات التلقائية بناءً على أسماء الأعمدة في ملفك.
              </p>
              
              <div className="mapping-grid">
                <div className="mapping-grid-header">
                  <div>حقل النظام</div>
                  <div>حقل Excel المقابل له</div>
                </div>

                {Object.entries(schemaDefinitions).map(([key, def]) => (
                  <div key={key} className={`mapping-row ${def.required ? "required-row" : ""}`}>
                    <div className="mapping-label">
                      <span>{def.label}</span>
                      {def.required && <strong className="text-danger">* (إلزامي)</strong>}
                    </div>
                    <div className="mapping-select">
                      <select 
                        value={columnMapping[key] || ""} 
                        onChange={(e) => setColumnMapping({...columnMapping, [key]: e.target.value})}
                      >
                        <option value="">-- تخطي هذا العمود --</option>
                        {excelHeaders.map((header, idx) => (
                          <option key={idx} value={header}>{header}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* الخطوة 3: المعاينة */}
          {step === 3 && (
            <div className="import-preview-container">
              <p className="helper-text mb-3">
                تم العثور على <strong>{previewData.length} سجل</strong> صالح للاستيراد. يرجى معاينة أول 5 سجلات للتأكد من دقة مطابقة الأعمدة:
              </p>

              <div className="table-responsive">
                <table className="family-table">
                  <thead>
                    <tr>
                      {Object.keys(columnMapping).filter(k => columnMapping[k]).map((k) => (
                        <th key={k}>{schemaDefinitions[k].label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 5).map((row, idx) => (
                      <tr key={idx}>
                        {Object.keys(columnMapping).filter(k => columnMapping[k]).map((k) => (
                          <td key={k}>{row[k] || "-"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {previewData.length > 5 && (
                <div className="preview-more-count text-muted mt-2 text-start">
                  + بالإضافة إلى {previewData.length - 5} سجل آخر سيتم استيرادها بالكامل.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            إلغاء
          </button>
          
          {step === 2 && (
            <button onClick={handleProceedToPreview} className="btn btn-primary">
              <FaEye /> معاينة البيانات المستوردة
            </button>
          )}

          {step === 3 && (
            <button onClick={handleSaveImport} className="btn btn-primary" disabled={loading}>
              {loading ? "جاري استيراد وحفظ..." : (
                <>
                  <FaSave /> تأكيد حفظ واستيراد {previewData.length} سجل
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExcelImportModal;
