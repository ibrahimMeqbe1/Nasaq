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
  FaCog
} from "react-icons/fa";
import { updateCampProfile } from "../services/campService";

const CampSettings = ({ user, campProfile, setCampProfile }) => {
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
            <p>تخصيص الشعار البصري، اسم المخيم، بيانات المسؤول، والمعلومات الرسمية المطبوعة في الكشوفات.</p>
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

      <form onSubmit={handleSubmit}>
        {/* قسم 1: الشعار والهوية البصرية */}
        <section className="settings-section-card">
          <div className="settings-section-header">
            <FaImage className="section-icon" />
            <h2>الشعار والهوية البصرية الرسمية</h2>
          </div>

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
              <h3>صورة شعار المخيم</h3>
              <p>
                يظهر الشعار في الترويسة الرئيسية للوحة التحكم وفي أعلى التقارير وكشوفات PDF المطبوعة. 
                يُفضل استخدام صورة دائرية أو مربعة ذات خلفية شفافة أو بيضاء.
              </p>
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
                <FaImage /> اختيار صورة الشعار من جهازك
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
        </section>

        {/* قسم 2: البيانات الأساسية للمخيم */}
        <section className="settings-section-card">
          <div className="settings-section-header">
            <FaCampground className="section-icon" />
            <h2>البيانات الأساسية والموقع الجغرافي</h2>
          </div>

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
                placeholder="مثال: غزة - حي القصاصيب - جباليا"
                className="settings-input"
              />
            </div>
          </div>
        </section>

        {/* قسم 3: معلومات المسؤول والتواصل */}
        <section className="settings-section-card">
          <div className="settings-section-header">
            <FaUser className="section-icon" />
            <h2>معلومات المسؤول المندوب والتواصل</h2>
          </div>

          <div className="settings-grid-2">
            <div className="settings-field-group">
              <label htmlFor="managerName">
                <FaUser className="field-icon" /> اسم المسؤول / المندوب الرئيسي
              </label>
              <input
                type="text"
                id="managerName"
                name="managerName"
                value={formData.managerName}
                onChange={handleChange}
                placeholder="الاسم الثلاثي أو الرباعي للمسؤول"
                className="settings-input"
              />
            </div>

            <div className="settings-field-group">
              <label htmlFor="managerPhone">
                <FaPhoneAlt className="field-icon" /> رقم الجوال الرسمي للتواصل
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
        </section>

        {/* زر حفظ التعديلات */}
        <div className="settings-footer-actions">
          <button 
            type="submit" 
            className="btn-save-settings"
            disabled={loading}
          >
            {loading ? (
              <>
                <FaSpinner className="spinner" />
                <span>جاري حفظ الإعدادات...</span>
              </>
            ) : (
              <>
                <FaSave />
                <span>حفظ التعديلات وإعدادات المخيم</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CampSettings;
