"use client";

import { useEffect, useRef, useState } from "react";
import { useCurrentSection } from "app/components/article/CurrentSection";
import type { Heading } from "app/components/article/headings";
import { PAD } from "app/components/SiteChrome";

type Bookmark = { progress: number; heading: string | null };

/** Everything the scroll handler needs, in document coordinates. */
type Geometry = {
    titleBottom: number;
    articleTop: number;
    articleBottom: number;
};

const BAR = 48;
const SAVE_EVERY = 500;

const storageKey = (slug: string) => `reading-position:${slug}`;

const FOCUS =
    "focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-white";

/**
 * 0 while the article's first line is still below the bar, 1 once its last
 * line reaches the bottom of the screen.
 */
function range(g: Geometry) {
    return {
        start: g.articleTop - BAR,
        end: g.articleBottom - window.innerHeight,
    };
}

function progressAt(g: Geometry, y: number) {
    const { start, end } = range(g);
    if (end <= start) return y >= start ? 1 : 0;
    return Math.min(1, Math.max(0, (y - start) / (end - start)));
}

function readBookmark(slug: string): Bookmark | null {
    try {
        const value = JSON.parse(
            localStorage.getItem(storageKey(slug)) ?? "null",
        );
        if (typeof value?.progress !== "number") return null;
        return {
            progress: value.progress,
            heading: typeof value.heading === "string" ? value.heading : null,
        };
    } catch {
        return null;
    }
}

function scrollBehavior(): ScrollBehavior {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth";
}

/** Move focus (and a screen reader's place) without moving the page. */
function focusQuietly(el: HTMLElement | null | undefined) {
    if (!el) return;
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
}

/**
 * Wraps a post's title and article. Once the title scrolls off, a bar pins
 * the title, with a hairline progress rule along its bottom edge. Remembers
 * where you were and offers to take you back next time.
 *
 * The bar is fixed, so it must never end up inside a transformed ancestor.
 */
