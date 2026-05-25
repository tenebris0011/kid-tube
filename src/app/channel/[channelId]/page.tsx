"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import VideoCard, { type VideoCardData } from "@/components/VideoCard";
import KidNav from "@/components/KidNav";

export default function ChannelPage() {
  const router = useRouter();
  const { channelId } = useParams<{ channelId: string }>();

  const [videos, setVideos] = useState<VideoCardData[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [subscribedSet, setSubscribedSet] = useState<Set<string>>(new Set());
  const [channelName, setChannelName] = useState("");

  const loadPage = useCallback(async (p: number, append: boolean) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);

    const res = await fetch(`/api/channel/${channelId}?page=${p}`);
    if (res.status === 401) { router.push("/login"); return; }

    const data: VideoCardData[] = await res.json();

    if (data.length === 0) {
      setHasMore(false);
    } else {
      if (append) {
        setVideos((prev) => [...prev, ...data]);
      } else {
        setVideos(data);
        if (data[0]) setChannelName(data[0].channelName);
      }
      setHasMore(data.length >= 20);
    }

    setLoading(false);
    setLoadingMore(false);
  }, [channelId, router]);

  useEffect(() => {
    fetch("/api/subscriptions")
      .then((r) => r.json())
      .then((data: { channel_id: string }[]) =>
        setSubscribedSet(new Set(data.map((s) => s.channel_id)))
      )
      .catch(() => {});

    loadPage(1, false);
  }, [loadPage]);

  async function handleSubscribeToggle(
    cId: string,
    cName: string,
    thumbnail: string,
    isSubscribed: boolean
  ) {
    if (isSubscribed) {
      await fetch(`/api/subscriptions/${cId}`, { method: "DELETE" });
      setSubscribedSet((prev) => { const s = new Set(prev); s.delete(cId); return s; });
    } else {
      await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: cId, channelName: cName, channelThumbnail: thumbnail }),
      });
      setSubscribedSet((prev) => new Set([...prev, cId]));
    }
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    loadPage(next, true);
  }

  const isSubscribed = subscribedSet.has(channelId);

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-4 pt-3 pb-2 space-y-1">
        <div className="flex items-center justify-between">
          <KidNav current="feed" />
        </div>
        {channelName && (
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="text-gray-500 hover:text-white transition-colors text-sm">
                ←
              </button>
              <h2 className="font-semibold text-white">{channelName}</h2>
            </div>
            <button
              onClick={() => handleSubscribeToggle(channelId, channelName, videos[0]?.thumbnail ?? "", isSubscribed)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                isSubscribed
                  ? "border-gray-600 text-gray-400 hover:border-red-500 hover:text-red-400"
                  : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              }`}
            >
              {isSubscribed ? "Subscribed" : "+ Subscribe"}
            </button>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {loading && <div className="text-center py-20 text-gray-500">Loading videos…</div>}

        {!loading && videos.length === 0 && (
          <div className="text-center py-20 text-gray-600">No videos found</div>
        )}

        {videos.length > 0 && (
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
        )}

        {!loading && hasMore && (
          <div className="text-center pt-2">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 px-6 py-2.5 rounded-full text-sm font-medium transition-colors"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
