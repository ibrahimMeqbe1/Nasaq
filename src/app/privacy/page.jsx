"use client";

import React from "react";
import Link from "next/link";
import { FaShieldAlt, FaCookieBite, FaUserSecret, FaLock, FaGlobeAmericas, FaEnvelope } from "react-icons/fa";
import PublicHeader from "../../components/public/PublicHeader";
import PublicFooter from "../../components/public/PublicFooter";
import AdSenseBanner from "../../components/AdSenseBanner";

export default function PrivacyPolicyPage() {
  return (
    <div className="public-page-wrapper" dir="rtl">
      <PublicHeader />

      <main className="public-main-content">
        <section className="hero-section" style={{ padding: "3.5rem 1.5rem" }}>
          <div className="hero-overlay-glow" />
          <div className="section-header-center" style={{ marginBottom: "0", position: "relative", zIndex: 2 }}>
            <span className="hero-badge">
              <FaShieldAlt />
              <span>الشفافية والأمان</span>
            </span>
            <h1 className="hero-title" style={{ fontSize: "2.3rem" }}>
              سياسة الخصوصية | <span className="highlight">منظومة نَسَق</span>
            </h1>
            <p className="hero-subtitle">
              نلتزم بحماية خصوصية زوار ومستخدمي منصة نَسَق وتوضيح كيفية التعامل مع البيانات والإعلانات وملفات تعريف الارتباط.
            </p>
          </div>
        </section>

        <div className="public-section-container" style={{ padding: "0 1.5rem" }}>
          <AdSenseBanner slot="1000000007" />
        </div>

        <section className="public-section">
          <div className="policy-page-container">
            <div className="policy-card">
              <div className="policy-header">
                <h2 className="policy-main-title">سياسة الخصوصية وحماية البيانات</h2>
                <span className="policy-last-updated">آخر تحديث: {new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>

              <div className="policy-content-section">
                <h3 className="policy-section-title">
                  <FaUserSecret className="sec-icon" />
                  <span>1. مقدمة ونطاق التطبيق</span>
                </h3>
                <p className="policy-text">
                  تُحدد هذه الوثيقة سياسة الخصوصية الخاصة بـ <strong>منظومة نَسَق (Nasaq)</strong> وكيفية جمع واستخدام وحماية المعلومات عند استخدام موقعنا الإلكتروني والخدمات المرتبطة به. خصوصية الزوار والمستفيدين ذات أهمية قصوى بالنسبة لنا، ونحن ملتزمون بعدم مشاركة أو بيع أي بيانات شخصية لأي أطراف غير مصرح لها.
                </p>
              </div>

              <div className="policy-content-section">
                <h3 className="policy-section-title">
                  <FaLock className="sec-icon" />
                  <span>2. البيانات التي يتم جمعها وكيفية استخدامها</span>
                </h3>
                <p className="policy-text">
                  - <strong>البيانات التشغيلية للمخيمات:</strong> تُستخدم بيانات العائلات والترشيحات المسجلة عبر الحسابات المخولة حصراً لأغراض تنظيم وتوزيع المساعدات الإنسانية وتوليد التقارير المعتمدة، ولا يتم استخدامها في أي سياق إعلاني أو تجاري إطلاقاً.
                </p>
                <p className="policy-text">
                  - <strong>ملفات السجل (Log Files):</strong> كمعظم خوادم المواقع الإلكترونية، يجمع الخادم تلقائياً معلومات غير شخصية مثل عنوان بروتوكول الإنترنت (IP)، نوع المتصفح، مزود خدمة الإنترنت (ISP)، طابع التاريخ/الوقت، والصفحات التي تمت زيارتها لتحليل الأداء وتحسين تجربة التصفح.
                </p>
              </div>

              <div className="policy-content-section">
                <h3 className="policy-section-title">
                  <FaCookieBite className="sec-icon" />
                  <span>3. ملفات تعريف الارتباط (Cookies) وإعلانات Google AdSense</span>
                </h3>
                <p className="policy-text">
                  نحن نستخدم ملفات تعريف الارتباط لتخزين تفضيلات الزوار وتوثيق جلسات الدخول الآمنة. بالإضافة إلى ذلك:
                </p>
                <ul className="policy-list">
                  <li>
                    تستخدم الشركات الخارجية والمزودون الإعلانيون (بما في ذلك <strong>Google</strong>) ملفات تعريف الارتباط (Cookies) لخدمة وعرض الإعلانات بناءً على زيارات المستخدم السابقة لموقعنا أو لمواقع أخرى على شبكة الإنترنت.
                  </li>
                  <li>
                    يُتيح استخدام ملف تعريف الارتباط <strong>DART</strong> لشركة Google وشركائها إمكانية تقديم الإعلانات للمستخدمين استناداً إلى زياراتهم لموقعنا والمواقع الأخرى.
                  </li>
                  <li>
                    يمكن للمستخدمين إلغاء الاشتراك في استخدام ملف تعريف الارتباط DART لخدمة الإعلانات القائمة على الاهتمامات من خلال زيارة:{" "}
                    <a
                      href="https://adssettings.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#059669", fontWeight: 700 }}
                    >
                      إعدادات إعلانات Google
                    </a>.
                  </li>
                </ul>
              </div>

              <div className="policy-highlight-box">
                <strong>تنويه هام:</strong> نحن نضمن الفصل التام بين البيانات الحساسة للمستفيدين ولوحة التحكم المحمية، وبين شبكات الإعلانات العامة؛ حيث تقتصر أي وحدات إعلانية على الصفحات التعريفية العامة فقط.
              </div>

              <div className="policy-content-section">
                <h3 className="policy-section-title">
                  <FaGlobeAmericas className="sec-icon" />
                  <span>4. سياسات الخصوصية للأطراف الثالثة</span>
                </h3>
                <p className="policy-text">
                  لا تنطبق سياسة الخصوصية الخاصة بـ نَسَق على معلنين أو مواقع ويب أخرى. لذلك، ننصحكم بالرجوع إلى سياسات الخصوصية المعنية لخوادم إعلانات الجهات الخارجية للحصول على معلومات أكثر تفصيلاً حول ممارساتهم وإرشادات إلغاء الاشتراك.
                </p>
              </div>

              <div className="policy-content-section">
                <h3 className="policy-section-title">
                  <FaEnvelope className="sec-icon" />
                  <span>5. التواصل بشأن الخصوصية</span>
                </h3>
                <p className="policy-text">
                  إذا كانت لديكم أي أسئلة أو استفسارات إضافية حول سياسة الخصوصية الخاصة بنا، يمكنكم التواصل معنا مباشرة عبر البريد الإلكتروني:{" "}
                  <a href="mailto:7ema.meqbe1@gmail.com" style={{ color: "#059669", fontWeight: 700 }}>
                    7ema.meqbe1@gmail.com
                  </a>{" "}
                  أو من خلال صفحة <Link href="/contact" style={{ color: "#059669", fontWeight: 700 }}>اتصل بنا</Link>.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="public-section-container" style={{ padding: "0 1.5rem 3rem" }}>
          <AdSenseBanner slot="1000000008" />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
