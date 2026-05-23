import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { embedUrl } from "@/lib/invidious";
import WatchClient from "./WatchClient";

const BASE = process.env.INVIDIOUS_URL ?? "http://localhost:3000";

async function getVideoMeta(videoId: string) {
  try {
    const res = await fetch(`${BASE}/api/v1/videos/${videoId}?fields=title,authorId,author`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json() as { title: string; authorId: string; author: string };
    return data;
  } catch {
    return null;
  }
}

export default async function WatchPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { videoId } = await params;

  if (session.role === "kid") {
    const db = getDb();
    const approved = db
      .query(
        "SELECT id FROM watch_requests WHERE kid_id = ? AND video_id = ? AND status = 'approved'"
      )
      .get(session.id, videoId);
    if (!approved) redirect("/requests");
  }

  const meta = await getVideoMeta(videoId);

  return (
    <WatchClient
      embedUrl={embedUrl(videoId)}
      videoId={videoId}
      videoTitle={meta?.title ?? videoId}
      channelId={meta?.authorId ?? "unknown"}
      channelName={meta?.author ?? "unknown"}
      kidId={session.role === "kid" ? session.id : null}
    />
  );
}
