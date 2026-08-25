import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { createRecordId } from "../src/lib/recordIds.mjs";
import { readSheet as readExcelSheet } from "read-excel-file/node";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

async function collectSourceFiles(directory) {
  const absolute = new URL(directory, root);
  const entries = await readdir(absolute, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = join(directory, entry.name).replaceAll("\\", "/");
    if (entry.isDirectory()) files.push(...await collectSourceFiles(`${relative}/`));
    else if (/\.(?:js|jsx)$/.test(entry.name)) files.push(relative);
  }
  return files;
}

test("record identifiers are unique and namespaced", () => {
  const first = createRecordId("family");
  const second = createRecordId("family");
  assert.match(first, /^family_/);
  assert.notEqual(first, second);
});

test("production schema never seeds demo camps or stores password hashes", async () => {
  const schema = await read("supabase_schema.sql");
  assert.doesNotMatch(schema, /\('kareem'\s*,\s*'مخيم كريم'/i);
  assert.doesNotMatch(schema, /zad-al-khair/i);
  assert.doesNotMatch(schema, /password\s+TEXT/i);
  assert.doesNotMatch(schema, /FOR\s+ALL\s+TABLES/i);
  assert.match(schema, /ON DELETE CASCADE/i);
  assert.match(schema, /CREATE\s+PUBLICATION\s+supabase_realtime\s+FOR\s+TABLE/i);
});

test("detailed nominations and renewal fields are persisted", async () => {
  const migration = await read("database/production_hardening.sql");
  for (const column of [
    "phone_alt",
    "age_0_2_male",
    "age_over_60_female",
    "current_address",
    "original_address",
    "shelter_gps",
    "requested_months",
    "request_date",
  ]) {
    assert.match(migration, new RegExp(`\\b${column}\\b`, "i"));
  }
});

test("client authorization does not trust editable user metadata", async () => {
  const sourceFiles = await collectSourceFiles("src/");
  const source = (await Promise.all(sourceFiles.map(read))).join("\n");
  assert.doesNotMatch(source, /user_metadata\?\.(?:role|campId)/);
  assert.doesNotMatch(source, /falling back to local/i);
});

test("UI source uses SVG icon components instead of emoji controls", async () => {
  const sourceFiles = await collectSourceFiles("src/");
  const source = (await Promise.all(sourceFiles.map(read))).join("\n");
  assert.doesNotMatch(source, /[\u{1F300}-\u{1FAFF}]/u);
});

test("responsive and security contracts are configured", async () => {
  const [tokens, nextConfig, middleware] = await Promise.all([
    read("tokens.css"),
    read("next.config.mjs"),
    read("src/middleware.js"),
  ]);
  assert.match(tokens, /@media \(max-width: 39\.99rem\)/);
  assert.match(tokens, /min-block-size:\s*2\.75rem/);
  assert.match(tokens, /overflow-x:\s*clip/);
  assert.match(nextConfig, /Content-Security-Policy/);
  assert.match(nextConfig, /process\.env\.NODE_ENV === "development"/);
  assert.match(nextConfig, /unsafe-eval/);
  assert.match(nextConfig, /Strict-Transport-Security/);
  assert.match(nextConfig, /frame-ancestors 'none'/);
  assert.match(middleware, /export async function middleware/);
  assert.match(middleware, /jwtVerify/);
});

test("spreadsheet imports are bounded and avoid vulnerable legacy parsers", async () => {
  const [packageJson, importer] = await Promise.all([
    read("package.json"),
    read("src/components/ExcelImportModal.jsx"),
  ]);
  const manifest = JSON.parse(packageJson);
  assert.equal(manifest.dependencies.xlsx, undefined);
  assert.equal(manifest.dependencies.jspdf, undefined);
  assert.equal(manifest.dependencies["jspdf-autotable"], undefined);
  assert.equal(manifest.dependencies["read-excel-file"], "9.3.10");
  assert.match(importer, /MAX_IMPORT_BYTES/);
  assert.match(importer, /MAX_IMPORT_ROWS/);
  assert.doesNotMatch(importer, /readAsBinaryString/);
});

test("spreadsheet importer reads rows from both production templates", async () => {
  const importer = await read("src/components/ExcelImportModal.jsx");
  assert.match(importer, /import \{ readSheet \} from "read-excel-file\/browser"/);
  assert.match(importer, /readSheet\(arrayBuffer\)/);
  assert.doesNotMatch(importer, /import readXlsxFile from "read-excel-file\/browser"/);

  for (const template of ["families-template.xlsx", "nominations-template.xlsx"]) {
    const file = await readFile(new URL(`public/templates/${template}`, root));
    const rows = await readExcelSheet(file);
    assert.ok(Array.isArray(rows), `${template} should parse to rows`);
    assert.ok(rows.length > 1, `${template} should include headers and sample rows`);
    assert.ok(Array.isArray(rows[0]), `${template} should contain row arrays`);
  }
});

test("camp editing exposes validation errors and makes password changes opt-in", async () => {
  const [superAdmin, updateRoute] = await Promise.all([
    read("src/views/SuperAdmin.jsx"),
    read("src/app/api/admin/update-camp/route.js"),
  ]);

  assert.match(superAdmin, /editCampError/);
  assert.match(superAdmin, /changeCampPassword/);
  assert.match(superAdmin, /isSavingEditCamp/);
  assert.match(superAdmin, /ستبقى كلمة المرور الحالية دون تغيير/);
  assert.match(updateRoute, /select\("id"\)/);
  assert.match(updateRoute, /المخيم المطلوب غير موجود/);
});

test("camp manager passwords use the shared six-character policy", async () => {
  const [policy, superAdmin, createRoute, updateRoute] = await Promise.all([
    read("src/lib/passwordPolicy.js"),
    read("src/views/SuperAdmin.jsx"),
    read("src/app/api/admin/create-camp/route.js"),
    read("src/app/api/admin/update-camp/route.js"),
  ]);

  assert.match(policy, /MIN_PASSWORD_LENGTH\s*=\s*6/);
  assert.match(policy, /password\.length\s*>=\s*MIN_PASSWORD_LENGTH/);
  assert.match(superAdmin, /minLength=\{MIN_PASSWORD_LENGTH\}/);
  assert.match(createRoute, /isPasswordAllowed\(adminPassword\)/);
  assert.match(updateRoute, /isPasswordAllowed\(adminPassword\)/);
  assert.doesNotMatch(`${policy}\n${superAdmin}\n${createRoute}\n${updateRoute}`, /password\.length\s*<\s*10/);
});

test("login does not discard successful cold-start responses", async () => {
  const [authHelpers, loginRoute] = await Promise.all([
    read("src/lib/authHelpers.js"),
    read("src/app/api/auth/login/route.js"),
  ]);

  assert.match(authHelpers, /controller\.abort\(\), 30000/);
  assert.match(loginRoute, /Promise\.all/);
  assert.match(loginRoute, /resolveProfileByLogin/);
});
