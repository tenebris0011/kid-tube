"use client";
import { useState, useEffect } from "react";

interface Kid {
  id: number;
  username: string;
  created_at: number;
}

export default function ParentKidsPage() {
  const [kids, setKids] = useState<Kid[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  async function load() {
    const res = await fetch("/api/kids");
    setKids(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: number) {
    await fetch(`/api/kids/${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    setKids((prev) => prev.filter((k) => k.id !== id));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    const res = await fetch("/api/kids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to create account");
      return;
    }
    setSuccess(true);
    setUsername("");
    setPassword("");
    load();
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-4">
        <a href="/parent" className="text-red-500 font-bold text-xl">KidTube</a>
        <h2 className="font-semibold">Manage Kids</h2>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Existing kids */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-300">Kid accounts ({kids.length})</h3>
          {kids.length === 0 && (
            <p className="text-gray-600 text-sm">No kid accounts yet</p>
          )}
          {kids.map((k) => (
            <div key={k.id} className="bg-gray-900 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-2xl">👦</span>
              <p className="font-medium flex-1">{k.username}</p>
              {confirmDelete === k.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Delete account?</span>
                  <button
                    onClick={() => handleDelete(k.id)}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    Yes, delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(k.id)}
                  className="text-gray-500 hover:text-red-400 text-sm transition-colors px-2"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add new kid */}
        <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold">Add a kid</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Username</label>
              <input
                className="w-full bg-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <input
                type="password"
                className="w-full bg-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-green-400 text-sm">Account created!</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg py-2 font-semibold transition-colors"
            >
              {loading ? "Creating…" : "Create Account"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
