import { NextRequest, NextResponse } from "next/server";
import { requireParent } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { editApprovalMessage } from "@/lib/telegram";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireParent();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const db = getDb();
  const request = db
    .query("SELECT r.*, u.username as kid_name FROM watch_requests r JOIN users u ON u.id = r.kid_id WHERE r.id = ?")
    .get(id) as { telegram_message_id: number | null; kid_name: string; video_title: string } | null;

  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  db.run(
    "UPDATE watch_requests SET status = 'denied', resolved_at = unixepoch() WHERE id = ?",
    [id]
  );

  if (request.telegram_message_id) {
    await editApprovalMessage(request.telegram_message_id, false, request.kid_name, request.video_title);
  }

  return NextResponse.json({ ok: true });
}
