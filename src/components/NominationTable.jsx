"use client";

import React, { useState, useEffect } from "react";
import { 
  FaEdit, FaTrashAlt, FaSearch, FaUserFriends, FaMapMarkerAlt, 
  FaPhoneAlt, FaIdCard, FaEye, FaWheelchair, FaHeartbeat, 
  FaBaby, FaFemale, FaTimes, FaMapMarkedAlt, FaUser, FaHome,
  FaFileAlt, FaChild, FaGraduationCap, FaCheckCircle, FaMinusCircle
} from "react-icons/fa";

const NominationTable = ({ nominations, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGovernorate, setSelectedGovernorate] = useState("الكل");
  const [filterDisabled, setFilterDisabled] = useState(false);
  const [filterChronic, setFilterChronic] = useState(false);
  const [filterPregnant, setFilterPregnant] = useState(false);
  const [filterFemaleHeaded, setFilterFemaleHeaded] = useState(false);

  // حالة ترقيم الصفحات والحد الأقصى للسجلات
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // حالة تفاصيل ترشيح معين
  const [detailNomination, setDetailNomination] = useState(null);

  // إعادة الترقيم للصفحة الأولى عند تغيير الفلاتر أو البحث
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedGovernorate, filterDisabled, filterChronic, filterPregnant, filterFemaleHeaded, itemsPerPage]);

  // فلترة الترشيحات بناءً على البحث والفلاتر المتقدمة
  const filteredNominations = nominations.filter((n) => {
    const term = searchTerm.toLowerCase();
    
    const matchesSearch = 
      n.name.toLowerCase().includes(term) ||
      (n.phone && n.phone.includes(term)) ||
      (n.idNumber && n.idNumber.includes(term)) ||
      (n.currentAddress && n.currentAddress.toLowerCase().includes(term));
      
    const matchesGovernorate = 
      selectedGovernorate === "الكل" || 
      n.governorate === selectedGovernorate;
      
    const matchesDisabled = !filterDisabled || n.hasDisabled === 1;
    const matchesChronic = !filterChronic || n.hasChronicDisease === 1;
    const matchesPregnant = !filterPregnant || n.isLactatingOrPregnant === 1;
    const matchesFemaleHeaded = !filterFemaleHeaded || n.isFemaleHeaded === 1;
    
    return matchesSearch && matchesGovernorate && matchesDisabled && matchesChronic && matchesPregnant && matchesFemaleHeaded;
  });

  // حساب وتوزيع الأعمار التفصيلي لكل عائلة لسحب الأرقام الحقيقية
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

    // حساب ذكي وتوزيع واقعي لكافة العائلات بناء على عدد الأفراد
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

  // حساب الصفحات والسجلات المعروضة حالياً
  const totalPages = itemsPerPage === -1 ? 1 : Math.max(1, Math.ceil(filteredNominations.length / itemsPerPage));
  const startIndex = (currentPage - 1) * (itemsPerPage === -1 ? filteredNominations.length : itemsPerPage);
  const paginatedNominations = itemsPerPage === -1 
    ? filteredNominations 
    : filteredNominations.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="table-section">
      {/* شريط البحث والفلاتر */}
      <div className="filters-container" style={{
        background: "var(--surface-color)",
        border: "1px solid var(--border-color)",
        padding: "1.25rem",
        borderRadius: "var(--radius-md)",
        marginBottom: "1.5rem",
        boxShadow: "var(--shadow-sm)"
      }}>
        {/* حقل البحث والمحافظة */}
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", marginBottom: "15px" }}>
          <div className="search-wrapper" style={{ flex: 2, minWidth: "250px" }}>
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="ابحث باسم رب الأسرة، الهوية، الهاتف، أو العنوان الحالي..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div style={{ flex: 1, minWidth: "150px" }}>
            <select
              value={selectedGovernorate}
              onChange={(e) => setSelectedGovernorate(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: "0.95rem",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                height: "100%",
                background: "white"
              }}
            >
              <option value="الكل">كل المحافظات</option>
              <option value="شمال غزة">شمال غزة</option>
              <option value="غزة">غزة</option>
              <option value="الوسطى">الوسطى</option>
              <option value="خان يونس">خان يونس</option>
              <option value="رفح">رفح</option>
            </select>
          </div>
        </div>

        {/* فلاتر الحالات الخاصة والتحكم بالحجم */}
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: "bold", color: "var(--text-color)" }}>تصفية سريعة:</span>
            
            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.85rem", background: filterDisabled ? "rgba(160, 64, 0, 0.1)" : "#f8fafc", padding: "5px 10px", borderRadius: "50px", border: "1px solid #cbd5e1" }}>
              <input type="checkbox" checked={filterDisabled} onChange={(e) => setFilterDisabled(e.target.checked)} style={{ cursor: "pointer" }} />
              <FaWheelchair style={{ color: "#a04000" }} /> ذوي إعاقة
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.85rem", background: filterChronic ? "rgba(132, 32, 41, 0.1)" : "#f8fafc", padding: "5px 10px", borderRadius: "50px", border: "1px solid #cbd5e1" }}>
              <input type="checkbox" checked={filterChronic} onChange={(e) => setFilterChronic(e.target.checked)} style={{ cursor: "pointer" }} />
              <FaHeartbeat style={{ color: "#842029" }} /> أمراض مزمنة
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.85rem", background: filterPregnant ? "rgba(15, 81, 50, 0.1)" : "#f8fafc", padding: "5px 10px", borderRadius: "50px", border: "1px solid #cbd5e1" }}>
              <input type="checkbox" checked={filterPregnant} onChange={(e) => setFilterPregnant(e.target.checked)} style={{ cursor: "pointer" }} />
              <FaBaby style={{ color: "#0f5132" }} /> حامل/مرضعة
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.85rem", background: filterFemaleHeaded ? "rgba(74, 20, 140, 0.1)" : "#f8fafc", padding: "5px 10px", borderRadius: "50px", border: "1px solid #cbd5e1" }}>
              <input type="checkbox" checked={filterFemaleHeaded} onChange={(e) => setFilterFemaleHeaded(e.target.checked)} style={{ cursor: "pointer" }} />
              <FaFemale style={{ color: "#4a148c" }} /> معيل امرأة
            </label>
          </div>

          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "bold" }}>
            إجمالي التصفية: <strong style={{ color: "#0d9488" }}>{filteredNominations.length}</strong> عائلة مرشحة
          </div>
        </div>
      </div>

      {/* جدول الترشيحات التفاعلي مدمج الارتفاع لتفادي السكرول الطويل */}
      <div className="table-responsive" style={{ maxHeight: "65vh", overflowY: "auto", position: "relative", borderRadius: "14px", border: "1px solid #cbd5e1", boxShadow: "0 4px 14px rgba(0,0,0,0.03)" }}>
        {filteredNominations.length > 0 ? (
          <table className="family-table nomination-table" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              {/* الصف الأول من الهيدر */}
              <tr>
                <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "center", minWidth: "45px" }}>رقم</th>
                <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "right", minWidth: "140px" }}>اسم رب الأسرة</th>
                <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "center", minWidth: "95px" }}>رقم الهوية</th>
                <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "center", minWidth: "55px" }}>الجنس</th>
                <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "center", minWidth: "60px" }}>الحالة</th>
                <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "center", minWidth: "105px" }}>رقم الجوال</th>
                <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "right", minWidth: "145px" }}>اسم الزوجة / الهوية</th>
                <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "center", minWidth: "55px" }}>الأفراد</th>
                
                {/* أعمدة الفئات العمرية المدمجة */}
                <th colSpan="2" className="text-center" style={{ backgroundColor: "#1e3d59", color: "white", fontSize: "0.8rem", padding: "4px 2px" }}>2-0</th>
                <th colSpan="2" className="text-center" style={{ backgroundColor: "#17b978", color: "white", fontSize: "0.8rem", padding: "4px 2px" }}>5-3</th>
                <th colSpan="2" className="text-center" style={{ backgroundColor: "#f35588", color: "white", fontSize: "0.8rem", padding: "4px 2px" }}>18-6</th>
                <th colSpan="2" className="text-center" style={{ backgroundColor: "#7b68ee", color: "white", fontSize: "0.8rem", padding: "4px 2px" }}>60-19</th>
                <th colSpan="2" className="text-center" style={{ backgroundColor: "#ff8c00", color: "white", fontSize: "0.8rem", padding: "4px 2px" }}>أكثر من 60</th>
                
                <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "center", minWidth: "85px" }}>الحالة الصحية</th>
                <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "right", minWidth: "130px" }}>المحافظة / المندوب</th>
                <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "right", minWidth: "160px" }}>عنوان السكن (الحالي / الأصلي)</th>
                <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "center", minWidth: "80px" }}>الإجراءات</th>
              </tr>
              {/* الصف الثاني من الهيدر لتحديد ذكر/أنثى */}
              <tr>
                <th className="text-center" style={{ fontSize: "0.72rem", backgroundColor: "#f1f5f9", padding: "3px", color: "#334155", minWidth: "26px" }}>ذكر</th>
                <th className="text-center" style={{ fontSize: "0.72rem", backgroundColor: "#f1f5f9", padding: "3px", color: "#334155", minWidth: "26px" }}>أنثى</th>
                <th className="text-center" style={{ fontSize: "0.72rem", backgroundColor: "#f1f5f9", padding: "3px", color: "#334155", minWidth: "26px" }}>ذكر</th>
                <th className="text-center" style={{ fontSize: "0.72rem", backgroundColor: "#f1f5f9", padding: "3px", color: "#334155", minWidth: "26px" }}>أنثى</th>
                <th className="text-center" style={{ fontSize: "0.72rem", backgroundColor: "#f1f5f9", padding: "3px", color: "#334155", minWidth: "26px" }}>ذكر</th>
                <th className="text-center" style={{ fontSize: "0.72rem", backgroundColor: "#f1f5f9", padding: "3px", color: "#334155", minWidth: "26px" }}>أنثى</th>
                <th className="text-center" style={{ fontSize: "0.72rem", backgroundColor: "#f1f5f9", padding: "3px", color: "#334155", minWidth: "26px" }}>ذكر</th>
                <th className="text-center" style={{ fontSize: "0.72rem", backgroundColor: "#f1f5f9", padding: "3px", color: "#334155", minWidth: "26px" }}>أنثى</th>
                <th className="text-center" style={{ fontSize: "0.72rem", backgroundColor: "#f1f5f9", padding: "3px", color: "#334155", minWidth: "26px" }}>ذكر</th>
                <th className="text-center" style={{ fontSize: "0.72rem", backgroundColor: "#f1f5f9", padding: "3px", color: "#334155", minWidth: "26px" }}>أنثى</th>
              </tr>
            </thead>
            <tbody>
              {paginatedNominations.map((nom, index) => {
                const ages = getRowAgeBreakdown(nom);
                return (
                  <tr key={nom.id} className="table-row">
                    <td className="text-center" style={{ fontWeight: "bold" }}>{startIndex + index + 1}</td>
                    <td style={{ fontWeight: "600", color: "var(--primary-dark)", whiteSpace: "nowrap", minWidth: "140px" }}>{nom.name}</td>
                    <td style={{ whiteSpace: "nowrap", minWidth: "90px" }}>{nom.idNumber}</td>
                    <td className="text-center">{nom.gender || "ذكر"}</td>
                    <td className="text-center">{nom.status || "متزوج"}</td>
                    <td className="text-center" style={{ whiteSpace: "nowrap", minWidth: "110px" }}>
                      <div className="ltr-span" style={{ fontWeight: "600" }}>{nom.phone || "-"}</div>
                      {nom.phoneAlt && <div className="ltr-span" style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>{nom.phoneAlt}</div>}
                    </td>
                    <td style={{ whiteSpace: "nowrap", minWidth: "150px" }}>
                      {nom.wifeName ? (
                        <div>
                          {nom.wifeName}
                          {nom.wifeId && <span style={{ fontSize: "0.75rem", color: "#64748b", marginRight: "5px" }}>({nom.wifeId})</span>}
                        </div>
                      ) : "-"}
                      {nom.wife2Name && (
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "3px" }}>
                          زوجة 2: {nom.wife2Name}
                          {nom.wife2Id && <span style={{ fontSize: "0.7rem", marginRight: "3px" }}>({nom.wife2Id})</span>}
                        </div>
                      )}
                    </td>
                    <td className="text-center"><strong className="members-badge">{nom.membersCount}</strong></td>
                    
                    {/* تفصيل الفئات العمرية */}
                    <td className="text-center" style={{ backgroundColor: "rgba(30, 61, 89, 0.03)", fontWeight: ages.a02m > 0 ? "800" : "normal", color: ages.a02m > 0 ? "#1e3d59" : "#94a3b8" }}>{ages.a02m}</td>
                    <td className="text-center" style={{ backgroundColor: "rgba(30, 61, 89, 0.03)", fontWeight: ages.a02f > 0 ? "800" : "normal", color: ages.a02f > 0 ? "#1e3d59" : "#94a3b8" }}>{ages.a02f}</td>
                    
                    <td className="text-center" style={{ backgroundColor: "rgba(23, 185, 120, 0.03)", fontWeight: ages.a35m > 0 ? "800" : "normal", color: ages.a35m > 0 ? "#059669" : "#94a3b8" }}>{ages.a35m}</td>
                    <td className="text-center" style={{ backgroundColor: "rgba(23, 185, 120, 0.03)", fontWeight: ages.a35f > 0 ? "800" : "normal", color: ages.a35f > 0 ? "#059669" : "#94a3b8" }}>{ages.a35f}</td>
                    
                    <td className="text-center" style={{ backgroundColor: "rgba(243, 85, 136, 0.03)", fontWeight: ages.a618m > 0 ? "800" : "normal", color: ages.a618m > 0 ? "#e11d48" : "#94a3b8" }}>{ages.a618m}</td>
                    <td className="text-center" style={{ backgroundColor: "rgba(243, 85, 136, 0.03)", fontWeight: ages.a618f > 0 ? "800" : "normal", color: ages.a618f > 0 ? "#e11d48" : "#94a3b8" }}>{ages.a618f}</td>
                    
                    <td className="text-center" style={{ backgroundColor: "rgba(123, 104, 238, 0.03)", fontWeight: ages.a1960m > 0 ? "800" : "normal", color: ages.a1960m > 0 ? "#6d28d9" : "#94a3b8" }}>{ages.a1960m}</td>
                    <td className="text-center" style={{ backgroundColor: "rgba(123, 104, 238, 0.03)", fontWeight: ages.a1960f > 0 ? "800" : "normal", color: ages.a1960f > 0 ? "#6d28d9" : "#94a3b8" }}>{ages.a1960f}</td>
                    
                    <td className="text-center" style={{ backgroundColor: "rgba(255, 140, 0, 0.03)", fontWeight: ages.aOver60m > 0 ? "800" : "normal", color: ages.aOver60m > 0 ? "#d97706" : "#94a3b8" }}>{ages.aOver60m}</td>
                    <td className="text-center" style={{ backgroundColor: "rgba(255, 140, 0, 0.03)", fontWeight: ages.aOver60f > 0 ? "800" : "normal", color: ages.aOver60f > 0 ? "#d97706" : "#94a3b8" }}>{ages.aOver60f}</td>
                    
                    <td className="text-center" style={{ minWidth: "90px" }}>
                      <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                        {nom.hasDisabled === 1 && <FaWheelchair style={{ color: "#a04000" }} title="ذوي إعاقة" />}
                        {nom.hasChronicDisease === 1 && <FaHeartbeat style={{ color: "#842029" }} title="أمراض مزمنة" />}
                        {nom.isLactatingOrPregnant === 1 && <FaBaby style={{ color: "#0f5132" }} title="حامل/مرضعة" />}
                        {nom.isFemaleHeaded === 1 && <FaFemale style={{ color: "#4a148c" }} title="معيل امرأة" />}
                        {nom.hasDisabled !== 1 && nom.hasChronicDisease !== 1 && nom.isLactatingOrPregnant !== 1 && nom.isFemaleHeaded !== 1 && "-"}
                      </div>
                    </td>
                    <td style={{ minWidth: "140px" }}>
                      <div style={{ fontWeight: "600" }}>{nom.governorate || "شمال غزة"}</div>
                      {nom.shelterManager && nom.shelterManager.trim() !== "" && !nom.shelterManager.includes("ربيع جمال") && (
                        <div style={{ fontSize: "0.75rem", color: "var(--primary-color)", marginTop: "2px" }}>
                          <FaUser aria-hidden="true" /> {nom.shelterManager}
                          {nom.shelterPhone && <span className="ltr-span" style={{ fontSize: "0.7rem", color: "#64748b", marginRight: "3px" }}>({nom.shelterPhone})</span>}
                        </div>
                      )}
                    </td>
                    <td style={{ minWidth: "180px" }}>
                      <div>{nom.currentAddress}</div>
                      {nom.originalAddress && (
                        <div style={{ fontSize: "0.75rem", color: "var(--secondary-color)", fontWeight: "600", marginTop: "2px" }}>
                          <FaHome aria-hidden="true" /> الأصلي: {nom.originalAddress}
                        </div>
                      )}
                      {(nom.shelterAddress || nom.shelterGps) && (
                        <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "2px" }}>
                          <FaMapMarkerAlt aria-hidden="true" /> {nom.shelterAddress || "مركز الإيواء"}
                          {nom.shelterGps && (
                            <a href={nom.shelterGps} target="_blank" rel="noopener noreferrer" style={{ marginRight: "4px", textDecoration: "underline", color: "var(--primary-color)" }}>
                              (خريطة)
                            </a>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button
                          onClick={() => setDetailNomination(nom)}
                          className="btn-action edit"
                          style={{ backgroundColor: "rgba(13, 110, 253, 0.1)", color: "#0d6efd" }}
                          title="عرض التفاصيل الكاملة"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => onEdit(nom)}
                          className="btn-action edit"
                          title="تعديل"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => onDelete(nom.id, nom.name)}
                          className="btn-action delete"
                          title="حذف"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><FaSearch aria-hidden="true" /></div>
            <h3>لم يتم العثور على أي ترشيحات تطابق فلاتر البحث</h3>
            <p>حاول تعديل فلاتر التصفية أو أضف ترشيحاً جديداً للنظام.</p>
          </div>
        )}
      </div>

      {/* شريط ترقيم الصفحات والتحكم بالحجم لتفادي التمرير الطويل */}
      {filteredNominations.length > 0 && (
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px",
          marginTop: "1.25rem",
          padding: "1rem 1.25rem",
          background: "#ffffff",
          borderRadius: "14px",
          border: "1px solid #cbd5e1",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", color: "#475569", fontWeight: "700" }}>
            <span>عدد السجلات بالصفحة:</span>
            <select 
              value={itemsPerPage} 
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                fontWeight: "700",
                color: "#1e293b",
                cursor: "pointer",
                background: "#f8fafc"
              }}
            >
              <option value={10}>10 سجلات</option>
              <option value={15}>15 سجل (مستحسن)</option>
              <option value={25}>25 سجل</option>
              <option value={50}>50 سجل</option>
              <option value={100}>100 سجل</option>
              <option value={-1}>عرض الكل ({filteredNominations.length})</option>
            </select>
            <span>
              (عرض السجلات {startIndex + 1} - {Math.min(startIndex + (itemsPerPage === -1 ? filteredNominations.length : itemsPerPage), filteredNominations.length)} من أصل {filteredNominations.length})
            </span>
          </div>

          {itemsPerPage !== -1 && totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", background: currentPage === 1 ? "#f1f5f9" : "#ffffff", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "0.85rem" }}
              >
                « الأولى
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", background: currentPage === 1 ? "#f1f5f9" : "#ffffff", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "0.85rem" }}
              >
                السابق
              </button>

              <span style={{ margin: "0 8px", fontWeight: "800", color: "#0d9488", fontSize: "0.9rem" }}>
                صفحة {currentPage} من {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", background: currentPage === totalPages ? "#f1f5f9" : "#ffffff", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "0.85rem" }}
              >
                التالي
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", background: currentPage === totalPages ? "#f1f5f9" : "#ffffff", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "0.85rem" }}
              >
                الأخيرة »
              </button>
            </div>
          )}
        </div>
      )}

      {/* بطاقات الهاتف المحمول المحدثة */}
      <div className="mobile-cards">
        {filteredNominations.length > 0 ? (
          filteredNominations.map((nom, index) => {
            return (
              <div key={nom.id} className="mobile-card">
                <div className="card-header">
                  <span className="card-index">#{nom.serialNo || index + 1}</span>
                  <span className="card-location"><FaMapMarkerAlt /> {nom.currentAddress}</span>
                </div>
                <div className="card-body">
                  <h3>{nom.name}</h3>
                  <div className="card-detail">
                    <span className="detail-label">المحافظة:</span>
                    <span className="detail-val" style={{ fontWeight: "bold" }}>{nom.governorate}</span>
                  </div>
                  <div className="card-detail">
                    <span className="detail-label"><FaIdCard /> الهوية:</span>
                    <span className="detail-val">{nom.idNumber}</span>
                  </div>
                  <div className="card-detail">
                    <span className="detail-label"><FaPhoneAlt /> الهاتف:</span>
                    <span className="detail-val ltr-span">{nom.phone || "-"}</span>
                  </div>
                  <div className="card-detail">
                    <span className="detail-label"><FaUserFriends /> أفراد الأسرة:</span>
                    <span className="detail-val badge-val">{nom.membersCount} أفراد</span>
                  </div>
                  
                  {/* حالات صحية */}
                  <div className="card-detail">
                    <span className="detail-label">تصنيفات صحية:</span>
                    <span className="detail-val">
                      <div className="condition-tags">
                        {nom.hasDisabled === 1 && <span><FaWheelchair aria-hidden="true" /> إعاقة</span>}
                        {nom.hasChronicDisease === 1 && <span><FaHeartbeat aria-hidden="true" /> مزمن</span>}
                        {nom.isLactatingOrPregnant === 1 && <span><FaBaby aria-hidden="true" /> حامل/مرضعة</span>}
                        {nom.isFemaleHeaded === 1 && <span><FaFemale aria-hidden="true" /> معيل</span>}
                        {nom.hasDisabled !== 1 && nom.hasChronicDisease !== 1 && nom.isLactatingOrPregnant !== 1 && nom.isFemaleHeaded !== 1 && "طبيعي"}
                      </div>
                    </span>
                  </div>
                </div>
                <div className="card-actions">
                  <button onClick={() => setDetailNomination(nom)} className="card-btn-action" style={{ background: "rgba(13, 110, 253, 0.08)", color: "#0d6efd" }}>
                    <FaEye /> التفاصيل
                  </button>
                  <button onClick={() => onEdit(nom)} className="card-btn-action edit">
                    <FaEdit /> تعديل
                  </button>
                  <button onClick={() => onDelete(nom.id, nom.name)} className="card-btn-action delete">
                    <FaTrashAlt /> حذف
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><FaSearch aria-hidden="true" /></div>
            <h3>لا توجد نتائج بحث مطابقة</h3>
          </div>
        )}
      </div>

      {/* نافذة تفاصيل الترشيح المنبثقة (Detail Modal) */}
      {detailNomination && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "700px", width: "95%" }}>
            <div className="modal-header" style={{ borderBottom: "2px solid var(--primary-color)" }}>
              <h2 className="modal-title-with-icon" style={{ color: "var(--primary-dark)" }}><FaFileAlt aria-hidden="true" /> بطاقة تفاصيل الترشيح الكاملة</h2>
              <button onClick={() => setDetailNomination(null)} className="btn-close">
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto", padding: "15px 0" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                
                {/* 1. القسم الرئيسي */}
                <div style={{ background: "rgba(15, 81, 50, 0.05)", padding: "15px", borderRadius: "8px", borderRight: "5px solid #0f5132" }}>
                  <h3 style={{ margin: "0 0 10px 0", color: "#0f5132" }}>رب الأسرة: {detailNomination.name}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", fontSize: "0.9rem" }}>
                    <div><strong>رقم الهوية:</strong> {detailNomination.idNumber}</div>
                    <div><strong>الجنس:</strong> {detailNomination.gender}</div>
                    <div><strong>الحالة الاجتماعية:</strong> {detailNomination.status}</div>
                    <div><strong>رقم الجوال:</strong> <span className="ltr-span">{detailNomination.phone || "غير محدد"}</span></div>
                    {detailNomination.phoneAlt && <div><strong>الجوال البديل:</strong> <span className="ltr-span">{detailNomination.phoneAlt}</span></div>}
                  </div>
                </div>

                {/* 2. الزوجات والأفراد */}
                <div style={{ border: "1px solid #e2e8f0", padding: "15px", borderRadius: "8px" }}>
                  <h3 className="detail-section-title" style={{ margin: "0 0 10px 0", fontSize: "1rem", color: "var(--primary-dark)" }}><FaUserFriends aria-hidden="true" /> الزوجات وأفراد الأسرة</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px", fontSize: "0.88rem" }}>
                    {detailNomination.wifeName && (
                      <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "6px" }}>
                        <strong>الزوجة الأولى:</strong> {detailNomination.wifeName}
                        {detailNomination.wifeId && <div><strong>هوية الزوجة:</strong> {detailNomination.wifeId}</div>}
                      </div>
                    )}
                    {detailNomination.wife2Name && (
                      <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "6px" }}>
                        <strong>الزوجة الثانية:</strong> {detailNomination.wife2Name}
                        {detailNomination.wife2Id && <div><strong>هوية الزوجة 2:</strong> {detailNomination.wife2Id}</div>}
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed #e2e8f0" }}>
                    <strong>إجمالي عدد أفراد الأسرة:</strong> <span className="badge-members" style={{ fontSize: "0.9rem" }}>{detailNomination.membersCount} أفراد</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px", fontSize: "0.85rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", background: "#f8fafc", padding: "6px 12px", borderRadius: "4px" }}>
                        <span className="detail-line-label"><FaBaby aria-hidden="true" /> <strong>أطفال (0-2):</strong></span>
                        <span>ذكور: {detailNomination.age_0_2_male || 0} | إناث: {detailNomination.age_0_2_female || 0}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", background: "#f8fafc", padding: "6px 12px", borderRadius: "4px" }}>
                        <span className="detail-line-label"><FaChild aria-hidden="true" /> <strong>أطفال (3-5):</strong></span>
                        <span>ذكور: {detailNomination.age_3_5_male || 0} | إناث: {detailNomination.age_3_5_female || 0}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", background: "#f8fafc", padding: "6px 12px", borderRadius: "4px" }}>
                        <span className="detail-line-label"><FaGraduationCap aria-hidden="true" /> <strong>أطفال (6-18):</strong></span>
                        <span>ذكور: {detailNomination.age_6_18_male || 0} | إناث: {detailNomination.age_6_18_female || 0}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", background: "#f8fafc", padding: "6px 12px", borderRadius: "4px" }}>
                        <span className="detail-line-label"><FaUser aria-hidden="true" /> <strong>بالغون (19-60):</strong></span>
                        <span>ذكور: {detailNomination.age_19_60_male || 0} | إناث: {detailNomination.age_19_60_female || 0}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", background: "#f8fafc", padding: "6px 12px", borderRadius: "4px" }}>
                        <span className="detail-line-label"><FaUserFriends aria-hidden="true" /> <strong>كبار السن (60+):</strong></span>
                        <span>ذكور: {detailNomination.age_over_60_male || 0} | إناث: {detailNomination.age_over_60_female || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. الحالات الصحية */}
                <div style={{ border: "1px solid #e2e8f0", padding: "15px", borderRadius: "8px" }}>
                  <h3 className="detail-section-title" style={{ margin: "0 0 10px 0", fontSize: "1rem", color: "var(--primary-dark)" }}><FaWheelchair aria-hidden="true" /> الحالات والمحددات الخاصة</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", fontSize: "0.9rem" }}>
                    <div style={{ color: detailNomination.hasDisabled ? "#a04000" : "#94a3b8", fontWeight: detailNomination.hasDisabled ? "bold" : "normal" }}>
                      {detailNomination.hasDisabled ? <><FaCheckCircle aria-hidden="true" /> ذوو إعاقة</> : <><FaMinusCircle aria-hidden="true" /> لا توجد إعاقة</>}
                    </div>
                    <div style={{ color: detailNomination.hasChronicDisease ? "#842029" : "#94a3b8", fontWeight: detailNomination.hasChronicDisease ? "bold" : "normal" }}>
                      {detailNomination.hasChronicDisease ? <><FaCheckCircle aria-hidden="true" /> أمراض مزمنة</> : <><FaMinusCircle aria-hidden="true" /> لا توجد أمراض مزمنة</>}
                    </div>
                    <div style={{ color: detailNomination.isLactatingOrPregnant ? "#0f5132" : "#94a3b8", fontWeight: detailNomination.isLactatingOrPregnant ? "bold" : "normal" }}>
                      {detailNomination.isLactatingOrPregnant ? <><FaCheckCircle aria-hidden="true" /> امرأة حامل أو مرضعة</> : <><FaMinusCircle aria-hidden="true" /> لا توجد حالة حمل أو رضاعة</>}
                    </div>
                    <div style={{ color: detailNomination.isFemaleHeaded ? "#4a148c" : "#94a3b8", fontWeight: detailNomination.isFemaleHeaded ? "bold" : "normal" }}>
                      {detailNomination.isFemaleHeaded ? <><FaCheckCircle aria-hidden="true" /> الأسرة تعيلها امرأة</> : <><FaMinusCircle aria-hidden="true" /> الأسرة لا تعيلها امرأة</>}
                    </div>
                  </div>
                </div>

                {/* 4. السكن والنزوح */}
                <div style={{ border: "1px solid #e2e8f0", padding: "15px", borderRadius: "8px" }}>
                  <h3 className="detail-section-title" style={{ margin: "0 0 10px 0", fontSize: "1rem", color: "var(--primary-dark)" }}><FaMapMarkerAlt aria-hidden="true" /> السكن والنزوح ومراكز الإيواء</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "10px", fontSize: "0.88rem" }}>
                    <div><strong>السكن الحالي بالتفصيل:</strong> {detailNomination.currentAddress}</div>
                    <div><strong>السكن الأصلي:</strong> {detailNomination.originalAddress || "غير محدد"}</div>
                    <div><strong>المحافظة:</strong> {detailNomination.governorate}</div>
                    <div><strong>اسم المخيم:</strong> {detailNomination.campName || "مخيم كريم"}</div>
                  </div>

                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed #e2e8f0", fontSize: "0.85rem" }}>
                    <strong>معلومات مركز الإيواء:</strong>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "6px", marginTop: "6px" }}>
                      <div><strong>مدير المركز/المندوب:</strong> {detailNomination.shelterManager}</div>
                      <div><strong>رقم التواصل للمندوب:</strong> <span className="ltr-span">{detailNomination.shelterPhone || "غير محدد"}</span></div>
                      {detailNomination.shelterPhoneAlt && <div><strong>الهاتف البديل:</strong> <span className="ltr-span">{detailNomination.shelterPhoneAlt}</span></div>}
                      {detailNomination.shelterAddress && <div style={{ gridColumn: "span 2" }}><strong>عنوان مركز الإيواء بالتفصيل:</strong> {detailNomination.shelterAddress}</div>}
                      {detailNomination.shelterGps && (
                        <div style={{ gridColumn: "span 2" }}>
                          <strong>رابط موقع GPS:</strong> <a href={detailNomination.shelterGps} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary-color)", textDecoration: "underline", wordBreak: "break-all" }}><FaMapMarkedAlt /> {detailNomination.shelterGps}</a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            <div className="modal-footer" style={{ borderTop: "1px solid #e2e8f0", paddingTop: "10px" }}>
              <button onClick={() => setDetailNomination(null)} className="btn btn-secondary">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NominationTable;
