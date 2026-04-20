"use client";

import { useEffect, useState } from "react";
import { SUBJECTS, Subject } from "@/lib/topics";
import { Paper } from "@/lib/types";

interface Props {
  subject: Subject;
}

const COLOR = {
  biology: { badge: "bg-green-500/20 text-green-300 border-green-500/30", active: "bg-green-500/20 border-green-400 text-green-200", dot: "bg-green-400" },
  physics: { badge: "bg-blue-500/20 text-blue-300 border-blue-500/30", active: "bg-blue-500/20 border-blue-400 text-blue-200", dot: "bg-blue-400" },
  chemistry: { badge: "bg-purple-500/20 text-purple-300 border-purple-500/30", active: "bg-purple-500/20 border-purple-400 text-purple-200", dot: "bg-purple-400" },
};

export default function SubjectPage({ subject }: Props) {
  const subjectData = SUBJECTS[subject];
  const colors = COLOR[subject];

  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"qp" | "ms" | "all">("qp");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const [viewPaper, setViewPaper] = useState<Paper | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ subject });
    if (selectedTopicId) params.set("topicId", selectedTopicId);
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (yearFilter !== "all") params.set("year", yearFilter);
    if (sessionFilter !== "all") params.set("session", sessionFilter);

    setLoading(true);
    fetch(`/api/papers?${params}`)
      .then((r) => r.json())
      .then((d) => { setPapers(d.papers || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [subject, selectedTopicId, typeFilter, yearFilter, sessionFilter]);

  async function handleExport() {
    if (!selectedTopicId) return;
    const topic = subjectData.topics.find((t) => t.id === selectedTopicId);
    if (!topic) return;

    setExportLoading(true);
    try {
      const res = await fetch("/api/export-topical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, topicId: selectedTopicId, topicName: topic.name, type: typeFilter === "all" ? "qp" : typeFilter }),
      });
      if (!res.ok) { const e = await res.json(); alert(e.error); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${subject}-${topic.name.replace(/\s+/g, "-")}-topical.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportLoading(false);
    }
  }

  const years = Array.from(new Set(papers.map((p) => p.year))).sort((a, b) => b - a);
  const selectedTopic = subjectData.topics.find((t) => t.id === selectedTopicId);

  return (
    <div className="flex gap-6 min-h-[calc(100vh-120px)]">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0">
        <div className={`rounded-xl border p-4 ${colors.badge} border-opacity-30 bg-opacity-10 mb-4`}>
          <h2 className="font-bold text-lg text-white">{subjectData.name}</h2>
          <p className="text-xs opacity-70">CIE {subjectData.code} · {subjectData.topics.length} topics</p>
        </div>

        <nav className="space-y-1">
          <button
            onClick={() => setSelectedTopicId(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              !selectedTopicId ? colors.active + " border font-medium" : "hover:bg-gray-800 text-gray-400"
            }`}
          >
            All Papers
          </button>

          {subjectData.topics.map((topic) => (
            <div key={topic.id}>
              <button
                onClick={() => {
                  setSelectedTopicId(topic.id);
                  setExpandedTopic(expandedTopic === topic.id ? null : topic.id);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                  selectedTopicId === topic.id ? colors.active + " border font-medium" : "hover:bg-gray-800 text-gray-400"
                }`}
              >
                <span className="truncate pr-2">{topic.name}</span>
                {topic.subtopics && <span className="text-xs opacity-50">{expandedTopic === topic.id ? "▲" : "▼"}</span>}
              </button>
              {expandedTopic === topic.id && topic.subtopics && (
                <div className="ml-4 mt-1 space-y-0.5">
                  {topic.subtopics.map((sub) => (
                    <div key={sub} className="px-3 py-1 text-xs text-gray-500">{sub}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <div className="text-sm font-medium text-gray-400">
            {selectedTopic ? selectedTopic.name : "All Papers"}
            {!loading && <span className="ml-2 text-gray-600">({papers.length})</span>}
          </div>
          <div className="flex-1" />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "qp" | "ms" | "all")}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="qp">Question Papers</option>
            <option value="ms">Mark Schemes</option>
            <option value="all">Both</option>
          </select>

          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="all">All Sessions</option>
            <option value="May/June">May/June</option>
            <option value="Oct/Nov">Oct/Nov</option>
            <option value="Feb/Mar">Feb/Mar</option>
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="all">All Years</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          {selectedTopicId && (
            <button
              onClick={handleExport}
              disabled={exportLoading || papers.length === 0}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${colors.dot} text-gray-900 hover:opacity-90 disabled:opacity-40`}
            >
              {exportLoading ? "Generating..." : "⬇ Export Topical PDF"}
            </button>
          )}
        </div>

        {/* Paper viewer overlay */}
        {viewPaper && (
          <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
            <div className="flex items-center justify-between p-3 bg-gray-900 border-b border-gray-800">
              <span className="text-sm font-medium">{viewPaper.filename}</span>
              <button onClick={() => setViewPaper(null)} className="text-gray-400 hover:text-white px-3 py-1 rounded">✕ Close</button>
            </div>
            <iframe src={viewPaper.blobUrl || viewPaper.localPath} className="flex-1 w-full" title={viewPaper.filename} />
          </div>
        )}

        {/* Papers list */}
        {loading ? (
          <div className="text-gray-500 text-sm py-12 text-center">Loading papers...</div>
        ) : papers.length === 0 ? (
          <div className="text-gray-500 text-sm py-12 text-center">
            <p className="text-lg mb-2">No papers found</p>
            {selectedTopicId ? (
              <p className="text-xs">Papers need to be tagged with this topic. Use the admin panel or run the tagger.</p>
            ) : (
              <p className="text-xs">Run <code className="bg-gray-800 px-1 rounded">node scripts/scrape.mjs {subject}</code> to download papers.</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {papers.map((paper) => (
              <div
                key={paper.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-600 transition-colors group"
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${paper.type === "qp" ? colors.dot : "bg-yellow-400"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">
                    {paper.year} {paper.session} — Paper {paper.paper}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{paper.filename}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded border ${paper.type === "qp" ? colors.badge : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"}`}>
                  {paper.type === "qp" ? "QP" : "MS"}
                </span>
                {paper.topicIds.length > 0 && (
                  <span className="text-xs text-gray-600">{paper.topicIds.length} topics</span>
                )}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setViewPaper(paper)}
                    className="text-xs px-2.5 py-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
                  >
                    View
                  </button>
                  <a
                    href={paper.blobUrl || paper.localPath}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-2.5 py-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
