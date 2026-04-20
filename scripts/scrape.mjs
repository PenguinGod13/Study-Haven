#!/usr/bin/env node
/**
 * IGCSE past paper indexer — finds papers on public sources, stores URLs in index.
 * PDFs are NOT uploaded to Blob — they're served directly from source sites.
 * Only the index JSON is stored in Vercel Blob.
 *
 * Run: node scripts/scrape.mjs <biology|physics|chemistry> [startYear] [endYear]
 *      node scripts/scrape.mjs clean [subject]
 *      node scripts/scrape.mjs autotag [subject]
 */

import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";
import { put, list } from "@vercel/blob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LOCAL_INDEX = path.join(ROOT, "data", "papers.json");
const INDEX_BLOB_PATH = "igcse-hub/papers-index.json";

// Load .env.local
const envFile = path.join(ROOT, ".env.local");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const [k, ...v] = line.split("=");
    if (k && v.length) process.env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
  }
}

const SUBJECT_CODES = { biology: "0610", physics: "0625", chemistry: "0620" };
const SESSIONS = [
  { label: "May/June", code: "s" },
  { label: "Oct/Nov", code: "w" },
  { label: "Feb/Mar", code: "m" },
];
const PAPER_VARIANTS = ["21", "22", "23", "41", "42", "43", "61", "62", "63"];

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/pdf,*/*",
};

// ---- Index (local file + Blob for website) ----

function loadIndex() {
  if (fs.existsSync(LOCAL_INDEX)) return JSON.parse(fs.readFileSync(LOCAL_INDEX, "utf8"));
  return { papers: [], lastUpdated: new Date().toISOString() };
}

async function saveIndex(index) {
  index.lastUpdated = new Date().toISOString();
  fs.mkdirSync(path.dirname(LOCAL_INDEX), { recursive: true });
  fs.writeFileSync(LOCAL_INDEX, JSON.stringify(index, null, 2));
  // Upload index to Blob so the website can read it
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await put(INDEX_BLOB_PATH, JSON.stringify(index, null, 2), {
      access: "public", contentType: "application/json",
      allowOverwrite: true, token: process.env.BLOB_READ_WRITE_TOKEN,
    });
  }
}

// ---- HTTP HEAD check (fast — no download) ----

function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: "HEAD", timeout: 8000, headers: HEADERS }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        resolve(checkUrl(res.headers.location));
        return;
      }
      const ok = res.statusCode === 200 && (res.headers["content-type"] || "").includes("pdf");
      resolve(ok ? url : null);
    });
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
    req.end();
  });
}

function findPaperUrl(filename, subject, subjectCode) {
  const sources = [
    `https://dynamicpapers.com/wp-content/uploads/2015/09/${filename}`,
    `https://bestexamhelp.com/exam/cambridge-igcse/${subject}-${subjectCode}/${filename.slice(5,7) === "s" || filename.slice(5,7) === "w" || filename.slice(5,7) === "m" ? "20" + filename.slice(6,8) : "20" + filename.slice(5,7)}/${filename}`,
  ];
  return Promise.any(sources.map(url => checkUrl(url).then(r => r ?? Promise.reject()))).catch(() => null);
}

// ---- Concurrency pool ----

async function pool(tasks, concurrency) {
  let i = 0;
  async function worker() { while (i < tasks.length) { const idx = i++; await tasks[idx](); } }
  await Promise.all(Array.from({ length: concurrency }, worker));
}

// ---- Commands ----

async function clean(subject) {
  console.log(`Clearing index for ${subject || "all subjects"}...`);
  const index = loadIndex();
  index.papers = subject ? index.papers.filter((p) => p.subject !== subject) : [];
  await saveIndex(index);
  console.log("Done. Index cleared.");
}

async function scrapeSubject(subject, startYear, endYear) {
  const subjectCode = SUBJECT_CODES[subject];
  const index = loadIndex();
  let found = 0, skipped = 0, failed = 0, done = 0;

  const tasks = [];
  for (let year = startYear; year <= endYear; year++)
    for (const session of SESSIONS)
      for (const variant of PAPER_VARIANTS)
        for (const type of ["qp", "ms"]) {
          const shortYear = String(year).slice(2);
          const filename = `${subjectCode}_${session.code}${shortYear}_${type}_${variant}.pdf`;
          const paperId = `${subject}-${year}-${session.code}-${variant}-${type}`;
          tasks.push({ year, session, variant, type, filename, paperId });
        }

  const total = tasks.length;

  await pool(tasks.map((task) => async () => {
    const { year, session, variant, type, filename, paperId } = task;
    if (index.papers.find((p) => p.id === paperId)?.downloaded) { skipped++; done++; return; }

    const url = await findPaperUrl(filename, subject, subjectCode);
    done++;
    process.stdout.write(`\r[${done}/${total}] ✓ ${found} found  ✗ ${failed} not found    `);

    if (!url) { failed++; return; }
    index.papers.push({
      id: paperId, subject, year, session: session.label,
      paper: variant, variant, type, filename,
      localPath: "", blobUrl: url, url,
      topicIds: [], downloaded: true,
    });
    found++;
  }), 15);

  await saveIndex(index);
  console.log(`\n\nDone ${subject}: ${found} found, ${skipped} skipped, ${failed} not found`);
}

const TOPIC_MAP = {
  biology:   { "2": ["bio-1","bio-2","bio-3","bio-4","bio-5","bio-6","bio-7","bio-8","bio-9","bio-10","bio-11","bio-12"], "4": ["bio-13","bio-14","bio-15","bio-16","bio-17","bio-18","bio-19"], "6": ["bio-5","bio-6","bio-11"] },
  physics:   { "2": ["phy-1","phy-2","phy-3","phy-4","phy-5","phy-6","phy-7","phy-8","phy-9"], "4": ["phy-10","phy-11","phy-12","phy-13","phy-14","phy-15","phy-16","phy-17","phy-18","phy-19"], "6": ["phy-1","phy-6","phy-9"] },
  chemistry: { "2": ["chem-1","chem-2","chem-3","chem-4","chem-5","chem-6","chem-7","chem-8"], "4": ["chem-9","chem-10","chem-11","chem-12","chem-13","chem-14"], "6": ["chem-5","chem-8"] },
};

async function autotag(subjectArg) {
  const index = loadIndex();
  let tagged = 0;
  for (const subject of (subjectArg ? [subjectArg] : ["biology","physics","chemistry"]))
    for (const paper of index.papers) {
      if (paper.subject !== subject) continue;
      const topics = TOPIC_MAP[subject]?.[paper.paper.charAt(0)];
      if (topics) { paper.topicIds = topics; tagged++; }
    }
  await saveIndex(index);
  console.log(`Auto-tagged ${tagged} papers.`);
}

// CLI
const [,, cmd, arg1, arg2] = process.argv;
if (cmd === "autotag") autotag(arg1).catch(console.error);
else if (cmd === "clean") clean(arg1).catch(console.error);
else if (SUBJECT_CODES[cmd]) scrapeSubject(cmd, parseInt(arg1||"2019"), parseInt(arg2||"2025")).catch(console.error);
else {
  console.log("Usage:");
  console.log("  node scripts/scrape.mjs <biology|physics|chemistry> [startYear] [endYear]");
  console.log("  node scripts/scrape.mjs clean [subject]");
  console.log("  node scripts/scrape.mjs autotag [subject]");
}
