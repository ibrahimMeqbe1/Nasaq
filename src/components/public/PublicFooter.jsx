"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { FaHeart, FaEnvelope, FaWhatsapp, FaShieldAlt, FaExternalLinkAlt, FaFileContract, FaGlobe } from "react-icons/fa";

export default function PublicFooter() {
  return (
    <footer className="public-footer" dir="rtl">
      <div className="public-footer-container">
        {/* Brand Column */}
        <div className="public-footer-col brand-col">
          <div className="footer-brand-lockup">
            <Image
              src="/nasaq-logo.png"
              alt="شعار نَسَق"
              width={48}
              height={48}
            />
            <div>
              <h3 className="footer-brand-title">منظومة نَسَق الرقمية</h3>
              <p className="footer-brand-subtitle">الحل المؤسسي لإدارة المخيمات والإغاثة الإنسانية</p>
            </div>
          </div>
          <p className="footer-desc">
            منظومة سحابية متقدمة وآمنة تُمكن مدراء المخيمات واللجان الإغاثية من حصر العائلات، تنظيم قوائم الترشيح، توليد التقارير المعتمدة، وضمان عدالة التوزيع وفق أعلى معايير الخصوصية.
          </p>
        </div>

        {/* Quick Links */}
        <div className="public-footer-col">
          <h4 className="footer-heading">روابط سريعة</h4>
          <ul className="footer-links">
            <li><Link href="/">الرئيسية</Link></li>
            <li><Link href="/features">المميزات والحلول</Link></li>
            <li><Link href="/about">من نحن</Link></li>
            <li><Link href="/faq">الأسئلة الشائعة</Link></li>
            <li><Link href="/contact">اتصل بنا</Link></li>
            <li><Link href="/login">تسجيل الدخول للنظام</Link></li>
          </ul>
        </div>

        {/* Legal & Policies (Mandatory for AdSense) */}
        <div className="public-footer-col">
          <h4 className="footer-heading">السياسات والأمان</h4>
          <ul className="footer-links">
            <li>
              <Link href="/privacy" className="footer-legal-link">
                <FaShieldAlt />
                <span>سياسة الخصوصية</span>
              </Link>
            </li>
            <li>
              <Link href="/terms" className="footer-legal-link">
                <FaFileContract />
                <span>شروط الاستخدام</span>
              </Link>
            </li>
            <li>
              <span className="footer-info-badge">
                <FaGlobe />
                <span>بروتوكول حماية البيانات الإنسانية</span>
              </span>
            </li>
          </ul>
        </div>

        {/* Developer & Contact */}
        <div className="public-footer-col">
          <h4 className="footer-heading">التواصل والدعم الفني</h4>
          <p className="footer-contact-text">
            فريق التطوير والاستشارات التقنية جاهز للإجابة على استفسارات المؤسسات والجهات الإغاثية.
          </p>
          <div className="footer-contact-buttons">
            <a
              href="https://wa.me/970597163242"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-btn-whatsapp"
            >
              <FaWhatsapp />
              <span>واتساب الدعم</span>
            </a>
            <a
              href="mailto:7ema.meqbe1@gmail.com"
              className="footer-btn-email"
            >
              <FaEnvelope />
              <span>البريد الإلكتروني</span>
            </a>
          </div>
        </div>
      </div>

      <div className="public-footer-bottom">
        <div className="public-footer-bottom-content">
          <p>
            جميع الحقوق محفوظة © {new Date().getFullYear()} <strong>منظومة نَسَق (Nasaq)</strong>. تم التطوير بواسطة م. إبراهيم مقبل
          </p>
          <div className="footer-bottom-links">
            <Link href="/privacy">الخصوصية</Link>
            <span>•</span>
            <Link href="/terms">الشروط</Link>
            <span>•</span>
            <Link href="/contact">الدعم</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
