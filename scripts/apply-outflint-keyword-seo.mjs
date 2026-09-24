/**
 * Outflint SEO: map high-intent long-tail keywords (Juki/Brother/Singer + foot/part)
 * onto existing products + collections. Does NOT invent stock — only maps what we sell.
 *
 * Run: node scripts/apply-outflint-keyword-seo.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";

const URL = "https://qnlqcfwdebrscvqxxahe.supabase.co";
const keysRaw = execSync(
  "npx supabase projects api-keys --project-ref qnlqcfwdebrscvqxxahe --agent=no -o json",
  { encoding: "utf8" },
).replace(/^\uFEFF/, "");
const SERVICE = JSON.parse(keysRaw).find((k) => k.name === "service_role").api_key;
const sb = createClient(URL, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Top opportunities: demand + lower competition + Outflint stock */
const PRODUCT_TARGETS = [
  {
    slug: "magnetic-seam-guide-for-sewing-machine-or-hem-and-stitching-guide",
    primary: "magnetic seam guide for sewing machine",
    title: "Magnetic Seam Guide for Sewing Machine | Hem Guide – Outflint Pakistan",
    description:
      "Buy magnetic seam guide for sewing machine in Pakistan. Straight hem & stitch guide for home and industrial machines. COD nationwide from Outflint.",
    keywords: [
      "magnetic seam guide for sewing machine",
      "magnetic seam guide",
      "sewing machine seam guide",
      "hem guide sewing machine",
      "presser foot guide",
    ],
    extraSearch: "magnetic seam guide, seam guide gauge, stitching guide, hem guide",
  },
  {
    slug: "piping-sewing-machine-presser-foot-or-professional-piping-attachment-for-tailors-garments-and-upholstery-stitching-outflint",
    primary: "piping sewing machine presser foot",
    title: "Piping Sewing Machine Presser Foot | Piping Attachment – Outflint",
    description:
      "Shop piping sewing machine presser foot in Pakistan for garments & upholstery. Professional piping attachment with COD delivery from Outflint.",
    keywords: [
      "piping sewing machine presser foot",
      "piping presser foot",
      "sewing machine piping foot",
      "piping foot for sewing machine",
      "sewing foot attachments",
    ],
    extraSearch: "piping foot, cording foot, welt foot, piping attachment",
  },
  {
    slug: "10mm-narrow-rolled-hemmer-foot-industrial-sewing-machine",
    primary: "juki narrow hem foot",
    title: "10mm Narrow Rolled Hemmer Foot | Juki Industrial Style – Outflint",
    description:
      "Buy 10mm narrow rolled hemmer foot for industrial sewing machines. Ideal as Juki-style narrow hem foot. Steel hemmer, COD Pakistan – Outflint.",
    keywords: [
      "juki narrow hem foot",
      "juki narrow presser foot",
      "narrow rolled hemmer foot",
      "10mm rolled hem foot",
      "industrial sewing machine hemmer foot",
    ],
    extraSearch: "narrow hem foot, rolled hem foot, juki hemmer, industrial hemmer 10mm",
  },
  {
    slug: "4mm-narrow-rolled-hemmer-foot-industrial-sewing-machine",
    primary: "juki narrow presser foot",
    title: "4mm Narrow Rolled Hemmer Foot | Industrial Narrow Hem – Outflint",
    description:
      "4mm narrow rolled hemmer presser foot for industrial lockstitch machines. Narrow hem foot for fine fabrics. COD across Pakistan – Outflint.",
    keywords: [
      "juki narrow presser foot",
      "narrow hemmer foot 4mm",
      "narrow rolled hem foot",
      "industrial narrow presser foot",
      "sewing machine presser feet",
    ],
    extraSearch: "4mm hemmer, narrow presser foot, juki foot, rolled hem",
  },
  {
    slug: "outflint-narrow-rolled-hem-presser-foot-set-3pcs-3mm-6mm-or-stainless-steel-sewing-machine-hemming-feet-for-lightweight-fabric",
    primary: "sewing machine presser feet",
    title: "Narrow Rolled Hem Presser Foot Set 3PCS | Sewing Machine Feet – Outflint",
    description:
      "3PCS narrow rolled hem presser foot set (3–6mm) for lightweight fabric. Sewing machine presser feet for hemming. COD Pakistan – Outflint.",
    keywords: [
      "sewing machine presser feet",
      "sewing machine feet",
      "narrow rolled hem presser foot set",
      "hemming feet set",
      "sewing feet",
    ],
    extraSearch: "hem foot set, rolled hem set, sewing feet, presser feet set",
  },
  {
    slug: "rolled-hem-presser-foot-set-6-sizes-for-low-shank-machines",
    primary: "low shank presser foot",
    title: "Rolled Hem Presser Foot Set 6 Sizes | Low Shank – Outflint Pakistan",
    description:
      "Low shank rolled hem presser foot set in 6 sizes. Compatible low shank presser foot for home sewing machines. Order with COD – Outflint.",
    keywords: [
      "low shank presser foot",
      "rolled hem presser foot set",
      "low shank sewing machine feet",
      "sewing machine foot",
      "sewing feet",
    ],
    extraSearch: "low shank foot, low shank hemmer, home machine presser foot",
  },
  {
    slug: "cr-116-metal-pressure-foot-or-industrial-sewing-machine-presser-foot-for-juki-brother-singer-and-more-outflint",
    primary: "juki sewing machine foot",
    title: "CR 1/16 Metal Presser Foot for Juki Brother Singer | Outflint",
    description:
      "CR 1/16 metal pressure foot for industrial sewing machines — Juki, Brother, Singer compatible. Shop Juki sewing machine foot style parts in Pakistan.",
    keywords: [
      "juki sewing machine foot",
      "juki pressure foot",
      "industrial sewing machine presser foot",
      "brother presser foot",
      "singer presser foot",
    ],
    extraSearch: "CR 1/16, CR1/16N, juki foot, brother foot, singer foot, pressure foot",
  },
  {
    slug: "spk-3-high-shank-roller-presser-foot-for-singer-brother-juki-and-industrial-sewing-machines-or-heavy-fabric-leather-and-denim-roller-foot-for-tailors",
    primary: "singer presser foot",
    title: "SPK-3 High Shank Roller Presser Foot Singer Brother Juki – Outflint",
    description:
      "High shank roller presser foot for Singer, Brother, Juki & industrial machines. Heavy fabric, leather & denim. Singer presser foot style – COD Pakistan.",
    keywords: [
      "singer presser foot",
      "brother presser foot",
      "juki sewing machine feet",
      "high shank presser foot",
      "shank for sewing machine",
    ],
    extraSearch: "SPK-3, roller foot, high shank, singer foot, brother foot, juki roller",
  },
  {
    slug: "adjustable-invisible-zipper-foot-for-singer-sewing-machine-with-screwdriver-presser-foot-accessory",
    primary: "foot for singer sewing machine",
    title: "Invisible Zipper Foot for Singer Sewing Machine | Outflint Pakistan",
    description:
      "Adjustable invisible zipper foot for Singer sewing machine with screwdriver. Presser foot accessory for zippers. COD delivery – Outflint.",
    keywords: [
      "foot for singer sewing machine",
      "presser foot for singer sewing machine",
      "singer sewing machine foot",
      "invisible zipper foot singer",
      "singer presser foot",
    ],
    extraSearch: "singer zipper foot, singer presser, singer sewing foot",
  },
  {
    slug: "industrial-shirring-presser-foot-p952-for-brother-singer-juki-sewing-machine",
    primary: "presser foot for brother sewing machine",
    title: "P952 Shirring Presser Foot for Brother Singer Juki | Outflint",
    description:
      "Industrial shirring presser foot P952 for Brother, Singer & Juki. Presser foot for Brother sewing machine style industrial use. COD – Outflint.",
    keywords: [
      "presser foot for brother sewing machine",
      "brother presser foot",
      "brother sewing machine feet",
      "shirring presser foot",
      "juki sewing machine feet",
    ],
    extraSearch: "P952, shirring foot, brother foot, gathering foot",
  },
  {
    slug: "2pcs-thread-guide-spool-pin-229-32552-for-juki-ddl-8700-sewing-machine-accessories",
    primary: "juki ddl-8700 industrial sewing machine",
    title: "Thread Guide Spool Pin for Juki DDL-8700 | 229-32552 – Outflint",
    description:
      "2PCS thread guide spool pin #229-32552 for Juki DDL-8700 industrial sewing machine. Genuine-fit style accessory. COD Pakistan – Outflint.",
    keywords: [
      "juki ddl-8700 industrial sewing machine",
      "juki industrial sewing machine accessories",
      "juki ddl-8700 parts",
      "229-32552",
      "sewing machine parts",
    ],
    extraSearch: "DDL-8700, juki 8700, spool pin, thread guide juki, industrial juki parts",
  },
  {
    slug: "industrial-sewing-machine-side-cutter-attachment-or-metal-side-knife-trimming-foot-for-factory-sewing-machines-or-heavy-duty-tailor-fabric-cutting-tool-outflint",
    primary: "side cutter presser foot",
    title: "Industrial Side Cutter Presser Foot Attachment | Outflint Pakistan",
    description:
      "Metal side cutter / side knife trimming presser foot for industrial sewing machines. Side cutter presser foot for factory tailoring. COD – Outflint.",
    keywords: [
      "side cutter presser foot",
      "sewing machine side cutter",
      "side knife presser foot",
      "industrial side cutter attachment",
      "sewing foot attachments",
    ],
    extraSearch: "side cutter, side knife, trimming foot, overcast cutter foot",
  },
  {
    slug: "adjustable-edge-guide-presser-foot-kt-18-1-8mm-for-industrial-sewing-machine",
    primary: "guide foot sewing",
    title: "KT-18 Adjustable Edge Guide Presser Foot | Guide Foot – Outflint",
    description:
      "Adjustable edge guide presser foot KT-18 (1–8mm) for industrial sewing. Guide foot sewing for straight seams. COD nationwide – Outflint.",
    keywords: [
      "guide foot sewing",
      "edge joining foot for sewing machine",
      "presser foot guide",
      "edge-stitch foot",
      "adjustable edge guide presser foot",
    ],
    extraSearch: "KT-18, edge guide foot, edge stitch foot, seam guide foot",
  },
  {
    slug: "a800-2nd-gen-ruffling-presser-foot-for-shirt-ruffle-and-gathering-stitch",
    primary: "ruffle foot",
    title: "A800 Ruffling Presser Foot | Ruffle Foot Gathering – Outflint",
    description:
      "A800 2nd gen ruffling presser foot for shirt ruffles & gathering. Ruffle foot / ruffler-style attachment for industrial sewing. COD – Outflint.",
    keywords: [
      "ruffle foot",
      "ruffler foot sewing",
      "ruffling presser foot",
      "gathering presser foot",
      "sewing foot attachments",
    ],
    extraSearch: "A800, ruffler, gathering foot, shirt ruffle foot",
  },
  {
    slug: "10pcs-metal-sewing-machine-bobbins-set-home-firki",
    primary: "juki industrial sewing machine bobbins",
    title: "10pcs Metal Sewing Machine Bobbins Set | Firki – Outflint Pakistan",
    description:
      "Metal sewing machine bobbins set (10pcs) for home machines. Bobbin / firki pack for continuous stitching. Related to industrial bobbin needs – Outflint COD.",
    keywords: [
      "sewing machine bobbins",
      "metal sewing machine bobbins",
      "juki industrial sewing machine bobbins",
      "sewing accessories kit",
      "sewing machine accessories",
    ],
    extraSearch: "bobbins, firki, bobbin set, metal bobbin",
  },
];

