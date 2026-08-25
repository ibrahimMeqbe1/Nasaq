"use client";

import React, { useState, useEffect } from "react";
import { FaTimes, FaSave, FaUser, FaIdCard, FaPhone, FaUsers, FaMapMarkerAlt, FaEdit, FaPlus } from "react-icons/fa";

const FamilyForm = ({ isOpen, onClose, onSave, family }) => {
  const [formData, setFormData] = useState({
    name: "",
    idNumber: "",
    phone: "",
    membersCount: 1,
    location: "",
    status: "متزوج",
    dob: "",
    wifeName: "",
    wifeId: "",
    wifeDob: "",
    notes: ""
  });

  const [errors, setErrors] = useState({});

  // تحديث الحقول عند اختيار التعديل (تمرير كائن عائلة موجود)
  useEffect(() => {
    if (family) {
      setFormData({
        name: family.name || "",
        idNumber: family.idNumber || "",
        phone: family.phone || "",
        membersCount: family.membersCount || 1,
        location: family.location || "",
        status: family.status || "متزوج",
        dob: family.dob || "",
        wifeName: family.wifeName || "",
        wifeId: family.wifeId || "",
        wifeDob: family.wifeDob || "",
        notes: family.notes || ""
      });
    } else {
      setFormData({
        name: "",
        idNumber: "",
        phone: "",
        membersCount: 1,
        location: "",
        status: "متزوج",
        dob: "",
        wifeName: "",
        wifeId: "",
        wifeDob: "",
        notes: ""
      });
    }
    setErrors({});
  }, [family, isOpen]);

  if (!isOpen) return null;

  // التحقق من صحة المدخلات
  const validateForm = () => {
    const tempErrors = {};
    
    if (!formData.name.trim()) {
      tempErrors.name = "اسم رب الأسرة مطلوب";
    } else if (formData.name.trim().length < 3) {
      tempErrors.name = "يجب أن يكون الاسم 3 أحرف على الأقل";
    }

    if (!formData.idNumber.trim()) {
      tempErrors.idNumber = "رقم الهوية مطلوب";
    } else if (!/^\d{9}$/.test(formData.idNumber.trim())) {
      tempErrors.idNumber = "رقم الهوية يجب أن يتكون من 9 أرقام فقط";
    }

    if (!formData.phone.trim()) {
      tempErrors.phone = "رقم الهاتف مطلوب";
    } else if (!/^(059|056|052|050|054)\d{7}$/.test(formData.phone.trim()) && !/^\+?\d{8,14}$/.test(formData.phone.trim())) {
      tempErrors.phone = "رقم الهاتف غير صحيح (مثال: 0599000000)";
    }

    if (!formData.membersCount || formData.membersCount < 1) {
      tempErrors.membersCount = "عدد أفراد الأسرة يجب أن يكون 1 على الأقل";
    }

    if (!formData.location.trim()) {
      tempErrors.location = "مكان السكن (الخيمة أو الكرفان) مطلوب";
    }

    // التحقق من بيانات الزوجة في حال كانت الحالة "متزوج"
    if (formData.status === "متزوج") {
      if (formData.wifeId.trim() && !/^\d{9}$/.test(formData.wifeId.trim())) {
        tempErrors.wifeId = "رقم هوية الزوجة يجب أن يتكون من 9 أرقام";
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "membersCount" ? parseInt(value) || "" : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "650px" }}>
        <div className="modal-header">
          <h2 className="modal-title-with-icon">
            {family ? <FaEdit aria-hidden="true" /> : <FaPlus aria-hidden="true" />}
            {family ? "تعديل بيانات العائلة" : "إضافة عائلة جديدة"}
          </h2>
          <button onClick={onClose} className="btn-close" title="إغلاق">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            {/* اسم رب الأسرة */}
            <div className="form-group col-6">
              <label htmlFor="name">
                <FaUser className="form-icon" /> اسم رب الأسرة كامل
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="مثال: محمد أحمد علي"
                className={errors.name ? "error-input" : ""}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            {/* رقم الهوية لرب الأسرة */}
            <div className="form-group col-6">
              <label htmlFor="idNumber">
                <FaIdCard className="form-icon" /> رقم هوية رب الأسرة (9 أرقام)
              </label>
              <input
                type="text"
                id="idNumber"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                placeholder="مثال: 401234567"
                maxLength={9}
                className={errors.idNumber ? "error-input" : ""}
              />
              {errors.idNumber && <span className="error-text">{errors.idNumber}</span>}
            </div>
          </div>

          <div className="form-row">
            {/* تاريخ ميلاد رب الأسرة */}
            <div className="form-group col-6">
              <label htmlFor="dob">
                تاريخ ميلاد رب الأسرة
              </label>
              <input
                type="date"
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
              />
            </div>

            {/* الحالة الاجتماعية */}
            <div className="form-group col-6">
              <label htmlFor="status">
                الحالة الاجتماعية
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={{
                  padding: "10px 12px",
                  fontSize: "0.95rem",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-sm)"
                }}
              >
                <option value="متزوج">متزوج</option>
                <option value="أرملة">أرملة</option>
                <option value="يتيم">يتيم</option>
                <option value="أعزب">أعزب</option>
                <option value="مطلق">مطلق</option>
              </select>
            </div>
          </div>

          {/* القسم المشروط بـ متزوج (بيانات الزوجة) */}
          {formData.status === "متزوج" && (
            <div style={{
              background: "var(--secondary-light)",
              padding: "12px 15px",
              borderRadius: "var(--radius-md)",
              borderRight: "4px solid var(--secondary-color)",
              display: "flex",
              flexDirection: "column",
              gap: "10px"
            }}>
              <h3 style={{ fontSize: "0.95rem", color: "var(--primary-dark)", margin: "0 0 5px 0", fontWeight: "700" }}>
                بيانات الزوجة:
              </h3>
              
              <div className="form-group">
                <label htmlFor="wifeName">اسم الزوجة كامل</label>
                <input
                  type="text"
                  id="wifeName"
                  name="wifeName"
                  value={formData.wifeName}
                  onChange={handleChange}
                  placeholder="مثال: منى محمد جودة"
                />
              </div>

              <div className="form-row">
                <div className="form-group col-6">
                  <label htmlFor="wifeId">رقم هوية الزوجة</label>
                  <input
                    type="text"
                    id="wifeId"
                    name="wifeId"
                    value={formData.wifeId}
                    onChange={handleChange}
                    placeholder="مثال: 901234567"
                    maxLength={9}
                    className={errors.wifeId ? "error-input" : ""}
                  />
                  {errors.wifeId && <span className="error-text">{errors.wifeId}</span>}
                </div>

                <div className="form-group col-6">
                  <label htmlFor="wifeDob">تاريخ ميلاد الزوجة</label>
                  <input
                    type="date"
                    id="wifeDob"
                    name="wifeDob"
                    value={formData.wifeDob}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="form-row">
            {/* رقم الهاتف */}
            <div className="form-group col-6">
              <label htmlFor="phone">
                <FaPhone className="form-icon" /> رقم الهاتف
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="مثال: 0599123456"
                className={errors.phone ? "error-input" : ""}
              />
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </div>

            {/* عدد الأفراد */}
            <div className="form-group col-6">
              <label htmlFor="membersCount">
                <FaUsers className="form-icon" /> عدد أفراد الأسرة
              </label>
              <input
                type="number"
                id="membersCount"
                name="membersCount"
                value={formData.membersCount}
                onChange={handleChange}
                min="1"
                placeholder="مثال: 5"
                className={errors.membersCount ? "error-input" : ""}
              />
              {errors.membersCount && <span className="error-text">{errors.membersCount}</span>}
            </div>
          </div>

          {/* مكان السكن */}
          <div className="form-group">
            <label htmlFor="location">
              <FaMapMarkerAlt className="form-icon" /> مكان السكن (الخيمة / الكرفان)
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="مثال: خيمة رقم 24 أو كرفان 5 (بلوك A)"
              className={errors.location ? "error-input" : ""}
            />
            {errors.location && <span className="error-text">{errors.location}</span>}
          </div>

          {/* ملاحظات */}
          <div className="form-group">
            <label htmlFor="notes">
              ملاحظات خاصة
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="اكتب أي ملاحظات إضافية هنا..."
              rows="2"
            />
          </div>

          {/* أزرار الحفظ والإغلاق */}
          <div className="form-actions">
            <button type="submit" className="btn-submit">
              <FaSave /> حفظ البيانات
            </button>
            <button type="button" onClick={onClose} className="btn-cancel">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FamilyForm;
