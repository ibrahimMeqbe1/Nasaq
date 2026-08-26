import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import { MongoClient } from "mongodb";

// ─── Environment & Configurations ──────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || "";
const DB_NAME = process.env.MONGODB_DB_NAME || "nasaq";

const isMongoConfigured = Boolean(
  MONGODB_URI &&
  (MONGODB_URI.startsWith("mongodb://") || MONGODB_URI.startsWith("mongodb+srv://")) &&
  !MONGODB_URI.includes("YOUR_")
);

let mongoClient = null;
let mongoClientPromise = null;

if (isMongoConfigured) {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      mongoClient = new MongoClient(MONGODB_URI);
      global._mongoClientPromise = mongoClient.connect();
    }
    mongoClientPromise = global._mongoClientPromise;
  } else {
    mongoClient = new MongoClient(MONGODB_URI);
    mongoClientPromise = mongoClient.connect();
  }
}

// ─── Production SQLite Relational Database Engine ───────────────────────────

const DB_DIR = path.join(process.cwd(), "database");
const SQLITE_FILE = path.join(DB_DIR, "nasaq_production.sqlite");

let sqliteDb = null;

function getOneYearFromNow() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString();
}

export function getSqliteDatabase() {
  if (sqliteDb) return sqliteDb;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  sqliteDb = new Database(SQLITE_FILE, { verbose: null });
  
  // Enable Write-Ahead Logging (WAL) for high concurrency and performance
  sqliteDb.pragma("journal_mode = WAL");
  sqliteDb.pragma("synchronous = NORMAL");
  sqliteDb.pragma("foreign_keys = ON");

  initializeSqliteSchema(sqliteDb);
  return sqliteDb;
}

function initializeSqliteSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS camps (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      manager_name TEXT,
      manager_phone TEXT,
      address TEXT,
      is_active INTEGER DEFAULT 1,
      subscription_expiry TEXT NOT NULL,
      logo_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'superadmin')),
      camp_id TEXT,
      name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS families (
      id TEXT PRIMARY KEY,
      camp_id TEXT NOT NULL,
      name TEXT NOT NULL,
      id_number TEXT,
      phone TEXT,
      members_count INTEGER DEFAULT 1,
      location TEXT,
      status TEXT,
      dob TEXT,
      wife_name TEXT,
      wife_id TEXT,
      wife_dob TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      FOREIGN KEY (camp_id) REFERENCES camps(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS nominations (
      id TEXT PRIMARY KEY,
      camp_id TEXT NOT NULL,
      serial_no INTEGER DEFAULT 0,
      name TEXT NOT NULL,
      id_number TEXT,
      gender TEXT DEFAULT 'ذكر',
      status TEXT DEFAULT 'متزوج',
      phone TEXT,
      phone_alt TEXT,
      wife_name TEXT,
      wife_id TEXT,
      wife_2_name TEXT,
      wife_2_id TEXT,
      members_count INTEGER DEFAULT 1,
      age_0_2_male INTEGER DEFAULT 0,
      age_0_2_female INTEGER DEFAULT 0,
      age_3_5_male INTEGER DEFAULT 0,
      age_3_5_female INTEGER DEFAULT 0,
      age_6_18_male INTEGER DEFAULT 0,
      age_6_18_female INTEGER DEFAULT 0,
      age_19_60_male INTEGER DEFAULT 0,
      age_19_60_female INTEGER DEFAULT 0,
      age_over_60_male INTEGER DEFAULT 0,
      age_over_60_female INTEGER DEFAULT 0,
      has_disabled INTEGER DEFAULT 0,
      has_chronic_disease INTEGER DEFAULT 0,
      is_lactating_or_pregnant INTEGER DEFAULT 0,
      is_female_headed INTEGER DEFAULT 0,
      is_child_headed INTEGER DEFAULT 0,
      current_address TEXT,
      original_address TEXT,
      governorate TEXT DEFAULT 'شمال غزة',
      camp_name TEXT,
      shelter_manager TEXT,
      shelter_phone TEXT,
      shelter_phone_alt TEXT,
      shelter_address TEXT,
      shelter_gps TEXT,
      dob TEXT,
      wife_dob TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      FOREIGN KEY (camp_id) REFERENCES camps(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'urgent',
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS payment_methods (
      id TEXT PRIMARY KEY,
      bank_of_palestine TEXT,
      jawwal_pay TEXT,
      pal_pay TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS payment_requests (
      id TEXT PRIMARY KEY,
      camp_id TEXT NOT NULL,
      camp_name TEXT,
      manager_name TEXT,
      manager_phone TEXT,
      requested_months INTEGER DEFAULT 12,
      receipt_url TEXT,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL,
      resolved_at TEXT,
      FOREIGN KEY (camp_id) REFERENCES camps(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS backups (
      id TEXT PRIMARY KEY,
      camp_id TEXT,
      type TEXT DEFAULT 'manual',
      timestamp TEXT NOT NULL,
      summary_json TEXT,
      snapshot_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      username TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      details_json TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_families_camp ON families(camp_id);
    CREATE INDEX IF NOT EXISTS idx_nominations_camp ON nominations(camp_id);
    CREATE INDEX IF NOT EXISTS idx_users_camp ON users(camp_id);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(lower(username));
    CREATE INDEX IF NOT EXISTS idx_backups_camp ON backups(camp_id);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
  `);

  try {
    const cols = db.prepare("PRAGMA table_info(nominations)").all();
    if (!cols.some((c) => c.name === "is_child_headed")) {
      db.prepare("ALTER TABLE nominations ADD COLUMN is_child_headed INTEGER DEFAULT 0").run();
    }
  } catch (e) {
    // Migration handled
  }

  // Seed default data if users table is empty
  const userCount = db.prepare("SELECT count(*) as count FROM users").get().count;
  if (userCount === 0) {
    seedDefaultData(db);
  }
}

function seedDefaultData(db) {
  const defaultHash = bcrypt.hashSync("123456", 10);
  const now = new Date().toISOString();
  const oneYear = getOneYearFromNow();

  const insertCamp = db.prepare(`
    INSERT INTO camps (id, name, manager_name, manager_phone, address, is_active, subscription_expiry, logo_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password_hash, role, camp_id, name, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAnnounce = db.prepare(`
    INSERT INTO announcements (id, title, content, type, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertPayMethods = db.prepare(`
    INSERT INTO payment_methods (id, bank_of_palestine, jawwal_pay, pal_pay, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const seedTransaction = db.transaction(() => {
    // 1. Camps
    insertCamp.run("kareem", "مخيم كريم", "ربيع جمال جودة", "0599099693", "حي القصاصيب - جباليا", 1, oneYear, "", now);
    insertCamp.run("zad-al-khair", "مخيم زاد الخير", "أبو سليم أحمد", "0599112233", "مخيم جباليا - وسط البلد", 1, oneYear, "", now);

    // 2. Users
    insertUser.run("user_superadmin_ibrahim", "Ibrahim", defaultHash, "superadmin", "system", "م. إبراهيم مقبل", now);
    insertUser.run("user_admin_y2000", "Y2000", defaultHash, "admin", "kareem", "مخيم كريم", now);
    insertUser.run("user_admin_i2000", "I2000", defaultHash, "admin", "kareem", "مخيم كريم", now);
    insertUser.run("user_admin_zad", "zad-admin", defaultHash, "admin", "zad-al-khair", "مخيم زاد الخير", now);

    // 3. Announcements
    insertAnnounce.run(
      "ann_default",
      "إعلان هام",
      "تنويه هام من إدارة النظام: يرجى التأكد من استكمال كافة بيانات العائلات وتصنيفات الترشيحات بدقة.",
      "urgent",
      1,
      now
    );

    // 4. Payment Methods
    insertPayMethods.run(
      "default_payments",
      "حساب بنك فلسطين: 1234567-001-9010",
      "محفظة جوال باي: 0599099693",
      "محفظة بال باي: 987654",
      now
    );
  });

  seedTransaction();
}

// ─── Field Mappers (CamelCase JS <-> Snake_case SQL) ───────────────────────

function toSnakeCase(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const snake = key.replace(/([A-Z])/g, "_$1").toLowerCase();
    result[snake] = value;
  }
  return result;
}

function toCamelCase(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const camel = key.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
    result[camel] = value;
  }
  return result;
}

function mapRowToModel(tableName, row) {
  if (!row) return null;
  const item = toCamelCase(row);

  // Parse JSON columns if any
  if (item.summaryJson && typeof item.summaryJson === "string") {
    try { item.summary = JSON.parse(item.summaryJson); } catch {}
  }
  if (item.snapshotJson && typeof item.snapshotJson === "string") {
    try { item.snapshot = JSON.parse(item.snapshotJson); } catch {}
  }
  if (item.detailsJson && typeof item.detailsJson === "string") {
    try { item.details = JSON.parse(item.detailsJson); } catch {}
  }

  // Boolean conversions
  if ("isActive" in item) item.isActive = Boolean(item.isActive);
  if ("hasDisabled" in item) item.hasDisabled = Boolean(item.hasDisabled);
  if ("hasChronicDisease" in item) item.hasChronicDisease = Boolean(item.hasChronicDisease);
  if ("isLactatingOrPregnant" in item) item.isLactatingOrPregnant = Boolean(item.isLactatingOrPregnant);
  if ("isFemaleHeaded" in item) item.isFemaleHeaded = Boolean(item.isFemaleHeaded);

  return item;
}

function getTableName(collectionName) {
  const map = {
    users: "users",
    camps: "camps",
    families: "families",
    nominations: "nominations",
    announcements: "announcements",
    paymentMethods: "payment_methods",
    payment_methods: "payment_methods",
    paymentRequests: "payment_requests",
    payment_requests: "payment_requests",
    backups: "backups",
    auditLogs: "audit_logs",
    audit_logs: "audit_logs",
  };
  return map[collectionName] || collectionName;
}

// ─── Universal Database Operations ─────────────────────────────────────────

export async function getDatabase() {
  if (isMongoConfigured && mongoClientPromise) {
    const client = await mongoClientPromise;
    return client.db(DB_NAME);
  }
  return getSqliteDatabase();
}

export async function dbFind(collectionName, query = {}, sort = null, limit = 0) {
  if (isMongoConfigured) {
    const db = await getDatabase();
    let cursor = db.collection(collectionName).find(query);
    if (sort) cursor = cursor.sort(sort);
    if (limit > 0) cursor = cursor.limit(limit);
    return await cursor.toArray();
  }

  const db = getSqliteDatabase();
  const table = getTableName(collectionName);
  const conditions = [];
  const params = [];

  for (const [key, value] of Object.entries(query)) {
    const col = key.replace(/([A-Z])/g, "_$1").toLowerCase();
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if ("$in" in value && Array.isArray(value.$in)) {
        const placeholders = value.$in.map(() => "?").join(", ");
        conditions.push(`${col} IN (${placeholders})`);
        params.push(...value.$in);
      } else if ("$ne" in value) {
        conditions.push(`${col} != ?`);
        params.push(value.$ne);
      }
    } else if (typeof value === "string") {
      conditions.push(`lower(${col}) = lower(?)`);
      params.push(value);
    } else if (typeof value === "boolean") {
      conditions.push(`${col} = ?`);
      params.push(value ? 1 : 0);
    } else if (value !== undefined) {
      conditions.push(`${col} = ?`);
      params.push(value);
    }
  }

  let sql = `SELECT * FROM ${table}`;
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }

  if (sort) {
    const [field, order] = Object.entries(sort)[0];
    const sortCol = field.replace(/([A-Z])/g, "_$1").toLowerCase();
    sql += ` ORDER BY ${sortCol} ${order === -1 ? "DESC" : "ASC"}`;
  }

  if (limit > 0) {
    sql += ` LIMIT ${limit}`;
  }

  const rows = db.prepare(sql).all(...params);
  return rows.map((r) => mapRowToModel(table, r));
}

export async function dbFindOne(collectionName, query = {}) {
  if (isMongoConfigured) {
    const db = await getDatabase();
    return await db.collection(collectionName).findOne(query);
  }

  const results = await dbFind(collectionName, query, null, 1);
  return results[0] || null;
}

export async function dbInsertOne(collectionName, doc) {
  const item = { ...doc };
  if (!item.id && !item._id) {
    item.id = `${collectionName}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  if (!item.createdAt) {
    item.createdAt = new Date().toISOString();
  }

  if (isMongoConfigured) {
    const db = await getDatabase();
    await db.collection(collectionName).insertOne(item);
    return item;
  }

  const db = getSqliteDatabase();
  const table = getTableName(collectionName);
  const snake = toSnakeCase(item);

  // Convert objects/arrays to JSON strings
  if (snake.summary && typeof snake.summary === "object") {
    snake.summary_json = JSON.stringify(snake.summary);
    delete snake.summary;
  }
  if (snake.snapshot && typeof snake.snapshot === "object") {
    snake.snapshot_json = JSON.stringify(snake.snapshot);
    delete snake.snapshot;
  }
  if (snake.details && typeof snake.details === "object") {
    snake.details_json = JSON.stringify(snake.details);
    delete snake.details;
  }

  // Boolean to integer
  for (const [k, v] of Object.entries(snake)) {
    if (typeof v === "boolean") snake[k] = v ? 1 : 0;
  }

  // Get table column names to prevent inserting unknown fields
  const pragma = db.prepare(`PRAGMA table_info(${table})`).all();
  const validCols = new Set(pragma.map((c) => c.name));

  const insertCols = [];
  const insertVals = [];
  for (const [k, v] of Object.entries(snake)) {
    if (validCols.has(k)) {
      insertCols.push(k);
      insertVals.push(v);
    }
  }

  const sql = `INSERT INTO ${table} (${insertCols.join(", ")}) VALUES (${insertCols.map(() => "?").join(", ")})`;
  db.prepare(sql).run(...insertVals);

  return item;
}

export async function dbInsertMany(collectionName, docs) {
  if (!docs || docs.length === 0) return [];
  const items = docs.map((d, index) => ({
    ...d,
    id: d.id || `${collectionName}_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: d.createdAt || new Date().toISOString(),
  }));

  if (isMongoConfigured) {
    const db = await getDatabase();
    await db.collection(collectionName).insertMany(items);
    return items;
  }

  const db = getSqliteDatabase();
  const insertTx = db.transaction((records) => {
    for (const record of records) {
      dbInsertOne(collectionName, record);
    }
  });

  insertTx(items);
  return items;
}

export async function dbUpdateOne(collectionName, query, update, options = {}) {
  const updatePayload = update.$set || update;

  if (isMongoConfigured) {
    const db = await getDatabase();
    return await db.collection(collectionName).updateOne(query, { $set: updatePayload }, options);
  }

  const existing = await dbFindOne(collectionName, query);
  if (!existing && options.upsert) {
    const newItem = { ...query, ...updatePayload };
    await dbInsertOne(collectionName, newItem);
    return { matchedCount: 0, upsertedCount: 1 };
  }

  if (!existing) {
    return { matchedCount: 0, modifiedCount: 0 };
  }

  const db = getSqliteDatabase();
  const table = getTableName(collectionName);
  const snake = toSnakeCase(updatePayload);
  snake.updated_at = new Date().toISOString();

  // Boolean & JSON handling
  for (const [k, v] of Object.entries(snake)) {
    if (typeof v === "boolean") snake[k] = v ? 1 : 0;
    if (typeof v === "object" && v !== null) snake[k] = JSON.stringify(v);
  }

  const pragma = db.prepare(`PRAGMA table_info(${table})`).all();
  const validCols = new Set(pragma.map((c) => c.name));

  const setClauses = [];
  const setParams = [];
  for (const [k, v] of Object.entries(snake)) {
    if (validCols.has(k) && k !== "id") {
      setClauses.push(`${k} = ?`);
      setParams.push(v);
    }
  }

  if (setClauses.length === 0) return { matchedCount: 1, modifiedCount: 0 };

  const whereClauses = [];
  for (const [k, v] of Object.entries(query)) {
    const col = k.replace(/([A-Z])/g, "_$1").toLowerCase();
    whereClauses.push(`${col} = ?`);
    setParams.push(typeof v === "boolean" ? (v ? 1 : 0) : v);
  }

  const sql = `UPDATE ${table} SET ${setClauses.join(", ")} WHERE ${whereClauses.join(" AND ")}`;
  const res = db.prepare(sql).run(...setParams);

  return { matchedCount: res.changes > 0 ? 1 : 0, modifiedCount: res.changes };
}

export async function dbUpdateMany(collectionName, query, update) {
  const updatePayload = update.$set || update;

  if (isMongoConfigured) {
    const db = await getDatabase();
    return await db.collection(collectionName).updateMany(query, { $set: updatePayload });
  }

  const items = await dbFind(collectionName, query);
  for (const item of items) {
    await dbUpdateOne(collectionName, { id: item.id }, updatePayload);
  }
  return { modifiedCount: items.length };
}

export async function dbDeleteOne(collectionName, query) {
  if (isMongoConfigured) {
    const db = await getDatabase();
    return await db.collection(collectionName).deleteOne(query);
  }

  const db = getSqliteDatabase();
  const table = getTableName(collectionName);
  const whereClauses = [];
  const params = [];

  for (const [k, v] of Object.entries(query)) {
    const col = k.replace(/([A-Z])/g, "_$1").toLowerCase();
    whereClauses.push(`${col} = ?`);
    params.push(typeof v === "boolean" ? (v ? 1 : 0) : v);
  }

  const sql = `DELETE FROM ${table} WHERE ${whereClauses.join(" AND ")} LIMIT 1`;
  const res = db.prepare(sql).run(...params);
  return { deletedCount: res.changes };
}

export async function dbDeleteMany(collectionName, query) {
  if (isMongoConfigured) {
    const db = await getDatabase();
    return await db.collection(collectionName).deleteMany(query);
  }

  const db = getSqliteDatabase();
  const table = getTableName(collectionName);
  const whereClauses = [];
  const params = [];

  for (const [k, v] of Object.entries(query)) {
    const col = k.replace(/([A-Z])/g, "_$1").toLowerCase();
    whereClauses.push(`${col} = ?`);
    params.push(typeof v === "boolean" ? (v ? 1 : 0) : v);
  }

  let sql = `DELETE FROM ${table}`;
  if (whereClauses.length > 0) {
    sql += ` WHERE ${whereClauses.join(" AND ")}`;
  }

  const res = db.prepare(sql).run(...params);
  return { deletedCount: res.changes };
}

export async function dbCount(collectionName, query = {}) {
  if (isMongoConfigured) {
    const db = await getDatabase();
    return await db.collection(collectionName).countDocuments(query);
  }

  const items = await dbFind(collectionName, query);
  return items.length;
}

export { isMongoConfigured };
