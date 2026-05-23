import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";

// One-time setup to create the parent account.
// Disabled once any parent account exists.
export async function POST(req: NextRequest) {
  const db = getDb();
  const existing = db.query("SELECT id FROM users WHERE role = 'parent'").get();
  if (existing) {
    return NextResponse.json({ error: "Setup already complete" }, { status: 400 });
  }

  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);
  db.run(
    "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'parent')",
    [username, hash]
  );
  return NextResponse.json({ ok: true });
}
