const BASE = process.env.INVIDIOUS_URL ?? "http://localhost:3000";
const BASE_HOSTNAME = (() => { try { return new URL(BASE).hostname; } catch { return ""; } })();
const PORT_STRIP_RE = BASE_HOSTNAME ? new RegExp(`(https?://${BASE_HOSTNAME}):\\d+(/|$)`) : null;

function normalizeThumbUrl(url: string): string {
  if (!url || !PORT_STRIP_RE) return url;
  return url.replace(PORT_STRIP_RE, "$1$2");
}

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
  return (data as Record<string, unknown>[]).map(normalizeVideo).filter((v): v is VideoResult => v !== null);
}

export async function searchChannels(query: string): Promise<ChannelResult[]> {
  const url = `${BASE}/api/v1/search?q=${encodeURIComponent(query)}&type=channel&fields=authorId,author,authorThumbnails,subCount`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Invidious channel search failed: ${res.status}`);
  const data = await res.json();
  return (data as Record<string, unknown>[]).map(normalizeChannel);
}

async function fetchChannelVideosFromApi(channelId: string, page: number): Promise<VideoResult[]> {
  // Primary: dedicated channel videos endpoint
  try {
    const url = `${BASE}/api/v1/channels/${channelId}/videos?page=${page}`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json() as { videos?: Record<string, unknown>[] } | Record<string, unknown>[];
      const raw = Array.isArray(data) ? data : (data.videos ?? []);
      const videos = raw
        .filter((v) => (v as Record<string, unknown>).type !== "parse-error")
        .map(normalizeVideo)
        .filter((v): v is VideoResult => v !== null);
      if (videos.length > 0) return videos;
    }
  } catch { /* fall through to search fallback */ }

  // Second fallback: shorts endpoint (some channels return playlists from /videos)
  try {
    const url = `${BASE}/api/v1/channels/${channelId}/shorts?page=${page}`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json() as { videos?: Record<string, unknown>[] } | Record<string, unknown>[];
      const raw = Array.isArray(data) ? data : (data as { videos?: Record<string, unknown>[] }).videos ?? [];
      const videos = raw
        .map(normalizeVideo)
        .filter((v): v is VideoResult => v !== null);
      if (videos.length > 0) return videos;
    }
  } catch { /* fall through */ }

  // Final fallback: search by channelId, filter to this channel only
  try {
    const url = `${BASE}/api/v1/search?q=${encodeURIComponent(channelId)}&type=video&page=${page}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json() as Record<string, unknown>[];
    return data
      .map(normalizeVideo)
      .filter((v): v is VideoResult => v !== null && v.channelId === channelId);
  } catch {
    return [];
  }
}

export async function getChannelVideos(channelId: string): Promise<VideoResult[]> {
  const cached = channelCache.get(channelId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.videos;

  const videos = await fetchChannelVideosFromApi(channelId, 1);
  channelCache.set(channelId, { videos, ts: Date.now() });
  return videos;
}

export async function getChannelVideosPage(channelId: string, page: number): Promise<VideoResult[]> {
  return fetchChannelVideosFromApi(channelId, page);
}

export function embedUrl(videoId: string): string {
  return `${BASE}/embed/${videoId}?autoplay=1&rel=0`;
}

function normalizeVideo(v: Record<string, unknown>): VideoResult | null {
  const videoId = v.videoId as string | null;
  const title = (v.title as string | null) ?? "";
  const channelId = (v.authorId as string | null) ?? "";
  const channelName = (v.author as string | null) ?? "";

  // Skip entries missing the fields we can't function without
  if (!videoId || !channelId) return null;

  const thumbs = (v.videoThumbnails as { quality: string; url: string }[]) ?? [];
  const thumb = normalizeThumbUrl(
    thumbs.find((t) => t.quality === "medium")?.url ??
    thumbs[0]?.url ??
    ""
  );
  return {
    videoId,
    title,
    thumbnail: thumb,
    channelId,
    channelName,
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
