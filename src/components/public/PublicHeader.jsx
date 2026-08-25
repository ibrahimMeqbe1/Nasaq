"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FaBars, FaTimes, FaSignInAlt, FaCompass, FaLayerGroup, FaInfoCircle, FaQuestionCircle, FaEnvelope } from "react-icons/fa";

export default function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "الرئيسية", icon: FaCompass },
    { href: "/features", label: "المميزات والحلول", icon: FaLayerGroup },
    { href: "/about", label: "من نحن", icon: FaInfoCircle },
    { href: "/faq", label: "الأسئلة الشائعة", icon: FaQuestionCircle },
    { href: "/contact", label: "اتصل بنا", icon: FaEnvelope },
  ];

  return (
    <header className="public-navbar" dir="rtl">
      <div className="public-navbar-container">
        <Link href="/" className="public-navbar-brand">
          <Image
            src="/nasaq-logo.png"
            alt="شعار منصة نَسَق"
            width={44}
            height={44}
            className="public-brand-logo"
            priority
          />
          <div className="public-brand-text">
            <span className="public-brand-title">نَسَق</span>
            <span className="public-brand-tagline">إدارة المخيمات والاستجابة الإنسانية</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="public-nav-links">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`public-nav-link ${isActive ? "active" : ""}`}
              >
                <Icon className="nav-icon" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Action Button */}
        <div className="public-nav-actions">
          <Link href="/login" className="public-btn-login">
            <FaSignInAlt />
            <span>تسجيل الدخول</span>
          </Link>

          {/* Mobile Hamburger */}
          <button
            type="button"
            className="public-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="قائمة التنقل"
          >
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="public-mobile-menu">
          <nav className="public-mobile-nav">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`public-mobile-link ${isActive ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="nav-icon" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <Link
              href="/login"
              className="public-mobile-login-btn"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FaSignInAlt />
              <span>دخول النظام للمخيمات</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
