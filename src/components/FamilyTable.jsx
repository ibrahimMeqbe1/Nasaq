import React, { useState, useEffect } from "react";
import { FaEdit, FaTrashAlt, FaSearch, FaUserFriends, FaMapMarkerAlt, FaPhoneAlt, FaIdCard } from "react-icons/fa";
import { formatDateForExcel } from "../utils/exportExcel";

const FamilyTable = ({ families, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  // فلترة العائلات بناءً على كلمة البحث (الاسم أو رقم الهاتف أو الهوية أو مكان السكن)
  const filteredFamilies = families.filter((family) => {
    const term = searchTerm.toLowerCase();
    return (
      family.name.toLowerCase().includes(term) ||
      family.phone.includes(term) ||
      family.idNumber.includes(term) ||
      family.location.toLowerCase().includes(term)
    );
  });

  const totalPages = itemsPerPage === -1 ? 1 : Math.max(1, Math.ceil(filteredFamilies.length / itemsPerPage));
  const startIndex = (currentPage - 1) * (itemsPerPage === -1 ? filteredFamilies.length : itemsPerPage);
  const paginatedFamilies = itemsPerPage === -1 
    ? filteredFamilies 
    : filteredFamilies.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="table-section">
      {/* شريط البحث */}
      <div className="search-container">
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="ابحث باسم رب الأسرة، رقم الهاتف، رقم الهوية أو مكان السكن..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="search-count">
          نتائج البحث: <strong>{filteredFamilies.length}</strong> عائلة
        </div>
      </div>

      {/* جدول العائلات التفاعلي مدمج الارتفاع لتفادي السكرول الطويل */}
      <div className="table-responsive" style={{ maxHeight: "65vh", overflowY: "auto", position: "relative", borderRadius: "14px", border: "1px solid #cbd5e1", boxShadow: "0 4px 14px rgba(0,0,0,0.03)" }}>
        {filteredFamilies.length > 0 ? (
          <table className="family-table" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <tr>
                <th style={{ width: "3%", minWidth: "40px" }} className="text-center">رقم</th>
                <th style={{ width: "15%", minWidth: "130px" }}>اسم رب الأسرة</th>
                <th style={{ width: "9%", minWidth: "105px" }}>هوية رب الأسرة</th>
                <th style={{ width: "8%", minWidth: "90px" }}>تاريخ ميلاد رب الأسرة</th>
                <th style={{ width: "6%", minWidth: "65px" }} className="text-center">الحالة</th>
                <th style={{ width: "13%", minWidth: "120px" }}>اسم الزوجة</th>
                <th style={{ width: "8%", minWidth: "100px" }}>رقم هوية الزوجة</th>
                <th style={{ width: "8%", minWidth: "90px" }}>تاريخ ميلاد الزوجة</th>
                <th style={{ width: "9%", minWidth: "100px" }}>رقم الهاتف</th>
                <th style={{ width: "4%", minWidth: "55px" }} className="text-center">الأفراد</th>
                <th style={{ width: "8%", minWidth: "95px" }}>مكان السكن</th>
                <th style={{ width: "9%", minWidth: "90px" }}>ملاحظات</th>
                <th style={{ width: "5%", minWidth: "70px" }} className="text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFamilies.map((family, index) => {
                const isMarried = family.status === "متزوج";
                
                // تحديد شارة الحالة الاجتماعية
                let statusBg = "#e2e8f0";
                let statusColor = "#334155";
                if (family.status === "متزوج") { statusBg = "#d1e7dd"; statusColor = "#0f5132"; }
                else if (family.status === "أرملة") { statusBg = "#f8d7da"; statusColor = "#842029"; }
                else if (family.status === "يتيم") { statusBg = "#fff3cd"; statusColor = "#664d03"; }
                else if (family.status === "مطلق") { statusBg = "#f3e5f5"; statusColor = "#4a148c"; }

                return (
                  <tr key={family.id} className="table-row">
                    <td className="text-center" style={{ fontWeight: "bold" }}>{startIndex + index + 1}</td>
                    
                    {/* اسم رب الأسرة */}
                    <td style={{ fontWeight: "600", color: "var(--primary-dark)" }}>{family.name}</td>

                    {/* هوية رب الأسرة */}
                    <td>
                      <div className="icon-text">
                        <FaIdCard className="td-icon muted" />
                        <span>{family.idNumber}</span>
                      </div>
                    </td>

                    {/* تاريخ ميلاد رب الأسرة */}
                    <td>{family.dob ? formatDateForExcel(family.dob) : <span className="text-muted">-</span>}</td>

                    {/* الحالة الاجتماعية */}
                    <td className="text-center">
                      <span style={{
                        background: statusBg,
                        color: statusColor,
                        padding: "3px 9px",
                        borderRadius: "50px",
                        fontSize: "0.78rem",
                        fontWeight: "700",
                        display: "inline-block"
                      }}>
                        {family.status || "أعزب"}
                      </span>
                    </td>

                    {/* اسم الزوجة */}
                    <td style={{ fontWeight: "600", color: "#b89647" }}>
                      {isMarried ? (family.wifeName || <span className="text-muted">-</span>) : <span className="text-muted">-</span>}
                    </td>

                    {/* رقم هوية الزوجة */}
                    <td>
                      {isMarried && family.wifeId ? (
                        <div className="icon-text">
                          <FaIdCard className="td-icon muted" style={{ color: "#b89647" }} />
                          <span>{family.wifeId}</span>
                        </div>
                      ) : <span className="text-muted">-</span>}
                    </td>

                    {/* تاريخ ميلاد الزوجة */}
                    <td>
                      {isMarried && family.wifeDob ? formatDateForExcel(family.wifeDob) : <span className="text-muted">-</span>}
                    </td>

                    {/* الهاتف */}
                    <td>
                      <div className="icon-text">
                        <FaPhoneAlt className="td-icon muted" />
                        <span className="ltr-span">{family.phone}</span>
                      </div>
                    </td>

                    {/* عدد الأفراد */}
                    <td className="text-center">
                      <strong className="members-badge">{family.membersCount}</strong>
                    </td>

                    {/* مكان السكن */}
                    <td>
                      <div className="icon-text">
                        <FaMapMarkerAlt className="td-icon gold-icon" />
                        <span>{family.location}</span>
                      </div>
                    </td>

                    {/* ملاحظات */}
                    <td className="notes-cell" title={family.notes} style={{ wordBreak: "break-word" }}>
                      {family.notes || <span className="no-notes">-</span>}
                    </td>

                    {/* الإجراءات */}
                    <td>
                      <div className="actions-cell">
                        <button
                          onClick={() => onEdit(family)}
                          className="btn-action edit"
                          title="تعديل"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => onDelete(family.id, family.name)}
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
            <h3>لم يتم العثور على أي عائلات تطابق بحثك</h3>
            <p>حاول إدخال تفاصيل أخرى أو أضف عائلة جديدة للنظام.</p>
          </div>
        )}
      </div>

      {/* شريط ترقيم الصفحات والتحكم بالحجم */}
      {filteredFamilies.length > 0 && (
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
              <option value={-1}>عرض الكل ({filteredFamilies.length})</option>
            </select>
            <span>
              (عرض السجلات {startIndex + 1} - {Math.min(startIndex + (itemsPerPage === -1 ? filteredFamilies.length : itemsPerPage), filteredFamilies.length)} من أصل {filteredFamilies.length})
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
        {filteredFamilies.length > 0 ? (
          filteredFamilies.map((family, index) => {
            const isMarried = family.status === "متزوج";
            return (
              <div key={family.id} className="mobile-card">
                <div className="card-header">
                  <span className="card-index">#{index + 1}</span>
                  <span className="card-location"><FaMapMarkerAlt /> {family.location}</span>
                </div>
                <div className="card-body">
                  <h3>{family.name}</h3>
                  <div className="card-detail">
                    <span className="detail-label">الحالة الاجتماعية:</span>
                    <span className="detail-val">{family.status || "أعزب"}</span>
                  </div>
                  <div className="card-detail">
                    <span className="detail-label"><FaIdCard /> الهوية:</span>
                    <span className="detail-val">{family.idNumber}</span>
                  </div>
                  {family.dob && (
                    <div className="card-detail">
                      <span className="detail-label">تاريخ الميلاد:</span>
                      <span className="detail-val">{family.dob}</span>
                    </div>
                  )}
                  {isMarried && family.wifeName && (
                    <div style={{ margin: "8px 0", padding: "6px 10px", background: "var(--secondary-light)", borderRadius: "6px", fontSize: "0.85rem" }}>
                      <strong style={{ color: "var(--primary-dark)" }}>الزوجة:</strong> {family.wifeName}
                      {family.wifeId && <div><strong>هوية الزوجة:</strong> {family.wifeId}</div>}
                      {family.wifeDob && <div><strong>تاريخ ميلاد الزوجة:</strong> {family.wifeDob}</div>}
                    </div>
                  )}
                  <div className="card-detail">
                    <span className="detail-label"><FaPhoneAlt /> الهاتف:</span>
                    <span className="detail-val ltr-span">{family.phone}</span>
                  </div>
                  <div className="card-detail">
                    <span className="detail-label"><FaUserFriends /> أفراد الأسرة:</span>
                    <span className="detail-val badge-val">{family.membersCount} أفراد</span>
                  </div>
                  {family.notes && (
                    <div className="card-detail notes">
                      <span className="detail-label">ملاحظات:</span>
                      <p className="detail-val">{family.notes}</p>
                    </div>
                  )}
                </div>
                <div className="card-actions">
                  <button onClick={() => onEdit(family)} className="card-btn-action edit">
                    <FaEdit /> تعديل البيانات
                  </button>
                  <button onClick={() => onDelete(family.id, family.name)} className="card-btn-action delete">
                    <FaTrashAlt /> حذف السجل
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
    </div>
  );
};

export default FamilyTable;
