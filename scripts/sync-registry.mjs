// Syncs the live agentic-os skill registry into the app (build-time, no client keys).
// Dedupes by realpath (symlinked pack copies count once — see agentic-os/README.md),
// strips to the fields the Constellation needs, writes lib/registry.json.
// Run via `npm run prebuild` or directly: node scripts/sync-registry.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, "../../agentic-os/registry.json");
const OUT = path.resolve(here, "../lib/registry.json");

const raw = JSON.parse(fs.readFileSync(SRC, "utf8"));

const seen = new Set();
const skills = [];
for (const s of raw.skills) {
  let key = s.path;
  try {
    key = fs.realpathSync(s.path);
  } catch {
    // path gone since last scan — keep it, dedupe on recorded path
  }
  if (seen.has(key)) continue;
  seen.add(key);
  skills.push({
    name: s.name,
    description: (s.description || "").slice(0, 220),
    scope: s.scope,
    category: s.category || "Other",
    authored: s.scope === "user-custom" || s.scope === "project-custom",
    source: s.source || null,
  });
}

const byCategory = {};
for (const s of skills) byCategory[s.category] = (byCategory[s.category] || 0) + 1;

const out = {
  syncedAt: new Date().toISOString(),
  scannedAt: raw.generatedAt,
  total: skills.length,
  authored: skills.filter((s) => s.authored).length,
  byCategory,
  skills,
};

fs.writeFileSync(OUT, JSON.stringify(out));
console.log(
  `registry synced: ${out.total} unique skills (${out.authored} authored) across ${Object.keys(byCategory).length} categories → lib/registry.json`
);

// Photo manifest: which reference prints actually exist in public/photos.
// Rooms consult this instead of firing 404s for pending photos.
const PHOTOS_DIR = path.resolve(here, "../public/photos");
const photos = fs.existsSync(PHOTOS_DIR)
  ? fs.readdirSync(PHOTOS_DIR).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).map((f) => `/photos/${f}`)
  : [];
fs.writeFileSync(path.resolve(here, "../lib/photos.json"), JSON.stringify(photos));
console.log(`photo manifest: ${photos.length} print(s) present → lib/photos.json`);
