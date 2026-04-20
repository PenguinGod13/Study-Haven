import { NextResponse } from "next/server";
import { loadIndex, saveIndex } from "@/lib/storage";

const TOPIC_MAP: Record<string, Record<string, string[]>> = {
  biology: {
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

export async function POST() {
  const index = await loadIndex();
  let tagged = 0;

  for (const paper of index.papers) {
    const map = TOPIC_MAP[paper.subject];
    if (!map) continue;
    const paperNum = paper.paper.charAt(0);
    if (map[paperNum]) { paper.topicIds = map[paperNum]; tagged++; }
  }

  await saveIndex(index);
  return NextResponse.json({ ok: true, tagged });
}
