import { dbInsertOne } from "./db";

/**
 * تسجيل وتوثيق عملية إدارية لحماية البيانات والامتثال الإنساني
 */
export async function logAuditEvent({
  userId = "system",
  username = "system",
  action,
  targetType = "general",
  targetId = "",
  details = {},
  ipAddress = "127.0.0.1",
}) {
  try {
    const logRecord = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      username,
      action,
      targetType,
      targetId,
      details,
      ipAddress,
      createdAt: new Date().toISOString(),
    };

    await dbInsertOne("auditLogs", logRecord);
    return logRecord;
  } catch (error) {
    console.error("[Audit Logger] Failed to write log:", error);
    return null;
  }
}
