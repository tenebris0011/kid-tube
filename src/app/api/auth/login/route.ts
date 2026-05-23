import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const db = getDb();
  const user = db
    .query("SELECT * FROM users WHERE username = ?")
    .get(username) as { id: number; username: string; password_hash: string; role: string } | null;

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signToken({ id: user.id, username: user.username, role: user.role as "parent" | "kid" });
  const res = NextResponse.json({ ok: true, role: user.role, username: user.username });
  res.cookies.set("session", token, { httpOnly: true, maxAge: 60 * 60 * 24 * 30, path: "/" });
  return res;
}
