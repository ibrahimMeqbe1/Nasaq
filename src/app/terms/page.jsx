"use client";

import React from "react";
import Link from "next/link";
import { FaFileContract, FaGavel, FaCheckCircle, FaUserCheck, FaExclamationTriangle } from "react-icons/fa";
import PublicHeader from "../../components/public/PublicHeader";
import PublicFooter from "../../components/public/PublicFooter";
import AdSenseBanner from "../../components/AdSenseBanner";

export default function TermsPage() {
  return (
    <div className="public-page-wrapper" dir="rtl">
      <PublicHeader />

      <main className="public-main-content">
        <section className="hero-section" style={{ padding: "3.5rem 1.5rem" }}>
          <div className="hero-overlay-glow" />
          <div className="section-header-center" style={{ marginBottom: "0", position: "relative", zIndex: 2 }}>
            <span className="hero-badge">
              <FaFileContract />
              <span>الاتفاقيات والاستخدام</span>
            </span>
            <h1 className="hero-title" style={{ fontSize: "2.3rem" }}>
              شروط الاستخدام | <span className="highlight">منظومة نَسَق</span>
            </h1>
            <p className="hero-subtitle">
              الشروط والأحكام المنظمة لاستخدام منصة نَسَق والخدمات الرقمية المرتبطة بها.
            </p>
          </div>
        </section>

        <div className="public-section-container" style={{ padding: "0 1.5rem" }}>
          <AdSenseBanner slot="1000000009" />
        </div>

        <section className="public-section">
          <div className="policy-page-container">
            <div className="policy-card">
              <div className="policy-header">
                <h2 className="policy-main-title">الشروط والأحكام العامة</h2>
                <span className="policy-last-updated">آخر تحديث: {new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>

              <div className="policy-content-section">
                <h3 className="policy-section-title">
                  <FaCheckCircle className="sec-icon" />
                  <span>1. الموافقة على الشروط</span>
                </h3>
                <p className="policy-text">
                  باستخدامك لمنظومة <strong>نَسَق (Nasaq)</strong>، فإنك توافق على الالتزام بجميع البنود والشروط المذكورة هنا، وتتعهد بعدم استخدام المنظومة في أي غرض غير قانوني أو ينتهك خصوصية المستفيدين أو المعايير الإنسانية الدولية.
                </p>
              </div>

              <div className="policy-content-section">
                <h3 className="policy-section-title">
                  <FaUserCheck className="sec-icon" />
                  <span>2. حسابات المستخدمين ومسؤولية الحساب</span>
                </h3>
                <p className="policy-text">
                  يتحمل مشرف المخيم أو المسؤول المفوض كامل المسؤولية عن سرية بيانات الدخول وكلمة المرور الخاصة بحسابه، وعن دقة وصحة البيانات المدخلة في كشوفات الأسر والترشيحات الإغاثية.
                </p>
              </div>

              <div className="policy-content-section">
                <h3 className="policy-section-title">
                  <FaGavel className="sec-icon" />
                  <span>3. الملكية الفكرية</span>
                </h3>
                <p className="policy-text">
                  جميع حقوق الملكية الفكرية، التصاميم، الشيفرات المصدرية، والعلامة التجارية لمنظومة نَسَق محفوظة لصالح المطور والمشروع. لا يحق لأي جهة إعادة بيع أو استنساخ الواجهات والبرمجيات دون إذن خطي مسبق.
                </p>
              </div>

              <div className="policy-content-section">
                <h3 className="policy-section-title">
                  <FaExclamationTriangle className="sec-icon" />
                  <span>4. إخلاء المسؤولية وحدود المسؤولية</span>
                </h3>
                <p className="policy-text">
                  تُبذل أقصى الجهود لضمان استقرار الخوادم ودقة معالجة البيانات، ومع ذلك فإن المنظومة غير مسؤولة عن أي أخطاء بشرية ناتجة عن إدخال بيانات غير صحيحة من قبل مدراء المخيمات أو انقطاع الخدمات السحابية الخارجة عن الإرادة.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="public-section-container" style={{ padding: "0 1.5rem 3rem" }}>
          <AdSenseBanner slot="1000000010" />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
