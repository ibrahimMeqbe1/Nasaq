import bcrypt from "bcryptjs";
import crypto from "crypto";

const SALT_ROUNDS = 10;

/**
 * التشفير الآمن لكلمات المرور باستخدام bcryptjs (سريع ومتوافق 100% مع Vercel/Next.js)
 */
export function hashPassword(password) {
  if (!password) return "";
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

/**
 * التحقق من كلمة المرور مع دعم bcryptjs وتوافق مع الحسابات القديمة (pbkdf2 و plaintext)
 */
export function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;

  // 1. التوافق مع تشفير bcryptjs ($2a$, $2b$, $2y$)
  if (
    storedHash.startsWith("$2a$") ||
    storedHash.startsWith("$2b$") ||
    storedHash.startsWith("$2y$")
  ) {
    try {
      return bcrypt.compareSync(password, storedHash);
    } catch {
      return false;
    }
  }

  // 2. التوافق مع التشفير القديم pbkdf2
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

  // 3. التوافق مع الحسابات القديمة المكتوبة بصيغة Plaintext
  return password === storedHash;
}

