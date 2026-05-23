import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  let rows;
  if (session.role === "parent") {
    rows = db
      .query(`
        SELECT h.*, u.username as kid_name
        FROM watch_history h
        JOIN users u ON u.id = h.kid_id
        ORDER BY h.watched_at DESC
        LIMIT 200
      `)
      .all();
  } else {
    rows = db
      .query(`
        SELECT h.*, u.username as kid_name
        FROM watch_history h
        JOIN users u ON u.id = h.kid_id
        WHERE h.kid_id = ?
        ORDER BY h.watched_at DESC
        LIMIT 100
      `)
      .all(session.id);
  }
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "kid") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { videoId, videoTitle, channelId, channelName } = await req.json();
  if (!videoId || !videoTitle || !channelId || !channelName) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const db = getDb();
  db.run(
    "INSERT INTO watch_history (kid_id, video_id, video_title, channel_id, channel_name) VALUES (?, ?, ?, ?, ?)",
    [session.id, videoId, videoTitle, channelId, channelName]
  );
  return NextResponse.json({ ok: true });
}
