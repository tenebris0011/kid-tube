import { NextRequest, NextResponse } from "next/server";
import { requireParent } from "@/lib/auth";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await requireParent();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getDb();
  const kids = db
    .query("SELECT id, username, created_at FROM users WHERE role = 'kid' ORDER BY username ASC")
    .all();
  return NextResponse.json(kids);
}

export async function POST(req: NextRequest) {
  try {
    await requireParent();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const db = getDb();
  const existing = db.query("SELECT id FROM users WHERE username = ?").get(username);
  if (existing) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 10);
  db.run(
    "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'kid')",
    [username, hash]
  );
  return NextResponse.json({ ok: true });
}
