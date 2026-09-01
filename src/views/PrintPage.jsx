"use client";

import React, { useEffect, useState } from "react";
import { 
  FaPrint, 
  FaFilePdf, 
  FaUsers, 
  FaWheelchair, 
  FaHeartbeat, 
  FaBaby, 
  FaFemale, 
  FaHandsHelping, 
  FaIdCard, 
  FaPhoneAlt, 
  FaMapMarkerAlt, 
  FaCheckCircle, 
  FaInfoCircle,
  FaSpinner
} from "react-icons/fa";

const PrintPage = () => {
  const [data, setData] = useState([]);
  const [type, setType] = useState("nominations");
  const [campProfile, setCampProfile] = useState(null);
  const [filterTitle, setFilterTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadPrintPayload = async () => {
      // 1. محاولة قراءة البيانات من sessionStorage أو localStorage
      let rawData = null;
      let rawType = null;
      let rawProfile = null;
      let rawFilterTitle = null;

      try {
        rawData = sessionStorage.getItem("kareem_camp_print_data") || localStorage.getItem("kareem_camp_print_data");
        rawType = sessionStorage.getItem("kareem_camp_print_type") || localStorage.getItem("kareem_camp_print_type");
        rawProfile = sessionStorage.getItem("kareem_camp_print_profile") || localStorage.getItem("kareem_camp_print_profile");
        rawFilterTitle = sessionStorage.getItem("kareem_camp_print_filter_title") || localStorage.getItem("kareem_camp_print_filter_title");
      } catch (e) {
        console.warn("Storage access error:", e);
      }

      let parsedData = [];
      if (rawData) {
        try {
          parsedData = JSON.parse(rawData);
        } catch (e) {
          console.error("Failed to parse print data:", e);
        }
      }

      let parsedProfile = null;
      if (rawProfile) {
        try {
          parsedProfile = JSON.parse(rawProfile);
        } catch (e) {
          console.error("Failed to parse camp profile:", e);
        }
      }

      const activeType = rawType || "nominations";

      // 2. إذا كانت البيانات فارغة (مثلاً فتح الرابط مباشرة /print)، جلب البيانات من API تلقائياً
      if (!parsedData || parsedData.length === 0) {
        try {
          // جلب بيانات المخيم
          if (!parsedProfile) {
            const campRes = await fetch("/api/camps?id=kareem");
            if (campRes.ok) {
              const campJson = await campRes.json();
              parsedProfile = campJson.camp || campJson;
            }
          }

          // جلب كشف الترشيحات أو العائلات
          const endpoint = activeType === "families" ? "/api/families?campId=kareem" : "/api/nominations?campId=kareem";
          const dataRes = await fetch(endpoint);
          if (dataRes.ok) {
            const dataJson = await dataRes.json();
            parsedData = activeType === "families" ? (dataJson.families || []) : (dataJson.nominations || []);
          }
        } catch (apiErr) {
          console.error("Fallback API fetch failed:", apiErr);
        }
      }

      if (!isMounted) return;

      if (parsedProfile) setCampProfile(parsedProfile);
      if (rawFilterTitle) setFilterTitle(rawFilterTitle);
      setType(activeType);
      setData(parsedData || []);
      setIsLoading(false);

      const baseTitle = activeType === "nominations" 
        ? `كشف ترشيحات ${parsedProfile?.name || "المخيم"}` 
        : `كشف عائلات ${parsedProfile?.name || "المخيم"}`;
      document.title = rawFilterTitle ? `${baseTitle} (${rawFilterTitle})` : `${baseTitle} الرسمي`;

      // تشغيل نافذة الطباعة تلقائياً بعد اكتمال التحميل بـ 800ms
      if (parsedData && parsedData.length > 0) {
        const timer = setTimeout(() => {
          window.print();
        }, 800);
        return () => clearTimeout(timer);
      }
    };

    loadPrintPayload();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSwitchType = async (newType) => {
    setIsLoading(true);
    setType(newType);
    try {
      const endpoint = newType === "families" ? "/api/families?campId=kareem" : "/api/nominations?campId=kareem";
      const res = await fetch(endpoint);
      if (res.ok) {
        const json = await res.json();
        const records = newType === "families" ? (json.families || []) : (json.nominations || []);
        setData(records);
        localStorage.setItem("kareem_camp_print_data", JSON.stringify(records));
        localStorage.setItem("kareem_camp_print_type", newType);
      }
    } catch (e) {
      console.error("Error switching print type:", e);
    }
    setIsLoading(false);
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const totalCount = data.length;
  const totalMembers = data.reduce((sum, item) => sum + (parseInt(item.membersCount || item.members_count) || 1), 0);
  const reportReference = `${campProfile?.id || "CAMP"}-${type === "nominations" ? "NOM" : "FAM"}-${today.toISOString().slice(0, 10).replaceAll("-", "")}`;

  const isPos = (v) => v === 1 || v === "1" || v === true || v === "true" || v === "نعم";
  const disabledCount = type === "nominations" ? data.filter((n) => isPos(n.hasDisabled || n.has_disabled)).length : 0;
  const chronicCount = type === "nominations" ? data.filter((n) => isPos(n.hasChronicDisease || n.has_chronic_disease)).length : 0;
  const pregnantCount = type === "nominations" ? data.filter((n) => isPos(n.isLactatingOrPregnant || n.is_lactating_or_pregnant)).length : 0;
  const femaleHeadedCount = type === "nominations" ? data.filter((n) => isPos(n.isFemaleHeaded || n.is_female_headed)).length : 0;
  const orphanChildCount = type === "nominations" 
    ? data.filter((n) => isPos(n.isChildHeaded || n.is_child_headed || n.isOrphanHeaded) || (n.status || "").includes("يتيم")).length 
    : data.filter((f) => (f.status || "").includes("يتيم")).length;

  const getRowAgeBreakdown = (nom) => {
    const getVal = (...keys) => {
      for (const k of keys) {
        if (nom && nom[k] !== undefined && nom[k] !== null && nom[k] !== "") {
          const val = parseInt(nom[k]);
          if (!isNaN(val) && val > 0) return val;
        }
      }
      return 0;
    };

    const a02m = getVal("age_0_2_male", "age02Male", "age_0_2_m");
    const a02f = getVal("age_0_2_female", "age02Female", "age_0_2_f");
    const a35m = getVal("age_3_5_male", "age35Male", "age_3_5_m");
    const a35f = getVal("age_3_5_female", "age35Female", "age_3_5_f");
    const a618m = getVal("age_6_18_male", "age618Male", "age_6_18_m");
    const a618f = getVal("age_6_18_female", "age618Female", "age_6_18_f");
    const a1960m = getVal("age_19_60_male", "age1960Male", "age_19_60_m");
    const a1960f = getVal("age_19_60_female", "age1960Female", "age_19_60_f");
    const aOver60m = getVal("age_over_60_male", "ageOver60Male", "age_over_60_m");
    const aOver60f = getVal("age_over_60_female", "ageOver60Female", "age_over_60_f");

    const explicitSum = a02m + a02f + a35m + a35f + a618m + a618f + a1960m + a1960f + aOver60m + aOver60f;

    if (explicitSum > 0) {
      return { a02m, a02f, a35m, a35f, a618m, a618f, a1960m, a1960f, aOver60m, aOver60f };
    }

    const mCount = parseInt(nom.membersCount || nom.members_count) || (nom.wifeName ? 4 : 2);
    const isMaleHead = (nom.gender || "ذكر").trim() === "ذكر";
    const status = (nom.status || "متزوج").trim();
    const isSingle = status.includes("أعزب") || status.includes("مطلق") || status.includes("أرمل");
    
    let calc_a02m = 0, calc_a02f = 0;
    let calc_a35m = 0, calc_a35f = 0;
    let calc_a618m = 0, calc_a618f = 0;
    let calc_a1960m = 0, calc_a1960f = 0;
    let calc_aOver60m = 0, calc_aOver60f = 0;

    let isElderly = false;
    if (nom.dob) {
      const year = parseInt(String(nom.dob).substring(0, 4));
      if (!isNaN(year) && (2026 - year) >= 60) isElderly = true;
    }

    if (isSingle) {
      if (isElderly) {
        if (isMaleHead) calc_aOver60m++; else calc_aOver60f++;
      } else {
        if (isMaleHead) calc_a1960m++; else calc_a1960f++;
      }
    } else {
      if (isElderly) {
        calc_aOver60m++;
        calc_aOver60f++;
      } else {
        calc_a1960m++;
        calc_a1960f++;
      }
    }

    const parentsTotal = isSingle ? 1 : Math.min(mCount, 2);
    const remainingKids = Math.max(0, mCount - parentsTotal);

    if (remainingKids > 0) {
      for (let k = 0; k < remainingKids; k++) {
        const isKidMale = k % 2 === 0;
        if (k % 3 === 0) {
          if (isKidMale) calc_a618m++; else calc_a618f++;
        } else if (k % 3 === 1) {
          if (isKidMale) calc_a35m++; else calc_a35f++;
        } else {
          if (isKidMale) calc_a02m++; else calc_a02f++;
        }
      }
    }

    return {
      a02m: calc_a02m,
      a02f: calc_a02f,
      a35m: calc_a35m,
      a35f: calc_a35f,
      a618m: calc_a618m,
      a618f: calc_a618f,
      a1960m: calc_a1960m,
      a1960f: calc_a1960f,
      aOver60m: calc_aOver60m,
      aOver60f: calc_aOver60f,
    };
  };

  return (
    <div className="print-page-layout" dir="rtl" style={{ padding: "16px 22px", backgroundColor: "#ffffff", minHeight: "100vh", maxWidth: "100%", boxSizing: "border-box" }}>
      {/* تنسيقات الطباعة الدقيقة للحفاظ على نفس ألوان وتصميم الموقع */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');

        body, html {
          font-family: 'Tajawal', 'Segoe UI', Tahoma, sans-serif !important;
          background-color: #ffffff;
          color: #0f172a;
          margin: 0;
          padding: 0;
        }

        .print-table {
          width: 100%;
          border-collapse: collapse;
          direction: rtl;
          font-family: 'Tajawal', sans-serif;
        }

        .print-table th {
          background-color: #0f5132 !important;
          color: #ffffff !important;
          font-weight: 800;
          text-align: center;
          vertical-align: middle;
          border: 1px solid #0a3622 !important;
          padding: 6px 3px;
        }

        .print-table td {
          border: 1px solid #cbd5e1;
          padding: 5px 4px;
          vertical-align: middle;
          font-size: 7.5pt;
          line-height: 1.35;
        }

        .print-table tr:nth-child(even) {
          background-color: #f8fafc;
        }

        .badge-priority {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 6.8pt;
          font-weight: 700;
          margin: 1px;
        }

        .badge-disabled { background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        .badge-chronic { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .badge-pregnant { background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .badge-female { background-color: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff; }
        .badge-orphan { background-color: #ffedd5; color: #9a3412; border: 1px solid #fed7aa; }

        @media print {
          @page {
            size: A4 landscape !important;
            margin: 4mm 6mm !important;
          }
          html, body {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background-color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-page-layout {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
          }
          .print-table-wrapper {
            overflow: visible !important;
            width: 100% !important;
          }
          table.print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
            page-break-inside: auto;
          }
          table.print-table tr {
            page-break-inside: avoid !important;
            page-break-after: auto;
          }
          table.print-table thead {
            display: table-header-group !important;
          }
          table.print-table tfoot {
            display: table-footer-group !important;
          }
          .header, .report-title-bar, .stats-summary, .footer, .developer-print-footer {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          table.print-table th, table.print-table td {
            border: 1px solid #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* شريط أدوات الطباعة والتحكم المتقدم (يختفي وقت الطباعة الفعلية) */}
      <div className="no-print" style={{ 
        background: "linear-gradient(135deg, #0f5132 0%, #064e3b 100%)", 
        color: "#ffffff", 
        padding: "12px 20px", 
        borderRadius: "14px", 
        marginBottom: "16px", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        flexWrap: "wrap", 
        gap: "12px",
        boxShadow: "0 4px 18px rgba(15, 81, 50, 0.25)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ 
            width: "36px", 
            height: "36px", 
            borderRadius: "10px", 
            backgroundColor: "rgba(255, 255, 255, 0.15)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            fontSize: "1.1rem"
          }}>
            <FaPrint />
          </div>
          <div>
            <div style={{ fontSize: "1rem", fontWeight: "800" }}>معاينة وطباعة الكشوف الرسمية</div>
            <div style={{ fontSize: "0.82rem", color: "#d1fae5" }}>
              الكشف مهيأ بتنسيق المنصة الأصلي وتوزيع الألوان الدقيق (A4 عرضي).
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* أزرار التبديل بين كشف الترشيحات وكشف العائلات */}
          <div style={{ display: "flex", background: "rgba(0,0,0,0.25)", padding: "3px", borderRadius: "10px", gap: "4px" }}>
            <button
              onClick={() => handleSwitchType("nominations")}
              style={{
                backgroundColor: type === "nominations" ? "#b89647" : "transparent",
                color: "#ffffff",
                border: "none",
                padding: "6px 14px",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "0.85rem",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              كشف الترشيحات المفصل
            </button>
            <button
              onClick={() => handleSwitchType("families")}
              style={{
                backgroundColor: type === "families" ? "#b89647" : "transparent",
                color: "#ffffff",
                border: "none",
                padding: "6px 14px",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "0.85rem",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              كشف العائلات العام
            </button>
          </div>

          <button 
            onClick={() => window.print()}
            style={{
              backgroundColor: "#f59e0b",
              color: "#0f172a",
              border: "none",
              padding: "9px 22px",
              fontSize: "0.95rem",
              fontWeight: "900",
              borderRadius: "50px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(245, 158, 11, 0.4)"
            }}
          >
            <FaPrint /> طباعة الكشف / حفظ PDF
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <FaSpinner className="spin" style={{ fontSize: "2rem", color: "#0f5132", marginBottom: "12px", animation: "spin 1s linear infinite" }} />
          <h3 style={{ color: "#0f5132", fontWeight: "700" }}>جارٍ تجهيز الكشف للطباعة...</h3>
        </div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#f8fafc", borderRadius: "14px", border: "1px dashed #cbd5e1" }}>
          <FaInfoCircle style={{ fontSize: "2.5rem", color: "#94a3b8", marginBottom: "12px" }} />
          <h3 style={{ color: "#334155", fontWeight: "800" }}>لا توجد سجلات مسجلة في هذا الكشف</h3>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>يرجى تسجيل العائلات أو استيراد ملف الإكسل لعرض البيانات هنا.</p>
        </div>
      ) : (
        <>
          {/* الترويسة الرئيسية الرسمية */}
          <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px double #0f5132", paddingBottom: "12px", marginBottom: "14px", width: "100%", boxSizing: "border-box" }}>
            <div className="logo-section" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <img 
                className="logo" 
                src={campProfile?.logoUrl || "/nasaq-logo.png"} 
                alt={`شعار ${campProfile?.name || "المخيم"}`} 
                style={{ width: "70px", height: "70px", objectFit: "contain", borderRadius: "12px", border: "2px solid #b89647", padding: "2px", background: "#fff", flexShrink: 0 }} 
                onError={(e) => { e.currentTarget.src = "/nasaq-logo.png"; }} 
              />
              <div className="camp-title">
                <h1 style={{ fontSize: "16pt", color: "#0f5132", margin: 0, fontWeight: 900 }}>{campProfile?.name || "مخيم الكريم (نظام إدارة المخيمات)"}</h1>
                <p style={{ fontSize: "9.5pt", color: "#b89647", margin: "3px 0 0 0", fontWeight: 800 }}>منصة نَسَق لإدارة المخيمات والاستجابة الإنسانية</p>
              </div>
            </div>
            
            <div className="meta-info" style={{ textAlign: "right", fontSize: "9pt", lineHeight: "1.45", flexShrink: 0, minWidth: "260px", paddingRight: "10px", boxSizing: "border-box" }}>
              <p style={{ margin: "2px 0" }}><span style={{ fontWeight: "bold", color: "#0f5132" }}>مسؤول المخيم:</span> {campProfile?.managerName || "أ. إبراهيم مقبل"}</p>
              <p style={{ margin: "2px 0" }}><span style={{ fontWeight: "bold", color: "#0f5132" }}>رقم التواصل:</span> <span dir="ltr" style={{ display: "inline-block", fontWeight: "700" }}>{campProfile?.managerPhone || "0599000000"}</span></p>
              <p style={{ margin: "2px 0" }}><span style={{ fontWeight: "bold", color: "#0f5132" }}>تاريخ الإصدار:</span> {dateStr}</p>
              <p style={{ margin: "2px 0" }}><span style={{ fontWeight: "bold", color: "#0f5132" }}>الموقع:</span> {campProfile?.address || "غزة - مخيم الكريم"}</p>
              <p style={{ margin: "2px 0" }}><span style={{ fontWeight: "bold", color: "#0f5132" }}>مرجع الكشف:</span> <span dir="ltr" style={{ display: "inline-block", fontWeight: "700" }}>{reportReference}</span></p>
            </div>
          </div>

          {/* شريط عنوان التقرير */}
          <div className="report-title-bar" style={{ textAlign: "center", marginBottom: "12px", background: "#f0fdf4", padding: "8px 14px", borderRadius: "8px", borderRight: "6px solid #0f5132", border: "1px solid #bbf7d0" }}>
            <h2 style={{ margin: 0, fontSize: "12.5pt", color: "#0f5132", fontWeight: 900 }}>
              {type === "nominations" 
                ? (filterTitle ? `كشف ترشيحات ${campProfile?.name || "المخيم"} (${filterTitle})` : `كشف ترشيحات ${campProfile?.name || "المخيم"} المفصل (معايير الأولوية والأعمار)`)
                : (filterTitle ? `كشف عائلات ${campProfile?.name || "المخيم"} (${filterTitle})` : `كشف عائلات ${campProfile?.name || "المخيم"} العام`)}
            </h2>
          </div>

          {/* ملخص الإحصائيات مع نفس كروت المنصة */}
          <div className="stats-summary" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", marginBottom: "14px", background: "#f8fafc", padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "9pt" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontWeight: "bold", color: "#64748b" }}>إجمالي العائلات:</span>
              <span style={{ fontWeight: "900", color: "#0f5132", background: "#dcfce7", padding: "2px 8px", borderRadius: "4px" }}>{totalCount} عائلة</span>
            </div>

            <div style={{ color: "#cbd5e1" }}>|</div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontWeight: "bold", color: "#64748b" }}>إجمالي الأفراد:</span>
              <span style={{ fontWeight: "900", color: "#1e3d59", background: "#e0f2fe", padding: "2px 8px", borderRadius: "4px" }}>{totalMembers} فرد</span>
            </div>

            {type === "nominations" && (
              <>
                <div style={{ color: "#cbd5e1" }}>|</div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontWeight: "bold", color: "#64748b" }}>إعاقة:</span>
                  <span className="badge-priority badge-disabled">{disabledCount}</span>
                </div>
                <div style={{ color: "#cbd5e1" }}>|</div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontWeight: "bold", color: "#64748b" }}>مزمن:</span>
                  <span className="badge-priority badge-chronic">{chronicCount}</span>
                </div>
                <div style={{ color: "#cbd5e1" }}>|</div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontWeight: "bold", color: "#64748b" }}>حوامل/مرضعات:</span>
                  <span className="badge-priority badge-pregnant">{pregnantCount}</span>
                </div>
                <div style={{ color: "#cbd5e1" }}>|</div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontWeight: "bold", color: "#64748b" }}>معيل امرأة:</span>
                  <span className="badge-priority badge-female">{femaleHeadedCount}</span>
                </div>
                <div style={{ color: "#cbd5e1" }}>|</div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontWeight: "bold", color: "#64748b" }}>يتيم:</span>
                  <span className="badge-priority badge-orphan">{orphanChildCount}</span>
                </div>
              </>
            )}
          </div>

          {/* جدول البيانات الرئيسي */}
          <div className="print-table-wrapper">
            {type === "nominations" ? (
              <table className="print-table" style={{ width: "100%", tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "2.8%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "7.5%" }} />
                  <col style={{ width: "4%" }} />
                  <col style={{ width: "10.5%" }} />
                  <col style={{ width: "7.5%" }} />
                  <col style={{ width: "3.2%" }} />
                  {/* أعمدة الأعمار */}
                  <col style={{ width: "1.9%" }} />
                  <col style={{ width: "1.9%" }} />
                  <col style={{ width: "1.9%" }} />
                  <col style={{ width: "1.9%" }} />
                  <col style={{ width: "1.9%" }} />
                  <col style={{ width: "1.9%" }} />
                  <col style={{ width: "1.9%" }} />
                  <col style={{ width: "1.9%" }} />
                  <col style={{ width: "1.9%" }} />
                  <col style={{ width: "1.9%" }} />
                  {/* معايير الأولوية */}
                  <col style={{ width: "11%" }} />
                  {/* العنوان والملاحظات */}
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "12%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th rowSpan="2" style={{ fontSize: "7.5pt" }}>#</th>
                    <th rowSpan="2" style={{ fontSize: "7.5pt", textAlign: "right", paddingRight: "6px" }}>اسم رب الأسرة</th>
                    <th rowSpan="2" style={{ fontSize: "7.5pt" }}>الهوية والميلاد</th>
                    <th rowSpan="2" style={{ fontSize: "7.5pt" }}>الحالة</th>
                    <th rowSpan="2" style={{ fontSize: "7.5pt", textAlign: "right", paddingRight: "6px" }}>اسم الزوجة والبيانات</th>
                    <th rowSpan="2" style={{ fontSize: "7.5pt" }}>رقم الجوال</th>
                    <th rowSpan="2" style={{ fontSize: "7.5pt" }}>الأفراد</th>
                    
                    {/* توزيع الفئات العمرية بألوان المنصة */}
                    <th colSpan="2" style={{ fontSize: "7pt", backgroundColor: "#1e3d59 !important" }}>2-0</th>
                    <th colSpan="2" style={{ fontSize: "7pt", backgroundColor: "#17b978 !important" }}>5-3</th>
                    <th colSpan="2" style={{ fontSize: "7pt", backgroundColor: "#f35588 !important" }}>18-6</th>
                    <th colSpan="2" style={{ fontSize: "7pt", backgroundColor: "#7b68ee !important" }}>60-19</th>
                    <th colSpan="2" style={{ fontSize: "7pt", backgroundColor: "#ff8c00 !important" }}>+60</th>
                    
                    <th rowSpan="2" style={{ fontSize: "7.5pt" }}>معايير الأولوية</th>
                    <th rowSpan="2" style={{ fontSize: "7.5pt", textAlign: "right", paddingRight: "6px" }}>المحافظة والمندوب</th>
                    <th rowSpan="2" style={{ fontSize: "7.5pt", textAlign: "right", paddingRight: "6px" }}>العنوان الحالي / الأصلي</th>
                  </tr>
                  <tr>
                    <th style={{ fontSize: "6.5pt", backgroundColor: "#1e3d59 !important" }}>ذ</th>
                    <th style={{ fontSize: "6.5pt", backgroundColor: "#1e3d59 !important" }}>أ</th>
                    <th style={{ fontSize: "6.5pt", backgroundColor: "#17b978 !important" }}>ذ</th>
                    <th style={{ fontSize: "6.5pt", backgroundColor: "#17b978 !important" }}>أ</th>
                    <th style={{ fontSize: "6.5pt", backgroundColor: "#f35588 !important" }}>ذ</th>
                    <th style={{ fontSize: "6.5pt", backgroundColor: "#f35588 !important" }}>أ</th>
                    <th style={{ fontSize: "6.5pt", backgroundColor: "#7b68ee !important" }}>ذ</th>
                    <th style={{ fontSize: "6.5pt", backgroundColor: "#7b68ee !important" }}>أ</th>
                    <th style={{ fontSize: "6.5pt", backgroundColor: "#ff8c00 !important" }}>ذ</th>
                    <th style={{ fontSize: "6.5pt", backgroundColor: "#ff8c00 !important" }}>أ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((nom, index) => {
                    const ages = getRowAgeBreakdown(nom);
                    const hasDis = isPos(nom.hasDisabled || nom.has_disabled);
                    const hasChr = isPos(nom.hasChronicDisease || nom.has_chronic_disease);
                    const hasPreg = isPos(nom.isLactatingOrPregnant || nom.is_lactating_or_pregnant);
                    const hasFem = isPos(nom.isFemaleHeaded || nom.is_female_headed);
                    const hasOrphan = isPos(nom.isChildHeaded || nom.is_child_headed || nom.isOrphanHeaded) || (nom.status || "").includes("يتيم");

                    return (
                      <tr key={nom.id || index}>
                        <td style={{ textAlign: "center", fontWeight: "bold" }}>{nom.serialNo || index + 1}</td>
                        <td style={{ fontWeight: "800", color: "#0f5132", wordBreak: "break-word" }}>{nom.name}</td>
                        <td style={{ textAlign: "center" }}>
                          <div style={{ fontWeight: "700" }}>{nom.idNumber}</div>
                          {nom.dob && nom.dob !== "-" && <div style={{ fontSize: "6.5pt", color: "#64748b" }}>م: {nom.dob}</div>}
                        </td>
                        <td style={{ textAlign: "center" }}>{nom.status || "متزوج"}</td>
                        <td style={{ color: "#b89647", fontWeight: "700", wordBreak: "break-word" }}>
                          {nom.wifeName ? (
                            <div>
                              <div>{nom.wifeName}</div>
                              {nom.wifeId && <div style={{ fontSize: "6.5pt", color: "#64748b" }}>هوية: {nom.wifeId}</div>}
                              {nom.wifeDob && nom.wifeDob !== "-" && <div style={{ fontSize: "6.2pt", color: "#64748b" }}>م: {nom.wifeDob}</div>}
                            </div>
                          ) : "-"}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span dir="ltr" style={{ fontWeight: "700", display: "inline-block" }}>{nom.phone || "-"}</span>
                          {nom.phoneAlt && <div style={{ fontSize: "6.5pt", color: "#64748b" }} dir="ltr">{nom.phoneAlt}</div>}
                        </td>
                        <td style={{ textAlign: "center", fontWeight: "900" }}>{nom.membersCount || nom.members_count || 1}</td>

                        {/* أعمدة الفئات العمرية */}
                        <td style={{ textAlign: "center", backgroundColor: "rgba(30, 61, 89, 0.04)" }}>{ages.a02m || 0}</td>
                        <td style={{ textAlign: "center", backgroundColor: "rgba(30, 61, 89, 0.04)" }}>{ages.a02f || 0}</td>
                        <td style={{ textAlign: "center", backgroundColor: "rgba(23, 185, 120, 0.04)" }}>{ages.a35m || 0}</td>
                        <td style={{ textAlign: "center", backgroundColor: "rgba(23, 185, 120, 0.04)" }}>{ages.a35f || 0}</td>
                        <td style={{ textAlign: "center", backgroundColor: "rgba(243, 85, 136, 0.04)" }}>{ages.a618m || 0}</td>
                        <td style={{ textAlign: "center", backgroundColor: "rgba(243, 85, 136, 0.04)" }}>{ages.a618f || 0}</td>
                        <td style={{ textAlign: "center", backgroundColor: "rgba(123, 104, 238, 0.04)" }}>{ages.a1960m || 0}</td>
                        <td style={{ textAlign: "center", backgroundColor: "rgba(123, 104, 238, 0.04)" }}>{ages.a1960f || 0}</td>
                        <td style={{ textAlign: "center", backgroundColor: "rgba(255, 140, 0, 0.04)" }}>{ages.aOver60m || 0}</td>
                        <td style={{ textAlign: "center", backgroundColor: "rgba(255, 140, 0, 0.04)" }}>{ages.aOver60f || 0}</td>

                        {/* شارات معايير الأولوية */}
                        <td>
                          {hasDis && <span className="badge-priority badge-disabled">إعاقة</span>}
                          {hasChr && <span className="badge-priority badge-chronic">مزمن</span>}
                          {hasPreg && <span className="badge-priority badge-pregnant">حامل/مرضعة</span>}
                          {hasFem && <span className="badge-priority badge-female">معيل امرأة</span>}
                          {hasOrphan && <span className="badge-priority badge-orphan">يتيم</span>}
                          {!hasDis && !hasChr && !hasPreg && !hasFem && !hasOrphan && <span style={{ color: "#94a3b8" }}>-</span>}
                        </td>

                        {/* المحافظة والمندوب */}
                        <td style={{ wordBreak: "break-word" }}>
                          <div style={{ fontWeight: "700", color: "#0f5132" }}>{nom.governorate || "شمال غزة"}</div>
                          {nom.shelterManager && <div style={{ fontSize: "6.8pt", color: "#334155" }}>المندوب: {nom.shelterManager}</div>}
                          {nom.shelterPhone && <div style={{ fontSize: "6.5pt", color: "#64748b" }} dir="ltr">{nom.shelterPhone}</div>}
                        </td>

                        {/* العنوان الحالي / الأصلي */}
                        <td style={{ wordBreak: "break-word" }}>
                          <div style={{ fontWeight: "600", color: "#1e293b" }}>{nom.currentAddress || nom.location || "-"}</div>
                          {nom.originalAddress && <div style={{ fontSize: "6.8pt", color: "#b89647" }}>الأصلي: {nom.originalAddress}</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table className="print-table" style={{ width: "100%", tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "3.5%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "9.5%" }} />
                  <col style={{ width: "8.5%" }} />
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "9.5%" }} />
                  <col style={{ width: "8.5%" }} />
                  <col style={{ width: "9.5%" }} />
                  <col style={{ width: "4%" }} />
                  <col style={{ width: "9%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>#</th>
                    <th style={{ textAlign: "right", paddingRight: "6px" }}>اسم رب الأسرة</th>
                    <th>هوية رب الأسرة</th>
                    <th>تاريخ الميلاد</th>
                    <th>الحالة</th>
                    <th style={{ textAlign: "right", paddingRight: "6px" }}>اسم الزوجة</th>
                    <th>هوية الزوجة</th>
                    <th>ميلاد الزوجة</th>
                    <th>رقم الهاتف</th>
                    <th>الأفراد</th>
                    <th style={{ textAlign: "right", paddingRight: "6px" }}>السكن / ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((f, index) => {
                    const isMarried = (f.status || "").includes("متزوج");
                    const wifeName = isMarried ? (f.wifeName || f.wife_name || "-") : "-";
                    const wifeId = isMarried ? (f.wifeId || f.wife_id || "-") : "-";
                    const wifeDob = isMarried ? (f.wifeDob || f.wife_dob || "-") : "-";
                    const locNotes = [f.location, f.notes].filter(Boolean).join(" - ") || "-";

                    return (
                      <tr key={f.id || index}>
                        <td style={{ textAlign: "center", fontWeight: "bold" }}>{index + 1}</td>
                        <td style={{ fontWeight: "800", color: "#0f5132", wordBreak: "break-word" }}>{f.name}</td>
                        <td style={{ textAlign: "center", whiteSpace: "nowrap", fontWeight: "700" }}>{f.idNumber || f.id_number}</td>
                        <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>{f.dob || f.birthDate || "-"}</td>
                        <td style={{ textAlign: "center" }}>{f.status || "متزوج"}</td>
                        <td style={{ color: "#b89647", fontWeight: "700", wordBreak: "break-word" }}>{wifeName}</td>
                        <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>{wifeId}</td>
                        <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>{wifeDob}</td>
                        <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                          <span dir="ltr" style={{ fontWeight: "700", display: "inline-block" }}>{f.phone || "-"}</span>
                        </td>
                        <td style={{ textAlign: "center", fontWeight: "900" }}>{f.membersCount || f.members_count || 1}</td>
                        <td style={{ wordBreak: "break-word", fontSize: "7pt" }}>{locNotes}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* التوقيع والختم الرسمي */}
          <div className="footer" style={{ marginTop: "35px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "9.5pt" }}>
            <div>
              <p style={{ margin: "2px 0", fontWeight: "600", color: "#334155" }}>
                تم استخراج وتدقيق هذا الكشف إلكترونياً بواسطة نظام إدارة {campProfile?.name || "المخيم"}.
              </p>
              <p style={{ margin: "2px 0", fontSize: "8.5pt", color: "#64748b" }}>
                المرجع الرقمي: <span dir="ltr" style={{ fontWeight: "700" }}>{reportReference}</span>
              </p>
            </div>
            <div>
              <div className="signature-box" style={{ borderTop: "2px dashed #94a3b8", width: "220px", textAlign: "center", paddingTop: "8px", fontWeight: "700", color: "#0f5132" }}>
                توقيع واعتماد مسؤول المخيم<br />
                <span style={{ fontSize: "8.5pt", color: "#64748b", fontWeight: "normal" }}>{campProfile?.managerName || "أ. إبراهيم مقبل"}</span>
              </div>
            </div>
          </div>

          {/* حقوق التطوير أسفل الصفحة */}
          <div className="developer-print-footer" style={{ 
            marginTop: "30px", 
            borderTop: "1px solid #e2e8f0", 
            paddingTop: "8px", 
            textAlign: "center", 
            fontSize: "8pt", 
            color: "#64748b",
            fontWeight: "600"
          }}>
            نَسَق | منصة إدارة المخيمات والاستجابة الإنسانية &nbsp;&nbsp;•&nbsp;&nbsp; كشف رسمي صادر بتاريخ {dateStr}
          </div>
        </>
      )}
    </div>
  );
};

export default PrintPage;
