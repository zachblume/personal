"use client";

import { useEffect, useId, useRef } from "react";
import { useCurrentSection } from "app/components/article/CurrentSection";
import type { Heading } from "app/components/article/headings";

/** How far from a note, in px, a row starts to dim. */
const FADE = 48;

/** 0 at the note, 1 from FADE away, easing in and out between. */
function visibility(gap: number) {
    const t = Math.min(1, Math.max(0, gap / FADE));
    return t * t * (3 - 2 * t);
}

/** Classes shared by every row that can make way for a note. */
const ROW = "opacity-(--fade,1) focus-within:opacity-100";

/**
 * The article's sections, sticky in the right margin on wide screens — the
 * same margin the sidenotes hang in. Each row dims as a note scrolls toward
 * it and is gone only while the note is beside it. Opacity follows the scroll
 * position rather than animating on a timer, so nothing blinks: the outline
 * just thins out around the note and fills back in after.
 */
export function Outline({ headings }: { headings: Heading[] }) {
    const current = useCurrentSection();
    const labelId = useId();
    const navRef = useRef<HTMLElement>(null);

    // Written straight to the rows' styles: a re-render per scrolled frame
    // would be wasted work for a change only the compositor needs.
    useEffect(() => {
        const nav = navRef.current;
        if (!nav) return;
        let frame = 0;

        const update = () => {
            frame = 0;
            // Hidden below xl, so there's nothing to make way for.
            if (nav.getBoundingClientRect().height === 0) return;
            const notes = Array.from(
                document.querySelectorAll("article [role=note]"),
                (note) => note.getBoundingClientRect(),
            ).filter((r) => r.height > 0);
            for (const row of nav.querySelectorAll<HTMLElement>("[data-row]")) {
                const box = row.getBoundingClientRect();
                let gap = Infinity;
                for (const r of notes) {
                    gap = Math.min(
                        gap,
                        Math.max(0, r.top - box.bottom, box.top - r.bottom),
                    );
                }
                const o = visibility(gap);
                row.style.setProperty("--fade", o.toFixed(3));
                row.style.pointerEvents = o < 0.5 ? "none" : "";
            }
        };

        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };

        schedule();
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", schedule);
        };
    }, []);

    if (headings.length === 0) return null;

    // The outline's original look: a small "Outline" heading, plain links
    // cut at 20 characters, the current one a shade darker.
    return (
        <nav ref={navRef} aria-labelledby={labelId}>
            <h3
                id={labelId}
                data-row="label"
                className={`mb-1 text-xs text-neutral-400 ${ROW}`}
            >
                Outline
            </h3>
            <ul className="list-none">
                {headings.map((heading, i) => {
                    const active = heading.id === current;
                    return (
                        <li
                            key={heading.id}
                            data-row={i}
                            className={`${heading.level > 2 ? "ml-2" : "ml-1"} ${ROW}`}
                        >
                            <a
                                href={`#${heading.id}`}
                                title={heading.text}
                                aria-current={active ? "location" : undefined}
                                className={`text-sm ${
                                    active
                                        ? "text-neutral-800 dark:text-neutral-200"
                                        : "text-neutral-400"
                                }`}
                            >
                                {heading.text.length > 20
                                    ? `${heading.text.slice(0, 20)}...`
                                    : heading.text}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
