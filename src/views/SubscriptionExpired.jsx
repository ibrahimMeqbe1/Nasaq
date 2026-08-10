"use client";

import React, { useState, useEffect } from "react";
import { FaLock, FaCheckCircle, FaExclamationTriangle, FaUniversity, FaMobileAlt, FaWallet, FaPaperPlane, FaWhatsapp } from "react-icons/fa";
import { getPaymentMethods, submitRenewalRequest } from "../services/campService";

const SubscriptionExpired = ({ user, campProfile, onLogout }) => {
  const [methods, setMethods] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [txId, setTxId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const whatsappPhone = "+970597163242";
  const whatsappCleanNumber = "970597163242";

  useEffect(() => {
    getPaymentMethods().then((res) => {
      setMethods(res);
      if (res) {
        setSelectedMethod(Object.keys(res)[0]);
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!txId || !amount) {
      setError("يرجى ملء جميع الحقول المطلوبة (رقم المعاملة والمبلغ).");
      return;
    }

    setError("");
    setLoading(true);

    const methodNameMap = {
      bankOfPalestine: "حساب بنك فلسطين",
      jawwalPay: "حساب جوال باي (Jawwal Pay)",
      palPay: "حساب بال باي (PalPay)"
    };

    const chosenMethodName = methodNameMap[selectedMethod] || selectedMethod;
    const currentCampName = campProfile?.name || user?.name || "المخيم الحالي";
    const currentCampId = user?.campId || "kareem";
    const managerName = campProfile?.managerName || user?.username || "غير محدد";

    try {
      // 1. تسجيل الطلب في النظام لضمان حفظه في لوحة التحكم
      await submitRenewalRequest({
        campId: currentCampId,
        campName: currentCampName,
        method: chosenMethodName,
        txId,
        amount,
        notes
      });

      // 2. إعداد رسالة الواتساب الاحترافية المباشرة للمهندس إبراهيم مقبل
      const messageText =
        `السلام عليكم ورحمة الله وبركاته 🌿
الأستاذ م. إبراهيم مقبل،

تم إرسال إثبات دفع جديد لتجديد اشتراك لوحة المخيم:
----------------------------------------
⛺ *المخيم:* ${currentCampName}
🔑 *معرف المخيم:* ${currentCampId}
👤 *مسؤول المخيم:* ${managerName}
💳 *طريقة الدفع:* ${chosenMethodName}
🔢 *رقم المعاملة / السند (TxID):* ${txId}
💰 *المبلغ المحول:* ${amount}
${notes ? `📝 *ملاحظات:* ${notes}\n` : ''}----------------------------------------
يرجى المراجعة وتأكيد تفعيل اشتراك اللوحة الرقمية. وشكراً لجهودكم! ✨`;

      const whatsappUrl = `https://wa.me/${whatsappCleanNumber}?text=${encodeURIComponent(messageText)}`;

      // 3. فتح الواتساب فوراً
      if (typeof window !== "undefined") {
        window.open(whatsappUrl, "_blank");
      }

      setSuccess(true);
    } catch (err) {
      console.error("WhatsApp renewal error:", err);
      setError("حدث خطأ أثناء إرسال الطلب. يمكنك التواصل مباشرة عبر الواتساب.");
    } finally {
      setLoading(false);
    }
  };

  const getMethodIcon = (key) => {
    switch (key) {
      case "bankOfPalestine": return <FaUniversity className="payment-icon" />;
      case "jawwalPay": return <FaMobileAlt className="payment-icon" />;
      case "palPay": return <FaWallet className="payment-icon" />;
      default: return <FaWallet className="payment-icon" />;
    }
  };

  const getMethodTitle = (key) => {
    switch (key) {
      case "bankOfPalestine": return "حساب بنك فلسطين";
      case "jawwalPay": return "حساب جوال باي (Jawwal Pay)";
      case "palPay": return "حساب بال باي (PalPay)";
      default: return key;
    }
  };

  return (
    <div className="subscription-expired-container" dir="rtl">
      <div className="subscription-expired-card">
        {/* هيدر التنبيه الفاخر */}
        <div className="expired-header-luxury">
          <div className="lock-icon-wrapper-luxury">
            <FaLock />
          </div>
          <h1>انتهت صلاحية اشتراك لوحة التحكم!</h1>
          <div className="camp-expired-info-badge">
            <span>⛺ مخيم {campProfile?.name || user?.name || "المخيم الحالي"}</span>
            <span>•</span>
            <span>المنظومة غير نشطة حالياً</span>
          </div>
        </div>

        <div className="expired-body-luxury">
          {/* خطوات تجديد الاشتراك */}
          <div className="expired-steps-card">
            <h3><FaExclamationTriangle style={{ color: "#d97706" }} /> خطوات تجديد الاشتراك والتفعيل الفوري:</h3>
            <div className="steps-list">
              <div className="step-box">
                <div className="step-num">1</div>
                <div className="step-text">اختر إحدى طرق وقنوات الدفع الرسمية الموضحة أسفله.</div>
              </div>
              <div className="step-box">
                <div className="step-num">2</div>
                <div className="step-text">قم بتحويل رسوم الاشتراك لنفس الحساب المذكور.</div>
              </div>
              <div className="step-box">
                <div className="step-num">3</div>
                <div className="step-text">أدخل رقم المعاملة والمبلغ واضغط إرسال للواتساب للتفعيل فوراً.</div>
              </div>
            </div>
          </div>

          {/* طرق الدفع المتوفرة */}
          <div style={{ marginBottom: "1.8rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "#0f172a", marginBottom: "1rem" }}>
              💳 الحسابات وقنوات الدفع الرسمية للتجديد:
            </h3>

            {methods ? (
              <div className="methods-grid-luxury">
                {Object.entries(methods).map(([key, val]) => (
                  <div key={key} className="payment-card-item">
                    <div className="payment-card-header">
                      <div className="payment-card-icon">
                        {getMethodIcon(key)}
                      </div>
                      <span className="payment-card-title">{getMethodTitle(key)}</span>
                    </div>
                    <div className="payment-card-body">{val}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-3" style={{ color: "#64748b" }}>جاري جلب بيانات الدفع...</div>
            )}
          </div>

          {/* نموذج طلب التجديد عبر الواتساب */}
          {success ? (
            <div className="renewal-success-box" style={{ background: "#dcfce7", border: "1.5px solid #86efac", padding: "1.5rem", borderRadius: "16px", color: "#166534" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <FaCheckCircle style={{ fontSize: "1.5rem", color: "#16a34a" }} />
                <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800" }}>تم تجهيز وإرسال الإشعار للواتساب بنجاح!</h4>
              </div>
              <p style={{ margin: "0 0 1rem 0", fontSize: "0.92rem", lineHeight: "1.6", fontWeight: "600" }}>
                تم فتح الواتساب لإرسال بيانات الحوالة إلى المهندس <strong>إبراهيم مقبل ({whatsappPhone})</strong>. سيتم التحقق وتفعيل لوحة المخيم فوراً.
              </p>
              <button
                onClick={() => setSuccess(false)}
                style={{ background: "#16a34a", color: "white", border: "none", padding: "8px 16px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}
              >
                إرسال إشعار آخر
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="renewal-form-luxury">
              <h3 className="form-title-luxury">
                <FaWhatsapp style={{ color: "#25D366", fontSize: "1.3rem" }} />
                <span>إرسال إثبات الدفع والبيانات عبر الواتساب المباشر</span>
              </h3>

              {error && <div className="login-error-badge mb-3">{error}</div>}

              <div className="form-group mb-3">
                <label style={{ fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>طريقة الدفع المستخدمة:</label>
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.92rem", fontWeight: "700", backgroundColor: "white" }}
                >
                  {methods && Object.keys(methods).map((key) => (
                    <option key={key} value={key}>{getMethodTitle(key)}</option>
                  ))}
                </select>
              </div>

              <div className="renewal-form-grid">
                <div className="form-group">
                  <label style={{ fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>رقم المعاملة / السند (TxID) *</label>
                  <input
                    type="text"
                    placeholder="مثال: 987654321"
                    value={txId}
                    onChange={(e) => setTxId(e.target.value)}
                    required
                    style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.92rem", boxSizing: "border-box" }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>المبلغ المحول *</label>
                  <input
                    type="number"
                    placeholder="أدخل المبلغ المحول"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.92rem", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div className="form-group mb-3" style={{ marginTop: "1rem" }}>
                <label style={{ fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>ملاحظات إضافية (اختياري)</label>
                <textarea
                  rows="2"
                  placeholder="اسم المحول أو تفاصيل الحوالة..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.92rem", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>

              <button type="submit" className="btn-submit-renewal-whatsapp" disabled={loading}>
                {loading ? "جاري تجهيز الواتساب..." : (
                  <>
                    <FaWhatsapp style={{ fontSize: "1.35rem" }} />
                    <span>إرسال إثبات الدفع والبيانات عبر الواتساب ({whatsappPhone})</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="expired-footer-luxury">
          <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "700" }}>
            تطوير وإشراف: م. إبراهيم مقبل © 2026
          </span>
          <button onClick={onLogout} className="btn-expired-logout-luxury">
            تسجيل الخروج والعودة
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpired;
