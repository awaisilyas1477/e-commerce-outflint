import Link from "next/link";
import Image from "next/image";
import {
  getCachedListCollections,
  getCachedProductsByCollectionSlug,
} from "@/lib/cache/catalog-data";
import { hasCatalogDb } from "@/app/lib/db/env";
import { HomeSectionTitle } from "@/components/ui/home-section-title";
import { HomeCollectionsMarquee } from "@/components/home/home-collections-marquee";
import { optimizeSupplierImageUrl } from "@/lib/images/supplier-cdn";
import {
  collectionDisplayName,
  collectionHref,
  normalizeCollectionSlug,
} from "@/lib/catalog/collection-nav";
import type { Product } from "@/app/lib/catalog/types";

export type HomeCollectionTile = {
  slug: string;
  name: string;
  href: string;
  imageUrl: string;
  count: number;
  /** Unique when the same collection appears with alternate product photos. */
  tileKey?: string;
};

/** Same exclusions as homepage presser-foot callout collage. */
function isWeakCollectionImage(name: string, slug: string, image: string) {
  const hay = `${name} ${slug}`.toLowerCase();
  if (
    /tailor\s*register|customer\s*naap|needle\s*plate|feed\s*dog|premium\s*tailor\s*tool|tailor\s*tool\s*bundle/.test(
      hay,
    )
  ) {
    return true;
  }
  if (slug.includes("16mm-industrial-single-needle")) return true;
  if (/ebayimg\.com/i.test(image)) return true;
  return false;
}

function imageKey(url: string) {
  return url.trim().split("?")[0]!.toLowerCase();
}

