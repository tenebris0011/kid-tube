import { Database } from "bun:sqlite";
import path from "path";

const dbPath = path.resolve(process.env.DB_PATH ?? "./data/kid-tube.db");

let _db: Database | null = null;

export function getDb(): Database {
  if (_db) return _db;
  _db = new Database(dbPath, { create: true });
  _db.run("PRAGMA journal_mode = WAL");
  _db.run("PRAGMA foreign_keys = ON");
  initSchema(_db);
  return _db;
}

function initSchema(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('parent', 'kid')),
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS allowed_channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id TEXT NOT NULL UNIQUE,
      channel_name TEXT NOT NULL,
      channel_thumbnail TEXT,
      added_by INTEGER NOT NULL REFERENCES users(id),
      added_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS watch_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kid_id INTEGER NOT NULL REFERENCES users(id),
      video_id TEXT NOT NULL,
      video_title TEXT NOT NULL,
      video_thumbnail TEXT,
      channel_id TEXT NOT NULL,
      channel_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'denied')),
      telegram_message_id INTEGER,
      requested_at INTEGER NOT NULL DEFAULT (unixepoch()),
      resolved_at INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS watch_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kid_id INTEGER NOT NULL REFERENCES users(id),
      video_id TEXT NOT NULL,
      video_title TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      channel_name TEXT NOT NULL,
      watched_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS channel_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kid_id INTEGER NOT NULL REFERENCES users(id),
      channel_id TEXT NOT NULL,
      channel_name TEXT NOT NULL,
      channel_thumbnail TEXT,
      subscribed_at INTEGER NOT NULL DEFAULT (unixepoch()),
      UNIQUE(kid_id, channel_id)
    )
  `);
}
