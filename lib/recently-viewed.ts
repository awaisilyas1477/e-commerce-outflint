const STORAGE_KEY = "storefront-recently-viewed-v2";
const LEGACY_STORAGE_KEY = "storefront-recently-viewed-v1";
const API_CACHE_KEY = "storefront-recently-viewed-api-v1";
const MAX_ITEMS = 12;

export type RecentlyViewedSnapshot = {
  slug: string;
  viewedAt: number;
  id?: string;
  name?: string;
  image?: string;
  price?: number;
  compareAtPrice?: number | null;
  defaultVariantId?: string;
  defaultVariantSku?: string;
  inStock?: boolean;
};

export type RecentlyViewedProductInput = {
  id?: string;
  name?: string;
  image?: string;
  price?: number;
  compareAtPrice?: number | null;
  defaultVariantId?: string;
  defaultVariantSku?: string;
  inStock?: boolean;
};

function isSnapshot(row: unknown): row is RecentlyViewedSnapshot {
  return (
    typeof row === "object" &&
    row !== null &&
    typeof (row as RecentlyViewedSnapshot).slug === "string" &&
    typeof (row as RecentlyViewedSnapshot).viewedAt === "number"
  );
}

function readEntries(): RecentlyViewedSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSnapshot).slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

function writeEntries(entries: RecentlyViewedSnapshot[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ITEMS)));
  } catch {
    /* quota / private mode */
  }
}

/** Persist a PDP view (most recent first). Optional card snapshot paints instantly later. */
export function recordRecentlyViewed(
  slug: string,
  snapshot?: RecentlyViewedProductInput,
): void {
  const normalized = slug.trim();
  if (!normalized) return;
  const filtered = readEntries().filter((e) => e.slug !== normalized);
  filtered.unshift({
    slug: normalized,
    viewedAt: Date.now(),
    ...(snapshot?.id ? { id: snapshot.id } : {}),
    ...(snapshot?.name ? { name: snapshot.name } : {}),
    ...(snapshot?.image ? { image: snapshot.image } : {}),
    ...(typeof snapshot?.price === "number" ? { price: snapshot.price } : {}),
    ...(snapshot?.compareAtPrice !== undefined
      ? { compareAtPrice: snapshot.compareAtPrice }
      : {}),
    ...(snapshot?.defaultVariantId
      ? { defaultVariantId: snapshot.defaultVariantId }
      : {}),
    ...(snapshot?.defaultVariantSku
      ? { defaultVariantSku: snapshot.defaultVariantSku }
      : {}),
    ...(typeof snapshot?.inStock === "boolean" ? { inStock: snapshot.inStock } : {}),
  });
  writeEntries(filtered);
}

/** Slugs for recently viewed products, optionally excluding the current PDP. */
export function getRecentlyViewedSlugs(excludeSlug?: string): string[] {
  return getRecentlyViewedSnapshots(excludeSlug).map((e) => e.slug);
}

/** Full snapshots (for instant UI before the API returns). */
export function getRecentlyViewedSnapshots(
  excludeSlug?: string,
): RecentlyViewedSnapshot[] {
  const exclude = excludeSlug?.trim();
  const seen = new Set<string>();
  const out: RecentlyViewedSnapshot[] = [];
  for (const entry of readEntries()) {
    const slug = entry.slug.trim();
    if (!slug || slug === exclude || seen.has(slug)) continue;
    seen.add(slug);
    out.push(entry);
  }
  return out;
}

/** Session cache of last API payload so revisit paints without waiting on network. */
export function readRecentlyViewedApiCache(
  slugs: string[],
): Record<string, unknown>[] | null {
  if (typeof window === "undefined" || slugs.length === 0) return null;
  try {
    const raw = sessionStorage.getItem(API_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { key: string; items: Record<string, unknown>[] };
    if (parsed.key !== slugs.join(",")) return null;
    return Array.isArray(parsed.items) ? parsed.items : null;
  } catch {
    return null;
  }
}

export function writeRecentlyViewedApiCache(
  slugs: string[],
  items: Record<string, unknown>[],
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      API_CACHE_KEY,
      JSON.stringify({ key: slugs.join(","), items }),
    );
  } catch {
    /* ignore */
  }
}
