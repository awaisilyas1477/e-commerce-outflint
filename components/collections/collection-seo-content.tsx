import Link from "next/link";

type CollectionSeoData = {
  title: string;
  intro: string;
  subsections: Array<{
    heading: string;
    body: string;
  }>;
  relatedGuideSlug?: string;
  relatedGuideTitle?: string;
};

const COLLECTION_SEO_DATA: Record<string, CollectionSeoData> = {
  "stitching-accessories": {
    title: "Buy Stitching Accessories & Sewing Machine Parts Online in Pakistan",
    intro:
      "Outflint stocks everyday sewing tools and spare parts for tailor shops and home machines — needles, snips, guides, oil, and workshop essentials with Cash on Delivery across Pakistan.",
    subsections: [
      {
        heading: "Workshop-Ready Spare Parts",
        body: "Replace worn guides, tension parts, and small fittings without delaying orders. Clear product photos and specs help you match industrial and domestic machines.",
      },
      {
        heading: "Needles, Snips & Hand Tools",
        body: "Keep a reliable bench kit: needle assortments, thread snips, seam rippers, and threaders built for daily stitching volume.",
      },
      {
        heading: "COD for Tailors Nationwide",
        body: "Order the parts you need and pay when the courier arrives — practical for shops that restock mid-week.",
      },
    ],
    relatedGuideSlug: "",
    relatedGuideTitle: "Browse product reviews for stitching accessories →",
  },
  "presser-foot-collection": {
    title: "Presser Feet for Industrial & Home Sewing Machines in Pakistan",
    intro:
      "Find hemming, zipper, ruffling, and specialty presser feet for Brother, Singer, Juki, and other common machines. Outflint lists fit notes so you order the right shank and foot type.",
    subsections: [
      {
        heading: "Industrial Lockstitch Feet",
        body: "Single-needle industrial feet for straight stitch, hemming, and edge work — sized for high-volume tailor floors.",
      },
      {
        heading: "Specialty Attachments",
        body: "Invisible zipper, gathering, and adjustable edge-guide feet help finish collars, cuffs, and hems cleanly.",
      },
      {
        heading: "Fit Before You Buy",
        body: "Check shank height and machine brand on each product page. Wrong feet waste time and damage feed dogs.",
      },
    ],
    relatedGuideSlug: "",
    relatedGuideTitle: "Read presser foot product reviews →",
  },
  "sewing-storage-and-organizer-cases": {
    title: "Sewing Storage & Organizer Cases Online in Pakistan",
    intro:
      "Keep needles, bobbins, and small tools sorted with portable cases and organizers from Outflint — built for busy benches and travel kits.",
    subsections: [
      {
        heading: "Needle & Notion Cases",
        body: "Label sizes clearly and store sharps safely so benches stay organized between jobs.",
      },
      {
        heading: "Portable Kits for Home Sewists",
        body: "Compact tubes and cases fit in a drawer or bag without mixing machine oil and fabric.",
      },
    ],
    relatedGuideSlug: "",
    relatedGuideTitle: "See sewing storage product reviews →",
  },
  deals: {
    title: "Tailoring Deals & Machine Parts Offers in Pakistan",
    intro:
      "Timed discounts on presser feet, stitching accessories, and sewing tools — same COD checkout and clear stock as the rest of the Outflint catalog.",
    subsections: [
      {
        heading: "Fair Sale Pricing",
        body: "Compare-at prices show when an item is genuinely reduced so workshops can restock with confidence.",
      },
      {
        heading: "Bundle Your Bench Kit",
        body: "Pair feet, needles, and snips in one order to cut courier trips and downtime.",
      },
    ],
    relatedGuideSlug: "",
    relatedGuideTitle: "Browse all product reviews →",
  },
  "needles-and-bobbins": {
    title: "Sewing Needles, Bobbins & Firki Online in Pakistan",
    intro:
      "Restock bobbins, firki, needle cases, and threaders at Outflint — sized for home and industrial machines with Cash on Delivery across Pakistan.",
    subsections: [
      {
        heading: "Bobbins & Firki Sets",
        body: "Metal and alloy bobbin packs keep lockstitch machines running without mid-job shortages.",
      },
      {
        heading: "Needle Cases & Threaders",
        body: "Store sharps safely and re-thread quickly between garment sizes and fabric changes.",
      },
    ],
    relatedGuideSlug: "",
    relatedGuideTitle: "Browse needle & bobbin product reviews →",
  },
  "scissors-and-cutting-tools": {
    title: "Tailor Scissors, Snips & Cutting Tools in Pakistan",
    intro:
      "Shop dressmaking shears, thread snips, seam rippers, and fabric cutters built for daily tailor-floor use — COD available nationwide.",
    subsections: [
      {
        heading: "Shears for Fabric & Leather",
        body: "Right-handed steel scissors and pinking shears for clean edges on cloth, leather, and upholstery.",
      },
      {
        heading: "Bench Snips & Rippers",
        body: "Thread snips and seam rippers speed finishing work and fix stitch mistakes without damaging panels.",
      },
    ],
    relatedGuideSlug: "",
    relatedGuideTitle: "Browse cutting tool product reviews →",
  },
  "sewing-machine-parts": {
    title: "Industrial Sewing Machine Spare Parts Online in Pakistan",
    intro:
      "Replace hooks, tension units, needle plates, winders, belts, and clamps without waiting on imported kits — clear photos and COD at Outflint.",
    subsections: [
      {
        heading: "Hooks, Plates & Feed",
        body: "Rotary hooks, needle plates, and feed dogs keep stitch formation clean on lockstitch floors.",
      },
      {
        heading: "Tension, Belts & Clamps",
        body: "Tension assemblies, motor belts, foot lifters, and quick-change clamps reduce downtime between jobs.",
      },
    ],
    relatedGuideSlug: "",
    relatedGuideTitle: "Browse machine parts product reviews →",
  },
  "measuring-and-marking-tools": {
    title: "Sewing Rulers, Gauges & Marking Tools in Pakistan",
    intro:
      "Measure accurately before you cut — tailor rulers, seam gauges, marking pens, and measuring tapes for shops and home sewists.",
    subsections: [
      {
        heading: "Curve Rulers & Scales",
        body: "French curves, hip curves, and shirt rulers help draft armholes, necklines, and fittings cleanly.",
      },
      {
        heading: "Seam Guides & Markers",
        body: "Magnetic seam guides and heat-erase pens keep stitch lines consistent across curtains, shirts, and hems.",
      },
    ],
    relatedGuideSlug: "",
    relatedGuideTitle: "Browse measuring tool product reviews →",
  },
};

export function CollectionSeoContent({ slug }: { slug: string }) {
  const data = COLLECTION_SEO_DATA[slug];
  if (!data) return null;

  return (
    <section className="mt-14 rounded-2xl border border-neutral-200/90 bg-neutral-50/60 p-6 sm:p-8 md:p-10">
      <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
        {data.title}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
        {data.intro}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6">
        {data.subsections.map((sub, i) => (
          <div
            key={i}
            className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs"
          >
            <h3 className="font-bold text-neutral-900 text-sm sm:text-base">
              {sub.heading}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600 sm:text-sm">
              {sub.body}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-neutral-200/80 pt-4">
        <Link
          href="/blogs"
          className="inline-flex items-center text-sm font-bold text-amber-700 hover:text-amber-800 hover:underline"
        >
          {data.relatedGuideTitle || "Browse product reviews →"}
        </Link>
      </div>
    </section>
  );
}
