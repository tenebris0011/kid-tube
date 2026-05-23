import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getChannelVideos } from "@/lib/invidious";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "kid") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getDb();

  const subscriptions = db
    .query("SELECT channel_id FROM channel_subscriptions WHERE kid_id = ?")
    .all(session.id) as { channel_id: string }[];

  if (subscriptions.length === 0) return NextResponse.json([]);

  const allowed = db
    .query("SELECT channel_id FROM allowed_channels")
    .all() as { channel_id: string }[];
  const allowedSet = new Set(allowed.map((r) => r.channel_id));

  // Fetch all channels in parallel
  const results = await Promise.allSettled(
    subscriptions.map((s) => getChannelVideos(s.channel_id))
  );

  const videos = results
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .sort((a, b) => b.published - a.published)
    // Deduplicate by videoId (a video could theoretically appear via two paths)
    .filter((v, i, arr) => arr.findIndex((x) => x.videoId === v.videoId) === i)
    .slice(0, 100);

  return NextResponse.json(
    videos.map((v) => ({ ...v, channelAllowed: allowedSet.has(v.channelId) }))
  );
}
