import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { editApprovalMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const update = await req.json() as {
    callback_query?: {
      id: string;
      data: string;
      message: { message_id: number };
      from: { first_name: string };
    };
  };

  const cb = update.callback_query;
  if (!cb) return NextResponse.json({ ok: true });

  const [action, requestIdStr] = cb.data.split(":");
  const requestId = parseInt(requestIdStr, 10);
  if (!requestId || (action !== "approve" && action !== "deny")) {
    return NextResponse.json({ ok: true });
  }

  const db = getDb();
  const request = db
    .query("SELECT r.*, u.username as kid_name FROM watch_requests r JOIN users u ON u.id = r.kid_id WHERE r.id = ?")
    .get(requestId) as { status: string; kid_name: string; video_title: string } | null;

  if (!request || request.status !== "pending") {
    return NextResponse.json({ ok: true });
  }

  const newStatus = action === "approve" ? "approved" : "denied";
  db.run(
    "UPDATE watch_requests SET status = ?, resolved_at = unixepoch() WHERE id = ?",
    [newStatus, requestId]
  );

  // Answer immediately so the spinner clears regardless of what happens next
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: cb.id }),
    }
  );

  await editApprovalMessage(
    cb.message.message_id,
    action === "approve",
    request.kid_name,
    request.video_title
  );

  return NextResponse.json({ ok: true });
}