/** Stable daily shuffle so ISR cache stays coherent but tiles rotate. */
function daySeed() {
  const d = new Date();
  return d.getUTCFullYear() * 1000 + (d.getUTCMonth() + 1) * 40 + d.getUTCDate();
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const a = [...items];
  let s = seed >>> 0 || 1;
  for (let i = a.length - 1; i > 0; i -= 1) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

function pickProductImages(
  products: Product[],
  seed: number,
  seen: Set<string>,
  limit: number,
): string[] {
  const out: string[] = [];
  const shuffled = seededShuffle(products, seed);
  for (const p of shuffled) {
    if (out.length >= limit) break;
    const raw = (p.image ?? "").trim();
    if (!raw) continue;
    if (isWeakCollectionImage(p.name, p.slug, raw)) continue;
    const key = imageKey(raw);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(optimizeSupplierImageUrl(raw, 400));
  }
  return out;
}

/** Supplier CDNs (Daraz etc.) use native img with sized lazcdn URLs. */
function isNativeImg(src: string): boolean {
  if (!src) return false;
  if (src.startsWith("/") || src.startsWith("data:") || src.startsWith("blob:")) {
    return false;
  }
  try {
    const host = new URL(src).hostname.toLowerCase();
    if (host.endsWith(".supabase.co")) return false;
    if (host === "images.unsplash.com") return false;
    return true;
  } catch {
    return false;
  }
}

export async function loadHomeCollectionTiles(): Promise<HomeCollectionTile[]> {
  if (!hasCatalogDb()) return [];
  const collections = await getCachedListCollections();
  const seed = daySeed();
  const seen = new Set<string>();

  const candidates = collections.filter((col) => {
    const slug = col.slug?.trim();
    const name = col.name?.trim();
    return Boolean(slug && name && slug !== "sale");
  });

  const loaded = await Promise.all(
    candidates.map(async (col, index) => {
      const rawSlug = col.slug.trim();
      const slug = normalizeCollectionSlug(rawSlug);
      const name = collectionDisplayName(slug, col.name.trim());
      const products = await getCachedProductsByCollectionSlug(slug);
      return { col, slug, name, products, index };
    }),
  );

  // Presser-foot claims a strong unique shot first (same pool idea as callout).
  const ordered = [...loaded].sort((a, b) => {
    const ap = a.slug === "presser-foot-collection" ? 0 : 1;
    const bp = b.slug === "presser-foot-collection" ? 0 : 1;
    return ap - bp || a.index - b.index;
  });

  const bySlug = new Map<
    string,
    { name: string; href: string; count: number; images: string[] }
  >();

  for (const row of ordered) {
    if (row.products.length === 0) continue;
    // Primary + alternate so the marquee isn't clones of one photo.
    const images = pickProductImages(
      row.products,
      seed + row.index * 97,
      seen,
      2,
    );
    const hero = (row.col.hero_image ?? "").trim();
    if (images.length === 0 && hero) {
      const key = imageKey(hero);
      if (!seen.has(key)) {
        seen.add(key);
        images.push(optimizeSupplierImageUrl(hero, 400));
      }
    }
    if (images.length === 0) {
      const fallback =
        row.products.find((p) => (p.image ?? "").trim())?.image?.trim() ?? "";
      if (fallback) images.push(optimizeSupplierImageUrl(fallback, 400));
    }
    bySlug.set(row.slug, {
      name: row.name,
      href: collectionHref(row.slug),
      count: row.products.length,
      images,
    });
  }

  const tiles: HomeCollectionTile[] = [];
  for (const row of loaded) {
    const data = bySlug.get(row.slug);
    if (!data || data.images.length === 0) continue;
    data.images.forEach((imageUrl, i) => {
      tiles.push({
        slug: row.slug,
        name: data.name,
        href: data.href,
        imageUrl,
        count: data.count,
        tileKey: i === 0 ? row.slug : `${row.slug}-alt-${i}`,
      });
    });
  }

  return tiles;
}

/** Shared image-overlay tiles — used on home strip and `/collections` hub. */
export function CollectionImageTiles({ tiles }: { tiles: HomeCollectionTile[] }) {
  if (tiles.length === 0) return null;

  // Hub grid: one tile per collection (primary image only).
  const primary = tiles.filter(
    (t, i, arr) => arr.findIndex((x) => x.slug === t.slug) === i,
  );

  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
      {primary.map((tile, i) => {
        const native = isNativeImg(tile.imageUrl);
        return (
          <li
            key={tile.tileKey ?? tile.slug}
            className="home-collection-tile"
            style={{ ["--tile-i" as string]: i }}
          >
            <Link
              href={tile.href}
              className="group relative block aspect-[1/1] overflow-hidden rounded-2xl bg-neutral-200 shadow-[0_8px_24px_-12px_rgba(28,29,29,0.35)] ring-1 ring-black/5 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-16px_rgba(28,29,29,0.45)] hover:ring-[#E0703A]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E0703A]"
            >
              {tile.imageUrl ? (
                native ? (
                  // eslint-disable-next-line @next/next/no-img-element -- supplier CDNs (Daraz) outside next/image allowlist
                  <img
                    src={tile.imageUrl}
                    alt={`${tile.name} collection`}
                    className="absolute inset-0 h-full w-full object-cover object-center transition duration-700 ease-out group-hover:scale-[1.08]"
                    loading="lazy"
                    decoding="async"
                    width={400}
                    height={400}
                  />
                ) : (
                  <Image
                    src={tile.imageUrl}
                    alt={`${tile.name} collection`}
                    fill
                    className="object-cover object-center transition duration-700 ease-out group-hover:scale-[1.08]"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                )
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-400">
                  {tile.name}
                </div>
              )}

              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[48%] bg-gradient-to-t from-black/55 via-black/20 to-transparent"
                aria-hidden
              />

              <span
                className="pointer-events-none absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-base text-[#1c1d1d] opacity-0 shadow-sm backdrop-blur-md transition duration-300 group-hover:opacity-100 group-hover:bg-[#E0703A] group-hover:text-white sm:right-4 sm:top-4"
                aria-hidden
              >
                →
              </span>

              <div className="absolute inset-x-0 bottom-0 z-20 p-2.5 sm:p-4">
                <span
                  className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.14em] text-white/80 opacity-0 translate-y-1 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:mb-1.5 sm:text-[10px] sm:tracking-[0.16em]"
                  aria-hidden
                >
                  Shop now
                </span>
                <div className="flex items-end justify-between gap-1.5 sm:gap-2">
                  <span className="text-[13px] font-semibold leading-snug text-white drop-shadow-sm sm:text-[15px]">
                    {tile.name}
                  </span>
                  <span className="shrink-0 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#1c1d1d] shadow-sm backdrop-blur-md transition group-hover:bg-[#E0703A] group-hover:text-white sm:px-2.5 sm:py-1 sm:text-[10px]">
                    {tile.count}{" "}
                    <span className="font-medium normal-case tracking-normal opacity-90">
                      {tile.count === 1 ? "item" : "items"}
                    </span>
                  </span>
                </div>
                <span
                  className="mt-2.5 block h-[2px] w-8 origin-left scale-x-0 bg-[#E0703A] transition duration-300 group-hover:scale-x-100"
                  aria-hidden
                />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Compact collection strip under the featured band — infinite marquee banners. */
export function HomeCollectionsStrip({
  tiles,
  headingId = "home-collections-heading",
  headingAs = "h2",
  showViewAll = true,
}: {
  tiles: HomeCollectionTile[];
  headingId?: string;
  headingAs?: "h1" | "h2";
  /** Hide on `/collections` itself (already the hub). */
  showViewAll?: boolean;
}) {
  if (tiles.length === 0) return null;

  return (
    <section
      aria-labelledby={headingId}
      className="relative overflow-hidden border-b border-[#e8e8e1] bg-[linear-gradient(180deg,#f7f5f2_0%,#ffffff_55%,#ffffff_100%)]"
    >
      <div
        className="pointer-events-none absolute -left-16 top-4 h-32 w-32 rounded-full bg-[#E0703A]/[0.06] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl shell-x pb-2.5 pt-4 sm:pb-3 sm:pt-5">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E0703A] sm:text-[11px]">
              Browse
            </p>
            <HomeSectionTitle
              id={headingId}
              as={headingAs}
              center={false}
              className="!mt-0.5"
            >
              Shop collections
            </HomeSectionTitle>
          </div>
          {showViewAll ? (
            <Link
              href="/collections"
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#1c1d1d]/12 bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#1c1d1d] shadow-sm transition hover:border-[#E0703A] hover:text-[#E0703A] sm:px-3.5 sm:text-[11px]"
            >
              View all
              <span aria-hidden>→</span>
            </Link>
          ) : null}
        </div>
      </div>

      <div className="relative pb-4 sm:pb-5">
        <HomeCollectionsMarquee tiles={tiles} />
      </div>
    </section>
  );
}