const COLLECTION_TARGETS = [
  {
    slug: "presser-foot-collection",
    title: "Sewing Machine Presser Feet & Feet in Pakistan | Outflint",
    description:
      "Shop sewing machine presser feet, industrial feet, Juki Brother Singer compatible foots, hemmer, piping & guide feet. COD across Pakistan – Outflint.",
    keywords: [
      "sewing machine presser feet",
      "sewing machine feet",
      "sewing machine foot",
      "sewing feet",
      "presser feet for singer sewing machine",
      "presser foot for brother sewing machine",
      "juki sewing machine feet",
      "low shank presser foot",
      "sewing foot attachments",
    ],
  },
  {
    slug: "stitching-accessories",
    title: "Sewing Machine Parts & Accessories in Pakistan | Outflint",
    description:
      "Buy sewing machine parts, notions & stitching accessories in Pakistan — needles, bobbins, guides, Juki industrial accessories. Fast COD – Outflint.",
    keywords: [
      "sewing machine parts",
      "sewing machine accessories",
      "sewing notions",
      "juki industrial sewing machine accessories",
      "brother sewing machine parts",
      "sewing accessories kit",
      "tailoring tools pakistan",
    ],
  },
];

const ROUTE_TARGETS = [
  {
    subject_key: "/",
    title: "Sewing Machine Parts & Presser Feet Pakistan | Outflint",
    description:
      "Outflint — sewing machine parts, presser feet for Juki Brother Singer, and tailoring accessories with cash on delivery across Pakistan.",
    keywords: [
      "sewing machine parts",
      "sewing machine presser feet",
      "juki sewing machine foot",
      "presser foot pakistan",
      "sewing accessories pakistan",
    ],
  },
  {
    subject_key: "/search",
    title: "Search Presser Feet & Sewing Parts | Outflint Pakistan",
    description:
      "Search Outflint for presser feet, Juki Brother Singer parts, bobbins, needles and sewing machine accessories. COD nationwide.",
    keywords: [
      "presser foot for brother sewing machine",
      "singer presser foot",
      "juki narrow hem foot",
      "magnetic seam guide for sewing machine",
      "sewing machine feet",
    ],
  },
  {
    subject_key: "/collections",
    title: "Sewing Collections | Presser Feet & Parts Pakistan – Outflint",
    description:
      "Browse Outflint collections: presser foot collection, stitching accessories, sewing storage. Sewing machine parts with COD in Pakistan.",
    keywords: [
      "sewing machine parts",
      "sewing machine presser feet",
      "sewing notions",
      "stitching accessories pakistan",
      "presser foot collection",
    ],
  },
];

