export interface Paper {
  id: string;
  subject: string;
  year: number;
  session: "May/June" | "Oct/Nov" | "Feb/Mar";
  paper: string; // e.g. "11", "12", "21"
  variant: string;
  type: "qp" | "ms"; // question paper or mark scheme
  filename: string;
  localPath: string; // kept for local dev fallback
  blobUrl: string;   // Vercel Blob public URL
  url: string;       // original source URL
  topicIds: string[]; // manually or AI-assigned topic tags
  downloaded: boolean;
}

export interface PaperIndex {
  papers: Paper[];
  lastUpdated: string;
}
