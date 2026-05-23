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
  db.run("DELETE FROM allowed_channels WHERE id = ?", [id]);
  return NextResponse.json({ ok: true });
}
