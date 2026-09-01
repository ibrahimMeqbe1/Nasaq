"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FaShieldAlt,
  FaUsers,
  FaFileExport,
  FaChartPie,
  FaDatabase,
  FaCheckCircle,
  FaArrowLeft,
  FaLock,
  FaCampground,
  FaFileAlt,
  FaMobileAlt,
  FaQuestionCircle,
  FaEnvelope,
  FaSignInAlt,
} from "react-icons/fa";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";
import AdSenseBanner from "../components/AdSenseBanner";

export default function LandingPage({ user }) {
  return (
    <div className="public-page-wrapper" dir="rtl">
      <PublicHeader />

      <main className="public-main-content">
        {/* ==========================================
            Hero Section
            ========================================== */}
        <section className="hero-section">
          <div className="hero-overlay-glow" />
          <div className="hero-container">
            <div className="hero-content">
              <div className="hero-badge">
                <FaShieldAlt />
                <span>المنظومة السحابية المعتمدة لإدارة المخيمات</span>
              </div>
              <h1 className="hero-title">
                إدارة موثوقة للمخيمات والبيانات الإغاثية <span className="highlight">بأعلى معايير الدقة والعدالة</span>
              </h1>
              <p className="hero-subtitle">
                نَسَق هي منصة مؤسسية سحابية متطورة تُسهل حصر العائلات، تنظيم كشوفات الترشيح، تتبع توزيع المساعدات، واستخراج التقارير الرسمية المعتمدة بضغطة زر واحدة.
              </p>

              <div className="hero-actions">
                <Link href="/login" className="hero-btn-primary">
                  <FaSignInAlt aria-hidden="true" />
                  <span>{user ? "الانتقال للوحة التحكم" : "تسجيل الدخول للنظام"}</span>
                  <FaArrowLeft aria-hidden="true" />
                </Link>
                <Link href="/features" className="hero-btn-secondary">
                  <span>استكشاف المميزات والحلول</span>
                </Link>
              </div>
            </div>

            {/* Live Interactive Preview Box */}
            <div className="hero-preview-card">
              <div className="preview-card-header">
                <span className="preview-card-title">
                  <FaCampground style={{ color: "#34d399" }} />
                  <span>لوحة مؤشرات المخيم الميدانية</span>
                </span>
                <span style={{ fontSize: "0.78rem", background: "rgba(5, 150, 105, 0.3)", color: "#34d399", padding: "3px 10px", borderRadius: "20px", fontWeight: 700 }}>
                  مباشر ومحدث
                </span>
              </div>

              <div className="preview-stats-grid">
                <div className="preview-stat-box">
                  <span className="preview-stat-num">+12,500</span>
                  <span className="preview-stat-label">فرد مسجل بالسجلات</span>
                </div>
                <div className="preview-stat-box">
                  <span className="preview-stat-num">99.8%</span>
                  <span className="preview-stat-label">دقة توزيع الإغاثة</span>
                </div>
                <div className="preview-stat-box">
                  <span className="preview-stat-num">100%</span>
                  <span className="preview-stat-label">تشفير وأمان البيانات</span>
                </div>
                <div className="preview-stat-box">
                  <span className="preview-stat-num">فوري</span>
                  <span className="preview-stat-label">تصدير Excel / PDF</span>
                </div>
              </div>

              <ul className="preview-features-list">
                <li className="preview-feature-item">
                  <FaCheckCircle className="check-icon" />
                  <span>فصل تلقائي للعائلات ومنع تكرار الأسماء</span>
                </li>
                <li className="preview-feature-item">
                  <FaCheckCircle className="check-icon" />
                  <span>كشوفات ترشيح مخصصة لكل مؤسسة مانحة</span>
                </li>
                <li className="preview-feature-item">
                  <FaCheckCircle className="check-icon" />
                  <span>مزامنة سحابية فائقة السرعة مع Supabase</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* AdSense Slot 1 (Top Public) */}
        <div className="public-section-container" style={{ padding: "0 1.5rem" }}>
          <AdSenseBanner slot="1000000001" />
        </div>

        {/* ==========================================
            Core Modules & Features
            ========================================== */}
        <section className="public-section alt-bg">
          <div className="public-section-container">
            <div className="section-header-center">
              <span className="section-badge">ركائز المنظومة</span>
              <h2 className="section-title">حلول متكاملة تُلبي متطلبات العمل الإغاثي</h2>
              <p className="section-subtitle">
                صُممت منصة نَسَق لتجاوز تحديات العمل الميداني وإدارة الطوارئ من خلال واجهات واضحة وقواعد بيانات مؤمنة.
              </p>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <FaUsers />
                </div>
                <h3 className="feature-card-title">إدارة الأسر والنازحين</h3>
                <p className="feature-card-text">
                  سجل رقمي تفاعلي لحفظ بيانات رب الأسرة، عدد الأفراد، الفئات العمرية، الحالات الصحية الخاصة، وحالة السكن الحالية بدقة متناهية.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <FaFileAlt />
                </div>
                <h3 className="feature-card-title">كشوفات الترشيح الإغاثي</h3>
                <p className="feature-card-text">
                  إنشاء كشوفات ترشيح ذكية بحسب معايير المؤسسات المانحة (طرود غذائية، مبالغ نقدية، خيام، حقائب صحية) مع منع الازدواجية التلقائي.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <FaFileExport />
                </div>
                <h3 className="feature-card-title">التقارير والطباعة الرسمية</h3>
                <p className="feature-card-text">
                  توليد مستندات PDF مجهزة للطباعة والتوقيعات الرسمية وتصدير كشوفات Excel جاهزة للتحليل وتقديمها للجهات الإنسانية الشريكة.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <FaChartPie />
                </div>
                <h3 className="feature-card-title">إحصائيات تفاعلية ورسوم متحركة</h3>
                <p className="feature-card-text">
                  مخططات Donut Charts متحركة تصاعدياً لحساب نسب الأطفال والمسنين، الحالات الحرجة، ونسبة تغطية المساعدات على مستوى المخيم.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <FaLock />
                </div>
                <h3 className="feature-card-title">الأمان والخصوصية العالية</h3>
                <p className="feature-card-text">
                  تشفير بيانات الجلسات وحماية استعلامات السيرفر عبر Middleware متطور ومطابق لبروتوكولات حماية البيانات وخصوصية المتضررين.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <FaMobileAlt />
                </div>
                <h3 className="feature-card-title">توافق كامل مع الهواتف الذكية</h3>
                <p className="feature-card-text">
                  شريط تنقل مخصص للأجهزة المحمولة يتيح للمشرفين الميدانيين البحث والتحقق من الأسماء أثناء التوزيع بسهولة تامة.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            How It Works (Steps)
            ========================================== */}
        <section className="public-section">
          <div className="public-section-container">
            <div className="section-header-center">
              <span className="section-badge">آلية العمل</span>
              <h2 className="section-title">كيف تعمل منصة نَسَق في 4 خطوات بسيطة؟</h2>
              <p className="section-subtitle">
                سير عمل واضح ومباشر ينقل إدارة المخيم من السجلات الورقية العشوائية إلى التنظيم الرقمي الكامل.
              </p>
            </div>

            <div className="steps-grid">
              <div className="step-card">
                <span className="step-number">01</span>
                <h3 className="step-title">تسجيل المخيم والمدراء</h3>
                <p className="step-desc">إنشاء حساب المخيم وتحديد الصلاحيات والموقع وسعة الاستيعاب عبر المشرف العام.</p>
              </div>

              <div className="step-card">
                <span className="step-number">02</span>
                <h3 className="step-title">إدخال واستيراد البيانات</h3>
                <p className="step-desc">إدخال سجلات العائلات فردياً أو استيراد كشوفات Excel سابقة بضغطة زر مع التحقق الفوري.</p>
              </div>

              <div className="step-card">
                <span className="step-number">03</span>
                <h3 className="step-title">إنشاء كشوفات الترشيح</h3>
                <p className="step-desc">تحديد نوع المساعدة ومعايير الاستحقاق واختيار المستفيدين دون تكرار الترشيحات السابقة.</p>
              </div>

              <div className="step-card">
                <span className="step-number">04</span>
                <h3 className="step-title">التصدير والاعتماد</h3>
                <p className="step-desc">طباعة الكشوفات المعتمدة بصيغة PDF وتصدير ملفات البيانات وتقديمها للمؤسسات المانحة.</p>
              </div>
            </div>
          </div>
        </section>

        {/* AdSense Slot 2 (Middle Public) */}
        <div className="public-section-container" style={{ padding: "0 1.5rem" }}>
          <AdSenseBanner slot="1000000002" />
        </div>

        {/* ==========================================
            FAQ Section
            ========================================== */}
        <section className="public-section alt-bg">
          <div className="public-section-container">
            <div className="section-header-center">
              <span className="section-badge">الأسئلة الشائعة</span>
              <h2 className="section-title">إجابات على أكثر الاستفسارات تكراراً</h2>
              <p className="section-subtitle">تعرف أكثر على كيفية استفادة مخيمك أو جمعيتك من منظومة نَسَق.</p>
            </div>

            <div className="faq-list">
              <div className="faq-item">
                <h3 className="faq-question">
                  <FaQuestionCircle className="q-icon" />
                  <span>هل تدعم المنظومة استيراد ملفات Excel السابقة؟</span>
                </h3>
                <p className="faq-answer">
                  نعم، تدعم المنظومة معالج استيراد متطور يتعرف على أعمدة الأسماء، أرقام الهوية، عدد الأفراد، وأرقام التواصل مع مطابقة وتدقيق فوري للبيانات.
                </p>
              </div>

              <div className="faq-item">
                <h3 className="faq-question">
                  <FaQuestionCircle className="q-icon" />
                  <span>كيف تضمن المنظومة عدم تكرار استلام المساعدات؟</span>
                </h3>
                <p className="faq-answer">
                  يتضمن نظام الترشيح تنبيهات ذكية تمنع إضافة العائلة إذا كانت قد رُشحت لنفس المساعدة خلال الفترة المحددة، مما يضمن عدالة التوزيع بين كافة الأسر.
                </p>
              </div>

              <div className="faq-item">
                <h3 className="faq-question">
                  <FaQuestionCircle className="q-icon" />
                  <span>هل يمكن استخدام المنظومة في حال ضعف شبكة الإنترنت؟</span>
                </h3>
                <p className="faq-answer">
                  نعم، تحتوي نَسَق على طبقة تخزين احتياطية مشفرة محلياً تتيح استعراض البيانات واستمرار العمل الميداني ثم المزامنة السحابية فور عودة الاتصال.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            CTA Banner
            ========================================== */}
        <section className="public-section" style={{ paddingBottom: "5rem" }}>
          <div className="public-section-container">
            <div className="cta-banner">
              <h2 className="cta-title">جاهز لتنظيم إدارة مخيمك باحترافية؟</h2>
              <p className="cta-desc">
                انضم إلى المنظومة الرقمية الرائدة في إدارة المخيمات والإغاثة الإنسانية، وابدأ بتسجيل الدخول أو التواصل معنا لتجهيز حساب مخيمك.
              </p>
              <div className="cta-actions">
                <Link href="/login" className="cta-btn-light">
                  <span>تسجيل الدخول للنظام</span>
                </Link>
                <Link href="/contact" className="hero-btn-secondary">
                  <span>طلب استشارة أو دعم فني</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
