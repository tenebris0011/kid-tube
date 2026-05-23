import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "kid") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { channelId } = await params;
  const db = getDb();
  db.run(
    "DELETE FROM channel_subscriptions WHERE kid_id = ? AND channel_id = ?",
    [session.id, channelId]
  );
  return NextResponse.json({ ok: true });
}
