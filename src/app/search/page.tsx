"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import VideoCard, { type VideoCardData } from "@/components/VideoCard";
import KidNav from "@/components/KidNav";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState<VideoCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [subscribedSet, setSubscribedSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/subscriptions")
      .then((r) => r.json())
      .then((data: { channel_id: string }[]) => {
        setSubscribedSet(new Set(data.map((s) => s.channel_id)));
      })
      .catch(() => {});
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    setVideos(await res.json());
    setLoading(false);
  }, []);

  async function handleSubscribeToggle(
    channelId: string,
    channelName: string,
    thumbnail: string,
    isSubscribed: boolean
  ) {
    if (isSubscribed) {
      await fetch(`/api/subscriptions/${channelId}`, { method: "DELETE" });
      setSubscribedSet((prev) => { const s = new Set(prev); s.delete(channelId); return s; });
    } else {
      await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, channelName, channelThumbnail: thumbnail }),
      });
      setSubscribedSet((prev) => new Set([...prev, channelId]));
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-4 pt-3 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <KidNav current="search" />
        </div>
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
        {loading && <div className="text-center py-20 text-gray-500">Searching…</div>}

        {!loading && videos.length === 0 && (
          <div className="text-center py-20 text-gray-600">Search for something to watch</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((v) => (
            <VideoCard
              key={v.videoId}
              video={v}
              subscribedChannels={subscribedSet}
              onSubscribeToggle={handleSubscribeToggle}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
