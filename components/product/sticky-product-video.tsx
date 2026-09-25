"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  parseProductVideoSource,
  type ProductReelItem,
} from "@/lib/product-video/url";
import { useCart } from "@/app/providers/cart-provider";

export type StickyProductVideoProps = {
  reels: ProductReelItem[];
  startIndex?: number;
  bottomClassName?: string;
  /** Hide + pause the floating mini player (e.g. while PDP sticky buy bar is visible). */
  suppressMini?: boolean;
  /** Optional WhatsApp deep link shown above the sticky mini player (PDP). */
  whatsappHref?: string;
  whatsappLabel?: string;
};

/** Rad: --rvw-edge aligns chrome to the contained 9:16 video column. */
const FEED_EDGE = "max(16px, calc(50% - 28.125vh + 16px))";

function ExpandHintIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M8 3H5a2 2 0 0 0-2 2v3m0 8v3a2 2 0 0 0 2 2h3m8-18h3a2 2 0 0 1 2 2v3m0 8v3a2 2 0 0 1-2 2h-3" />
    </svg>
  );
}

function MuteIcon({ muted }: { muted: boolean }) {
  if (muted) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M5 9v6h4l5 5V4L9 9H5z" fill="currentColor" stroke="none" />
        <line x1="16" y1="9" x2="22" y2="15" />
        <line x1="22" y1="9" x2="16" y2="15" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 9v6h4l5 5V4L9 9H5z" fill="currentColor" stroke="none" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19 6a9 9 0 0 1 0 12" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden style={{ marginLeft: 3 }}>
      <polygon points="7,4 20,12 7,20" />
    </svg>
  );
}

