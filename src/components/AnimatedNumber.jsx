"use client";

import React, { useState, useEffect } from "react";

export const AnimatedNumber = ({ value, duration = 1200, decimals = 0, formatter }) => {
  const [current, setCurrent] = useState(0);
  const target = typeof value === "number" ? value : (parseFloat(value) || 0);

  useEffect(() => {
    if (isNaN(target) || target === 0) {
      setCurrent(0);
      return;
    }

    let startTimestamp = null;
    const startValue = 0;
    
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // منحنى سلاسة يبدأ سريعاً وينتهي بنعومة فخمة (Ease-Out Cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const val = startValue + (target - startValue) * easeOut;
      
      setCurrent(val);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCurrent(target);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [target, duration]);

  if (formatter) {
    return <span>{formatter(current)}</span>;
  }

  const isFloat = decimals > 0 || (target % 1 !== 0);
  const formattedVal = isFloat 
    ? current.toFixed(decimals || 1) 
    : Math.round(current).toLocaleString();

  return <span style={{ direction: "ltr", display: "inline-block" }}>{formattedVal}</span>;
};

export const AnimatedDonut = ({ percent, label, subText }) => {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const target = Math.min(100, Math.max(0, parseFloat(percent) || 0));

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / 1400, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const val = target * easeOut;

      setAnimatedPercent(val);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setAnimatedPercent(target);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [target]);

  return (
    <div className="data-donut">
      <div className="data-donut-ring" style={{ "--donut-value": `${animatedPercent.toFixed(1)}%` }}>
        <div className="data-donut-value">
          <AnimatedNumber value={percent} decimals={0} />%
        </div>
      </div>
      <strong className="data-donut-label">{label}</strong>
      <span className="data-donut-detail">{subText}</span>
    </div>
  );
};

export default AnimatedNumber;
