import { PaperIndex } from "./types";
import fs from "fs";
import path from "path";

const INDEX_FILE = path.join(process.cwd(), "data", "papers.json");

export async function loadIndex(): Promise<PaperIndex> {
  try {
    if (fs.existsSync(INDEX_FILE)) {
      return JSON.parse(fs.readFileSync(INDEX_FILE, "utf8"));
    }
  } catch {}
  return { papers: [], lastUpdated: new Date().toISOString() };
}

export async function saveIndex(index: PaperIndex): Promise<void> {
  index.lastUpdated = new Date().toISOString();
  fs.mkdirSync(path.dirname(INDEX_FILE), { recursive: true });
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
}

export async function fetchPdfBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}
