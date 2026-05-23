const BASE = process.env.INVIDIOUS_URL ?? "http://localhost:3000";

export interface VideoResult {
  videoId: string;
  title: string;
  thumbnail: string;
  channelId: string;
  channelName: string;
  viewCount: number;
  lengthSeconds: number;
  publishedText: string;
}

export interface ChannelResult {
  channelId: string;
  channelName: string;
  thumbnail: string;
  subscriberCount: number;
}

export async function searchVideos(query: string): Promise<VideoResult[]> {
  const url = `${BASE}/api/v1/search?q=${encodeURIComponent(query)}&type=video&fields=videoId,title,videoThumbnails,authorId,author,viewCount,lengthSeconds,publishedText`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Invidious search failed: ${res.status}`);
  const data = await res.json();
  return (data as Record<string, unknown>[]).map(normalizeVideo);
}

export async function searchChannels(query: string): Promise<ChannelResult[]> {
  const url = `${BASE}/api/v1/search?q=${encodeURIComponent(query)}&type=channel&fields=authorId,author,authorThumbnails,subCount`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Invidious channel search failed: ${res.status}`);
  const data = await res.json();
  return (data as Record<string, unknown>[]).map(normalizeChannel);
}

export function embedUrl(videoId: string): string {
  return `${BASE}/embed/${videoId}?autoplay=1&rel=0`;
}

function normalizeVideo(v: Record<string, unknown>): VideoResult {
  const thumbs = (v.videoThumbnails as { quality: string; url: string }[]) ?? [];
  const thumb =
    thumbs.find((t) => t.quality === "medium")?.url ??
    thumbs[0]?.url ??
    "";
  return {
    videoId: v.videoId as string,
    title: v.title as string,
    thumbnail: thumb,
    channelId: v.authorId as string,
    channelName: v.author as string,
    viewCount: (v.viewCount as number) ?? 0,
    lengthSeconds: (v.lengthSeconds as number) ?? 0,
    publishedText: (v.publishedText as string) ?? "",
  };
}

function normalizeChannel(c: Record<string, unknown>): ChannelResult {
  const thumbs = (c.authorThumbnails as { url: string }[]) ?? [];
  return {
    channelId: c.authorId as string,
    channelName: c.author as string,
    thumbnail: thumbs[0]?.url ?? "",
    subscriberCount: (c.subCount as number) ?? 0,
  };
}
