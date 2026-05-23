import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getChannelVideosPage } from "@/lib/invidious";
import { getDb } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { channelId } = await params;
  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10);

  const videos = await getChannelVideosPage(channelId, page);

  const db = getDb();
  const allowed = db
    .query("SELECT channel_id FROM allowed_channels")
    .all() as { channel_id: string }[];
  const allowedSet = new Set(allowed.map((r) => r.channel_id));

  return NextResponse.json(
    videos.map((v) => ({ ...v, channelAllowed: allowedSet.has(v.channelId) }))
  );
}