function mergeExtra(existing, add) {
  const parts = new Set();
  for (const chunk of String(existing || "")
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)) {
    parts.add(chunk);
  }
  for (const chunk of String(add || "")
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)) {
    parts.add(chunk);
  }
  return [...parts].join(", ");
}

async function upsertProductSeo(productId, slug, t) {
  // Prefer subject_id rows (storefront loader uses subject_id).
  const { data: byId } = await sb
    .from("seo_meta")
    .select("id")
    .eq("subject_type", "product")
    .eq("subject_id", productId)
    .eq("locale", "en")
    .maybeSingle();

  const row = {
    subject_type: "product",
    subject_id: productId,
    subject_key: null,
    locale: "en",
    title: t.title,
    description: t.description.slice(0, 160),
    keywords: t.keywords,
    twitter_card: "summary_large_image",
    noindex: false,
    nofollow: false,
    updated_at: new Date().toISOString(),
  };

  if (byId?.id) {
    const { error } = await sb.from("seo_meta").update(row).eq("id", byId.id);
    if (error) throw error;
  } else {
    const { error } = await sb.from("seo_meta").insert(row);
    if (error) throw error;
  }

  // Also refresh any legacy subject_key=slug rows so they stay in sync.
  await sb
    .from("seo_meta")
    .update({
      title: t.title,
      description: t.description.slice(0, 160),
      keywords: t.keywords,
      updated_at: new Date().toISOString(),
    })
    .eq("subject_type", "product")
    .eq("subject_key", slug)
    .eq("locale", "en");
}

