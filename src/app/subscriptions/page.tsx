"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import KidNav from "@/components/KidNav";

interface Subscription {
  id: number;
  channel_id: string;
  channel_name: string;
  channel_thumbnail: string | null;
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/subscriptions")
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then((data) => { if (data) setSubscriptions(data); setLoading(false); });
  }, [router]);

  async function unsubscribe(channelId: string) {
    setRemoving(channelId);
    await fetch(`/api/subscriptions/${channelId}`, { method: "DELETE" });
    setSubscriptions((prev) => prev.filter((s) => s.channel_id !== channelId));
    setRemoving(null);
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-4 pt-3 pb-2 space-y-1">
        <div className="flex items-center justify-between">
          <KidNav current="feed" />
        </div>
        <h2 className="text-sm font-semibold text-white pb-1">My Channels</h2>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {loading && <p className="text-gray-500 text-center py-10">Loading…</p>}

        {!loading && subscriptions.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <p className="text-gray-500">You haven&apos;t subscribed to any channels yet.</p>
            <a href="/feed" className="text-red-500 hover:text-red-400 text-sm transition-colors">
              Go to Feed to add channels
            </a>
          </div>
        )}

        {subscriptions.map((s) => (
          <div key={s.channel_id} className="bg-gray-900 rounded-xl px-4 py-3 flex items-center gap-3">
            <Link href={`/channel/${s.channel_id}`} className="shrink-0">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-800">
                {s.channel_thumbnail ? (
                  <Image src={s.channel_thumbnail} alt="" fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg">
                    {s.channel_name?.[0] ?? "?"}
                  </div>
                )}
              </div>
            </Link>
            <Link href={`/channel/${s.channel_id}`} className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate hover:text-gray-300 transition-colors">
                {s.channel_name}
              </p>
            </Link>
            <button
              type="button"
              onClick={() => unsubscribe(s.channel_id)}
              disabled={removing === s.channel_id}
              className="shrink-0 text-sm text-gray-500 hover:text-red-400 disabled:opacity-50 transition-colors px-2 py-1"
            >
              {removing === s.channel_id ? "Removing…" : "Unsubscribe"}
            </button>
          </div>
        ))}
      </main>
    </div>
  );
}
