import Image from "next/image";
import { WordmarkLogo } from "@/components/brand/wordmark-logo";
import {
  isRemoteAssetUrl,
  resolveLogoUrl,
  resolveSiteName,
} from "@/lib/site-brand-env";

/**
 * Site logo components — header uses dark mark on light chrome;
 * footer uses the same dark (black-text) mark, larger.
 */

const LOGO_WIDTH = 280;
const LOGO_HEIGHT = 166;

/**
 * Shared scale — `w-auto` keeps the tight crop from adding empty side padding.
 */
const LOGO_SIZE = {
  default: "h-8 w-auto sm:h-10 md:h-11",
  large: "h-11 w-auto sm:h-12",
  compact: "h-7 w-auto sm:h-9",
  /** Footer — photographic mark needs more height to stay readable. */
  footer: "h-16 w-auto sm:h-20 md:h-[5.5rem]",
} as const;

const markSizeClass = LOGO_SIZE;

export type SiteLogoMarkSize = keyof typeof markSizeClass;

type LogoMarkProps = {
  size?: SiteLogoMarkSize;
  className?: string;
  priority?: boolean;
};

function isBundledDarkLogo(src: string): boolean {
  const path = src.split("?")[0] ?? src;
  // Inline SVG wordmark only — PNG/WebP photographic logos use <Image>.
  return path === "/brand/logo-dark.svg" || path === "/brand/logo.svg";
}

function SiteLogoImage({
  src,
  alt,
  className,
  priority,
}: {
  src: string;
  alt: string;
  className: string;
  priority?: boolean;
}) {
  // SVGs + remote URLs use <img> — next/image blocks/optimizes SVG poorly.
  const useImg = isRemoteAssetUrl(src) || /\.svg($|\?)/i.test(src);
  if (useImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        className={className}
        decoding="async"
        loading="eager"
        fetchPriority={priority ? "high" : "low"}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      className={className}
      priority={priority}
      fetchPriority={priority ? "high" : "low"}
    />
  );
}

/** Header / checkout logo mark. */
export function SiteLogoMark({
  size = "default",
  className = "",
  priority,
}: LogoMarkProps) {
  const src = resolveLogoUrl();
  const alt = resolveSiteName();
  const sizeClass = markSizeClass[size];

  if (isBundledDarkLogo(src)) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center font-semibold ${sizeClass} ${className}`.trim()}
      >
        <WordmarkLogo
          variant="dark"
          title={alt}
          className="h-full w-auto max-h-full"
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${sizeClass} ${className}`.trim()}
    >
      <SiteLogoImage
        src={src}
        alt={alt}
        priority={priority}
        className="h-full w-full max-h-full max-w-full object-contain object-center"
      />
    </span>
  );
}

type FullProps = {
  className?: string;
};

/** Footer / marketing — dark (black text) logo at a larger size. */
export function SiteLogoFull({ className = "" }: FullProps) {
  // Keep OUTFLINT text black even on dark footer backgrounds.
  const src = resolveLogoUrl();
  const alt = resolveSiteName();
  const sizeClass = LOGO_SIZE.footer;

  if (isBundledDarkLogo(src)) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-start font-semibold ${sizeClass} ${className}`.trim()}
      >
        <WordmarkLogo
          variant="dark"
          title={alt}
          className="h-full w-auto max-h-full"
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-start ${sizeClass} ${className}`.trim()}
    >
      <SiteLogoImage
        src={src}
        alt={alt}
        className="h-full w-full max-h-full max-w-full object-contain object-left"
      />
    </span>
  );
}
