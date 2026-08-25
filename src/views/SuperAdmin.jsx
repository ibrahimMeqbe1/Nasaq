"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { 
  FaCampground, 
  FaCoins, 
  FaSignOutAlt, 
  FaPlus, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaTimes,
  FaUserShield, 
  FaCalendarAlt, 
  FaSpinner, 
  FaWallet,
  FaClock,
  FaBullhorn,
  FaUsers,
  FaUserFriends,
  FaClipboardList,
  FaUserCheck,
  FaEdit,
  FaChartPie,
  FaTrash,
  FaCrown,
  FaUniversity,
  FaMobileAlt,
  FaCreditCard,
  FaKey,
  FaInfinity
} from "react-icons/fa";
import AnimatedNumber, { AnimatedDonut } from "../components/AnimatedNumber";
import {
  MIN_PASSWORD_LENGTH,
  NEW_PASSWORD_REQUIREMENT_MESSAGE,
  PASSWORD_REQUIREMENT_MESSAGE,
  isPasswordAllowed
} from "../lib/passwordPolicy";
import { 
  getAllCamps, 
  createCamp, 
  getPaymentMethods, 
  updatePaymentMethods, 
  getAllRenewalRequests, 
  approveRenewalRequest, 
  declineRenewalRequest,
  updateCampProfile,
  getAnnouncement,
  updateAnnouncement,
  getAdminSystemStats,
  getGlobalSystemMetrics,
  getCampAdminUser,
  updateCampFullDetails,
  deleteCampPermanently,
  getSuperAdminUsername,
  updateSuperAdminUsername
} from "../services/campService";

