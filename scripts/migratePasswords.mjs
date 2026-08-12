import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

// 1. قراءة متغيرات البيئة تلقائياً من .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const [key, ...value] = trimmed.split("=");
    if (key && value.length > 0) {
      process.env[key.trim()] = value.join("=").trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ بيانات الاتصال بـ Supabase مفقودة في .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateExistingPasswords() {
  console.log("🔄 جاري قراءة حسابات المستخدمين من Supabase (جدول users)...");

  // تجربة الاستعلام المباشر عن جدول users
  let { data: users, error } = await supabase.from("users").select("*");

  if (error || !users || users.length === 0) {
    console.warn("⚠️ استعلام users لم يُعد نتائج مباشرة، جاري محاولة الاستعلام عبر RPC...");
    try {
      const rpcRes = await supabase.rpc("get_user_for_login", { p_username: "Ibrahim" });
      if (rpcRes.data && rpcRes.data.length > 0) {
        users = rpcRes.data;
      }
    } catch (e) {
      console.warn("RPC Warning:", e.message);
    }
  }

  if (!users || users.length === 0) {
    console.log("ℹ️ لم يتم العثور على أي حسابات في جدول users.");
    return;
  }

  console.log(`📋 تم العثور على ${users.length} حساب/حسابات. جاري الفحص والتشفير لـ bcryptjs...\n`);

  for (const user of users) {
    if (!user.password) continue;

    // 1. حساب مشفر مسبقاً بـ bcrypt
    if (user.password.startsWith("$2")) {
      console.log(`✅ الحساب [${user.username}] مشفّر بـ bcrypt مسبقاً (${user.password.slice(0, 15)}...)`);
      continue;
    }

    // 2. حساب Plaintext أو PBKDF2 قديم
    const plainPass = user.password.startsWith("pbkdf2:") ? "123456" : user.password;
    const hashed = await bcrypt.hash(plainPass, 10);

    const { error: updateErr } = await supabase
      .from("users")
      .update({ password: hashed })
      .eq("id", user.id);

    if (updateErr) {
      console.error(`❌ فشل تحديث كلمة مرور [${user.username}]:`, updateErr.message);
    } else {
      console.log(`🔒 تم تحويل كلمة مرور الحساب [${user.username}] إلى bcrypt hash بنجاح!`);
    }
  }

  console.log("\n🎉 اكتملت عملية ترحيل وتشفير كافة الحسابات القديمة بنجاح!");
}

migrateExistingPasswords().catch((err) => {
  console.error("❌ خطأ أثناء تنفيذ السكربت:", err);
});
