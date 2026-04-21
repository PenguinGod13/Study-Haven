import { NextRequest, NextResponse } from "next/server";
import { loadIndex, saveIndex } from "@/lib/storage";

export const maxDuration = 60;

const SUBJECT_CODES: Record<string, string> = {
  biology: "0610",
  physics: "0625",
  chemistry: "0620",
};

const PAPER_VARIANTS = ["21", "22", "23", "41", "42", "43", "61", "62", "63"];

const SESSION_CODES: Record<string, string> = {
  "May/June": "s",
  "Oct/Nov": "w",
  "Feb/Mar": "m",
};

const SUBJECT_NAMES: Record<string, string> = {
  biology: "Biology%20(0610)",
  physics: "Physics%20(0625)",
  chemistry: "Chemistry%20(0620)",
};

async function urlExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(10000), redirect: "follow" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const { subject, year, session } = await req.json();

  if (!SUBJECT_CODES[subject]) return NextResponse.json({ error: "Invalid subject" }, { status: 400 });
  if (!SESSION_CODES[session]) return NextResponse.json({ error: "Invalid session" }, { status: 400 });

  const subjectCode = SUBJECT_CODES[subject];
  const sessionCode = SESSION_CODES[session];
  const shortYear = String(year).slice(2);

  const index = await loadIndex();
  const results = { downloaded: 0, skipped: 0, failed: 0 };

  for (const variant of PAPER_VARIANTS) {
    for (const type of ["qp", "ms"] as const) {
      const filename = `${subjectCode}_${sessionCode}${shortYear}_${type}_${variant}.pdf`;
      const sourceUrl = `https://pastpapers.papacambridge.com/Cambridge%20International%20Examinations%20(CIE)/IGCSE/${SUBJECT_NAMES[subject]}/${year}/${filename}`;
      const paperId = `${subject}-${year}-${sessionCode}-${variant}-${type}`;

      const existing = index.papers.find((p) => p.id === paperId);
      if (existing?.downloaded) { results.skipped++; continue; }

      const exists = await urlExists(sourceUrl);
      if (!exists) { results.failed++; continue; }

      if (existing) {
        existing.url = sourceUrl;
        existing.blobUrl = sourceUrl;
        existing.downloaded = true;
      } else {
        index.papers.push({
          id: paperId,
          subject,
          year: Number(year),
          session,
          paper: variant,
          variant,
          type,
          filename,
          localPath: "",
          blobUrl: sourceUrl,
          url: sourceUrl,
          topicIds: [],
          downloaded: true,
        });
      }
      results.downloaded++;
    }
  }

  await saveIndex(index);
  return NextResponse.json({ ok: true, ...results });
}
