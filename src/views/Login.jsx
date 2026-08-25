"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  FaCheckCircle,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaShieldAlt,
  FaSignInAlt,
  FaUser,
} from "react-icons/fa";
import { loginAndRedirect } from "../lib/authHelpers";

const Login = ({ setUser }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("أدخل اسم المستخدم للمتابعة.");
      return;
    }

    if (!password) {
      setError("أدخل كلمة المرور للمتابعة.");
      return;
    }

    setLoading(true);

    try {
      const result = await loginAndRedirect(username, password);

      if (!result.success) {
        setError(result.error || "بيانات الدخول غير صحيحة. تحقق من اسم المستخدم وكلمة المرور ثم أعد المحاولة.");
        setLoading(false);
        return;
      }

      sessionStorage.setItem("kareem_camp_logged_in", JSON.stringify(result.user));
      localStorage.removeItem("kareem_camp_logged_in");
      setUser(result.user);
      router.push(result.redirectPath || (result.user.role === "superadmin" ? "/super-admin" : "/"));
    } catch {
      setError("تعذر الاتصال بالخادم. تحقق من الشبكة ثم أعد المحاولة.");
      setLoading(false);
    }
  };

  return (
    <main className="login-page" dir="rtl">
      <section className="login-shell" aria-label="تسجيل الدخول إلى نَسَق">
        <div className="login-intro">
          <div className="login-brand-lockup">
            <Image
              src="/nasaq-logo.png"
              alt="شعار نَسَق"
              width={72}
              height={72}
              priority
              className="login-brand-logo"
            />
            <div>
              <strong>نَسَق</strong>
              <span>منصة إدارة المخيمات</span>
            </div>
          </div>

          <div className="login-intro-copy">
            <p className="login-kicker">بيانات دقيقة. قرار أسرع.</p>
            <h2>إدارة المخيم من شاشة واحدة واضحة.</h2>
            <p>
              سجّل العائلات، راجع الترشيحات، وصدّر الكشوفات الرسمية دون تشتيت أو خطوات زائدة.
            </p>
          </div>

          <ul className="login-benefits" aria-label="وظائف المنصة الأساسية">
            <li><FaCheckCircle aria-hidden="true" /><span>سجل موحّد للعائلات والأفراد</span></li>
            <li><FaCheckCircle aria-hidden="true" /><span>ترشيحات وتقارير قابلة للطباعة</span></li>
            <li><FaCheckCircle aria-hidden="true" /><span>صلاحيات مستقلة لكل مخيم</span></li>
          </ul>

          <div className="login-security-note">
            <FaShieldAlt aria-hidden="true" />
            <span>الاتصال بقاعدة البيانات محمي، ولا تظهر بيانات مخيم لغير حسابه.</span>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="login-mobile-brand" aria-hidden="true">
            <Image src="/nasaq-logo.png" alt="" width={56} height={56} priority />
            <strong>نَسَق</strong>
          </div>

          <header className="login-form-heading">
            <h1>تسجيل الدخول</h1>
            <p>استخدم حساب المخيم أو حساب المشرف العام.</p>
          </header>

          {error && (
            <div id="login-error" className="login-alert" role="alert" aria-live="assertive">
              <FaShieldAlt aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form" noValidate>
            <div className="field-group">
              <label htmlFor="username"><FaUser aria-hidden="true" /> اسم المستخدم</label>
              <input
                type="text"
                id="username"
                placeholder="مثال: camp-admin"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setError("");
                }}
                required
                aria-required="true"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "login-error" : undefined}
                autoComplete="username"
                inputMode="text"
              />
            </div>

            <div className="field-group">
              <label htmlFor="password"><FaLock aria-hidden="true" /> كلمة المرور</label>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  required
                  aria-required="true"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "login-error" : undefined}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-submit" disabled={loading} aria-busy={loading}>
              {loading ? (
                <><span className="button-spinner" aria-hidden="true" /> جارٍ التحقق…</>
              ) : (
                <><FaSignInAlt aria-hidden="true" /> دخول إلى اللوحة</>
              )}
            </button>
          </form>

          <p className="login-support-copy">إذا تعذر الدخول، تواصل مع مشرف النظام لتأكيد بيانات الحساب.</p>
          <p className="login-copyright">© 2026 نَسَق لإدارة المخيمات</p>
        </div>
      </section>
    </main>
  );
};

export default Login;
