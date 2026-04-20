#!/usr/bin/env node
/**
 * Auto-tagger for IGCSE papers.
 * Uses a mapping of paper number → topic coverage for each subject.
 * This is a heuristic based on known IGCSE syllabus structure.
 *
 * Run: node scripts/autotag.mjs [subject]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const INDEX_FILE = path.join(ROOT, "data", "papers.json");

// Paper 1 = MCQ (covers all topics broadly)
// Paper 2 = Core theory
// Paper 3 = Extended theory
// Paper 4 = Extended theory (alt)
// Paper 5/6 = Practical (experimental topics)
// We map paper series to topic groups

const TOPIC_MAP = {
  biology: {
    // paper number prefix → topic ids (based on CIE 0610 syllabus section mapping)
    "1": ["bio-1","bio-2","bio-3","bio-4","bio-5","bio-6","bio-7","bio-8","bio-9","bio-10","bio-11","bio-12","bio-13","bio-14","bio-15","bio-16","bio-17","bio-18","bio-19"],
    "2": ["bio-1","bio-2","bio-3","bio-4","bio-5","bio-6","bio-7","bio-8","bio-9","bio-10","bio-11","bio-12"],
    "3": ["bio-1","bio-2","bio-3","bio-4","bio-5","bio-6","bio-7","bio-8","bio-9","bio-10","bio-11","bio-12"],
    "4": ["bio-13","bio-14","bio-15","bio-16","bio-17","bio-18","bio-19"],
    "5": ["bio-5","bio-6","bio-11"],
    "6": ["bio-5","bio-6","bio-11"],
  },
  physics: {
    "1": ["phy-1","phy-2","phy-3","phy-4","phy-5","phy-6","phy-7","phy-8","phy-9","phy-10","phy-11","phy-12","phy-13","phy-14","phy-15","phy-16","phy-17","phy-18","phy-19"],
    "2": ["phy-1","phy-2","phy-3","phy-4","phy-5","phy-6","phy-7","phy-8","phy-9"],
    "3": ["phy-1","phy-2","phy-3","phy-4","phy-5","phy-6","phy-7","phy-8","phy-9"],
    "4": ["phy-10","phy-11","phy-12","phy-13","phy-14","phy-15","phy-16","phy-17","phy-18","phy-19"],
    "5": ["phy-1","phy-6","phy-9"],
    "6": ["phy-1","phy-6","phy-9"],
  },
  chemistry: {
    "1": ["chem-1","chem-2","chem-3","chem-4","chem-5","chem-6","chem-7","chem-8","chem-9","chem-10","chem-11","chem-12","chem-13","chem-14"],
    "2": ["chem-1","chem-2","chem-3","chem-4","chem-5","chem-6","chem-7","chem-8"],
    "3": ["chem-1","chem-2","chem-3","chem-4","chem-5","chem-6","chem-7","chem-8"],
    "4": ["chem-9","chem-10","chem-11","chem-12","chem-13","chem-14"],
    "5": ["chem-5","chem-8"],
    "6": ["chem-5","chem-8"],
  },
};

function loadIndex() {
  if (fs.existsSync(INDEX_FILE)) return JSON.parse(fs.readFileSync(INDEX_FILE, "utf8"));
  return { papers: [], lastUpdated: new Date().toISOString() };
}

function saveIndex(index) {
  index.lastUpdated = new Date().toISOString();
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
}

const [,, subjectArg] = process.argv;
const subjects = subjectArg ? [subjectArg] : ["biology", "physics", "chemistry"];

const index = loadIndex();
let tagged = 0;

for (const subject of subjects) {
  const map = TOPIC_MAP[subject];
  if (!map) { console.warn(`No topic map for ${subject}`); continue; }

  for (const paper of index.papers) {
    if (paper.subject !== subject) continue;
    const paperNum = paper.paper.charAt(0); // first digit of variant like "11" → "1"
    if (map[paperNum]) {
      paper.topicIds = map[paperNum];
      tagged++;
    }
  }
}

saveIndex(index);
console.log(`Auto-tagged ${tagged} papers.`);
