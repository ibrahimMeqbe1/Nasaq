"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isDemoMode, supabase, isSupabaseConfigured } from "../../lib/supabase";
import { subscribeFamilies } from "../../services/familyService";
import { subscribeNominations } from "../../services/nominationService";
import { getCampProfile } from "../../services/campService";
import Navbar from "../../components/Navbar";
import AnnouncementBar from "../../components/AnnouncementBar";
import DeveloperModal from "../../components/DeveloperModal";
import SubscriptionExpired from "../../views/SubscriptionExpired";

const AppContext = createContext(null);

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [families, setFamilies] = useState([]);
  const [nominations, setNominations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);

  const [campProfile, setCampProfile] = useState(null);
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  // 1. مراقبة حالة المصادقة عند البداية واستعادة الجلسة
  useEffect(() => {
    const restoreSession = async () => {
      const savedUserStr = typeof window !== "undefined" ? sessionStorage.getItem("kareem_camp_logged_in") : null;

      if (savedUserStr) {
        try {
          const parsed = JSON.parse(savedUserStr);
          setUser(parsed);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  // 2. التحقق من حالة اشتراك المخيم عند تسجيل الدخول
  useEffect(() => {
    if (!user || user.role === "superadmin" || !user.campId) {
      setCampProfile(null);
      setIsSubscriptionExpired(false);
      return;
    }

    getCampProfile(user.campId).then((profile) => {
      setCampProfile(profile);
      if (profile) {
        const now = new Date();
        const expiry = new Date(profile.subscriptionExpiry);
        const isExpired = !profile.isActive || expiry < now;
        setIsSubscriptionExpired(isExpired);
      } else {
        setIsSubscriptionExpired(false);
      }
    }).catch((err) => {
      console.error("Error checking camp profile:", err);
      setIsSubscriptionExpired(false);
    });
  }, [user?.campId, user?.role]);

  // 3. جلب بيانات العائلات والترشيحات والاشتراك الفوري
  useEffect(() => {
    if (!user || user.role === "superadmin") {
      setFamilies([]);
      setNominations([]);
      setDataError("");
      return;
    }

    const targetCampId = (user.campId && user.campId !== "system") ? user.campId : "kareem";

    const unsubscribeFamilies = subscribeFamilies(targetCampId, (data, error) => {
      if (error) {
        setDataError("تعذر مزامنة بيانات العائلات مع الخادم. لن تُعرض بيانات تجريبية بدلًا منها.");
        return;
      }
      setFamilies(data || []);
      setDataError("");
    });
    const unsubscribeNominations = subscribeNominations(targetCampId, (data, error) => {
      if (error) {
        setDataError("تعذر مزامنة كشف الترشيحات مع الخادم. تحقق من الاتصال أو أعد تسجيل الدخول.");
        return;
      }
      setNominations(data || []);
    });

    return () => {
      if (unsubscribeFamilies) unsubscribeFamilies();
      if (unsubscribeNominations) unsubscribeNominations();
    };
  }, [user?.campId, user?.role]);

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      sessionStorage.clear();
      localStorage.removeItem("kareem_camp_logged_in");
    }

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("Logout fetch warning:", e);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn("Supabase signOut warning:", e);
      }
    }

    setUser(null);
    setCampProfile(null);
    setIsSubscriptionExpired(false);

    // إعادة تحميل كاملة من المتصفح لتنظيف أي ذواكر متبقية بالـ React Memory / Closures
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    } else {
      router.replace("/login");
    }
  };

  // 4. حماية المسارات والتوجيه التلقائي
  const protectedRoutes = ["/families", "/nominations", "/settings", "/super-admin"];
  const isProtectedPath = Boolean(
    pathname && protectedRoutes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  );

  useEffect(() => {
    if (loading) return;

    const isSuperAdminPath = pathname === "/super-admin";

    if (!user && isProtectedPath) {
      router.replace("/login");
    } else if (user && user.role !== "superadmin" && isSuperAdminPath) {
      router.replace("/");
    } else if (user && pathname === "/login") {
      if (user.role === "superadmin") {
        router.replace("/super-admin");
      } else {
        router.replace("/");
      }
    }
  }, [user, loading, pathname, router, isProtectedPath]);

  const contextValue = {
    user,
    setUser,
    families,
    nominations,
    loading,
    campProfile,
    setCampProfile,
    isSubscriptionExpired,
    dataError,
    handleLogout,
  };

  // إذا لم يكن المستخدم مسجلاً لدخوله والصفحة محمية حصراً، نمنع عرض المحتوى ونتوجّه للوجين
  if (!user && isProtectedPath) {
    return (
      <AppContext.Provider value={contextValue}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f8fafc", direction: "rtl" }}>
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p style={{ color: "#475569", fontWeight: "bold", fontSize: "1.1rem" }}>جاري التوجيه لصفحة تسجيل الدخول...</p>
          </div>
        </div>
      </AppContext.Provider>
    );
  }

  // إذا لم يكن المستخدم مسجلاً لدخوله والصفحة عامة (مثل / أو /about أو /privacy أو /login أو /print)
  if (!user) {
    return (
      <AppContext.Provider value={contextValue}>
        {children}
      </AppContext.Provider>
    );
  }

  // إذا كان المسار للطباعة أو تسجيل الدخول
  if (pathname === "/print" || pathname === "/login") {
    return (
      <AppContext.Provider value={contextValue}>
        {children}
      </AppContext.Provider>
    );
  }

  // إذا كان المطور في لوحة تحكمه
  if (user && user.role === "superadmin") {
    return (
      <AppContext.Provider value={contextValue}>
        {children}
      </AppContext.Provider>
    );
  }

  // إذا كان الاشتراك منتهياً
  if (isSubscriptionExpired) {
    return (
      <AppContext.Provider value={contextValue}>
        <SubscriptionExpired 
          user={user} 
          campProfile={campProfile} 
          onLogout={handleLogout} 
        />
      </AppContext.Provider>
    );
  }

  // الهيكل المعياري المحمي للصفحات الداخلية
  return (
    <AppContext.Provider value={contextValue}>
      {user && <Navbar user={user} campProfile={campProfile} onLogout={handleLogout} />}
      {user && <AnnouncementBar />}
      {dataError && (
        <div className="system-data-alert" role="alert">
          {dataError}
        </div>
      )}
      <main className="main-content-layout">
        {children}
      </main>
      {user && (
        <footer className="app-footer no-print">
          <p className="copyright-text">© 2026 م. إبراهيم مقبل - كافة الحقوق محفوظة</p>
          <p className="developer-credit">
            تم تطوير الموقع بواسطة 
            <button onClick={() => setShowDeveloperModal(true)} className="developer-link-btn">
              م. إبراهيم مقبل
            </button>
          </p>
        </footer>
      )}
      {showDeveloperModal && (
        <DeveloperModal onClose={() => setShowDeveloperModal(false)} />
      )}
    </AppContext.Provider>
  );
};
