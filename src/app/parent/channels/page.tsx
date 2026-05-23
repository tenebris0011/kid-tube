"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

interface Channel {
  id: number;
  channel_id: string;
  channel_name: string;
  channel_thumbnail: string | null;
}

interface SearchResult {
  channelId: string;
  channelName: string;
  thumbnail: string;
  subscriberCount: number;
}

export default function ParentChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/channels");
    setChannels(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    const res = await fetch(`/api/channels?q=${encodeURIComponent(query)}`);
    setResults(await res.json());
    setSearching(false);
  }

  async function addChannel(r: SearchResult) {
    setAdding(r.channelId);
    await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId: r.channelId, channelName: r.channelName, channelThumbnail: r.thumbnail }),
    });
    setAdding(null);
    setResults([]);
    setQuery("");
    load();
  }

  async function removeChannel(id: number) {
    await fetch(`/api/channels/${id}`, { method: "DELETE" });
    setChannels((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-4">
        <a href="/parent" className="text-red-500 font-bold text-xl">KidTube</a>
        <h2 className="font-semibold">Allowed Channels</h2>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Search to add */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-300">Add a channel</h3>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); search(); }}>
            <input
              className="flex-1 bg-gray-800 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Search channels by name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors">
              Search
            </button>
          </form>

          {searching && <p className="text-gray-500 text-sm">Searching…</p>}
          {results.map((r) => (
            <div key={r.channelId} className="bg-gray-800 rounded-xl p-3 flex items-center gap-3">
              {r.thumbnail && (
                <Image src={r.thumbnail} alt="" width={40} height={40} className="rounded-full" unoptimized />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{r.channelName}</p>
              </div>
              <button
                onClick={() => addChannel(r)}
                disabled={adding === r.channelId}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                {adding === r.channelId ? "Adding…" : "Add"}
              </button>
            </div>
          ))}
        </div>

        {/* Existing allowed channels */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-300">Allowed channels ({channels.length})</h3>
          {channels.length === 0 && (
            <p className="text-gray-600 text-sm">None yet — videos from allowed channels skip approval</p>
          )}
          {channels.map((c) => (
            <div key={c.id} className="bg-gray-900 rounded-xl p-3 flex items-center gap-3">
              {c.channel_thumbnail && (
                <Image src={c.channel_thumbnail} alt="" width={40} height={40} className="rounded-full" unoptimized />
              )}
              <p className="flex-1 font-medium text-sm">{c.channel_name}</p>
              <button
                onClick={() => removeChannel(c.id)}
                className="text-red-400 hover:text-red-300 text-sm transition-colors px-2"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
