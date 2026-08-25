"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import NominationTable from "../components/NominationTable";
import NominationForm from "../components/NominationForm";
import { addNomination, updateNomination, deleteNomination, deleteAllNominations, batchAddNominations } from "../services/nominationService";
import { exportNominationsToExcel, downloadNominationsTemplate } from "../utils/exportExcel";
import { exportToPDF } from "../utils/exportPDF";
import { FaPlus, FaFileExcel, FaFilePdf, FaExclamationTriangle, FaTimes, FaUpload, FaDownload, FaTrash, FaClipboardList } from "react-icons/fa";

const ExcelImportModal = dynamic(() => import("../components/ExcelImportModal"), { ssr: false });

const Nominations = ({ nominations = [], user, campProfile }) => {
  // حالات النوافذ المنبثقة
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState("");
  const [selectedNomination, setSelectedNomination] = useState(null); // للترشيح المحدد عند التعديل
  
  // حالات حذف ترشيح
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [nominationToDelete, setNominationToDelete] = useState({ id: "", name: "" });

  // إشعار التنبيه
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // فتح تأكيد مسح كشف الترشيحات بالكامل
  const handleOpenClearAll = () => {
    setClearConfirmText("");
    setIsClearAllModalOpen(true);
  };

  // تنفيذ مسح كشف الترشيحات بالكامل
  const handleConfirmClearAll = async () => {
    if (clearConfirmText !== "مسح") return;
    try {
      await deleteAllNominations(user.campId);
      showNotification("تم مسح كشف الترشيحات بالكامل بنجاح");
      setIsClearAllModalOpen(false);
    } catch (error) {
      console.error("Error clearing nominations:", error);
      showNotification(error.message || "تعذر مسح كشف الترشيحات من قاعدة البيانات.", "error");
    }
  };

  // فتح النموذج للإضافة
  const handleOpenAdd = () => {
    setSelectedNomination(null);
    setIsFormOpen(true);
  };

  // فتح النموذج للتعديل
  const handleOpenEdit = (nomination) => {
    setSelectedNomination(nomination);
    setIsFormOpen(true);
  };

  // فتح تأكيد الحذف
  const handleOpenDelete = (id, name) => {
    setNominationToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  // حفظ الإضافة أو التعديل
  const handleSaveNomination = async (formData) => {
    try {
      if (selectedNomination) {
        // تعديل
        await updateNomination(selectedNomination.id, formData);
        showNotification(`تم تحديث ترشيح "${formData.name}" بنجاح`);
      } else {
        // إضافة جديدة
        await addNomination(user.campId, formData);
        showNotification(`تم تسجيل ترشيح "${formData.name}" بنجاح`);
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error saving nomination:", error);
      showNotification(error.message || "تعذر حفظ الترشيح في قاعدة البيانات.", "error");
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

    const existingNames = new Set((nominations || []).map(n => n.name ? n.name.trim() : ""));
    const existingIds = new Set((nominations || []).map(n => n.idNumber ? n.idNumber.trim() : ""));

    const recordsToInsert = uniqueIncoming.filter(record => {
      const nameKey = record.name ? record.name.trim() : "";
      const idKey = record.idNumber ? record.idNumber.trim() : "";
      return !existingNames.has(nameKey) && !existingIds.has(idKey);
    });

    const skippedCount = uniqueIncoming.length - recordsToInsert.length;

    try {
      await batchAddNominations(user.campId, recordsToInsert);
      const successCount = recordsToInsert.length;
      if (skippedCount > 0) {
        showNotification(`تم استيراد ${successCount} ترشيح بنجاح، وتم تخطي ${skippedCount} سجل مكرر.`, "success");
      } else {
        showNotification(`تم استيراد ${successCount} ترشيح بنجاح من ملف Excel!`, "success");
      }
    } catch (err) {
      console.error("Error importing nominations:", err);
      showNotification("حدث خطأ أثناء استيراد البيانات: " + err.message, "error");
    }
  };

  // تنفيذ الحذف النهائي
  const handleConfirmDelete = async () => {
    try {
      await deleteNomination(nominationToDelete.id);
      showNotification(`تم حذف سجل المرشح "${nominationToDelete.name}" بنجاح`);
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting nomination:", error);
      showNotification(error.message || "تعذر حذف الترشيح من قاعدة البيانات.", "error");
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

      {/* ترويسة صفحة الترشيحات */}
      <header className="page-header">
        <div className="page-header-info">
          <h1><FaClipboardList aria-hidden="true" /> إدارة كشف الترشيحات المفصل</h1>
          <p>قائمة كاملة بالعائلات المرشحة للمساعدات في {campProfile?.name || "المخيم"} مع فلترة الحالات الصحية الخاصة والمحافظات وخيارات تصدير التقارير.</p>
        </div>
        <div className="page-header-actions">
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <FaPlus /> إضافة عائلة مرشحة
          </button>
          <button onClick={() => setIsImportOpen(true)} className="btn btn-secondary" title="استيراد من Excel">
            <FaUpload /> استيراد Excel
          </button>
          <button onClick={downloadNominationsTemplate} className="btn btn-secondary" title="تحميل قالب فارغ جاهز للتعبئة">
            <FaDownload /> قالب الترشيحات الفارغ
          </button>
          <button 
            onClick={handleOpenClearAll} 
            className="btn btn-danger"
            title="مسح الكشف بالكامل"
            disabled={nominations.length === 0}
          >
            <FaTrash /> مسح الكشف
          </button>
          <button 
            onClick={() => exportNominationsToExcel(nominations, campProfile)} 
            className="btn btn-excel"
            title="تصدير Excel"
            disabled={nominations.length === 0}
          >
            <FaFileExcel /> تصدير Excel
          </button>
          <button 
            onClick={() => exportToPDF(nominations, "nominations", campProfile)} 
            className="btn btn-pdf"
            title="تصدير PDF"
            disabled={nominations.length === 0}
          >
            <FaFilePdf /> تصدير PDF / طباعة
          </button>
        </div>
      </header>

      {/* جدول الترشيحات والبحث والفلاتر */}
      <NominationTable 
        nominations={nominations}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      {/* نموذج الإضافة والتعديل */}
      <NominationForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveNomination}
        nomination={selectedNomination}
      />

      {/* نافذة استيراد Excel */}
      <ExcelImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        campId={user?.campId}
        importType="nominations"
        onImportComplete={handleImportComplete}
      />

      {/* نافذة تأكيد الحذف المنبثقة */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="delete-modal-content">
            <div className="delete-modal-header">
              <FaExclamationTriangle className="warning-icon" />
              <h3>تأكيد حذف ترشيح عائلة</h3>
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="btn-close"
              >
                <FaTimes />
              </button>
            </div>
            <div className="delete-modal-body">
              <p>هل تريد حذف ترشيح عائلة <strong>"{nominationToDelete.name}"</strong>؟</p>
              <span className="delete-warning-text">تحذير: سيتم إزالة هذه العائلة من كشف الترشيحات نهائياً ولا يمكن التراجع عن هذا الإجراء لاحقاً.</span>
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
              <h3 style={{ color: "white" }}>تأكيد مسح كشف الترشيحات بالكامل</h3>
              <button 
                onClick={() => setIsClearAllModalOpen(false)} 
                className="btn-close"
                style={{ color: "white" }}
              >
                <FaTimes />
              </button>
            </div>
            <div className="delete-modal-body" style={{ direction: "rtl", textAlign: "right" }}>
              <p>هل أنت متأكد من رغبتك في مسح كشف الترشيحات بالكامل؟</p>
              <p style={{ margin: "10px 0", color: "#721c24" }}>سيتم حذف <strong>جميع الترشيحات ({nominations.length} ترشيح)</strong> المسجلة في هذا المخيم نهائياً.</p>
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

export default Nominations;
