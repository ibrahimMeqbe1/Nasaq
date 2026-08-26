"use client";

import React, { useState, useEffect } from "react";
import { 
  FaEdit, FaTrashAlt, FaSearch, FaUserFriends, FaMapMarkerAlt, 
  FaPhoneAlt, FaIdCard, FaEye, FaWheelchair, FaHeartbeat, 
  FaBaby, FaFemale, FaThList, FaThLarge, FaCheckCircle,
  FaHandsHelping, FaChild
} from "react-icons/fa";

const NominationTable = ({ nominations = [], onEdit, onDelete, onFilteredChange }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGovernorate, setSelectedGovernorate] = useState("الكل");
  const [filterDisabled, setFilterDisabled] = useState(false);
  const [filterChronic, setFilterChronic] = useState(false);
  const [filterPregnant, setFilterPregnant] = useState(false);
  const [filterFemaleHeaded, setFilterFemaleHeaded] = useState(false);
  const [filterOrphanChild, setFilterOrphanChild] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // 10 أسماء بالصفحة كافتراضي
  const [viewMode, setViewMode] = useState("table"); // "table" or "cards"

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedGovernorate, filterDisabled, filterChronic, filterPregnant, filterFemaleHeaded, filterOrphanChild, itemsPerPage]);

  const isPositive = (val) => val === 1 || val === "1" || val === true || val === "true" || val === "نعم";

  const isOrphanChild = (n) => {
    if (isPositive(n.isChildHeaded) || isPositive(n.isOrphanHeaded)) return true;
    const s = (n.status || "").toLowerCase();
    if (s.includes("يتيم") || s.includes("طفل")) return true;
    if (n.dob && typeof n.dob === "string") {
      const year = parseInt(n.dob.substring(0, 4));
      if (!isNaN(year) && (2026 - year) < 18) return true;
    }
    return false;
  };

  // فلترة الترشيحات
  const filteredNominations = nominations.filter((n) => {
    const term = (searchTerm || "").toLowerCase().trim();
    
    const matchesSearch = !term || (
      (n.name && n.name.toLowerCase().includes(term)) ||
      (n.phone && n.phone.includes(term)) ||
      (n.idNumber && n.idNumber.includes(term)) ||
      (n.currentAddress && n.currentAddress.toLowerCase().includes(term)) ||
      (n.wifeName && n.wifeName.toLowerCase().includes(term))
    );
      
    const matchesGovernorate = 
      selectedGovernorate === "الكل" || 
      n.governorate === selectedGovernorate;
      
    const matchesDisabled = !filterDisabled || isPositive(n.hasDisabled);
    const matchesChronic = !filterChronic || isPositive(n.hasChronicDisease);
    const matchesPregnant = !filterPregnant || isPositive(n.isLactatingOrPregnant);
    const matchesFemaleHeaded = !filterFemaleHeaded || isPositive(n.isFemaleHeaded);
    const matchesOrphanChild = !filterOrphanChild || isOrphanChild(n);
    
    return matchesSearch && matchesGovernorate && matchesDisabled && matchesChronic && matchesPregnant && matchesFemaleHeaded && matchesOrphanChild;
  });

  useEffect(() => {
    if (onFilteredChange) {
      const activeFilters = [];
      if (filterDisabled) activeFilters.push("ذوو إعاقة");
      if (filterChronic) activeFilters.push("أمراض مزمنة");
      if (filterPregnant) activeFilters.push("حوامل / مرضعات");
      if (filterFemaleHeaded) activeFilters.push("معيل امرأة");
      if (filterOrphanChild) activeFilters.push("معيل طفل يتيم");
      if (selectedGovernorate !== "الكل") activeFilters.push(`محافظة ${selectedGovernorate}`);
      if (searchTerm) activeFilters.push(`بحث: ${searchTerm}`);

      const filterDesc = activeFilters.join(" + ");
      onFilteredChange(filteredNominations, filterDesc);
    }
  }, [nominations, searchTerm, selectedGovernorate, filterDisabled, filterChronic, filterPregnant, filterFemaleHeaded, filterOrphanChild]);

  const totalPages = itemsPerPage === -1 ? 1 : Math.max(1, Math.ceil(filteredNominations.length / itemsPerPage));
  const startIndex = (currentPage - 1) * (itemsPerPage === -1 ? filteredNominations.length : itemsPerPage);
  const paginatedNominations = itemsPerPage === -1 
    ? filteredNominations 
    : filteredNominations.slice(startIndex, startIndex + itemsPerPage);

  const getNumVal = (nom, ...keys) => {
    for (const k of keys) {
      if (nom && nom[k] !== undefined && nom[k] !== null && nom[k] !== "") {
        const val = parseInt(nom[k]);
        if (!isNaN(val) && val >= 0) return val;
      }
    }
    return 0;
  };

  const getPageNumbers = () => {
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let start = Math.max(1, currentPage - 2);
    let end = start + maxButtons - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxButtons + 1);
    }

    const pages = [];
    for (let p = start; p <= end; p++) {
      pages.push(p);
    }
    return pages;
  };

  return (
    <div className="table-section-card">
      {/* شريط البحث والفلاتر المتقدمة */}
      <div className="table-controls-bar">
        <div className="search-input-group">
          <FaSearch className="search-icon-inside" aria-hidden="true" />
          <input
            type="text"
            placeholder="ابحث باسم المرشح، رقم الهوية، الجوال أو العنوان..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-field"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")} 
              className="clear-search-btn"
              title="مسح البحث"
            >
              ✕
            </button>
          )}
        </div>

        <div className="filters-and-view-group">
          {/* عدد الأسطر المعروضة بالصفحة */}
          <select 
            value={itemsPerPage} 
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="select-filter-field"
            aria-label="عدد السجلات في الصفحة"
          >
            <option value={10}>10 أسطر</option>
            <option value={25}>25 سطر</option>
            <option value={50}>50 سطر</option>
            <option value={100}>100 سطر</option>
            <option value={-1}>عرض الكل</option>
          </select>

          {/* تبديل العرض بين جدول وبطاقات */}
          <div className="view-mode-toggle" role="group" aria-label="طريقة العرض">
            <button 
              type="button"
              className={`toggle-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="عرض جدول"
            >
              <FaThList aria-hidden="true" />
              <span className="toggle-label">جدول</span>
            </button>
            <button 
              type="button"
              className={`toggle-btn ${viewMode === "cards" ? "active" : ""}`}
              onClick={() => setViewMode("cards")}
              title="عرض بطاقات"
            >
              <FaThLarge aria-hidden="true" />
              <span className="toggle-label">بطاقات</span>
            </button>
          </div>

          <div className="results-counter-badge">
            <strong>{filteredNominations.length}</strong> ترشيح
          </div>
        </div>
      </div>

      {/* شريط فلاتر معايير الهشاشة والأولوية */}
      <div className="vulnerability-filter-chips">
        <span className="chips-label">تصفية حسب الأولوية:</span>
        
        <button
          type="button"
          className={`vuln-chip chip-disabled ${filterDisabled ? "active" : ""}`}
          onClick={() => setFilterDisabled(!filterDisabled)}
        >
          <FaWheelchair />
          <span>ذوو إعاقة</span>
        </button>

        <button
          type="button"
          className={`vuln-chip chip-chronic ${filterChronic ? "active" : ""}`}
          onClick={() => setFilterChronic(!filterChronic)}
        >
          <FaHeartbeat />
          <span>أمراض مزمنة</span>
        </button>

        <button
          type="button"
          className={`vuln-chip chip-pregnant ${filterPregnant ? "active" : ""}`}
          onClick={() => setFilterPregnant(!filterPregnant)}
        >
          <FaBaby />
          <span>حوامل / مرضعات</span>
        </button>

        <button
          type="button"
          className={`vuln-chip chip-female ${filterFemaleHeaded ? "active" : ""}`}
          onClick={() => setFilterFemaleHeaded(!filterFemaleHeaded)}
        >
          <FaFemale />
          <span>معيل امرأة</span>
        </button>

        <button
          type="button"
          className={`vuln-chip chip-orphan ${filterOrphanChild ? "active" : ""}`}
          onClick={() => setFilterOrphanChild(!filterOrphanChild)}
        >
          <FaHandsHelping />
          <span>معيل طفل يتيم</span>
        </button>

        {(filterDisabled || filterChronic || filterPregnant || filterFemaleHeaded || filterOrphanChild) && (
          <button
            type="button"
            className="clear-filters-btn"
            onClick={() => {
              setFilterDisabled(false);
              setFilterChronic(false);
              setFilterPregnant(false);
              setFilterFemaleHeaded(false);
              setFilterOrphanChild(false);
            }}
          >
            إلغاء التصفية
          </button>
        )}
      </div>

      {filteredNominations.length === 0 ? (
        <div className="empty-state-box">
          <div className="empty-state-icon-wrapper">
            <FaUserFriends />
          </div>
          <h3>لا توجد ترشيحات مطابقة</h3>
          <p>جرّب تعديل خيارات البحث أو قم بإضافة عائلات جديدة لكشف الترشيحات.</p>
        </div>
      ) : (
        <>
          {/* 1. عرض البطاقات الذكية للهواتف (Mobile Cards View) */}
          <div className={`families-cards-mobile-grid ${viewMode === "table" ? "force-hide-cards" : ""} ${viewMode === "cards" ? "force-show-cards" : ""}`}>
            {paginatedNominations.map((nom, index) => {
              const age02 = getNumVal(nom, "age_0_2_male", "age02Male") + getNumVal(nom, "age_0_2_female", "age02Female");
              const age35 = getNumVal(nom, "age_3_5_male", "age35Male") + getNumVal(nom, "age_3_5_female", "age35Female");
              const age618 = getNumVal(nom, "age_6_18_male", "age618Male") + getNumVal(nom, "age_6_18_female", "age618Female");
              const age1960 = getNumVal(nom, "age_19_60_male", "age1960Male") + getNumVal(nom, "age_19_60_female", "age1960Female");
              const age60Plus = getNumVal(nom, "age_over_60_male", "ageOver60Male") + getNumVal(nom, "age_over_60_female", "ageOver60Female");

              return (
                <div key={nom.id} className="family-mobile-card nomination-mobile-card">
                  <div className="card-top-row">
                    <div className="card-person-main">
                      <span className="card-serial-pill">#{nom.serialNo || startIndex + index + 1}</span>
                      <h4 className="card-person-name">{nom.name}</h4>
                    </div>
                    <span className="members-count-badge">
                      <strong>{nom.membersCount || 1}</strong> أفراد
                    </span>
                  </div>

                  {/* معايير الهشاشة والحالات الخاصة */}
                  <div className="card-vuln-badges-row">
                    {isPositive(nom.hasDisabled) && (
                      <span className="vuln-pill vuln-pill-disabled"><FaWheelchair /> إعاقة</span>
                    )}
                    {isPositive(nom.hasChronicDisease) && (
                      <span className="vuln-pill vuln-pill-chronic"><FaHeartbeat /> مزمن</span>
                    )}
                    {isPositive(nom.isLactatingOrPregnant) && (
                      <span className="vuln-pill vuln-pill-pregnant"><FaBaby /> حامل/مرضعة</span>
                    )}
                    {isPositive(nom.isFemaleHeaded) && (
                      <span className="vuln-pill vuln-pill-female"><FaFemale /> معيل امرأة</span>
                    )}
                  </div>

                  <div className="card-info-grid">
                    <div className="card-info-item">
                      <FaIdCard className="info-icon" />
                      <span>{nom.idNumber || "لا يوجد"}</span>
                    </div>

                    {nom.phone && (
                      <div className="card-info-item">
                        <FaPhoneAlt className="info-icon text-emerald" />
                        <a href={`tel:${nom.phone}`} className="phone-link">{nom.phone}</a>
                      </div>
                    )}

                    {nom.wifeName && (
                      <div className="card-info-item full-width">
                        <span>الزوجة: {nom.wifeName} {nom.wifeId ? `(${nom.wifeId})` : ""}</span>
                      </div>
                    )}

                    {nom.currentAddress && (
                      <div className="card-info-item full-width">
                        <FaMapMarkerAlt className="info-icon text-gold" />
                        <span>{nom.currentAddress}</span>
                      </div>
                    )}
                  </div>

                  {/* شريط توزيع الأعمار في البطاقة */}
                  <div className="card-age-breakdown-bar">
                    <span className="age-mini-chip chip-c1">0-2: {age02}</span>
                    <span className="age-mini-chip chip-c2">3-5: {age35}</span>
                    <span className="age-mini-chip chip-c3">6-18: {age618}</span>
                    <span className="age-mini-chip chip-c4">19-60: {age1960}</span>
                    <span className="age-mini-chip chip-c5">+60: {age60Plus}</span>
                  </div>

                  <div className="card-actions-row">
                    <button 
                      onClick={() => onEdit(nom)} 
                      className="card-action-btn edit-btn"
                      title="تعديل"
                    >
                      <FaEdit /> <span>تعديل</span>
                    </button>
                    <button 
                      onClick={() => onDelete(nom.id, nom.name)} 
                      className="card-action-btn delete-btn"
                      title="حذف"
                    >
                      <FaTrashAlt /> <span>حذف</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. عرض الجدول لسطح المكتب (Desktop Table View) */}
          <div className={`table-responsive-wrapper ${viewMode === "cards" ? "force-hide-table" : ""}`}>
            <table className="nasaq-table nomination-table">
              <thead>
                <tr>
                  <th rowSpan="2" style={{ width: "45px" }} className="text-center">#</th>
                  <th rowSpan="2" style={{ minWidth: "160px" }}>اسم رب الأسرة</th>
                  <th rowSpan="2" style={{ minWidth: "105px" }}>رقم الهوية</th>
                  <th rowSpan="2" style={{ minWidth: "60px" }} className="text-center">الحالة</th>
                  <th rowSpan="2" style={{ minWidth: "110px" }}>رقم الجوال</th>
                  <th rowSpan="2" style={{ minWidth: "140px" }}>اسم الزوجة</th>
                  <th rowSpan="2" style={{ width: "65px" }} className="text-center">الأفراد</th>
                  
                  {/* أعمدة توزيع الفئات العمرية */}
                  <th colSpan="2" className="text-center age-th age-th-1">0–2</th>
                  <th colSpan="2" className="text-center age-th age-th-2">3–5</th>
                  <th colSpan="2" className="text-center age-th age-th-3">6–18</th>
                  <th colSpan="2" className="text-center age-th age-th-4">19–60</th>
                  <th colSpan="2" className="text-center age-th age-th-5">+60</th>

                  <th rowSpan="2" style={{ minWidth: "130px" }} className="text-center">معايير الأولوية</th>
                  <th rowSpan="2" style={{ minWidth: "140px" }}>العنوان الحالي</th>
                  <th rowSpan="2" style={{ minWidth: "140px" }} className="text-center actions-col">الإجراءات</th>
                </tr>
                <tr>
                  <th className="sub-th">ذ</th><th className="sub-th">أن</th>
                  <th className="sub-th">ذ</th><th className="sub-th">أن</th>
                  <th className="sub-th">ذ</th><th className="sub-th">أن</th>
                  <th className="sub-th">ذ</th><th className="sub-th">أن</th>
                  <th className="sub-th">ذ</th><th className="sub-th">أن</th>
                </tr>
              </thead>
              <tbody>
                {paginatedNominations.map((nom, index) => {
                  return (
                    <tr key={nom.id}>
                      <td className="text-center serial-cell">{nom.serialNo || startIndex + index + 1}</td>
                      <td className="person-name-cell">
                        <strong>{nom.name}</strong>
                      </td>
                      <td>
                        <span className="mono-badge">{nom.idNumber || "—"}</span>
                      </td>
                      <td className="text-center">{nom.status || "متزوج"}</td>
                      <td>
                        {nom.phone ? (
                          <a href={`tel:${nom.phone}`} className="table-phone-link">
                            <FaPhoneAlt className="phone-tiny-icon" />
                            <span>{nom.phone}</span>
                          </a>
                        ) : "—"}
                      </td>
                      <td>{nom.wifeName || "—"}</td>
                      <td className="text-center">
                        <span className="members-count-badge">{nom.membersCount || 1}</span>
                      </td>

                      {/* توزيع الأعمار */}
                      <td className="text-center age-cell">{getNumVal(nom, "age_0_2_male", "age02Male")}</td>
                      <td className="text-center age-cell">{getNumVal(nom, "age_0_2_female", "age02Female")}</td>
                      <td className="text-center age-cell">{getNumVal(nom, "age_3_5_male", "age35Male")}</td>
                      <td className="text-center age-cell">{getNumVal(nom, "age_3_5_female", "age35Female")}</td>
                      <td className="text-center age-cell">{getNumVal(nom, "age_6_18_male", "age618Male")}</td>
                      <td className="text-center age-cell">{getNumVal(nom, "age_6_18_female", "age618Female")}</td>
                      <td className="text-center age-cell">{getNumVal(nom, "age_19_60_male", "age1960Male")}</td>
                      <td className="text-center age-cell">{getNumVal(nom, "age_19_60_female", "age1960Female")}</td>
                      <td className="text-center age-cell">{getNumVal(nom, "age_over_60_male", "ageOver60Male")}</td>
                      <td className="text-center age-cell">{getNumVal(nom, "age_over_60_female", "ageOver60Female")}</td>

                      {/* شارات الأولوية */}
                      <td className="text-center">
                        <div className="table-vuln-icons-row">
                          {isPositive(nom.hasDisabled) && <span title="ذوو إعاقة" className="vuln-mini-icon text-amber"><FaWheelchair /></span>}
                          {isPositive(nom.hasChronicDisease) && <span title="أمراض مزمنة" className="vuln-mini-icon text-rose"><FaHeartbeat /></span>}
                          {isPositive(nom.isLactatingOrPregnant) && <span title="حامل أو مرضع" className="vuln-mini-icon text-emerald"><FaBaby /></span>}
                          {isPositive(nom.isFemaleHeaded) && <span title="معيل امرأة" className="vuln-mini-icon text-purple"><FaFemale /></span>}
                          {isOrphanChild(nom) && <span title="معيل طفل يتيم" className="vuln-mini-icon text-amber" style={{ color: "#d97706" }}><FaHandsHelping /></span>}
                          {!isPositive(nom.hasDisabled) && !isPositive(nom.hasChronicDisease) && !isPositive(nom.isLactatingOrPregnant) && !isPositive(nom.isFemaleHeaded) && !isOrphanChild(nom) && "—"}
                        </div>
                      </td>

                      <td>
                        <span className="address-snippet" title={nom.currentAddress || ""}>
                          {nom.currentAddress || "—"}
                        </span>
                      </td>

                      <td className="text-center actions-cell">
                        <div className="table-actions-btns">
                          <button 
                            type="button"
                            onClick={() => onEdit(nom)} 
                            className="table-btn-action edit" 
                            title="تعديل بيانات الترشيح"
                          >
                            <FaEdit />
                            <span>تعديل</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => onDelete(nom.id, nom.name)} 
                            className="table-btn-action delete" 
                            title="حذف السجل"
                          >
                            <FaTrashAlt />
                            <span>حذف</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ترقيم الصفحات */}
          {totalPages > 1 && (
            <div className="pagination-bar">
              <div className="pagination-info">
                عرض <strong>{startIndex + 1}</strong> إلى <strong>{Math.min(startIndex + itemsPerPage, filteredNominations.length)}</strong> من أصل <strong>{filteredNominations.length}</strong> ترشيح
              </div>

              <div className="pagination-controls">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="page-nav-btn"
                >
                  السابق
                </button>

                <div className="page-numbers-group">
                  {getPageNumbers().map((pageNum) => (
                    <button
                      key={`nom-page-${pageNum}`}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`page-num-btn ${currentPage === pageNum ? "active" : ""}`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="page-nav-btn"
                >
                  التالي
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NominationTable;
