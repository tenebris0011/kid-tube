"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Setup failed");
      return;
    }
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500">KidTube</h1>
          <p className="text-gray-400 mt-2">Create parent account</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-8 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input
              className="w-full bg-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              className="w-full bg-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg py-3 font-semibold transition-colors"
          >
            {loading ? "Creating…" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