const SuperAdmin = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("camps"); // camps, requests, announcement, settings
  const [camps, setCamps] = useState([]);
  const [requests, setRequests] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState({
    bankOfPalestine: "",
    jawwalPay: "",
    palPay: ""
  });

  const [superAdminUsernameInput, setSuperAdminUsernameInput] = useState("");
  const [savingSuperAdminUser, setSavingSuperAdminUser] = useState(false);

  const [stats, setStats] = useState({
    totalCamps: 0,
    activeCamps: 0,
    expiredCamps: 0,
    totalUsers: 0,
    activeUsersCount: 0,
    totalFamilies: 0,
    totalNominations: 0,
    pendingRequests: 0,
    totalRequests: 0
  });

  const [announcementForm, setAnnouncementForm] = useState({
    text: "",
    isActive: true,
    type: "urgent"
  });

  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // حالة نموذج إضافة مخيم
  const [isAddCampOpen, setIsAddCampOpen] = useState(false);
  const [isCreatingCamp, setIsCreatingCamp] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingCamp, setIsDeletingCamp] = useState(false);
  const [newCamp, setNewCamp] = useState({
    id: "",
    name: "",
    managerName: "",
    managerPhone: "",
    adminUsername: "",
    adminPassword: "",
    trialPeriod: "1-month"
  });

  // حالة نموذج تعديل الاشتراك
  const [selectedCampForSubscription, setSelectedCampForSubscription] = useState(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscriptionExpiryInput, setSubscriptionExpiryInput] = useState("");

  // حالة نموذج تعديل كافة بيانات المخيم
  const [isEditCampModalOpen, setIsEditCampModalOpen] = useState(false);
  const [loadingEditCamp, setLoadingEditCamp] = useState(false);
  const [isSavingEditCamp, setIsSavingEditCamp] = useState(false);
  const [editCampError, setEditCampError] = useState("");
  const [changeCampPassword, setChangeCampPassword] = useState(false);
  const [editingCamp, setEditingCamp] = useState({
    id: "",
    name: "",
    managerName: "",
    managerPhone: "",
    address: "",
    adminUsername: "",
    adminPassword: ""
  });

  const [globalMetrics, setGlobalMetrics] = useState(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // تحميل الإحصائيات والإعلانات والمؤشرات باستمرار
      getAdminSystemStats().then(setStats);
      getGlobalSystemMetrics().then(setGlobalMetrics);
      getAnnouncement().then(setAnnouncementForm);

      if (activeTab === "camps") {
        const data = await getAllCamps();
        setCamps(data);
      } else if (activeTab === "requests") {
        const data = await getAllRenewalRequests();
        const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRequests(sorted);
      } else if (activeTab === "settings") {
        const methods = await getPaymentMethods();
        setPaymentMethods(methods);
        setSuperAdminUsernameInput(getSuperAdminUsername());
      }
    } catch (err) {
      setError("فشل في تحميل البيانات من الخادم.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSuperAdminUsername = async (e) => {
    e.preventDefault();
    if (!superAdminUsernameInput.trim()) {
      setError("يرجى إدخال اسم مستخدم صالح للمشرف العام.");
      return;
    }
    setSavingSuperAdminUser(true);
    setError("");
    setSuccess("");
    try {
      await updateSuperAdminUsername(superAdminUsernameInput);
      setSuccess(`تم تحديث اسم حساب المشرف العام بنجاح إلى: (${superAdminUsernameInput.trim()})`);
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء تحديث اسم المستخدم.");
    } finally {
      setSavingSuperAdminUser(false);
    }
  };

  const handleCreateCamp = async (e) => {
    e.preventDefault();
    if (isCreatingCamp) return;
    setError("");
    setSuccess("");

    if (!newCamp.id || !newCamp.name || !newCamp.adminUsername || !newCamp.adminPassword) {
      setError("يرجى تعبئة الحقول الإلزامية.");
      return;
    }
    if (!isPasswordAllowed(newCamp.adminPassword)) {
      setError(PASSWORD_REQUIREMENT_MESSAGE);
      return;
    }

    setIsCreatingCamp(true);
    try {
      const res = await createCamp({
        id: newCamp.id.trim().toLowerCase(),
        name: newCamp.name.trim(),
        managerName: newCamp.managerName.trim(),
        managerPhone: newCamp.managerPhone.trim(),
        adminUsername: newCamp.adminUsername.trim(),
        adminPassword: newCamp.adminPassword,
        trialPeriod: newCamp.trialPeriod
      });

      if (res.success) {
        const successMessage = `تم إنشاء المخيم بنجاح. يمكن الدخول باسم المستخدم: ${newCamp.adminUsername.trim()} أو باسم المخيم: ${newCamp.name.trim()}`;
        setIsAddCampOpen(false);
        setNewCamp({
          id: "",
          name: "",
          managerName: "",
          managerPhone: "",
          adminUsername: "",
          adminPassword: "",
          trialPeriod: "1-month"
        });
        await loadData();
        setSuccess(successMessage);
      } else {
        setError(res.error || "حدث خطأ أثناء إنشاء المخيم.");
      }
    } catch (err) {
      setError("حدث خطأ أثناء الاتصال.");
    } finally {
      setIsCreatingCamp(false);
    }
  };

  const formatDateToLocalInput = (dateObj) => {
    try {
      const d = new Date(dateObj);
      if (isNaN(d.getTime())) return "";
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (e) {
      return "";
    }
  };

  const handleOpenSubscriptionModal = (camp) => {
    setSelectedCampForSubscription(camp);
    const isExpired = !camp.subscriptionExpiry || new Date(camp.subscriptionExpiry) <= new Date();
    
    // إذا كان اشتراك المخيم منتهياً، اقترح تلقائياً تمديد شهر كامل ابتداءً من اليوم
    let initialDate;
    if (isExpired) {
      initialDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    } else {
      // إذا كان نشطاً، اضف 30 يوماً على تاريخ انتهاء اشتراكه الحالي
      const currentExp = new Date(camp.subscriptionExpiry);
      initialDate = new Date(currentExp.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
    setSubscriptionExpiryInput(formatDateToLocalInput(initialDate));
    setIsSubscriptionModalOpen(true);
  };

  const handleUpdateSubscriptionExpiry = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!selectedCampForSubscription || !subscriptionExpiryInput) return;

    try {
      const expiryDateISO = new Date(subscriptionExpiryInput).toISOString();
      const isActive = new Date(expiryDateISO) > new Date();

      const res = await updateCampProfile(selectedCampForSubscription.id, {
        subscriptionExpiry: expiryDateISO,
        isActive
      });

      if (res.success) {
        setSuccess(`تم تحديث صلاحية اشتراك مخيم "${selectedCampForSubscription.name}" بنجاح!`);
        setIsSubscriptionModalOpen(false);
        // تحديث حالة القائمة محلياً فوراً
        setCamps(prevCamps => prevCamps.map(c => c.id === selectedCampForSubscription.id ? {
          ...c,
          subscriptionExpiry: expiryDateISO,
          isActive
        } : c));
        loadData();
      } else {
        setError(res.error || "فشل تحديث صلاحية الاشتراك.");
      }
    } catch (err) {
      console.error("Subscription update error:", err);
      setError("حدث خطأ أثناء حفظ التعديلات.");
    }
  };

  const handleOpenEditCampModal = async (camp) => {
    setError("");
    setSuccess("");
    setEditCampError("");
    setChangeCampPassword(false);
    setIsSavingEditCamp(false);
    setLoadingEditCamp(true);
    setIsEditCampModalOpen(true);
    setEditingCamp({
      id: camp.id,
      name: camp.name || "",
      managerName: camp.managerName || "",
      managerPhone: camp.managerPhone || "",
      address: camp.address || "",
      adminUsername: "",
      adminPassword: ""
    });

    try {
      const userAcc = await getCampAdminUser(camp.id);
      setEditingCamp({
        id: camp.id,
        name: camp.name || "",
        managerName: camp.managerName || "",
        managerPhone: camp.managerPhone || "",
        address: camp.address || "",
        adminUsername: userAcc.username || "",
        adminPassword: userAcc.password || ""
      });
    } catch (e) {
      console.warn("Fetch camp admin user error:", e);
    } finally {
      setLoadingEditCamp(false);
    }
  };

  const handleSaveEditCamp = async (e) => {
    e.preventDefault();
    if (isSavingEditCamp) return;

    setError("");
    setSuccess("");
    setEditCampError("");

    const name = editingCamp.name.trim();
    const adminUsername = editingCamp.adminUsername.trim();
    const adminPassword = changeCampPassword ? editingCamp.adminPassword : "";

    if (!name || !adminUsername) {
      setEditCampError("يرجى إدخال اسم المخيم واسم المستخدم على الأقل.");
      return;
    }
    if (changeCampPassword && !adminPassword) {
      setEditCampError("أدخل كلمة المرور الجديدة أو ألغِ خيار تغيير كلمة المرور.");
      return;
    }
    if (adminPassword && !isPasswordAllowed(adminPassword)) {
      setEditCampError(NEW_PASSWORD_REQUIREMENT_MESSAGE);
      return;
    }

    setIsSavingEditCamp(true);
    try {
      const res = await updateCampFullDetails(editingCamp.id, {
        ...editingCamp,
        name,
        adminUsername,
        adminPassword,
      });
      if (res.success) {
        setIsEditCampModalOpen(false);
        await loadData();
        setSuccess(`تم تحديث بيانات المخيم "${name}" وحساب المدير بنجاح.`);
      } else {
        setEditCampError(res.error || "حدث خطأ أثناء حفظ التعديلات.");
      }
    } catch (err) {
      setEditCampError(err?.message || "حدث خطأ أثناء الاتصال.");
    } finally {
      setIsSavingEditCamp(false);
    }
  };

  const handleDeleteCamp = async (camp) => {
    setDeleteCandidate(camp);
    setDeleteConfirmText("");
    setError("");
    setSuccess("");
  };

  const handleConfirmDeleteCamp = async () => {
    if (!deleteCandidate || deleteConfirmText !== deleteCandidate.id || isDeletingCamp) return;
    setIsDeletingCamp(true);
    setError("");
    setSuccess("");
    try {
      const result = await deleteCampPermanently(deleteCandidate.id);
      if (result.success) {
        const warningText = result.warnings?.length ? ` ${result.warnings.join(" ")}` : "";
        setSuccess(`تم حذف المخيم "${deleteCandidate.name}" وجميع بياناته نهائيًا.${warningText}`);
        setDeleteCandidate(null);
        setDeleteConfirmText("");
        await loadData();
      } else {
        setError(result.error || "تعذر حذف المخيم.");
      }
    } finally {
      setIsDeletingCamp(false);
    }
  };

  const handleApproveRequest = async (requestId, campId) => {
    setError("");
    setSuccess("");
    try {
      const res = await approveRenewalRequest(requestId, campId, 1); // تمديد شهر واحد
      if (res.success) {
        setSuccess("تم تفعيل وتمديد اشتراك المخيم بنجاح!");
        loadData();
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError("فشل تنفيذ الطلب.");
    }
  };

  const handleDeclineRequest = async (requestId) => {
    setError("");
    setSuccess("");
    try {
      const res = await declineRenewalRequest(requestId);
      if (res.success) {
        setSuccess("تم رفض طلب التجديد.");
        loadData();
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError("فشل تنفيذ الطلب.");
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await updatePaymentMethods(paymentMethods);
      if (res.success) {
        setSuccess("تم تحديث طرق الدفع وحفظ الإعدادات بنجاح!");
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError("فشل في حفظ البيانات.");
    }
  };

  const getStatusBadge = (camp) => {
    const isExpired = new Date(camp.subscriptionExpiry) < new Date();
    if (!camp.isActive || isExpired) {
      return <span className="badge-members" style={{ backgroundColor: "#f8d7da", color: "#721c24" }}>منتهي</span>;
    }
    return <span className="badge-members" style={{ backgroundColor: "#d4edda", color: "#155724" }}>نشط</span>;
  };

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    setSavingAnnouncement(true);
    setError("");
    setSuccess("");
    try {
      const res = await updateAnnouncement(announcementForm);
      if (res.success) {
        setSuccess("تم حفظ وتحديث الإعلان العام بنجاح! يظهر الآن كـ شريط عاجل لجميع المخيمات.");
      } else {
        setError(res.error || "فشل تحديث الإعلان.");
      }
    } catch (err) {
      setError("حدث خطأ أثناء حفظ الإعلان.");
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "غير محدد";
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const [searchTerm, setSearchTerm] = useState("");

  const getSubscriptionUsageInfo = (createdAtStr, expiryDateStr) => {
    if (!expiryDateStr) return { text: "غير محدد", percent: 0, isExpired: false, badgeClass: "usage-badge warning-time", color: "#d97706" };
    
    const now = new Date();
    const expiry = new Date(expiryDateStr);
    const createdAt = createdAtStr ? new Date(createdAtStr) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const totalDurationMs = Math.max(1, expiry.getTime() - createdAt.getTime());
    const remainingMs = expiry.getTime() - now.getTime();
    
    if (remainingMs <= 0) {
      const expiredMs = Math.abs(remainingMs);
      const daysAgo = Math.floor(expiredMs / (1000 * 60 * 60 * 24));
      const hoursAgo = Math.floor((expiredMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      const timeText = daysAgo > 0 
        ? `منتهي (منذ ${daysAgo} يوم و ${hoursAgo} ساعة)`
        : `منتهي (منذ ${hoursAgo} ساعة)`;

      return {
        text: timeText,
        percent: 0,
        isExpired: true,
        badgeClass: "usage-badge expired-time",
        color: "#dc2626"
      };
    } else {
      const remainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
      const remainingHours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      const percent = Math.min(100, Math.max(5, Math.round((remainingMs / totalDurationMs) * 100)));
      
      let badgeClass = "usage-badge active-time";
      let color = "#059669";
      
      if (remainingDays <= 15) {
        badgeClass = "usage-badge warning-time";
        color = "#d97706";
      }

      const timeText = remainingDays > 0
        ? `متبقي ${remainingDays} يوم و ${remainingHours} ساعة`
        : `متبقي ${remainingHours} ساعة فقط`;

      return {
        text: timeText,
        percent,
        isExpired: false,
        badgeClass,
        color
      };
    }
  };

  const filteredCamps = camps.filter(c => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase().trim();
    return (
      (c.id && c.id.toLowerCase().includes(q)) ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.managerName && c.managerName.toLowerCase().includes(q)) ||
      (c.managerPhone && c.managerPhone.includes(q))
    );
  });

  return (
    <div className="super-admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <Image src="/nasaq-logo.png" alt="شعار نَسَق" width={74} height={74} priority />
          <div><strong>نَسَق</strong><span>إدارة المخيمات</span></div>
        </div>
        <nav className="admin-sidebar-nav" aria-label="أقسام لوحة المشرف العام">
          <button className={activeTab === "camps" ? "active" : ""} aria-pressed={activeTab === "camps"} onClick={() => setActiveTab("camps")}><FaCampground /><span>المخيمات</span></button>
          <button className={activeTab === "requests" ? "active" : ""} aria-pressed={activeTab === "requests"} onClick={() => setActiveTab("requests")}><FaCoins /><span>طلبات التجديد</span>{stats.pendingRequests > 0 && <b>{stats.pendingRequests}</b>}</button>
          <button className={activeTab === "announcement" ? "active" : ""} aria-pressed={activeTab === "announcement"} onClick={() => setActiveTab("announcement")}><FaBullhorn /><span>التعميمات</span></button>
          <button className={activeTab === "settings" ? "active" : ""} aria-pressed={activeTab === "settings"} onClick={() => setActiveTab("settings")}><FaWallet /><span>إعدادات الدفع</span></button>
        </nav>
        <div className="admin-sidebar-foot">
          <span><i></i> النظام متصل</span>
          <button onClick={onLogout}><FaSignOutAlt /> تسجيل الخروج</button>
        </div>
      </aside>
      {/* هيدر المشرف العام الفاخر */}
      <header className="super-admin-header-luxury">
        <div className="super-admin-brand">
          <div className="super-admin-brand-icon">
            <Image src="/nasaq-logo.png" alt="نَسَق" width={46} height={46} priority />
          </div>
          <div className="super-admin-brand-text">
            <h1>لوحة المشرف العام</h1>
            <span className="sub-title">
              <span>ملخص العمليات وإدارة حسابات المخيمات</span>
            </span>
          </div>
        </div>

        <div className="super-admin-actions">
          <div className="system-status-pill">
            <span className="system-status-dot" aria-hidden="true"></span>
            <span>متصل بـ Supabase (المنظومة نشطة)</span>
          </div>
          <button onClick={() => { setError(""); setSuccess(""); setIsAddCampOpen(true); }} className="admin-header-create"><FaPlus /> مخيم جديد</button>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="super-admin-content" dir="rtl">
        {/* التنبيهات السريعة */}
        {error && <div className="login-error-badge mb-4">{error}</div>}
        {success && (
          <div className="renewal-success-box mb-4">
            <FaCheckCircle className="inline-icon" /> {success}
          </div>
        )}

        <section className="admin-command-hero">
          <div className="admin-command-copy">
            <span className="admin-eyebrow"><FaUserShield /> لوحة القيادة التنفيذية</span>
            <h2>صورة تشغيلية واضحة لكل المخيمات من مكان واحد</h2>
            <p>تابع حالة الاشتراكات والبيانات وطلبات التجديد، ونفّذ الإجراءات الإدارية الحساسة بوضوح وأمان.</p>
          </div>
          <div className="admin-command-actions">
            <button onClick={() => { setError(""); setSuccess(""); setIsAddCampOpen(true); }} className="admin-primary-action">
              <FaPlus /> إنشاء مخيم جديد
            </button>
            <button onClick={() => setActiveTab("requests")} className="admin-secondary-action">
              <FaCoins /> مراجعة طلبات التجديد
              {stats.pendingRequests > 0 && <strong>{stats.pendingRequests}</strong>}
            </button>
          </div>
        </section>

        {/* بطاقات الإحصائيات الفاخرة */}
        <div className="super-stats-grid-luxury">
          <div className="stat-card-luxury">
            <div className="stat-card-top">
              <div className="stat-card-info">
                <span className="stat-label">المخيمات المسجلة بالمنظومة</span>
                <div className="stat-value"><AnimatedNumber value={stats.totalCamps} /></div>
              </div>
              <div className="stat-card-icon-wrap">
                <FaCampground />
              </div>
            </div>
            <div className="stat-card-bottom">
              <span className="status-positive">نشط: <AnimatedNumber value={stats.activeCamps} /></span>
              <span className="status-danger">منتهي: <AnimatedNumber value={stats.expiredCamps} /></span>
            </div>
          </div>

          <div className="stat-card-luxury">
            <div className="stat-card-top">
              <div className="stat-card-info">
                <span className="stat-label">إجمالي العائلات المسجلة</span>
                <div className="stat-value"><AnimatedNumber value={stats.totalFamilies} /></div>
              </div>
              <div className="stat-card-icon-wrap">
                <FaUsers />
              </div>
            </div>
            <div className="stat-card-bottom">
              <span>مسجلة بكافة المخيمات</span>
            </div>
          </div>

          <div className="stat-card-luxury">
            <div className="stat-card-top">
              <div className="stat-card-info">
                <span className="stat-label">إجمالي الأفراد بالمخيمات</span>
                <div className="stat-value"><AnimatedNumber value={stats.totalMembers} /></div>
              </div>
              <div className="stat-card-icon-wrap">
                <FaUserFriends />
              </div>
            </div>
            <div className="stat-card-bottom">
              <span>أفراد مستفيدين محصين</span>
            </div>
          </div>

          <div className="stat-card-luxury">
            <div className="stat-card-top">
              <div className="stat-card-info">
                <span className="stat-label">إجمالي كشوفات الترشيحات</span>
                <div className="stat-value"><AnimatedNumber value={stats.totalNominations} /></div>
              </div>
              <div className="stat-card-icon-wrap">
                <FaClipboardList />
              </div>
            </div>
            <div className="stat-card-bottom">
              <span>حالات طارئة ومعتمدة</span>
            </div>
          </div>

          <div className="stat-card-luxury">
            <div className="stat-card-top">
              <div className="stat-card-info">
                <span className="stat-label">حسابات المدراء والإشراف</span>
                <div className="stat-value">{stats.totalUsers}</div>
              </div>
              <div className="stat-card-icon-wrap">
                <FaUserCheck />
              </div>
            </div>
            <div className="stat-card-bottom">
              <span className="status-positive">مدراء نشطون: {stats.activeUsersCount}</span>
            </div>
          </div>

          <div className={`stat-card-luxury ${stats.pendingRequests > 0 ? "stat-card-luxury--alert" : ""}`}>
            <div className="stat-card-top">
              <div className="stat-card-info">
                <span className="stat-label">طلبات التجديد المعلقة</span>
                <div className="stat-value">{stats.pendingRequests}</div>
              </div>
              <div className="stat-card-icon-wrap">
                <FaCoins />
              </div>
            </div>
            <div className="stat-card-bottom">
              <span className={stats.pendingRequests > 0 ? "status-danger" : ""}>
                {stats.pendingRequests > 0 ? "تحتاج مراجعة فورية" : "لا توجد طلبات جديدة"}
              </span>
            </div>
          </div>
        </div>

        {/* قسم المخططات الدائرية التفاعلية المتحركة لصفحة المشرف العام */}
        {globalMetrics && (
          <section className="global-metrics-panel">
            <h2 className="global-metrics-title">
              <FaChartPie /> مؤشرات التوزيع والإغاثة لجميع المخيمات
            </h2>

            <div className="global-metrics-grid">
              {/* مخطط 1: الحالات الخاصة */}
              <AnimatedDonut 
                percent={globalMetrics.percentSpecial}
                label="الحالات الخاصة والحرجة"
                subText={<><AnimatedNumber value={globalMetrics.familiesWithSpecialCases} /> عائلة من أصل <AnimatedNumber value={globalMetrics.totalNominationsCount} /></>}
              />

              {/* مخطط 2: نسبة الأطفال والطلبة */}
              <AnimatedDonut 
                percent={globalMetrics.percentChildren}
                label="نسبة الأطفال والطلاب"
                subText={<><AnimatedNumber value={globalMetrics.totalChildrenCount} /> طفل من أصل <AnimatedNumber value={globalMetrics.grandAgeTotal} /> فرد</>}
              />

              {/* مخطط 3: تغطية الترشيحات */}
              <AnimatedDonut 
                percent={globalMetrics.percentCoverage}
                label="نسبة شمولية الترشيح"
                subText={<><AnimatedNumber value={globalMetrics.totalNominationsCount} /> مرشحة من أصل <AnimatedNumber value={globalMetrics.totalFamiliesCount} /> عائلة</>}
              />

              {/* مخطط 4: نسبة الشباب والبالغين */}
              <AnimatedDonut 
                percent={globalMetrics.percentAdults}
                label="نسبة الشباب والبالغين"
                subText={<><AnimatedNumber value={globalMetrics.totalAdultsCount} /> فرد بالغ من أصل <AnimatedNumber value={globalMetrics.grandAgeTotal} /></>}
              />
            </div>
          </section>
        )}

        {/* أشرطة التنقل الفاخرة */}
        <div className="super-tabs-pill-bar">
          <button 
            className={`super-tab-pill-btn ${activeTab === "camps" ? "active" : ""}`}
            onClick={() => setActiveTab("camps")}
          >
            <FaCampground /> سجل المخيمات وفترات الاستخدام
          </button>
          <button 
            className={`super-tab-pill-btn ${activeTab === "requests" ? "active" : ""}`}
            onClick={() => setActiveTab("requests")}
          >
            <FaCoins /> معاملات وطلبات التجديد {stats.pendingRequests > 0 && <span className="tab-notification-count">{stats.pendingRequests}</span>}
          </button>
          <button 
            className={`super-tab-pill-btn ${activeTab === "announcement" ? "active" : ""}`}
            onClick={() => setActiveTab("announcement")}
          >
            <FaBullhorn /> التعميمات والشريط الإخباري العاجل
          </button>
          <button 
            className={`super-tab-pill-btn ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <FaWallet /> قنوات التحصيل وحسابات السداد
          </button>
        </div>

        {/* تبويب 1: إدارة المخيمات ومدة الاستخدام */}
        {activeTab === "camps" && (
          <div className="super-content-card-luxury">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>المخيمات المسجلة بالنظام ومواعيد الاشتراك ({filteredCamps.length})</h2>
                <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "0.85rem" }}>
                  تابع مدة الاستخدام المتبقية، وتواريخ الانتهاء وإجراءات التجديد والتمديد لكل مخيم.
                </p>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <input 
                  type="text"
                  placeholder="بحث باسم المخيم، المدير، أو المعرّف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "0.88rem",
                    minWidth: "260px"
                  }}
                />

                <button onClick={() => { setError(""); setSuccess(""); setIsAddCampOpen(true); }} className="btn btn-primary" style={{ padding: "10px 18px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaPlus /> إنشاء مخيم جديد
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-4"><FaSpinner className="spinner" /> جاري تحميل بيانات المخيمات...</div>
            ) : filteredCamps.length === 0 ? (
              <div className="empty-latest">لا توجد مخيمات مطابقة للبحث أو مضافة بالنظام حالياً.</div>
            ) : (
              <div className="table-responsive">
                <table className="family-table">
                  <thead>
                    <tr>
                      <th>معرّف المخيم</th>
                      <th>اسم المخيم والمنطقة</th>
                      <th>المدير المسؤول</th>
                      <th>رقم الجوال</th>
                      <th>تاريخ انتهاء الاشتراك</th>
                      <th>وقت الاستخدام / المتبقي</th>
                      <th>حالة الاشتراك</th>
                      <th>الإجراءات والعمليات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCamps.map((camp) => {
                      const usageInfo = getSubscriptionUsageInfo(camp.createdAt, camp.subscriptionExpiry);
                      return (
                        <tr key={camp.id}>
                          <td>
                            <code style={{ background: "#f1f5f9", padding: "4px 8px", borderRadius: "6px", color: "#0f172a", fontWeight: "700" }}>{camp.id}</code>
                          </td>
                          <td>
                            <strong style={{ fontSize: "0.98rem", color: "#0f172a" }}>{camp.name}</strong>
                            {camp.address && <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{camp.address}</div>}
                          </td>
                          <td>{camp.managerName || "-"}</td>
                          <td>{camp.managerPhone || "-"}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#334155", fontWeight: "600", fontSize: "0.88rem" }}>
                              <FaCalendarAlt style={{ color: "#d97706" }} />
                              {formatDate(camp.subscriptionExpiry)}
                            </div>
                          </td>
                          <td>
                            <div className="usage-time-cell">
                              <div className={usageInfo.badgeClass}>
                                <FaClock />
                                <span>{usageInfo.text}</span>
                              </div>
                              <div className="usage-mini-bar">
                                <div className="usage-mini-progress" style={{ width: `${usageInfo.percent}%`, backgroundColor: usageInfo.color }}></div>
                              </div>
                            </div>
                          </td>
                          <td>{getStatusBadge(camp)}</td>
                          <td>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                              <button 
                                onClick={() => handleOpenEditCampModal(camp)} 
                                className="btn btn-primary"
                                style={{ padding: "6px 12px", fontSize: "0.82rem", borderRadius: "8px", display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#2563eb", borderColor: "#2563eb", color: "white", fontWeight: "700", cursor: "pointer" }}
                              >
                                <FaEdit /> تعديل البيانات
                              </button>
                              <button 
                                onClick={() => handleOpenSubscriptionModal(camp)} 
                                className="btn btn-secondary"
                                style={{ padding: "6px 12px", fontSize: "0.82rem", borderRadius: "8px", display: "flex", alignItems: "center", gap: "6px", borderColor: "#d97706", color: "#d97706", fontWeight: "700", cursor: "pointer" }}
                              >
                                <FaClock /> تمديد الاشتراك
                              </button>
                              <button
                                onClick={() => handleDeleteCamp(camp)}
                                className="btn"
                                style={{ padding: "6px 12px", fontSize: "0.82rem", borderRadius: "8px", display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#dc2626", border: "1px solid #dc2626", color: "white", fontWeight: "700", cursor: "pointer" }}
                                aria-label={`حذف المخيم ${camp.name}`}
                              >
                                <FaTrash /> حذف نهائي
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* تبويب 2: طلبات التجديد والدفع */}
        {activeTab === "requests" && (
          <div className="super-card">
            <h2>إيصالات وطلبات التجديد المستلمة ({requests.length})</h2>
            
            {loading ? (
              <div className="text-center py-4"><FaSpinner className="spinner" /> جاري التحميل...</div>
            ) : requests.length === 0 ? (
              <div className="empty-latest">لا توجد أي طلبات تجديد حالياً.</div>
            ) : (
              <div className="table-responsive">
                <table className="family-table">
                  <thead>
                    <tr>
                      <th>اسم المخيم</th>
                      <th>طريقة الدفع</th>
                      <th>رقم المعاملة / العملية (TxID)</th>
                      <th>المبلغ</th>
                      <th>تاريخ الإرسال</th>
                      <th>حالة الطلب</th>
                      <th>الإجراءات والقرار</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr key={req.id}>
                        <td><strong>{req.campName}</strong></td>
                        <td>{req.method}</td>
                        <td><code>{req.txId}</code></td>
                        <td><strong>{req.amount}</strong></td>
                        <td className="date-td">{formatDate(req.createdAt)}</td>
                        <td>
                          {req.status === "pending" && <span className="badge-members" style={{ backgroundColor: "#ffeeba", color: "#856404" }}>بانتظار التحقق</span>}
                          {req.status === "approved" && <span className="badge-members" style={{ backgroundColor: "#d4edda", color: "#155724" }}>تم القبول والتفعيل</span>}
                          {req.status === "declined" && <span className="badge-members" style={{ backgroundColor: "#f8d7da", color: "#721c24" }}>تم الرفض</span>}
                        </td>
                        <td>
                          {req.status === "pending" ? (
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button 
                                onClick={() => handleApproveRequest(req.id, req.campId)} 
                                className="btn btn-primary btn-sm"
                                style={{ padding: "4px 8px" }}
                              >
                                <FaCheckCircle /> قبول وتمديد
                              </button>
                              <button 
                                onClick={() => handleDeclineRequest(req.id)} 
                                className="btn btn-pdf btn-sm"
                                style={{ padding: "4px 8px" }}
                              >
                                <FaTimesCircle /> رفض المعاملة
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted" style={{ fontSize: "0.8rem" }}>منتهي المعالجة</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* تبويب 3: إدارة الإعلانات وشريط الأخبار العاجلة */}
        {activeTab === "announcement" && (
          <div className="super-card">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem" }}>
              <div style={{ background: "rgba(220, 53, 69, 0.1)", padding: "12px", borderRadius: "50%", color: "#dc3545" }}>
                <FaBullhorn style={{ fontSize: "1.8rem" }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.3rem" }}>إدارة الإعلانات وشريط الأخبار العاجلة</h2>
                <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "0.88rem" }}>
                  نشر إعلان شريط إخباري عاجل يظهر في أعلى جميع صفحات المخيمات فوراً
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveAnnouncement} style={{ display: "flex", flexDirection: "column", gap: "1.4rem", maxWidth: "750px", background: "#f8fafc", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <div className="form-group">
                <label style={{ fontWeight: "700", display: "block", marginBottom: "8px", color: "#334155" }}>حالة نشر الإعلان:</label>
                <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "600" }}>
                    <input 
                      type="radio" 
                      name="isActive" 
                      checked={announcementForm.isActive === true} 
                      onChange={() => setAnnouncementForm(prev => ({ ...prev, isActive: true }))} 
                    />
                    <span style={{ color: "#16a34a", display: "inline-flex", alignItems: "center", gap: "8px" }}><FaCheckCircle aria-hidden="true" /> تفعيل ونشر الإعلان فورًا لكل المخيمات</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "600" }}>
                    <input 
                      type="radio" 
                      name="isActive" 
                      checked={announcementForm.isActive === false} 
                      onChange={() => setAnnouncementForm(prev => ({ ...prev, isActive: false }))} 
                    />
                    <span style={{ color: "#dc3545", display: "inline-flex", alignItems: "center", gap: "8px" }}><FaTimesCircle aria-hidden="true" /> إيقاف الإعلان وإخفاؤه حاليًا</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: "700", display: "block", marginBottom: "8px", color: "#334155" }}>نوع الإعلان والنمط البصري:</label>
                <select 
                  value={announcementForm.type} 
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, type: e.target.value }))}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontWeight: "600", fontSize: "0.95rem", backgroundColor: "white" }}
                >
                  <option value="urgent">خبر عاجل — أولوية مرتفعة</option>
                  <option value="warning">تنبيه مهم — يحتاج متابعة</option>
                  <option value="info">إعلام رسمي — للمعلومات</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: "700", display: "block", marginBottom: "8px", color: "#334155" }}>نص الإعلان (الخبر العاجل المتحرك):</label>
                <textarea 
                  rows="3" 
                  value={announcementForm.text} 
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, text: e.target.value }))} 
                  placeholder="اكتب نص الإعلان الذي سيظهر متحركاً في أعلى جميع الصفحات..."
                  required
                  style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontFamily: "inherit", fontSize: "0.95rem", lineHeight: "1.6", boxSizing: "border-box" }}
                />
              </div>

              <button type="submit" disabled={savingAnnouncement} className="btn btn-primary" style={{ alignSelf: "flex-start", padding: "10px 24px", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "8px" }}>
                {savingAnnouncement ? <FaSpinner className="spinner" /> : <FaBullhorn />}
                <span>حفظ وتعميم الإعلان الان</span>
              </button>
            </form>
          </div>
        )}

        {/* تبويب 4: طرق الدفع وإعدادات حساب المشرف العام */}
        {activeTab === "settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* 1. بطاقة تغيير اسم المستخدم للمشرف العام */}
            <div className="super-card" style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "20px", padding: "1.75rem", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "1.5rem", borderBottom: "2px solid #f1f5f9", paddingBottom: "1rem" }}>
                <div style={{ background: "rgba(245, 158, 11, 0.12)", width: "48px", height: "48px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706" }}>
                  <FaUserShield style={{ fontSize: "1.6rem" }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "900", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}><FaCrown aria-hidden="true" /> تغيير اسم حساب المشرف العام</h2>
                  <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "0.88rem", fontWeight: "500" }}>
                    تخصيص وتغيير اسم المستخدم الخاص بالمشرف العام للدخول للنظام والتحكم المباشر.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveSuperAdminUsername} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                  <label style={{ fontWeight: "800", color: "#334155", fontSize: "0.92rem" }}>اسم المستخدم الجديد للمشرف العام:</label>
                  <input 
                    type="text" 
                    value={superAdminUsernameInput} 
                    onChange={(e) => setSuperAdminUsernameInput(e.target.value)} 
                    placeholder="أدخل اسم المستخدم الجديد (مثال: Ibrahim)" 
                    required
                    style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", borderRadius: "12px", border: "1.5px solid #cbd5e1", fontSize: "0.95rem", fontWeight: "700", outline: "none", backgroundColor: "#f8fafc", color: "#0f172a" }}
                  />
                </div>
                <button type="submit" disabled={savingSuperAdminUser} className="btn btn-primary" style={{ width: "fit-content", background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", border: "none", padding: "12px 28px", borderRadius: "12px", fontSize: "0.95rem", fontWeight: "800", boxShadow: "0 4px 14px rgba(245, 158, 11, 0.3)" }}>
                  {savingSuperAdminUser ? <FaSpinner className="spinner" /> : <FaCheckCircle />}
                  <span>حفظ اسم المستخدم الجديد للمشرف العام</span>
                </button>
              </form>
            </div>

            {/* 2. بطاقة قنوات التحصيل والسداد */}
            <div className="super-card" style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "20px", padding: "1.75rem", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "1.5rem", borderBottom: "2px solid #f1f5f9", paddingBottom: "1rem" }}>
                <div style={{ background: "rgba(16, 185, 129, 0.12)", width: "48px", height: "48px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669" }}>
                  <FaWallet style={{ fontSize: "1.6rem" }} />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.25rem", color: "#0f172a", margin: 0, fontWeight: "900" }}>
                    إعدادات قنوات التحصيل وحسابات السداد الرسمية
                  </h2>
                  <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "0.88rem", fontWeight: "500" }}>
                    هذه الحسابات تظهر لجميع مدراء المخيمات في واجهة تجديد الاشتراك وإرسال إيصالات الدفع.
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpdateSettings} style={{ display: "flex", flexDirection: "column", gap: "1.4rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                  <label style={{ fontWeight: "800", color: "#334155", fontSize: "0.92rem", display: "flex", alignItems: "center", gap: "8px" }}><FaUniversity aria-hidden="true" /> حساب بنك فلسطين الرسمي:</label>
                  <input 
                    type="text" 
                    value={paymentMethods.bankOfPalestine || ""} 
                    onChange={(e) => setPaymentMethods({ ...paymentMethods, bankOfPalestine: e.target.value })}
                    placeholder="مثال: حساب بنك فلسطين: 1234567-001-9010" 
                    style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", borderRadius: "12px", border: "1.5px solid #cbd5e1", fontSize: "0.95rem", fontWeight: "600", outline: "none", backgroundColor: "#f8fafc", color: "#0f172a" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                  <label style={{ fontWeight: "800", color: "#334155", fontSize: "0.92rem", display: "flex", alignItems: "center", gap: "8px" }}><FaMobileAlt aria-hidden="true" /> تفاصيل حساب جوال باي:</label>
                  <input 
                    type="text" 
                    value={paymentMethods.jawwalPay || ""} 
                    onChange={(e) => setPaymentMethods({ ...paymentMethods, jawwalPay: e.target.value })}
                    placeholder="مثال: رقم محفظة جوال باي: 0599000000" 
                    style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", borderRadius: "12px", border: "1.5px solid #cbd5e1", fontSize: "0.95rem", fontWeight: "600", outline: "none", backgroundColor: "#f8fafc", color: "#0f172a" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                  <label style={{ fontWeight: "800", color: "#334155", fontSize: "0.92rem", display: "flex", alignItems: "center", gap: "8px" }}><FaCreditCard aria-hidden="true" /> تفاصيل حساب بال باي:</label>
                  <input 
                    type="text" 
                    value={paymentMethods.palPay || ""} 
                    onChange={(e) => setPaymentMethods({ ...paymentMethods, palPay: e.target.value })}
                    placeholder="مثال: رقم حساب بال باي: 998877" 
                    style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", borderRadius: "12px", border: "1.5px solid #cbd5e1", fontSize: "0.95rem", fontWeight: "600", outline: "none", backgroundColor: "#f8fafc", color: "#0f172a" }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: "fit-content", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", border: "none", padding: "12px 28px", borderRadius: "12px", fontSize: "0.95rem", fontWeight: "800", boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)" }}>
                  <FaCheckCircle />
                  <span>حفظ بيانات قنوات الدفع والتحصيل</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* نافذة إضافة مخيم منبثقة */}
      {isAddCampOpen && (
        <div className="modal-overlay" style={{ background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(8px)" }}>
          <div className="modal-content" style={{ maxWidth: "620px", width: "92%", borderRadius: "20px", padding: "1.75rem", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", borderBottom: "1px solid #e2e8f0", marginBottom: "1.25rem" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "10px", color: "#059669", margin: 0, fontSize: "1.25rem", fontWeight: "800" }}>
                <FaCampground style={{ color: "#059669" }} />
                <span>إنشاء مخيم جديد وحساب للمدير</span>
              </h2>
              <button type="button" onClick={() => setIsAddCampOpen(false)} className="btn-close" title="إغلاق" style={{ background: "#f1f5f9", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleCreateCamp}>
              {error && (
                <div
                  role="alert"
                  style={{
                    marginBottom: "14px",
                    padding: "11px 14px",
                    borderRadius: "10px",
                    border: "1px solid #fecaca",
                    background: "#fef2f2",
                    color: "#b91c1c",
                    fontWeight: "700",
                    fontSize: "0.88rem",
                  }}
                >
                  {error}
                </div>
              )}
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontWeight: "700", fontSize: "0.85rem", color: "#334155", marginBottom: "6px" }}>معرّف المخيم (Camp ID) *</label>
                    <input 
                      type="text" 
                      placeholder="مثال: zad-al-khair" 
                      value={newCamp.id}
                      onChange={(e) => setNewCamp({ ...newCamp, id: e.target.value })}
                      required 
                      style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #cbd5e1", borderRadius: "10px", fontSize: "0.92rem", boxSizing: "border-box", outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontWeight: "700", fontSize: "0.85rem", color: "#334155", marginBottom: "6px" }}>اسم المخيم بالكامل *</label>
                    <input 
                      type="text" 
                      placeholder="مثال: مخيم زاد الخير العام" 
                      value={newCamp.name}
                      onChange={(e) => setNewCamp({ ...newCamp, name: e.target.value })}
                      required 
                      style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #cbd5e1", borderRadius: "10px", fontSize: "0.92rem", boxSizing: "border-box", outline: "none" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontWeight: "700", fontSize: "0.85rem", color: "#334155", marginBottom: "6px" }}>اسم المسؤول (المدير)</label>
                    <input 
                      type="text" 
                      placeholder="أبو سليم أحمد" 
                      value={newCamp.managerName}
                      onChange={(e) => setNewCamp({ ...newCamp, managerName: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #cbd5e1", borderRadius: "10px", fontSize: "0.92rem", boxSizing: "border-box", outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontWeight: "700", fontSize: "0.85rem", color: "#334155", marginBottom: "6px" }}>رقم جوال المدير</label>
                    <input 
                      type="text" 
                      placeholder="0599000000" 
                      value={newCamp.managerPhone}
                      onChange={(e) => setNewCamp({ ...newCamp, managerPhone: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #cbd5e1", borderRadius: "10px", fontSize: "0.92rem", boxSizing: "border-box", outline: "none" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: "700", fontSize: "0.85rem", color: "#334155", marginBottom: "6px" }}>فترة صلاحية التجربة / الاشتراك البدئية *</label>
                  <select 
                    value={newCamp.trialPeriod} 
                    onChange={(e) => setNewCamp({ ...newCamp, trialPeriod: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #cbd5e1", borderRadius: "10px", fontSize: "0.92rem", backgroundColor: "white", fontWeight: "600", color: "#1e293b", boxSizing: "border-box", outline: "none" }}
                  >
                    <option value="1-hour">ساعة واحدة للتجربة</option>
                    <option value="1-day">يوم واحد للتجربة</option>
                    <option value="1-week">أسبوع واحد للتجربة</option>
                    <option value="1-month">شهر واحد (الافتراضي)</option>
                    <option value="6-months">6 أشهر</option>
                    <option value="1-year">سنة كاملة</option>
                    <option value="unlimited">مفتوح / غير محدود</option>
                  </select>
                </div>

                <div style={{ background: "rgba(5, 150, 105, 0.05)", border: "1px solid rgba(5, 150, 105, 0.2)", borderRadius: "12px", padding: "1rem", marginTop: "4px" }}>
                  <h4 style={{ fontSize: "0.9rem", color: "#059669", margin: "0 0 10px 0", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}><FaKey aria-hidden="true" /> بيانات تسجيل دخول مدير المخيم للوحة</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <label style={{ display: "block", fontWeight: "700", fontSize: "0.82rem", color: "#334155", marginBottom: "6px" }}>اسم المستخدم للوحة *</label>
                      <input 
                        type="text" 
                        placeholder="zad-admin" 
                        value={newCamp.adminUsername}
                        onChange={(e) => setNewCamp({ ...newCamp, adminUsername: e.target.value })}
                        required 
                        style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #cbd5e1", borderRadius: "8px", fontSize: "0.9rem", boxSizing: "border-box", backgroundColor: "white" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontWeight: "700", fontSize: "0.82rem", color: "#334155", marginBottom: "6px" }}>كلمة المرور *</label>
                      <input 
                        type="password" 
                        placeholder="6 خانات على الأقل"
                        value={newCamp.adminPassword}
                        onChange={(e) => setNewCamp({ ...newCamp, adminPassword: e.target.value })}
                        minLength={MIN_PASSWORD_LENGTH}
                        autoComplete="new-password"
                        required 
                        style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #cbd5e1", borderRadius: "8px", fontSize: "0.9rem", boxSizing: "border-box", backgroundColor: "white" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0" }}>
                <button type="button" onClick={() => setIsAddCampOpen(false)} style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "9px 20px", borderRadius: "10px", fontWeight: "700", cursor: "pointer", fontSize: "0.9rem" }}>إلغاء</button>
                <button
                  type="submit"
                  disabled={isCreatingCamp}
                  aria-busy={isCreatingCamp}
                  style={{
                    background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    color: "white",
                    border: "none",
                    padding: "9px 24px",
                    borderRadius: "10px",
                    fontWeight: "800",
                    cursor: isCreatingCamp ? "wait" : "pointer",
                    fontSize: "0.9rem",
                    boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)",
                    opacity: isCreatingCamp ? 0.75 : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {isCreatingCamp ? (
                    <><FaSpinner className="spinner" /> جارٍ إنشاء المخيم والحساب...</>
                  ) : (
                    <>تأكيد وإنشاء المخيم</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة تعديل تاريخ انتهاء الاشتراك منبثقة */}
      {isSubscriptionModalOpen && selectedCampForSubscription && (
        <div className="modal-overlay">
          <div className="modal-content gold-modal-header" style={{ maxWidth: "550px", width: "95%" }}>
            <div className="modal-header">
              <h2 className="gold-modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FaClock />
                <span>تعديل فترة اشتراك: {selectedCampForSubscription.name}</span>
              </h2>
              <button type="button" onClick={() => setIsSubscriptionModalOpen(false)} className="btn-close" title="إغلاق">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleUpdateSubscriptionExpiry}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                
                {/* التمديد السريع */}
                <div>
                  <label style={{ fontWeight: "700", display: "block", marginBottom: "8px", fontSize: "0.9rem", color: "#334155" }}>⚡ تمديد سريع إلى:</label>
                  <div className="quick-extend-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))" }}>
                    <button
                      type="button"
                      onClick={() => {
                        const base = subscriptionExpiryInput ? new Date(subscriptionExpiryInput) : new Date();
                        const target = new Date(Math.max(base.getTime(), Date.now()));
                        target.setHours(target.getHours() + 1);
                        const tzOffset = target.getTimezoneOffset() * 60000;
                        setSubscriptionExpiryInput((new Date(target - tzOffset)).toISOString().slice(0, 16));
                      }}
                      className="quick-extend-btn"
                    >
                      + ساعة واحدة
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        now.setDate(now.getDate() + 1);
                        setSubscriptionExpiryInput(formatDateToLocalInput(now));
                      }}
                      className="quick-extend-btn"
                    >
                      + يوم واحد
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        now.setDate(now.getDate() + 7);
                        setSubscriptionExpiryInput(formatDateToLocalInput(now));
                      }}
                      className="quick-extend-btn"
                    >
                      + أسبوع واحد
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        now.setMonth(now.getMonth() + 1);
                        setSubscriptionExpiryInput(formatDateToLocalInput(now));
                      }}
                      className="quick-extend-btn"
                    >
                      + شهر واحد
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        now.setMonth(now.getMonth() + 6);
                        setSubscriptionExpiryInput(formatDateToLocalInput(now));
                      }}
                      className="quick-extend-btn"
                    >
                      + 6 أشهر
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        now.setFullYear(now.getFullYear() + 1);
                        setSubscriptionExpiryInput(formatDateToLocalInput(now));
                      }}
                      className="quick-extend-btn"
                    >
                      + سنة واحدة
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSubscriptionExpiryInput("2099-12-31T23:59");
                      }}
                      className="quick-extend-btn"
                      style={{ backgroundColor: "rgba(15, 81, 50, 0.1)", color: "#0f5132", fontWeight: "bold" }}
                    >
                      <FaInfinity aria-hidden="true" /> دائم (مفتوح)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const past = new Date(Date.now() - 5 * 60 * 1000);
                        setSubscriptionExpiryInput(formatDateToLocalInput(past));
                      }}
                      className="quick-extend-btn danger-btn"
                    >
                      إنهاء الآن ⛔
                    </button>
                  </div>
                </div>

                {/* حقل وقت الانتهاء الدقيق يدوي بالروزنامة والوقت */}
                <div className="form-group" style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <label htmlFor="expiryInput" style={{ fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", color: "#334155" }}>
                    <FaCalendarAlt style={{ color: "#b89647" }} />
                    <span>تحديد تاريخ ووقت انتهاء الاشتراك الدقيق *</span>
                  </label>
                  <input
                    type="datetime-local"
                    id="expiryInput"
                    value={subscriptionExpiryInput}
                    onChange={(e) => setSubscriptionExpiryInput(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1.5px solid #b89647",
                      borderRadius: "6px",
                      marginTop: "6px",
                      fontFamily: "inherit",
                      fontSize: "1rem",
                      fontWeight: "600",
                      outline: "none",
                      boxSizing: "border-box",
                      backgroundColor: "white"
                    }}
                  />
                  {subscriptionExpiryInput && (
                    <div style={{ fontSize: "0.82rem", color: "#0f5132", marginTop: "6px", fontWeight: "600" }}>
                      <FaCalendarAlt aria-hidden="true" /> الموعد المحدد: {new Date(subscriptionExpiryInput).toLocaleString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsSubscriptionModalOpen(false)} className="btn-cancel">إلغاء</button>
                <button type="submit" className="btn-submit" style={{ backgroundColor: "#b89647", borderColor: "#b89647" }}>حفظ وتعديل</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة تعديل كافة بيانات المخيم وحساب المدير منبثقة */}
      {isEditCampModalOpen && (
        <div className="modal-overlay" style={{ background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(8px)" }}>
          <div className="modal-content" style={{ maxWidth: "620px", width: "92%", borderRadius: "20px", padding: "1.75rem", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", borderBottom: "1px solid #e2e8f0", marginBottom: "1.25rem" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "10px", color: "#2563eb", margin: 0, fontSize: "1.25rem", fontWeight: "800" }}>
                <FaEdit style={{ color: "#2563eb" }} />
                <span>تعديل كافة بيانات المخيم وحساب المدير ({editingCamp.id})</span>
              </h2>
              <button type="button" onClick={() => setIsEditCampModalOpen(false)} className="btn-close" title="إغلاق" style={{ background: "#f1f5f9", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                <FaTimes />
              </button>
            </div>
            
            {loadingEditCamp ? (
              <div className="text-center py-4" style={{ padding: "2rem", color: "#64748b" }}>
                <FaSpinner className="spinner" /> جاري تحميل بيانات الحساب والمخيم...
              </div>
            ) : (
              <form onSubmit={handleSaveEditCamp} noValidate autoComplete="off">
                {editCampError && (
                  <div
                    role="alert"
                    style={{ marginBottom: "14px", padding: "11px 14px", borderRadius: "10px", background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c", fontWeight: "700", fontSize: "0.88rem" }}
                  >
                    {editCampError}
                  </div>
                )}
                <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <label style={{ display: "block", fontWeight: "700", fontSize: "0.85rem", color: "#334155", marginBottom: "6px" }}>معرّف المخيم (Camp ID)</label>
                      <input 
                        type="text" 
                        value={editingCamp.id}
                        disabled
                        style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: "10px", fontSize: "0.92rem", boxSizing: "border-box", backgroundColor: "#f8fafc", color: "#64748b", fontWeight: "700" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontWeight: "700", fontSize: "0.85rem", color: "#334155", marginBottom: "6px" }}>اسم المخيم بالكامل *</label>
                      <input 
                        type="text" 
                        placeholder="اسم المخيم" 
                        value={editingCamp.name}
                        onChange={(e) => setEditingCamp({ ...editingCamp, name: e.target.value })}
                        required 
                        style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #cbd5e1", borderRadius: "10px", fontSize: "0.92rem", boxSizing: "border-box", outline: "none" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <label style={{ display: "block", fontWeight: "700", fontSize: "0.85rem", color: "#334155", marginBottom: "6px" }}>اسم المسؤول (المدير)</label>
                      <input 
                        type="text" 
                        placeholder="اسم المدير المسؤول" 
                        value={editingCamp.managerName}
                        onChange={(e) => setEditingCamp({ ...editingCamp, managerName: e.target.value })}
                        style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #cbd5e1", borderRadius: "10px", fontSize: "0.92rem", boxSizing: "border-box", outline: "none" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontWeight: "700", fontSize: "0.85rem", color: "#334155", marginBottom: "6px" }}>رقم جوال التواصل</label>
                      <input 
                        type="text" 
                        placeholder="0599000000" 
                        value={editingCamp.managerPhone}
                        onChange={(e) => setEditingCamp({ ...editingCamp, managerPhone: e.target.value })}
                        style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #cbd5e1", borderRadius: "10px", fontSize: "0.92rem", boxSizing: "border-box", outline: "none" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontWeight: "700", fontSize: "0.85rem", color: "#334155", marginBottom: "6px" }}>المنطقة / العنوان والتفاصيل</label>
                    <input 
                      type="text" 
                      placeholder="مثال: حي القصاصيب - جباليا" 
                      value={editingCamp.address}
                      onChange={(e) => setEditingCamp({ ...editingCamp, address: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #cbd5e1", borderRadius: "10px", fontSize: "0.92rem", boxSizing: "border-box", outline: "none" }}
                    />
                  </div>

                  <div style={{ background: "rgba(37, 99, 235, 0.05)", border: "1px solid rgba(37, 99, 235, 0.2)", borderRadius: "12px", padding: "1rem", marginTop: "4px" }}>
                    <h4 style={{ fontSize: "0.9rem", color: "#2563eb", margin: "0 0 10px 0", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}><FaKey aria-hidden="true" /> تعديل بيانات تسجيل دخول مدير المخيم</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <div>
                        <label style={{ display: "block", fontWeight: "700", fontSize: "0.82rem", color: "#334155", marginBottom: "6px" }}>اسم المستخدم للوحة *</label>
                        <input 
                          type="text" 
                          placeholder="اسم المستخدم" 
                          value={editingCamp.adminUsername}
                          onChange={(e) => setEditingCamp({ ...editingCamp, adminUsername: e.target.value })}
                          name="camp-manager-username"
                          autoComplete="off"
                          required 
                          style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #cbd5e1", borderRadius: "8px", fontSize: "0.9rem", boxSizing: "border-box", backgroundColor: "white" }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", fontSize: "0.82rem", color: "#334155", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={changeCampPassword}
                            onChange={(e) => {
                              const enabled = e.target.checked;
                              setChangeCampPassword(enabled);
                              setEditingCamp((current) => ({ ...current, adminPassword: "" }));
                              setEditCampError("");
                            }}
                          />
                          تغيير كلمة مرور المدير
                        </label>
                        {changeCampPassword ? (
                          <input
                            type="password"
                            name={`camp-manager-new-password-${editingCamp.id}`}
                            placeholder="6 خانات على الأقل"
                            value={editingCamp.adminPassword}
                            onChange={(e) => setEditingCamp({ ...editingCamp, adminPassword: e.target.value })}
                            minLength={MIN_PASSWORD_LENGTH}
                            autoComplete="new-password"
                            aria-label="كلمة مرور المدير الجديدة"
                            style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #cbd5e1", borderRadius: "8px", fontSize: "0.9rem", boxSizing: "border-box", backgroundColor: "white" }}
                          />
                        ) : (
                          <span style={{ color: "#64748b", fontSize: "0.78rem" }}>ستبقى كلمة المرور الحالية دون تغيير.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0" }}>
                  <button type="button" disabled={isSavingEditCamp} onClick={() => setIsEditCampModalOpen(false)} style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "9px 20px", borderRadius: "10px", fontWeight: "700", cursor: isSavingEditCamp ? "not-allowed" : "pointer", fontSize: "0.9rem", opacity: isSavingEditCamp ? 0.65 : 1 }}>إلغاء</button>
                  <button type="submit" disabled={isSavingEditCamp} aria-busy={isSavingEditCamp} style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", color: "white", border: "none", padding: "9px 24px", borderRadius: "10px", fontWeight: "800", cursor: isSavingEditCamp ? "wait" : "pointer", fontSize: "0.9rem", boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)", opacity: isSavingEditCamp ? 0.75 : 1 }}>
                    {isSavingEditCamp ? <><FaSpinner className="spinner" aria-hidden="true" /> جارٍ الحفظ...</> : "حفظ التعديلات الآن"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {deleteCandidate && (
        <div className="modal-overlay" role="presentation">
          <section className="modal-content destructive-confirm" role="dialog" aria-modal="true" aria-labelledby="delete-camp-title">
            <header className="modal-header">
              <div>
                <p className="modal-kicker">إجراء نهائي</p>
                <h2 id="delete-camp-title"><FaTrash aria-hidden="true" /> حذف {deleteCandidate.name}</h2>
              </div>
              <button type="button" className="btn-close" onClick={() => setDeleteCandidate(null)} aria-label="إغلاق نافذة الحذف">
                <FaTimes aria-hidden="true" />
              </button>
            </header>

            <div className="destructive-confirm-body">
              <p>سيُحذف المخيم وحساب مديره وجميع الأسر والترشيحات وطلبات التجديد المرتبطة به من قاعدة البيانات. لا يمكن التراجع عن هذه العملية.</p>
              <label htmlFor="delete-camp-confirm">اكتب معرّف المخيم <strong dir="ltr">{deleteCandidate.id}</strong> للتأكيد</label>
              <input
                id="delete-camp-confirm"
                type="text"
                dir="ltr"
                autoComplete="off"
                value={deleteConfirmText}
                onChange={(event) => setDeleteConfirmText(event.target.value)}
              />
            </div>

            <footer className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteCandidate(null)} disabled={isDeletingCamp}>إلغاء</button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDeleteCamp}
                disabled={deleteConfirmText !== deleteCandidate.id || isDeletingCamp}
                aria-busy={isDeletingCamp}
              >
                {isDeletingCamp ? <><FaSpinner className="spinner" aria-hidden="true" /> جارٍ الحذف…</> : <><FaTrash aria-hidden="true" /> حذف نهائي</>}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
};

export default SuperAdmin;