type ParsedReel = ProductReelItem & { src: string };

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function StickyProductVideo({
  reels,
  startIndex = 0,
  bottomClassName = "bottom-4",
  suppressMini = false,
  whatsappHref,
  whatsappLabel = "WhatsApp",
}: StickyProductVideoProps) {
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  const { isOpen: cartDrawerOpen } = useCart();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const miniVideoRef = useRef<HTMLVideoElement>(null);
  const slideVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const revealedRef = useRef(false);
  const loadedMiniSrcRef = useRef("");

  const parsed = useMemo(() => {
    return reels
      .map((r) => {
        const source = parseProductVideoSource(r.videoUrl);
        return source ? { ...r, src: source.src } : null;
      })
      .filter((r): r is ParsedReel => Boolean(r));
  }, [reels]);

  const safeStart = Math.min(Math.max(0, startIndex), Math.max(0, parsed.length - 1));
  const [miniIndex, setMiniIndex] = useState(safeStart);
  const mini = parsed[miniIndex] ?? parsed[0];
  const miniSrc = mini?.src ?? "";
  const nextMini = parsed.length > 1 ? parsed[(miniIndex + 1) % parsed.length] : null;
  /** Rotate only when multiple reels and user allows motion. */
  const rotateMini = parsed.length > 1 && reduceMotion !== true;

  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(safeStart);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  /** Sticky chrome only after playback has started — no empty / buffering shell. */
  const [miniReady, setMiniReady] = useState(false);
  const [slidePlaying, setSlidePlaying] = useState<Record<number, boolean>>({});
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const sync = () => setPageVisible(document.visibilityState === "visible");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  useEffect(() => {
    try {
      const nav = navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      };
      const c = nav.connection;
      const slow = Boolean(
        c?.saveData ||
          c?.effectiveType === "slow-2g" ||
          c?.effectiveType === "2g",
      );
      if (slow) setDismissed(true);
    } catch {
      /* ignore */
    }
  }, []);

  // Keep mini index valid if reel list shrinks.
  useEffect(() => {
    if (parsed.length === 0) return;
    setMiniIndex((i) => Math.min(i, parsed.length - 1));
  }, [parsed.length]);

  const advanceMini = useCallback(() => {
    if (parsed.length <= 1) return;
    setMiniIndex((i) => (i + 1) % parsed.length);
  }, [parsed.length]);

  // Reset reveal only when the source actually changes.
  useEffect(() => {
    revealedRef.current = false;
    setMiniReady(false);
  }, [miniSrc]);

  // Stable autoplay — deps are primitives only (never object identity).
  useEffect(() => {
    if (!miniSrc || dismissed) return;
    const el = miniVideoRef.current;
    if (!el) return;

    let cancelled = false;
    let retryTimer: number | undefined;

    const reveal = () => {
      if (cancelled || el.paused) return;
      revealedRef.current = true;
      // Only show sticky while collapsed and cart drawer is closed.
      if (!expanded && !cartDrawerOpen && pageVisible && !suppressMini) setMiniReady(true);
    };

    const tryPlay = () => {
      if (cancelled || expanded || cartDrawerOpen || !pageVisible || suppressMini) return;
      el.muted = true;
      el.defaultMuted = true;
      void el
        .play()
        .then(reveal)
        .catch(() => {
          if (cancelled || expanded || cartDrawerOpen || !pageVisible || suppressMini) return;
          retryTimer = window.setTimeout(() => {
            void el.play().then(reveal).catch(() => {});
          }, 600);
        });
    };

    el.addEventListener("playing", reveal);
    el.addEventListener("canplay", tryPlay);

    if (expanded || cartDrawerOpen || !pageVisible || suppressMini) {
      el.pause();
      if (expanded || !pageVisible || suppressMini) setMiniReady(false);
    } else {
      if (loadedMiniSrcRef.current !== miniSrc) {
        loadedMiniSrcRef.current = miniSrc;
        try {
          el.load();
        } catch {
          /* ignore */
        }
      }
      tryPlay();
      if (revealedRef.current) setMiniReady(true);
    }

    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      el.removeEventListener("playing", reveal);
      el.removeEventListener("canplay", tryPlay);
    };
  }, [miniSrc, expanded, dismissed, cartDrawerOpen, pageVisible, suppressMini]);

  // Collapsed sticky: rotate to the next product video when one finishes.
  useEffect(() => {
    if (!rotateMini || dismissed || expanded || !pageVisible || suppressMini) return;
    const el = miniVideoRef.current;
    if (!el) return;

    const onEnded = () => advanceMini();
    el.addEventListener("ended", onEnded);
    return () => el.removeEventListener("ended", onEnded);
  }, [rotateMini, dismissed, expanded, pageVisible, suppressMini, miniSrc, advanceMini]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const slide = scroller.children[safeStart] as HTMLElement | undefined;
    if (slide) {
      slide.scrollIntoView({ block: "start", behavior: "instant" as ScrollBehavior });
    }
    setActiveIndex(safeStart);
    setPaused(false);
    setShowSwipeHint(parsed.length > 1);
    const t = window.setTimeout(() => setShowSwipeHint(false), 2800);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    slideVideoRefs.current.forEach((el, i) => {
      if (!el) return;
      el.muted = muted;
      if (i === activeIndex && !paused) {
        void el.play().catch(() => {});
      } else {
        el.pause();
      }
    });
  }, [expanded, activeIndex, muted, paused]);

  const onScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const h = scroller.clientHeight || 1;
    const idx = Math.round(scroller.scrollTop / h);
    setActiveIndex(Math.min(Math.max(0, idx), parsed.length - 1));
    setPaused(false);
    setShowSwipeHint(false);
  }, [parsed.length]);

  const markSlidePlaying = useCallback((i: number) => {
    setSlidePlaying((prev) => (prev[i] ? prev : { ...prev, [i]: true }));
  }, []);

  if ((!parsed.length || !mini) && !(whatsappHref ?? "").trim()) return null;

  const waHref = (whatsappHref ?? "").trim();
  /** WhatsApp stays up while sticky buy bar is open — only hide for cart / expanded feed. */
  const showWhatsApp = Boolean(waHref) && !expanded && !cartDrawerOpen;

  // WhatsApp-only (no product video)
  if (!parsed.length || !mini) {
    if (!showWhatsApp) return null;
    return (
      <div
        className={`fixed right-4 z-100 ${bottomClassName}`}
        data-sticky-product-whatsapp
      >
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={whatsappLabel}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_6px_18px_rgba(37,211,102,0.45)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
        >
          <WhatsAppGlyph className="h-6 w-6" />
        </a>
      </div>
    );
  }

  const counterLabel = `${activeIndex + 1} / ${parsed.length}`;
  // Keep mini reel visible while scrolling — only pause for cart drawer / expanded / dismiss.
  const showMini = !dismissed && miniReady && !expanded && !cartDrawerOpen;
  const showChrome = showMini || showWhatsApp;

  return (
    <>
      {/* Always mounted so the <video> never remounts / blinks */}
      <div
        className={`fixed right-4 z-100 flex flex-col items-end gap-2 ${bottomClassName} ${
          showChrome ? "pointer-events-auto" : "pointer-events-none"
        }`}
        data-sticky-product-video
        aria-hidden={!showChrome}
        style={{
          // opacity only — visibility/display:none can pause media in browsers
          opacity: showChrome ? 1 : 0,
          transform: showChrome ? "scale(1) translateY(0)" : "scale(0.96) translateY(8px)",
          transition: reduceMotion
            ? undefined
            : "opacity 0.28s cubic-bezier(0.22, 1, 0.36, 1), transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={showWhatsApp ? 0 : -1}
            aria-label={whatsappLabel}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_6px_18px_rgba(37,211,102,0.45)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
            style={{ opacity: showWhatsApp ? 1 : 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <WhatsAppGlyph className="h-6 w-6" />
          </a>
        ) : null}
        <div
          className={
            showMini
              ? "relative h-[156px] w-[88px] overflow-hidden rounded-[10px] bg-black shadow-[0_8px_28px_rgba(0,0,0,0.35)] md:h-[213px] md:w-[120px] md:rounded-xl"
              : "pointer-events-none relative h-0 w-0 overflow-hidden opacity-0"
          }
        >
          <button
            type="button"
            className="absolute inset-0 z-10 cursor-pointer"
            aria-label="Open product videos"
            tabIndex={showMini ? 0 : -1}
            onClick={() => setExpanded(true)}
          />
          <video
            ref={miniVideoRef}
            className="pointer-events-none block h-full w-full object-cover"
            src={miniSrc}
            muted
            loop={!rotateMini}
            autoPlay
            playsInline
            preload="metadata"
            poster={mini.posterUrl || undefined}
            onError={() => {
              if (rotateMini) advanceMini();
            }}
          />
          {/* Warm the next clip lightly so rotation doesn’t stall. */}
          {rotateMini && nextMini && nextMini.src !== miniSrc ? (
            <video
              className="pointer-events-none absolute h-0 w-0 opacity-0"
              src={nextMini.src}
              muted
              playsInline
              preload="metadata"
              aria-hidden
              tabIndex={-1}
            />
          ) : null}
          {showMini ? (
            <>
              <button
                type="button"
                aria-label="Hide videos"
                className="absolute right-[6px] top-[6px] z-20 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-black/55 text-[15px] leading-none text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setDismissed(true);
                  setExpanded(false);
                  setMiniReady(false);
                  revealedRef.current = false;
                }}
              >
                ×
              </button>
              <span
                className="pointer-events-none absolute bottom-[6px] left-[6px] z-20 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-black/40 text-white"
                aria-hidden
              >
                <ExpandHintIcon />
              </span>
            </>
          ) : null}
        </div>
      </div>

      <AnimatePresence>
        {expanded ? (
          <motion.div
            className="fixed inset-0 z-230 bg-black"
            style={{ ["--rvw-edge" as string]: FEED_EDGE } as CSSProperties}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="pointer-events-none fixed z-[2] rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold tracking-[0.5px] text-white"
              style={{
                top: "calc(16px + env(safe-area-inset-top, 0px))",
                left: "var(--rvw-edge)",
              }}
              aria-live="polite"
            >
              {counterLabel}
            </div>

            <div
              className="pointer-events-none fixed z-[2] flex flex-col gap-2.5"
              style={{
                top: "calc(16px + env(safe-area-inset-top, 0px))",
                right: "var(--rvw-edge)",
              }}
            >
              <button
                type="button"
                aria-label="Close video"
                className="pointer-events-auto flex h-[38px] w-[38px] items-center justify-center rounded-full bg-black/50 text-[22px] font-medium leading-none text-white"
                onClick={() => setExpanded(false)}
              >
                ×
              </button>
              <button
                type="button"
                aria-label={muted ? "Unmute" : "Mute"}
                className="pointer-events-auto flex h-[38px] w-[38px] items-center justify-center rounded-full bg-black/50 text-white"
                onClick={() => setMuted((m) => !m)}
              >
                <MuteIcon muted={muted} />
              </button>
            </div>

            {showSwipeHint && parsed.length > 1 ? (
              <div
                className="pointer-events-none fixed inset-x-0 z-[2] flex flex-col items-center gap-0.5 text-white"
                style={{ bottom: "calc(118px + env(safe-area-inset-bottom, 0px))" }}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M6 15l6-6 6 6" />
                </svg>
                <span className="text-xs tracking-[0.3px]">Swipe up for more</span>
              </div>
            ) : null}

            <h2 id={titleId} className="sr-only">
              Product videos
            </h2>

            <div
              ref={scrollerRef}
              onScroll={onScroll}
              className="h-full overflow-y-auto overscroll-contain"
              style={{ scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch" } as CSSProperties}
            >
              {parsed.map((reel, i) => (
                <div
                  key={`${reel.productHref}-${i}`}
                  className="relative flex w-full items-center justify-center bg-black"
                  style={{
                    scrollSnapAlign: "start",
                    scrollSnapStop: "always",
                    height: "100%",
                    minHeight: "100dvh",
                  }}
                >
                  <video
                    ref={(el) => {
                      slideVideoRefs.current[i] = el;
                    }}
                    className={`block h-full w-full object-contain transition-opacity duration-300 ${
                      slidePlaying[i] ? "opacity-100" : "opacity-0"
                    }`}
                    src={reel.src}
                    loop
                    playsInline
                    muted={muted}
                    poster={reel.posterUrl || undefined}
                    preload={Math.abs(i - activeIndex) <= 1 ? "auto" : "metadata"}
                    onPlaying={() => markSlidePlaying(i)}
                    onClick={() => setPaused((p) => !p)}
                  />
                  {paused && i === activeIndex ? (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-white">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/45">
                        <PlayIcon />
                      </span>
                    </span>
                  ) : null}
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2.5 text-white"
                    style={{
                      padding: `48px var(--rvw-edge) calc(20px + env(safe-area-inset-bottom, 0px))`,
                      background: "linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0))",
                    }}
                  >
                    <div
                      className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold leading-[1.3]"
                      style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
                    >
                      {reel.productName}
                    </div>
                    <Link
                      href={reel.productHref}
                      className="pointer-events-auto block w-full box-border rounded-lg border-[0.5px] border-white/45 bg-white/[0.22] px-0 py-3 text-center text-[15px] font-semibold text-white backdrop-blur-[8px] transition hover:bg-white/30"
                      onClick={() => setExpanded(false)}
                    >
                      View product
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
