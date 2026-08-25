"use client";

import React from "react";
import Link from "next/link";
import {
  FaLayerGroup,
  FaUsers,
  FaFileAlt,
  FaFileExport,
  FaChartPie,
  FaLock,
  FaMobileAlt,
  FaCloudDownloadAlt,
  FaFilter,
  FaSearch,
  FaPrint,
  FaArrowLeft,
} from "react-icons/fa";
import PublicHeader from "../../components/public/PublicHeader";
import PublicFooter from "../../components/public/PublicFooter";
import AdSenseBanner from "../../components/AdSenseBanner";

export default function FeaturesPage() {
  const modules = [
    {
      icon: FaUsers,
      title: "1. وحدة السجل الموحد للأسر والنازحين",
      desc: "قاعدة بيانات رقمية متكاملة تتضمن أكثر من 12 حقلاً تفصيلياً لكل أسرة تشمل: الاسم الرباعي لرب الأسرة، رقم الهوية، عدد الذكور والإناث، الأطفال تحت 5 سنوات، كبار السن، ذوي الاحتياجات الخاصة، ومكان السكن ورقم الخيمة.",
      badge: "دقة 100%",
    },
    {
      icon: FaFileAlt,
      title: "2. محرك الترشيحات الإغاثية الذكي",
      desc: "إنشاء كشوفات ترشيح مخصصة لأنواع الإغاثة المختلفة (طرود غذائية، مبالغ نقدية، مستلزمات طبية، كسوة شتاء) مع خوارزمية ذكية لاكتشاف ومنع تكرار ترشيح المستفيدين خلال الفترات المتقاربة.",
      badge: "منع الازدواجية",
    },
    {
      icon: FaFileExport,
      title: "3. منظومة تصدير التقارير وExcel/PDF",
      desc: "تصدير فوري لكشوفات الترشيح وسجلات الأسر بصيغ متعددة متوافقة مع متطلبات المنظمات المانحة، مع دعم الطباعة الرسمية الأفقية والعمودية المجهزة لأختام الإدارة.",
      badge: "متوافق دولياً",
    },
    {
      icon: FaChartPie,
      title: "4. لوحة الإحصائيات والمؤشرات المتحركة",
      desc: "رسومات بيانية دائرية Donut Charts متحركة تصاعدياً لحساب نسب الفئات الهشة، معدلات التغطية، ونسب الحالات الخاصة لاتخاذ قرارات إغاثية مبنية على حقائق وأرقام دقيقة.",
      badge: "مؤشرات مباشرة",
    },
    {
      icon: FaCloudDownloadAlt,
      title: "5. معالج الاستيراد الذكي للبيانات",
      desc: "أداة ذكية لتحليل واستيراد ملفات Excel السابقة مع معالجة الأخطاء والتكرارات تلقائياً، مما يُسهل نقل وتحديث السجلات في دقائق معدودة.",
      badge: "استيراد سريع",
    },
    {
      icon: FaLock,
      title: "6. الأمان والتشفير والسحابة الهجينة",
      desc: "تشفير محلي للبيانات عند انقطاع الاتصال (Offline-Ready) مع مزامنة سحابية فائقة السرعة مع قواعد بيانات Supabase و Cloudflare Edge.",
      badge: "حماية مؤسسية",
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
              <FaLayerGroup />
              <span>الحلول والقدرات التقنية</span>
            </span>
            <h1 className="hero-title" style={{ fontSize: "2.5rem" }}>
              المميزات والحلول | <span className="highlight">منظومة نَسَق</span>
            </h1>
            <p className="hero-subtitle">
              استكشف بالتفصيل الأدوات والوحدات البرمجية المتطورة التي تجعل من نَسَق الخيار الأول لإدارة المخيمات والإغاثة الإنسانية.
            </p>
          </div>
        </section>

        <div className="public-section-container" style={{ padding: "0 1.5rem" }}>
          <AdSenseBanner slot="1000000011" />
        </div>

        <section className="public-section">
          <div className="public-section-container">
            <div className="features-grid">
              {modules.map((mod, index) => {
                const Icon = mod.icon;
                return (
                  <div key={index} className="feature-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                      <div className="feature-icon-wrapper" style={{ marginBottom: "0" }}>
                        <Icon />
                      </div>
                      <span className="section-badge" style={{ margin: "0", fontSize: "0.75rem" }}>{mod.badge}</span>
                    </div>
                    <h3 className="feature-card-title">{mod.title}</h3>
                    <p className="feature-card-text">{mod.desc}</p>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: "center", marginTop: "3.5rem" }}>
              <Link href="/login" className="hero-btn-primary" style={{ padding: "0.9rem 2.2rem" }}>
                <span>تجربة المنظومة وتسجيل الدخول</span>
                <FaArrowLeft />
              </Link>
            </div>
          </div>
        </section>

        <div className="public-section-container" style={{ padding: "0 1.5rem 3rem" }}>
          <AdSenseBanner slot="1000000012" />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
