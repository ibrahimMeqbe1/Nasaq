"use client";

import React, { useState, useEffect } from "react";
import { FaClock, FaInfinity, FaExclamationTriangle } from "react-icons/fa";

const SubscriptionCountdown = ({ expiryDate, compact = false }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!expiryDate) return;

    const updateCountdown = () => {
      const expiry = new Date(expiryDate).getTime();
      const now = new Date().getTime();
      const difference = expiry - now;

      const year = new Date(expiryDate).getFullYear();
      if (year >= 2090) {
        setTimeLeft({ isUnlimited: true });
        return;
      }

      if (difference <= 0) {
        setTimeLeft({ isExpired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false, isUnlimited: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [expiryDate]);

  if (!timeLeft) return null;

  if (timeLeft.isUnlimited) {
    return (
      <div className="subscription-countdown-pill unlimited">
        <FaInfinity className="sub-icon" />
        <span>اشتراك دائم</span>
      </div>
    );
  }

  if (timeLeft.isExpired) {
    return (
      <div className="subscription-countdown-pill expired">
        <FaExclamationTriangle className="sub-icon" />
        <span>الاشتراك منتهي</span>
      </div>
    );
  }

  return (
    <div className="subscription-countdown-pill active">
      <FaClock className="sub-icon" />
      <span className="sub-label">المتبقي:</span>
      <div className="time-chips">
        {timeLeft.days > 0 && <span className="time-chip"><strong>{timeLeft.days}</strong>ي</span>}
        <span className="time-chip"><strong>{timeLeft.hours}</strong>س</span>
        <span className="time-chip"><strong>{timeLeft.minutes}</strong>د</span>
        <span className="time-chip seconds"><strong>{timeLeft.seconds}</strong>ث</span>
      </div>
    </div>
  );
};

export default SubscriptionCountdown;
