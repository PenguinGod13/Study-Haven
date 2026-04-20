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

async function loadIndex() {
  try {
    const { blobs } = await list({ prefix: INDEX_BLOB_PATH, token: process.env.BLOB_READ_WRITE_TOKEN });
    if (blobs.length === 0) return { papers: [], lastUpdated: new Date().toISOString() };
    const res = await fetch(blobs[0].url);
    return await res.json();
  } catch {
    return { papers: [], lastUpdated: new Date().toISOString() };
  }
}

async function saveIndex(index) {
  index.lastUpdated = new Date().toISOString();
  await put(INDEX_BLOB_PATH, JSON.stringify(index, null, 2), {
    access: "public",
    contentType: "application/json",
    allowOverwrite: true,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
}

function fetchUrl(url) {
  return new Promise((resolve) => {
    const proto = url.startsWith("https") ? https : http;
    const chunks = [];
    const req = proto.get(url, { timeout: 15000 }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        resolve(fetchUrl(res.headers.location));
        return;
      }
      if (res.statusCode !== 200) { resolve(null); return; }
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    });
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
  });
}

function buildSourceUrl(subject, subjectCode, year, session, paperVariant, type) {
  const subjectNames = {
    biology: "Biology%20(0610)",
    physics: "Physics%20(0625)",
    chemistry: "Chemistry%20(0620)",
  };
  const shortYear = String(year).slice(2);
  const filename = `${subjectCode}_${session.code}${shortYear}_${type === "qp" ? "qp" : "ms"}_${paperVariant}.pdf`;
  const base = `https://pastpapers.papacambridge.com/Cambridge%20International%20Examinations%20(CIE)/IGCSE/${subjectNames[subject]}/${year}/`;
  return { url: base + filename, filename };
}

async function scrapeSubject(subject, startYear, endYear) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("Error: BLOB_READ_WRITE_TOKEN not set. Add it to .env.local");
    process.exit(1);
  }
  const subjectCode = SUBJECT_CODES[subject];
  const index = await loadIndex();
  let downloaded = 0, skipped = 0, failed = 0;

  for (let year = startYear; year <= endYear; year++) {
    for (const session of SESSIONS) {
      for (const variant of PAPER_VARIANTS) {
        for (const type of ["qp", "ms"]) {
          const { url, filename } = buildSourceUrl(subject, subjectCode, year, session, variant, type);
          const blobPath = `igcse-hub/papers/${subject}/${year}/${session.label.replace("/", "-")}/${filename}`;
          const paperId = `${subject}-${year}-${session.code}-${variant}-${type}`;

          const existing = index.papers.find((p) => p.id === paperId);
          if (existing?.downloaded) { skipped++; continue; }

          process.stdout.write(`${filename}... `);
          const buffer = await fetchUrl(url);
          if (!buffer) { failed++; process.stdout.write("✗\n"); continue; }

          try {
            const blob = await put(blobPath, buffer, {
              access: "public",
              contentType: "application/pdf",
              allowOverwrite: true,
              token: process.env.BLOB_READ_WRITE_TOKEN,
            });

            if (existing) {
              existing.blobUrl = blob.url;
              existing.downloaded = true;
            } else {
              index.papers.push({
                id: paperId,
                subject,
                year,
                session: session.label,
                paper: variant,
                variant,
                type,
                filename,
                localPath: "",
                blobUrl: blob.url,
                url,
                topicIds: [],
                downloaded: true,
              });
            }
            downloaded++;
            console.log("✓");
          } catch (e) {
            failed++;
            console.log(`✗ (blob error: ${e.message})`);
          }
        }
      }
    }
    await saveIndex(index);
    console.log(`\nYear ${year}: +${downloaded} downloaded, ${skipped} skipped, ${failed} failed\n`);
  }
  console.log(`Done scraping ${subject}.`);
}

// ---- auto-tag helper baked in ----
const TOPIC_MAP = {
  biology: {
    "1": ["bio-1","bio-2","bio-3","bio-4","bio-5","bio-6","bio-7","bio-8","bio-9","bio-10","bio-11","bio-12","bio-13","bio-14","bio-15","bio-16","bio-17","bio-18","bio-19"],
    "2": ["bio-1","bio-2","bio-3","bio-4","bio-5","bio-6","bio-7","bio-8","bio-9","bio-10","bio-11","bio-12"],
    "3": ["bio-1","bio-2","bio-3","bio-4","bio-5","bio-6","bio-7","bio-8","bio-9","bio-10","bio-11","bio-12"],
    "4": ["bio-13","bio-14","bio-15","bio-16","bio-17","bio-18","bio-19"],
    "5": ["bio-5","bio-6","bio-11"], "6": ["bio-5","bio-6","bio-11"],
  },
  physics: {
    "1": ["phy-1","phy-2","phy-3","phy-4","phy-5","phy-6","phy-7","phy-8","phy-9","phy-10","phy-11","phy-12","phy-13","phy-14","phy-15","phy-16","phy-17","phy-18","phy-19"],
    "2": ["phy-1","phy-2","phy-3","phy-4","phy-5","phy-6","phy-7","phy-8","phy-9"],
    "3": ["phy-1","phy-2","phy-3","phy-4","phy-5","phy-6","phy-7","phy-8","phy-9"],
    "4": ["phy-10","phy-11","phy-12","phy-13","phy-14","phy-15","phy-16","phy-17","phy-18","phy-19"],
    "5": ["phy-1","phy-6","phy-9"], "6": ["phy-1","phy-6","phy-9"],
  },
  chemistry: {
    "1": ["chem-1","chem-2","chem-3","chem-4","chem-5","chem-6","chem-7","chem-8","chem-9","chem-10","chem-11","chem-12","chem-13","chem-14"],
    "2": ["chem-1","chem-2","chem-3","chem-4","chem-5","chem-6","chem-7","chem-8"],
    "3": ["chem-1","chem-2","chem-3","chem-4","chem-5","chem-6","chem-7","chem-8"],
    "4": ["chem-9","chem-10","chem-11","chem-12","chem-13","chem-14"],
    "5": ["chem-5","chem-8"], "6": ["chem-5","chem-8"],
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
const [,, cmd, arg1, arg2, arg3] = process.argv;
if (cmd === "autotag") {
  autotag(arg1).catch(console.error);
} else if (SUBJECT_CODES[cmd]) {
  const startYear = parseInt(arg1 || "2019");
  const endYear = parseInt(arg2 || "2025");
  scrapeSubject(cmd, startYear, endYear).catch(console.error);
} else {
  console.log("Usage:");
  console.log("  node scripts/scrape.mjs <biology|physics|chemistry> [startYear] [endYear]");
  console.log("  node scripts/scrape.mjs autotag [subject]");
}
