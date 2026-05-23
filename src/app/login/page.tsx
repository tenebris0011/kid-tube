"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Login failed");
      return;
    }
    if (data.role === "parent") router.push("/parent");
    else router.push("/search");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500">KidTube</h1>
          <p className="text-gray-400 mt-2">Sign in to watch</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-8 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input
              className="w-full bg-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
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
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg py-3 font-semibold transition-colors"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
