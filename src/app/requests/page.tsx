"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface WatchRequest {
  id: number;
  video_id: string;
  video_title: string;
  video_thumbnail: string | null;
  channel_name: string;
  status: "pending" | "approved" | "denied";
  requested_at: number;
}

export default function RequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<WatchRequest[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/requests");
    if (res.status === 401) { router.push("/login"); return; }
    setRequests(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // Poll for status updates on pending requests
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const statusColor = {
    pending: "text-yellow-400",
    approved: "text-green-400",
    denied: "text-red-400",
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-4">
        <a href="/search" className="text-red-500 font-bold text-xl">KidTube</a>
        <h2 className="text-white font-semibold">My Requests</h2>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {loading && <p className="text-gray-500 text-center py-10">Loading…</p>}
        {!loading && requests.length === 0 && (
          <p className="text-gray-600 text-center py-10">No requests yet</p>
        )}
        {requests.map((r) => (
          <div key={r.id} className="bg-gray-900 rounded-xl p-4 flex gap-4 items-start">
            {r.video_thumbnail && (
              <div className="relative w-24 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-800">
                <Image src={r.video_thumbnail} alt="" fill className="object-cover" unoptimized />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm line-clamp-2">{r.video_title}</p>
              <p className="text-xs text-gray-400 mt-1">{r.channel_name}</p>
              <p className={`text-xs mt-2 font-semibold ${statusColor[r.status]}`}>
                {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
              </p>
            </div>
            {r.status === "approved" && (
              <button
                onClick={() => router.push(`/watch/${r.video_id}`)}
                className="shrink-0 bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Watch
              </button>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
