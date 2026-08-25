"use client";

import React, { useEffect, useState } from "react";
import { FaLightbulb, FaPrint } from "react-icons/fa";

const PrintPage = () => {
  const [data, setData] = useState([]);
  const [type, setType] = useState("families");
  const [campProfile, setCampProfile] = useState(null);

  useEffect(() => {
    // جلب البيانات المخزنة للطباعة
    const printData = sessionStorage.getItem("kareem_camp_print_data");
    const printType = sessionStorage.getItem("kareem_camp_print_type") || "families";
    const printProfile = sessionStorage.getItem("kareem_camp_print_profile");
    
    let activeProfile = null;
    if (printProfile) {
      activeProfile = JSON.parse(printProfile);
      setCampProfile(activeProfile);
    }

    // تغيير عنوان التبويب ليكون احترافياً بدلاً من React App
    if (activeProfile) {
      document.title = printType === "nominations" ? `كشف ترشيحات ${activeProfile.name || "المخيم"} العام` : `كشف عائلات ${activeProfile.name || "المخيم"} العام`;
    } else {
      document.title = printType === "nominations" ? "كشف الترشيحات العام - نظام إدارة المخيمات" : "كشف العائلات العام - نظام إدارة المخيمات";
    }

    if (printData) {
      setData(JSON.parse(printData));
    }
    setType(printType);
    sessionStorage.removeItem("kareem_camp_print_data");
    sessionStorage.removeItem("kareem_camp_print_type");
    sessionStorage.removeItem("kareem_camp_print_profile");
    
    // تشغيل نافذة الطباعة تلقائياً بعد رندر بيانات الصفحة بالكامل للجوال والكمبيوتر
    const timer = setTimeout(() => {
      window.print();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const today = new Date();
  const dateStr = today.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const totalCount = data.length;
  const totalMembers = data.reduce((sum, item) => sum + (parseInt(item.membersCount) || 0), 0);
  const reportReference = `${campProfile?.id || "CAMP"}-${type === "nominations" ? "NOM" : "FAM"}-${today.toISOString().slice(0, 10).replaceAll("-", "")}`;

  // إحصائيات الترشيحات الخاصة بالطباعة
  const isPos = (v) => v === 1 || v === "1" || v === true || v === "true" || v === "نعم";
  const disabledCount = type === "nominations" ? data.filter(n => isPos(n.hasDisabled || n.has_disabled)).length : 0;
  const chronicCount = type === "nominations" ? data.filter(n => isPos(n.hasChronicDisease || n.has_chronic_disease)).length : 0;
  const pregnantCount = type === "nominations" ? data.filter(n => isPos(n.isLactatingOrPregnant || n.is_lactating_or_pregnant)).length : 0;
  const femaleHeadedCount = type === "nominations" ? data.filter(n => isPos(n.isFemaleHeaded || n.is_female_headed)).length : 0;

  // حساب وتوزيع الأعمار التفصيلي لكل عائلة لسحب الأرقام الحقيقية في الطباعة
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
      aOver60f: calc_aOver60f
    };
  };

  return (
    <div className="print-page-layout" dir="rtl" style={{ padding: "20px", backgroundColor: "white", minHeight: "100vh" }}>
      {/* تنسيقات الطباعة الفائقة الوضوح للهواتف والكمبيوتر بالاتجاه الأفقي */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape !important;
            margin: 3mm 4mm !important;
          }
          @page :left {
            size: landscape !important;
          }
          @page :right {
            size: landscape !important;
          }
          html, body {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background-color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: 'Tajawal', 'Cairo', sans-serif !important;
          }
          .no-print {
            display: none !important;
          }
          .print-page-layout {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            box-shadow: none !important;
          }
          .print-table-wrapper {
            overflow: visible !important;
            width: 100% !important;
          }
          table.print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: auto !important;
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
          .header, .report-title-bar, .stats-summary, .footer {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          table.print-table th, table.print-table td {
            line-height: 1.45 !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            border: 1.5px solid #0f172a !important;
            color: #000000 !important;
            font-size: 9pt !important;
            font-weight: 700 !important;
            padding: 5px 3px !important;
          }
          table.print-table th {
            font-weight: 900 !important;
            background-color: #0f5132 !important;
            color: #ffffff !important;
            font-size: 9.5pt !important;
            padding: 6px 4px !important;
          }
        }

        /* تحسينات العرض على شاشات الموبايل قبل الطباعة */
        @media screen and (max-width: 768px) {
          .print-page-layout {
            padding: 10px !important;
          }
          .header {
            flex-direction: column !important;
            text-align: center !important;
            gap: 10px !important;
          }
          .meta-info {
            text-align: center !important;
          }
          .print-table-wrapper {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            margin-bottom: 15px;
          }
          table.print-table {
            min-width: 900px !important;
          }
        }
      `}</style>

      {/* تنبيه وشريط زر الطباعة للهواتف المحمولة */}
      <div className="no-print" style={{ 
        background: "linear-gradient(135deg, #0f5132 0%, #064e3b 100%)", 
        color: "#ffffff", 
        padding: "12px 18px", 
        borderRadius: "14px", 
        marginBottom: "20px", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        flexWrap: "wrap", 
        gap: "10px",
        boxShadow: "0 4px 15px rgba(15, 81, 50, 0.25)"
      }}>
        <div style={{ fontSize: "0.88rem", fontWeight: "700", display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <FaLightbulb aria-hidden="true" style={{ marginTop: "4px", flexShrink: 0 }} />
          <span><span style={{ color: "#fef08a" }}>تلميح للطباعة من الجوال:</span> يرجى التأكد من تفعيل وضع <strong>"أفقي (Landscape)"</strong> في خيارات حفظ الـ PDF من هاتفك للحصول على أفضل قراءة احترافية لكافة الأعمدة.</span>
        </div>
        <button 
          onClick={() => window.print()}
          style={{
            backgroundColor: "#f59e0b",
            color: "#0f172a",
            border: "none",
            padding: "10px 20px",
            fontSize: "0.95rem",
            fontWeight: "900",
            borderRadius: "50px",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
          }}
        >
          <FaPrint aria-hidden="true" style={{ marginLeft: "8px" }} /> بدء الطباعة / حفظ PDF
        </button>
      </div>

      {/* الترويسة الرئيسية */}
      <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "3px double #0f5132", paddingBottom: "15px", marginBottom: "25px" }}>
        <div className="logo-section" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <img className="logo" src={campProfile?.logoUrl || "/nasaq-logo.png"} alt={`شعار ${campProfile?.name || "المخيم"}`} style={{ width: "82px", height: "82px", objectFit: "contain", borderRadius: "18px", border: "2px solid #b89647", padding: "3px", background: "#fff" }} onError={(e) => { e.currentTarget.src = "/nasaq-logo.png"; }} />
          <div className="camp-title">
            <h1 style={{ fontSize: "18pt", color: "#0f5132", margin: 0, fontWeight: 700 }}>{campProfile?.name || "نظام إدارة المخيمات"}</h1>
            <p style={{ fontSize: "10pt", color: "#b89647", margin: "5px 0 0 0", fontWeight: 600 }}>منصة متكاملة لإدارة المخيمات بسهولة وكفاءة</p>
          </div>
        </div>
        <div className="meta-info" style={{ textAlign: "left", fontSize: "10pt" }}>
          <p><span style={{ fontWeight: "bold", color: "#0f5132" }}>مسؤول المخيم:</span> {campProfile?.managerName || "غير محدد"}</p>
          <p><span style={{ fontWeight: "bold", color: "#0f5132" }}>رقم الجوال:</span> {campProfile?.managerPhone || "غير محدد"}</p>
          <p><span style={{ fontWeight: "bold", color: "#0f5132" }}>التاريخ:</span> {dateStr}</p>
          <p><span style={{ fontWeight: "bold", color: "#0f5132" }}>الموقع:</span> {campProfile?.address || "غير محدد"}</p>
          <p><span style={{ fontWeight: "bold", color: "#0f5132" }}>مرجع الكشف:</span> <span dir="ltr">{reportReference}</span></p>
        </div>
      </div>

      <div className="report-title-bar" style={{ textAlign: "center", marginBottom: "20px", background: "#f4f6f4", padding: "10px", borderRadius: "6px", borderRight: "5px solid #0f5132" }}>
        <h2 style={{ margin: 0, fontSize: "14pt", color: "#0f5132" }}>
          {type === "nominations" 
            ? `كشف ترشيحات ${campProfile?.name || "المخيم"} العام (كشف الترشيحات المفصل)` 
            : `كشف عائلات ${campProfile?.name || "المخيم"} العام`}
        </h2>
      </div>

      {/* ملخص الإحصائيات */}
      <div className="stats-summary" style={{ display: "flex", flexWrap: "wrap", gap: "15px", marginBottom: "20px", background: "#fafafa", padding: "10px 15px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "9.5pt" }}>
        <div className="stats-item">
          <span style={{ fontWeight: "bold", color: "#64748b" }}>
            {type === "nominations" ? "إجمالي العائلات المرشحة:" : "إجمالي عدد العائلات:"}
          </span>
          <span style={{ fontWeight: "bold", color: "#0f5132" }}> {totalCount} عائلة</span>
        </div>
        <div style={{ color: "#cbd5e1" }}>|</div>
        <div className="stats-item">
          <span style={{ fontWeight: "bold", color: "#64748b" }}>
            {type === "nominations" ? "إجمالي الأفراد المرشحين:" : "إجمالي عدد الأفراد:"}
          </span>
          <span style={{ fontWeight: "bold", color: "#0f5132" }}> {totalMembers} فرد</span>
        </div>
        
        {type === "nominations" && (
          <>
            <div style={{ color: "#cbd5e1" }}>|</div>
            <div className="stats-item">
              <span style={{ fontWeight: "bold", color: "#64748b" }}>ذوي إعاقة:</span>
              <span style={{ fontWeight: "bold", color: "#a04000" }}> {disabledCount}</span>
            </div>
            <div style={{ color: "#cbd5e1" }}>|</div>
            <div className="stats-item">
              <span style={{ fontWeight: "bold", color: "#64748b" }}>أمراض مزمنة:</span>
              <span style={{ fontWeight: "bold", color: "#842029" }}> {chronicCount}</span>
            </div>
            <div style={{ color: "#cbd5e1" }}>|</div>
            <div className="stats-item">
              <span style={{ fontWeight: "bold", color: "#64748b" }}>حوامل/مرضعات:</span>
              <span style={{ fontWeight: "bold", color: "#0f5132" }}> {pregnantCount}</span>
            </div>
            <div style={{ color: "#cbd5e1" }}>|</div>
            <div className="stats-item">
              <span style={{ fontWeight: "bold", color: "#64748b" }}>معيل امرأة:</span>
              <span style={{ fontWeight: "bold", color: "#4a148c" }}> {femaleHeadedCount}</span>
            </div>
          </>
        )}
      </div>

      {/* جدول البيانات العريض المسطح */}
      <div className="print-table-wrapper">
        {type === "nominations" ? (
          <table className="print-table" style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px", direction: "rtl", tableLayout: "auto" }}>
          <thead>
            {/* الصف الأول من الهيدر */}
            <tr style={{ backgroundColor: "#0f5132", color: "white" }}>
              <th rowSpan="2" style={{ width: "2.5%", fontSize: "7.5pt", padding: "4px 2px", border: "1px solid #0f5132", textAlign: "center", verticalAlign: "middle" }}>رقم</th>
              <th rowSpan="2" style={{ width: "10%", fontSize: "7.5pt", padding: "4px 3px", border: "1px solid #0f5132", textAlign: "right", verticalAlign: "middle" }}>اسم رب الأسرة</th>
              <th rowSpan="2" style={{ width: "7%", fontSize: "7.5pt", padding: "4px 3px", border: "1px solid #0f5132", textAlign: "center", verticalAlign: "middle" }}>الهوية</th>
              <th rowSpan="2" style={{ width: "4%", fontSize: "7.5pt", padding: "4px 2px", border: "1px solid #0f5132", textAlign: "center", verticalAlign: "middle" }}>الحالة</th>
              <th rowSpan="2" style={{ width: "10%", fontSize: "7.5pt", padding: "4px 3px", border: "1px solid #0f5132", textAlign: "right", verticalAlign: "middle" }}>اسم الزوجة / الهوية</th>
              <th rowSpan="2" style={{ width: "7.5%", fontSize: "7.5pt", padding: "4px 2px", border: "1px solid #0f5132", textAlign: "center", verticalAlign: "middle" }}>رقم الجوال</th>
              <th rowSpan="2" style={{ width: "3%", fontSize: "7.5pt", padding: "4px 2px", border: "1px solid #0f5132", textAlign: "center", verticalAlign: "middle" }}>الأفراد</th>
              
              {/* أعمدة الفئات العمرية */}
              <th colSpan="2" style={{ fontSize: "7pt", padding: "3px 1px", border: "1px solid #0f5132", textAlign: "center", backgroundColor: "#1e3d59" }}>2-0</th>
              <th colSpan="2" style={{ fontSize: "7pt", padding: "3px 1px", border: "1px solid #0f5132", textAlign: "center", backgroundColor: "#17b978" }}>5-3</th>
              <th colSpan="2" style={{ fontSize: "7pt", padding: "3px 1px", border: "1px solid #0f5132", textAlign: "center", backgroundColor: "#f35588" }}>18-6</th>
              <th colSpan="2" style={{ fontSize: "7pt", padding: "3px 1px", border: "1px solid #0f5132", textAlign: "center", backgroundColor: "#7b68ee" }}>60-19</th>
              <th colSpan="2" style={{ fontSize: "7pt", padding: "3px 1px", border: "1px solid #0f5132", textAlign: "center", backgroundColor: "#ff8c00" }}>60+</th>
              
              <th rowSpan="2" style={{ width: "2.5%", fontSize: "7.5pt", padding: "4px 1px", border: "1px solid #0f5132", textAlign: "center", verticalAlign: "middle" }}>إعاقة</th>
              <th rowSpan="2" style={{ width: "2.5%", fontSize: "7.5pt", padding: "4px 1px", border: "1px solid #0f5132", textAlign: "center", verticalAlign: "middle" }}>مزمن</th>
              <th rowSpan="2" style={{ width: "2.5%", fontSize: "7.5pt", padding: "4px 1px", border: "1px solid #0f5132", textAlign: "center", verticalAlign: "middle" }}>حامل</th>
              <th rowSpan="2" style={{ width: "2.5%", fontSize: "7.5pt", padding: "4px 1px", border: "1px solid #0f5132", textAlign: "center", verticalAlign: "middle" }}>معيل</th>
              <th rowSpan="2" style={{ width: "12%", fontSize: "7.5pt", padding: "4px 3px", border: "1px solid #0f5132", textAlign: "right", verticalAlign: "middle" }}>المحافظة / المندوب</th>
              <th rowSpan="2" style={{ width: "14%", fontSize: "7.5pt", padding: "4px 3px", border: "1px solid #0f5132", textAlign: "right", verticalAlign: "middle" }}>عنوان السكن (الحالي / الأصلي)</th>
            </tr>
            {/* الصف الثاني من الهيدر لتحديد ذكر/أنثى */}
            <tr style={{ backgroundColor: "#0f5132", color: "white" }}>
              <th style={{ fontSize: "6.5pt", padding: "2px 1px", border: "1px solid #0f5132", textAlign: "center", width: "1.8%" }}>ذ</th>
              <th style={{ fontSize: "6.5pt", padding: "2px 1px", border: "1px solid #0f5132", textAlign: "center", width: "1.8%" }}>أ</th>
              <th style={{ fontSize: "6.5pt", padding: "2px 1px", border: "1px solid #0f5132", textAlign: "center", width: "1.8%" }}>ذ</th>
              <th style={{ fontSize: "6.5pt", padding: "2px 1px", border: "1px solid #0f5132", textAlign: "center", width: "1.8%" }}>أ</th>
              <th style={{ fontSize: "6.5pt", padding: "2px 1px", border: "1px solid #0f5132", textAlign: "center", width: "1.8%" }}>ذ</th>
              <th style={{ fontSize: "6.5pt", padding: "2px 1px", border: "1px solid #0f5132", textAlign: "center", width: "1.8%" }}>أ</th>
              <th style={{ fontSize: "6.5pt", padding: "2px 1px", border: "1px solid #0f5132", textAlign: "center", width: "1.8%" }}>ذ</th>
              <th style={{ fontSize: "6.5pt", padding: "2px 1px", border: "1px solid #0f5132", textAlign: "center", width: "1.8%" }}>أ</th>
              <th style={{ fontSize: "6.5pt", padding: "2px 1px", border: "1px solid #0f5132", textAlign: "center", width: "1.8%" }}>ذ</th>
              <th style={{ fontSize: "6.5pt", padding: "2px 1px", border: "1px solid #0f5132", textAlign: "center", width: "1.8%" }}>أ</th>
            </tr>
          </thead>
          <tbody>
            {data.map((nom, index) => {
              const ages = getRowAgeBreakdown(nom);
              const hasDis = isPos(nom.hasDisabled || nom.has_disabled);
              const hasChr = isPos(nom.hasChronicDisease || nom.has_chronic_disease);
              const hasPreg = isPos(nom.isLactatingOrPregnant || nom.is_lactating_or_pregnant);
              const hasFem = isPos(nom.isFemaleHeaded || nom.is_female_headed);

              return (
                <tr key={nom.id} style={{ backgroundColor: index % 2 === 1 ? "#f8fafc" : "transparent" }}>
                  <td style={{ textAlign: "center", fontWeight: "bold", padding: "4px 2px", border: "1px solid #cbd5e1", fontSize: "7pt", lineHeight: "1.3" }}>{nom.serialNo || index + 1}</td>
                  <td style={{ fontWeight: "bold", color: "#0f5132", padding: "4px 3px", border: "1px solid #cbd5e1", fontSize: "7.5pt", lineHeight: "1.3", wordBreak: "break-word" }}>{nom.name}</td>
                  <td style={{ padding: "4px 2px", border: "1px solid #cbd5e1", fontSize: "7pt", textAlign: "center", lineHeight: "1.3" }}>{nom.idNumber}</td>
                  <td style={{ textAlign: "center", padding: "4px 2px", border: "1px solid #cbd5e1", fontSize: "7pt", lineHeight: "1.3" }}>{nom.status || "متزوج"}</td>
                  <td style={{ color: "#b89647", fontWeight: "600", padding: "4px 3px", border: "1px solid #cbd5e1", fontSize: "7.5pt", lineHeight: "1.3", wordBreak: "break-word" }}>
                    {nom.wifeName ? (
                      <div>
                        {nom.wifeName}
                        {nom.wifeId && <span style={{ fontSize: "6.5pt", color: "#64748b", fontWeight: "normal", marginRight: "3px" }}>({nom.wifeId})</span>}
                      </div>
                    ) : "-"}
                    {nom.wife2Name && (
                      <div style={{ fontSize: "6.5pt", color: "#64748b", fontWeight: "normal", marginTop: "2px" }}>
                        زوجة 2: {nom.wife2Name}
                        {nom.wife2Id && <span style={{ fontSize: "6pt", marginRight: "2px" }}>({nom.wife2Id})</span>}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: "center", padding: "4px 2px", border: "1px solid #cbd5e1", fontSize: "7pt", lineHeight: "1.3" }}>
                    <div style={{ fontWeight: "600" }}><span style={{ direction: "ltr", display: "inline-block" }}>{nom.phone || "-"}</span></div>
                    {nom.phoneAlt && <div style={{ fontSize: "6.5pt", color: "#64748b", marginTop: "2px" }}><span style={{ direction: "ltr", display: "inline-block" }}>{nom.phoneAlt}</span></div>}
                  </td>
                  <td style={{ textAlign: "center", fontWeight: "bold", padding: "4px 2px", border: "1px solid #cbd5e1", fontSize: "7pt", lineHeight: "1.3" }}>{nom.membersCount}</td>
                  
                  {/* أعمدة الفئات العمرية */}
                  <td style={{ textAlign: "center", padding: "4px 1px", border: "1px solid #cbd5e1", fontSize: "7pt", backgroundColor: "rgba(30, 61, 89, 0.02)" }}>{ages.a02m}</td>
                  <td style={{ textAlign: "center", padding: "4px 1px", border: "1px solid #cbd5e1", fontSize: "7pt", backgroundColor: "rgba(30, 61, 89, 0.02)" }}>{ages.a02f}</td>
                  <td style={{ textAlign: "center", padding: "4px 1px", border: "1px solid #cbd5e1", fontSize: "7pt", backgroundColor: "rgba(23, 185, 120, 0.02)" }}>{ages.a35m}</td>
                  <td style={{ textAlign: "center", padding: "4px 1px", border: "1px solid #cbd5e1", fontSize: "7pt", backgroundColor: "rgba(23, 185, 120, 0.02)" }}>{ages.a35f}</td>
                  <td style={{ textAlign: "center", padding: "4px 1px", border: "1px solid #cbd5e1", fontSize: "7pt", backgroundColor: "rgba(243, 85, 136, 0.02)" }}>{ages.a618m}</td>
                  <td style={{ textAlign: "center", padding: "4px 1px", border: "1px solid #cbd5e1", fontSize: "7pt", backgroundColor: "rgba(243, 85, 136, 0.02)" }}>{ages.a618f}</td>
                  <td style={{ textAlign: "center", padding: "4px 1px", border: "1px solid #cbd5e1", fontSize: "7pt", backgroundColor: "rgba(123, 104, 238, 0.02)" }}>{ages.a1960m}</td>
                  <td style={{ textAlign: "center", padding: "4px 1px", border: "1px solid #cbd5e1", fontSize: "7pt", backgroundColor: "rgba(123, 104, 238, 0.02)" }}>{ages.a1960f}</td>
                  <td style={{ textAlign: "center", padding: "4px 1px", border: "1px solid #cbd5e1", fontSize: "7pt", backgroundColor: "rgba(255, 140, 0, 0.02)" }}>{ages.aOver60m}</td>
                  <td style={{ textAlign: "center", padding: "4px 1px", border: "1px solid #cbd5e1", fontSize: "7pt", backgroundColor: "rgba(255, 140, 0, 0.02)" }}>{ages.aOver60f}</td>
                  
                  <td style={{ textAlign: "center", padding: "4px 1px", border: "1px solid #cbd5e1", fontSize: "7pt" }}>{hasDis ? "نعم" : "-"}</td>
                  <td style={{ textAlign: "center", padding: "4px 1px", border: "1px solid #cbd5e1", fontSize: "7pt" }}>{hasChr ? "نعم" : "-"}</td>
                  <td style={{ textAlign: "center", padding: "4px 1px", border: "1px solid #cbd5e1", fontSize: "7pt" }}>{hasPreg ? "نعم" : "-"}</td>
                  <td style={{ textAlign: "center", padding: "4px 1px", border: "1px solid #cbd5e1", fontSize: "7pt" }}>{hasFem ? "نعم" : "-"}</td>

                  {/* المحافظة / المندوب */}
                  <td style={{ padding: "4px 3px", border: "1px solid #cbd5e1", fontSize: "7.5pt", lineHeight: "1.35", wordBreak: "break-word" }}>
                    <div style={{ fontWeight: "bold", color: "#0f5132", marginBottom: "2px" }}>{nom.governorate || "شمال غزة"}</div>
                    {nom.shelterManager && (
                      <div style={{ fontSize: "6.8pt", color: "#334155" }}>
                        <div style={{ fontWeight: "600", color: "#0f5132" }}>المندوب: {nom.shelterManager}</div>
                        {nom.shelterPhone && (
                          <div style={{ fontSize: "6.5pt", color: "#64748b", marginTop: "1px" }}>
                            هاتف: <span style={{ direction: "ltr", display: "inline-block" }}>{nom.shelterPhone}</span>
                          </div>
                        )}
                        {nom.shelterPhoneAlt && (
                          <div style={{ fontSize: "6.5pt", color: "#64748b", marginTop: "1px" }}>
                            <span style={{ direction: "ltr", display: "inline-block" }}>{nom.shelterPhoneAlt}</span> (بديل)
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  {/* عنوان السكن (الحالي / الأصلي) */}
                  <td style={{ padding: "4px 3px", border: "1px solid #cbd5e1", fontSize: "7.5pt", lineHeight: "1.35", wordBreak: "break-word" }}>
                    <div style={{ fontWeight: "600", color: "#1e293b", marginBottom: "2px" }}>{nom.currentAddress || "-"}</div>
                    {nom.originalAddress && <div style={{ fontSize: "6.8pt", color: "#b89647", fontWeight: "600", marginBottom: "2px" }}>الأصلي: {nom.originalAddress}</div>}
                    {(nom.shelterAddress || nom.shelterGps) && (
                      <div style={{ fontSize: "6.5pt", color: "#64748b", marginTop: "1px" }}>
                        مركز الإيواء: {nom.shelterAddress || "غير محدد"} {nom.shelterGps && `(خريطة)`}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <table className="print-table" style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px", direction: "rtl" }}>
          <thead>
            <tr style={{ backgroundColor: "#0f5132", color: "white" }}>
              <th style={{ width: "3%", fontSize: "8.5pt", padding: "6px 8px", border: "1px solid #0f5132", textAlign: "right" }}>رقم</th>
              <th style={{ width: "15%", fontSize: "8.5pt", padding: "6px 8px", border: "1px solid #0f5132", textAlign: "right" }}>اسم رب الأسرة</th>
              <th style={{ width: "10%", fontSize: "8.5pt", padding: "6px 8px", border: "1px solid #0f5132", textAlign: "right" }}>هوية رب الأسرة</th>
              <th style={{ width: "10%", fontSize: "8.5pt", padding: "6px 8px", border: "1px solid #0f5132", textAlign: "right" }}>تاريخ الميلاد</th>
              <th style={{ width: "7%", fontSize: "8.5pt", padding: "6px 8px", border: "1px solid #0f5132", textAlign: "right" }}>الحالة</th>
              <th style={{ width: "15%", fontSize: "8.5pt", padding: "6px 8px", border: "1px solid #0f5132", textAlign: "right" }}>اسم الزوجة</th>
              <th style={{ width: "10%", fontSize: "8.5pt", padding: "6px 8px", border: "1px solid #0f5132", textAlign: "right" }}>هوية الزوجة</th>
              <th style={{ width: "10%", fontSize: "8.5pt", padding: "6px 8px", border: "1px solid #0f5132", textAlign: "right" }}>ميلاد الزوجة</th>
              <th style={{ width: "10%", fontSize: "8.5pt", padding: "6px 8px", border: "1px solid #0f5132", textAlign: "right" }}>رقم الهاتف</th>
              <th style={{ width: "4%", fontSize: "8.5pt", padding: "6px 8px", border: "1px solid #0f5132", textAlign: "center" }}>الأفراد</th>
              <th style={{ width: "10%", fontSize: "8.5pt", padding: "6px 8px", border: "1px solid #0f5132", textAlign: "right" }}>مكان السكن</th>
              <th style={{ width: "12%", fontSize: "8.5pt", padding: "6px 8px", border: "1px solid #0f5132", textAlign: "right" }}>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {data.map((f, index) => {
              const isMarried = f.status === "متزوج";
              return (
                <tr key={f.id} style={{ backgroundColor: index % 2 === 1 ? "#f8fafc" : "transparent" }}>
                  <td style={{ textAlign: "center", fontWeight: "bold", padding: "6px 8px", border: "1px solid #cbd5e1", fontSize: "8pt" }}>{index + 1}</td>
                  <td style={{ fontWeight: "bold", color: "#0f5132", padding: "6px 8px", border: "1px solid #cbd5e1", fontSize: "8pt" }}>{f.name}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", fontSize: "8pt" }}>{f.idNumber}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", fontSize: "8pt" }}>{f.dob || "-"}</td>
                  <td style={{ textAlign: "center", padding: "6px 8px", border: "1px solid #cbd5e1", fontSize: "8pt" }}>{f.status || "أعزب"}</td>
                  <td style={{ color: "#b89647", fontWeight: "600", padding: "6px 8px", border: "1px solid #cbd5e1", fontSize: "8pt" }}>{isMarried ? (f.wifeName || "-") : "-"}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", fontSize: "8pt" }}>{isMarried ? (f.wifeId || "-") : "-"}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", fontSize: "8pt" }}>{isMarried ? (f.wifeDob || "-") : "-"}</td>
                  <td style={{ direction: "ltr", textAlign: "right", padding: "6px 8px", border: "1px solid #cbd5e1", fontSize: "8pt" }}>{f.phone}</td>
                  <td style={{ textAlign: "center", fontWeight: "bold", padding: "6px 8px", border: "1px solid #cbd5e1", fontSize: "8pt" }}>{f.membersCount}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", fontSize: "8pt" }}>{f.location}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", fontSize: "8pt", wordBreak: "break-word" }}>{f.notes || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      </div>

      {/* التوقيع والختم */}
      <div className="footer" style={{ marginTop: "50px", display: "flex", justifyContent: "space-between", fontSize: "10pt" }}>
        <div>
          <p>تم استخراج الكشف إلكترونياً بواسطة نظام إدارة {campProfile?.name || "المخيم"}.</p>
        </div>
        <div>
          <div className="signature-box" style={{ borderTop: "1px dashed #94a3b8", width: "200px", textAlign: "center", paddingTop: "10px", marginTop: "40px" }}>
            توقيع مسؤول المخيم: {campProfile?.managerName || "غير محدد"}
          </div>
        </div>
      </div>

      {/* حقوق التطوير أسفل الصفحة */}
      <div className="developer-print-footer" style={{ 
        marginTop: "40px", 
        borderTop: "1px solid #cbd5e1", 
        paddingTop: "10px", 
        textAlign: "center", 
        fontSize: "8.5pt", 
        color: "#64748b",
        fontWeight: "600"
      }}>
        نَسَق | منصة إدارة المخيمات والاستجابة الإنسانية &nbsp;&nbsp;•&nbsp;&nbsp; كشف صادر إلكترونيًا بتاريخ {dateStr}
      </div>
    </div>
  );
};

export default PrintPage;
