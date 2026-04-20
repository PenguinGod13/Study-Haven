import { NextRequest, NextResponse } from "next/server";
import { loadIndex, saveIndex } from "@/lib/storage";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get("subject");
  const topicId = searchParams.get("topicId");
  const year = searchParams.get("year");
  const type = searchParams.get("type");
  const session = searchParams.get("session");

  const index = await loadIndex();
  let papers = index.papers.filter((p) => p.downloaded);

  if (subject) papers = papers.filter((p) => p.subject === subject);
  if (topicId) papers = papers.filter((p) => p.topicIds.includes(topicId));
  if (year) papers = papers.filter((p) => p.year === parseInt(year));
  if (type) papers = papers.filter((p) => p.type === type);
  if (session) papers = papers.filter((p) => p.session === session);

  papers.sort((a, b) => b.year - a.year || a.paper.localeCompare(b.paper));

  return NextResponse.json({ papers, total: papers.length });
}

export async function PATCH(req: NextRequest) {
  const { paperId, topicIds } = await req.json();
  const index = await loadIndex();
  const paper = index.papers.find((p) => p.id === paperId);
  if (!paper) return NextResponse.json({ error: "Paper not found" }, { status: 404 });

  paper.topicIds = topicIds;
  await saveIndex(index);
  return NextResponse.json({ ok: true, paper });
}
