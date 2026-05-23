"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import VideoCard, { type VideoCardData } from "@/components/VideoCard";

interface Subscription {
  channel_id: string;
  channel_name: string;
  channel_thumbnail: string | null;
}

interface ChannelSearchResult {
  channelId: string;
  channelName: string;
  thumbnail: string;
}

export default function FeedPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoCardData[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subscribedSet, setSubscribedSet] = useState<Set<string>>(new Set());
  const [feedLoading, setFeedLoading] = useState(true);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [channelQuery, setChannelQuery] = useState("");
  const [channelResults, setChannelResults] = useState<ChannelSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const loadSubscriptions = useCallback(async () => {
    const res = await fetch("/api/subscriptions");
    if (res.status === 401) { router.push("/login"); return; }
    const data: Subscription[] = await res.json();
    setSubscriptions(data);
    setSubscribedSet(new Set(data.map((s) => s.channel_id)));
  }, [router]);

  const loadFeed = useCallback(async () => {
    setFeedLoading(true);
    const res = await fetch("/api/feed");
    if (res.ok) setVideos(await res.json());
    setFeedLoading(false);
  }, []);

  useEffect(() => {
    loadSubscriptions();
    loadFeed();
  }, [loadSubscriptions, loadFeed]);

  async function handleSubscribeToggle(
    channelId: string,
    channelName: string,
    thumbnail: string,
    isSubscribed: boolean
  ) {
    if (isSubscribed) {
      await fetch(`/api/subscriptions/${channelId}`, { method: "DELETE" });
      setSubscribedSet((prev) => { const s = new Set(prev); s.delete(channelId); return s; });
      setSubscriptions((prev) => prev.filter((s) => s.channel_id !== channelId));
    } else {
      await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, channelName, channelThumbnail: thumbnail }),
      });
      setSubscribedSet((prev) => new Set([...prev, channelId]));
      setSubscriptions((prev) => [...prev, { channel_id: channelId, channel_name: channelName, channel_thumbnail: thumbnail }]);
      // Refresh feed to include new channel's videos
      loadFeed();
    }
  }

  async function searchChannels() {
    if (!channelQuery.trim()) return;
    setSearching(true);
    const res = await fetch(`/api/subscriptions?q=${encodeURIComponent(channelQuery)}`);
    setChannelResults(await res.json());
    setSearching(false);
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-4 pt-3 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-red-500 font-bold text-xl">KidTube</h1>
          <nav className="flex gap-4 text-sm text-gray-400">
            <span className="text-white font-medium">Feed</span>
            <a href="/search" className="hover:text-white transition-colors">Search</a>
            <a href="/requests" className="hover:text-white transition-colors">Requests</a>
            <button
              onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); }}
              className="hover:text-white transition-colors"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Subscribed channels strip */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                My Channels
              </h2>
              {subscriptions.length > 0 && (
                <a href="/subscriptions" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                  Manage
                </a>
              )}
            </div>
            <button
              onClick={() => { setShowAddChannel((v) => !v); setChannelResults([]); setChannelQuery(""); }}
              className="text-sm text-red-500 hover:text-red-400 transition-colors"
            >
              {showAddChannel ? "Cancel" : "+ Add Channel"}
            </button>
          </div>

          {subscriptions.length === 0 && !showAddChannel && (
            <p className="text-gray-600 text-sm">
              No subscriptions yet.{" "}
              <button onClick={() => setShowAddChannel(true)} className="text-red-500 hover:text-red-400">
                Add a channel
              </button>{" "}
              to build your feed.
            </p>
          )}

          {subscriptions.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {subscriptions.map((s) => (
                <div key={s.channel_id} className="flex flex-col items-center gap-1.5 shrink-0 w-16 group">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-800">
                    {s.channel_thumbnail ? (
                      <Image src={s.channel_thumbnail} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-lg">
                        {s.channel_name?.[0] ?? "?"}
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 text-center leading-tight line-clamp-2 w-full">{s.channel_name ?? ""}</p>
                  <button
                    onClick={() => handleSubscribeToggle(s.channel_id, s.channel_name ?? "", s.channel_thumbnail ?? "", true)}
                    className="text-[10px] text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Unsubscribe
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add channel search */}
          {showAddChannel && (
            <div className="bg-gray-900 rounded-xl p-4 space-y-3">
              <form
                className="flex gap-2"
                onSubmit={(e) => { e.preventDefault(); searchChannels(); }}
              >
                <input
                  className="flex-1 bg-gray-800 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  placeholder="Search for a channel…"
                  value={channelQuery}
                  onChange={(e) => setChannelQuery(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="bg-gray-700 hover:bg-gray-600 px-4 rounded-lg text-sm transition-colors">
                  Search
                </button>
              </form>

              {searching && <p className="text-gray-500 text-sm">Searching…</p>}

              <div className="space-y-2">
                {channelResults.map((r) => (
                  <div key={r.channelId} className="flex items-center gap-3">
                    {r.thumbnail && (
                      <Image src={r.thumbnail} alt="" width={36} height={36} className="rounded-full shrink-0" unoptimized />
                    )}
                    <p className="flex-1 text-sm truncate">{r.channelName}</p>
                    <button
                      onClick={() => {
                        handleSubscribeToggle(r.channelId, r.channelName, r.thumbnail, subscribedSet.has(r.channelId));
                        if (!subscribedSet.has(r.channelId)) setShowAddChannel(false);
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg shrink-0 transition-colors ${
                        subscribedSet.has(r.channelId)
                          ? "bg-gray-700 text-gray-400"
                          : "bg-red-600 hover:bg-red-700 text-white"
                      }`}
                    >
                      {subscribedSet.has(r.channelId) ? "Subscribed" : "Subscribe"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Feed videos */}
        {feedLoading && (
          <div className="text-center py-20 text-gray-500">Loading feed…</div>
        )}

        {!feedLoading && videos.length === 0 && subscriptions.length > 0 && (
          <div className="text-center py-20 text-gray-600">No videos found from your channels</div>
        )}

        {!feedLoading && videos.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Latest Videos</h2>
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
          </>
        )}
      </main>
    </div>
  );
}
