import { ProductSection } from "@/components/storefront";
import {
  HomeCollectionsStrip,
  loadHomeCollectionTiles,
} from "@/components/home/HomeCollectionsStrip";
import { TrustRatingStrip } from "@/components/home/TrustRatingStrip";
import { ProductCardSkeleton } from "@/components/ui/product-card-skeleton";
import { getHomeRailSections } from "@/app/lib/home-rails";
import { getCachedHomeReviewHighlights } from "@/lib/cache/home-review-highlights";
import { getCachedStoreReviewAggregate } from "@/lib/cache/store-review-aggregate";

/** Skeleton for Daraz-style categories grid under the hero. */
export function HomeFirstStripSkeleton() {
  return (
    <div className="border-b border-[#eff0f5] bg-white" aria-busy="true" aria-label="Loading categories">
      <div className="mx-auto max-w-7xl shell-x pb-3 pt-3 sm:pb-4 sm:pt-4">
        <div className="mb-3 h-4 w-24 animate-pulse rounded bg-neutral-100" />
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="aspect-square w-full animate-pulse rounded-sm bg-neutral-100" />
              <div className="h-2.5 w-12 animate-pulse rounded bg-neutral-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Skeleton for product rails + reviews while they stream in. */
export function HomeDeferredSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading products">
      {Array.from({ length: 2 }).map((_, section) => (
        <section
          key={section}
          className="border-b border-[#e8e8e1] bg-neutral-100/80 py-3.5 sm:py-6"
        >
          <div className="mx-auto max-w-7xl shell-x">
            <div className="mb-3 h-6 w-48 animate-pulse rounded bg-neutral-100 sm:mb-5 sm:h-7 sm:w-56" />
            <div className="flex gap-1 overflow-hidden md:hidden">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[calc((100vw-1rem)/2.15)] max-w-[152px] shrink-0 animate-pulse"
                >
                  <div className="aspect-square rounded-md bg-neutral-200/80" />
                  <div className="mt-1.5 h-3 w-4/5 rounded bg-neutral-100" />
                  <div className="mt-1 h-3 w-1/2 rounded bg-neutral-100" />
                </div>
              ))}
            </div>
            <div className="hidden gap-2 md:grid md:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <ProductCardSkeleton key={i} variant="rail" showAddToCart={false} />
              ))}
            </div>
          </div>
        </section>
      ))}
      <div className="border-t border-neutral-200 bg-white py-10">
        <div className="mx-auto max-w-[1200px] shell-x">
          <div className="h-48 animate-pulse rounded bg-neutral-100 md:h-64" />
        </div>
      </div>
    </div>
  );
}

/**
 * First visual strip after hero — collections only (no featured callout).
 * Streams independently so the hero can paint without waiting on rails/reviews.
 */
export async function HomeFirstStrip() {
  const collectionTiles = await loadHomeCollectionTiles();
  return <HomeCollectionsStrip tiles={collectionTiles} />;
}

/**
 * Product rails + social proof — deferred after hero + first strip.
 * Recently viewed is client-only and mounts earlier on the home page so it
 * does not wait behind rails/reviews.
 */
export async function HomeDeferredSections() {
  const [railSections, storeReviews, reviewHighlights] = await Promise.all([
    getHomeRailSections(),
    getCachedStoreReviewAggregate(),
    getCachedHomeReviewHighlights(),
  ]);

  return (
    <>
      {railSections.map((rail) => (
        <ProductSection
          key={rail.viewAllHref}
          title={rail.title}
          items={rail.items}
          viewAllHref={rail.viewAllHref}
          showAddToCart={false}
          layout="rail"
          totalProductCount={rail.totalProductCount}
        />
      ))}
      <TrustRatingStrip aggregate={storeReviews} reviews={reviewHighlights} />
    </>
  );
}
