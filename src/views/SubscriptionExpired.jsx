"use client";

import React, { useState, useEffect } from "react";
import {
  FaLock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUniversity,
  FaMobileAlt,
  FaWallet,
  FaPaperPlane,
  FaWhatsapp,
  FaCampground,
  FaCreditCard,
  FaCopy,
  FaCheck,
  FaSignOutAlt,
  FaShieldAlt,
  FaClock,
  FaUser,
  FaSpinner,
  FaExternalLinkAlt
} from "react-icons/fa";
import { getPaymentMethods, submitRenewalRequest } from "../services/campService";

const SubscriptionExpired = ({ user, campProfile, onLogout }) => {
  const [methods, setMethods] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("bankOfPalestine");
  const [txId, setTxId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);

  const whatsappPhone = "+970597163242";
  const whatsappCleanNumber = "970597163242";

  useEffect(() => {
    getPaymentMethods().then((res) => {
      setMethods(res);
      if (res && Object.keys(res).length > 0) {
        setSelectedMethod(Object.keys(res)[0]);
      }
    });
  }, []);

  const handleCopy = (text, key) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!txId || !amount) {
      setError("يرجى إدخال رقم المعاملة/السند والمبلغ المحول للمتابعة.");
      return;
    }

    setError("");
    setLoading(true);

    const methodNameMap = {
      bankOfPalestine: "حساب بنك فلسطين",
      jawwalPay: "محفظة جوال باي (Jawwal Pay)",
      palPay: "محفظة بال باي (PalPay)",
    };

    const chosenMethodName = methodNameMap[selectedMethod] || selectedMethod;
    const currentCampName = campProfile?.name || user?.name || "المخيم الحالي";
    const currentCampId = user?.campId || "kareem";
    const managerName = campProfile?.managerName || user?.username || "غير محدد";

    try {
      // 1. تسجيل الطلب في قاعدة البيانات لتوثيقه
      await submitRenewalRequest({
        campId: currentCampId,
        campName: currentCampName,
        method: chosenMethodName,
        txId,
        amount,
        notes,
      });

      // 2. صياغة رسالة الواتساب المباشرة
      const messageText =
        `السلام عليكم ورحمة الله وبركاته
الأستاذ م. إبراهيم مقبل،

تم إرسال إثبات دفع جديد لتجديد اشتراك لوحة المخيم:
----------------------------------------
*المخيم:* ${currentCampName}
*معرف المخيم:* ${currentCampId}
*مسؤول المخيم:* ${managerName}
*طريقة الدفع:* ${chosenMethodName}
*رقم المعاملة / السند (TxID):* ${txId}
*المبلغ المحول:* ${amount}
${notes ? `*ملاحظات:* ${notes}\n` : ""}----------------------------------------
يرجى المراجعة وتأكيد تفعيل اشتراك اللوحة. وشكراً لجهودكم.`;

      const whatsappUrl = `https://wa.me/${whatsappCleanNumber}?text=${encodeURIComponent(messageText)}`;

      // 3. فتح الواتساب في نافذة جديدة
      if (typeof window !== "undefined") {
        window.open(whatsappUrl, "_blank");
      }

      setSuccess(true);
    } catch (err) {
      console.error("WhatsApp renewal error:", err);
      setError("حدث خطأ أثناء تسجيل الطلب، يمكنك التواصل مباشرة عبر الواتساب.");
    } finally {
      setLoading(false);
    }
  };

  const getMethodIcon = (key) => {
    switch (key) {
      case "bankOfPalestine": return <FaUniversity style={{ color: "#0284c7" }} />;
      case "jawwalPay": return <FaMobileAlt style={{ color: "#059669" }} />;
      case "palPay": return <FaWallet style={{ color: "#d97706" }} />;
      default: return <FaCreditCard style={{ color: "#059669" }} />;
    }
  };

  const getMethodTitle = (key) => {
    switch (key) {
      case "bankOfPalestine": return "حساب بنك فلسطين";
      case "jawwalPay": return "محفظة جوال باي (Jawwal Pay)";
      case "palPay": return "محفظة بال باي (PalPay)";
      default: return key;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "radial-gradient(ellipse at 50% 15%, #064e3b 0%, #0f172a 65%, #022c22 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2.5rem 1.25rem",
        boxSizing: "border-box",
        fontFamily: "inherit",
        direction: "rtl",
      }}
    >
      <div
        style={{
          maxWidth: "740px",
          width: "100%",
          background: "#ffffff",
          borderRadius: "28px",
          boxShadow: "0 30px 80px -20px rgba(0, 0, 0, 0.65)",
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        {/* هيدر الصفحة الفاخر بتدرج لوني وعلامات الحالة */}
        <div
          style={{
            background: "linear-gradient(135deg, #fff1f2 0%, #fee2e2 50%, #fef2f2 100%)",
            padding: "2.25rem 2rem 2rem 2rem",
            textAlign: "center",
            borderBottom: "1.5px solid #fecaca",
            position: "relative",
          }}
        >
          {/* أيقونة القفل الفاخرة المضيئة */}
          <div
            style={{
              width: "72px",
              height: "72px",
              margin: "0 auto 1.25rem auto",
              borderRadius: "22px",
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.85rem",
              boxShadow: "0 10px 25px rgba(220, 38, 38, 0.35)",
            }}
          >
            <FaLock />
          </div>

          <h1 style={{ margin: "0 0 10px 0", fontSize: "1.55rem", fontWeight: "900", color: "#991b1b" }}>
            انتهت صلاحية اشتراك لوحة التحكم
          </h1>
          <p style={{ margin: "0 0 1.25rem 0", color: "#475569", fontSize: "0.98rem", fontWeight: "600", lineHeight: "1.6" }}>
            تم إيقاف صلاحيات الوصول مؤقتاً لانتهاء فترة الاشتراك. يمكنك التجديد الفوري عبر الخطوات أدناه.
          </p>

          {/* شارات بيانات المخيم والمدير */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#ffffff",
                padding: "6px 14px",
                borderRadius: "30px",
                border: "1px solid #fca5a5",
                color: "#991b1b",
                fontWeight: "700",
                fontSize: "0.86rem",
                boxShadow: "0 2px 6px rgba(153, 27, 27, 0.06)",
              }}
            >
              <FaCampground />
              <span>مخيم: {campProfile?.name || user?.name || "المخيم الحالي"}</span>
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#ffffff",
                padding: "6px 14px",
                borderRadius: "30px",
                border: "1px solid #cbd5e1",
                color: "#334155",
                fontWeight: "700",
                fontSize: "0.86rem",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
              }}
            >
              <FaUser style={{ color: "#64748b" }} />
              <span>المسؤول: {campProfile?.managerName || user?.name || user?.username}</span>
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#fef2f2",
                padding: "6px 14px",
                borderRadius: "30px",
                border: "1px solid #fca5a5",
                color: "#b91c1c",
                fontWeight: "800",
                fontSize: "0.86rem",
              }}
            >
              <FaClock />
              <span>بانتظار التجديد</span>
            </div>
          </div>
        </div>

        {/* محتوى الصفحة الرئيسي */}
        <div style={{ padding: "2rem 2.25rem", display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* كارت خطوات التجديد السريع */}
          <div
            style={{
              background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
              border: "1.5px solid #e2e8f0",
              borderRadius: "18px",
              padding: "1.25rem 1.5rem",
            }}
          >
            <div
              style={{
                fontSize: "1rem",
                fontWeight: "800",
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "14px",
              }}
            >
              <FaExclamationTriangle style={{ color: "#d97706" }} />
              <span>خطوات تجديد الاشتراك والتفعيل الفوري (خلال دقائق):</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
              <div
                style={{
                  background: "#ffffff",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "#059669",
                    color: "white",
                    fontWeight: "800",
                    fontSize: "0.88rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  1
                </div>
                <div style={{ fontSize: "0.85rem", color: "#334155", fontWeight: "700", lineHeight: "1.5" }}>
                  اختر قناة الدفع المناسبة وانسخ رقم الحساب/المحفظة.
                </div>
              </div>

              <div
                style={{
                  background: "#ffffff",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "#059669",
                    color: "white",
                    fontWeight: "800",
                    fontSize: "0.88rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  2
                </div>
                <div style={{ fontSize: "0.85rem", color: "#334155", fontWeight: "700", lineHeight: "1.5" }}>
                  قم بتحويل رسوم الاشتراك واحتفظ برقم المعاملة (TxID).
                </div>
              </div>

              <div
                style={{
                  background: "#ffffff",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "#059669",
                    color: "white",
                    fontWeight: "800",
                    fontSize: "0.88rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  3
                </div>
                <div style={{ fontSize: "0.85rem", color: "#334155", fontWeight: "700", lineHeight: "1.5" }}>
                  أدخل البيانات واضغط إرسال للواتساب لتأكيد التفعيل فوراً.
                </div>
              </div>
            </div>
          </div>

          {/* بطاقات قنوات وطرق الدفع المعتمدة */}
          <div>
            <div
              style={{
                fontSize: "1.05rem",
                fontWeight: "800",
                color: "#0f172a",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FaCreditCard style={{ color: "#059669" }} />
              <span>قنوات وطرق التحويل المعتمدة:</span>
            </div>

            {methods ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "12px" }}>
                {Object.entries(methods).filter(([k]) => k !== "id" && k !== "updatedAt").map(([key, val]) => (
                  <div
                    key={key}
                    style={{
                      background: "#ffffff",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "16px",
                      padding: "14px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "10px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          background: "#f8fafc",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.1rem",
                          border: "1px solid #e2e8f0",
                          flexShrink: 0,
                        }}
                      >
                        {getMethodIcon(key)}
                      </div>
                      <span style={{ fontWeight: "800", fontSize: "0.9rem", color: "#1e293b" }}>
                        {getMethodTitle(key)}
                      </span>
                    </div>

                    <div
                      style={{
                        background: "#f8fafc",
                        padding: "9px 12px",
                        borderRadius: "10px",
                        fontSize: "0.86rem",
                        fontWeight: "700",
                        color: "#047857",
                        border: "1px solid #cbd5e1",
                        wordBreak: "break-all",
                        direction: "ltr",
                        textAlign: "center",
                      }}
                    >
                      {val}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(val, key)}
                      style={{
                        background: copiedKey === key ? "#dcfce7" : "#f1f5f9",
                        color: copiedKey === key ? "#166534" : "#334155",
                        border: `1px solid ${copiedKey === key ? "#86efac" : "#cbd5e1"}`,
                        padding: "7px 12px",
                        borderRadius: "8px",
                        fontWeight: "700",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {copiedKey === key ? (
                        <>
                          <FaCheck style={{ color: "#16a34a" }} /> تم النسخ بنجاح!
                        </>
                      ) : (
                        <>
                          <FaCopy /> نسخ بيانات الحساب
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "1.5rem", color: "#64748b" }}>
                <FaSpinner className="spinner" /> جارٍ تحميل قنوات الدفع...
              </div>
            )}
          </div>

          {/* نموذج إرسال إثبات الدفع والواتساب */}
          {success ? (
            <div
              style={{
                background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                border: "1.5px solid #86efac",
                padding: "1.75rem",
                borderRadius: "20px",
                color: "#166534",
                boxShadow: "0 6px 20px rgba(22, 163, 74, 0.1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "#16a34a",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.2rem",
                  }}
                >
                  <FaCheckCircle />
                </div>
                <h4 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "900" }}>
                  تم تجهيز وإرسال الإشعار للواتساب بنجاح!
                </h4>
              </div>

              <p style={{ margin: "0 0 1.25rem 0", fontSize: "0.95rem", lineHeight: "1.7", fontWeight: "600", color: "#14532d" }}>
                تم فتح تطبيق الواتساب لإرسال تفاصيل وسند التحويل إلى المهندس <strong>إبراهيم مقبل ({whatsappPhone})</strong>.
                سيتم مراجعة الطلب وتفعيل اشتراك المخيم فوراً.
              </p>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  style={{
                    background: "#16a34a",
                    color: "white",
                    border: "none",
                    padding: "9px 20px",
                    borderRadius: "10px",
                    fontWeight: "800",
                    cursor: "pointer",
                    fontSize: "0.88rem",
                  }}
                >
                  إرسال إشعار / دفعة أخرى
                </button>
                <a
                  href={`https://wa.me/${whatsappCleanNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: "#25D366",
                    color: "white",
                    textDecoration: "none",
                    padding: "9px 20px",
                    borderRadius: "10px",
                    fontWeight: "800",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.88rem",
                  }}
                >
                  <FaWhatsapp /> فتح محادثة الواتساب
                </a>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                borderRadius: "20px",
                padding: "1.75rem",
                border: "1.5px solid #cbd5e1",
              }}
            >
              <div
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "900",
                  color: "#0f172a",
                  margin: "0 0 1.25rem 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "#25D366",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.2rem",
                  }}
                >
                  <FaWhatsapp />
                </div>
                <span>إرسال إثبات وسند الدفع للتفعيل المباشر</span>
              </div>

              {error && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fca5a5",
                    color: "#b91c1c",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    fontWeight: "700",
                    fontSize: "0.88rem",
                    marginBottom: "14px",
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px", fontSize: "0.88rem" }}>
                  طريقة وقناة الدفع التي حولت من خلالها:
                </label>
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "11px",
                    border: "1.5px solid #94a3b8",
                    fontSize: "0.92rem",
                    fontWeight: "700",
                    backgroundColor: "#ffffff",
                    color: "#0f172a",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                >
                  {methods &&
                    Object.keys(methods)
                      .filter((k) => k !== "id" && k !== "updatedAt")
                      .map((key) => (
                        <option key={key} value={key}>
                          {getMethodTitle(key)}
                        </option>
                      ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px", fontSize: "0.88rem" }}>
                    رقم المعاملة / السند (TxID) *
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: 987654321"
                    value={txId}
                    onChange={(e) => setTxId(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: "11px",
                      border: "1.5px solid #94a3b8",
                      fontSize: "0.92rem",
                      fontWeight: "700",
                      backgroundColor: "#ffffff",
                      color: "#0f172a",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px", fontSize: "0.88rem" }}>
                    المبلغ المحول *
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: 100 شيكل / 30$"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: "11px",
                      border: "1.5px solid #94a3b8",
                      fontSize: "0.92rem",
                      fontWeight: "700",
                      backgroundColor: "#ffffff",
                      color: "#0f172a",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px", fontSize: "0.88rem" }}>
                  ملاحظات أو اسم صاحب الحساب المحول (اختياري):
                </label>
                <textarea
                  rows="2"
                  placeholder="اسم المحول، أو أي تفاصيل تخص الحوالة..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "11px",
                    border: "1.5px solid #94a3b8",
                    fontSize: "0.92rem",
                    fontWeight: "600",
                    backgroundColor: "#ffffff",
                    color: "#0f172a",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                  color: "#ffffff",
                  border: "none",
                  padding: "13px 20px",
                  borderRadius: "13px",
                  fontSize: "1rem",
                  fontWeight: "900",
                  cursor: loading ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  boxShadow: "0 6px 18px rgba(37, 211, 102, 0.35)",
                  transition: "all 0.2s ease",
                }}
              >
                {loading ? (
                  <>
                    <FaSpinner className="spinner" /> جارٍ تسجيل الطلب وتجهيز الواتساب...
                  </>
                ) : (
                  <>
                    <FaWhatsapp style={{ fontSize: "1.35rem" }} />
                    <span>إرسال إثبات الدفع والبيانات عبر الواتساب ({whatsappPhone})</span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>

        {/* تذييل الصفحة الفاخر */}
        <div
          style={{
            background: "#f8fafc",
            padding: "1.25rem 2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #e2e8f0",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#64748b", fontWeight: "700" }}>
            <FaShieldAlt style={{ color: "#059669" }} />
            <span>نَسَق | إدارة المخيمات والاستجابة الإنسانية © 2026</span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            style={{
              background: "#ffffff",
              color: "#dc2626",
              border: "1.5px solid #fecaca",
              padding: "8px 18px",
              borderRadius: "10px",
              fontWeight: "800",
              fontSize: "0.88rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 1px 3px rgba(220, 38, 38, 0.08)",
              transition: "all 0.15s ease",
            }}
          >
            <FaSignOutAlt />
            <span>تسجيل الخروج والعودة</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpired;
