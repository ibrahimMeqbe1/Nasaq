"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaUsers, FaChartPie, FaSignOutAlt, FaClipboardList, FaCog, FaCampground } from "react-icons/fa";
import SubscriptionCountdown from "./SubscriptionCountdown";
import PWAInstaller from "./PWAInstaller";

const Navbar = ({ user, campProfile, onLogout }) => {
  const pathname = usePathname();
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const isActive = (path) => pathname === path;

  const displayName = 
    campProfile?.managerName || 
    user?.name || 
    user?.managerName || 
    campProfile?.name || 
    user?.username || 
    "المشرف";

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* الشعار والعنوان */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <Link href="/" className="navbar-brand">
            <div className="brand-icon-wrapper">
              <img 
                src={campProfile?.logoUrl || "/logo.jpg"} 
                alt={`شعار ${campProfile?.name || "المخيم"}`} 
                className="navbar-logo" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/logo.jpg";
                }} 
              />
            </div>
            <div className="navbar-titles">
              <span className="navbar-title-main">{campProfile?.name || "نظام إدارة المخيمات"}</span>
              <span className="navbar-title-sub">المنصة الشاملة للخدمات والإغاثة</span>
            </div>
          </Link>
          
          {/* مؤشر حالة الشبكة على الموبايل */}
          <div className="mobile-only-header-pwa" style={{ display: "none" }}>
            <PWAInstaller compact={true} />
          </div>
        </div>

        {/* روابط التنقل الرئيسية */}
        {user && (
          <nav className="navbar-links" aria-label="التنقل الرئيسي">
            <Link 
              href="/" 
              className={`navbar-link ${isActive("/") ? "active" : ""}`}
              aria-current={isActive("/") ? "page" : undefined}
            >
              <FaChartPie className="nav-icon" aria-hidden="true" />
              <span>الرئيسية</span>
            </Link>
            <Link 
              href="/families" 
              className={`navbar-link ${isActive("/families") ? "active" : ""}`}
              aria-current={isActive("/families") ? "page" : undefined}
            >
              <FaUsers className="nav-icon" aria-hidden="true" />
              <span>إدارة العائلات</span>
            </Link>
            <Link 
              href="/nominations" 
              className={`navbar-link ${isActive("/nominations") ? "active" : ""}`}
              aria-current={isActive("/nominations") ? "page" : undefined}
            >
              <FaClipboardList className="nav-icon" aria-hidden="true" />
              <span>كشف الترشيحات</span>
            </Link>
            <Link 
              href="/settings" 
              className={`navbar-link ${isActive("/settings") ? "active" : ""}`}
              aria-current={isActive("/settings") ? "page" : undefined}
            >
              <FaCog className="nav-icon" aria-hidden="true" />
              <span>إدارة المخيم</span>
            </Link>
          </nav>
        )}

        {/* الجانب الأيسر / أسفل الشريط الجانبي: عداد الاشتراك والمستخدم */}
        <div className="navbar-left">
          <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
            <PWAInstaller compact={true} />
          </div>

          {campProfile?.subscriptionExpiry && (
            <SubscriptionCountdown expiryDate={campProfile.subscriptionExpiry} compact={true} />
          )}
          
          {user && (
            <div className="user-profile-widget">
              <div className="user-pill-info" title={user.username || displayName}>
                <span className="user-avatar-circle">{displayName[0]?.toUpperCase() || "م"}</span>
                <span className="user-name-text">{displayName}</span>
              </div>
              <button 
                type="button"
                onClick={handleLogout} 
                className="btn-logout-icon" 
                title="تسجيل الخروج"
                aria-label="تسجيل الخروج"
              >
                <FaSignOutAlt aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* شريط التنقل السفلي للهواتف المحمولة */}
      {user && (
        <nav className="mobile-bottom-nav" aria-label="التنقل على الهاتف">
          <Link href="/" className={`mobile-bottom-link ${isActive("/") ? "active" : ""}`} aria-current={isActive("/") ? "page" : undefined}>
            <FaChartPie className="mobile-nav-icon" aria-hidden="true" />
            <span>الرئيسية</span>
          </Link>
          <Link href="/families" className={`mobile-bottom-link ${isActive("/families") ? "active" : ""}`} aria-current={isActive("/families") ? "page" : undefined}>
            <FaUsers className="mobile-nav-icon" aria-hidden="true" />
            <span>العائلات</span>
          </Link>
          <Link href="/nominations" className={`mobile-bottom-link ${isActive("/nominations") ? "active" : ""}`} aria-current={isActive("/nominations") ? "page" : undefined}>
            <FaClipboardList className="mobile-nav-icon" aria-hidden="true" />
            <span>الترشيحات</span>
          </Link>
          {user.role === "superadmin" ? (
            <Link href="/super-admin" className={`mobile-bottom-link ${isActive("/super-admin") ? "active" : ""}`} aria-current={isActive("/super-admin") ? "page" : undefined}>
              <FaCampground className="mobile-nav-icon" aria-hidden="true" />
              <span>المشرف</span>
            </Link>
          ) : (
            <Link href="/settings" className={`mobile-bottom-link ${isActive("/settings") ? "active" : ""}`} aria-current={isActive("/settings") ? "page" : undefined}>
              <FaCog className="mobile-nav-icon" aria-hidden="true" />
              <span>المخيم</span>
            </Link>
          )}
          <button type="button" onClick={handleLogout} className="mobile-bottom-link logout-mobile-btn" title="تسجيل الخروج">
            <FaSignOutAlt className="mobile-nav-icon logout-icon-danger" aria-hidden="true" />
            <span>خروج</span>
          </button>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
