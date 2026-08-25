"use client";

import React, { useState, useEffect } from "react";
import { FaBullhorn, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import { getAnnouncement } from "../services/campService";

const AnnouncementBar = () => {
  const [announcement, setAnnouncement] = useState(null);

  const fetchAnnouncement = () => {
    getAnnouncement().then(data => {
      setAnnouncement(data);
    });
  };

  useEffect(() => {
    fetchAnnouncement();

    const handleUpdate = () => fetchAnnouncement();
    window.addEventListener("announcementUpdated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    const interval = setInterval(fetchAnnouncement, 3000);

    return () => {
      window.removeEventListener("announcementUpdated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      clearInterval(interval);
    };
  }, []);

  if (!announcement || !announcement.isActive || !announcement.text) {
    return null;
  }

  let bgGradient = "linear-gradient(90deg, #7f1d1d, #991b1b)"; // urgent / red
  let labelBg = "#450a0a";
  let labelText = "تعميم عاجل";
  let Icon = FaBullhorn;

  if (announcement.type === "warning") {
    bgGradient = "linear-gradient(90deg, #78350f, #92400e)"; // gold/amber / warning
    labelBg = "#451a03";
    labelText = "تنبيه إداري";
    Icon = FaExclamationTriangle;
  } else if (announcement.type === "info") {
    bgGradient = "linear-gradient(90deg, #0f5132, #1e3d59)"; // deep emerald / info
    labelBg = "#062c1b";
    labelText = "بيان رسمي";
    Icon = FaInfoCircle;
  }

  return (
    <div 
      className="announcement-bar no-print" 
      style={{
        background: bgGradient,
        color: "#f8fafc",
        display: "flex",
        alignItems: "center",
        padding: "7px 16px",
        fontSize: "0.92rem",
        fontWeight: "600",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        overflow: "hidden",
        position: "relative",
        zIndex: 999,
        borderBottom: "1px solid rgba(255,255,255,0.15)"
      }}
    >
      <style>{`
        @keyframes tickerNewsRTL {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .announcement-ticker-container {
          flex: 1;
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          height: 28px;
        }
        .announcement-ticker-text {
          display: inline-block;
          white-space: nowrap;
          animation: tickerNewsRTL 20s linear infinite;
          font-size: 0.95rem;
          font-weight: 700;
          color: #ffffff;
          will-change: transform;
        }
        .announcement-separator {
          display: inline-block;
          width: 1.5rem;
          height: 1px;
          margin-inline: 2rem;
          vertical-align: middle;
          background: currentColor;
          opacity: 0.55;
        }
        .announcement-bar:hover .announcement-ticker-text,
        .announcement-bar:focus-within .announcement-ticker-text {
          animation-play-state: paused;
        }
      `}</style>

      {/* الشارة الثابتة على اليمين */}
      <div 
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: labelBg,
          color: "#ffffff",
          padding: "5px 14px",
          borderRadius: "50px",
          whiteSpace: "nowrap",
          marginLeft: "15px",
          fontSize: "0.82rem",
          fontWeight: "800",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.2)",
          flexShrink: 0,
          zIndex: 5
        }}
      >
        <Icon style={{ fontSize: "0.9rem" }} />
        <span>{labelText}</span>
      </div>

      {/* المسار المتحرك لشريط الأخبار */}
      <div className="announcement-ticker-container">
        <div className="announcement-ticker-text">
          {announcement.text}<span className="announcement-separator" aria-hidden="true" />{announcement.text}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBar;
