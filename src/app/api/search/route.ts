import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { searchVideos } from "@/lib/invidious";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json([]);

  const videos = await searchVideos(q);

  // Annotate which channels are allowlisted
  const db = getDb();
  const allowed = db
    .query("SELECT channel_id FROM allowed_channels")
    .all() as { channel_id: string }[];
  const allowedSet = new Set(allowed.map((r) => r.channel_id));

  return NextResponse.json(
    videos.map((v) => ({ ...v, channelAllowed: allowedSet.has(v.channelId) }))
  );
}
