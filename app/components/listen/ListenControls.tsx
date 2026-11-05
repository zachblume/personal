"use client";

import {
    ChevronDownIcon,
    Cross2Icon,
    PauseIcon,
    PlayIcon,
    SpeakerLoudIcon,
    TrackNextIcon,
    TrackPreviousIcon,
} from "@radix-ui/react-icons";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { PAD } from "app/components/SiteChrome";
import styles from "./listen.module.css";
import { Player, RATES, type PlayerState } from "./player";

// Lightning CSS scopes highlight names in CSS modules like class names, so
// the registry has to use the exported name. (A bundler that doesn't scope
// them exports nothing, hence the fallback.)
const SENTENCE = styles["listen-sentence"] ?? "listen-sentence";
const HOVER = styles["listen-hover"] ?? "listen-hover";

const subscribeNever = () => () => {};
const supportsHighlights = () =>
    typeof CSS !== "undefined" &&
    "highlights" in CSS &&
    typeof Highlight === "function";

const TYPING =
    "input, textarea, select, button, [contenteditable=''], [contenteditable='true'], [role='textbox']";

/** Clicks on these do their own thing rather than jumping the reader. */
const NOT_PROSE = "a, button, pre, figure, input, select, textarea";

/**
 * Bring the spoken sentence back into view when it drifts out, with a
 * single scroll that parks it a third of the way down — but never while the
 * reader is scrolling around on their own.
 */
function keepInView(range: Range, bar: HTMLElement | null, idleFor: number) {
    if (idleFor < 4000) return;
    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) return;
    const top = 64;
    const bottom = window.innerHeight - (bar?.offsetHeight ?? 0) - 40;
    if (rect.top >= top && rect.bottom <= bottom) return;
    const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollBy({
        top: rect.top - window.innerHeight / 3,
        behavior: reduce ? "auto" : "smooth",
    });
}

/**
 * The "Listen" button for the date row and, once started, a player docked
 * to the bottom of the viewport.
 *
 * The bar is portalled to the end of the page's `.full-bleed` root and is
 * `sticky`, not `fixed`: it rides the bottom of the screen and, at the end
 * of the page, settles below the footer instead of covering it. (A portal to
 * <body> would land outside Radix's font tokens.)
 */
