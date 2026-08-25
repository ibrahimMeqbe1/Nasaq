"use client";

import React, { useState, useEffect } from "react";
import { 
  FaTimes, FaSave, FaUser, FaIdCard, FaPhone, FaUsers, 
  FaMapMarkerAlt, FaHeartbeat, FaWheelchair, FaBaby, FaFemale,
  FaEdit, FaPlus, FaHome
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
      setFormData({
        name: nomination.name || "",
        idNumber: nomination.idNumber || "",
        gender: nomination.gender || "ذكر",
        status: nomination.status || "متزوج",
        phone: nomination.phone || "",
        phoneAlt: nomination.phoneAlt || "",
        wifeName: nomination.wifeName || "",
        wifeId: nomination.wifeId || "",
        wife2Name: nomination.wife2Name || "",
        wife2Id: nomination.wife2Id || "",
        membersCount: nomination.membersCount || 1,
        age_0_2_male: nomination.age_0_2_male || 0,
        age_0_2_female: nomination.age_0_2_female || 0,
        age_3_5_male: nomination.age_3_5_male || 0,
        age_3_5_female: nomination.age_3_5_female || 0,
        age_6_18_male: nomination.age_6_18_male || 0,
        age_6_18_female: nomination.age_6_18_female || 0,
        age_19_60_male: nomination.age_19_60_male || 0,
        age_19_60_female: nomination.age_19_60_female || 0,
        age_over_60_male: nomination.age_over_60_male || 0,
        age_over_60_female: nomination.age_over_60_female || 0,
        hasDisabled: nomination.hasDisabled === 1,
        hasChronicDisease: nomination.hasChronicDisease === 1,
        isLactatingOrPregnant: nomination.isLactatingOrPregnant === 1,
        isFemaleHeaded: nomination.isFemaleHeaded === 1,
        currentAddress: nomination.currentAddress || "",
        originalAddress: nomination.originalAddress || "",
        governorate: nomination.governorate || "شمال غزة",
        campName: nomination.campName || "نظام إدارة المخيمات",
        shelterManager: nomination.shelterManager || "",
        shelterPhone: nomination.shelterPhone || "",
        shelterPhoneAlt: nomination.shelterPhoneAlt || "",
        shelterAddress: nomination.shelterAddress || "",
        shelterGps: nomination.shelterGps || ""
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
    } else if (!/^\d{9}$/.test(formData.idNumber.trim())) {
      tempErrors.idNumber = "يجب أن يتكون من 9 أرقام";
    }

    if (!formData.phone.trim()) {
      tempErrors.phone = "رقم الجوال مطلوب";
    }

    if (formData.wifeId.trim() && !/^\d{9}$/.test(formData.wifeId.trim())) {
      tempErrors.wifeId = "هوية الزوجة يجب أن تكون 9 أرقام";
    }

    if (formData.wife2Id.trim() && !/^\d{9}$/.test(formData.wife2Id.trim())) {
      tempErrors.wife2Id = "هوية الزوجة الثانية يجب أن تكون 9 أرقام";
    }

    if (!formData.currentAddress.trim()) {
      tempErrors.currentAddress = "عنوان السكن الحالي مطلوب";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
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
    if (validateForm()) {
      onSave(formData);
    } else {
      // Switch tab to the first tab that has an error
      if (errors.name || errors.idNumber || errors.phone) {
        setActiveTab("personal");
      } else if (errors.wifeId || errors.wife2Id) {
        setActiveTab("family");
      } else if (errors.currentAddress) {
        setActiveTab("location");
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
