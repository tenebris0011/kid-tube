import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { searchChannels } from "@/lib/invidious";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q");
  if (q) {
    const results = await searchChannels(q);
    return NextResponse.json(results);
  }

  const db = getDb();
  const kidId = session.role === "kid" ? session.id : null;
  const rows = kidId
    ? db.query("SELECT * FROM channel_subscriptions WHERE kid_id = ? ORDER BY channel_name ASC").all(kidId)
    : db.query("SELECT s.*, u.username as kid_name FROM channel_subscriptions s JOIN users u ON u.id = s.kid_id ORDER BY u.username, s.channel_name").all();

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "kid") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { channelId, channelName, channelThumbnail } = await req.json();
  if (!channelId || !channelName) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const db = getDb();
  db.run(
    "INSERT OR IGNORE INTO channel_subscriptions (kid_id, channel_id, channel_name, channel_thumbnail) VALUES (?, ?, ?, ?)",
    [session.id, channelId, channelName, channelThumbnail ?? null]
  );
  return NextResponse.json({ ok: true });
}
