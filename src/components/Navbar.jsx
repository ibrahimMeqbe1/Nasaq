"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isDemoMode } from "../lib/supabase";
import { FaUsers, FaChartPie, FaSignOutAlt, FaDatabase, FaClipboardList, FaCog, FaCampground, FaBars, FaTimes, FaUserCircle } from "react-icons/fa";
import SubscriptionCountdown from "./SubscriptionCountdown";

const Navbar = ({ user, campProfile, onLogout }) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

        {/* روابط التنقل الرئيسية */}
        {user && (
          <nav className={`navbar-links ${mobileMenuOpen ? "open" : ""}`}>
            <Link 
              href="/" 
              className={`navbar-link ${isActive("/") ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <FaChartPie className="nav-icon" />
              <span>الرئيسية</span>
            </Link>
            <Link 
              href="/families" 
              className={`navbar-link ${isActive("/families") ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <FaUsers className="nav-icon" />
              <span>إدارة العائلات</span>
            </Link>
            <Link 
              href="/nominations" 
              className={`navbar-link ${isActive("/nominations") ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <FaClipboardList className="nav-icon" />
              <span>كشف الترشيحات</span>
            </Link>
            <Link 
              href="/settings" 
              className={`navbar-link ${isActive("/settings") ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <FaCog className="nav-icon" />
              <span>إدارة المخيم</span>
            </Link>
          </nav>
        )}

        {/* الجانب الأيسر: عداد الاشتراك والمستخدم */}
        <div className="navbar-left">
          {campProfile?.subscriptionExpiry && (
            <SubscriptionCountdown expiryDate={campProfile.subscriptionExpiry} compact={true} />
          )}

          {isDemoMode && (
            <div className="demo-badge" title="بيانات توضيحية محلياً">
              <FaDatabase className="demo-badge-icon" />
              <span>وضع تجريبي</span>
            </div>
          )}
          
          {user && (
            <div className="user-profile-widget">
              <div className="user-pill-info" title={user.email || ""}>
                <span className="user-avatar-circle">{displayName[0].toUpperCase()}</span>
                <span className="user-name-text">{displayName}</span>
              </div>
              <button 
                onClick={handleLogout} 
                className="btn-logout-icon" 
                title="تسجيل الخروج"
              >
                <FaSignOutAlt />
                <span>خروج</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* شريط التنقل السفلي الفاخر للهواتف المحمولة */}
      {user && (
        <nav className="mobile-bottom-nav">
          <Link href="/" className={`mobile-bottom-link ${isActive("/") ? "active" : ""}`}>
            <FaChartPie className="mobile-nav-icon" />
            <span>الرئيسية</span>
          </Link>
          <Link href="/families" className={`mobile-bottom-link ${isActive("/families") ? "active" : ""}`}>
            <FaUsers className="mobile-nav-icon" />
            <span>العائلات</span>
          </Link>
          <Link href="/nominations" className={`mobile-bottom-link ${isActive("/nominations") ? "active" : ""}`}>
            <FaClipboardList className="mobile-nav-icon" />
            <span>الترشيحات</span>
          </Link>
          {user.role === "superadmin" ? (
            <Link href="/super-admin" className={`mobile-bottom-link ${isActive("/super-admin") ? "active" : ""}`}>
              <FaCampground className="mobile-nav-icon" />
              <span>المشرف</span>
            </Link>
          ) : (
            <Link href="/settings" className={`mobile-bottom-link ${isActive("/settings") ? "active" : ""}`}>
              <FaCog className="mobile-nav-icon" />
              <span>المخيم</span>
            </Link>
          )}
          <button onClick={handleLogout} className="mobile-bottom-link logout-mobile-btn" title="تسجيل الخروج">
            <FaSignOutAlt className="mobile-nav-icon logout-icon-danger" />
            <span>خروج</span>
          </button>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
