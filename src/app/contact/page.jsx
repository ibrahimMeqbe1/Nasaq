"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FaEnvelope, FaWhatsapp, FaMapMarkerAlt, FaGlobe, FaPaperPlane, FaCheckCircle, FaHeadset } from "react-icons/fa";
import PublicHeader from "../../components/public/PublicHeader";
import PublicFooter from "../../components/public/PublicFooter";
import AdSenseBanner from "../../components/AdSenseBanner";

export default function ContactPage() {
  const [formState, setFormState] = useState({ name: "", email: "", campName: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.message) return;
    setSubmitted(true);
  };

  return (
    <div className="public-page-wrapper" dir="rtl">
      <PublicHeader />

      <main className="public-main-content">
        <section className="hero-section" style={{ padding: "4rem 1.5rem 4.5rem" }}>
          <div className="hero-overlay-glow" />
          <div className="section-header-center" style={{ marginBottom: "0", position: "relative", zIndex: 2 }}>
            <span className="hero-badge">
              <FaHeadset />
              <span>الدعم الفني والاستشارات</span>
            </span>
            <h1 className="hero-title" style={{ fontSize: "2.5rem" }}>
              اتصل بنا | <span className="highlight">فريق منظومة نَسَق</span>
            </h1>
            <p className="hero-subtitle">
              نحن هنا لمساعدتكم في تهيئة وإعداد المنظومة لمخيمكم أو مؤسستكم الإغاثية وتقديم كافة أشكال الدعم والاستشارات التقنية.
            </p>
          </div>
        </section>

        <div className="public-section-container" style={{ padding: "0 1.5rem" }}>
          <AdSenseBanner slot="1000000005" />
        </div>

        <section className="public-section">
          <div className="public-section-container">
            <div className="contact-grid">
              {/* Contact Form */}
              <div className="contact-form-card">
                <h2 className="feature-card-title" style={{ fontSize: "1.4rem", marginBottom: "1.5rem" }}>
                  أرسل رسالة إلى فريق الإدارة والتطوير
                </h2>

                {submitted ? (
                  <div className="policy-highlight-box" style={{ textAlign: "center", padding: "2rem" }}>
                    <FaCheckCircle style={{ fontSize: "2.5rem", color: "#059669", marginBottom: "0.8rem" }} />
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#065f46" }}>تم إرسال رسالتك بنجاح!</h3>
                    <p style={{ marginTop: "0.5rem", fontSize: "0.95rem" }}>
                      شكراً لتواصلك معنا. سيقوم الفريق الفني بالرد على بريدك الإلكتروني في أقرب وقت ممكن.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label className="form-label">الاسم الكامل *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="أدخل اسمك الكريم"
                        required
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">البريد الإلكتروني *</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="example@domain.com"
                        required
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">اسم المخيم / المؤسسة (اختياري)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="اسم المخيم أو الجمعية الراغبة بالانضمام"
                        value={formState.campName}
                        onChange={(e) => setFormState({ ...formState, campName: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">نص الرسالة أو الاستفسار *</label>
                      <textarea
                        className="form-textarea"
                        rows="5"
                        placeholder="اكتب تفاصيل استفسارك أو طلبك هنا..."
                        required
                        value={formState.message}
                        onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                      />
                    </div>

                    <button type="submit" className="form-submit-btn">
                      <FaPaperPlane style={{ marginLeft: "6px" }} />
                      <span>إرسال الرسالة الآن</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Direct Info Cards */}
              <div className="contact-info-cards">
                <div className="info-item-card">
                  <div className="info-item-icon">
                    <FaWhatsapp />
                  </div>
                  <div>
                    <h4 className="info-item-title">محادثة واتساب فورية</h4>
                    <a href="https://wa.me/970597163242" target="_blank" rel="noopener noreferrer" className="info-item-val" style={{ color: "#059669", fontWeight: 700 }}>
                      +970 59 716 3242
                    </a>
                  </div>
                </div>

                <div className="info-item-card">
                  <div className="info-item-icon">
                    <FaEnvelope />
                  </div>
                  <div>
                    <h4 className="info-item-title">البريد الإلكتروني الرسمي</h4>
                    <a href="mailto:7ema.meqbe1@gmail.com" className="info-item-val">
                      7ema.meqbe1@gmail.com
                    </a>
                  </div>
                </div>

                <div className="info-item-card">
                  <div className="info-item-icon">
                    <FaGlobe />
                  </div>
                  <div>
                    <h4 className="info-item-title">معرض الأعمال والمشاريع</h4>
                    <a href="https://ibrahimmeqbel.netlify.app" target="_blank" rel="noopener noreferrer" className="info-item-val">
                      ibrahimmeqbel.netlify.app
                    </a>
                  </div>
                </div>

                <div className="info-item-card">
                  <div className="info-item-icon">
                    <FaMapMarkerAlt />
                  </div>
                  <div>
                    <h4 className="info-item-title">الاستجابة الميدانية</h4>
                    <p className="info-item-val">فلسطين / دعم المخيمات والمراكز الإيوائية</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="public-section-container" style={{ padding: "0 1.5rem 3rem" }}>
          <AdSenseBanner slot="1000000006" />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
