"use client";

import { useEffect, useState } from "react";
import { SUBJECTS, Subject } from "@/lib/topics";
import { Paper } from "@/lib/types";

const SESSIONS = ["May/June", "Oct/Nov", "Feb/Mar"];
const YEARS = Array.from({ length: 10 }, (_, i) => 2024 - i);

interface ScrapeResult { downloaded: number; skipped: number; failed: number }

export default function AdminPage() {
  const [subject, setSubject] = useState<Subject>("biology");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  // Scraper state
  const [scrapeSubject, setScrapeSubject] = useState<Subject>("biology");
  const [scrapeYear, setScrapeYear] = useState(2024);
  const [scrapeSession, setScrapeSession] = useState("May/June");
  const [scraping, setScraping] = useState(false);
  const [scrapeLog, setScrapeLog] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/papers?subject=${subject}`)
      .then((r) => r.json())
      .then((d) => { setPapers(d.papers || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [subject]);

  async function handleScrape() {
    setScraping(true);
    setScrapeLog((l) => [...l, `⏳ Scraping ${scrapeSubject} ${scrapeYear} ${scrapeSession}...`]);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: scrapeSubject, year: scrapeYear, session: scrapeSession }),
      });
      const data: ScrapeResult & { error?: string } = await res.json();
      if (data.error) {
        setScrapeLog((l) => [...l, `❌ Error: ${data.error}`]);
      } else {
        setScrapeLog((l) => [...l, `✅ Done — ${data.downloaded} downloaded, ${data.skipped} skipped, ${data.failed} not found`]);
      }
    } catch (e) {
      setScrapeLog((l) => [...l, `❌ Network error: ${e}`]);
    } finally {
      setScraping(false);
    }
  }

  async function handleAutoTag() {
    setScraping(true);
    setScrapeLog((l) => [...l, "⏳ Auto-tagging all papers..."]);
    try {
      const res = await fetch("/api/autotag", { method: "POST" });
      const data = await res.json();
      setScrapeLog((l) => [...l, `✅ Tagged ${data.tagged} papers`]);
    } catch {
      setScrapeLog((l) => [...l, "❌ Auto-tag failed"]);
    } finally {
      setScraping(false);
    }
  }

  async function toggleTopic(paperId: string, topicId: string) {
    const paper = papers.find((p) => p.id === paperId);
    if (!paper) return;
    const newTopics = paper.topicIds.includes(topicId)
      ? paper.topicIds.filter((t) => t !== topicId)
      : [...paper.topicIds, topicId];
    setSaving(paperId);
    await fetch("/api/papers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paperId, topicIds: newTopics }),
    });
    setPapers((prev) => prev.map((p) => p.id === paperId ? { ...p, topicIds: newTopics } : p));
    setSaving(null);
  }

  const subjectData = SUBJECTS[subject];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin</h1>

      {/* Scraper */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 mb-8">
        <h2 className="font-semibold mb-4 text-white">Scrape Past Papers</h2>
        <p className="text-xs text-gray-500 mb-4">
          Fetches papers from the public papacambridge archive and uploads them to Vercel Blob.
          Run one session at a time to stay within the 60s serverless limit.
        </p>

        <div className="flex flex-wrap gap-3 mb-4">
          <select value={scrapeSubject} onChange={(e) => setScrapeSubject(e.target.value as Subject)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm">
            <option value="biology">Biology</option>
            <option value="physics">Physics</option>
            <option value="chemistry">Chemistry</option>
          </select>

          <select value={scrapeYear} onChange={(e) => setScrapeYear(Number(e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm">
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          <select value={scrapeSession} onChange={(e) => setScrapeSession(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm">
            {SESSIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <button onClick={handleScrape} disabled={scraping}
            className="px-4 py-1.5 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-40 transition-colors">
            {scraping ? "Scraping..." : "Scrape"}
          </button>

          <button onClick={handleAutoTag} disabled={scraping}
            className="px-4 py-1.5 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600 disabled:opacity-40 transition-colors">
            Auto-Tag All
          </button>
        </div>

        {scrapeLog.length > 0 && (
          <div className="bg-gray-950 rounded-lg p-3 font-mono text-xs space-y-1 max-h-40 overflow-y-auto">
            {scrapeLog.map((line, i) => <div key={i} className="text-gray-400">{line}</div>)}
          </div>
        )}
      </div>

      {/* Topic tagger */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-semibold text-white">Tag Papers by Topic</h2>
        <div className="flex gap-2">
          {(["biology", "physics", "chemistry"] as Subject[]).map((s) => (
            <button key={s} onClick={() => setSubject(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                subject === s ? "bg-gray-200 text-gray-900" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}>
              {SUBJECTS[s].name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm py-8">Loading...</div>
      ) : papers.length === 0 ? (
        <div className="text-gray-500 text-sm py-8">No papers found. Scrape some papers first.</div>
      ) : (
        <div className="space-y-4">
          {papers.map((paper) => (
            <div key={paper.id} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="font-medium text-sm text-white">{paper.filename}</span>
                <span className={`text-xs px-2 py-0.5 rounded border ${paper.type === "qp" ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"}`}>
                  {paper.type === "qp" ? "QP" : "MS"}
                </span>
                <span className="text-xs text-gray-500">{paper.year} · {paper.session}</span>
                {saving === paper.id && <span className="text-xs text-blue-400">Saving...</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {subjectData.topics.map((topic) => (
                  <button key={topic.id} onClick={() => toggleTopic(paper.id, topic.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      paper.topicIds.includes(topic.id)
                        ? "bg-white/10 border-white/30 text-white"
                        : "border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300"
                    }`}>
                    {topic.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
