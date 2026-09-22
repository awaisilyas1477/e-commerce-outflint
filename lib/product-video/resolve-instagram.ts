import { unstable_cache } from "next/cache";
import { extractInstagramCode } from "@/lib/product-video/url";

const IG_UA_MOBILE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const IG_UA_DESKTOP =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

type CacheEntry = { url: string | null; expiresAt: number };

/** Process-local CDN URL cache — avoids re-scraping Instagram on every Range request. */
const cdnCache = new Map<string, CacheEntry>();
const CDN_HIT_TTL_MS = 25 * 60 * 1000;
/** Brief negative cache only — Instagram blocks are often transient from datacenter IPs. */
const CDN_MISS_TTL_MS = 45 * 1000;
const inflight = new Map<string, Promise<string | null>>();

/**
 * Cross-instance cache for *successful* resolves only.
 * Throws on miss so Next.js does not persist null for ~25 minutes.
 */
const cachedScrapeInstagramCdnHit = unstable_cache(
  async (code: string) => {
    const url = await scrapeInstagramCdn(code);
    if (!url) throw new Error("IG_CDN_MISS");
    return url;
  },
  ["ig-cdn-video-v2"],
  { revalidate: 1500 },
);

function unescapeIgUrl(raw: string): string {
  let url = raw;
  // Instagram embed JSON is often double-escaped (\\\/).
  for (let i = 0; i < 4; i++) {
    if (!url.includes("\\")) break;
    url = url
      .replace(/\\u0026/gi, "&")
      .replace(/\\u003d/gi, "=")
      .replace(/\\u0025/gi, "%")
      .replace(/\\\//g, "/")
      .replace(/\\\\/g, "\\");
  }
  return url;
}

function extractVideoUrlFromHtml(html: string): string | null {
  let from = 0;
  while (from < html.length) {
    const marker = html.indexOf("video_url", from);
    if (marker < 0) break;
    // Long CDN query strings; keep a wide window past the marker.
    const slice = html.slice(marker, marker + 16000);
    const httpsIdx = slice.search(/https:/i);
    if (httpsIdx >= 0) {
      const mp4Idx = slice.indexOf(".mp4", httpsIdx);
      if (mp4Idx >= 0) {
        let end = mp4Idx + 4;
        while (end < slice.length) {
          const c = slice[end];
          if (
            c === '"' ||
            c === "'" ||
            c === "," ||
            c === "}" ||
            c === " " ||
            c === "\n" ||
            c === "\\"
          ) {
            if (c === "\\" && slice[end + 1] === "/") {
              end += 2;
              continue;
            }
            if (c === "\\" && slice[end + 1] === "\\") {
              end += 2;
              continue;
            }
            if (c === "\\" && slice[end + 1] === "u") {
              end += 6;
              continue;
            }
            break;
          }
          end += 1;
        }
        const url = unescapeIgUrl(slice.slice(httpsIdx, end));
        if (/^https:\/\/.+\.mp4(\?|$)/i.test(url)) return url;
      }
    }
    from = marker + 9;
  }
  return null;
}

async function fetchEmbedHtml(page: string, ua: string): Promise<string | null> {
  try {
    const res = await fetch(page, {
      headers: {
        "User-Agent": ua,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      // Never cache empty/challenge HTML — that was locking videos into 502s.
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function scrapeInstagramCdn(code: string): Promise<string | null> {
  const candidates = [
    `https://www.instagram.com/reel/${code}/embed/captioned/`,
    `https://www.instagram.com/p/${code}/embed/captioned/`,
    `https://www.instagram.com/reel/${code}/embed/`,
    `https://www.instagram.com/p/${code}/embed/`,
  ];

  for (const page of candidates) {
    for (const ua of [IG_UA_MOBILE, IG_UA_DESKTOP]) {
      const html = await fetchEmbedHtml(page, ua);
      if (!html) continue;
      const videoUrl = extractVideoUrlFromHtml(html);
      if (videoUrl) return videoUrl;
    }
  }
  return null;
}

/**
 * Resolve Instagram shortcode → CDN MP4 (cached in-process).
 */
export async function resolveInstagramCdnByCode(code: string): Promise<string | null> {
  const key = code.trim();
  if (!/^[A-Za-z0-9_-]{5,64}$/.test(key)) return null;

  const hit = cdnCache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.url;

  const existing = inflight.get(key);
  if (existing) return existing;

  const job = (async () => {
    let url: string | null = null;
    try {
      url = await cachedScrapeInstagramCdnHit(key);
    } catch {
      // Miss is not stored in the data cache; one uncached retry for this request.
      url = await scrapeInstagramCdn(key);
    }
    cdnCache.set(key, {
      url,
      expiresAt: Date.now() + (url ? CDN_HIT_TTL_MS : CDN_MISS_TTL_MS),
    });
    return url;
  })().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, job);
  return job;
}

/**
 * Resolve a public Instagram reel/post page URL to a direct CDN MP4.
 */
export async function resolveInstagramCdnVideoUrl(
  instagramPageUrl: string,
): Promise<string | null> {
  let url: URL;
  try {
    url = new URL(instagramPageUrl);
  } catch {
    return null;
  }
  const extracted = extractInstagramCode(url.pathname);
  if (!extracted) return null;
  return resolveInstagramCdnByCode(extracted.code);
}

/** Fire-and-forget / awaited warm so the first video byte is faster. */
export async function warmInstagramVideoResolve(code: string): Promise<void> {
  await resolveInstagramCdnByCode(code);
}
