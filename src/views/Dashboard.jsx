"use client";

import React, { useState } from "react";
import Link from "next/link";
import { exportToExcel, exportNominationsToExcel } from "../utils/exportExcel";
import { exportToPDF } from "../utils/exportPDF";
import { addFamily } from "../services/familyService";
import FamilyForm from "../components/FamilyForm";
import AnimatedNumber from "../components/AnimatedNumber";
import {
  FaArrowLeft,
  FaBaby,
  FaChartBar,
  FaChartPie,
  FaChild,
  FaClipboardList,
  FaFemale,
  FaFileExcel,
  FaFilePdf,
  FaGraduationCap,
  FaHandsHelping,
  FaHeartbeat,
  FaHome,
  FaPlus,
  FaUserFriends,
  FaUsers,
  FaWheelchair,
} from "react-icons/fa";

const Dashboard = ({ families = [], nominations = [], user, campProfile }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const isPositive = (value) => value === 1 || value === "1" || value === true || value === "true" || value === "نعم";

  const totalFamilies = families.length;
  const totalMembers = families.reduce((sum, family) => sum + (parseInt(family.membersCount) || 0), 0);
  const avgFamilySize = totalFamilies > 0 ? (totalMembers / totalFamilies).toFixed(1) : 0;
  const totalNominations = nominations.length;
  const totalNominationMembers = nominations.reduce((sum, nomination) => sum + (parseInt(nomination.membersCount) || 0), 0);

  const countDisabled = nominations.filter((item) => isPositive(item.hasDisabled)).length;
  const countChronic = nominations.filter((item) => isPositive(item.hasChronicDisease)).length;
  const countPregnant = nominations.filter((item) => isPositive(item.isLactatingOrPregnant)).length;
  const countFemaleHeaded = nominations.filter((item) => isPositive(item.isFemaleHeaded)).length;

  const familiesWithSpecialCases = nominations.filter((item) =>
    isPositive(item.hasDisabled)
    || isPositive(item.hasChronicDisease)
    || isPositive(item.isLactatingOrPregnant)
    || isPositive(item.isFemaleHeaded)
  ).length;

  const totalSpecialCases = countDisabled + countChronic + countPregnant + countFemaleHeaded;

  const getNumVal = (item, ...keys) => {
    for (const key of keys) {
      if (item && item[key] !== undefined && item[key] !== null && item[key] !== "") {
        const parsed = parseInt(item[key]);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    return 0;
  };

  let age_0_2 = nominations.reduce((sum, item) =>
    sum + getNumVal(item, "age_0_2_male", "age02Male", "age_0_2_m") + getNumVal(item, "age_0_2_female", "age02Female", "age_0_2_f"), 0);
  let age_3_5 = nominations.reduce((sum, item) =>
    sum + getNumVal(item, "age_3_5_male", "age35Male", "age_3_5_m") + getNumVal(item, "age_3_5_female", "age35Female", "age_3_5_f"), 0);
  let age_6_18 = nominations.reduce((sum, item) =>
    sum + getNumVal(item, "age_6_18_male", "age618Male", "age_6_18_m") + getNumVal(item, "age_6_18_female", "age618Female", "age_6_18_f"), 0);
  let age_19_60 = nominations.reduce((sum, item) =>
    sum + getNumVal(item, "age_19_60_male", "age1960Male", "age_19_60_m") + getNumVal(item, "age_19_60_female", "age1960Female", "age_19_60_f"), 0);
  let age_over_60 = nominations.reduce((sum, item) =>
    sum + getNumVal(item, "age_over_60_male", "ageOver60Male", "age_over_60_m") + getNumVal(item, "age_over_60_female", "ageOver60Female", "age_over_60_f"), 0);

  const sumAgeFields = age_0_2 + age_3_5 + age_6_18 + age_19_60 + age_over_60;

  if (sumAgeFields === 0 && totalNominationMembers > 0) {
    nominations.forEach((item) => {
      const membersCount = parseInt(item.membersCount) || 1;
      const status = (item.status || "").trim();
      const isSingleParent = status.includes("أرمل") || status.includes("أعزب") || status.includes("مطلق");
      const parentsCount = isSingleParent ? 1 : Math.min(membersCount, 2);
      const childrenCount = Math.max(0, membersCount - parentsCount);
      let isElderly = false;

      if (item.dob) {
        const year = parseInt(item.dob.substring(0, 4));
        isElderly = !isNaN(year) && (2026 - year) >= 60;
      }

      if (isElderly) age_over_60 += parentsCount;
      else age_19_60 += parentsCount;

      const age02 = Math.round(childrenCount * 0.15);
      const age35 = Math.round(childrenCount * 0.25);
      age_0_2 += age02;
      age_3_5 += age35;
      age_6_18 += Math.max(0, childrenCount - age02 - age35);
    });
  }

  const grandAgeTotal = age_0_2 + age_3_5 + age_6_18 + age_19_60 + age_over_60 || totalNominationMembers || 1;
  const totalChildrenCount = age_0_2 + age_3_5 + age_6_18;
  const totalAdultsCount = age_19_60 + age_over_60;

  // 1. عدد الأيتام
  const countOrphans = 
    families.filter((f) => (f.status || "").includes("يتيم")).length ||
    nominations.filter((n) => (n.status || "").includes("يتيم")).length || 0;

  // 2. عدد الأرامل
  const countWidows = 
    families.filter((f) => (f.status || "").includes("أرمل")).length ||
    nominations.filter((n) => (n.status || "").includes("أرمل") || isPositive(n.isFemaleHeaded)).length || 0;

  // 3. طلاب المدارس (7 - 18 سنة / 6 - 18 سنة)
  const countSchoolStudents = age_6_18;

  const percentSpecial = totalNominations > 0 ? Math.min(100, Math.round((familiesWithSpecialCases / totalNominations) * 100)) : 0;
  const percentChildren = grandAgeTotal > 0 ? Math.round((totalChildrenCount / grandAgeTotal) * 100) : 0;
  const percentCoverage = totalFamilies > 0 ? Math.min(100, Math.round((totalNominations / totalFamilies) * 100)) : (totalNominations > 0 ? 100 : 0);
  const percentAdults = grandAgeTotal > 0 ? Math.round((totalAdultsCount / grandAgeTotal) * 100) : 0;

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAddFamily = async (formData) => {
    try {
      await addFamily(user.campId, formData);
      setIsFormOpen(false);
      showNotification("تمت إضافة العائلة وحفظها في قاعدة البيانات.");
    } catch (error) {
      console.error("Error adding family:", error);
      showNotification("تعذر حفظ العائلة. تحقق من الاتصال ثم أعد المحاولة.", "error");
    }
  };

  const latestFamilies = [...families].reverse().slice(0, 5);
  const ratios = [
    { label: "تغطية الترشيحات", value: percentCoverage, detail: `${totalNominations} من ${totalFamilies} عائلة` },
    { label: "الأطفال والطلبة", value: percentChildren, detail: `${totalChildrenCount} من ${grandAgeTotal} فرد` },
    { label: "البالغون وكبار السن", value: percentAdults, detail: `${totalAdultsCount} من ${grandAgeTotal} فرد` },
    { label: "أسر ذات أولوية", value: percentSpecial, detail: `${familiesWithSpecialCases} حالة أسرية` },
  ];
  const priorityCases = [
    { label: "ذوو إعاقة", value: countDisabled, icon: FaWheelchair },
    { label: "أمراض مزمنة", value: countChronic, icon: FaHeartbeat },
    { label: "حوامل أو مرضعات", value: countPregnant, icon: FaBaby },
    { label: "أسر تعيلها امرأة", value: countFemaleHeaded, icon: FaFemale },
  ];
  const ageGroups = [
    { label: "حتى سنتين", value: age_0_2 },
    { label: "3–5 سنوات", value: age_3_5 },
    { label: "6–18 سنة (التعليم المدرسي)", value: age_6_18 },
    { label: "19–60 سنة", value: age_19_60 },
    { label: "أكثر من 60 سنة", value: age_over_60 },
  ].map((group) => ({ ...group, percent: Math.round((group.value / (grandAgeTotal || 1)) * 100) }));

  return (
    <div className="dashboard-container">
      {notification && (
        <div className={`notification-toast ${notification.type}`} role={notification.type === "error" ? "alert" : "status"}>
          {notification.message}
        </div>
      )}

      <header className="dashboard-header">
        <div className="welcome-section">
          <img
            src={campProfile?.logoUrl || "/logo.jpg"}
            alt={`شعار ${campProfile?.name || "المخيم"}`}
            className="dashboard-logo"
            onError={(event) => {
              if (!event.currentTarget.src.endsWith("/logo.jpg")) event.currentTarget.src = "/logo.jpg";
              else event.currentTarget.style.display = "none";
            }}
          />
          <div className="dashboard-heading-copy">
            <span className="dashboard-context">لوحة المخيم</span>
            <h1>{campProfile?.name || "نظام إدارة المخيمات"}</h1>
            <p>ملخص السجلات والترشيحات والإجراءات الأكثر استخدامًا.</p>
          </div>
        </div>
        <button onClick={() => setIsFormOpen(true)} className="btn btn-primary dashboard-primary-action">
          <FaPlus aria-hidden="true" /> إضافة عائلة
        </button>
      </header>

      {/* 1. شبكة الإحصاءات العامة */}
      <section className="stats-grid" aria-label="الإحصاءات الأساسية">
        <article className="stat-card stat-card--primary">
          <FaUsers className="stat-card-symbol" aria-hidden="true" />
          <span className="stat-title">العائلات المسجلة</span>
          <strong className="stat-value"><AnimatedNumber value={totalFamilies} /></strong>
          <span className="stat-desc">سجل عائلي نشط</span>
        </article>
        <article className="stat-card">
          <FaUserFriends className="stat-card-symbol" aria-hidden="true" />
          <span className="stat-title">إجمالي الأفراد</span>
          <strong className="stat-value"><AnimatedNumber value={totalMembers} /></strong>
          <span className="stat-desc">متوسط الأسرة {avgFamilySize}</span>
        </article>
        <article className="stat-card">
          <FaClipboardList className="stat-card-symbol" aria-hidden="true" />
          <span className="stat-title">الترشيحات</span>
          <strong className="stat-value"><AnimatedNumber value={totalNominations} /></strong>
          <span className="stat-desc">تشمل {totalNominationMembers} فردًا</span>
        </article>
        <article className="stat-card stat-card--attention">
          <FaHome className="stat-card-symbol" aria-hidden="true" />
          <span className="stat-title">حالات الأولوية</span>
          <strong className="stat-value"><AnimatedNumber value={totalSpecialCases} /></strong>
          <span className="stat-desc">بحاجة للمتابعة</span>
        </article>
      </section>

      {/* 2. شبكة إحصاءات الطفولة والفئات الخاصة والتعليم (جديدة) */}
      <section className="stats-demographics-container" aria-label="إحصاءات الطفولة والتعليم والفئات الخاصة" style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "10px" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--primary-dark)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <FaChild style={{ color: "#059669" }} aria-hidden="true" /> مؤشرات الطفولة، الأرامل، الأيتام، والتعليم
          </h2>
          <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "700", background: "#f1f5f9", padding: "4px 10px", borderRadius: "20px" }}>
            تحديث تلقائي وفوري
          </span>
        </div>

        <div className="stats-grid" style={{ marginBottom: 0 }}>
          <article className="stat-card" style={{ borderRight: "4px solid #d97706" }}>
            <div className="stat-icon-wrapper gold">
              <FaHandsHelping aria-hidden="true" />
            </div>
            <div className="stat-details">
              <span className="stat-title">عدد الأيتام</span>
              <strong className="stat-value" style={{ color: "#d97706" }}><AnimatedNumber value={countOrphans} /></strong>
              <span className="stat-desc">أسر فاقدة للمعيل</span>
            </div>
          </article>

          <article className="stat-card" style={{ borderRight: "4px solid #059669" }}>
            <div className="stat-icon-wrapper green">
              <FaChild aria-hidden="true" />
            </div>
            <div className="stat-details">
              <span className="stat-title">إجمالي الأطفال</span>
              <strong className="stat-value" style={{ color: "#059669" }}><AnimatedNumber value={totalChildrenCount} /></strong>
              <span className="stat-desc">دون 18 سنة ({percentChildren}٪ من الأفراد)</span>
            </div>
          </article>

          <article className="stat-card" style={{ borderRight: "4px solid #8b5cf6" }}>
            <div className="stat-icon-wrapper" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6" }}>
              <FaFemale aria-hidden="true" />
            </div>
            <div className="stat-details">
              <span className="stat-title">عدد الأرامل</span>
              <strong className="stat-value" style={{ color: "#8b5cf6" }}><AnimatedNumber value={countWidows} /></strong>
              <span className="stat-desc">أسر ترعاها أرامل</span>
            </div>
          </article>

          <article className="stat-card" style={{ borderRight: "4px solid #2563eb" }}>
            <div className="stat-icon-wrapper blue">
              <FaGraduationCap aria-hidden="true" />
            </div>
            <div className="stat-details">
              <span className="stat-title">طلاب المدارس (7–18 سنة)</span>
              <strong className="stat-value" style={{ color: "#2563eb" }}><AnimatedNumber value={countSchoolStudents} /></strong>
              <span className="stat-desc">الفئة المدرسية الأساسية</span>
            </div>
          </article>
        </div>
      </section>

      <div className="dashboard-overview-grid">
        <section className="dashboard-panel ratios-panel">
          <header className="panel-heading">
            <div><FaChartPie aria-hidden="true" /><h2>مؤشرات التغطية</h2></div>
            <span>من السجلات الحالية</span>
          </header>
          <div className="ratio-list">
            {ratios.map((ratio) => (
              <div className="ratio-row" key={ratio.label}>
                <div className="ratio-meta">
                  <span>{ratio.label}</span>
                  <strong style={{ direction: "ltr", display: "inline-block" }}>{ratio.value}%</strong>
                </div>
                <div className="ratio-track" aria-hidden="true">
                  <span style={{ width: `${Math.min(Math.max(ratio.value, 0), 100)}%` }} />
                </div>
                <small>{ratio.detail}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-panel priority-panel">
          <header className="panel-heading">
            <div><FaHeartbeat aria-hidden="true" /><h2>حالات تحتاج متابعة</h2></div>
            <span>{totalSpecialCases} حالة مسجلة</span>
          </header>
          <div className="priority-list">
            {priorityCases.map(({ label, value, icon: Icon }) => (
              <div className="priority-row" key={label}>
                <span className="priority-icon"><Icon aria-hidden="true" /></span>
                <span style={{ flex: 1 }}>{label}</span>
                <strong style={{ color: "#ef4444", fontSize: "1.1rem" }}><AnimatedNumber value={value} /></strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="dashboard-panel demographics-panel">
        <header className="panel-heading panel-heading--split">
          <div><FaChartBar aria-hidden="true" /><h2>التوزيع العمري للأفراد</h2></div>
          <span>إجمالي المحصين: {grandAgeTotal}</span>
        </header>
        <div className="age-list">
          {ageGroups.map((group) => (
            <div className="age-row" key={group.label}>
              <div className="age-row-meta">
                <span>{group.label}</span>
                <strong style={{ direction: "ltr", display: "inline-block" }}>{group.value} فرد ({group.percent}%)</strong>
              </div>
              <div className="age-track" aria-hidden="true">
                <span style={{ width: `${Math.min(Math.max(group.percent, 0), 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-panel reports-panel">
        <header className="panel-heading">
          <div><FaFilePdf aria-hidden="true" /><h2>الكشوفات والتقارير</h2></div>
          <span>ملفات منسقة باسم المخيم</span>
        </header>
        <div className="report-actions-grid">
          <button onClick={() => exportToExcel(families, campProfile)} className="report-action" disabled={families.length === 0}>
            <FaFileExcel aria-hidden="true" /><span><strong>كشف الأسر · Excel</strong><small>ملف قابل للتعديل</small></span>
          </button>
          <button onClick={() => exportToPDF(families, "families", campProfile)} className="report-action" disabled={families.length === 0}>
            <FaFilePdf aria-hidden="true" /><span><strong>كشف الأسر · PDF</strong><small>نسخة جاهزة للطباعة</small></span>
          </button>
          <button onClick={() => exportNominationsToExcel(nominations, campProfile)} className="report-action" disabled={nominations.length === 0}>
            <FaFileExcel aria-hidden="true" /><span><strong>الترشيحات · Excel</strong><small>تفاصيل وأعمار المستفيدين</small></span>
          </button>
          <button onClick={() => exportToPDF(nominations, "nominations", campProfile)} className="report-action" disabled={nominations.length === 0}>
            <FaFilePdf aria-hidden="true" /><span><strong>الترشيحات · PDF</strong><small>تقرير رسمي للطباعة</small></span>
          </button>
        </div>
      </section>

      <section className="dashboard-panel latest-families-section">
        <header className="latest-header">
          <div>
            <h2>آخر العائلات المضافة</h2>
            <p>أحدث خمسة سجلات في المخيم.</p>
          </div>
          <Link href="/families" className="btn-link">إدارة العائلات <FaArrowLeft aria-hidden="true" /></Link>
        </header>

        {latestFamilies.length > 0 ? (
          <div className="table-responsive">
            <table className="latest-table">
              <thead>
                <tr><th>رب الأسرة</th><th>الهاتف</th><th>السكن</th><th>الأفراد</th><th>تاريخ الإضافة</th></tr>
              </thead>
              <tbody>
                {latestFamilies.map((family) => (
                  <tr key={family.id}>
                    <td data-label="رب الأسرة"><strong>{family.name}</strong></td>
                    <td data-label="الهاتف">{family.phone || "—"}</td>
                    <td data-label="السكن">{family.location || "—"}</td>
                    <td data-label="الأفراد"><span className="badge-members">{family.membersCount || 0}</span></td>
                    <td data-label="تاريخ الإضافة">{family.createdAt ? new Date(family.createdAt).toLocaleDateString("ar-EG") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-latest">
            <FaUsers aria-hidden="true" />
            <h3>لا توجد عائلات مسجلة بعد.</h3>
            <p>ابدأ بإضافة أول عائلة ليظهر ملخص البيانات هنا.</p>
            <button onClick={() => setIsFormOpen(true)} className="btn btn-secondary">إضافة أول عائلة</button>
          </div>
        )}
      </section>

      <FamilyForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSave={handleAddFamily} family={null} />
    </div>
  );
};

export default Dashboard;
