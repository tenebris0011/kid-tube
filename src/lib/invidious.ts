const BASE = process.env.INVIDIOUS_URL ?? "http://localhost:3000";

const channelCache = new Map<string, { videos: VideoResult[]; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export interface VideoResult {
  videoId: string;
  title: string;
  thumbnail: string;
  channelId: string;
  channelName: string;
  viewCount: number;
  lengthSeconds: number;
  publishedText: string;
  published: number;
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

export async function getChannelVideos(channelId: string): Promise<VideoResult[]> {
  const cached = channelCache.get(channelId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.videos;

  try {
    const url = `${BASE}/api/v1/channels/${channelId}/videos`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json() as { videos?: Record<string, unknown>[] } | Record<string, unknown>[];
    const raw = Array.isArray(data) ? data : (data.videos ?? []);
    const videos = raw.map(normalizeVideo);
    channelCache.set(channelId, { videos, ts: Date.now() });
    return videos;
  } catch {
    return [];
  }
}

export async function getChannelVideosPage(channelId: string, page: number): Promise<VideoResult[]> {
  try {
    const url = `${BASE}/api/v1/channels/${channelId}/videos?page=${page}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json() as { videos?: Record<string, unknown>[] } | Record<string, unknown>[];
    const raw = Array.isArray(data) ? data : (data.videos ?? []);
    return raw.map(normalizeVideo);
  } catch {
    return [];
  }
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
    published: (v.published as number) ?? 0,
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
