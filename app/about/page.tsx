import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import {
  buildPageMetadata,
  canonicalUrlFor,
  loadSeoOverrideForRoute,
  loadSiteIdentity,
  resolveSeoCanonicalOverride,
} from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd, webPageJsonLd } from "@/lib/seo/jsonld";
import { getPublicSiteUrl } from "@/lib/site-url";

const STORE_GALLERY = [
  {
    src: "/story/Outflint-store-06.jpg",
    alt: "Warehouse inventory of household goods at Outflint Pakistan",
    caption: "Warehouse inventory",
  },
  {
    src: "/story/Outflint-store-02.jpg",
    alt: "Heater and drinkware from the Outflint catalogue",
    caption: "Home essentials",
  },
  {
    src: "/story/Outflint-store-01.jpg",
    alt: "Electric kettle prepared for packing at Outflint",
    caption: "Pre-dispatch checks",
  },
  {
    src: "/story/Outflint-store-04.jpg",
    alt: "Glass tumbler packed with protective wrap for shipping",
    caption: "Secure packing",
  },
  {
    src: "/story/Outflint-store-07.jpg",
    alt: "Cartons ready for dispatch at Outflint",
    caption: "Ready for dispatch",
  },
  {
    src: "/story/Outflint-store-05.jpg",
    alt: "Portable fan heater from Outflint appliances",
    caption: "Appliances range",
  },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const identity = await loadSiteIdentity();
  const override = await loadSeoOverrideForRoute("/about", identity.locale);
  const storeName = identity.storeName || identity.siteTitle || "Outflint";
  return buildPageMetadata({
    pathname: "/about",
    identity,
    override,
    defaults: {
      title: "About Us",
      description: `About ${storeName} â€” mission, warehouse operations, careful packing, and cash-on-delivery shopping for home essentials across Pakistan.`,
    },
  });
}