export function ReadingChrome({
    slug,
    title,
    headings,
    hasIntro,
    className,
    children,
}: {
    slug: string;
    title: string;
    headings: Heading[];
    /** Whether prose comes before the first heading. */
    hasIntro: boolean;
    className?: string;
    /** Must contain the post's <h1> and its <article>. */
    children: React.ReactNode;
}) {
    const rootRef = useRef<HTMLDivElement>(null);
    const ruleRef = useRef<HTMLDivElement>(null);
    const geometry = useRef<Geometry | null>(null);
    const current = useCurrentSection();
    // For the save timer, which outlives the render it was scheduled in.
    const currentRef = useRef<string | null>(null);
    // While the resume toast is up, a little scrolling near the top
    // mustn't overwrite the place it's offering.
    const holdRef = useRef(false);

    const [visible, setVisible] = useState(false);
    const [bookmark, setBookmark] = useState<Bookmark | null>(null);

    useEffect(() => {
        currentRef.current = current;
    }, [current]);

    // Position: progress rule, bar visibility, and the bookmark.
    useEffect(() => {
        const root = rootRef.current;
        const article = root?.querySelector("article");
        const titleEl = root?.querySelector("h1");
        const rule = ruleRef.current;
        if (!article || !titleEl) return;

        let frame = 0;
        let saveTimer: ReturnType<typeof setTimeout> | undefined;

        const measure = () => {
            const y = window.scrollY;
            const box = article.getBoundingClientRect();
            const g: Geometry = {
                titleBottom: titleEl.getBoundingClientRect().bottom + y,
                articleTop: box.top + y,
                articleBottom: box.bottom + y,
            };
            geometry.current = g;
            return g;
        };

        const update = () => {
            frame = 0;
            const g = geometry.current;
            if (!g) return;
            const y = window.scrollY;
            setVisible(y > g.titleBottom && y + BAR < g.articleBottom);
            if (rule) rule.style.transform = `scaleX(${progressAt(g, y)})`;
        };

        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };

        const save = () => {
            saveTimer = undefined;
            const g = geometry.current;
            if (!g) return;
            const progress = progressAt(g, window.scrollY);
            if (holdRef.current) {
                if (progress < 0.1) return;
                // They've found a place of their own; stop offering the old one.
                holdRef.current = false;
                setBookmark(null);
            }
            try {
                localStorage.setItem(
                    storageKey(slug),
                    JSON.stringify({ progress, heading: currentRef.current }),
                );
            } catch {
                // Storage full or disabled: resume just won't be offered.
            }
        };

        const flush = () => {
            if (saveTimer === undefined) return;
            clearTimeout(saveTimer);
            save();
        };

        const onScroll = () => {
            schedule();
            if (saveTimer === undefined) {
                saveTimer = setTimeout(save, SAVE_EVERY);
            }
        };

        const onResize = () => {
            measure();
            schedule();
        };

        const g = measure();
        schedule();

        // Arriving mid-article — a #link, or the browser restoring scroll on
        // reload — means they already have their place.
        const stored = readBookmark(slug);
        if (
            stored &&
            stored.progress > 0.1 &&
            stored.progress < 0.95 &&
            progressAt(g, window.scrollY) < 0.1
        ) {
            holdRef.current = true;
            setBookmark(stored);
        }

        // Fonts and images settle after mount and move every block.
        const resizeObserver = new ResizeObserver(onResize);
        resizeObserver.observe(article);
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onResize);
        window.addEventListener("pagehide", flush);

        return () => {
            flush();
            cancelAnimationFrame(frame);
            resizeObserver.disconnect();
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onResize);
            window.removeEventListener("pagehide", flush);
        };
    }, [slug]);

    const entries = [
        ...(hasIntro
            ? [{ id: null as string | null, text: "Introduction", level: 2 }]
            : []),
        ...headings,
    ];
    const labelFor = (id: string | null) =>
        entries.find((entry) => entry.id === id)?.text ??
        headings[0]?.text ??
        "Outline";

    const resume = () => {
        const g = geometry.current;
        holdRef.current = false;
        setBookmark(null);
        if (!g || !bookmark) return;
        const { start, end } = range(g);
        window.scrollTo({
            top: start + bookmark.progress * (end - start),
            behavior: scrollBehavior(),
        });
        focusQuietly(
            bookmark.heading ? document.getElementById(bookmark.heading) : null,
        );
    };

    const dismiss = () => {
        holdRef.current = false;
        setBookmark(null);
        try {
            localStorage.removeItem(storageKey(slug));
        } catch {}
    };

    // A post with no headings has no section to name in the resume prompt.
    const hasOutline = headings.length > 0;

    return (
        <>
            <div ref={rootRef} className={className}>
                {children}
            </div>

            <aside
                aria-label="Reading progress"
                inert={!visible}
                className={`fixed inset-x-0 top-0 z-40 border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-black motion-safe:transition-[translate,opacity] motion-safe:duration-200 ${
                    visible ? "" : "-translate-y-full opacity-0"
                }`}
            >
                <div className={`${PAD} flex h-12 items-center`}>
                    <p className="truncate font-[family-name:var(--font-editorial)] text-[16px] tracking-[-0.02em] text-neutral-900 dark:text-white">
                        {title}
                    </p>
                </div>
                <div
                    ref={ruleRef}
                    aria-hidden
                    className="absolute inset-x-0 -bottom-px h-px origin-left bg-neutral-900 dark:bg-white"
                />
            </aside>

            <div
                role="status"
                className="pointer-events-none fixed inset-x-4 bottom-4 z-40 flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-6"
            >
                {bookmark ? (
                    <div className="pointer-events-auto flex w-full items-center gap-4 rounded-lg border border-neutral-200 bg-white py-3 pr-3 pl-4 shadow-[0_8px_30px_rgba(0,0,0,0.08)] sm:w-auto sm:max-w-md dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none">
                        <p className="min-w-0 flex-1 text-[13px] leading-snug text-neutral-500 dark:text-neutral-400">
                            Pick up where you left off
                            {hasOutline ? (
                                <>
                                    {" — "}
                                    <span className="text-neutral-900 dark:text-white">
                                        {labelFor(bookmark.heading)}
                                    </span>
                                </>
                            ) : null}
                        </p>
                        <div className="flex shrink-0 items-center gap-1">
                            <button
                                type="button"
                                onClick={resume}
                                className={`cursor-pointer rounded-md bg-neutral-900 px-3 py-1.5 text-[13px] text-white hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-300 ${FOCUS}`}
                            >
                                Resume
                            </button>
                            <button
                                type="button"
                                onClick={dismiss}
                                className={`cursor-pointer rounded-md px-3 py-1.5 text-[13px] text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white ${FOCUS}`}
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </>
    );
}
