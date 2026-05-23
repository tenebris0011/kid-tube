"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Props {
  embedUrl: string;
  videoId: string;
  videoTitle: string;
  channelId: string;
  channelName: string;
  kidId: number | null;
}

export default function WatchClient({ embedUrl, videoId, videoTitle, channelId, channelName, kidId }: Props) {
  const router = useRouter();
  const recorded = useRef(false);

  useEffect(() => {
    if (kidId && !recorded.current) {
      recorded.current = true;
      fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, videoTitle, channelId, channelName }),
      }).catch(() => {});
    }
  }, [kidId, videoId, videoTitle, channelId, channelName]);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-900">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition-colors text-sm"
        >
          ← Back
        </button>
        <span className="text-red-500 font-bold">KidTube</span>
      </div>
      <iframe
        src={embedUrl}
        className="flex-1 w-full"
        style={{ minHeight: "calc(100vh - 44px)" }}
        allowFullScreen
        allow="autoplay; fullscreen"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
