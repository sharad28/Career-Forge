#!/usr/bin/env node

/**
 * Migration script: career-ops (markdown) → career-ops-ui (SQLite)
 *
 * Usage:
 *   node scripts/migrate-from-career-ops.mjs /path/to/career-ops
 *
 * Imports: cv.md, config/profile.yml, data/applications.md, data/pipeline.md, portals.yml
 */

import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { parse as parseYaml } from "yaml";

const srcDir = process.argv[2];
if (!srcDir) {
  console.error("Usage: node scripts/migrate-from-career-ops.mjs /path/to/career-ops");
  process.exit(1);
}

// Check both common locations
const dbPath1 = path.join(import.meta.dirname, "..", "prisma", "dev.db");
const dbPath2 = path.join(import.meta.dirname, "..", "dev.db");
const dbPath = fs.existsSync(dbPath1) ? dbPath1 : dbPath2;
if (!fs.existsSync(dbPath)) {
  console.error(`Database not found at ${dbPath}. Run 'npx prisma migrate dev' first.`);
  process.exit(1);
}

const db = new Database(dbPath);
let imported = { cv: 0, settings: 0, applications: 0, pipeline: 0, portals: 0 };

// --- CV ---
const cvPath = path.join(srcDir, "cv.md");
if (fs.existsSync(cvPath)) {
  const content = fs.readFileSync(cvPath, "utf-8");
  db.prepare("UPDATE CV SET isActive = 0 WHERE isActive = 1").run();
  const maxVer = db.prepare("SELECT MAX(version) as v FROM CV").get();
  db.prepare("INSERT INTO CV (content, version, isActive, createdAt) VALUES (?, ?, 1, datetime('now'))").run(
    content,
    (maxVer?.v ?? 0) + 1
  );
  imported.cv = 1;
  console.log("✓ Imported cv.md");
}

// --- Profile → Settings ---
const profilePath = path.join(srcDir, "config", "profile.yml");
if (fs.existsSync(profilePath)) {
  const raw = fs.readFileSync(profilePath, "utf-8");
  const profile = parseYaml(raw);
  const c = profile.candidate || {};
  const comp = profile.compensation || {};
  const loc = profile.location || {};
  const roles = profile.target_roles?.primary || [];

  const salaryMin = parseInt(String(comp.minimum || "0").replace(/[^0-9]/g, "")) || 0;
  const salaryMax = parseInt(String(comp.target_range || "0").split("-").pop().replace(/[^0-9]/g, "")) || 0;
  const h1b = (loc.visa_status || "").toLowerCase().includes("h1b");

  const existing = db.prepare("SELECT id FROM Settings WHERE id = 1").get();
  if (existing) {
    db.prepare(`UPDATE Settings SET
      fullName = ?, email = ?, location = ?, timezone = ?,
      targetRoles = ?, salaryMin = ?, salaryMax = ?, h1bFilter = ?,
      onboardingDone = 1, updatedAt = datetime('now')
      WHERE id = 1`).run(
      c.full_name || "",
      c.email || "",
      loc.city || c.location || "",
      loc.timezone || "",
      JSON.stringify(roles),
      salaryMin,
      salaryMax,
      h1b ? 1 : 0
    );
  } else {
    db.prepare(`INSERT INTO Settings (id, fullName, email, location, timezone, targetRoles, salaryMin, salaryMax, h1bFilter, onboardingDone, updatedAt)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`).run(
      c.full_name || "",
      c.email || "",
      loc.city || c.location || "",
      loc.timezone || "",
      JSON.stringify(roles),
      salaryMin,
      salaryMax,
      h1b ? 1 : 0
    );
  }
  imported.settings = 1;
  console.log("✓ Imported profile.yml → Settings");
}

// --- Applications ---
const appsPath = path.join(srcDir, "data", "applications.md");
if (fs.existsSync(appsPath)) {
  const content = fs.readFileSync(appsPath, "utf-8");
  const lines = content.split("\n").filter((l) => l.startsWith("|") && !l.startsWith("| #") && !l.startsWith("|--"));

  for (const line of lines) {
    const cols = line.split("|").map((c) => c.trim()).filter(Boolean);
    if (cols.length < 6) continue;

    const num = parseInt(cols[0]);
    if (isNaN(num)) continue;

    // Check duplicate
    const exists = db.prepare("SELECT id FROM Application WHERE num = ?").get(num);
    if (exists) continue;

    const dateStr = cols[1] || new Date().toISOString().split("T")[0];
    const company = cols[2] || "Unknown";
    const role = cols[3] || "Unknown";
    const score = parseFloat(cols[4]) || null;
    const status = cols[5] || "Evaluated";
    const notes = cols.length > 8 ? cols[8] : "";

    db.prepare(`INSERT INTO Application (num, date, company, role, score, status, notes, url, createdAt, updatedAt)
      VALUES (?, datetime(?), ?, ?, ?, ?, ?, '', datetime('now'), datetime('now'))`).run(
      num, dateStr, company, role, score, status, notes
    );
    imported.applications++;
  }
  console.log(`✓ Imported ${imported.applications} applications`);
}

// --- Pipeline ---
const pipePath = path.join(srcDir, "data", "pipeline.md");
if (fs.existsSync(pipePath)) {
  const content = fs.readFileSync(pipePath, "utf-8");
  const urlRegex = /https?:\/\/[^\s)]+/g;
  const urls = content.match(urlRegex) || [];

  for (const url of urls) {
    const exists = db.prepare("SELECT id FROM PipelineItem WHERE url = ?").get(url);
    if (exists) continue;
    db.prepare("INSERT INTO PipelineItem (url, status, addedAt) VALUES (?, 'pending', datetime('now'))").run(url);
    imported.pipeline++;
  }
  console.log(`✓ Imported ${imported.pipeline} pipeline URLs`);
}

// --- Portals ---
const portalsPath = path.join(srcDir, "portals.yml");
if (fs.existsSync(portalsPath)) {
  const raw = fs.readFileSync(portalsPath, "utf-8");
  const portals = parseYaml(raw);

  const companies = portals?.companies || portals?.portals || [];
  for (const p of companies) {
    if (!p.name && !p.company) continue;
    const name = p.name || p.company || "";
    const exists = db.prepare("SELECT id FROM Portal WHERE name = ?").get(name);
    if (exists) continue;
    db.prepare("INSERT INTO Portal (name, company, url, enabled, h1bFriendly, keywords) VALUES (?, ?, ?, 1, 0, '[]')").run(
      name,
      p.company || name,
      p.url || p.careers_url || ""
    );
    imported.portals++;
  }
  console.log(`✓ Imported ${imported.portals} portals`);
}

db.close();

console.log("\n--- Migration Summary ---");
console.log(`CV:           ${imported.cv ? "imported" : "not found"}`);
console.log(`Settings:     ${imported.settings ? "imported" : "not found"}`);
console.log(`Applications: ${imported.applications}`);
console.log(`Pipeline:     ${imported.pipeline}`);
console.log(`Portals:      ${imported.portals}`);
console.log("\nDone! Start the app with 'npm run dev'.");
