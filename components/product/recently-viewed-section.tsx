"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import type { Product } from "@/app/lib/catalog/types";
import {
  ProductCard,
  PRODUCT_GRID_DESKTOP_CLASS,
  PRODUCT_RAIL_ITEM,
} from "@/components/storefront";
import {
  getRecentlyViewedSnapshots,
  readRecentlyViewedApiCache,
  writeRecentlyViewedApiCache,
  type RecentlyViewedSnapshot,
} from "@/lib/recently-viewed";

type Props = {
  /** Omit current PDP from the rail when set. */
  excludeSlug?: string;
  className?: string;
};

function productFromSnapshot(entry: RecentlyViewedSnapshot): Product | null {
  if (!entry.name?.trim() || !entry.image?.trim()) return null;
  return {
    id: entry.id?.trim() || entry.slug,
    slug: entry.slug,
    name: entry.name.trim(),
    shortDescription: "",
    description: "",
    category: "",
    collection: "",
    price: typeof entry.price === "number" ? entry.price : 0,
    compareAtPrice:
      typeof entry.compareAtPrice === "number" ? entry.compareAtPrice : undefined,
    rating: 0,
    reviews: 0,
    image: entry.image.trim(),
    tags: [],
    defaultVariantId: entry.defaultVariantId,
    defaultVariantSku: entry.defaultVariantSku,
    inStock: entry.inStock,
  };
}

function productsFromApi(data: unknown): Product[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (row): row is Product =>
      typeof row === "object" &&
      row !== null &&
      typeof (row as Product).slug === "string" &&
      typeof (row as Product).name === "string",
  );
}

function readLocalProducts(excludeSlug?: string): Product[] {
  const snaps = getRecentlyViewedSnapshots(excludeSlug);
  if (snaps.length === 0) return [];

  const fromSnap = snaps
    .map(productFromSnapshot)
    .filter((p): p is Product => Boolean(p));
  if (fromSnap.length > 0) return fromSnap;

  const cached = readRecentlyViewedApiCache(snaps.map((s) => s.slug));
  return cached ? productsFromApi(cached) : [];
}

/**
 * Client-only: never read localStorage during the initial render so SSR HTML
 * matches the first client pass (avoids hydration mismatch).
 */
export function RecentlyViewedSection({ excludeSlug, className = "" }: Props) {
  const [items, setItems] = useState<Product[] | null>(null);
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);
    setItems(readLocalProducts(excludeSlug));
  }, [excludeSlug]);

  useEffect(() => {
    if (!mounted) return;

    const snaps = getRecentlyViewedSnapshots(excludeSlug);
    if (snaps.length === 0) {
      setItems([]);
      return;
    }

    const slugs = snaps.map((s) => s.slug);
    let cancelled = false;
    void fetch(`/api/catalog/recently-viewed?slugs=${encodeURIComponent(slugs.join(","))}`, {
      cache: "default",
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (cancelled) return;
        const next = productsFromApi(data);
        writeRecentlyViewedApiCache(slugs, next as unknown as Record<string, unknown>[]);
        setItems(next);
      })
      .catch(() => {
        if (!cancelled) {
          setItems((prev) => (prev && prev.length > 0 ? prev : []));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [excludeSlug, mounted]);

  // SSR + first client paint: render nothing (identical). Populate after mount.
  if (!mounted || items === null || items.length === 0) return null;

  return (
    <section className={`mt-8 sm:mt-10 ${className}`.trim()}>
      <h2 className="text-[1.50rem] font-semibold tracking-tight sm:text-2xl">
        Recently viewed
      </h2>
      <div className="mt-6 sm:mt-8 md:hidden">
        <ul
          className="-mx-2 flex list-none items-stretch gap-1 overflow-x-auto scroll-px-2 scroll-smooth px-2 pb-2 pt-1 snap-x snap-mandatory sm:mx-0 sm:gap-1.5 sm:px-0 sm:scroll-px-0"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {items.map((item) => (
            <li key={item.id} className={PRODUCT_RAIL_ITEM}>
              <div className="flex h-full min-h-0 flex-1 flex-col">
                <ProductCard
                  product={item}
                  showAddToCart={false}
                  rail
                  clampTitle
                  priorityImage
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className={`mt-6 sm:mt-8 ${PRODUCT_GRID_DESKTOP_CLASS}`}>
        {items.map((item) => (
          <ProductCard
            key={item.id}
            product={item}
            showAddToCart={false}
            clampTitle
            priorityImage
          />
        ))}
      </div>
    </section>
  );
}
