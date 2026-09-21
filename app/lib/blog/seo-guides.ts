import type { Product } from "@/app/lib/catalog/types";
import type { BlogArticle } from "@/app/lib/blog/product-blog";
import { getStaticGuideMeta } from "@/app/lib/blog/guides";

/**
 * Static SEO topic guides are disabled for Outflint.
 * Blog index + routes use per-product reviews from `product-blog.ts` only.
 */
export function buildSeoGuideArticle(
  _slug: string,
  _storeName: string,
  _imageProducts: Product[],
): BlogArticle | null {
  return null;
}

export function seoGuideCrumbLabel(slug: string): string {
  const meta = getStaticGuideMeta(slug);
  if (!meta) return "Blog Guide";
  return meta.title.split("—")[0]?.trim() || meta.title;
}
