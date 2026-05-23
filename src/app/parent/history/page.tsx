"use client";
import { useState, useEffect } from "react";

interface HistoryEntry {
  id: number;
  kid_name: string;
  video_id: string;
  video_title: string;
  channel_name: string;
  watched_at: number;
}

export default function ParentHistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((data) => { setHistory(data); setLoading(false); });
  }, []);

  function formatDate(unix: number) {
    return new Date(unix * 1000).toLocaleString();
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-4">
        <a href="/parent" className="text-red-500 font-bold text-xl">KidTube</a>
        <h2 className="font-semibold">Watch History</h2>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-2">
        {loading && <p className="text-gray-500 text-center py-10">Loading…</p>}
        {!loading && history.length === 0 && (
          <p className="text-gray-600 text-center py-10">No watch history yet</p>
        )}
        {history.map((h) => (
          <div key={h.id} className="bg-gray-900 rounded-xl px-4 py-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-1">{h.video_title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{h.channel_name}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-blue-400">{h.kid_name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{formatDate(h.watched_at)}</p>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
