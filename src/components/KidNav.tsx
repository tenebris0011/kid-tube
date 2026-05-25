"use client";
import { useRouter } from "next/navigation";

type Page = "feed" | "search" | "requests" | "watch";

export default function KidNav({ current }: { current: Page }) {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="flex items-center justify-between w-full">
      <h1 className="text-red-500 font-bold text-xl">KidTube</h1>
      <nav className="flex gap-4 text-sm text-gray-400">
        {current === "feed" ? (
          <span className="text-white font-medium">Feed</span>
        ) : (
          <a href="/feed" className="hover:text-white transition-colors">Feed</a>
        )}
        {current === "search" ? (
          <span className="text-white font-medium">Search</span>
        ) : (
          <a href="/search" className="hover:text-white transition-colors">Search</a>
        )}
        {current === "requests" ? (
          <span className="text-white font-medium">Requests</span>
        ) : (
          <a href="/requests" className="hover:text-white transition-colors">Requests</a>
        )}
        <button onClick={signOut} className="hover:text-white transition-colors">
          Sign out
        </button>
      </nav>
    </div>
  );
}
