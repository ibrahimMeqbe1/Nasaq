import {
  dbFind,
  dbFindOne,
  dbInsertOne,
  dbDeleteMany,
  dbInsertMany,
  dbUpdateOne,
} from "./db.js";

/**
 * إنشاء نسخة احتياطية لكافة بيانات وسجلات المخيم أو للنظام بالكامل مع التاريخ والوقت
 */
export async function createBackupSnapshot(campId = null, type = "manual") {
  const now = new Date();
  const timestamp = now.toISOString();
  const backupDate = timestamp.split("T")[0];
  const backupTime = now.toTimeString().split(" ")[0]; // HH:mm:ss
  const query = campId && campId !== "system" ? { campId } : {};

  const [camps, families, nominations, users, announcements, paymentMethods, paymentRequests, auditLogs] = await Promise.all([
    campId && campId !== "system" ? dbFind("camps", { id: campId }) : dbFind("camps", {}),
    dbFind("families", query),
    dbFind("nominations", query),
    campId && campId !== "system" ? dbFind("users", { campId }) : dbFind("users", {}),
    dbFind("announcements", {}),
    dbFind("paymentMethods", {}),
    campId && campId !== "system" ? dbFind("paymentRequests", { campId }) : dbFind("paymentRequests", {}),
    dbFind("audit_logs", {}),
  ]);

  const currentCamp = camps[0] || {};
  const campName = currentCamp.name || campId || "كافة المخيمات";

  const totalMembers = families.reduce((sum, f) => sum + (parseInt(f.membersCount) || 1), 0);

  const sanitizedUsers = users.map((u) => {
    const copy = { ...u };
    delete copy.passwordHash;
    return copy;
  });

  const snapshot = {
    version: "1.0.0",
    platform: "نَسَق | المنصة الشاملة لإدارة المخيمات والاستجابة الإنسانية",
    campId: campId || "all",
    campName,
    backupId: `backup_${Date.now()}_${campId || "all"}`,
    backupDate,
    backupTime,
    timestamp,
    type,
    summary: {
      totalCamps: camps.length,
      totalFamilies: families.length,
      totalBeneficiaries: totalMembers,
      totalNominations: nominations.length,
      totalAnnouncements: announcements.length,
      totalPaymentRequests: paymentRequests.length,
      totalAuditLogs: auditLogs.length,
      totalUsers: sanitizedUsers.length,
    },
    data: {
      camps,
      families,
      nominations,
      users: sanitizedUsers,
      announcements,
      paymentMethods,
      paymentRequests,
      auditLogs,
    },
  };

  const backupRecord = {
    id: snapshot.backupId,
    campId: campId || "all",
    campName,
    type,
    backupDate,
    backupTime,
    timestamp,
    summary: snapshot.summary,
    snapshot,
    createdAt: timestamp,
  };

  await dbInsertOne("backups", backupRecord);

  return backupRecord;
}

/**
 * فحص وتنفيذ النسخ الاحتياطي التلقائي الأسبوعي
 */
export async function checkAndRunAutoWeeklyBackup(campId) {
  if (!campId || campId === "system") return null;

  try {
    const recentBackups = await dbFind(
      "backups",
      { campId },
      { timestamp: -1 },
      1
    );

    const lastBackup = recentBackups[0];
    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    if (!lastBackup || now - new Date(lastBackup.timestamp).getTime() > SEVEN_DAYS_MS) {
      console.log(`[Backup Engine] Triggering weekly auto-backup for camp: ${campId}`);
      return await createBackupSnapshot(campId, "weekly");
    }

    return null;
  } catch (error) {
    console.error("[Backup Engine] Auto-backup error:", error);
    return null;
  }
}

/**
 * استرجاع قائمة النسخ الاحتياطية لمخيم
 */
export async function listCampBackups(campId) {
  const query = campId && campId !== "system" ? { campId: { $in: [campId, "all"] } } : {};
  const backups = await dbFind("backups", query, { timestamp: -1 }, 20);

  return backups.map((b) => ({
    id: b.id,
    campId: b.campId,
    type: b.type,
    timestamp: b.timestamp,
    summary: b.summary || {},
  }));
}

/**
 * استعادة البيانات من نسخة احتياطية
 */
export async function restoreBackupSnapshot(snapshotData, targetCampId = null) {
  if (!snapshotData || !snapshotData.data) {
    throw new Error("ملف النسخة الاحتياطية غير صالح أو تالف.");
  }

  const { data, campId: snapshotCampId } = snapshotData;
  const effectiveCampId = targetCampId || snapshotCampId;

  if (effectiveCampId && effectiveCampId !== "all") {
    // 1. استعادة عائلات المخيم
    if (Array.isArray(data.families)) {
      await dbDeleteMany("families", { campId: effectiveCampId });
      const familiesToInsert = data.families.map((f) => ({ ...f, campId: effectiveCampId }));
      if (familiesToInsert.length > 0) {
        await dbInsertMany("families", familiesToInsert);
      }
    }

    // 2. استعادة ترشيحات المخيم
    if (Array.isArray(data.nominations)) {
      await dbDeleteMany("nominations", { campId: effectiveCampId });
      const nominationsToInsert = data.nominations.map((n) => ({ ...n, campId: effectiveCampId }));
      if (nominationsToInsert.length > 0) {
        await dbInsertMany("nominations", nominationsToInsert);
      }
    }

    // 3. استعادة ملف المخيم وإعداداته وشعاره
    if (Array.isArray(data.camps) && data.camps.length > 0) {
      const campRecord = data.camps.find((c) => c.id === effectiveCampId) || data.camps[0];
      if (campRecord) {
        await dbUpdateOne(
          "camps",
          { id: effectiveCampId },
          {
            name: campRecord.name,
            managerName: campRecord.managerName,
            managerPhone: campRecord.managerPhone,
            address: campRecord.address,
            logoUrl: campRecord.logoUrl || "",
          },
          { upsert: true }
        );
      }
    }

    // 4. استعادة طلبات الدفع للمخيم إن وجدت
    if (Array.isArray(data.paymentRequests) && data.paymentRequests.length > 0) {
      await dbDeleteMany("paymentRequests", { campId: effectiveCampId });
      const prToInsert = data.paymentRequests.map((p) => ({ ...p, campId: effectiveCampId }));
      await dbInsertMany("paymentRequests", prToInsert);
    }
  } else {
    // استعادة كاملة للنظام (SuperAdmin)
    if (Array.isArray(data.camps) && data.camps.length > 0) {
      await dbDeleteMany("camps", {});
      await dbInsertMany("camps", data.camps);
    }
    if (Array.isArray(data.families) && data.families.length > 0) {
      await dbDeleteMany("families", {});
      await dbInsertMany("families", data.families);
    }
    if (Array.isArray(data.nominations) && data.nominations.length > 0) {
      await dbDeleteMany("nominations", {});
      await dbInsertMany("nominations", data.nominations);
    }
    if (Array.isArray(data.announcements) && data.announcements.length > 0) {
      await dbDeleteMany("announcements", {});
      await dbInsertMany("announcements", data.announcements);
    }
    if (Array.isArray(data.paymentMethods) && data.paymentMethods.length > 0) {
      await dbDeleteMany("paymentMethods", {});
      await dbInsertMany("paymentMethods", data.paymentMethods);
    }
  }

  return {
    success: true,
    message: "تمت استعادة البيانات بنجاح من النسخة الاحتياطية.",
    summary: {
      familiesRestored: data.families?.length || 0,
      nominationsRestored: data.nominations?.length || 0,
    },
  };
}
