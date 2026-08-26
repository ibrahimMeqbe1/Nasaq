"use client";

import React, { useState, useEffect } from "react";
import {
  FaWifi,
  FaDownload,
  FaSync,
  FaCheckCircle,
  FaExclamationTriangle,
  FaMobileAlt,
} from "react-icons/fa";
import {
  subscribeNetworkStatus,
  syncOfflineMutations,
  isNetworkOnline,
} from "../lib/syncEngine";

export default function PWAInstaller({ compact = false }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [networkState, setNetworkState] = useState({
    isOnline: true,
    pendingCount: 0,
  });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // 1. فحص هل التطبيق مثبت بالفعل (Standalone)
    if (
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true)
    ) {
      setIsInstalled(true);
    }

    // 2. الاستماع لحدث التثبيت beforeinstallprompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // 3. الاشتراك في حالة الشبكة وطابور المزامنة
    const unsubscribe = subscribeNetworkStatus((state) => {
      setNetworkState(state);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      unsubscribe();
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("لتثبيت التطبيق على الآيفون: اضغط على زر المشاركة أسفل Safari ثم اختر 'إضافة إلى الشاشة الرئيسية (Add to Home Screen)'");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncOfflineMutations();
    setIsSyncing(false);
  };

  if (compact) {
    return (
      <div className="pwa-compact-widget" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {/* شارة حالة الاتصال المدمجة */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "0.74rem",
            fontWeight: "800",
            padding: "3px 8px",
            borderRadius: "8px",
            background: networkState.isOnline ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.2)",
            color: networkState.isOnline ? "#34d399" : "#fca5a5",
            border: `1px solid ${networkState.isOnline ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.4)"}`,
          }}
          title={networkState.isOnline ? "متصل بالإنترنت" : "العمل في وضع عدم الاتصال (أوفلاين)"}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: networkState.isOnline ? "#10b981" : "#ef4444",
              display: "inline-block",
            }}
          />
          {networkState.isOnline ? "أونلاين" : "أوفلاين"}
        </span>

        {/* زر التعديلات المعلقة إن وجدت */}
        {networkState.pendingCount > 0 && (
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing || !networkState.isOnline}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.72rem",
              fontWeight: "800",
              padding: "3px 8px",
              borderRadius: "8px",
              background: "#d97706",
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
            }}
            title="مزامنة التعديلات المحفوظة محلياً مع السيرفر"
          >
            <FaSync className={isSyncing ? "spinner" : ""} />
            <span>{networkState.pendingCount} معلق</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="pwa-installer-card">
      {/* 1. حالة الشبكة والمزامنة */}
      <div className="pwa-status-row">
        <div className="pwa-network-badge">
          <span
            className={`status-indicator-dot ${
              networkState.isOnline ? "online" : "offline"
            }`}
          />
          <span className="status-text">
            {networkState.isOnline
              ? "متصل بالشبكة (Online)"
              : "وضع عدم الاتصال (Offline)"}
          </span>
        </div>

        {networkState.pendingCount > 0 && (
          <button
            type="button"
            className="btn-sync-pending"
            onClick={handleManualSync}
            disabled={isSyncing || !networkState.isOnline}
          >
            <FaSync className={isSyncing ? "spinner" : ""} />
            <span>
              {isSyncing
                ? "جاري المزامنة..."
                : `مزامنة ${networkState.pendingCount} تعديلات معلقة`}
            </span>
          </button>
        )}
      </div>

      {/* 2. زر تثبيت التطبيق على الهاتف */}
      {!isInstalled && (
        <button
          type="button"
          className="btn-pwa-install"
          onClick={handleInstallClick}
        >
          <FaMobileAlt className="install-icon" />
          <div className="install-text-group">
            <span className="install-title">تثبيت تطبيق نَسَق على الهاتف</span>
            <span className="install-sub">للعمل السريع والميداني بدون متصفح</span>
          </div>
          <FaDownload className="download-arrow" />
        </button>
      )}
    </div>
  );
}