export function ListenControls({
    slug,
    title,
    voice,
    wpm,
    minutes,
}: {
    slug: string;
    title: string;
    voice: string;
    wpm: number;
    /** Spoken length at 1×. */
    minutes: number;
}) {
    const [player] = useState(() => new Player({ slug, title, voice, wpm }));
    const state = useSyncExternalStore(
        player.subscribe,
        player.getSnapshot,
        player.getServerSnapshot,
    );
    const highlights = useSyncExternalStore(
        subscribeNever,
        supportsHighlights,
        () => false,
    );
    const [article, setArticle] = useState<HTMLElement | null>(null);
    const [dock, setDock] = useState<HTMLElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const barRef = useRef<HTMLDivElement>(null);
    const lastUserScroll = useRef(0);

    // Stop when the page goes away: unmount covers client-side navigation,
    // pagehide covers reloads, tab closes and the back-forward cache.
    useEffect(() => {
        const stop = () => player.pause();
        window.addEventListener("pagehide", stop);
        return () => {
            window.removeEventListener("pagehide", stop);
            player.close();
        };
    }, [player]);

    // The article isn't ours to render, so its hooks for the stylesheet go
    // on by hand while the player is open.
    useEffect(() => {
        if (!article || !state.open) return;
        article.classList.add(styles.article);
        article.setAttribute("data-listen-open", "");
        if (state.playing && highlights) {
            article.setAttribute("data-listen-dim", "");
        }
        return () => {
            article.classList.remove(styles.article);
            article.removeAttribute("data-listen-open");
            article.removeAttribute("data-listen-dim");
        };
    }, [article, state.open, state.playing, highlights]);

    // Paint the current sentence. Nothing once it's finished: the position
    // has wrapped back to the start, but nothing there is being read.
    useEffect(() => {
        if (!state.open || state.ended) return;
        const segment = player.segments[state.index];
        if (!segment) return;
        if (state.playing) {
            keepInView(
                segment.range,
                barRef.current,
                Date.now() - lastUserScroll.current,
            );
        }
        if (highlights) {
            CSS.highlights.set(SENTENCE, new Highlight(segment.range));
            return () => {
                CSS.highlights.delete(SENTENCE);
            };
        }
        segment.block.setAttribute("data-listen-current", "");
        return () => segment.block.removeAttribute("data-listen-current");
    }, [
        player,
        state.open,
        state.ended,
        state.index,
        state.playing,
        highlights,
    ]);

    // While the player is open: Space toggles, a click on a sentence jumps
    // to it, and hovering one marks it as a jump target.
    useEffect(() => {
        if (!state.open || !article) return;

        const onKey = (event: KeyboardEvent) => {
            if (
                event.key !== " " ||
                event.repeat ||
                event.metaKey ||
                event.ctrlKey ||
                event.altKey
            ) {
                return;
            }
            const target = event.target as HTMLElement | null;
            if (target?.isContentEditable || target?.closest?.(TYPING)) return;
            event.preventDefault();
            player.toggle();
        };

        const noteScroll = () => {
            lastUserScroll.current = Date.now();
        };
        const onScrollKey = (event: KeyboardEvent) => {
            if (/^(Arrow(Up|Down)|Page(Up|Down)|Home|End)$/.test(event.key)) {
                noteScroll();
            }
        };

        const onClick = (event: MouseEvent) => {
            const target = event.target as Element;
            if (event.button !== 0 || event.metaKey || event.ctrlKey) return;
            if (target.closest(NOT_PROSE)) return;
            // Selecting text to copy it shouldn't move the reader.
            if (window.getSelection()?.isCollapsed === false) return;
            player.jumpTo(event.clientX, event.clientY, target);
        };

        let frame = 0;
        const clearHover = () => {
            cancelAnimationFrame(frame);
            if (highlights) CSS.highlights.delete(HOVER);
        };
        const onMove = (event: PointerEvent) => {
            if (!highlights || event.pointerType !== "mouse") return;
            cancelAnimationFrame(frame);
            const { clientX, clientY } = event;
            const target = event.target as Element;
            frame = requestAnimationFrame(() => {
                const segment = target.closest(NOT_PROSE)
                    ? null
                    : player.hoverAt(clientX, clientY, target);
                if (segment) {
                    CSS.highlights.set(HOVER, new Highlight(segment.range));
                } else {
                    CSS.highlights.delete(HOVER);
                }
            });
        };

        window.addEventListener("keydown", onKey);
        window.addEventListener("keydown", onScrollKey);
        window.addEventListener("wheel", noteScroll, { passive: true });
        window.addEventListener("touchmove", noteScroll, { passive: true });
        article.addEventListener("click", onClick);
        article.addEventListener("pointermove", onMove);
        article.addEventListener("pointerleave", clearHover);
        return () => {
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("keydown", onScrollKey);
            window.removeEventListener("wheel", noteScroll);
            window.removeEventListener("touchmove", noteScroll);
            article.removeEventListener("click", onClick);
            article.removeEventListener("pointermove", onMove);
            article.removeEventListener("pointerleave", clearHover);
            clearHover();
        };
    }, [player, article, state.open, highlights]);

    const onListen = () => {
        if (state.open) {
            player.toggle();
            return;
        }
        const found = document.querySelector<HTMLElement>("article.prose");
        if (!found) return;
        setArticle(found);
        setDock(
            buttonRef.current?.closest<HTMLElement>(".full-bleed") ??
                document.body,
        );
        player.open(found);
    };

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                onClick={onListen}
                className="inline-flex h-8 shrink-0 items-center gap-2 rounded-full border border-neutral-200 px-3.5 text-[13px] text-neutral-900 transition-colors hover:border-neutral-400 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:border-neutral-800 dark:text-neutral-100 dark:hover:border-neutral-600 dark:hover:bg-neutral-900 dark:focus-visible:outline-white"
            >
                {state.open && state.playing ? (
                    <PauseIcon aria-hidden />
                ) : (
                    <SpeakerLoudIcon aria-hidden />
                )}
                {state.open ? (state.playing ? "Pause" : "Resume") : "Listen"}
                <span className="text-neutral-400 dark:text-neutral-500">
                    ·
                </span>
                <span className="tabular-nums text-neutral-500 dark:text-neutral-400">
                    {state.open
                        ? `${state.minutesLeft} min left`
                        : `${minutes} min`}
                </span>
            </button>
            {state.open && dock
                ? createPortal(
                      <PlayerBar
                          barRef={barRef}
                          player={player}
                          state={state}
                      />,
                      dock,
                  )
                : null}
        </>
    );
}

