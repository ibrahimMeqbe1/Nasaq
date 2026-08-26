"use client";

import React, { useState, useEffect } from "react";
import { 
  FaTimes, FaSave, FaUser, FaIdCard, FaPhone, FaUsers, 
  FaMapMarkerAlt, FaHeartbeat, FaWheelchair, FaBaby, FaFemale,
  FaEdit, FaPlus, FaHome, FaHandsHelping
} from "react-icons/fa";

const NominationForm = ({ isOpen, onClose, onSave, nomination }) => {
  const [activeTab, setActiveTab] = useState("personal");
  const [formData, setFormData] = useState({
    name: "",
    idNumber: "",
    gender: "ذكر",
    status: "متزوج",
    phone: "",
    phoneAlt: "",
    wifeName: "",
    wifeId: "",
    wife2Name: "",
    wife2Id: "",
    membersCount: 1,
    age_0_2_male: 0,
    age_0_2_female: 0,
    age_3_5_male: 0,
    age_3_5_female: 0,
    age_6_18_male: 0,
    age_6_18_female: 0,
    age_19_60_male: 0,
    age_19_60_female: 0,
    age_over_60_male: 0,
    age_over_60_female: 0,
    hasDisabled: false,
    hasChronicDisease: false,
    isLactatingOrPregnant: false,
    isFemaleHeaded: false,
    isChildHeaded: false,
    currentAddress: "",
    originalAddress: "",
    governorate: "شمال غزة",
    campName: "نظام إدارة المخيمات",
    shelterManager: "",
    shelterPhone: "",
    shelterPhoneAlt: "",
    shelterAddress: "",
    shelterGps: ""
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (nomination) {
      const getNum = (...keys) => {
        for (const k of keys) {
          if (nomination[k] !== undefined && nomination[k] !== null && nomination[k] !== "") {
            const parsed = parseInt(nomination[k]);
            if (!isNaN(parsed) && parsed >= 0) return parsed;
          }
        }
        return 0;
      };

      const getBool = (...keys) => {
        for (const k of keys) {
          if (nomination[k] === 1 || nomination[k] === true || nomination[k] === "1" || nomination[k] === "true" || nomination[k] === "نعم") {
            return true;
          }
        }
        return false;
      };

      setFormData({
        name: nomination.name || "",
        idNumber: nomination.idNumber || nomination.id_number || "",
        gender: nomination.gender || "ذكر",
        status: nomination.status || "متزوج",
        phone: nomination.phone || "",
        phoneAlt: nomination.phoneAlt || nomination.phone_alt || "",
        wifeName: nomination.wifeName || nomination.wife_name || "",
        wifeId: nomination.wifeId || nomination.wife_id || "",
        wife2Name: nomination.wife2Name || nomination.wife_2_name || "",
        wife2Id: nomination.wife2Id || nomination.wife_2_id || "",
        membersCount: getNum("membersCount", "members_count") || 1,
        age_0_2_male: getNum("age_0_2_male", "age02Male"),
        age_0_2_female: getNum("age_0_2_female", "age02Female"),
        age_3_5_male: getNum("age_3_5_male", "age35Male"),
        age_3_5_female: getNum("age_3_5_female", "age35Female"),
        age_6_18_male: getNum("age_6_18_male", "age618Male"),
        age_6_18_female: getNum("age_6_18_female", "age618Female"),
        age_19_60_male: getNum("age_19_60_male", "age1960Male"),
        age_19_60_female: getNum("age_19_60_female", "age1960Female"),
        age_over_60_male: getNum("age_over_60_male", "ageOver60Male"),
        age_over_60_female: getNum("age_over_60_female", "ageOver60Female"),
        hasDisabled: getBool("hasDisabled", "has_disabled"),
        hasChronicDisease: getBool("hasChronicDisease", "has_chronic_disease"),
        isLactatingOrPregnant: getBool("isLactatingOrPregnant", "is_lactating_or_pregnant"),
        isFemaleHeaded: getBool("isFemaleHeaded", "is_female_headed"),
        isChildHeaded: getBool("isChildHeaded", "is_child_headed", "isOrphanHeaded") || (nomination.status || "").includes("يتيم"),
        currentAddress: nomination.currentAddress || nomination.current_address || nomination.location || "",
        originalAddress: nomination.originalAddress || nomination.original_address || "",
        governorate: nomination.governorate || "شمال غزة",
        campName: nomination.campName || nomination.camp_name || "نظام إدارة المخيمات",
        shelterManager: nomination.shelterManager || nomination.shelter_manager || "",
        shelterPhone: nomination.shelterPhone || nomination.shelter_phone || "",
        shelterPhoneAlt: nomination.shelterPhoneAlt || nomination.shelter_phone_alt || "",
        shelterAddress: nomination.shelterAddress || nomination.shelter_address || "",
        shelterGps: nomination.shelterGps || nomination.shelter_gps || ""
      });
    } else {
      setFormData({
        name: "",
        idNumber: "",
        gender: "ذكر",
        status: "متزوج",
        phone: "",
        phoneAlt: "",
        wifeName: "",
        wifeId: "",
        wife2Name: "",
        wife2Id: "",
        membersCount: 1,
        age_0_2_male: 0,
        age_0_2_female: 0,
        age_3_5_male: 0,
        age_3_5_female: 0,
        age_6_18_male: 0,
        age_6_18_female: 0,
        age_19_60_male: 0,
        age_19_60_female: 0,
        age_over_60_male: 0,
        age_over_60_female: 0,
        hasDisabled: false,
        hasChronicDisease: false,
        isLactatingOrPregnant: false,
        isFemaleHeaded: false,
        currentAddress: "",
        originalAddress: "",
        governorate: "شمال غزة",
        campName: "نظام إدارة المخيمات",
        shelterManager: "",
        shelterPhone: "",
        shelterPhoneAlt: "",
        shelterAddress: "",
        shelterGps: ""
      });
    }
    setErrors({});
    setActiveTab("personal");
  }, [nomination, isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    const tempErrors = {};
    
    if (!formData.name.trim()) {
      tempErrors.name = "اسم رب الأسرة مطلوب";
    }

    if (!formData.idNumber.trim()) {
      tempErrors.idNumber = "رقم الهوية مطلوب";
    }

    const isMarriedMale = (formData.status === "متزوج" || formData.status === "متعدد" || formData.status === "متزوج/ة") && formData.gender !== "انثى";
    const isPlaceholder = (val) => !val || val === "-" || val === "لا يوجد" || val === "null" || val === "undefined";

    // التحقق من هوية الزوجة فقط إذا كانت الأسرة متزوجة وتم إدخال أرقام جزئية
    if (isMarriedMale) {
      if (!isPlaceholder(formData.wifeId)) {
        const digits = String(formData.wifeId).replace(/\D/g, "");
        if (digits.length > 0 && digits.length !== 9) {
          tempErrors.wifeId = "هوية الزوجة يجب أن تكون 9 أرقام (أو اتركها فارغة)";
        }
      }

      if (!isPlaceholder(formData.wife2Id)) {
        const digits2 = String(formData.wife2Id).replace(/\D/g, "");
        if (digits2.length > 0 && digits2.length !== 9) {
          tempErrors.wife2Id = "هوية الزوجة الثانية يجب أن تكون 9 أرقام (أو اتركها فارغة)";
        }
      }
    }

    return {
      isValid: Object.keys(tempErrors).length === 0,
      errors: tempErrors
    };
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : 
              name.startsWith("age_") || name === "membersCount" ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { isValid, errors: tempErrors } = validateForm();
    setErrors(tempErrors);

    if (isValid) {
      onSave(formData);
    } else {
      // التبديل فوراً إلى التبويب الذي يحتوي على خطأ
      if (tempErrors.name || tempErrors.idNumber) {
        setActiveTab("personal");
      } else if (tempErrors.wifeId || tempErrors.wife2Id) {
        setActiveTab("family");
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "750px", width: "95%" }}>
        <div className="modal-header">
          <h2 className="modal-title-with-icon">
            {nomination ? <FaEdit aria-hidden="true" /> : <FaPlus aria-hidden="true" />}
            {nomination ? "تعديل بيانات الترشيح" : "إضافة ترشيح جديد"}
          </h2>
          <button onClick={onClose} className="btn-close" title="إغلاق">
            <FaTimes />
          </button>
        </div>

        {Object.keys(errors).length > 0 && (
          <div style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: "10px 15px",
            borderRadius: "8px",
            marginBottom: "12px",
            fontSize: "0.88rem",
            fontWeight: "700",
            border: "1px solid #fecaca"
          }}>
            يرجى تصحيح الأخطاء التالية: {Object.values(errors).join("، ")}
          </div>
        )}

        {/* Tab Selection */}
        <div className="form-tabs" style={{ display: "flex", borderBottom: "2px solid #e2e8f0", marginBottom: "15px", gap: "10px" }}>
          <button 
            type="button" 
            onClick={() => setActiveTab("personal")}
            style={{
              padding: "10px 15px",
              border: "none",
              background: "none",
              fontSize: "0.92rem",
              fontWeight: "700",
              color: activeTab === "personal" ? "var(--primary-color)" : "#64748b",
              borderBottom: activeTab === "personal" ? "3px solid var(--primary-color)" : "3px solid transparent",
              cursor: "pointer"
            }}
          >
            <FaUser aria-hidden="true" /> بيانات رب الأسرة
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab("family")}
            style={{
              padding: "10px 15px",
              border: "none",
              background: "none",
              fontSize: "0.92rem",
              fontWeight: "700",
              color: activeTab === "family" ? "var(--primary-color)" : "#64748b",
              borderBottom: activeTab === "family" ? "3px solid var(--primary-color)" : "3px solid transparent",
              cursor: "pointer"
            }}
          >
            <FaUsers aria-hidden="true" /> الزوجات والأفراد
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab("conditions")}
            style={{
              padding: "10px 15px",
              border: "none",
              background: "none",
              fontSize: "0.92rem",
              fontWeight: "700",
              color: activeTab === "conditions" ? "var(--primary-color)" : "#64748b",
              borderBottom: activeTab === "conditions" ? "3px solid var(--primary-color)" : "3px solid transparent",
              cursor: "pointer"
            }}
          >
            <FaWheelchair aria-hidden="true" /> الحالات الخاصة
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab("location")}
            style={{
              padding: "10px 15px",
              border: "none",
              background: "none",
              fontSize: "0.92rem",
              fontWeight: "700",
              color: activeTab === "location" ? "var(--primary-color)" : "#64748b",
              borderBottom: activeTab === "location" ? "3px solid var(--primary-color)" : "3px solid transparent",
              cursor: "pointer"
            }}
          >
            <FaHome aria-hidden="true" /> السكن والإيواء
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          
          {/* Tab 1: Personal Data */}
          {activeTab === "personal" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div className="form-row">
                <div className="form-group col-6">
                  <label htmlFor="name"><FaUser className="form-icon" /> اسم رب الأسرة رباعي</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="الاسم الرباعي كما في الهوية"
                    className={errors.name ? "error-input" : ""}
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>
                <div className="form-group col-6">
                  <label htmlFor="idNumber"><FaIdCard className="form-icon" /> رقم الهوية لرب الأسرة</label>
                  <input
                    type="text"
                    id="idNumber"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleChange}
                    placeholder="9 أرقام"
                    maxLength={9}
                    className={errors.idNumber ? "error-input" : ""}
                  />
                  {errors.idNumber && <span className="error-text">{errors.idNumber}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group col-6">
                  <label htmlFor="gender">الجنس</label>
                  <select id="gender" name="gender" value={formData.gender} onChange={handleChange} style={{ padding: "10px" }}>
                    <option value="ذكر">ذكر</option>
                    <option value="انثى">أنثى</option>
                  </select>
                </div>
                <div className="form-group col-6">
                  <label htmlFor="status">الحالة الاجتماعية</label>
                  <select id="status" name="status" value={formData.status} onChange={handleChange} style={{ padding: "10px" }}>
                    <option value="متزوج">متزوج</option>
                    <option value="متزوج/ة">متزوج/ة</option>
                    <option value="أرمل">أرمل</option>
                    <option value="أرملة">أرملة</option>
                    <option value="مطلق">مطلق</option>
                    <option value="مطلقة">مطلقة</option>
                    <option value="متعدد">متعدد</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group col-6">
                  <label htmlFor="phone"><FaPhone className="form-icon" /> رقم الجوال</label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="مثال: 0599000000"
                    className={errors.phone ? "error-input" : ""}
                  />
                  {errors.phone && <span className="error-text">{errors.phone}</span>}
                </div>
                <div className="form-group col-6">
                  <label htmlFor="phoneAlt"><FaPhone className="form-icon" /> رقم الجوال البديل</label>
                  <input
                    type="text"
                    id="phoneAlt"
                    name="phoneAlt"
                    value={formData.phoneAlt}
                    onChange={handleChange}
                    placeholder="اختياري"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Family & Wives */}
          {activeTab === "family" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {(formData.status === "أرملة" || formData.status === "أرمل" || formData.status === "مطلقة" || formData.status === "مطلق" || formData.gender === "انثى" || formData.isFemaleHeaded) && (
                <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "10px 14px", borderRadius: "8px", color: "#065f46", fontSize: "0.88rem", fontWeight: "700" }}>
                  ملاحظة: هذه الحالة ({formData.status || "معيل امرأة"}) لا تشترط بيانات زوجة، وتُحفظ البيانات مباشرة بدون الحاجة لإدخال هوية أو اسم زوجة.
                </div>
              )}

              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "6px", borderRight: "4px solid #b89647" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "var(--primary-dark)" }}>بيانات الزوجة الأولى (إن وجدت):</h4>
                <div className="form-row">
                  <div className="form-group col-6">
                    <label htmlFor="wifeName">اسم الزوجة الأولى رباعي</label>
                    <input
                      type="text"
                      id="wifeName"
                      name="wifeName"
                      value={formData.wifeName}
                      onChange={handleChange}
                      placeholder="اسم الزوجة الأولى"
                    />
                  </div>
                  <div className="form-group col-6">
                    <label htmlFor="wifeId">هوية الزوجة الأولى</label>
                    <input
                      type="text"
                      id="wifeId"
                      name="wifeId"
                      value={formData.wifeId}
                      onChange={handleChange}
                      maxLength={9}
                      placeholder="9 أرقام"
                      className={errors.wifeId ? "error-input" : ""}
                    />
                    {errors.wifeId && <span className="error-text">{errors.wifeId}</span>}
                  </div>
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "6px", borderRight: "4px solid #b89647" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "var(--primary-dark)" }}>بيانات الزوجة الثانية (في حالة التعدد):</h4>
                <div className="form-row">
                  <div className="form-group col-6">
                    <label htmlFor="wife2Name">اسم الزوجة الثانية رباعي</label>
                    <input
                      type="text"
                      id="wife2Name"
                      name="wife2Name"
                      value={formData.wife2Name}
                      onChange={handleChange}
                      placeholder="اسم الزوجة الثانية"
                    />
                  </div>
                  <div className="form-group col-6">
                    <label htmlFor="wife2Id">هوية الزوجة الثانية</label>
                    <input
                      type="text"
                      id="wife2Id"
                      name="wife2Id"
                      value={formData.wife2Id}
                      onChange={handleChange}
                      maxLength={9}
                      placeholder="9 أرقام"
                      className={errors.wife2Id ? "error-input" : ""}
                    />
                    {errors.wife2Id && <span className="error-text">{errors.wife2Id}</span>}
                  </div>
                </div>
              </div>

              <div style={{ background: "rgba(15, 81, 50, 0.05)", padding: "12px", borderRadius: "6px", borderRight: "4px solid #0f5132" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#0f5132" }}>إحصائيات وفئات الأفراد العمرية:</h4>
                <div className="form-row" style={{ marginBottom: "10px" }}>
                  <div className="form-group col-12">
                    <label htmlFor="membersCount"><FaUsers className="form-icon" /> إجمالي عدد أفراد الأسرة</label>
                    <input
                      type="number"
                      id="membersCount"
                      name="membersCount"
                      value={formData.membersCount}
                      onChange={handleChange}
                      min={1}
                      style={{ maxWidth: "150px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginTop: "10px" }}>
                  {/* الفئة 0-2 */}
                  <div style={{ background: "white", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                    <h5 style={{ margin: "0 0 8px 0", color: "var(--primary-dark)", fontSize: "0.85rem", fontWeight: "bold" }}>أطفال (0 - 2)</h5>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: "0.75rem", display: "block", marginBottom: "3px", color: "#64748b" }}>ذكور</label>
                        <input type="number" name="age_0_2_male" value={formData.age_0_2_male} onChange={handleChange} min={0} style={{ padding: "5px", fontSize: "0.85rem" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: "0.75rem", display: "block", marginBottom: "3px", color: "#64748b" }}>إناث</label>
                        <input type="number" name="age_0_2_female" value={formData.age_0_2_female} onChange={handleChange} min={0} style={{ padding: "5px", fontSize: "0.85rem" }} />
                      </div>
                    </div>
                  </div>

                  {/* الفئة 3-5 */}
                  <div style={{ background: "white", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                    <h5 style={{ margin: "0 0 8px 0", color: "var(--primary-dark)", fontSize: "0.85rem", fontWeight: "bold" }}>أطفال (3 - 5)</h5>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: "0.75rem", display: "block", marginBottom: "3px", color: "#64748b" }}>ذكور</label>
                        <input type="number" name="age_3_5_male" value={formData.age_3_5_male} onChange={handleChange} min={0} style={{ padding: "5px", fontSize: "0.85rem" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: "0.75rem", display: "block", marginBottom: "3px", color: "#64748b" }}>إناث</label>
                        <input type="number" name="age_3_5_female" value={formData.age_3_5_female} onChange={handleChange} min={0} style={{ padding: "5px", fontSize: "0.85rem" }} />
                      </div>
                    </div>
                  </div>

                  {/* الفئة 6-18 */}
                  <div style={{ background: "white", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                    <h5 style={{ margin: "0 0 8px 0", color: "var(--primary-dark)", fontSize: "0.85rem", fontWeight: "bold" }}>أطفال (6 - 18)</h5>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: "0.75rem", display: "block", marginBottom: "3px", color: "#64748b" }}>ذكور</label>
                        <input type="number" name="age_6_18_male" value={formData.age_6_18_male} onChange={handleChange} min={0} style={{ padding: "5px", fontSize: "0.85rem" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: "0.75rem", display: "block", marginBottom: "3px", color: "#64748b" }}>إناث</label>
                        <input type="number" name="age_6_18_female" value={formData.age_6_18_female} onChange={handleChange} min={0} style={{ padding: "5px", fontSize: "0.85rem" }} />
                      </div>
                    </div>
                  </div>

                  {/* الفئة 19-60 */}
                  <div style={{ background: "white", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                    <h5 style={{ margin: "0 0 8px 0", color: "var(--primary-dark)", fontSize: "0.85rem", fontWeight: "bold" }}>بالغين (19 - 60)</h5>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: "0.75rem", display: "block", marginBottom: "3px", color: "#64748b" }}>ذكور</label>
                        <input type="number" name="age_19_60_male" value={formData.age_19_60_male} onChange={handleChange} min={0} style={{ padding: "5px", fontSize: "0.85rem" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: "0.75rem", display: "block", marginBottom: "3px", color: "#64748b" }}>إناث</label>
                        <input type="number" name="age_19_60_female" value={formData.age_19_60_female} onChange={handleChange} min={0} style={{ padding: "5px", fontSize: "0.85rem" }} />
                      </div>
                    </div>
                  </div>

                  {/* الفئة 60+ */}
                  <div style={{ background: "white", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                    <h5 style={{ margin: "0 0 8px 0", color: "var(--primary-dark)", fontSize: "0.85rem", fontWeight: "bold" }}>مسنين (+60)</h5>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: "0.75rem", display: "block", marginBottom: "3px", color: "#64748b" }}>ذكور</label>
                        <input type="number" name="age_over_60_male" value={formData.age_over_60_male} onChange={handleChange} min={0} style={{ padding: "5px", fontSize: "0.85rem" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: "0.75rem", display: "block", marginBottom: "3px", color: "#64748b" }}>إناث</label>
                        <input type="number" name="age_over_60_female" value={formData.age_over_60_female} onChange={handleChange} min={0} style={{ padding: "5px", fontSize: "0.85rem" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Health Conditions */}
          {activeTab === "conditions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px", padding: "10px 0" }}>
              <p style={{ color: "#64748b", margin: "0 0 10px 0" }}>اختر الحالات الصحية والاجتماعية الخاصة بالأسرة:</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", background: "#f8fafc", padding: "12px 15px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <input
                    type="checkbox"
                    name="hasDisabled"
                    checked={formData.hasDisabled}
                    onChange={handleChange}
                    style={{ width: "18px", height: "18px" }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaWheelchair style={{ color: "#a04000", fontSize: "1.1rem" }} />
                    <div>
                      <strong style={{ color: "var(--primary-dark)" }}>تضم أفراداً ذوي إعاقة</strong>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>تفعيل هذا الخيار يعني وجود فرد واحد أو أكثر من ذوي الاحتياجات الخاصة في الأسرة.</p>
                    </div>
                  </div>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", background: "#f8fafc", padding: "12px 15px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <input
                    type="checkbox"
                    name="hasChronicDisease"
                    checked={formData.hasChronicDisease}
                    onChange={handleChange}
                    style={{ width: "18px", height: "18px" }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaHeartbeat style={{ color: "#842029", fontSize: "1.1rem" }} />
                    <div>
                      <strong style={{ color: "var(--primary-dark)" }}>تضم أفراداً مصابين بأمراض مزمنة</strong>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>تفعيل هذا الخيار يشير إلى إصابة أحد أفراد الأسرة بمرض مزمن يحتاج رعاية مستمرة.</p>
                    </div>
                  </div>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", background: "#f8fafc", padding: "12px 15px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <input
                    type="checkbox"
                    name="isLactatingOrPregnant"
                    checked={formData.isLactatingOrPregnant}
                    onChange={handleChange}
                    style={{ width: "18px", height: "18px" }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaBaby style={{ color: "#0f5132", fontSize: "1.1rem" }} />
                    <div>
                      <strong style={{ color: "var(--primary-dark)" }}>امرأة حامل أو مرضعة في الأسرة</strong>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>اختيار هذا يعزز أولوية الأسرة في المساعدات الغذائية والحليب والصحة الإنجابية.</p>
                    </div>
                  </div>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", background: "#f8fafc", padding: "12px 15px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <input
                    type="checkbox"
                    name="isFemaleHeaded"
                    checked={formData.isFemaleHeaded}
                    onChange={handleChange}
                    style={{ width: "18px", height: "18px" }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaFemale style={{ color: "#4a148c", fontSize: "1.1rem" }} />
                    <div>
                      <strong style={{ color: "var(--primary-dark)" }}>امرأة تعيل الأسرة</strong>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>يعني أن رب الأسرة امرأة (أرملة، مطلقة، أو زوجها عاجز/مفقود) وهي المسؤولة عن رعايتها.</p>
                    </div>
                  </div>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", background: "#f8fafc", padding: "12px 15px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <input
                    type="checkbox"
                    name="isChildHeaded"
                    checked={formData.isChildHeaded}
                    onChange={handleChange}
                    style={{ width: "18px", height: "18px" }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaHandsHelping style={{ color: "#d97706", fontSize: "1.1rem" }} />
                    <div>
                      <strong style={{ color: "var(--primary-dark)" }}>معيل الأسرة طفل يتيم (دون سن 18 عاماً)</strong>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>يعني أن رب الأسرة طفل دون سن 18 عاماً يتيم الأبوين أو فاقد المعيل وهو المسؤول عن إخوته.</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Tab 4: Location & Shelter */}
          {activeTab === "location" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div className="form-row">
                <div className="form-group col-6">
                  <label htmlFor="currentAddress"><FaMapMarkerAlt className="form-icon" /> عنوان السكن الحالي</label>
                  <input
                    type="text"
                    id="currentAddress"
                    name="currentAddress"
                    value={formData.currentAddress}
                    onChange={handleChange}
                    placeholder="مثال: جباليا حي القصاصيب"
                    className={errors.currentAddress ? "error-input" : ""}
                  />
                  {errors.currentAddress && <span className="error-text">{errors.currentAddress}</span>}
                </div>
                <div className="form-group col-6">
                  <label htmlFor="originalAddress">عنوان السكن الأصلي (قبل النزوح)</label>
                  <input
                    type="text"
                    id="originalAddress"
                    name="originalAddress"
                    value={formData.originalAddress}
                    onChange={handleChange}
                    placeholder="العنوان الأصلي"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group col-6">
                  <label htmlFor="governorate">المحافظة</label>
                  <select id="governorate" name="governorate" value={formData.governorate} onChange={handleChange} style={{ padding: "10px" }}>
                    <option value="شمال غزة">شمال غزة</option>
                    <option value="غزة">غزة</option>
                    <option value="الوسطى">الوسطى</option>
                    <option value="خان يونس">خان يونس</option>
                    <option value="رفح">رفح</option>
                  </select>
                </div>
                <div className="form-group col-6">
                  <label htmlFor="campName">اسم المخيم</label>
                  <input
                    type="text"
                    id="campName"
                    name="campName"
                    value={formData.campName}
                    onChange={handleChange}
                    placeholder="اسم المخيم الحالي"
                  />
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "6px", borderRight: "4px solid #cbd5e1" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "var(--primary-dark)" }}>بيانات مركز الإيواء والمندوب:</h4>
                <div className="form-row">
                  <div className="form-group col-6">
                    <label htmlFor="shelterManager">مدير مركز الإيواء / المندوب</label>
                    <input
                      type="text"
                      id="shelterManager"
                      name="shelterManager"
                      value={formData.shelterManager}
                      onChange={handleChange}
                      placeholder="اسم المندوب المسؤول"
                    />
                  </div>
                  <div className="form-group col-6">
                    <label htmlFor="shelterPhone">هاتف المندوب</label>
                    <input
                      type="text"
                      id="shelterPhone"
                      name="shelterPhone"
                      value={formData.shelterPhone}
                      onChange={handleChange}
                      placeholder="رقم هاتف المندوب"
                    />
                  </div>
                </div>
                
                <div className="form-row" style={{ marginTop: "10px" }}>
                  <div className="form-group col-6">
                    <label htmlFor="shelterPhoneAlt">هاتف المندوب البديل</label>
                    <input
                      type="text"
                      id="shelterPhoneAlt"
                      name="shelterPhoneAlt"
                      value={formData.shelterPhoneAlt}
                      onChange={handleChange}
                      placeholder="اختياري"
                    />
                  </div>
                  <div className="form-group col-6">
                    <label htmlFor="shelterGps">إحداثيات مركز الإيواء (GPS Link)</label>
                    <input
                      type="text"
                      id="shelterGps"
                      name="shelterGps"
                      value={formData.shelterGps}
                      onChange={handleChange}
                      placeholder="https://maps.app.goo.gl/..."
                    />
                  </div>
                </div>

                <div className="form-row" style={{ marginTop: "10px" }}>
                  <div className="form-group col-12">
                    <label htmlFor="shelterAddress">عنوان مركز الإيواء بالتفصيل</label>
                    <input
                      type="text"
                      id="shelterAddress"
                      name="shelterAddress"
                      value={formData.shelterAddress}
                      onChange={handleChange}
                      placeholder="وصف تفصيلي لمكان مركز الإيواء"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="modal-footer" style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="submit" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <FaSave /> حفظ البيانات
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NominationForm;
