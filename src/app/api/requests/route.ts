import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { sendApprovalRequest } from "@/lib/telegram";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  let rows;
  if (session.role === "parent") {
    rows = db
      .query(`
        SELECT r.*, u.username as kid_name
        FROM watch_requests r
        JOIN users u ON u.id = r.kid_id
        ORDER BY r.requested_at DESC
      `)
      .all();
  } else {
    rows = db
      .query(`
        SELECT r.*, u.username as kid_name
        FROM watch_requests r
        JOIN users u ON u.id = r.kid_id
        WHERE r.kid_id = ?
        ORDER BY r.requested_at DESC
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

  const { videoId, videoTitle, videoThumbnail, channelId, channelName } = await req.json();
  if (!videoId || !videoTitle || !channelId || !channelName) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const db = getDb();

  // Check if channel is already allowed — auto-approve
  const allowed = db
    .query("SELECT id FROM allowed_channels WHERE channel_id = ?")
    .get(channelId);

  // Check for existing pending/approved request for same video
  const existing = db
    .query("SELECT id, status FROM watch_requests WHERE kid_id = ? AND video_id = ? AND status != 'denied'")
    .get(session.id, videoId) as { id: number; status: string } | null;

  if (existing) {
    return NextResponse.json({ id: existing.id, status: existing.status });
  }

  const status = allowed ? "approved" : "pending";
  const result = db.run(
    "INSERT INTO watch_requests (kid_id, video_id, video_title, video_thumbnail, channel_id, channel_name, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [session.id, videoId, videoTitle, videoThumbnail ?? null, channelId, channelName, status]
  );
  const requestId = Number(result.lastInsertRowid);

  if (!allowed) {
    const msgId = await sendApprovalRequest({
      requestId,
      kidName: session.username,
      videoId,
      videoTitle,
      channelName,
      thumbnail: videoThumbnail ?? "",
    });
    if (msgId) {
      db.run("UPDATE watch_requests SET telegram_message_id = ? WHERE id = ?", [msgId, requestId]);
    }
  }

  return NextResponse.json({ id: requestId, status });
}
