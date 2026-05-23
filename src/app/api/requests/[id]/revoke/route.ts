import { NextRequest, NextResponse } from "next/server";
import { requireParent } from "@/lib/auth";
import { getDb } from "@/lib/db";

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
    .query("SELECT id, status FROM watch_requests WHERE id = ?")
    .get(id) as { id: number; status: string } | null;

  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (request.status !== "approved") {
    return NextResponse.json({ error: "Only approved requests can be revoked" }, { status: 400 });
  }

  db.run(
    "UPDATE watch_requests SET status = 'denied', resolved_at = unixepoch() WHERE id = ?",
    [id]
  );

  return NextResponse.json({ ok: true });
}
