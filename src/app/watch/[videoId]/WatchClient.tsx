"use client";
import { useEffect, useRef } from "react";
import KidNav from "@/components/KidNav";

interface Props {
  embedUrl: string;
  videoId: string;
  videoTitle: string;
  channelId: string;
  channelName: string;
  kidId: number | null;
}

export default function WatchClient({ embedUrl, videoId, videoTitle, channelId, channelName, kidId }: Props) {
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
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <KidNav current="watch" />
      </header>
      <iframe
        src={embedUrl}
        className="flex-1 w-full"
        style={{ minHeight: "calc(100vh - 53px)" }}
        allowFullScreen
        allow="autoplay; fullscreen"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