const iconButton =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-neutral-900 disabled:pointer-events-none disabled:opacity-40 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white dark:focus-visible:outline-white";

function PlayerBar({
    barRef,
    player,
    state,
}: {
    barRef: React.RefObject<HTMLDivElement | null>;
    player: Player;
    state: PlayerState;
}) {
    const progress = state.ended
        ? 1
        : state.count
          ? state.index / state.count
          : 0;
    const position = state.index + 1;

    return (
        <div
            ref={barRef}
            role="region"
            aria-label="Listen to this post"
            aria-busy={state.waiting}
            className="sticky bottom-0 z-30 border-t border-neutral-200 bg-white/90 backdrop-blur-md dark:border-neutral-800 dark:bg-black/85"
        >
            <div
                aria-hidden
                className="absolute inset-x-0 -top-px h-px origin-left bg-neutral-900 transition-transform duration-500 ease-out motion-reduce:transition-none dark:bg-white"
                style={{ transform: `scaleX(${progress})` }}
            />
            <div
                className={`${PAD} flex items-center gap-x-3 py-2.5 sm:gap-x-4`}
            >
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        aria-label="Previous sentence"
                        onClick={() => player.step(-1)}
                        disabled={state.index === 0 && !state.ended}
                        className={iconButton}
                    >
                        <TrackPreviousIcon aria-hidden />
                    </button>
                    <button
                        type="button"
                        aria-label={state.playing ? "Pause" : "Play"}
                        onClick={() => player.toggle()}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:bg-white dark:text-black dark:focus-visible:outline-white"
                    >
                        {state.playing ? (
                            <PauseIcon aria-hidden />
                        ) : (
                            <PlayIcon aria-hidden />
                        )}
                    </button>
                    <button
                        type="button"
                        aria-label="Next sentence"
                        onClick={() => player.step(1)}
                        disabled={state.ended || position >= state.count}
                        className={iconButton}
                    >
                        <TrackNextIcon aria-hidden />
                    </button>
                </div>

                <p className="min-w-0 flex-1 truncate text-[12px] tabular-nums text-neutral-500 dark:text-neutral-400">
                    {state.error ? (
                        <span
                            role="alert"
                            className="text-neutral-900 dark:text-neutral-100"
                        >
                            {state.error}
                        </span>
                    ) : state.ended ? (
                        `Finished · ${state.count} sentences`
                    ) : state.waiting ? (
                        "Loading…"
                    ) : (
                        <>
                            <span className="hidden md:inline">Sentence </span>
                            {position}
                            <span className="md:hidden">/</span>
                            <span className="hidden md:inline"> of </span>
                            {state.count} · ~{state.minutesLeft} min
                            <span className="hidden md:inline"> left</span>
                        </>
                    )}
                </p>

                <label className="relative flex w-16 shrink-0 items-center">
                    <span className="sr-only">Speed</span>
                    <select
                        value={String(state.rate)}
                        onChange={(event) =>
                            player.setRate(Number(event.target.value))
                        }
                        className="h-8 w-full appearance-none rounded-md border border-neutral-200 bg-transparent pl-2.5 pr-6 font-[family-name:var(--font-geist-mono)] text-[12px] text-neutral-700 transition-colors hover:border-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-neutral-900 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-600 dark:focus-visible:outline-white [&_option]:bg-white dark:[&_option]:bg-neutral-950"
                    >
                        {RATES.map((rate) => (
                            <option key={rate} value={rate}>
                                {rate}×
                            </option>
                        ))}
                    </select>
                    <ChevronDownIcon
                        aria-hidden
                        className="pointer-events-none absolute right-2 h-3 w-3 text-neutral-400"
                    />
                </label>

                <button
                    type="button"
                    aria-label="Stop and close the player"
                    onClick={() => player.close()}
                    className={iconButton}
                >
                    <Cross2Icon aria-hidden />
                </button>
            </div>
        </div>
    );
}
