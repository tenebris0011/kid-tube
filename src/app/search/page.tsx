"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Video {
  videoId: string;
  title: string;
  thumbnail: string;
  channelId: string;
  channelName: string;
  viewCount: number;
  lengthSeconds: number;
  publishedText: string;
  channelAllowed: boolean;
}

function formatDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState<Record<string, boolean>>({});
  const [requested, setRequested] = useState<Record<string, string>>({});

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setVideos(data);
    setLoading(false);
  }, []);

  async function handleRequest(video: Video) {
    setRequesting((p) => ({ ...p, [video.videoId]: true }));
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId: video.videoId,
        videoTitle: video.title,
        videoThumbnail: video.thumbnail,
        channelId: video.channelId,
        channelName: video.channelName,
      }),
    });
    const data = await res.json();
    setRequesting((p) => ({ ...p, [video.videoId]: false }));
    if (data.status === "approved") {
      router.push(`/watch/${video.videoId}`);
    } else {
      setRequested((p) => ({ ...p, [video.videoId]: data.status }));
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 pt-3 pb-2 space-y-2">
        {/* Top row: logo + nav */}
        <div className="flex items-center justify-between">
          <h1 className="text-red-500 font-bold text-xl">KidTube</h1>
          <nav className="flex gap-4 text-sm text-gray-400">
            <a href="/requests" className="hover:text-white transition-colors">My Requests</a>
            <button
              onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); }}
              className="hover:text-white transition-colors"
            >
              Sign out
            </button>
          </nav>
        </div>
        {/* Search bar — full width on all sizes */}
        <form
          className="flex gap-2"
          onSubmit={(e) => { e.preventDefault(); search(query); }}
        >
          <input
            className="flex-1 bg-gray-800 rounded-full px-5 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Search for videos…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className="bg-gray-800 hover:bg-gray-700 px-4 rounded-full transition-colors shrink-0"
          >
            Search
          </button>
        </form>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading && (
          <div className="text-center py-20 text-gray-500">Searching…</div>
        )}

        {!loading && videos.length === 0 && (
          <div className="text-center py-20 text-gray-600">
            Search for something to watch
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((v) => (
            <div key={v.videoId} className="bg-gray-900 rounded-xl overflow-hidden">
              <div className="relative aspect-video bg-gray-800">
                {v.thumbnail && (
                  <Image
                    src={v.thumbnail}
                    alt={v.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
                <span className="absolute bottom-2 right-2 bg-black/80 text-xs px-1.5 py-0.5 rounded">
                  {formatDuration(v.lengthSeconds)}
                </span>
              </div>
              <div className="p-3 space-y-2">
                <p className="text-sm font-medium line-clamp-2 leading-snug">{v.title}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  {v.channelName}
                  {v.channelAllowed && (
                    <span className="text-green-400 text-[10px] bg-green-400/10 px-1.5 py-0.5 rounded-full">
                      Approved channel
                    </span>
                  )}
                </p>
                <button
                  onClick={() => handleRequest(v)}
                  disabled={!!requesting[v.videoId] || !!requested[v.videoId]}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                    requested[v.videoId] === "approved"
                      ? "bg-green-600"
                      : requested[v.videoId] === "pending"
                      ? "bg-yellow-600/80 cursor-default"
                      : "bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  }`}
                >
                  {requesting[v.videoId]
                    ? "…"
                    : requested[v.videoId] === "pending"
                    ? "Waiting for approval"
                    : requested[v.videoId] === "approved"
                    ? "Watch now"
                    : v.channelAllowed
                    ? "Watch"
                    : "Ask to watch"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
