"use client";

import React from "react";
import Link from "next/link";
import { FaQuestionCircle, FaCampground, FaShieldAlt, FaFileExcel, FaLaptopCode, FaArrowLeft } from "react-icons/fa";
import PublicHeader from "../../components/public/PublicHeader";
import PublicFooter from "../../components/public/PublicFooter";
import AdSenseBanner from "../../components/AdSenseBanner";

export default function FAQPage() {
  const faqs = [
    {
      q: "ما هي المتطلبات الفنية لتشغيل منظومة نَسَق داخل المخيم؟",
      a: "لا تتطلب المنظومة أي خوادم محلية معقدة أو أجهزة فائقة المواصفات. يمكن تشغيلها مباشرة عبر أي متصفح ويب حديث من خلال الحاسوب المحمول، الأجهزة اللوحية، أو الهواتف الذكية (iOS و Android).",
    },
    {
      q: "كيف تتعامل المنظومة مع انقطاع أو ضعف شبكة الإنترنت في الميدان؟",
      a: "تم بناء نَسَق ببنية هجينة تتضمن طبقة تخزين محلية مشفرة تعمل في وضع عدم الاتصال (Offline Support)، حيث يمكن للمشرفين استعراض السجلات وإجراء عمليات الفحص، ثم مزامنة التغييرات تلقائياً مع السحابة فور توفر الاتصال.",
    },
    {
      q: "هل بيانات الأسر والمخيمات آمنة ومحمية من التسريب؟",
      a: "نعم، تطبق المنظومة بروتوكولات تشفير متقدمة لكافة جلسات الدخول والاتصالات السحابية مع قواعد بيانات Supabase و Cloudflare، مع عزل صارم بين بيانات كل مخيم وصلاحيات محددة بدقة لكل مستخدم.",
    },
    {
      q: "هل يمكن تصدير كشوفات المستفيدين بتنسيقات تناسب المانحين؟",
      a: "بالتأكيد، توفر المنظومة محرك تصدير متعدد الصيغ يتيح توليد ملفات Excel منظمة بالكامل بالإضافة إلى مستندات PDF مجهزة للطباعة بالترويسة والختم الرسمي للمخيم.",
    },
    {
      q: "كيف تمنع المنظومة ازدواجية استلام المعونات بين العائلات؟",
      a: "يعتمد محرك الترشيح الذكي على خوارزميات تحقق فورية تدقق في سجلات الاستلام السابقة وتمنع إدراج نفس الأسرة في كشف ترشيح لنفس نوع المساعدة خلال الفترة الزمنية المحددة من الإدارة.",
    },
    {
      q: "كيف يمكن لمخيم جديد أو جمعية إغاثية الانضمام للمنظومة؟",
      a: "يمكن للجهات الراغبة التواصل مع فريق الدعم الفني عبر صفحة اتصل بنا أو عبر الواتساب لتجهيز حساب المخيم وتدريب المشرفين على استخدام المنظومة في وقت قياسي.",
    },
  ];

  return (
    <div className="public-page-wrapper" dir="rtl">
      <PublicHeader />

      <main className="public-main-content">
        <section className="hero-section" style={{ padding: "4rem 1.5rem 4.5rem" }}>
          <div className="hero-overlay-glow" />
          <div className="section-header-center" style={{ marginBottom: "0", position: "relative", zIndex: 2 }}>
            <span className="hero-badge">
              <FaQuestionCircle />
              <span>مركز المساعدة والإجابات</span>
            </span>
            <h1 className="hero-title" style={{ fontSize: "2.5rem" }}>
              الأسئلة الشائعة | <span className="highlight">منظومة نَسَق</span>
            </h1>
            <p className="hero-subtitle">
              إليك إجابات تفصيلية على أكثر الأسئلة شيوعاً حول تشغيل وأمان واستخدام منظومة نَسَق لإدارة المخيمات.
            </p>
          </div>
        </section>

        <div className="public-section-container" style={{ padding: "0 1.5rem" }}>
          <AdSenseBanner slot="1000000013" />
        </div>

        <section className="public-section">
          <div className="public-section-container">
            <div className="faq-list">
              {faqs.map((item, index) => (
                <div key={index} className="faq-item">
                  <h2 className="faq-question">
                    <FaQuestionCircle className="q-icon" />
                    <span>{item.q}</span>
                  </h2>
                  <p className="faq-answer">{item.a}</p>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: "3.5rem" }}>
              <p style={{ color: "#64748b", marginBottom: "1.2rem", fontSize: "1.05rem" }}>
                لديك استفسار آخر لم تجد إجابته هنا؟
              </p>
              <Link href="/contact" className="hero-btn-primary" style={{ padding: "0.85rem 2rem" }}>
                <span>تواصل مع فريق الدعم الفني</span>
                <FaArrowLeft />
              </Link>
            </div>
          </div>
        </section>

        <div className="public-section-container" style={{ padding: "0 1.5rem 3rem" }}>
          <AdSenseBanner slot="1000000014" />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
