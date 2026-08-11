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
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);

  const [campProfile, setCampProfile] = useState(null);
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  // 1. مراقبة حالة المصادقة عند البداية واستعادة الجلسة السحابية
  useEffect(() => {
    const restoreSession = async () => {
      const savedUser =
        sessionStorage.getItem("kareem_camp_logged_in") ||
        localStorage.getItem("kareem_camp_logged_in");

      const savedSession =
        sessionStorage.getItem("kareem_camp_supabase_session") ||
        localStorage.getItem("kareem_camp_supabase_session");

      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);

          if (savedSession && isSupabaseConfigured && supabase) {
            try {
              const sessionObj = JSON.parse(savedSession);
              const { error } = await supabase.auth.setSession(sessionObj);
              if (error) {
                console.warn("Expired or invalid Supabase session, clearing auth:", error);
                await handleLogout();
                setLoading(false);
                return;
              }
            } catch (e) {
              console.warn("Failed to restore Supabase auth session:", e);
            }
          }

          setUser(parsed);
        } catch (e) {
          await handleLogout();
          setLoading(false);
          return;
        }
      } else {
        setUser(null);
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("kareem_camp_logged_in");
          localStorage.removeItem("kareem_camp_logged_in");
          sessionStorage.removeItem("kareem_camp_supabase_session");
          localStorage.removeItem("kareem_camp_supabase_session");
        }
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
    if (!user) {
      setFamilies([]);
      setNominations([]);
      return;
    }

    const targetCampId = (user.campId && user.campId !== "system") ? user.campId : "kareem";

    const unsubscribeFamilies = subscribeFamilies(targetCampId, (data) => {
      setFamilies(data || []);
    });
    const unsubscribeNominations = subscribeNominations(targetCampId, (data) => {
      setNominations(data || []);
    });

    return () => {
      if (unsubscribeFamilies) unsubscribeFamilies();
      if (unsubscribeNominations) unsubscribeNominations();
    };
  }, [user?.campId, user?.role]);

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("kareem_camp_logged_in");
      localStorage.removeItem("kareem_camp_logged_in");
      sessionStorage.removeItem("kareem_camp_supabase_session");
      localStorage.removeItem("kareem_camp_supabase_session");

      // إخلاء كامل لأي رموز Supabase قديمة مخزنة بالمتصفح
      Object.keys(localStorage).forEach((key) => {
        if (key.includes("supabase.auth.token") || key.startsWith("sb-")) {
          localStorage.removeItem(key);
        }
      });
      Object.keys(sessionStorage).forEach((key) => {
        if (key.includes("supabase.auth.token") || key.startsWith("sb-")) {
          sessionStorage.removeItem(key);
        }
      });
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
    router.replace("/login");
  };

  // 4. حماية المسارات والتوجيه التلقائي
  useEffect(() => {
    if (loading) return;

    const isPublicPath = pathname === "/login" || pathname === "/print";
    const isSuperAdminPath = pathname === "/super-admin";

    if (!user && !isPublicPath) {
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
  }, [user, loading, pathname, router]);

  const contextValue = {
    user,
    setUser,
    families,
    nominations,
    loading,
    campProfile,
    setCampProfile,
    isSubscriptionExpired,
    handleLogout
  };

  // إذا لم يكن المستخدم مسجلاً لدخوله والصفحة غير عامة، نمنع عرض المحتوى ونتوجّه للوجين
  if (!user && pathname !== "/login" && pathname !== "/print") {
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
