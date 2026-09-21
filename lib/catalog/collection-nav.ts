/**
 * Canonical Outflint collection slugs, display names, and legacy slug redirects.
 * Keep footer, home tiles, header shop menu, and DB migrations aligned here.
 */
export type CollectionNavItem = {
  slug: string;
  name: string;
  href: string;
};

/** Legacy / mismatched slug → current Outflint slug. */
export const COLLECTION_SLUG_ALIASES: Record<string, string> = {
  // Outflint home_page_sections historically omitted "and"
  "sewing-storage-organizer-cases": "sewing-storage-and-organizer-cases",
  "presser-foot": "presser-foot-collection",
  // Ignore leftover Outflint slugs if they appear in old configs
  drinkware: "stitching-accessories",
  "drinkware-tumblers": "stitching-accessories",
  kitchen: "stitching-accessories",
  "kitchen-essentials": "stitching-accessories",
  appliances: "presser-foot-collection",
  "home-appliances": "presser-foot-collection",
  beauty: "sewing-storage-and-organizer-cases",
  "beauty-personal-care": "sewing-storage-and-organizer-cases",
  lighting: "deals",
  "lamps-lighting": "deals",
  wellness: "deals",
  "wellness-comfort": "deals",
  home: "stitching-accessories",
  "home-essentials": "stitching-accessories",
  "pest-control": "deals",
};

export const COLLECTION_NAV_ITEMS: CollectionNavItem[] = [
  {
    slug: "stitching-accessories",
    name: "Stitching Accessories",
    href: "/collections/stitching-accessories",
  },
  {
    slug: "presser-foot-collection",
    name: "Presser Foot Collection",
    href: "/collections/presser-foot-collection",
  },
  {
    slug: "sewing-storage-and-organizer-cases",
    name: "Sewing Storage & Organizer Cases",
    href: "/collections/sewing-storage-and-organizer-cases",
  },
  {
    slug: "deals",
    name: "Deals",
    href: "/collections/deals",
  },
];

const DISPLAY_NAME_BY_SLUG = new Map(
  COLLECTION_NAV_ITEMS.map((item) => [item.slug, item.name] as const),
);

export function normalizeCollectionSlug(slug: string): string {
  const trimmed = slug.trim();
  if (!trimmed) return trimmed;
  return COLLECTION_SLUG_ALIASES[trimmed] ?? trimmed;
}

export function collectionDisplayName(slug: string, fallbackName = ""): string {
  const normalized = normalizeCollectionSlug(slug);
  return DISPLAY_NAME_BY_SLUG.get(normalized) ?? (fallbackName.trim() || normalized);
}

export function collectionHref(slug: string): string {
  return `/collections/${normalizeCollectionSlug(slug)}`;
}

/** Footer / static nav — excludes `sale` and other non-catalog links. */
export const FOOTER_COLLECTION_LINKS: CollectionNavItem[] = [
  ...COLLECTION_NAV_ITEMS,
];