export default async function AboutPage() {
  const identity = await loadSiteIdentity();
  const override = await loadSeoOverrideForRoute("/about", identity.locale);
  const storeName = identity.storeName || identity.siteTitle || "Outflint";
  const canonical = resolveSeoCanonicalOverride(
    override?.canonicalUrl,
    canonicalUrlFor("/about"),
  );
  const title = override?.title?.trim() || "About Us";
  const description =
    override?.description?.trim() ||
    `About ${storeName} â€” mission, warehouse operations, careful packing, and cash-on-delivery shopping for home essentials across Pakistan.`;
  const breadcrumbId = `${canonical}#breadcrumb`;
  const crumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "About Us", url: canonical },
  ]);
  (crumbs as { "@id"?: string })["@id"] = breadcrumbId;

  const aboutLd: Record<string, unknown> = {
    ...webPageJsonLd({
      url: canonical,
      name: title,
      description,
      identity,
      breadcrumbId,
    }),
    "@type": "AboutPage",
  };

  if (identity.organizationPhone || identity.organizationEmail) {
    aboutLd.mainEntity = {
      "@type": "Organization",
      "@id": `${getPublicSiteUrl()}/#organization`,
      name: storeName,
      url: getPublicSiteUrl(),
      telephone: identity.organizationPhone || undefined,
      email: identity.organizationEmail || undefined,
    };
  }

  return (
    <>
      <JsonLd id="ld-about" data={aboutLd} />
      <JsonLd id="ld-about-breadcrumb" data={crumbs} />
      <main
        id="MainContent"
        className="main-content bg-linear-to-b from-neutral-50 to-white pb-12 pt-4 sm:pb-16 sm:pt-6 md:pb-20 md:pt-8"
      >
        <div className="mx-auto max-w-3xl shell-x">
          <nav
            className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-neutral-500"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="transition hover:text-neutral-900">
              Home
            </Link>
            <span className="px-0.5 text-neutral-300" aria-hidden>
              /
            </span>
            <span className="font-medium text-neutral-900">About Us</span>
          </nav>

          <header className="mt-8 border-b border-neutral-200/90 pb-8">
            <h1 className="text-[1.50rem] font-semibold leading-tight tracking-tight text-neutral-900 sm:text-4xl sm:leading-tight">
              About Us
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-[1.05rem]">
              Everyday home essentials, clear pricing, and nationwide COD â€” managed
              from our inventory in Pakistan.
            </p>
          </header>

          <article className="space-y-6 py-8 text-base leading-relaxed text-neutral-700 sm:text-[1.05rem]">
            <p>
              <strong className="font-semibold text-neutral-900">{storeName}</strong>{" "}
              is an online store for practical home, kitchen and beauty essentials â€”
              drinkware, kitchen tools, small appliances, lighting and everyday wellness
              products chosen for daily use.
            </p>

            <h2 className="pt-2 text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
              Our purpose &amp; mission
            </h2>
            <p>
              Our purpose is to make everyday shopping simple: useful products at fair
              PKR prices, clear product pages, and delivery across Pakistan with cash on
              delivery where available at checkout.
            </p>
            <p>
              Our mission is selective curation â€” not endless catalogues. We focus on
              items people actually need, review them before dispatch, pack carefully,
              and keep shipping timelines transparent.
            </p>

            <h2 className="pt-2 text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
              How we work
            </h2>
            <ol className="list-decimal space-y-2 pl-5 marker:font-semibold marker:text-neutral-900">
              <li>Receive and organise products in our warehouse inventory.</li>
              <li>Inspect items such as kettles, heaters and tumblers before listing.</li>
              <li>Publish clear photos, PKR prices and availability online.</li>
              <li>Pick, pack securely, and hand over to courier when you order.</li>
              <li>Offer nationwide delivery across Pakistan.</li>
            </ol>
            <p>
              Orders are typically packed within 1â€“2 business days. Delivery usually
              takes 2â€“5 business days in major cities and 4â€“8 business days in other
              areas.
            </p>
          </article>

          <section className="border-t border-neutral-200/90 py-10" aria-labelledby="about-gallery-heading">
            <h2
              id="about-gallery-heading"
              className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl"
            >
              From our warehouse
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-neutral-600">
              A glimpse of inventory and packing at {storeName} â€” the operations behind
              the products you browse online.
            </p>
            <ul className="mt-6 grid list-none grid-cols-2 gap-3 pl-0 sm:gap-4">
              {STORE_GALLERY.map((shot) => (
                <li key={shot.src} className="min-w-0">
                  <figure className="overflow-hidden rounded-lg bg-neutral-100">
                    <div className="relative aspect-[4/5] w-full sm:aspect-[4/3]">
                      <Image
                        src={shot.src}
                        alt={shot.alt}
                        fill
                        sizes="(max-width: 640px) 50vw, 400px"
                        className="object-cover object-center"
                      />
                    </div>
                    <figcaption className="px-2.5 py-2 text-center text-xs font-medium text-neutral-600 sm:text-sm">
                      {shot.caption}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-neutral-600">
              For a fuller operations overview, read:{" "}
              <Link
                href="/blogs/inside-Outflint-store-real-stock-cod-pakistan"
                className="font-semibold text-neutral-900 underline underline-offset-2 hover:text-neutral-700"
              >
                How Outflint works â€” inventory, packing &amp; COD
              </Link>
              .
            </p>
          </section>

          <section className="border-t border-neutral-200/90 py-8 text-base leading-relaxed text-neutral-700 sm:text-[1.05rem]">
            <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
              Need help?
            </h2>
            <p className="mt-3">
              Reach us via{" "}
              <Link
                href="/contact"
                className="font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-700"
              >
                Contact us
              </Link>
              , WhatsApp, phone, or email â€” we are here Monâ€“Sat, 10:00 AM â€“ 8:00 PM.
            </p>
            <p className="mt-4">
              <Link
                href="/collections"
                className="inline-flex font-semibold text-neutral-900 underline underline-offset-2 hover:text-neutral-700"
              >
                Shop collections â†’
              </Link>
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
