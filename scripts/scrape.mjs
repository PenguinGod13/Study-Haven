#!/usr/bin/env node
/**
 * Scraper for IGCSE past papers — uploads to Vercel Blob
 * Requires BLOB_READ_WRITE_TOKEN in .env.local
 *
 * Run: node scripts/scrape.mjs <biology|physics|chemistry> [startYear] [endYear]
 */

import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { fileURLToPath } from "url";
import { put, list } from "@vercel/blob";

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LOCAL_INDEX = path.join(ROOT, "data", "papers.json");
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
const INDEX_BLOB_PATH = "igcse-hub/papers-index.json";

// Browser-like headers to avoid blocks
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/pdf,*/*",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://www.papacambridge.com/",
};

async function loadIndex() {
  // Always read from local file — fast and never stale
  if (fs.existsSync(LOCAL_INDEX)) {
    return JSON.parse(fs.readFileSync(LOCAL_INDEX, "utf8"));
  }
  return { papers: [], lastUpdated: new Date().toISOString() };
}

async function saveIndex(index) {
  index.lastUpdated = new Date().toISOString();
  // Save locally
  fs.mkdirSync(path.dirname(LOCAL_INDEX), { recursive: true });
  fs.writeFileSync(LOCAL_INDEX, JSON.stringify(index, null, 2));
  // Upload to Blob so the website can read it
  await put(INDEX_BLOB_PATH, JSON.stringify(index, null, 2), {
    access: "public", contentType: "application/json",
    allowOverwrite: true, token: process.env.BLOB_READ_WRITE_TOKEN,
  });
}

function fetchUrl(url) {
  return new Promise((resolve) => {
    const proto = url.startsWith("https") ? https : http;
    const chunks = [];
    const options = { timeout: 20000, headers: HEADERS };
    const req = proto.get(url, options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        resolve(fetchUrl(res.headers.location));
        return;
      }
      if (res.statusCode !== 200) { resolve(null); return; }
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const buf = Buffer.concat(chunks);
        // Validate it's actually a PDF (%PDF magic bytes)
        if (buf.length < 4 || buf[0] !== 0x25 || buf[1] !== 0x50 || buf[2] !== 0x44 || buf[3] !== 0x46) {
          resolve(null); // Got HTML/error page, not a PDF
          return;
        }
        resolve(buf);
      });
    });
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
  });
}

// Try multiple sources for a given filename
async function fetchPaper(filename, subject, subjectCode, year, session) {
  const subjectNamesGce = {
    biology: `Biology (${subjectCode})`,
    physics: `Physics (${subjectCode})`,
    chemistry: `Chemistry (${subjectCode})`,
  };
  const subjectNamesPapa = {
    biology: `Biology%20(${subjectCode})`,
    physics: `Physics%20(${subjectCode})`,
    chemistry: `Chemistry%20(${subjectCode})`,
  };

  const sources = [
    // GCE Guide
    `https://papers.gceguide.com/IGCSE/${encodeURIComponent(subjectNamesGce[subject])}/${year}/${filename}`,
    // Papacambridge
    `https://pastpapers.papacambridge.com/Cambridge%20International%20Examinations%20(CIE)/IGCSE/${subjectNamesPapa[subject]}/${year}/${filename}`,
    // Past Papers
    `https://pastpapers.co/cie/download/?doc=cambridge-igcse-${subject}-${subjectCode}/${year}/${filename}`,
  ];

  for (const url of sources) {
    const buf = await fetchUrl(url);
    if (buf) return { buf, url };
  }
  return null;
}

// Run tasks with max N concurrent promises
async function pool(tasks, concurrency) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]();
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

async function clean(subject) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN not set"); process.exit(1);
  }
  console.log(`Clearing index for ${subject || "all subjects"}...`);
  const index = await loadIndex();
  index.papers = subject ? index.papers.filter((p) => p.subject !== subject) : [];
  await saveIndex(index);
  console.log("Done. Index cleared.");
}

async function scrapeSubject(subject, startYear, endYear) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN not set. Add it to .env.local"); process.exit(1);
  }
  const subjectCode = SUBJECT_CODES[subject];
  const index = await loadIndex();
  let downloaded = 0, skipped = 0, failed = 0;

  // Build all tasks upfront
  const tasks = [];
  for (let year = startYear; year <= endYear; year++) {
    for (const session of SESSIONS) {
      for (const variant of PAPER_VARIANTS) {
        for (const type of ["qp", "ms"]) {
          const shortYear = String(year).slice(2);
          const filename = `${subjectCode}_${session.code}${shortYear}_${type}_${variant}.pdf`;
          const blobPath = `igcse-hub/papers/${subject}/${year}/${session.label.replace("/", "-")}/${filename}`;
          const paperId = `${subject}-${year}-${session.code}-${variant}-${type}`;
          tasks.push({ year, session, variant, type, filename, blobPath, paperId });
        }
      }
    }
  }

  const total = tasks.length;
  let done = 0;

  await pool(tasks.map((task) => async () => {
    const { year, session, variant, type, filename, blobPath, paperId } = task;
    const existing = index.papers.find((p) => p.id === paperId);
    if (existing?.downloaded) { skipped++; done++; return; }

    const result = await fetchPaper(filename, subject, subjectCode, year, session);
    done++;
    process.stdout.write(`\r[${done}/${total}] ✓ ${downloaded} downloaded, ✗ ${failed} failed    `);

    if (!result) { failed++; return; }

    try {
      const blob = await put(blobPath, result.buf, {
        access: "public", contentType: "application/pdf",
        allowOverwrite: true, token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      if (existing) {
        existing.blobUrl = blob.url; existing.downloaded = true;
      } else {
        index.papers.push({
          id: paperId, subject, year, session: session.label,
          paper: variant, variant, type, filename,
          localPath: "", blobUrl: blob.url, url: result.url,
          topicIds: [], downloaded: true,
        });
      }
      downloaded++;
    } catch { failed++; }
  }), 10); // 10 concurrent downloads

  await saveIndex(index);
  console.log(`\n\nDone ${subject}: ${downloaded} downloaded, ${skipped} skipped, ${failed} not found`);
}

// ---- auto-tag ----
const TOPIC_MAP = {
  biology: {
    "2": ["bio-1","bio-2","bio-3","bio-4","bio-5","bio-6","bio-7","bio-8","bio-9","bio-10","bio-11","bio-12"],
    "4": ["bio-13","bio-14","bio-15","bio-16","bio-17","bio-18","bio-19"],
    "6": ["bio-5","bio-6","bio-11"],
  },
  physics: {
    "2": ["phy-1","phy-2","phy-3","phy-4","phy-5","phy-6","phy-7","phy-8","phy-9"],
    "4": ["phy-10","phy-11","phy-12","phy-13","phy-14","phy-15","phy-16","phy-17","phy-18","phy-19"],
    "6": ["phy-1","phy-6","phy-9"],
  },
  chemistry: {
    "2": ["chem-1","chem-2","chem-3","chem-4","chem-5","chem-6","chem-7","chem-8"],
    "4": ["chem-9","chem-10","chem-11","chem-12","chem-13","chem-14"],
    "6": ["chem-5","chem-8"],
  },
};

async function autotag(subjectArg) {
  const index = await loadIndex();
  let tagged = 0;
  const subjects = subjectArg ? [subjectArg] : ["biology", "physics", "chemistry"];
  for (const subject of subjects) {
    for (const paper of index.papers) {
      if (paper.subject !== subject) continue;
      const map = TOPIC_MAP[subject];
      const paperNum = paper.paper.charAt(0);
      if (map?.[paperNum]) { paper.topicIds = map[paperNum]; tagged++; }
    }
  }
  await saveIndex(index);
  console.log(`Auto-tagged ${tagged} papers.`);
}

// CLI
const [,, cmd, arg1, arg2] = process.argv;
if (cmd === "autotag") {
  autotag(arg1).catch(console.error);
} else if (cmd === "clean") {
  clean(arg1).catch(console.error); // arg1 optional: specific subject
} else if (SUBJECT_CODES[cmd]) {
  const startYear = parseInt(arg1 || "2019");
  const endYear = parseInt(arg2 || "2025");
  scrapeSubject(cmd, startYear, endYear).catch(console.error);
} else {
  console.log("Usage:");
  console.log("  node scripts/scrape.mjs <biology|physics|chemistry> [startYear] [endYear]");
  console.log("  node scripts/scrape.mjs clean [subject]   — delete blobs and reset index");
  console.log("  node scripts/scrape.mjs autotag [subject]");
}
