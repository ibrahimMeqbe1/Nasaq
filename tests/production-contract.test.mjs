import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { createRecordId } from "../src/lib/recordIds.mjs";

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
  const [tokens, nextConfig, proxy] = await Promise.all([
    read("tokens.css"),
    read("next.config.mjs"),
    read("src/proxy.js"),
  ]);
  assert.match(tokens, /@media \(max-width: 39\.99rem\)/);
  assert.match(tokens, /min-block-size:\s*2\.75rem/);
  assert.match(tokens, /overflow-x:\s*clip/);
  assert.match(nextConfig, /Content-Security-Policy/);
  assert.match(nextConfig, /Strict-Transport-Security/);
  assert.match(nextConfig, /frame-ancestors 'none'/);
  assert.match(proxy, /export async function proxy/);
  assert.match(proxy, /jwtVerify/);
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
