import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { loadIndex, fetchPdfBytes } from "@/lib/storage";

export const maxDuration = 60; // Vercel Pro: 300s, Hobby: 60s

export async function POST(req: NextRequest) {
  const { subject, topicId, topicName, type = "qp" } = await req.json();

  const index = await loadIndex();
  const papers = index.papers.filter(
    (p) => p.downloaded && p.subject === subject && p.topicIds.includes(topicId) && p.type === type
  );

  if (papers.length === 0) {
    return NextResponse.json({ error: "No papers found for this topic" }, { status: 404 });
  }

  try {
    const mergedPdf = await PDFDocument.create();

    const titlePage = mergedPdf.addPage([595, 842]);
    const { height } = titlePage.getSize();
    titlePage.drawText(`IGCSE ${subject.charAt(0).toUpperCase() + subject.slice(1)}`, { x: 50, y: height - 80, size: 24 });
    titlePage.drawText(`Topical Questions: ${topicName}`, { x: 50, y: height - 120, size: 18 });
    titlePage.drawText(`${type === "qp" ? "Question Papers" : "Mark Schemes"} | Generated ${new Date().toLocaleDateString()}`, { x: 50, y: height - 155, size: 12 });

    let pagesAdded = 0;
    for (const paper of papers.slice(0, 15)) {
      const pdfUrl = paper.blobUrl || paper.localPath;
      if (!pdfUrl) continue;
      const bytes = await fetchPdfBytes(pdfUrl);
      if (!bytes) continue;
      try {
        const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        pagesAdded++;
      } catch { /* skip unreadable */ }
    }

    if (pagesAdded === 0) {
      return NextResponse.json({ error: "Could not load any PDFs for this topic" }, { status: 500 });
    }

    const pdfBytes = await mergedPdf.save();
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${subject}-${topicId}-topical.pdf"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
