import crypto from "crypto";

/**
 * التشفير الآمن لكلمات المرور باستخدام PBKDF2 مع Salt عشوائي
 * النمط المخزن: pbkdf2:10000:<salt_hex>:<hash_hex>
 */
export function hashPassword(password) {
  if (!password) return "";
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 10000;
  const hash = crypto
    .pbkdf2Sync(password, salt, iterations, 32, "sha256")
    .toString("hex");
  return `pbkdf2:${iterations}:${salt}:${hash}`;
}

/**
 * التحقق من كلمة المرور مع مقارنة آمنة زمنيًا تمنع هجمات التوقيت
 */
export function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;

  if (storedHash.startsWith("pbkdf2:")) {
    const parts = storedHash.split(":");
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const originalHashHex = parts[3];

    const hashToVerify = crypto
      .pbkdf2Sync(password, salt, iterations, 32, "sha256")
      .toString("hex");

    return crypto.timingSafeEqual(
      Buffer.from(hashToVerify, "hex"),
      Buffer.from(originalHashHex, "hex")
    );
  }

  // التوافق مع الحسابات القديمة المكتوبة بصيغة plaintext لمطابقتها مرة واحدة
  return password === storedHash;
}
