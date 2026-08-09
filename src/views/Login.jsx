"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  FaLock, 
  FaUser, 
  FaSignInAlt, 
  FaShieldAlt, 
  FaCampground, 
  FaKey, 
  FaUsers, 
  FaHandsHelping, 
  FaCheckCircle, 
  FaEye, 
  FaEyeSlash,
  FaCrown,
  FaSparkles,
  FaGlobe,
  FaBuilding
} from "react-icons/fa";
import { authenticateUser, getSuperAdminUsername } from "../services/campService";

const Login = ({ setUser }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const superAdminUser = getSuperAdminUsername();
  const isSuperAdminUser = username.trim().toLowerCase() === superAdminUser.toLowerCase() || username.trim().toLowerCase() === "ibrahim";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("يرجى إدخال اسم المستخدم.");
      return;
    }

    // إذا كان اسم المستخدم ليس superadmin ويحتاج كلمة سر
    if (!isSuperAdminUser && !password) {
      setError("يرجى إدخال كلمة المرور.");
      return;
    }

    setLoading(true);

    try {
      const result = await authenticateUser(username, password);
      
      if (result.success) {
        sessionStorage.setItem("kareem_camp_logged_in", JSON.stringify(result.user));
        localStorage.removeItem("kareem_camp_logged_in");
        setUser(result.user);
        setLoading(false);
        
        if (result.user.role === "superadmin") {
          router.push("/super-admin");
        } else {
          router.push("/");
        }
      } else {
        setError(result.error || "اسم المستخدم أو كلمة المرور غير صحيحة.");
        setLoading(false);
      }
    } catch (err) {
      setError("حدث خطأ أثناء محاولة تسجيل الدخول. يرجى المحاولة لاحقاً.");
      setLoading(false);
    }
  };

  const handleQuickFill = (userVal, passVal = "") => {
    setUsername(userVal);
    setPassword(passVal);
    setError("");
  };

  return (
    <div className="login-page-wrapper-luxury">
      {/* 3D Floating Interactive Background Elements */}
      <div className="bg-floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>

      <div className="login-container-split-3d">
        {/* قسم البانر الجانبي البصري الرسمى 3D */}
        <div className="login-side-showcase-3d">
          <div className="showcase-glow-backdrop"></div>
          <div className="showcase-content-3d">
            {/* الشعار المضيء 3D */}
            <div className="official-seal-badge-3d">
              <div className="seal-icon-glow">
                <FaCampground className="brand-svg-lg-3d" />
              </div>
              <div className="seal-text-info">
                <span className="seal-tag">المنظومة الرقمية الرسمية الموحدة</span>
                <span className="seal-title">نظام إدارة المخيمات الإغاثية</span>
              </div>
            </div>

            <h2>المنصة الذكية المتكاملة لإدارة شؤون المخيمات وتوزيع المساعدات</h2>
            <p>
              نظام إلكتروني متطور فائق الأمان والسرعة لتسجيل وحصر بيانات الأسر النازحة، تنظيم الترشيحات والشفافية في تقديم المساعدات بحرفية عالية.
            </p>

            {/* شريط الحالة والشبكة */}
            <div className="network-live-status-pill">
              <span className="pulse-dot"></span>
              <span>🟢 الربط السحابي الحقيقي متصل مع Supabase & Local DB</span>
            </div>
            
            {/* المميزات الرسمية */}
            <div className="showcase-features-list-3d">
              <div className="feature-item-3d">
                <div className="feat-icon-wrap">
                  <FaCheckCircle />
                </div>
                <span>إدارة وحصر دقيق لبيانات العائلات والأسر المتضررة</span>
              </div>
              <div className="feature-item-3d">
                <div className="feat-icon-wrap">
                  <FaCheckCircle />
                </div>
                <span>متابعة فورية وتصنيف الكشوفات وحالات الترشيح</span>
              </div>
              <div className="feature-item-3d">
                <div className="feat-icon-wrap">
                  <FaCheckCircle />
                </div>
                <span>إحصائيات ولوحات قياس حية وخرائط بيانات ذكية</span>
              </div>
              <div className="feature-item-3d">
                <div className="feat-icon-wrap">
                  <FaCheckCircle />
                </div>
                <span>تصدير رسمي بصيغ PDF و Excel بكفاءة عالية</span>
              </div>
            </div>

            {/* الإحصائيات Bar 3D */}
            <div className="showcase-stats-pills-3d">
              <div className="stat-pill-3d">
                <div className="stat-pill-icon primary">
                  <FaUsers />
                </div>
                <div>
                  <strong>+10,000</strong>
                  <small>عائلة مسجلة</small>
                </div>
              </div>
              <div className="stat-pill-3d">
                <div className="stat-pill-icon gold">
                  <FaHandsHelping />
                </div>
                <div>
                  <strong>+25,000</strong>
                  <small>ترشيح معتمد</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* قسم نموذج الدخول الفاخر 3D Glassmorphism */}
        <div className="login-form-side-3d">
          <div className="login-glass-card-3d">
            <div className="login-header-3d">
              <div className="login-brand-icon-3d">
                <FaCampground className="brand-svg-3d" />
              </div>
              <h1>تسجيل الدخول</h1>
              <p className="login-subtitle-3d">أدخل بيانات حسابك للمتابعة إلى اللوحة الرقمية</p>
            </div>

            {error && (
              <div className="login-error-badge-luxury-3d">
                <FaShieldAlt /> {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="login-form-3d">
              <div className="login-input-group-3d">
                <label htmlFor="username" className="login-input-label">
                  <FaUser className="login-field-icon" /> اسم المستخدم
                </label>
                <div className="input-with-icon-3d">
                  <input
                    type="text"
                    id="username"
                    placeholder="أدخل اسم المستخدم (مثال: Ibrahim)"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError("");
                    }}
                    required
                    autoComplete="username"
                  />
                </div>
                {isSuperAdminUser && (
                  <div className="ibrahim-pass-free-notice">
                    <FaCrown style={{ color: "#f59e0b" }} /> 
                    <span>حساب المشرف العام والمهندس المطور ({superAdminUser}) - مسموح الدخول مباشرة بدون كلمة سر ✨</span>
                  </div>
                )}
              </div>

              <div className="login-input-group-3d">
                <label htmlFor="password" className="login-input-label">
                  <FaLock className="login-field-icon" /> كلمة المرور {isSuperAdminUser && <span className="optional-badge">(اختياري لـ {superAdminUser})</span>}
                </label>
                <div className="input-with-icon-3d">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder={isSuperAdminUser ? `غير مطلوبة لحساب ${superAdminUser}` : "أدخل كلمة المرور"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!isSuperAdminUser}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-login-submit-luxury-3d" disabled={loading}>
                {loading ? (
                  <span className="spinner-text-3d">جاري التحقق وتأمين التوصيل...</span>
                ) : (
                  <>
                    <FaSignInAlt /> تسجيل الدخول للوحة التحكم
                  </>
                )}
              </button>
            </form>

            <div className="login-card-footer-3d">
              <p>
                © 2026 المنظومة الرقمية للمخيمات | تطوير وتنفيذ <strong>م. إبراهيم مقبل</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
