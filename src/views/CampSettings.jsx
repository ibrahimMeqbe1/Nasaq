"use client";

import React, { useState, useEffect } from "react";
import { 
  FaCampground, 
  FaUser, 
  FaPhoneAlt, 
  FaMapMarkerAlt, 
  FaImage, 
  FaSave, 
  FaTrash, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaSpinner,
  FaCog,
  FaDownload,
  FaUpload,
  FaHistory,
  FaShieldAlt,
  FaCalendarAlt,
  FaClock,
  FaMobileAlt,
  FaSignOutAlt
} from "react-icons/fa";
import { updateCampProfile } from "../services/campService";
import PWAInstaller from "../components/PWAInstaller";

const CampSettings = ({ user, campProfile, setCampProfile, onLogout }) => {
  const [formData, setFormData] = useState({
    name: "",
    managerName: "",
    managerPhone: "",
    address: "",
    logoUrl: ""
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [logoPreview, setLogoPreview] = useState("");

  // Backup states
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState("");
  const [backupError, setBackupError] = useState("");
  const [backupsList, setBackupsList] = useState([]);

  // تعبئة البيانات عند فتح الصفحة
  useEffect(() => {
    if (campProfile) {
      setFormData({
        name: campProfile.name || "",
        managerName: campProfile.managerName || "",
        managerPhone: campProfile.managerPhone || "",
        address: campProfile.address || "",
        logoUrl: campProfile.logoUrl || ""
      });
      setLogoPreview(campProfile.logoUrl || "");
    }
  }, [campProfile]);

  // تحميل سجل النسخ الاحتياطية
  const loadBackups = async () => {
    try {
      const campId = user?.campId || "kareem";
      const res = await fetch(`/api/backup?campId=${encodeURIComponent(campId)}&_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.backups)) {
          setBackupsList(data.backups);
        }
      }
    } catch (e) {
      console.warn("Error loading backups:", e);
    }
  };

  useEffect(() => {
    loadBackups();
  }, [user?.campId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError("");
    setSuccess("");
  };

  // معالجة اختيار ملف الشعار وتحويله لـ Base64
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      setError("حجم الصورة كبير. يرجى اختيار صورة أقل من 500 كيلوبايت لضمان سرعة التحميل.");
      return;
    }

    setError("");
    setSuccess("");
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        logoUrl: reader.result
      }));
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // إزالة الشعار الحالي
  const handleRemoveLogo = () => {
    setFormData(prev => ({
      ...prev,
      logoUrl: ""
    }));
    setLogoPreview("");
    setError("");
    setSuccess("");
  };

  // حفظ التعديلات
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");

    if (!formData.name.trim()) {
      setError("اسم المخيم مطلوب ولا يمكن تركه فارغاً.");
      setLoading(false);
      return;
    }

    try {
      const res = await updateCampProfile(user?.campId || "kareem", formData);
      if (res.success) {
        setSuccess("تم تحديث إعدادات المخيم والهوية البصرية بنجاح!");
        if (setCampProfile) {
          setCampProfile(prev => ({
            ...prev,
            ...formData
          }));
        }
      } else {
        setError(res.error || "فشل تحديث الإعدادات. يرجى المحاولة لاحقاً.");
      }
    } catch (err) {
      setError("حدث خطأ غير متوقع أثناء حفظ الإعدادات.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // إنشاء وتنزيل نسخة احتياطية فورية شاملة لكافة السجلات
  const handleCreateAndDownloadBackup = async () => {
    setBackupLoading(true);
    setBackupSuccess("");
    setBackupError("");

    try {
      const campId = user?.campId || "kareem";
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", campId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل إنشاء النسخة الاحتياطية");
      }

      // تنزيل ملف JSON مباشرة بترميز UTF-8 سليم واسم يحتوي على التاريخ والوقت
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = `${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;
      const campLabel = (campProfile?.name || campId).replace(/[^\w\u0600-\u06FF]/g, "_");
      
      const jsonContent = JSON.stringify(data.backup.snapshot, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nasaq_backup_${campLabel}_${dateStr}_${timeStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBackupSuccess(`تم إنشاء النسخة الاحتياطية بنجاح وحفظها باسم (${a.download})!`);
      
      // تحديث قائمة السجل فورياً
      if (data.backup) {
        setBackupsList(prev => [
          {
            id: data.backup.id,
            campId: data.backup.campId,
            type: data.backup.type || "manual",
            timestamp: data.backup.timestamp,
            summary: data.backup.summary || {}
          },
          ...prev.filter(b => b.id !== data.backup.id)
        ]);
      }
      await loadBackups();
    } catch (err) {
      setBackupError(err.message || "تعذر إنشاء النسخة الاحتياطية");
    } finally {
      setBackupLoading(false);
    }
  };

  // تنزيل نسخة احتياطية سابقة من السجل
  const handleDownloadSavedBackup = async (backupId, timestamp) => {
    try {
      const campId = user?.campId || "kareem";
      const res = await fetch(`/api/backup?campId=${encodeURIComponent(campId)}&backupId=${encodeURIComponent(backupId)}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "تعذر تحميل النسخة الاحتياطية");
      }

      const backupDateObj = new Date(timestamp || Date.now());
      const dateStr = backupDateObj.toISOString().split("T")[0];
      const timeStr = `${String(backupDateObj.getHours()).padStart(2, "0")}-${String(backupDateObj.getMinutes()).padStart(2, "0")}-${String(backupDateObj.getSeconds()).padStart(2, "0")}`;
      const campLabel = (campProfile?.name || campId).replace(/[^\w\u0600-\u06FF]/g, "_");

      const jsonContent = JSON.stringify(data.backup, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nasaq_backup_${campLabel}_${dateStr}_${timeStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("حدث خطأ أثناء تنزيل النسخة: " + err.message);
    }
  };

  // استعادة البيانات من ملف نسخة احتياطية
  const handleRestoreBackupFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.confirm("⚠️ تنبيه: استعادة النسخة الاحتياطية ستستبدل بيانات العائلات والترشيحات الحالية بالموجودة في الملف. هل ترغب بالاستمرار؟")) {
      e.target.value = "";
      return;
    }

    setBackupLoading(true);
    setBackupSuccess("");
    setBackupError("");

    try {
      const text = await file.text();
      const snapshot = JSON.parse(text);

      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", campId: user?.campId || "kareem", snapshot }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل استعادة النسخة الاحتياطية");
      }

      setBackupSuccess(`تمت استعادة البيانات بنجاح! (${data.summary?.familiesRestored || 0} عائلة، ${data.summary?.nominationsRestored || 0} ترشيح). يرجى تحديث الصفحة لرؤية البيانات المستعادة.`);
      loadBackups();
    } catch (err) {
      setBackupError(err.message || "ملف النسخة الاحتياطية غير صالح أو تالف.");
    } finally {
      setBackupLoading(false);
      e.target.value = "";
    }
  };

  const isSubscriptionActive = campProfile?.subscriptionExpiry 
    ? new Date(campProfile.subscriptionExpiry) > new Date()
    : true;

  const formattedExpiryDate = campProfile?.subscriptionExpiry
    ? new Date(campProfile.subscriptionExpiry).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : "دائم";

  return (
    <div className="settings-page-wrapper" dir="rtl">
      {/* الترويسة الرئيسية الاحترافية */}
      <header className="settings-header-card">
        <div className="settings-header-title">
          <div className="settings-header-icon">
            <FaCog />
          </div>
          <div className="settings-header-text">
            <h1>إدارة إعدادات المخيم والهوية</h1>
            <p>تخصيص الشعار البصري، اسم المخيم، بيانات المسؤول، والنسخ الاحتياطي التلقائي للبيانات.</p>
          </div>
        </div>

        {campProfile && (
          <div className="camp-expired-info-badge" style={{
            background: isSubscriptionActive ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
            borderColor: isSubscriptionActive ? "#10b981" : "#ef4444",
            color: isSubscriptionActive ? "#a7f3d0" : "#fca5a5"
          }}>
            <span className={`subscription-status-label ${isSubscriptionActive ? "is-active" : "is-expired"}`}>
              {isSubscriptionActive ? <FaCheckCircle aria-hidden="true" /> : <FaExclamationTriangle aria-hidden="true" />}
              {isSubscriptionActive ? "اشتراك نشط" : "اشتراك منتهي"}
            </span>
            <span aria-hidden="true">—</span>
            <span>انتهاء الاشتراك: {formattedExpiryDate}</span>
          </div>
        )}
      </header>

      {/* التنبيهات والرسائل */}
      {success && (
        <div className="renewal-success-box mb-4" style={{
          background: "#dcfce7",
          border: "1.5px solid #86efac",
          padding: "1rem 1.25rem",
          borderRadius: "14px",
          color: "#166534",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontWeight: "700"
        }}>
          <FaCheckCircle style={{ fontSize: "1.3rem", color: "#16a34a", flexShrink: 0 }} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="login-error-badge mb-4" style={{
          background: "#fef2f2",
          border: "1.5px solid #fca5a5",
          padding: "1rem 1.25rem",
          borderRadius: "14px",
          color: "#991b1b",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontWeight: "700"
        }}>
          <FaExclamationTriangle style={{ fontSize: "1.3rem", color: "#dc2626", flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* شبكة الإعدادات المنظمة من عمودين */}
      <div className="settings-columns-layout">
        
        {/* العمود الأيمن (الرئيسي): بيانات وهوية المخيم والمسؤول في كارت واحد موحد */}
        <div className="settings-col-main">
          <form onSubmit={handleSubmit} className="settings-section-card">
            <div className="settings-section-header">
              <FaCampground className="section-icon" />
              <h2>الهوية البصرية وبيانات المخيم</h2>
            </div>

            {/* الشعار */}
            <div className="logo-manage-container">
              <div className="logo-preview-wrapper">
                <img 
                  src={logoPreview || "/logo.jpg"} 
                  alt={`شعار ${formData.name || "المخيم"}`}
                  className="logo-preview-img"
                  onError={(e) => {
                    e.target.src = "/logo.jpg";
                  }}
                />
                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="btn-remove-logo"
                    title="إزالة الشعار الحالي"
                    aria-label="إزالة الشعار الحالي"
                  >
                    <FaTrash size={12} />
                  </button>
                )}
              </div>

              <div className="logo-upload-info">
                <h3 className="settings-sub-title" style={{ margin: "0 0 4px 0" }}>شعار المخيم الرسمي</h3>
                <p>يظهر الشعار في الترويسة الرئيسية والتقارير وكشوفات PDF المطبوعة.</p>
                <label 
                  className="btn-upload-label"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      document.getElementById('logoInput')?.click();
                    }
                  }}
                >
                  <FaImage /> اختيار صورة الشعار
                  <input 
                    id="logoInput"
                    type="file" 
                    onChange={handleLogoChange} 
                    accept="image/*" 
                    style={{ display: "none" }} 
                  />
                </label>
              </div>
            </div>

            <hr className="settings-sub-divider" />

            {/* الحقول الأساسية */}
            <h3 className="settings-sub-title">
              <FaCampground className="icon" /> البيانات الجغرافية والتواصل
            </h3>

            <div className="settings-grid-2">
              <div className="settings-field-group">
                <label htmlFor="name">
                  <FaCampground className="field-icon" /> اسم المخيم الرسمي *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="مثال: مخيم كريم الإغاثي"
                  className="settings-input"
                  required
                />
              </div>

              <div className="settings-field-group">
                <label htmlFor="address">
                  <FaMapMarkerAlt className="field-icon" /> عنوان وموقع المخيم
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="مثال: غزة - حي القصاصيب"
                  className="settings-input"
                />
              </div>

              <div className="settings-field-group">
                <label htmlFor="managerName">
                  <FaUser className="field-icon" /> اسم المسؤول / المندوب
                </label>
                <input
                  type="text"
                  id="managerName"
                  name="managerName"
                  value={formData.managerName}
                  onChange={handleChange}
                  placeholder="اسم المسؤول المندوب"
                  className="settings-input"
                />
              </div>

              <div className="settings-field-group">
                <label htmlFor="managerPhone">
                  <FaPhoneAlt className="field-icon" /> رقم الجوال الرسمي
                </label>
                <input
                  type="text"
                  id="managerPhone"
                  name="managerPhone"
                  value={formData.managerPhone}
                  onChange={handleChange}
                  placeholder="مثال: 0599000000"
                  className="settings-input phone-input"
                />
              </div>
            </div>

            {/* زر حفظ التعديلات */}
            <div className="settings-footer-actions" style={{ marginTop: "1.75rem" }}>
              <button 
                type="submit" 
                className="btn-save-settings"
                disabled={loading}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {loading ? (
                  <>
                    <FaSpinner className="spinner" />
                    <span>جاري حفظ الإعدادات...</span>
                  </>
                ) : (
                  <>
                    <FaSave />
                    <span>حفظ كافة التعديلات والإعدادات</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* العمود الأيسر (الجانبي): تطبيق الهاتف والنسخ الاحتياطي */}
        <div className="settings-col-side">
          
          {/* كارت تطبيق الهاتف والأوفلاين */}
          <section className="settings-section-card" style={{ marginBottom: "0" }}>
            <div className="settings-section-header">
              <FaMobileAlt className="section-icon" style={{ color: "#059669" }} />
              <h2>تطبيق الهاتف والعمل الميداني</h2>
            </div>
            <p style={{ color: "#64748b", fontSize: "0.85rem", lineHeight: "1.5", marginBottom: "1rem" }}>
              تثبيت المنصة كتطبيق على الهاتف للعمل وتسجيل العائلات حتى في حال انقطاع الإنترنت، والمزامنة تلقائياً.
            </p>
            <PWAInstaller />
          </section>

          {/* كارت النسخ الاحتياطي واستعادة البيانات */}
          <section className="settings-section-card">
            <div className="settings-section-header">
              <FaShieldAlt className="section-icon" style={{ color: "#2563eb" }} />
              <h2>النسخ الاحتياطي والأمان</h2>
            </div>
            
            <p style={{ color: "#64748b", fontSize: "0.85rem", lineHeight: "1.5", marginBottom: "1rem" }}>
              نسخ احتياطي تلقائي أسبوعي شامل لكافة السجلات مع إمكانية التنزيل والاستعادة الفورية.
            </p>

            {backupSuccess && (
              <div className="renewal-success-box mb-3" style={{
                background: "#eff6ff",
                border: "1.5px solid #93c5fd",
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                color: "#1e40af",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: "600",
                fontSize: "0.84rem",
                marginBottom: "0.75rem"
              }}>
                <FaCheckCircle style={{ fontSize: "1.1rem", color: "#2563eb", flexShrink: 0 }} />
                <span>{backupSuccess}</span>
              </div>
            )}

            {backupError && (
              <div className="login-error-badge mb-3" style={{
                background: "#fef2f2",
                border: "1.5px solid #fca5a5",
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                color: "#991b1b",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: "600",
                fontSize: "0.84rem",
                marginBottom: "0.75rem"
              }}>
                <FaExclamationTriangle style={{ fontSize: "1.1rem", color: "#dc2626", flexShrink: 0 }} />
                <span>{backupError}</span>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "1.25rem" }}>
              <button
                type="button"
                onClick={handleCreateAndDownloadBackup}
                disabled={backupLoading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "0.7rem 0.5rem",
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "700",
                  fontSize: "0.84rem",
                  cursor: backupLoading ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)"
                }}
              >
                {backupLoading ? <FaSpinner className="spinner" /> : <FaDownload />}
                <span>تحميل نسخة الآن</span>
              </button>

              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "0.7rem 0.5rem",
                  background: "#f1f5f9",
                  color: "#334155",
                  border: "1.5px solid #cbd5e1",
                  borderRadius: "10px",
                  fontWeight: "700",
                  fontSize: "0.84rem",
                  cursor: backupLoading ? "not-allowed" : "pointer",
                }}
              >
                <FaUpload />
                <span>استعادة ملف (.json)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreBackupFile}
                  disabled={backupLoading}
                  style={{ display: "none" }}
                />
              </label>
            </div>

            {backupsList.length > 0 && (
              <div>
                <h4 style={{ fontSize: "0.9rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.75rem" }}>
                  <FaHistory style={{ color: "#059669" }} /> السجل التاريخي للنسخ:
                </h4>
                <div style={{ display: "grid", gap: "8px", maxHeight: "280px", overflowY: "auto", paddingLeft: "4px" }}>
                  {backupsList.slice(0, 10).map((b) => (
                    <div
                      key={b.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.65rem 0.85rem",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        fontSize: "0.8rem",
                        gap: "8px",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontWeight: "800", color: b.type === "weekly" ? "#1e40af" : "#047857" }}>
                          {b.type === "weekly" ? "أسبوعية تلقائية" : "يدوية"}
                        </span>
                        <span style={{ color: "#64748b", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}>
                          <FaCalendarAlt style={{ color: "#059669", fontSize: "0.7rem" }} />
                          {new Date(b.timestamp).toLocaleDateString("ar-EG")} - {new Date(b.timestamp).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ color: "#047857", fontWeight: "700", fontSize: "0.75rem", background: "#ecfdf5", padding: "2px 6px", borderRadius: "6px" }}>
                          {b.summary?.totalFamilies || 0} عائلة
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDownloadSavedBackup(b.id, b.timestamp)}
                          title="تحميل"
                          style={{
                            padding: "4px 8px",
                            background: "#ffffff",
                            color: "#0f172a",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.75rem"
                          }}
                        >
                          <FaDownload style={{ color: "#059669" }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* كارت الحساب وجلسة العمل وتسجيل الخروج */}
          <section className="settings-section-card" style={{ marginTop: "1rem", border: "1px solid #fee2e2" }}>
            <div className="settings-section-header">
              <FaUser className="section-icon" style={{ color: "#ef4444" }} />
              <h2>الحساب وجلسة العمل</h2>
            </div>
            <p style={{ color: "#64748b", fontSize: "0.85rem", lineHeight: "1.5", marginBottom: "1rem" }}>
              مسجل حالياً باسم: <strong style={{ color: "#0f172a" }}>{user?.username || user?.name || "المستخدم"}</strong> ({user?.role === "superadmin" ? "المشرف العام" : "إدارة المخيم"})
            </p>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="btn btn-danger"
                style={{
                  width: "100%",
                  padding: "0.85rem 1rem",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontWeight: "800",
                  fontSize: "0.95rem",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.25)"
                }}
              >
                <FaSignOutAlt /> تسجيل الخروج من المنصة
              </button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default CampSettings;