async function upsertCollectionSeo(collectionId, t) {
  const { data: existing } = await sb
    .from("seo_meta")
    .select("id")
    .eq("subject_type", "collection")
    .eq("subject_id", collectionId)
    .eq("locale", "en")
    .maybeSingle();

  const row = {
    subject_type: "collection",
    subject_id: collectionId,
    subject_key: null,
    locale: "en",
    title: t.title,
    description: t.description.slice(0, 160),
    keywords: t.keywords,
    twitter_card: "summary_large_image",
    noindex: false,
    nofollow: false,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await sb.from("seo_meta").update(row).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await sb.from("seo_meta").insert(row);
    if (error) throw error;
  }
}

async function upsertRouteSeo(t) {
  const { data: existing } = await sb
    .from("seo_meta")
    .select("id")
    .eq("subject_type", "route")
    .eq("subject_key", t.subject_key)
    .eq("locale", "en")
    .maybeSingle();

  const row = {
    subject_type: "route",
    subject_id: null,
    subject_key: t.subject_key,
    locale: "en",
    title: t.title,
    description: t.description.slice(0, 160),
    keywords: t.keywords,
    twitter_card: "summary_large_image",
    noindex: false,
    nofollow: false,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await sb.from("seo_meta").update(row).eq("id", existing.id);
    if (error) throw error;
  } else {
    // Some DBs use subject_type differently for home — try storefront_route / page
    const { error } = await sb.from("seo_meta").insert(row);
    if (error) {
      console.warn(`Route ${t.subject_key} insert skipped:`, error.message);
    }
  }
}

