import { NextRequest, NextResponse } from "next/server";
import { requireParent } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { searchChannels } from "@/lib/invidious";

export async function GET(req: NextRequest) {
  try {
    await requireParent();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const q = req.nextUrl.searchParams.get("q");
  if (q) {
    const results = await searchChannels(q);
    return NextResponse.json(results);
  }

  const db = getDb();
  const channels = db
    .query("SELECT * FROM allowed_channels ORDER BY channel_name ASC")
    .all();
  return NextResponse.json(channels);
}

export async function POST(req: NextRequest) {
  let parent;
  try {
    parent = await requireParent();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { channelId, channelName, channelThumbnail } = await req.json();
  if (!channelId || !channelName) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const db = getDb();
  db.run(
    "INSERT OR IGNORE INTO allowed_channels (channel_id, channel_name, channel_thumbnail, added_by) VALUES (?, ?, ?, ?)",
    [channelId, channelName, channelThumbnail ?? null, parent.id]
  );
  return NextResponse.json({ ok: true });
}
