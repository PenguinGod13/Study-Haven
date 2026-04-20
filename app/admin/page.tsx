"use client";

import { useEffect, useState } from "react";
import { SUBJECTS, Subject } from "@/lib/topics";
import { Paper } from "@/lib/types";

export default function AdminPage() {
  const [subject, setSubject] = useState<Subject>("biology");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/papers?subject=${subject}`)
      .then((r) => r.json())
      .then((d) => { setPapers(d.papers || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [subject]);

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
      <div className="mb-6 flex items-center gap-4">
        <h1 className="text-2xl font-bold">Admin — Tag Papers</h1>
        <div className="flex gap-2">
          {(["biology", "physics", "chemistry"] as Subject[]).map((s) => (
            <button
              key={s}
              onClick={() => setSubject(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                subject === s ? "bg-gray-200 text-gray-900" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {SUBJECTS[s].name}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Tag each paper with relevant topics. Tagged papers will appear in topical views and can be exported.
      </p>

      {loading ? (
        <div className="text-gray-500 text-sm py-8">Loading...</div>
      ) : papers.length === 0 ? (
        <div className="text-gray-500 text-sm py-8">
          No papers found. Run <code className="bg-gray-800 px-1 rounded">node scripts/scrape.mjs {subject}</code> first.
        </div>
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
                  <button
                    key={topic.id}
                    onClick={() => toggleTopic(paper.id, topic.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      paper.topicIds.includes(topic.id)
                        ? "bg-white/10 border-white/30 text-white"
                        : "border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300"
                    }`}
                  >
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
