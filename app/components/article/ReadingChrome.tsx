"use client";

import { ChevronDownIcon, Cross2Icon } from "@radix-ui/react-icons";
import { useEffect, useId, useRef, useState } from "react";
import { useCurrentSection } from "app/components/article/CurrentSection";
import type { Heading } from "app/components/article/headings";
import { PAD } from "app/components/SiteChrome";

type Bookmark = { progress: number; heading: string | null };

/** Everything the scroll handler needs, in document coordinates. */
type Geometry = {
    titleBottom: number;
    articleTop: number;
    articleBottom: number;
    blocks: { top: number; bottom: number; words: number }[];
};

/** Same rate as the "min read" figure, so the two agree at the top. */
const WPM = 230;
const BAR = 48;
/** Where a heading lands, measured from the top of the viewport, after a
 *  jump. Matches the headings' scroll-margin in the article page. */
const LANDING = BAR + 24;
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
 * the title, the section you're in (which opens the outline) and the time
 * left, with a hairline progress rule along its bottom edge. Remembers where
 * you were and offers to take you back next time.
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
    const outlineId = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const ruleRef = useRef<HTMLDivElement>(null);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const geometry = useRef<Geometry | null>(null);
    const current = useCurrentSection();
    // For the save timer, which outlives the render it was scheduled in.
    const currentRef = useRef<string | null>(null);
    // While the resume toast is up, a little scrolling near the top
    // mustn't overwrite the place it's offering.
    const holdRef = useRef(false);

    const [visible, setVisible] = useState(false);
    const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
    const [outlineOpen, setOutlineOpen] = useState(false);
    const [bookmark, setBookmark] = useState<Bookmark | null>(null);

    useEffect(() => {
        currentRef.current = current;
    }, [current]);

    // Position: progress rule, minutes left, bar visibility, and the bookmark.
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
                blocks: Array.from(article.children)
                    // Code isn't counted in the reading time either.
                    .filter((el) => !el.matches("figure, pre"))
                    .map((el) => {
                        const r = el.getBoundingClientRect();
                        return {
                            top: r.top + y,
                            bottom: r.bottom + y,
                            words: (el.textContent ?? "")
                                .split(/\s+/)
                                .filter(Boolean).length,
                        };
                    }),
            };
            geometry.current = g;
            return g;
        };

        const update = () => {
            frame = 0;
            const g = geometry.current;
            if (!g) return;
            const y = window.scrollY;
            const fold = y + window.innerHeight;
            let words = 0;
            for (const block of g.blocks) {
                if (block.top >= fold) {
                    words += block.words;
                } else if (block.bottom > fold) {
                    words +=
                        (block.words * (block.bottom - fold)) /
                        (block.bottom - block.top);
                }
            }
            setMinutesLeft(Math.round(words / WPM));
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

    const openOutline = () => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        dialog.showModal();
        setOutlineOpen(true);
        dialog.querySelector<HTMLElement>("[aria-current]")?.focus();
    };

    const jumpTo = (id: string | null) => {
        dialogRef.current?.close();
        const target = id
            ? document.getElementById(id)
            : rootRef.current?.querySelector("article");
        if (!target) return;
        window.scrollTo({
            top: target.getBoundingClientRect().top + window.scrollY - LANDING,
            behavior: scrollBehavior(),
        });
        history.replaceState(
            null,
            "",
            id ? `#${id}` : window.location.pathname,
        );
        focusQuietly(target);
    };

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

    const minutesText =
        minutesLeft === null
            ? ""
            : minutesLeft < 1
              ? "< 1 min left"
              : `${minutesLeft} min left`;

    // A post with no headings has nothing to navigate to.
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
                <div
                    className={`${PAD} grid h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]`}
                >
                    <p
                        className={`truncate font-[family-name:var(--font-editorial)] text-[16px] tracking-[-0.02em] text-neutral-900 dark:text-white ${
                            hasOutline ? "hidden sm:block" : ""
                        }`}
                    >
                        {title}
                    </p>
                    {hasOutline ? (
                        <button
                            ref={triggerRef}
                            type="button"
                            onClick={openOutline}
                            aria-haspopup="dialog"
                            aria-expanded={outlineOpen}
                            aria-controls={outlineId}
                            className={`group -mx-1.5 flex min-w-0 cursor-pointer items-center gap-1.5 justify-self-start rounded px-1.5 py-1 text-[13px] text-neutral-900 sm:max-w-[22rem] sm:justify-self-center dark:text-white ${FOCUS}`}
                        >
                            <span className="sr-only">Section: </span>
                            <span className="truncate">
                                {labelFor(current)}
                            </span>
                            <ChevronDownIcon
                                aria-hidden
                                className="h-3.5 w-3.5 shrink-0 text-neutral-400 transition-colors group-hover:text-neutral-900 dark:text-neutral-500 dark:group-hover:text-white"
                            />
                        </button>
                    ) : (
                        <span className="hidden sm:block" />
                    )}
                    <p className="justify-self-end whitespace-nowrap font-[family-name:var(--font-geist-mono)] text-[12px] tabular-nums text-neutral-500 dark:text-neutral-400">
                        {minutesText}
                    </p>
                </div>
                <div
                    ref={ruleRef}
                    aria-hidden
                    className="absolute inset-x-0 -bottom-px h-px origin-left bg-neutral-900 dark:bg-white"
                />
            </aside>

            {/* A modal <dialog> sits in the top layer, so it escapes any
                stacking or containing block it's declared in, and brings
                focus trapping and Esc with it. A bottom sheet on phones, a
                panel under the bar's label above that. */}
            {hasOutline ? (
                <dialog
                    ref={dialogRef}
                    id={outlineId}
                    aria-labelledby={`${outlineId}-title`}
                    onClose={() => {
                        setOutlineOpen(false);
                        // Browsers normally restore focus to the opener; make sure.
                        if (document.activeElement === document.body) {
                            triggerRef.current?.focus();
                        }
                    }}
                    onClick={(event) => {
                        if (event.target === event.currentTarget) {
                            event.currentTarget.close();
                        }
                    }}
                    className="m-0 mt-auto max-h-[75dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-xl border border-b-0 border-neutral-200 bg-white p-0 text-neutral-900 backdrop:bg-black/25 sm:mx-auto sm:mt-14 sm:mb-auto sm:max-h-[70dvh] sm:w-[22rem] sm:rounded-lg sm:border-b dark:border-neutral-800 dark:bg-neutral-950 dark:text-white dark:backdrop:bg-black/60"
                >
                    <div className="flex items-center justify-between border-b border-neutral-200 py-2 pr-2 pl-5 dark:border-neutral-800">
                        <p
                            id={`${outlineId}-title`}
                            className="text-[12px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500"
                        >
                            Outline
                        </p>
                        <button
                            type="button"
                            onClick={() => dialogRef.current?.close()}
                            aria-label="Close outline"
                            className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white ${FOCUS}`}
                        >
                            <Cross2Icon aria-hidden />
                        </button>
                    </div>
                    <ol className="py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                        {entries.map((entry) => {
                            const active = entry.id === current;
                            return (
                                <li key={entry.id ?? "introduction"}>
                                    <a
                                        href={entry.id ? `#${entry.id}` : "#"}
                                        aria-current={
                                            active ? "location" : undefined
                                        }
                                        onClick={(event) => {
                                            event.preventDefault();
                                            jumpTo(entry.id);
                                        }}
                                        className="group flex items-baseline gap-3 px-5 py-2.5 outline-none hover:bg-neutral-50 focus-visible:bg-neutral-100 dark:hover:bg-neutral-900/60 dark:focus-visible:bg-neutral-900"
                                    >
                                        <span
                                            aria-hidden
                                            className={`h-1.5 w-1.5 shrink-0 -translate-y-px rounded-full ${
                                                active
                                                    ? "bg-neutral-900 dark:bg-white"
                                                    : "bg-transparent"
                                            }`}
                                        />
                                        <span
                                            className={`text-[14px] leading-snug ${
                                                entry.level > 2 ? "pl-4" : ""
                                            } ${
                                                active
                                                    ? "text-neutral-900 dark:text-white"
                                                    : "text-neutral-500 group-hover:text-neutral-900 dark:text-neutral-400 dark:group-hover:text-white"
                                            }`}
                                        >
                                            {entry.text}
                                        </span>
                                    </a>
                                </li>
                            );
                        })}
                    </ol>
                </dialog>
            ) : null}

            {/* Lifted by --listen-bar, should a player bar be pinned to the
                bottom of the screen at the same time. */}
            <div
                role="status"
                className="pointer-events-none fixed inset-x-4 bottom-[calc(1rem_+_var(--listen-bar,0px))] z-40 flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-[calc(1.5rem_+_var(--listen-bar,0px))]"
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
