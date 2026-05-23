"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export interface VideoCardData {
  videoId: string;
  title: string;
  thumbnail: string;
  channelId: string;
  channelName: string;
  lengthSeconds: number;
  publishedText: string;
  channelAllowed: boolean;
}

function formatDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

interface Props {
  video: VideoCardData;
  subscribedChannels: Set<string>;
  onSubscribeToggle: (channelId: string, channelName: string, thumbnail: string, subscribed: boolean) => void;
}

export default function VideoCard({ video: v, subscribedChannels, onSubscribeToggle }: Props) {
  const router = useRouter();
  const [requesting, setRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);

  async function handleRequest() {
    setRequesting(true);
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId: v.videoId,
        videoTitle: v.title,
        videoThumbnail: v.thumbnail,
        channelId: v.channelId,
        channelName: v.channelName,
      }),
    });
    const data = await res.json();
    setRequesting(false);
    if (data.status === "approved") {
      router.push(`/watch/${v.videoId}`);
    } else {
      setRequestStatus(data.status);
    }
  }

  const isSubscribed = subscribedChannels.has(v.channelId);

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      <div className="relative aspect-video bg-gray-800">
        {v.thumbnail && (
          <Image src={v.thumbnail} alt={v.title} fill className="object-cover" unoptimized />
        )}
        <span className="absolute bottom-2 right-2 bg-black/80 text-xs px-1.5 py-0.5 rounded">
          {formatDuration(v.lengthSeconds)}
        </span>
      </div>
      <div className="p-3 space-y-2">
        <p className="text-sm font-medium line-clamp-2 leading-snug">{v.title}</p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-400 truncate flex items-center gap-1">
            {v.channelName}
            {v.channelAllowed && (
              <span className="text-green-400 text-[10px] bg-green-400/10 px-1.5 py-0.5 rounded-full shrink-0">
                Approved
              </span>
            )}
          </p>
          <button
            onClick={() => onSubscribeToggle(v.channelId, v.channelName, v.thumbnail, isSubscribed)}
            className={`text-[11px] shrink-0 px-2 py-0.5 rounded-full border transition-colors ${
              isSubscribed
                ? "border-gray-600 text-gray-500 hover:border-red-500 hover:text-red-400"
                : "border-gray-600 text-gray-400 hover:border-white hover:text-white"
            }`}
          >
            {isSubscribed ? "Subscribed" : "+ Subscribe"}
          </button>
        </div>
        <button
          onClick={handleRequest}
          disabled={requesting || !!requestStatus}
          className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
            requestStatus === "approved"
              ? "bg-green-600"
              : requestStatus === "pending"
              ? "bg-yellow-600/80 cursor-default"
              : "bg-red-600 hover:bg-red-700 disabled:opacity-50"
          }`}
        >
          {requesting
            ? "…"
            : requestStatus === "pending"
            ? "Waiting for approval"
            : requestStatus === "approved"
            ? "Watch now"
            : v.channelAllowed
            ? "Watch"
            : "Ask to watch"}
        </button>
      </div>
    </div>
  );
}
