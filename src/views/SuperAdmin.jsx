"use client";

import React, { useState, useEffect } from "react";
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
  FaTrash
} from "react-icons/fa";
import AnimatedNumber, { AnimatedDonut } from "../components/AnimatedNumber";
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

  // Ø­Ø§Ù„Ø© Ù†Ù…ÙˆØ°Ø¬ Ø¥Ø¶Ø§ÙØ© Ù…Ø®ÙŠÙ…
  const [isAddCampOpen, setIsAddCampOpen] = useState(false);
  const [newCamp, setNewCamp] = useState({
    id: "",
    name: "",
    managerName: "",
    managerPhone: "",
    adminUsername: "",
    adminPassword: "",
    trialPeriod: "1-month"
  });

  // Ø­Ø§Ù„Ø© Ù†Ù…ÙˆØ°Ø¬ ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ
  const [selectedCampForSubscription, setSelectedCampForSubscription] = useState(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscriptionExpiryInput, setSubscriptionExpiryInput] = useState("");

  // Ø­Ø§Ù„Ø© Ù†Ù…ÙˆØ°Ø¬ ØªØ¹Ø¯ÙŠÙ„ ÙƒØ§ÙØ© Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø®ÙŠÙ…
  const [isEditCampModalOpen, setIsEditCampModalOpen] = useState(false);
  const [loadingEditCamp, setLoadingEditCamp] = useState(false);
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
      // ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª ÙˆØ§Ù„Ø¥Ø¹Ù„Ø§Ù†Ø§Øª ÙˆØ§Ù„Ù…Ø¤Ø´Ø±Ø§Øª Ø¨Ø§Ø³ØªÙ…Ø±Ø§Ø±
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
      setError("ÙØ´Ù„ ÙÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ù…Ù† Ø§Ù„Ø®Ø§Ø¯Ù….");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSuperAdminUsername = async (e) => {
    e.preventDefault();
    if (!superAdminUsernameInput.trim()) {
      setError("ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ø³Ù… Ù…Ø³ØªØ®Ø¯Ù… ØµØ§Ù„Ø­ Ù„Ù„Ù…Ø´Ø±Ù Ø§Ù„Ø¹Ø§Ù….");
      return;
    }
    setSavingSuperAdminUser(true);
    setError("");
    setSuccess("");
    try {
      await updateSuperAdminUsername(superAdminUsernameInput);
      setSuccess(`ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ø³Ù… Ø­Ø³Ø§Ø¨ Ø§Ù„Ù…Ø´Ø±Ù Ø§Ù„Ø¹Ø§Ù… Ø¨Ù†Ø¬Ø§Ø­ Ø¥Ù„Ù‰: (${superAdminUsernameInput.trim()})`);
    } catch (err) {
      setError(err.message || "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ ØªØ­Ø¯ÙŠØ« Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù….");
    } finally {
      setSavingSuperAdminUser(false);
    }
  };

  const handleCreateCamp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newCamp.id || !newCamp.name || !newCamp.adminUsername || !newCamp.adminPassword) {
      setError("ÙŠØ±Ø¬Ù‰ ØªØ¹Ø¨Ø¦Ø© Ø§Ù„Ø­Ù‚ÙˆÙ„ Ø§Ù„Ø¥Ù„Ø²Ø§Ù…ÙŠØ©.");
      return;
    }
    if (newCamp.adminPassword.length < 6) {
      setError("ÙƒÙ„Ù…Ø© Ù…Ø±ÙˆØ± Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø®ÙŠÙ… ÙŠØ¬Ø¨ Ø£Ù„Ø§ ØªÙ‚Ù„ Ø¹Ù† 6 Ø£Ø­Ø±Ù.");
      return;
    }

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
        setSuccess(`ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ø®ÙŠÙ… Ø¨Ù†Ø¬Ø§Ø­. ÙŠÙ…ÙƒÙ† Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¨Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…: ${newCamp.adminUsername.trim()} Ø£Ùˆ Ø¨Ø§Ø³Ù… Ø§Ù„Ù…Ø®ÙŠÙ…: ${newCamp.name.trim()}`);
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
        loadData();
      } else {
        setError(res.error || "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ø®ÙŠÙ….");
      }
    } catch (err) {
      setError("Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„Ø§ØªØµØ§Ù„.");
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
    
    // Ø¥Ø°Ø§ ÙƒØ§Ù† Ø§Ø´ØªØ±Ø§Ùƒ Ø§Ù„Ù…Ø®ÙŠÙ… Ù…Ù†ØªÙ‡ÙŠØ§Ù‹ØŒ Ø§Ù‚ØªØ±Ø­ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ ØªÙ…Ø¯ÙŠØ¯ Ø´Ù‡Ø± ÙƒØ§Ù…Ù„ Ø§Ø¨ØªØ¯Ø§Ø¡Ù‹ Ù…Ù† Ø§Ù„ÙŠÙˆÙ…
    let initialDate;
    if (isExpired) {
      initialDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    } else {
      // Ø¥Ø°Ø§ ÙƒØ§Ù† Ù†Ø´Ø·Ø§Ù‹ØŒ Ø§Ø¶Ù 30 ÙŠÙˆÙ…Ø§Ù‹ Ø¹Ù„Ù‰ ØªØ§Ø±ÙŠØ® Ø§Ù†ØªÙ‡Ø§Ø¡ Ø§Ø´ØªØ±Ø§ÙƒÙ‡ Ø§Ù„Ø­Ø§Ù„ÙŠ
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
        setSuccess(`ØªÙ… ØªØ­Ø¯ÙŠØ« ØµÙ„Ø§Ø­ÙŠØ© Ø§Ø´ØªØ±Ø§Ùƒ Ù…Ø®ÙŠÙ… "${selectedCampForSubscription.name}" Ø¨Ù†Ø¬Ø§Ø­!`);
        setIsSubscriptionModalOpen(false);
        // ØªØ­Ø¯ÙŠØ« Ø­Ø§Ù„Ø© Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ù…Ø­Ù„ÙŠØ§Ù‹ ÙÙˆØ±Ø§Ù‹
        setCamps(prevCamps => prevCamps.map(c => c.id === selectedCampForSubscription.id ? {
          ...c,
          subscriptionExpiry: expiryDateISO,
          isActive
        } : c));
        loadData();
      } else {
        setError(res.error || "ÙØ´Ù„ ØªØ­Ø¯ÙŠØ« ØµÙ„Ø§Ø­ÙŠØ© Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ.");
      }
    } catch (err) {
      console.error("Subscription update error:", err);
      setError("Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø­ÙØ¸ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„Ø§Øª.");
    }
  };

  const handleOpenEditCampModal = async (camp) => {
    setError("");
    setSuccess("");
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
    setError("");
    setSuccess("");

    if (!editingCamp.name || !editingCamp.adminUsername) {
      setError("ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ø³Ù… Ø§Ù„Ù…Ø®ÙŠÙ… ÙˆØ§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„.");
      return;
    }

    try {
      const res = await updateCampFullDetails(editingCamp.id, editingCamp);
      if (res.success) {
        setSuccess(`ØªÙ… ØªØ­Ø¯ÙŠØ« ÙƒØ§ÙØ© Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø®ÙŠÙ… "${editingCamp.name}" ÙˆØ­Ø³Ø§Ø¨ Ø§Ù„Ù…Ø¯ÙŠØ± Ø¨Ù†Ø¬Ø§Ø­!`);
        setIsEditCampModalOpen(false);
        loadData();
      } else {
        setError(res.error || "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø­ÙØ¸ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„Ø§Øª.");
      }
    } catch (err) {
      setError("Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„Ø§ØªØµØ§Ù„.");
    }
  };

  const handleDeleteCamp = async (camp) => {
    const accepted = window.confirm(
      `ØªØ­Ø°ÙŠØ±: Ø³ÙŠØªÙ… Ø­Ø°Ù Ø§Ù„Ù…Ø®ÙŠÙ… "${camp.name}" Ù†Ù‡Ø§Ø¦ÙŠÙ‹Ø§ Ù…Ø¹ Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø¹Ø§Ø¦Ù„Ø§Øª ÙˆØ§Ù„ØªØ±Ø´ÙŠØ­Ø§Øª ÙˆØ§Ù„Ø­Ø³Ø§Ø¨Ø§Øª ÙˆØ·Ù„Ø¨Ø§Øª Ø§Ù„ØªØ¬Ø¯ÙŠØ¯. Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø§Ù„ØªØ±Ø§Ø¬Ø¹. Ù‡Ù„ ØªØ±ÙŠØ¯ Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø©ØŸ`
    );
    if (!accepted) return;

    const typedId = window.prompt(`Ù„Ù„ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠØŒ Ø§ÙƒØªØ¨ Ù…Ø¹Ø±Ù‘Ù Ø§Ù„Ù…Ø®ÙŠÙ… ÙƒÙ…Ø§ Ù‡Ùˆ: ${camp.id}`);
    if (typedId !== camp.id) {
      setError("ØªÙ… Ø¥Ù„ØºØ§Ø¡ Ø§Ù„Ø­Ø°Ù Ù„Ø£Ù† Ù…Ø¹Ø±Ù‘Ù Ø§Ù„Ù…Ø®ÙŠÙ… ØºÙŠØ± Ù…Ø·Ø§Ø¨Ù‚.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    const result = await deleteCampPermanently(camp.id);
    if (result.success) {
      setSuccess(`ØªÙ… Ø­Ø°Ù Ø§Ù„Ù…Ø®ÙŠÙ… "${camp.name}" ÙˆØ¬Ù…ÙŠØ¹ Ø¨ÙŠØ§Ù†Ø§ØªÙ‡ ÙˆØ­Ø³Ø§Ø¨Ø§ØªÙ‡ Ù†Ù‡Ø§Ø¦ÙŠÙ‹Ø§.`);
      await loadData();
    } else {
      setError(result.error || "ØªØ¹Ø°Ø± Ø­Ø°Ù Ø§Ù„Ù…Ø®ÙŠÙ….");
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId, campId) => {
    setError("");
    setSuccess("");
    try {
      const res = await approveRenewalRequest(requestId, campId, 1); // ØªÙ…Ø¯ÙŠØ¯ Ø´Ù‡Ø± ÙˆØ§Ø­Ø¯
      if (res.success) {
        setSuccess("ØªÙ… ØªÙØ¹ÙŠÙ„ ÙˆØªÙ…Ø¯ÙŠØ¯ Ø§Ø´ØªØ±Ø§Ùƒ Ø§Ù„Ù…Ø®ÙŠÙ… Ø¨Ù†Ø¬Ø§Ø­!");
        loadData();
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError("ÙØ´Ù„ ØªÙ†ÙÙŠØ° Ø§Ù„Ø·Ù„Ø¨.");
    }
  };

  const handleDeclineRequest = async (requestId) => {
    setError("");
    setSuccess("");
    try {
      const res = await declineRenewalRequest(requestId);
      if (res.success) {
        setSuccess("ØªÙ… Ø±ÙØ¶ Ø·Ù„Ø¨ Ø§Ù„ØªØ¬Ø¯ÙŠØ¯.");
        loadData();
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError("ÙØ´Ù„ ØªÙ†ÙÙŠØ° Ø§Ù„Ø·Ù„Ø¨.");
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await updatePaymentMethods(paymentMethods);
      if (res.success) {
        setSuccess("ØªÙ… ØªØ­Ø¯ÙŠØ« Ø·Ø±Ù‚ Ø§Ù„Ø¯ÙØ¹ ÙˆØ­ÙØ¸ Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø¨Ù†Ø¬Ø§Ø­!");
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError("ÙØ´Ù„ ÙÙŠ Ø­ÙØ¸ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª.");
    }
  };

  const getStatusBadge = (camp) => {
    const isExpired = new Date(camp.subscriptionExpiry) < new Date();
    if (!camp.isActive || isExpired) {
      return <span className="badge-members" style={{ backgroundColor: "#f8d7da", color: "#721c24" }}>Ù…Ù†ØªÙ‡ÙŠ</span>;
    }
    return <span className="badge-members" style={{ backgroundColor: "#d4edda", color: "#155724" }}>Ù†Ø´Ø·</span>;
  };

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    setSavingAnnouncement(true);
    setError("");
    setSuccess("");
    try {
      const res = await updateAnnouncement(announcementForm);
      if (res.success) {
        setSuccess("ØªÙ… Ø­ÙØ¸ ÙˆØªØ­Ø¯ÙŠØ« Ø§Ù„Ø¥Ø¹Ù„Ø§Ù† Ø§Ù„Ø¹Ø§Ù… Ø¨Ù†Ø¬Ø§Ø­! ÙŠØ¸Ù‡Ø± Ø§Ù„Ø¢Ù† ÙƒÙ€ Ø´Ø±ÙŠØ· Ø¹Ø§Ø¬Ù„ Ù„Ø¬Ù…ÙŠØ¹ Ø§Ù„Ù…Ø®ÙŠÙ…Ø§Øª.");
      } else {
        setError(res.error || "ÙØ´Ù„ ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø¥Ø¹Ù„Ø§Ù†.");
      }
    } catch (err) {
      setError("Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø­ÙØ¸ Ø§Ù„Ø¥Ø¹Ù„Ø§Ù†.");
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "ØºÙŠØ± Ù…Ø­Ø¯Ø¯";
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const [searchTerm, setSearchTerm] = useState("");

  const getSubscriptionUsageInfo = (createdAtStr, expiryDateStr) => {
    if (!expiryDateStr) return { text: "ØºÙŠØ± Ù…Ø­Ø¯Ø¯", percent: 0, isExpired: false, badgeClass: "usage-badge warning-time", color: "#d97706" };
    
    const now = new Date();
    const expiry = new Date(expiryDateStr);
    const createdAt = createdAtStr ? new Date(createdAtStr) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const totalDurationMs = Math.max(1, expiry.getTime() - createdAt.getTime());
    const remainingMs = expiry.getTime() - now.getTime();
    
    if (remainingMs <= 0) {
      const expiredMs = Math.abs(remainingMs);
      const daysAgo = Math.floor(expiredMs / (1000 * 60 * 60 * 24));
      const hoursAgo = Math.floor((expiredMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      const time×½îÚ$z{-®éÜj×V'67&—F–öäW‡—'”–çWBòæWrFFR‡7V'67&—F–öäW‡—'”–çWB’¢æWrFFR‚“°¢6öç7BF&vWBÒæWrFFR„ÖF‚æÖ‚†&6RævWEF–ÖR‚’ÂFFRææ÷r‚’’“°¢F&vWBç6WD†÷W'2‡F&vWBævWD†÷W'2‚’²“°¢6öç7BG¤öfg6WBÒF&vWBævWEF–ÖW¦öæTöfg6WB‚’¢c°¢6WE7V'67&—F–öäW‡—'”–çWB‚†æWrFFR‡F&vWBÒG¤öfg6WB’’çFô•4õ7G&–ær‚’ç6Æ–6RƒÂb’“°¢×Ð¢6Æ74æÖSÒ'V–6²ÖW‡FVæBÖ'Fâ ¢à¢²‹=Š}‹Š’˜Š}ŠÝŠýŠ¢Âö'WGFöãà¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢öä6Æ–6³×²‚’Óâ°¢6öç7Bæ÷rÒæWrFFR‚“°¢æ÷rç6WDFFR†æ÷rævWDFFR‚’²“°¢6WE7V'67&—F–öäW‡—'”–çWB†f÷&ÖDFFUFôÆö6Ä–çWB†æ÷r’“°¢×Ð¢6Æ74æÖSÒ'V–6²ÖW‡FVæBÖ'Fâ ¢à¢²˜­˜˜R˜Š}ŠÝŠð¢Âö'WGFöãà¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢öä6Æ–6³×²‚’Óâ°¢6öç7Bæ÷rÒæWrFFR‚“°¢æ÷rç6WDFFR†æ÷rævWDFFR‚’²r“°¢6WE7V'67&—F–öäW‡—'”–çWB†f÷&ÖDFFUFôÆö6Ä–çWB†æ÷r’“°¢×Ð¢6Æ74æÖSÒ'V–6²ÖW‡FVæBÖ'Fâ ¢à¢²Š=‹=Š˜‹’˜Š}ŠÝŠð¢Âö'WGFöãà¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢öä6Æ–6³×²‚’Óâ°¢6öç7Bæ÷rÒæWrFFR‚“°¢æ÷rç6WDÖöçF‚†æ÷rævWDÖöçF‚‚’²“°¢6WE7V'67&—F–öäW‡—'”–çWB†f÷&ÖDFFUFôÆö6Ä–çWB†æ÷r’“°¢×Ð¢6Æ74æÖSÒ'V–6²ÖW‡FVæBÖ'Fâ ¢à¢²‹M˜}‹˜Š}ŠÝŠð¢Âö'WGFöãà¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢öä6Æ–6³×²‚’Óâ°¢6öç7Bæ÷rÒæWrFFR‚“°¢æ÷rç6WDÖöçF‚†æ÷rævWDÖöçF‚‚’²b“°¢6WE7V'67&—F–öäW‡—'”–çWB†f÷&ÖDFFUFôÆö6Ä–çWB†æ÷r’“°¢×Ð¢6Æ74æÖSÒ'V–6²ÖW‡FVæBÖ'Fâ ¢à¢²bŠ=‹M˜}‹¢Âö'WGFöãà¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢öä6Æ–6³×²‚’Óâ°¢6öç7Bæ÷rÒæWrFFR‚“°¢æ÷rç6WDgVÆÅ–V"†æ÷rævWDgVÆÅ–V"‚’²“°¢6WE7V'67&—F–öäW‡—'”–çWB†f÷&ÖDFFUFôÆö6Ä–çWB†æ÷r’“°¢×Ð¢6Æ74æÖSÒ'V–6²ÖW‡FVæBÖ'Fâ ¢à¢²‹=˜mŠ’˜Š}ŠÝŠýŠ¢Âö'WGFöãà¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢öä6Æ–6³×²‚’Óâ°¢6WE7V'67&—F–öäW‡—'”–çWB‚##“’Ó"Ó3C#3£S’"“°¢×Ð¢6Æ74æÖSÒ'V–6²ÖW‡FVæBÖ'Fâ ¢7G–ÆS×·²&6¶w&÷VæD6öÆ÷#¢'&v&ƒRÂƒÂSÂã’"Â6öÆ÷#¢"3cS3""ÂföçEvV–v‡C¢&&öÆB"×Ð¢à¢)›îûˆòŠýŠ}Šm˜R˜]˜Š­˜ŠÒ¢Âö'WGFöãà¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢öä6Æ–6³×²‚’Óâ°¢6öç7B7BÒæWrFFR„FFRææ÷r‚’ÒR¢c¢“°¢6WE7V'67&—F–öäW‡—'”–çWB†f÷&ÖDFFUFôÆö6Ä–çWB‡7B’“°¢×Ð¢6Æ74æÖSÒ'V–6²ÖW‡FVæBÖ'FâFævW"Ö'Fâ ¢à¢Š]˜m˜}Š}ŠŠ}˜MŠ-˜b)¹@¢Âö'WGFöãà¢ÂöF—cà¢ÂöF—cà ¢²ò¢ŠÝ˜-˜B˜˜-Š¢Š}˜MŠ}˜mŠ­˜}Š}ŠŠ}˜MŠý˜-˜­˜"˜­Šý˜˜¢ŠŠ}˜M‹˜‹-˜mŠ}˜]Š’˜Š}˜M˜˜-Š¢¢÷Ð¢ÆF—b6Æ74æÖSÒ&f÷&ÒÖw&÷W"7G–ÆS×·²&6¶w&÷VæC¢"6c†ff2"ÂFF–æs¢#'‚"Â&÷&FW%&F—W3¢#‡‚"Â&÷&FW#¢#‚6öÆ–B6S&S†c"×Óà¢ÆÆ&VÂ‡FÖÄf÷#Ò&W‡—'”–çWB"7G–ÆS×·²föçEvV–v‡C¢#s"ÂF—7Æ“¢&fÆW‚"ÂÆ–vä—FV×3¢&6VçFW""Âv¢#g‚"Â6öÆ÷#¢"333CSR"×Óà¢Äf6ÆVæF$ÇB7G–ÆS×·²6öÆ÷#¢"6#ƒ“cCr"×Òóà¢Ç7ãíŠ­ŠÝŠý˜­ŠòŠ­Š}‹˜­Šâ˜˜˜-Š¢Š}˜mŠ­˜}Š}ŠŠ}˜MŠ}‹MŠ­‹Š}˜2Š}˜MŠý˜-˜­˜"£Â÷7ãà¢ÂöÆ&VÃà¢Æ–çW@¢G—SÒ&FFWF–ÖRÖÆö6Â ¢–CÒ&W‡—'”–çWB ¢fÇVS×·7V'67&—F–öäW‡—'”–çWGÐ¢öä6†ævS×²†R’Óâ6WE7V'67&—F–öäW‡—'”–çWB†RçF&vWBçfÇVR—Ð¢&WV—&V@¢7G–ÆS×·°¢v–GFƒ¢#R"À¢FF–æs¢#‚'‚"À¢&÷&FW#¢#ãW‚6öÆ–B6#ƒ“cCr"À¢&÷&FW%&F—W3¢#g‚"À¢Ö&v–åF÷¢#g‚"À¢föçDfÖ–Ç“¢&–æ†W&—B"À¢föçE6—¦S¢#&VÒ"À¢föçEvV–v‡C¢#c"À¢÷WFÆ–æS¢&æöæR"À¢&÷…6—¦–æs¢&&÷&FW"Ö&÷‚"À¢&6¶w&÷VæD6öÆ÷#¢'v†—FR ¢×Ð¢óà¢·7V'67&—F–öäW‡—'”–çWBbb€¢ÆF—b7G–ÆS×·²föçE6—¦S¢#ãƒ'&VÒ"Â6öÆ÷#¢"3cS3""ÂÖ&v–åF÷¢#g‚"ÂföçEvV–v‡C¢#c"×Óà¢	ù8RŠ}˜M˜]˜‹ŠòŠ}˜M˜]ŠÝŠýŠó¢¶æWrFFR‡7V'67&—F–öäW‡—'”–çWB’çFôÆö6ÆU7G&–ær‚&"ÔTr"Â²vVV¶F“¢&Æöær"Â–V#¢&çVÖW&–2"ÂÖöçFƒ¢&Æöær"ÂF“¢&çVÖW&–2"Â†÷W#¢#"ÖF–v—B"ÂÖ–çWFS¢#"ÖF–v—B"Ò—Ð¢ÂöF—cà¢—Ð¢ÂöF—cà ¢ÂöF—cà¢ÆF—b6Æ74æÖSÒ&ÖöFÂÖfö÷FW"#à¢Æ'WGFöâG—SÒ&'WGFöâ"öä6Æ–6³×²‚’Óâ6WD—57V'67&—F–öäÖöFÄ÷Vâ†fÇ6R—Ò6Æ74æÖSÒ&'FâÖ6æ6VÂ#íŠ]˜M‹­Š}ŠÂö'WGFöãà¢Æ'WGFöâG—SÒ'7V&Ö—B"6Æ74æÖSÒ&'Fâ×7V&Ö—B"7G–ÆS×·²&6¶w&÷VæD6öÆ÷#¢"6#ƒ“cCr"Â&÷&FW$6öÆ÷#¢"6#ƒ“cCr"×ÓíŠÝ˜‹‚˜Š­‹Šý˜­˜CÂö'WGFöãà¢ÂöF—cà¢Âöf÷&Óà¢ÂöF—cà¢ÂöF—cà¢—Ð ¢²ò¢˜mŠ}˜‹Š’Š­‹Šý˜­˜B˜=Š}˜Š’Š˜­Š}˜mŠ}Š¢Š}˜M˜]Ší˜­˜R˜ŠÝ‹=Š}Š‚Š}˜M˜]Šý˜­‹˜]˜mŠŠ½˜-Š’¢÷Ð¢¶—4VF—D6×ÖöFÄ÷Vâbb€¢ÆF—b6Æ74æÖSÒ&ÖöFÂÖ÷fW&Æ’"7G–ÆS×·²&6¶w&÷VæC¢'&v&ƒRÂ#2ÂC"ÂãsR’"Â&6¶G&÷f–ÇFW#¢&&ÇW"ƒ‡‚’"×Óà¢ÆF—b6Æ74æÖSÒ&ÖöFÂÖ6öçFVçB"7G–ÆS×·²Ö…v–GFƒ¢#c#‚"Âv–GFƒ¢#“"R"Â&÷&FW%&F—W3¢##‚"ÂFF–æs¢#ãsW&VÒ"Â&÷…6†F÷s¢##W‚S‚Ó'‚&v&ƒÂÂÂã#R’"×Óà¢ÆF—b6Æ74æÖSÒ&ÖöFÂÖ†VFW""7G–ÆS×·²F—7Æ“¢&fÆW‚"Â§W7F–g”6öçFVçC¢'76RÖ&WGvVVâ"ÂÆ–vä—FV×3¢&6VçFW""ÂFF–æt&÷GFöÓ¢#&VÒ"Â&÷&FW$&÷GFöÓ¢#‚6öÆ–B6S&S†c"ÂÖ&v–ä&÷GFöÓ¢#ã#W&VÒ"×Óà¢Æƒ"7G–ÆS×·²F—7Æ“¢&fÆW‚"ÂÆ–vä—FV×3¢&6VçFW""Âv¢#‚"Â6öÆ÷#¢"3#Sc6V""ÂÖ&v–ã¢ÂföçE6—¦S¢#ã#W&VÒ"ÂföçEvV–v‡C¢#ƒ"×Óà¢ÄfVF—B7G–ÆS×·²6öÆ÷#¢"3#Sc6V""×Òóà¢Ç7ãíŠ­‹Šý˜­˜B˜=Š}˜Š’Š˜­Š}˜mŠ}Š¢Š}˜M˜]Ší˜­˜R˜ŠÝ‹=Š}Š‚Š}˜M˜]Šý˜­‹‡¶VF—F–æt6×æ–GÒ“Â÷7ãà¢Âöƒ#à¢Æ'WGFöâG—SÒ&'WGFöâ"öä6Æ–6³×²‚’Óâ6WD—4VF—D6×ÖöFÄ÷Vâ†fÇ6R—Ò6Æ74æÖSÒ&'FâÖ6Æ÷6R"F—FÆSÒ-Š]‹­˜MŠ}˜""7G–ÆS×·²&6¶w&÷VæC¢"6ccVc’"Â&÷&FW#¢&æöæR"Âv–GFƒ¢#3'‚"Â†V–v‡C¢#3'‚"Â&÷&FW%&F—W3¢#SR"Â7W'6÷#¢'ö–çFW""ÂF—7Æ“¢&fÆW‚"ÂÆ–vä—FV×3¢&6VçFW""Â§W7F–g”6öçFVçC¢&6VçFW""Â6öÆ÷#¢"3cCsC†""×Óà¢ÄfF–ÖW2óà¢Âö'WGFöãà¢ÂöF—cà¢ ¢¶ÆöF–ætVF—D6×ò€¢ÆF—b6Æ74æÖSÒ'FW‡BÖ6VçFW"’ÓB"7G–ÆS×·²FF–æs¢#'&VÒ"Â6öÆ÷#¢"3cCsC†""×Óà¢Äf7–ææW"6Æ74æÖSÒ'7–ææW""óâŠÍŠ}‹˜¢Š­ŠÝ˜]˜­˜BŠ˜­Š}˜mŠ}Š¢Š}˜MŠÝ‹=Š}Š‚˜Š}˜M˜]Ší˜­˜Rââà¢ÂöF—cà¢’¢€¢Æf÷&Òöå7V&Ö—C×¶†æFÆU6fTVF—D6×Óà¢ÆF—b6Æ74æÖSÒ&ÖöFÂÖ&öG’"7G–ÆS×·²F—7Æ“¢&fÆW‚"ÂfÆW„F—&V7F–öã¢&6öÇVÖâ"Âv¢#G‚"×Óà¢ÆF—b7G–ÆS×·²F—7Æ“¢&w&–B"Âw&–EFV×ÆFT6öÇVÖç3¢#g"g""Âv¢#G‚"×Óà¢ÆF—cà¢ÆÆ&VÂ7G–ÆS×·²F—7Æ“¢&&Æö6²"ÂföçEvV–v‡C¢#s"ÂföçE6—¦S¢#ãƒW&VÒ"Â6öÆ÷#¢"333CSR"ÂÖ&v–ä&÷GFöÓ¢#g‚"×Óí˜]‹‹™˜Š}˜M˜]Ší˜­˜R„6×”B“ÂöÆ&VÃà¢Æ–çWB ¢G—SÒ'FW‡B" ¢fÇVS×¶VF—F–æt6×æ–GÐ¢F—6&ÆV@¢7G–ÆS×·²v–GFƒ¢#R"ÂFF–æs¢#‚G‚"Â&÷&FW#¢#ãW‚6öÆ–B6S&S†c"Â&÷&FW%&F—W3¢#‚"ÂföçE6—¦S¢#ã“'&VÒ"Â&÷…6—¦–æs¢&&÷&FW"Ö&÷‚"Â&6¶w&÷VæD6öÆ÷#¢"6c†ff2"Â6öÆ÷#¢"3cCsC†""ÂföçEvV–v‡C¢#s"×Ð¢óà¢ÂöF—cà¢ÆF—cà¢ÆÆ&VÂ7G–ÆS×·²F—7Æ“¢&&Æö6²"ÂföçEvV–v‡C¢#s"ÂföçE6—¦S¢#ãƒW&VÒ"Â6öÆ÷#¢"333CSR"ÂÖ&v–ä&÷GFöÓ¢#g‚"×ÓíŠ}‹=˜RŠ}˜M˜]Ší˜­˜RŠŠ}˜M˜=Š}˜]˜B£ÂöÆ&VÃà¢Æ–çWB ¢G—SÒ'FW‡B" ¢Æ6V†öÆFW#Ò-Š}‹=˜RŠ}˜M˜]Ší˜­˜R" ¢fÇVS×¶VF—F–æt6×ææÖWÐ¢öä6†ævS×²†R’Óâ6WDVF—F–æt6×‡²ââæVF—F–æt6×ÂæÖS¢RçF&vWBçfÇVRÒ—Ð¢&WV—&VB ¢7G–ÆS×·²v–GFƒ¢#R"ÂFF–æs¢#‚G‚"Â&÷&FW#¢#ãW‚6öÆ–B66&CVS"Â&÷&FW%&F—W3¢#‚"ÂföçE6—¦S¢#ã“'&VÒ"Â&÷…6—¦–æs¢&&÷&FW"Ö&÷‚"Â÷WFÆ–æS¢&æöæR"×Ð¢óà¢ÂöF—cà¢ÂöF—cà ¢ÆF—b7G–ÆS×·²F—7Æ“¢&w&–B"Âw&–EFV×ÆFT6öÇVÖç3¢#g"g""Âv¢#G‚"×Óà¢ÆF—cà¢ÆÆ&VÂ7G–ÆS×·²F—7Æ“¢&&Æö6²"ÂföçEvV–v‡C¢#s"ÂföçE6—¦S¢#ãƒW&VÒ"Â6öÆ÷#¢"333CSR"ÂÖ&v–ä&÷GFöÓ¢#g‚"×ÓíŠ}‹=˜RŠ}˜M˜]‹=ŠM˜˜BŠ}˜M˜]Šý˜­‹“ÂöÆ&VÃà¢Æ–çWB ¢G—SÒ'FW‡B" ¢Æ6V†öÆFW#Ò-Š}‹=˜RŠ}˜M˜]Šý˜­‹Š}˜M˜]‹=ŠM˜˜B" ¢fÇVS×¶VF—F–æt6×æÖævW$æÖWÐ¢öä6†ævS×²†R’Óâ6WDVF—F–æt6×‡²ââæVF—F–æt6×ÂÖævW$æÖS¢RçF&vWBçfÇVRÒ—Ð¢7G–ÆS×·²v–GFƒ¢#R"ÂFF–æs¢#‚G‚"Â&÷&FW#¢#ãW‚6öÆ–B66&CVS"Â&÷&FW%&F—W3¢#‚"ÂföçE6—¦S¢#ã“'&VÒ"Â&÷…6—¦–æs¢&&÷&FW"Ö&÷‚"Â÷WFÆ–æS¢&æöæR"×Ð¢óà¢ÂöF—cà¢ÆF—cà¢ÆÆ&VÂ7G–ÆS×·²F—7Æ“¢&&Æö6²"ÂföçEvV–v‡C¢#s"ÂföçE6—¦S¢#ãƒW&VÒ"Â6öÆ÷#¢"333CSR"ÂÖ&v–ä&÷GFöÓ¢#g‚"×Óí‹˜-˜RŠÍ˜Š}˜BŠ}˜MŠ­˜Š}‹]˜CÂöÆ&VÃà¢Æ–çWB ¢G—SÒ'FW‡B" ¢Æ6V†öÆFW#Ò#S““" ¢fÇVS×¶VF—F–æt6×æÖævW%†öæWÐ¢öä6†ævS×²†R’Óâ6WDVF—F–æt6×‡²ââæVF—F–æt6×ÂÖævW%†öæS¢RçF&vWBçfÇVRÒ—Ð¢7G–ÆS×·²v–GFƒ¢#R"ÂFF–æs¢#‚G‚"Â&÷&FW#¢#ãW‚6öÆ–B66&CVS"Â&÷&FW%&F—W3¢#‚"ÂföçE6—¦S¢#ã“'&VÒ"Â&÷…6—¦–æs¢&&÷&FW"Ö&÷‚"Â÷WFÆ–æS¢&æöæR"×Ð¢óà¢ÂöF—cà¢ÂöF—cà ¢ÆF—cà¢ÆÆ&VÂ7G–ÆS×·²F—7Æ“¢&&Æö6²"ÂföçEvV–v‡C¢#s"ÂföçE6—¦S¢#ãƒW&VÒ"Â6öÆ÷#¢"333CSR"ÂÖ&v–ä&÷GFöÓ¢#g‚"×ÓíŠ}˜M˜]˜m‹}˜-Š’òŠ}˜M‹˜m˜Š}˜b˜Š}˜MŠ­˜Š}‹]˜­˜CÂöÆ&VÃà¢Æ–çWB ¢G—SÒ'FW‡B" ¢Æ6V†öÆFW#Ò-˜]Š½Š}˜C¢ŠÝ˜¢Š}˜M˜-‹]Š}‹]˜­Š‚ÒŠÍŠŠ}˜M˜­Šr" ¢fÇVS×¶VF—F–æt6×æFG&W77Ð¢öä6†ævS×²†R’Óâ6WDVF—F–æt6×‡²ââæVF—F–æt6×ÂFG&W73¢RçF&vWBçfÇVRÒ—Ð¢7G–ÆS×·²v–GFƒ¢#R"ÂFF–æs¢#‚G‚"Â&÷&FW#¢#ãW‚6öÆ–B66&CVS"Â&÷&FW%&F—W3¢#‚"ÂföçE6—¦S¢#ã“'&VÒ"Â&÷…6—¦–æs¢&&÷&FW"Ö&÷‚"Â÷WFÆ–æS¢&æöæR"×Ð¢óà¢ÂöF—cà ¢ÆF—b7G–ÆS×·²&6¶w&÷VæC¢'&v&ƒ3rÂ“’Â#3RÂãR’"Â&÷&FW#¢#‚6öÆ–B&v&ƒ3rÂ“’Â#3RÂã"’"Â&÷&FW%&F—W3¢#'‚"ÂFF–æs¢#&VÒ"ÂÖ&v–åF÷¢#G‚"×Óà¢ÆƒB7G–ÆS×·²föçE6—¦S¢#ã—&VÒ"Â6öÆ÷#¢"3#Sc6V""ÂÖ&v–ã¢#‚"ÂföçEvV–v‡C¢#ƒ"×Óï	ùIŠ­‹Šý˜­˜BŠ˜­Š}˜mŠ}Š¢Š­‹=ŠÍ˜­˜BŠýŠí˜˜B˜]Šý˜­‹Š}˜M˜]Ší˜­˜RŠÝ‹=Š}Š‚Š}˜M˜M˜ŠÝŠ’“ÂöƒCà¢ÆF—b7G–ÆS×·²F—7Æ“¢&w&–B"Âw&–EFV×ÆFT6öÇVÖç3¢#g"g""Âv¢#G‚"×Óà¢ÆF—cà¢ÆÆ&VÂ7G–ÆS×·²F—7Æ“¢&&Æö6²"ÂföçEvV–v‡C¢#s"ÂföçE6—¦S¢#ãƒ'&VÒ"Â6öÆ÷#¢"333CSR"ÂÖ&v–ä&÷GFöÓ¢#g‚"×ÓíŠ}‹=˜RŠ}˜M˜]‹=Š­ŠíŠý˜R˜M˜M˜ŠÝŠ’£ÂöÆ&VÃà¢Æ–çWB ¢G—SÒ'FW‡B" ¢Æ6V†öÆFW#Ò-Š}‹=˜RŠ}˜M˜]‹=Š­ŠíŠý˜R" ¢fÇVS×¶VF—F–æt6×æFÖ–åW6W&æÖWÐ¢öä6†ævS×²†R’Óâ6WDVF—F–æt6×‡²ââæVF—F–æt6×ÂFÖ–åW6W&æÖS¢RçF&vWBçfÇVRÒ—Ð¢&WV—&VB ¢7G–ÆS×·²v–GFƒ¢#R"ÂFF–æs¢#—‚'‚"Â&÷&FW#¢#ãW‚6öÆ–B66&CVS"Â&÷&FW%&F—W3¢#‡‚"ÂföçE6—¦S¢#ã—&VÒ"Â&÷…6—¦–æs¢&&÷&FW"Ö&÷‚"Â&6¶w&÷VæD6öÆ÷#¢'v†—FR"×Ð¢óà¢ÂöF—cà¢ÆF—cà¢ÆÆ&VÂ7G–ÆS×·²F—7Æ“¢&&Æö6²"ÂföçEvV–v‡C¢#s"ÂföçE6—¦S¢#ãƒ'&VÒ"Â6öÆ÷#¢"333CSR"ÂÖ&v–ä&÷GFöÓ¢#g‚"×Óí˜=˜M˜]Š’Š}˜M˜]‹˜‹Š}˜MŠÍŠý˜­ŠýŠ’£ÂöÆ&VÃà¢Æ–çWB ¢G—SÒ'FW‡B" ¢Æ6V†öÆFW#Ò-˜=˜M˜]Š’Š}˜M˜]‹˜‹" ¢fÇVS×¶VF—F–æt6×æFÖ–å77v÷&GÐ¢öä6†ævS×²†R’Óâ6WDVF—F–æt6×‡²ââæVF—F–æt6×ÂFÖ–å77v÷&C¢RçF&vWBçfÇVRÒ—Ð¢&WV—&VB ¢7G–ÆS×·²v–GFƒ¢#R"ÂFF–æs¢#—‚'‚"Â&÷&FW#¢#ãW‚6öÆ–B66&CVS"Â&÷&FW%&F—W3¢#‡‚"ÂföçE6—¦S¢#ã—&VÒ"Â&÷…6—¦–æs¢&&÷&FW"Ö&÷‚"Â&6¶w&÷VæD6öÆ÷#¢'v†—FR"×Ð¢óà¢ÂöF—cà¢ÂöF—cà¢ÂöF—cà¢ÂöF—cà ¢ÆF—b6Æ74æÖSÒ&ÖöFÂÖfö÷FW""7G–ÆS×·²F—7Æ“¢&fÆW‚"Â§W7F–g”6öçFVçC¢&fÆW‚ÖVæB"Âv¢#'‚"ÂÖ&v–åF÷¢#ãW&VÒ"ÂFF–æuF÷¢#&VÒ"Â&÷&FW%F÷¢#‚6öÆ–B6S&S†c"×Óà¢Æ'WGFöâG—SÒ&'WGFöâ"öä6Æ–6³×²‚’Óâ6WD—4VF—D6×ÖöFÄ÷Vâ†fÇ6R—Ò7G–ÆS×·²&6¶w&÷VæC¢"6ccVc’"Â6öÆ÷#¢"3CsSSc’"Â&÷&FW#¢#‚6öÆ–B66&CVS"ÂFF–æs¢#—‚#‚"Â&÷&FW%&F—W3¢#‚"ÂföçEvV–v‡C¢#s"Â7W'6÷#¢'ö–çFW""ÂföçE6—¦S¢#ã—&VÒ"×ÓíŠ]˜M‹­Š}ŠÂö'WGFöãà¢Æ'WGFöâG—SÒ'7V&Ö—B"7G–ÆS×·²&6¶w&÷VæC¢&Æ–æV"Öw&F–VçBƒ3VFVrÂ3#Sc6V"RÂ3CFVC‚R’"Â6öÆ÷#¢'v†—FR"Â&÷&FW#¢&æöæR"ÂFF–æs¢#—‚#G‚"Â&÷&FW%&F—W3¢#‚"ÂföçEvV–v‡C¢#ƒ"Â7W'6÷#¢'ö–çFW""ÂföçE6—¦S¢#ã—&VÒ"Â&÷…6†F÷s¢#G‚'‚&v&ƒ3rÂ“’Â#3RÂã2’"×ÓíŠÝ˜‹‚Š}˜MŠ­‹Šý˜­˜MŠ}Š¢Š}˜MŠ}˜cÂö'WGFöãà¢ÂöF—cà¢Âöf÷&Óà¢—Ð¢ÂöF—cà¢ÂöF—cà¢—Ð¢ÂöF—cà¢“°§Ó° ¦W‡÷'BFVfVÇB7WW$FÖ–ã°