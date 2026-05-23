import { NextRequest, NextResponse } from "next/server";
import { requireParent } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function DELETE(
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

  const kid = db.query("SELECT id FROM users WHERE id = ? AND role = 'kid'").get(id);
  if (!kid) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete associated data before removing the account
  db.run("DELETE FROM watch_history WHERE kid_id = ?", [id]);
  db.run("DELETE FROM watch_requests WHERE kid_id = ?", [id]);
  db.run("DELETE FROM users WHERE id = ?", [id]);

  return NextResponse.json({ ok: true });
}
