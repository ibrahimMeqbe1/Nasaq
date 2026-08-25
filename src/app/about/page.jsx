"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { FaShieldAlt, FaBullseye, FaHeart, FaCode, FaCampground, FaUsers, FaArrowLeft, FaCheck } from "react-icons/fa";
import PublicHeader from "../../components/public/PublicHeader";
import PublicFooter from "../../components/public/PublicFooter";
import AdSenseBanner from "../../components/AdSenseBanner";

export default function AboutPage() {
  return (
    <div className="public-page-wrapper" dir="rtl">
      <PublicHeader />

      <main className="public-main-content">
        <section className="hero-section" style={{ padding: "4rem 1.5rem 4.5rem" }}>
          <div className="hero-overlay-glow" />
          <div className="section-header-center" style={{ marginBottom: "0", position: "relative", zIndex: 2 }}>
            <span className="hero-badge">
              <FaCampground />
              <span>عن المنظومة والرؤية</span>
            </span>
            <h1 className="hero-title" style={{ fontSize: "2.5rem" }}>
              من نحن | <span className="highlight">منظومة نَسَق الرقمية</span>
            </h1>
            <p className="hero-subtitle">
              مبادرة تكنولوجية سحابية متقدمة ولدت لخدمة العمل الإنساني، تنظيم بيانات المخيمات، ودعم متخذي القرار الإغاثي بأعلى درجات الموثوقية والشفافية.
            </p>
          </div>
        </section>

        <div className="public-section-container" style={{ padding: "0 1.5rem" }}>
          <AdSenseBanner slot="1000000003" />
        </div>

        <section className="public-section">
          <div className="policy-page-container">
            <div className="policy-card">
              <div className="policy-content-section">
                <h2 className="policy-section-title">
                  <FaBullseye className="sec-icon" />
                  <span>الرسالة والأهداف الإنسانية</span>
                </h2>
                <p className="policy-text">
                  تأسست منظومة <strong>نَسَق</strong> استجابةً للتحديات المعقدة والملحة التي تواجهها لجان إدارة مخيمات النزوح والمراكز الإيوائية والجمعيات الخيرية. يهدف المشروع إلى تحويل العمليات الإدارية والإغاثية الميدانية من العشوائية والاعتماد على الكشوفات الورقية المعرضة للتلف أو التكرار، إلى بنية تحتية رقمية فائقة التطور والدقة.
                </p>
                <p className="policy-text">
                  نسعى إلى تمكين المؤسسات الإنسانية والمانحين من الوصول إلى بيانات واقعية ومحدثة ومؤمنة تماماً، مما يضمن وصول المساعدات لمستحقيها الفعليين ومنع أي ازدواجية في كشوفات الترشيح.
                </p>
              </div>

              <div className="policy-highlight-box">
                <strong>قيمنا الأساسية:</strong> الشفافية المطلقة، صون كرامة وخصوصية الأسر المستفيدة، الكفاءة البرمجية العالية، وسهولة الاستخدام للفرق الميدانية في أصعب الظروف.
              </div>

              <div className="policy-content-section">
                <h2 className="policy-section-title">
                  <FaShieldAlt className="sec-icon" />
                  <span>ما الذي يميز منظومة نَسَق؟</span>
                </h2>
                <ul className="policy-list">
                  <li>
                    <strong>فصل الصلاحيات وحماية البيانات:</strong> عزل تام بين بيانات كل مخيم مع لوحة تحكم مركزية للمشرف العام لمتابعة مؤشرات الأداء الكلية.
                  </li>
                  <li>
                    <strong>خوارزميات الترشيح الذكية:</strong> منع ترشيح الأسرة الواحدة لأكثر من مساعدة خلال فترة زمنية محددة لضمان شمولية التوزيع.
                  </li>
                  <li>
                    <strong>استيراد وتصدير متعدد الصيغ:</strong> دعم كامل لملفات Excel و PDF المجهزة للطباعة الرسمية والمطابقة لمعايير المنظمات الدولية.
                  </li>
                  <li>
                    <strong>العمل في ظروف ضعف الاتصال:</strong> بنية معمارية تدمج بين التخزين المحلي المشفر والمزامنة السحابية الفورية.
                  </li>
                </ul>
              </div>

              <div className="policy-content-section">
                <h2 className="policy-section-title">
                  <FaCode className="sec-icon" />
                  <span>فريق التطوير والتقنيات</span>
                </h2>
                <p className="policy-text">
                  تم تطوير وهندسة منظومة <strong>نَسَق</strong> بواسطة <strong>المهندس إبراهيم مقبل</strong>، بالاعتماد على أحدث التقنيات السحابية مفتوحة المصدر وحزم الحماية العالية (Next.js 16, React 19, Supabase PostgreSQL, OpenNext Cloudflare Workers).
                </p>
                <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <Link href="/contact" className="hero-btn-primary" style={{ padding: "0.65rem 1.4rem", fontSize: "0.95rem" }}>
                    <span>تواصل مع المطور</span>
                    <FaArrowLeft />
                  </Link>
                  <Link href="/features" className="hero-btn-secondary" style={{ padding: "0.65rem 1.4rem", fontSize: "0.95rem", color: "#0f172a", borderColor: "#cbd5e1" }}>
                    <span>استعراض مميزات المنظومة</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="public-section-container" style={{ padding: "0 1.5rem 3rem" }}>
          <AdSenseBanner slot="1000000004" />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
