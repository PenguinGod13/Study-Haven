import Link from "next/link";

const subjects = [
  {
    id: "biology",
    name: "Biology",
    code: "0610",
    color: "green",
    icon: "🧬",
    description: "Cell biology, genetics, ecology, human physiology and more.",
  },
  {
    id: "physics",
    name: "Physics",
    code: "0625",
    color: "blue",
    icon: "⚡",
    description: "Forces, energy, waves, electricity, nuclear physics and more.",
  },
  {
    id: "chemistry",
    name: "Chemistry",
    code: "0620",
    color: "purple",
    icon: "⚗️",
    description: "Atomic structure, bonding, organic chemistry, reactions and more.",
  },
];

const colorMap: Record<string, string> = {
  green: "border-green-500 hover:bg-green-500/10 text-green-400",
  blue: "border-blue-500 hover:bg-blue-500/10 text-blue-400",
  purple: "border-purple-500 hover:bg-purple-500/10 text-purple-400",
};

export default function HomePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-3">IGCSE Past Papers & Topicals</h1>
        <p className="text-gray-400 text-lg">
          Browse, filter, and export topical question sets for IGCSE Biology, Physics, and Chemistry.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {subjects.map((s) => (
          <Link
            key={s.id}
            href={`/${s.id}`}
            className={`rounded-xl border-2 p-6 transition-colors ${colorMap[s.color]}`}
          >
            <div className="text-4xl mb-3">{s.icon}</div>
            <h2 className="text-xl font-bold text-white mb-1">{s.name}</h2>
            <p className="text-xs text-gray-500 mb-2">CIE {s.code}</p>
            <p className="text-sm text-gray-400">{s.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h3 className="font-semibold mb-2">Getting Started</h3>
        <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
          <li>
            Run the scraper to download papers:{" "}
            <code className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-200">
              node scripts/scrape.mjs biology 2019 2024
            </code>
          </li>
          <li>Tag papers with topics using the admin panel, or auto-tag via the bulk tagger.</li>
          <li>Pick a subject, filter by topic, and export your topical PDF.</li>
        </ol>
      </div>
    </div>
  );
}
