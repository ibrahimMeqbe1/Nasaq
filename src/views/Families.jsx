"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import FamilyTable from "../components/FamilyTable";
import FamilyForm from "../components/FamilyForm";
import { addFamily, updateFamily, deleteFamily, deleteAllFamilies, batchAddFamilies } from "../services/familyService";
import { exportToExcel, downloadFamiliesTemplate } from "../utils/exportExcel";
import { exportToPDF } from "../utils/exportPDF";
import { FaPlus, FaFileExcel, FaFilePdf, FaExclamationTriangle, FaTimes, FaUpload, FaDownload, FaTrash, FaUsers, FaUserFriends, FaHome, FaHeart } from "react-icons/fa";

const ExcelImportModal = dynamic(() => import("../components/ExcelImportModal"), { ssr: false });

const Families = ({ families = [], user, campProfile }) => {
  // حساب الإحصائيات السريعة
  const totalFamilies = families.length;
  const totalMembers = families.reduce((acc, curr) => acc + (Number(curr.membersCount) || 0), 0);
  const marriedCount = families.filter((f) => f.status === "متزوج").length;
  const specialCount = families.filter((f) => f.status === "أرملة" || f.status === "يتيم").length;
  // حالات النوافذ المنبثقة
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState("");
  const [selectedFamily, setSelectedFamily] = useState(null); // للعائلة المحددة عند التعديل
  
  // حالات حذف عائلة
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [familyToDelete, setFamilyToDelete] = useState({ id: "", name: "" });

  // إشعار التنبيه
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // فتح تأكيد مسح الكشف بالكامل
  const handleOpenClearAll = () => {
    setClearConfirmText("");
    setIsClearAllModalOpen(true);
  };

  // تنفيذ مسح الكشف بالكامل
  const handleConfirmClearAll = async () => {
    if (clearConfirmText !== "مسح") return;
    try {
      await deleteAllFamilies(user.campId);
      showNotification("تم مسح كشف العائلات بالكامل بنجاح");
      setIsClearAllModalOpen(false);
    } catch (error) {
      console.error("Error clearing families:", error);
      showNotification(error.message || "تعذر مسح الكشف من قاعدة البيانات.", "error");
    }
  };

  // فتح النموذج للإضافة
  const handleOpenAdd = () => {
    setSelectedFamily(null);
    setIsFormOpen(true);
  };

  // فتح النموذج للتعديل
  const handleOpenEdit = (family) => {
    setSelectedFamily(family);
    setIsFormOpen(true);
  };

  // فتح تأكيد الحذف
  const handleOpenDelete = (id, name) => {
    setFamilyToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  // حفظ الإضافة أو التعديل
  const handleSaveFamily = async (formData) => {
    try {
      if (selectedFamily) {
        // تعديل
        await updateFamily(selectedFamily.id, formData);
        showNotification(`تم تحديث بيانات العائلة "${formData.name}" بنجاح`);
      } else {
        // إضافة جديدة
        await addFamily(user.campId, formData);
        showNotification(`تم تسجيل العائلة "${formData.name}" بنجاح`);
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error saving family:", error);
      showNotification(error.message || "تعذر حفظ العائلة في قاعدة البيانات.", "error");
    }
  };

  // معالجة البيانات المستوردة من Excel مع إزالة التكرار تلقائياً
  const handleImportComplete = async (parsedData) => {
    const seenNames = new Set();
    const seenIds = new Set();
    const uniqueIncoming = [];

    parsedData.forEach(record => {
      const nameKey = record.name ? record.name.trim() : "";
      const idKey = record.idNumber ? record.idNumber.trim() : "";
      
      if (nameKey && idKey && !seenNames.has(nameKey) && !seenIds.has(idKey)) {
        seenNames.add(nameKey);
        seenIds.add(idKey);
        uniqueIncoming.push(record);
      }
    });

    const existingNames = new Set((families || []).map(f => f.name ? f.name.trim() : ""));
    const existingIds = new Set((families || []).map(f => f.idNumber ? f.idNumber.trim() : ""));

    const recordsToInsert = uniqueIncoming.filter(record => {
      const nameKey = record.name ? record.name.trim() : "";
      const idKey = record.idNumber ? record.idNumber.trim() : "";
      return !existingNames.has(nameKey) && !existingIds.has(idKey);
    });

    const skippedCount = uniqueIncoming.length - recordsToInsert.length;

    try {
      await batchAddFamilies(user.campId, recordsToInsert);
      const successCount = recordsToInsert.length;
      if (skippedCount > 0) {
        showNotification(`تم استيراد ${successCount} عائلة بنجاح، وتم تخطي ${skippedCount} سجل مكرر.`, "success");
      } else {
        showNotification(`تم استيراد ${successCount} عائلة بنجاح من ملف Excel!`, "success");
      }
    } catch (err) {
      console.error("Error importing records:", err);
      showNotification("حدث خطأ أثناء استيراد البيانات: " + err.message, "error");
    }
  };

  // تنفيذ الحذف النهائي
  const handleConfirmDelete = async () => {
    try {
      await deleteFamily(familyToDelete.id);
      showNotification(`تم حذف سجل عائلة "${familyToDelete.name}" بنجاح`);
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting family:", error);
      showNotification(error.message || "تعذر حذف سجل العائلة من قاعدة البيانات.", "error");
    }
  };

  return (
    <div className="families-page-container">
      {/* التنبيهات النصية السريعة */}
      {notification && (
        <div className={`notification-toast ${notification.type}`} role={notification.type === "error" ? "alert" : "status"} aria-live="polite">
          {notification.message}
        </div>
      )}

      {/* ترويسة صفحة العائلات */}
      <header className="page-header">
        <div className="page-header-info">
          <h1>إدارة سجلات العائلات</h1>
          <p>قائمة كاملة ببيانات العائلات المسجلة في {campProfile?.name || "المخيم"} مع خيارات البحث والتصدير والتحديث.</p>
        </div>
        <div className="page-header-actions">
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <FaPlus /> إضافة عائلة
          </button>
          <button onClick={() => setIsImportOpen(true)} className="btn btn-secondary" title="استيراد من Excel">
            <FaUpload /> استيراد Excel
          </button>
          <button onClick={downloadFamiliesTemplate} className="btn btn-secondary" title="تحميل قالب فارغ جاهز للتعبئة">
            <FaDownload /> قالب الأسر الفارغ
          </button>
          <button 
            onClick={handleOpenClearAll} 
            className="btn btn-danger"
            title="مسح الكشف بالكامل"
            disabled={families.length === 0}
          >
            <FaTrash /> مسح الكشف
          </button>
          <button 
            onClick={() => exportToExcel(families, campProfile)} 
            className="btn btn-excel"
            title="تصدير Excel"
            disabled={families.length === 0}
          >
            <FaFileExcel /> تصدير Excel
          </button>
          <button 
            onClick={() => exportToPDF(families, "families", campProfile)} 
            className="btn btn-pdf"
            title="تصدير PDF"
            disabled={families.length === 0}
          >
            <FaFilePdf /> تصدير PDF
          </button>
        </div>
      </header>

      {/* شبكة الإحصائيات الفاخرة */}
      <div className="families-stats-grid">
        <div className="stat-card-luxury primary">
          <div className="stat-icon-wrapper">
            <FaUsers />
          </div>
          <div className="stat-details">
            <span className="stat-value">{totalFamilies}</span>
            <span className="stat-label">إجمالي العائلات</span>
          </div>
        </div>

        <div className="stat-card-luxury success">
          <div className="stat-icon-wrapper">
            <FaUserFriends />
          </div>
          <div className="stat-details">
            <span className="stat-value">{totalMembers}</span>
            <span className="stat-label">إجمالي المستفيدين (الأفراد)</span>
          </div>
        </div>

        <div className="stat-card-luxury info">
          <div className="stat-icon-wrapper">
            <FaHome />
          </div>
          <div className="stat-details">
            <span className="stat-value">{marriedCount}</span>
            <span className="stat-label">عائلات (متزوجين)</span>
          </div>
        </div>

        <div className="stat-card-luxury warning">
          <div className="stat-icon-wrapper">
            <FaHeart />
          </div>
          <div className="stat-details">
            <span className="stat-value">{specialCount}</span>
            <span className="stat-label">أرامل وأيتام</span>
          </div>
        </div>
      </div>

      {/* جدول العائلات والبحث */}
      <FamilyTable 
        families={families}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      {/* نموذج الإضافة والتعديل */}
      <FamilyForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveFamily}
        family={selectedFamily}
      />

      {/* نافذة استيراد Excel */}
      <ExcelImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        campId={user?.campId}
        importType="families"
        onImportComplete={handleImportComplete}
      />

      {/* نافذة تأكيد الحذف المنبثقة */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="delete-modal-content">
            <div className="delete-modal-header">
              <FaExclamationTriangle className="warning-icon" />
              <h3>تأكيد حذف السجل</h3>
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="btn-close"
              >
                <FaTimes />
              </button>
            </div>
            <div className="delete-modal-body">
              <p>هل تريد حذف عائلة <strong>"{familyToDelete.name}"</strong>؟</p>
              <span className="delete-warning-text">تحذير: سيتم حذف كافة البيانات المرتبطة بهذه العائلة نهائياً ولا يمكن التراجع عن هذا الإجراء لاحقاً.</span>
            </div>
            <div className="delete-modal-actions">
              <button 
                onClick={handleConfirmDelete} 
                className="btn-delete-confirm"
              >
                نعم، احذف السجل
              </button>
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="btn-delete-cancel"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تأكيد مسح الكشف بالكامل */}
      {isClearAllModalOpen && (
        <div className="modal-overlay">
          <div className="delete-modal-content">
            <div className="delete-modal-header" style={{ backgroundColor: "#dc3545", color: "white" }}>
              <FaExclamationTriangle className="warning-icon" style={{ color: "white" }} />
              <h3 style={{ color: "white" }}>تأكيد مسح كشف العائلات بالكامل</h3>
              <button 
                onClick={() => setIsClearAllModalOpen(false)} 
                className="btn-close"
                style={{ color: "white" }}
              >
                <FaTimes />
              </button>
            </div>
            <div className="delete-modal-body" style={{ direction: "rtl", textAlign: "right" }}>
              <p>هل أنت متأكد من رغبتك في مسح الكشف بالكامل؟</p>
              <p style={{ margin: "10px 0", color: "#721c24" }}>سيتم حذف <strong>جميع العائلات ({families.length} عائلة)</strong> المسجلة في هذا المخيم نهائياً.</p>
              <div className="expired-form-group" style={{ marginTop: "15px" }}>
                <label>يرجى كتابة كلمة <strong>"مسح"</strong> في المربع للتأكيد:</label>
                <input 
                  type="text" 
                  value={clearConfirmText} 
                  onChange={(e) => setClearConfirmText(e.target.value)} 
                  placeholder="اكتب مسح للتأكيد" 
                  style={{ width: "100%", padding: "8px 10px", marginTop: "5px", border: "1px solid #cbd5e1", borderRadius: "4px" }}
                />
              </div>
            </div>
            <div className="delete-modal-actions">
              <button 
                onClick={handleConfirmClearAll} 
                className="btn-delete-confirm"
                style={{ backgroundColor: "#dc3545" }}
                disabled={clearConfirmText !== "مسح"}
              >
                نعم، امسح كل السجلات
              </button>
              <button 
                onClick={() => setIsClearAllModalOpen(false)} 
                className="btn-delete-cancel"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Families;
