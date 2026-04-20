import { put, list, head } from "@vercel/blob";
import { PaperIndex } from "./types";

const INDEX_BLOB_PATH = "igcse-hub/papers-index.json";

export async function loadIndex(): Promise<PaperIndex> {
  try {
    const { blobs } = await list({ prefix: INDEX_BLOB_PATH });
    if (blobs.length === 0) return { papers: [], lastUpdated: new Date().toISOString() };
    const res = await fetch(blobs[0].url);
    return await res.json();
  } catch {
    return { papers: [], lastUpdated: new Date().toISOString() };
  }
}

export async function saveIndex(index: PaperIndex): Promise<void> {
  index.lastUpdated = new Date().toISOString();
  await put(INDEX_BLOB_PATH, JSON.stringify(index, null, 2), {
    access: "public",
    contentType: "application/json",
    allowOverwrite: true,
  });
}

export async function fetchPdfBytes(blobUrl: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(blobUrl);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}
