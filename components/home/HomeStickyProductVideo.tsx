import { unstable_noStore as noStore } from "next/cache";
import { StickyProductVideo } from "@/components/product/sticky-product-video";
import { dbListActiveProductsWithVideoUrl } from "@/app/lib/db/catalog";
import { parseProductVideoSource } from "@/lib/product-video/url";
import { resolveInstagramCdnByCode } from "@/lib/product-video/resolve-instagram";
import { optimizeSupplierImageUrl } from "@/lib/images/supplier-cdn";

function streamCodeFromVideoUrl(videoUrl: string): string | null {
  const src = parseProductVideoSource(videoUrl);
  const m = src?.src.match(/[?&]code=([^&]+)/);
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

/**
 * Homepage sticky reel + Rad-style vertical feed of every product with a video URL
 * (Instagram reel/post or direct MP4/HLS).
 */
export async function HomeStickyProductVideo() {
  noStore();
  const rows = await dbListActiveProductsWithVideoUrl();
  const candidates = rows
    .map((r) => {
      if (!parseProductVideoSource(r.video_url)) return null;
      const poster = r.poster_url
        ? optimizeSupplierImageUrl(r.poster_url, 400) || r.poster_url
        : null;
      return {
        videoUrl: r.video_url,
        productName: r.name,
        productHref: `/products/${r.slug}`,
        posterUrl: poster,
        igCode: streamCodeFromVideoUrl(r.video_url),
      };
    })
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  if (!candidates.length) return null;

  const uniqueCodes = [
    ...new Set(candidates.map((c) => c.igCode).filter((c): c is string => Boolean(c))),
  ];
  const resolved = await Promise.all(
    uniqueCodes.map(async (code) => {
      const url = await resolveInstagramCdnByCode(code).catch(() => null);
      return [code, Boolean(url)] as const;
    }),
  );
  const okCodes = new Set(resolved.filter(([, ok]) => ok).map(([code]) => code));

  const playable = candidates
    .filter((c) => !c.igCode || okCodes.has(c.igCode))
    .map(({ igCode: _ig, ...reel }) => reel);

  if (!playable.length) return null;

  const startIndex = Math.floor(Math.random() * playable.length);
  return <StickyProductVideo reels={playable} startIndex={startIndex} />;
}
