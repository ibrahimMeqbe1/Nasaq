"use client";

import React from "react";
import {
  FaGithub,
  FaBehance,
  FaGlobe,
  FaLinkedin,
  FaEnvelope,
  FaWhatsapp,
  FaTimes,
  FaGraduationCap,
  FaCode,
  FaBriefcase
} from "react-icons/fa";

const DeveloperModal = ({ onClose }) => {
  return (
    <div className="modal-overlay" style={{ zIndex: 3000 }}>
      <div className="modal-content developer-modal-card" style={{ maxWidth: "650px", borderTop: "6px solid #b89647" }}>
        <div className="modal-header" style={{ borderBottom: "1px solid #e2e8f0" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "10px", color: "#0f5132" }}>
            <FaCode aria-hidden="true" /> حول مطور النظام
          </h2>
          <button onClick={onClose} className="btn-close">
            <FaTimes />
          </button>
        </div>

        <div className="modal-form" style={{ maxHeight: "75vh", overflowY: "auto", padding: "1.5rem" }}>

          {/* قسم الصورة والتعريف البسيط */}
          <div className="dev-hero-section" style={{ display: "flex", gap: "20px", alignItems: "center", marginBottom: "20px" }}>
            <img
              src="/developer.jpg"
              alt="Eng. Ibrahim Meqbel"
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "4px solid #b89647",
                boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
              }}
            />
            <div className="dev-meta">
              <h3 style={{ margin: 0, fontSize: "1.4rem", color: "#0f5132", fontWeight: 800 }}>المهندس إبراهيم مقبل</h3>
              <p style={{ margin: "5px 0", color: "#64748b", fontWeight: 600, fontSize: "0.9rem" }}>
                مطور برمجيات وأخصائي تكنولوجيا المعلومات التطبيقية (Applied IT)
              </p>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <span className="badge" style={{ backgroundColor: "#e8f5e9", color: "#2e7d32", padding: "4px 10px", borderRadius: "50px", fontSize: "0.8rem", fontWeight: "bold" }}>جامعة الأقصى</span>
                <span className="badge" style={{ backgroundColor: "#fff8e1", color: "#f57f17", padding: "4px 10px", borderRadius: "50px", fontSize: "0.8rem", fontWeight: "bold" }}>صناعة المحتوى الرقمي</span>
              </div>
            </div>
          </div>

          {/* النص التعريفي */}
          <div className="dev-bio-text" style={{ lineHeight: "1.7", color: "#334155", fontSize: "0.92rem", marginBottom: "20px", backgroundColor: "#f8fafc", padding: "12px 15px", borderRadius: "8px", borderRight: "4px solid #b89647" }}>
            أنا <strong>إبراهيم مقبل</strong>، متخصص في تكنولوجيا المعلومات التطبيقية ومطور برمجيات، بالإضافة إلى شغفي الممتد في مجال التصميم الجغرافي والإنتاج المرئي الرقمي. أجمع في عملي بين قوة البرمجة وكفاءة الأتمتة، وبين اللمسة الإبداعية الفريدة التي تمنح المشاريع الرقمية طابعاً إنساناً مميزاً بعيداً عن القوالب الجاهزة. أسعى دائماً لتوظيف التكنولوجيا في حل المشكلات اليومية وبناء أدوات ذكية تحسّن تجربة المستخدم.
          </div>

          <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: "20px 0" }} />

          {/* المهارات والخبرات التقنية */}
          <div className="dev-section" style={{ marginBottom: "20px" }}>
            <h4 style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0f5132", margin: "0 0 12px 0", fontSize: "1.05rem" }}>
              <FaCode style={{ color: "#b89647" }} /> المهارات والخبرات التقنية (Technical Skills)
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div style={{ background: "#fafafa", padding: "10px 12px", borderRadius: "6px" }}>
                <strong style={{ display: "block", color: "#475569", fontSize: "0.85rem", marginBottom: "6px" }}>تطوير البرمجيات والويب:</strong>
                <ul style={{ margin: 0, paddingRight: "15px", fontSize: "0.82rem", color: "#64748b", lineHeight: "1.6" }}>
                  <li>تطوير الواجهات الأمامية باستخدام <b>React.js</b>.</li>
                  <li>تصميم وتنسيق الواجهات باستخدام <b>Tailwind CSS</b>.</li>
                  <li>برمجة أدوات الأتمتة والـ Bots بلغة <b>Python</b> لمنصة Telegram.</li>
                  <li>دمج تقنيات الذكاء الاصطناعي وربط الـ APIs (مثل Gemini APIs).</li>
                </ul>
              </div>
              <div style={{ background: "#fafafa", padding: "10px 12px", borderRadius: "6px" }}>
                <strong style={{ display: "block", color: "#475569", fontSize: "0.85rem", marginBottom: "6px" }}>التصميم والإنتاج الرقمي:</strong>
                <ul style={{ margin: 0, paddingRight: "15px", fontSize: "0.82rem", color: "#64748b", lineHeight: "1.6" }}>
                  <li>تصميم واجهات وتجربة المستخدم (UI/UX) وبناء الهويات البصرية.</li>
                  <li>تحرير ومونتاج الفيديو الاحترافي وصناعة المحتوى بجودة سينمائية.</li>
                  <li>إدارة وتحليل البيانات واللوحات الإدارية (Dashboards).</li>
                </ul>
              </div>
            </div>
          </div>

          {/* التعليم والمشاريع */}
          <div className="dev-section" style={{ marginBottom: "20px" }}>
            <h4 style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0f5132", margin: "0 0 12px 0", fontSize: "1.05rem" }}>
              <FaGraduationCap style={{ color: "#b89647" }} /> التعليم والخلفية المهنية
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <FaGraduationCap style={{ color: "#b89647", fontSize: "1.2rem", marginTop: "3px" }} />
                <div>
                  <strong style={{ color: "#334155" }}>درجة البكالوريوس:</strong>
                  <p style={{ margin: "2px 0 0 0", color: "#64748b" }}>تكنولوجيا المعلومات التطبيقية - جامعة الأقصى (2023)</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <FaBriefcase style={{ color: "#b89647", fontSize: "1.2rem", marginTop: "3px" }} />
                <div>
                  <strong style={{ color: "#334155" }}>مشاريع بارزة:</strong>
                  <p style={{ margin: "2px 0 0 0", color: "#64748b" }}>
                    • <b>PalPay Tracker:</b> لإدارة وتتبع العمليات المالية.<br />
                    • <b>IM Media:</b> براند شخصي للإنتاج المرئي والسينمائي.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: "20px 0" }} />

          {/* روابط التواصل */}
          <div className="dev-section">
            <h4 style={{ color: "#0f5132", margin: "0 0 12px 0", fontSize: "1.05rem", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <FaGlobe aria-hidden="true" /> تواصل معي ومعرض الأعمال الشخصي
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <a href="https://github.com/ibrahimMeqbe1" target="_blank" rel="noopener noreferrer" className="dev-link-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", background: "#0f172a", color: "white", textDecoration: "none", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "bold" }}>
                <FaGithub /> GitHub
              </a>
              <a href="https://www.behance.net/ibrahimmeqbel" target="_blank" rel="noopener noreferrer" className="dev-link-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", background: "#0057ff", color: "white", textDecoration: "none", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "bold" }}>
                <FaBehance /> Behance
              </a>
              <a href="https://ibrahimmeqbel.netlify.app" target="_blank" rel="noopener noreferrer" className="dev-link-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", background: "#00c4b6", color: "white", textDecoration: "none", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "bold" }}>
                <FaGlobe /> الموقع الشخصي
              </a>
              <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="dev-link-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", background: "#0a66c2", color: "white", textDecoration: "none", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "bold" }}>
                <FaLinkedin /> LinkedIn
              </a>
              <a href="mailto:7ema.meqbe1@gmail.com" className="dev-link-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", background: "#ea4335", color: "white", textDecoration: "none", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "bold" }}>
                <FaEnvelope /> البريد الإلكتروني
              </a>
              <a href="https://wa.me/970597163242" target="_blank" rel="noopener noreferrer" className="dev-link-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", background: "#25d366", color: "white", textDecoration: "none", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "bold" }}>
                <FaWhatsapp /> واتساب مباشر
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DeveloperModal;
