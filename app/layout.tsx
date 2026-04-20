import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IGCSE Hub — Biology, Physics, Chemistry",
  description: "Past papers and topical questions for IGCSE sciences",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <header className="border-b border-gray-800 bg-gray-900 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight text-white">
              IGCSE Hub
            </Link>
            <nav className="flex gap-6 text-sm font-medium">
              <Link href="/biology" className="text-green-400 hover:text-green-300 transition-colors">Biology</Link>
              <Link href="/physics" className="text-blue-400 hover:text-blue-300 transition-colors">Physics</Link>
              <Link href="/chemistry" className="text-purple-400 hover:text-purple-300 transition-colors">Chemistry</Link>
              <Link href="/admin" className="text-gray-500 hover:text-gray-300 transition-colors text-xs">Admin</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
