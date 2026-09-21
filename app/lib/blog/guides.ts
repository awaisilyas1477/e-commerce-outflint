import type { Product } from "@/app/lib/catalog/types";
import type { BlogImage } from "@/app/lib/blog/product-blog";

export type StaticGuideMeta = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  publishedAt: string;
  readTimeMinutes: number;
  categoryLabel: string;
  keywords: string[];
  collectionSlug?: string;
  imageProductSlugs: string[];
};

/**
 * Outflint blogs are product reviews only (one per active catalog item).
 * Legacy SimpleCart home/kitchen static guides are intentionally empty.
 */
export const STATIC_BLOG_GUIDES: StaticGuideMeta[] = [];

export const STATIC_GUIDE_LISTING_HERO: Record<string, string> = {};

export function getStaticGuideMeta(slug: string): StaticGuideMeta | undefined {
  return STATIC_BLOG_GUIDES.find((g) => g.slug === slug);
}

export function pickGuideImages(products: Product[], storeName: string): BlogImage[] {
  const out: BlogImage[] = [];
  const seen = new Set<string>();
  for (const p of products) {
    const src = (p.image ?? "").trim();
    if (!src || seen.has(src)) continue;
    seen.add(src);
    out.push({
      src,
      alt: `${p.name} — available at ${storeName}`,
    });
  }
  return out;
}

export function staticGuideListingCard(
  meta: StaticGuideMeta,
  storeName: string,
  heroImageOverride?: string | null,
) {
  const heroSrc =
    heroImageOverride ||
    STATIC_GUIDE_LISTING_HERO[meta.slug] ||
    "/brand/logo.svg";
  return {
    slug: meta.slug,
    title: meta.title,
    excerpt: meta.metaDescription,
    publishedAt: meta.publishedAt,
    readTimeMinutes: meta.readTimeMinutes,
    categoryLabel: meta.categoryLabel,
    image: {
      src: heroSrc,
      alt: `${meta.title} — ${storeName} guide`,
    },
    href: `/blogs/${meta.slug}`,
    isGuide: true as const,
  };
}