async function main() {
  let productsOk = 0;
  let productsMiss = 0;

  for (const t of PRODUCT_TARGETS) {
    const { data: p, error } = await sb
      .from("products")
      .select("id, slug, search_keywords_extra")
      .eq("slug", t.slug)
      .maybeSingle();
    if (error || !p) {
      console.warn("MISS product", t.slug, error?.message);
      productsMiss++;
      continue;
    }
    await upsertProductSeo(p.id, t.slug, t);
    const extra = mergeExtra(p.search_keywords_extra, `${t.primary}, ${t.extraSearch}, ${t.keywords.join(", ")}`);
    const { error: uErr } = await sb
      .from("products")
      .update({
        search_keywords_extra: extra,
        updated_at: new Date().toISOString(),
      })
      .eq("id", p.id);
    if (uErr) console.warn("search_keywords_extra", t.slug, uErr.message);
    console.log("OK product", t.primary, "→", t.slug);
    productsOk++;
  }

  let collectionsOk = 0;
  for (const t of COLLECTION_TARGETS) {
    const { data: c, error } = await sb
      .from("collections")
      .select("id, slug")
      .eq("slug", t.slug)
      .maybeSingle();
    if (error || !c) {
      console.warn("MISS collection", t.slug);
      continue;
    }
    await upsertCollectionSeo(c.id, t);
    console.log("OK collection", t.slug);
    collectionsOk++;
  }

  for (const t of ROUTE_TARGETS) {
    await upsertRouteSeo(t);
    console.log("OK route attempt", t.subject_key);
  }

  console.log(
    JSON.stringify(
      {
        productsOk,
        productsMiss,
        collectionsOk,
        primaryKeywords: PRODUCT_TARGETS.map((x) => x.primary),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
