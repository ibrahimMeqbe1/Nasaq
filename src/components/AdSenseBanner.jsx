"use client";

import React, { useEffect } from "react";

export default function AdSenseBanner({
  slot = "1234567890",
  format = "auto",
  responsive = "true",
  className = "",
  style = {},
}) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  useEffect(() => {
    if (clientId && typeof window !== "undefined") {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.warn("AdSense push error:", err);
      }
    }
  }, [clientId]);

  if (!clientId) {
    return (
      <div
        className={`adsense-placeholder ${className}`}
        style={{
          padding: "16px 20px",
          margin: "24px 0",
          borderRadius: "12px",
          border: "1px dashed rgba(5, 150, 105, 0.3)",
          background: "rgba(5, 150, 105, 0.03)",
          textAlign: "center",
          color: "#64748b",
          fontSize: "0.85rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          ...style,
        }}
      >
        <span style={{ fontWeight: 600, color: "#059669" }}>مساحة إعلانية مجهزة لـ Google AdSense</span>
        <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>
          ستظهر الإعلانات تلقائياً بمجرد إدخال معرف الناشر (NEXT_PUBLIC_ADSENSE_CLIENT_ID)
        </span>
      </div>
    );
  }

  return (
    <div className={`adsense-wrapper ${className}`} style={{ margin: "24px 0", textAlign: "center", overflow: "hidden", ...style }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", ...style }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
}
