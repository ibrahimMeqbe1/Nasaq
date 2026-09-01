import { NextResponse } from "next/server";
import { dbFind } from "../../../../lib/db";
import { requireSuperAdmin } from "../../../../lib/adminAuth";

export async function GET(request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "غير مصرح لك بالوصول" }, { status: 403 });
    }

    const [camps, users, families, nominations, renewalRequests] = await Promise.all([
      dbFind("camps"),
      dbFind("users"),
      dbFind("families"),
      dbFind("nominations"),
      dbFind("payment_requests").catch(() => []),
    ]);

    const now = new Date();
    let activeCamps = 0;
    let expiredCamps = 0;

    camps.forEach((c) => {
      const expiry = c.subscriptionExpiry ? new Date(c.subscriptionExpiry) : null;
      const isExpired = !c.isActive || (expiry && !isNaN(expiry) && expiry < now);
      if (isExpired) expiredCamps++;
      else activeCamps++;
    });

    const totalFamilies = families.length;
    const totalMembers = families.reduce((sum, f) => sum + (parseInt(f.membersCount || f.members_count) || 1), 0);
    const totalNominations = nominations.length;
    const totalNominationMembers = nominations.reduce((sum, n) => sum + (parseInt(n.membersCount || n.members_count) || 1), 0);

    const pendingRequests = (renewalRequests || []).filter((r) => r.status === "pending").length;

    // معايير الهشاشة والفئات الخاصة
    const isPositive = (val) => val === 1 || val === "1" || val === true || val === "true" || val === "نعم";

    let familiesWithSpecialCases = 0;
    let countDisabled = 0;
    let countChronic = 0;
    let countPregnantOrLactating = 0;
    let countFemaleHeaded = 0;
    let countChildHeaded = 0;
    let countOrphans = 0;
    let countWidows = 0;

    const getNum = (obj, ...keys) => {
      for (const k of keys) {
        if (obj?.[k] !== undefined && obj[k] !== null && obj[k] !== "") {
          const val = parseInt(obj[k]);
          if (!isNaN(val) && val > 0) return val;
        }
      }
      return 0;
    };

    let age_0_2 = 0;
    let age_3_5 = 0;
    let age_6_18 = 0;
    let age_19_60 = 0;
    let age_over_60 = 0;

    nominations.forEach((n) => {
      const hasDis = isPositive(n.hasDisabled || n.has_disabled);
      const hasChr = isPositive(n.hasChronicDisease || n.has_chronic_disease);
      const isPreg = isPositive(n.isLactatingOrPregnant || n.is_lactating_or_pregnant);
      const isFemH = isPositive(n.isFemaleHeaded || n.is_female_headed);
      const isChdH = isPositive(n.isChildHeaded || n.is_child_headed);

      if (hasDis) countDisabled++;
      if (hasChr) countChronic++;
      if (isPreg) countPregnantOrLactating++;
      if (isFemH) countFemaleHeaded++;
      if (isChdH) countChildHeaded++;

      const statusStr = String(n.status || "");
      if (statusStr.includes("أرمل") || statusStr.includes("ارمل") || isFemH) countWidows++;
      if (statusStr.includes("يتيم") || isChdH) countOrphans++;

      if (hasDis || hasChr || isPreg || isFemH || isChdH) {
        familiesWithSpecialCases++;
      }

      age_0_2 += getNum(n, "age_0_2_male", "age02Male") + getNum(n, "age_0_2_female", "age02Female");
      age_3_5 += getNum(n, "age_3_5_male", "age35Male") + getNum(n, "age_3_5_female", "age35Female");
      age_6_18 += getNum(n, "age_6_18_male", "age618Male") + getNum(n, "age_6_18_female", "age618Female");
      age_19_60 += getNum(n, "age_19_60_male", "age1960Male") + getNum(n, "age_19_60_female", "age1960Female");
      age_over_60 += getNum(n, "age_over_60_male", "ageOver60Male") + getNum(n, "age_over_60_female", "ageOver60Female");
    });

    const totalChildrenCount = age_0_2 + age_3_5 + age_6_18;
    const totalAdultsCount = age_19_60;
    const totalSeniorsCount = age_over_60;
    const grandAgeTotal = totalChildrenCount + totalAdultsCount + totalSeniorsCount || totalNominationMembers || totalMembers;

    const percentSpecial = totalNominations > 0 ? Math.round((familiesWithSpecialCases / totalNominations) * 100) : 0;
    const percentChildren = grandAgeTotal > 0 ? Math.round((totalChildrenCount / grandAgeTotal) * 100) : 0;
    const percentAdults = grandAgeTotal > 0 ? Math.round((totalAdultsCount / grandAgeTotal) * 100) : 0;
    const percentCoverage = totalFamilies > 0 ? Math.round((totalNominations / totalFamilies) * 100) : 0;

    const stats = {
      totalCamps: camps.length,
      activeCamps,
      expiredCamps,
      totalUsers: users.length,
      activeUsersCount: activeCamps,
      totalFamilies,
      totalMembers,
      totalNominations,
      totalNominationMembers,
      pendingRequests,
      totalRequests: (renewalRequests || []).length,
    };

    const metrics = {
      familiesWithSpecialCases,
      countDisabled,
      countChronic,
      countPregnantOrLactating,
      countFemaleHeaded,
      countChildHeaded,
      countOrphans,
      countWidows,
      totalChildrenCount,
      totalAdultsCount,
      totalSeniorsCount,
      grandAgeTotal,
      totalFamiliesCount: totalFamilies,
      totalNominationsCount: totalNominations,
      percentSpecial,
      percentChildren,
      percentAdults,
      percentCoverage,
      age_0_2,
      age_3_5,
      age_6_18,
      age_19_60,
      age_over_60,
    };

    return NextResponse.json({
      success: true,
      stats,
      metrics,
    });
  } catch (error) {
    console.error("Error in admin stats API:", error);
    return NextResponse.json({ error: "فشل جلب إحصائيات النظام" }, { status: 500 });
  }
}
