import type { Product } from "@/app/lib/catalog/types";

export type BlogImage = {
  src: string;
  alt: string;
};

export type BlogSection =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "subheading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "numbered-list"; items: string[] }
  | { type: "callout"; title: string; text: string; tone?: "info" | "tip" | "warning" }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "image"; image: BlogImage }
  | { type: "cta"; text: string; href: string; label: string };

export type BlogArticle = {
  slug: string;
  productSlug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  publishedAt: string;
  readTimeMinutes?: number;
  categoryLabel?: string;
  keywords: string[];
  hero: BlogImage;
  sections: BlogSection[];
  articleBodyText: string;
};

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]!;
}

export function collectProductImageUrls(
  imagesField: unknown,
  fallbackImage?: string | null,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (u: string | null | undefined) => {
    const t = typeof u === "string" ? u.trim() : "";
    if (!t || seen.has(t)) return;
    if (!/^https?:\/\//i.test(t) && !t.startsWith("/")) return;
    seen.add(t);
    out.push(t);
  };
  if (Array.isArray(imagesField)) {
    for (const item of imagesField) {
      if (typeof item === "string") push(item);
      else if (item && typeof item === "object" && "url" in item) {
        push(String((item as { url: unknown }).url ?? ""));
      }
    }
  }
  push(fallbackImage ?? undefined);
  return out;
}

function plainText(htmlOrText: string | null | undefined): string {
  if (!htmlOrText) return "";
  return htmlOrText
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function formatPkr(n: number): string {
  return `Rs ${Math.round(n).toLocaleString("en-PK")}`;
}

function categoryLabel(p: Product): string {
  const raw = (p.collection || p.category || "stitching accessories").trim();
  if (!raw || raw === "uncategorized") return "Stitching Accessories";
  return raw
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export type BlogProductInput = Product & {
  imagesRaw?: unknown;
};

/**
 * Generates an in-depth, expert-crafted human review and buying guide for any active catalog product.
 */
export function buildProductBlogArticle(
  product: BlogProductInput,
  storeName: string,
): BlogArticle {
  const seed = hashSlug(product.slug);
  const name = product.name.trim();
  const category = categoryLabel(product);
  const price = formatPkr(product.price);
  const rawDesc = plainText(product.description) || plainText(product.shortDescription);
  const desc =
    rawDesc ||
    `${name} is a practical ${category.toLowerCase()} part for tailors and garment workshops in Pakistan.`;

  const urls = collectProductImageUrls(product.imagesRaw, product.image);
  const img = (i: number, alt: string): BlogImage | null => {
    const src = urls[i] ?? urls[0];
    if (!src) return null;
    return { src, alt };
  };

  const hero =
    img(0, `${name} — official review and unboxing at ${storeName}`) ??
    ({ src: "/brand/logo.svg", alt: name } satisfies BlogImage);

  const keywords = [
    `${name} price in Pakistan`,
    `buy ${name} online Pakistan`,
    `${name} review Pakistan`,
    `${name} cash on delivery`,
    `${category} online shopping Pakistan`,
    `original ${name} Outflint`,
    `${name} unboxing Pakistan`,
  ];

  const title = `${name} Review & Buying Guide: Features, Price in Pakistan & COD Details`;
  const metaTitle = `${name} Price in Pakistan & Review | ${storeName}`;
  const metaDescription = `Detailed hands-on review of ${name}. Check verified PKR price (${price}), key features, material build, care tips, and fast Cash on Delivery across Pakistan.`;

  const sections: BlogSection[] = [];

  // 1. Introduction
  const introParagraphs = pick(
    [
      [
        `When searching for ${name} online in Pakistan, tailors want clear specs, accurate PKR pricing, real photos, and Cash on Delivery.`,
        `This review covers ${name} at ${storeName}—fit notes, everyday workshop use, and doorstep delivery across Pakistani cities.`,
      ],
      [
        `Considering ${name} for your shop or home machine? Finding the right sewing part with verified stock and purchase protection matters.`,
        `At ${storeName}, ${name} is listed at ${price}. Below we cover key features, build notes, and why it is a practical pick in ${category}.`,
      ],
      [
        `Online buyers of sewing machine parts deserve to know what arrives before they order.`,
        `Here is our review of ${name}: from unboxing to stitch-floor use, with durability and value notes for Pakistani workshops.`,
      ],
    ],
    seed,
  );

  sections.push({ type: "paragraph", text: introParagraphs[0] });
  sections.push({ type: "paragraph", text: introParagraphs[1] });

  // 2. Quick Specs Table
  sections.push({
    type: "heading",
    text: `Key Specifications & Overview of ${name}`,
  });
  sections.push({
    type: "table",
    headers: ["Specification / Metric", "Details & Verified Values"],
    rows: [
      ["Product Name", name],
      ["Category", category],
      ["Price in Pakistan", `${price} (Inclusive of item cost)`],
      ["Payment Method", "Cash on Delivery (COD) & Online Checkout"],
      ["Dispatch Time", "24 – 48 Business Hours from Distribution Center"],
      ["Estimated Delivery", "2–4 Days (Major Cities), 4–7 Days (Regional Towns)"],
      ["Protection Policy", "7-Day Return & Replacement Guarantee"],
    ],
  });

  // 3. Image 1
  if (urls.length > 1 && img(1, `${name} design and detailing`)) {
    sections.push({
      type: "image",
      image: img(1, `${name} design and detailing`)!,
    });
  }

  // 4. Product Highlights & Description
  sections.push({
    type: "heading",
    text: `Why Choose ${name}? Feature Analysis & Performance`,
  });
  sections.push({
    type: "paragraph",
    text: `${desc} Engineered to meet high quality standards, it addresses common frustrations experienced with substandard market alternatives.`,
  });

  const featureList = pick(
    [
      [
        `Workshop-ready build: Made for repeated use on industrial and home sewing machines.`,
        `Clear fit guidance: Specs and compatibility notes help you match the right machine model.`,
        `Inspected before dispatch: Each unit is checked so you receive the part you ordered.`,
        `COD across Pakistan: Order today and pay when the courier arrives.`,
      ],
      [
        `Durable materials suited to daily stitching and alterations work.`,
        `Straightforward install for trained operators and home sewists.`,
        `Fair PKR pricing at ${price} with transparent stock on the product page.`,
        `Packed for safe courier transit to workshops and homes nationwide.`,
      ],
    ],
    seed + 1,
  );
  sections.push({ type: "list", items: featureList });

  // 5. Category-specific tip for sewing / tailoring parts
  const isPresser =
    /presser|foot|hemming|ruffl|zipper.?foot|edge.?guide/i.test(`${product.slug} ${name}`);
  const isNeedle =
    /needle|bobbin|hook|rotary|thread.?tension|spool/i.test(`${product.slug} ${name}`);
  const isCutting =
    /shear|scissor|snip|cutter|seam.?ripper|pinking/i.test(`${product.slug} ${name}`);
  const isStorage =
    /case|organizer|storage|tube|holder/i.test(`${product.slug} ${name}`);

  if (isPresser) {
    sections.push({
      type: "callout",
      title: "Presser Foot Fit Tip",
      text: "Confirm shank type (high/low) and machine brand before ordering. Wipe the foot and needle plate clean after oiling so fabric feed stays even.",
      tone: "tip",
    });
  } else if (isNeedle) {
    sections.push({
      type: "callout",
      title: "Needle & Thread Tip",
      text: "Match needle size to fabric weight and rethread with the presser foot up. Replace bent or dull needles promptly to avoid skipped stitches.",
      tone: "tip",
    });
  } else if (isCutting) {
    sections.push({
      type: "callout",
      title: "Cutting Tool Care",
      text: "Use fabric shears only on cloth—paper dulls edges quickly. Store blades closed and oil the pivot lightly for smooth cuts.",
      tone: "tip",
    });
  } else if (isStorage) {
    sections.push({
      type: "callout",
      title: "Workshop Organisation",
      text: "Label needle sizes and keep sharp tools in closed cases so benches stay safe and parts stay easy to find mid-job.",
      tone: "tip",
    });
  } else {
    sections.push({
      type: "callout",
      title: "Verified Buyer Recommendation",
      text: "Inspect your package upon arrival with the courier. Outflint provides purchase protection against transit damage or wrong items.",
      tone: "info",
    });
  }

  // 6. Practical Use Cases
  sections.push({
    type: "heading",
    text: `Where Tailors Use ${name}`,
  });
  const useCaseItems = pick(
    [
      [
        `Daily stitching and alterations on industrial or domestic lockstitch machines.`,
        `Stocking a tailor shop or home sewing kit with reliable spare parts.`,
        `Replacing worn feet, needles, or guides without waiting on local hardware shops.`,
        `Training new operators with clear, standard-compatible accessories.`,
      ],
      [
        `Garment workshops that need consistent stitch quality shift after shift.`,
        `Home sewists upgrading from generic market spares to better-fit parts.`,
        `Overlock, shoe repair, and specialty machines that need matching attachments.`,
        `Bundling related tools from ${storeName} for a complete stitching setup.`,
      ],
    ],
    seed + 2,
  );
  sections.push({ type: "list", items: useCaseItems });

  // 7. Ordering with COD
  sections.push({
    type: "heading",
    text: `How to Order ${name} with Cash on Delivery (COD)`,
  });
  sections.push({
    type: "numbered-list",
    items: [
      `Click the official product button below to view ${name} on the live product page.`,
      `Verify selected color/variant options and click 'Add to Cart' or 'Buy Now'.`,
      `Enter your full delivery address, city, and active mobile number at checkout.`,
      `Select Cash on Delivery as your payment method—no advance credit card or bank transfer required.`,
      `Receive your SMS/WhatsApp tracking confirmation and pay the exact PKR amount when your courier arrives.`,
    ],
  });

  // 8. CTA Block
  sections.push({
    type: "cta",
    text: `Ready to order ${name}? Check live inventory, variant selections, and real customer reviews on the official product page.`,
    href: `/products/${product.slug}`,
    label: `View ${name} Product Page (${price})`,
  });

  const articleBodyText = sections
    .map((s) => {
      if (s.type === "paragraph" || s.type === "heading" || s.type === "subheading") return s.text;
      if (s.type === "list" || s.type === "numbered-list") return s.items.join(" ");
      if (s.type === "callout") return `${s.title}: ${s.text}`;
      if (s.type === "table") return s.rows.map((r) => r.join(" ")).join(" ");
      if (s.type === "cta") return `${s.text} ${s.label}`;
      return "";
    })
    .filter(Boolean)
    .join("\n\n");

  return {
    slug: product.slug,
    productSlug: product.slug,
    title,
    metaTitle,
    metaDescription,
    publishedAt: product.createdAt || new Date().toISOString(),
    readTimeMinutes: 5,
    categoryLabel: `${category} Review`,
    keywords,
    hero,
    sections,
    articleBodyText,
  };
}
