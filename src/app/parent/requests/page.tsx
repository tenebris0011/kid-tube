"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

interface WatchRequest {
  id: number;
  video_id: string;
  video_title: string;
  video_thumbnail: string | null;
  channel_name: string;
  kid_name: string;
  status: "pending" | "approved" | "denied";
  requested_at: number;
}

export default function ParentRequestsPage() {
  const [requests, setRequests] = useState<WatchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  async function load() {
    const res = await fetch("/api/requests");
    setRequests(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function resolve(id: number, action: "approve" | "deny") {
    await fetch(`/api/requests/${id}/${action}`, { method: "POST" });
    setRequests((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: action === "approve" ? "approved" : "denied" } : r)
    );
  }

  const filtered = filter === "pending" ? requests.filter((r) => r.status === "pending") : requests;

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-4">
        <a href="/parent" className="text-red-500 font-bold text-xl">KidTube</a>
        <h2 className="font-semibold">Watch Requests</h2>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setFilter("pending")} className={`text-sm px-3 py-1 rounded-full transition-colors ${filter === "pending" ? "bg-red-600" : "bg-gray-800 hover:bg-gray-700"}`}>
            Pending
          </button>
          <button onClick={() => setFilter("all")} className={`text-sm px-3 py-1 rounded-full transition-colors ${filter === "all" ? "bg-red-600" : "bg-gray-800 hover:bg-gray-700"}`}>
            All
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {loading && <p className="text-gray-500 text-center py-10">Loading…</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-gray-600 text-center py-10">No requests</p>
        )}
        {filtered.map((r) => (
          <div key={r.id} className="bg-gray-900 rounded-xl p-4 flex gap-4 items-start">
            {r.video_thumbnail && (
              <div className="relative w-24 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-800">
                <Image src={r.video_thumbnail} alt="" fill className="object-cover" unoptimized />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm line-clamp-2">{r.video_title}</p>
              <p className="text-xs text-gray-400 mt-1">{r.channel_name}</p>
              <p className="text-xs text-blue-400 mt-1">{r.kid_name}</p>
            </div>
            {r.status === "pending" ? (
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => resolve(r.id, "approve")}
                  className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => resolve(r.id, "deny")}
                  className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Deny
                </button>
              </div>
            ) : (
              <span className={`text-xs font-semibold shrink-0 ${r.status === "approved" ? "text-green-400" : "text-red-400"}`}>
                {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
              </span>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
