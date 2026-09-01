"use client";

import React, { useState, useEffect } from "react";
import { 
  FaEdit, 
  FaTrashAlt, 
  FaSearch, 
  FaUserFriends, 
  FaMapMarkerAlt, 
  FaPhoneAlt, 
  FaIdCard, 
  FaCalendarAlt, 
  FaThList, 
  FaThLarge,
  FaHeart,
  FaFemale,
  FaUser,
  FaHandsHelping
} from "react-icons/fa";
import { formatDateForExcel } from "../utils/exportExcel";

const FamilyTable = ({ families = [], onEdit, onDelete, onFilteredChange }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // 10 أسماء بالصفحة كافتراضي
  const [viewMode, setViewMode] = useState("table"); // "table" or "cards"

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, itemsPerPage]);

  // فلترة العائلات
  const filteredFamilies = families.filter((family) => {
    const term = (searchTerm || "").toLowerCase().trim();
    const matchesSearch = !term || (
      (family.name && family.name.toLowerCase().includes(term)) ||
      (family.phone && family.phone.includes(term)) ||
      (family.idNumber && family.idNumber.includes(term)) ||
      (family.location && family.location.toLowerCase().includes(term)) ||
      (family.wifeName && family.wifeName.toLowerCase().includes(term))
    );

    let matchesStatus = true;
    if (statusFilter === "معيل طفل يتيم") {
      const s = (family.status || "").toLowerCase();
      matchesStatus = s.includes("يتيم") || s.includes("طفل");
      if (!matchesStatus && family.dob) {
        const year = parseInt(String(family.dob).substring(0, 4));
        if (!isNaN(year) && (2026 - year) < 18) matchesStatus = true;
      }
    } else if (statusFilter !== "الكل") {
      matchesStatus = family.status === statusFilter || (family.status || "").includes(statusFilter);
    }

    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    if (onFilteredChange) {
      const activeFilters = [];
      if (statusFilter !== "الكل") activeFilters.push(`حالة: ${statusFilter}`);
      if (searchTerm) activeFilters.push(`بحث: ${searchTerm}`);

      const filterDesc = activeFilters.join(" + ");
      onFilteredChange(filteredFamilies, filterDesc);
    }
  }, [families, searchTerm, statusFilter]);

  const totalPages = itemsPerPage === -1 ? 1 : Math.max(1, Math.ceil(filteredFamilies.length / itemsPerPage));
  const startIndex = (currentPage - 1) * (itemsPerPage === -1 ? filteredFamilies.length : itemsPerPage);
  const paginatedFamilies = itemsPerPage === -1 
    ? filteredFamilies 
    : filteredFamilies.slice(startIndex, startIndex + itemsPerPage);

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

  const getStatusBadge = (status) => {
    const s = (status || "").trim();
    if (s === "متزوج") return { bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0", label: "متزوج" };
    if (s === "أرملة" || s === "أرمل") return { bg: "#fef2f2", color: "#991b1b", border: "#fecaca", label: s };
    if (s === "يتيم") return { bg: "#fffbeb", color: "#92400e", border: "#fde68a", label: "يتيم" };
    if (s === "مطلق" || s === "مطلقة") return { bg: "#faf5ff", color: "#6b21a8", border: "#e9d5ff", label: s };
    return { bg: "#f1f5f9", color: "#334155", border: "#cbd5e1", label: s || "غير محدد" };
  };

  return (
    <div className="table-section-card">
      {/* شريط البحث والفلاتر والتحكم في العرض */}
      <div className="table-controls-bar">
        <div className="search-input-group">
          <FaSearch className="search-icon-inside" aria-hidden="true" />
          <input
            type="text"
            placeholder="ابحث بالاسم، رقم الهوية، الهاتف، أو مكان السكن..."
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
          {/* فلتر الحالة */}
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select-filter-field"
            aria-label="تصفية حسب الحالة الاجتماعية"
          >
            <option value="الكل">كل الحالات الاجتماعية</option>
            <option value="متزوج">متزوج</option>
            <option value="أرملة">أرملة</option>
            <option value="أرمل">أرمل</option>
            <option value="مطلق">مطلق / مطلقة</option>
            <option value="يتيم">يتيم</option>
            <option value="معيل طفل يتيم">معيل طفل يتيم (طفل &lt; 18 أو أسرة أيتام)</option>
          </select>

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
            <strong>{filteredFamilies.length}</strong> عائلة
          </div>
        </div>
      </div>

      {filteredFamilies.length === 0 ? (
        <div className="empty-state-box">
          <div className="empty-state-icon-wrapper">
            <FaUserFriends />
          </div>
          <h3>لم يتم العثور على أي نتائج</h3>
          <p>جرّب تعديل كلمات البحث أو الفلاتر المختارة، أو أضف عائلات جديدة للكشف.</p>
        </div>
      ) : (
        <>
          {/* 1. عرض البطاقات للهواتف (Mobile Cards View) */}
          <div className={`families-cards-mobile-grid ${viewMode === "table" ? "force-hide-cards" : ""} ${viewMode === "cards" ? "force-show-cards" : ""}`}>
            {paginatedFamilies.map((family, index) => {
              const badge = getStatusBadge(family.status);
              return (
                <div key={family.id} className="family-mobile-card">
                  <div className="card-top-row">
                    <div className="card-person-main">
                      <span className="card-serial-pill">#{startIndex + index + 1}</span>
                      <h4 className="card-person-name">{family.name}</h4>
                    </div>
                    <span 
                      className="status-pill-badge" 
                      style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="card-info-grid">
                    <div className="card-info-item">
                      <FaIdCard className="info-icon" />
                      <span>{family.idNumber || "لا يوجد"}</span>
                    </div>

                    <div className="card-info-item">
                      <FaUserFriends className="info-icon" />
                      <span><strong>{family.membersCount || 1}</strong> أفراد</span>
                    </div>

                    {family.phone && (
                      <div className="card-info-item">
                        <FaPhoneAlt className="info-icon text-emerald" />
                        <a href={`tel:${family.phone}`} className="phone-link">{family.phone}</a>
                      </div>
                    )}

                    {family.location && (
                      <div className="card-info-item">
                        <FaMapMarkerAlt className="info-icon text-gold" />
                        <span>{family.location}</span>
                      </div>
                    )}

                    {family.wifeName && family.wifeName !== "لا يوجد" && (
                      <div className="card-info-item full-width">
                        <FaFemale className="info-icon" />
                        <span>الزوجة: {family.wifeName} {family.wifeId ? `(${family.wifeId})` : ""}</span>
                      </div>
                    )}
                  </div>

                  <div className="card-actions-row">
                    <button 
                      onClick={() => onEdit(family)} 
                      className="card-action-btn edit-btn"
                      title="تعديل"
                    >
                      <FaEdit /> <span>تعديل</span>
                    </button>
                    <button 
                      onClick={() => onDelete(family.id, family.name)} 
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

          {/* 2. عرض الجدول لسطح المكتب والشاشات الكبيرة (Desktop Table View) */}
          <div className={`table-responsive-wrapper ${viewMode === "cards" ? "force-hide-table" : ""}`}>
            <table className="nasaq-table">
              <thead>
                <tr>
                  <th style={{ width: "35px" }} className="text-center">#</th>
                  <th style={{ minWidth: "120px" }}>اسم رب الأسرة</th>
                  <th style={{ width: "95px" }}>رقم الهوية</th>
                  <th style={{ width: "80px" }}>تاريخ الميلاد</th>
                  <th style={{ width: "65px" }} className="text-center">الحالة</th>
                  <th style={{ minWidth: "105px" }}>اسم الزوجة</th>
                  <th style={{ width: "90px" }}>هوية الزوجة</th>
                  <th style={{ width: "85px" }}>ميلاد الزوجة</th>
                  <th style={{ width: "95px" }}>رقم الهاتف</th>
                  <th style={{ width: "45px" }} className="text-center">الأفراد</th>
                  <th style={{ minWidth: "85px" }}>مكان السكن</th>
                  <th style={{ minWidth: "80px" }}>ملاحظات</th>
                  <th style={{ width: "120px" }} className="text-center actions-col">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFamilies.map((family, index) => {
                  const badge = getStatusBadge(family.status);
                  return (
                    <tr key={family.id}>
                      <td className="text-center serial-cell">{startIndex + index + 1}</td>
                      <td className="person-name-cell">
                        <strong>{family.name}</strong>
                      </td>
                      <td>
                        <span className="mono-badge">{family.idNumber || "—"}</span>
                      </td>
                      <td>{family.dob ? formatDateForExcel(family.dob) : "—"}</td>
                      <td className="text-center">
                        <span 
                          className="status-pill-badge" 
                          style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td>{family.wifeName || "—"}</td>
                      <td>
                        {family.wifeId && family.wifeId !== "لا يوجد" ? (
                          <span className="mono-badge">{family.wifeId}</span>
                        ) : "—"}
                      </td>
                      <td>{family.wifeDob ? formatDateForExcel(family.wifeDob) : "—"}</td>
                      <td>
                        {family.phone ? (
                          <a href={`tel:${family.phone}`} className="table-phone-link">
                            <FaPhoneAlt className="phone-tiny-icon" />
                            <span>{family.phone}</span>
                          </a>
                        ) : "—"}
                      </td>
                      <td className="text-center">
                        <span className="members-count-badge">{family.membersCount || 1}</span>
                      </td>
                      <td>{family.location || "—"}</td>
                      <td>
                        <span className="notes-snippet" title={family.notes || ""}>
                          {family.notes || "—"}
                        </span>
                      </td>
                      <td className="text-center actions-cell">
                        <div className="table-actions-btns">
                          <button 
                            type="button"
                            onClick={() => onEdit(family)} 
                            className="table-btn-action edit" 
                            title="تعديل بيانات العائلة"
                          >
                            <FaEdit />
                            <span>تعديل</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => onDelete(family.id, family.name)} 
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

          {/* ترقيم الصفحات (Pagination) */}
          {totalPages > 1 && (
            <div className="pagination-bar">
              <div className="pagination-info">
                عرض <strong>{startIndex + 1}</strong> إلى <strong>{Math.min(startIndex + itemsPerPage, filteredFamilies.length)}</strong> من أصل <strong>{filteredFamilies.length}</strong> عائلة
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
                      key={`page-${pageNum}`}
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

export default FamilyTable;
