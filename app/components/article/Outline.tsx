"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useCurrentSection } from "app/components/article/CurrentSection";
import type { Heading } from "app/components/article/headings";

/** Room kept clear above and below a row before it gives way. */
const CLEARANCE = 12;

/**
 * The article's sections, sticky in the right margin on wide screens — the
 * same margin the sidenotes hang in. As an aside scrolls up past it, only the
 * rows it would cover fade out, and each comes back once the note has gone
 * by, so the outline parts around the note instead of sitting under it.
 */
function fade(gone: boolean) {
    return `motion-safe:transition-opacity motion-safe:duration-300 ${
        gone ? "pointer-events-none opacity-0" : ""
    }`;
}

export function Outline({ headings }: { headings: Heading[] }) {
    const current = useCurrentSection();
    const labelId = useId();
    const navRef = useRef<HTMLElement>(null);
    // The rows a note is passing, as "label,0,3": a string, so an unchanged
    // set doesn't re-render.
    const [hidden, setHidden] = useState("");

    useEffect(() => {
        const nav = navRef.current;
        if (!nav) return;
        let frame = 0;

        const check = () => {
            frame = 0;
            // Hidden below xl, so there's nothing to get out of the way of.
            if (nav.getBoundingClientRect().height === 0) return;
            const notes = Array.from(
                document.querySelectorAll("article [role=note]"),
                (note) => note.getBoundingClientRect(),
            ).filter((r) => r.height > 0);
            const covered = Array.from(
                nav.querySelectorAll<HTMLElement>("[data-row]"),
            )
                .filter((row) => {
                    const box = row.getBoundingClientRect();
                    return notes.some(
                        (r) =>
                            r.top < box.bottom + CLEARANCE &&
                            r.bottom > box.top - CLEARANCE,
                    );
                })
                .map((row) => row.dataset.row)
                .join(",");
            setHidden(covered);
        };

        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(check);
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

    const rows = new Set(hidden.split(","));
    const isHidden = (row: string) => rows.has(row);

    return (
        <nav ref={navRef} aria-labelledby={labelId}>
            <p
                id={labelId}
                data-row="label"
                className={`mb-3 text-[12px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 ${fade(isHidden("label"))}`}
            >
                Outline
            </p>
            <ol>
                {headings.map((heading, i) => {
                    const active = heading.id === current;
                    const gone = isHidden(String(i));
                    return (
                        // The rail is drawn per row, so a row's segment
                        // fades with it.
                        <li
                            key={heading.id}
                            data-row={i}
                            className={`border-l border-neutral-200 dark:border-neutral-800 ${fade(gone)}`}
                        >
                            {/* Colour on the inner span: global.css resets
                                a hovered full-bleed link to `color: inherit`,
                                which beats a hover utility on the link. */}
                            <a
                                href={`#${heading.id}`}
                                aria-current={active ? "location" : undefined}
                                tabIndex={gone ? -1 : undefined}
                                className={`group -ml-px block border-l py-1 text-[13px] leading-snug focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-white ${
                                    heading.level > 2 ? "pl-6" : "pl-3"
                                } ${
                                    active
                                        ? "border-neutral-900 dark:border-white"
                                        : "border-transparent"
                                }`}
                            >
                                <span
                                    className={`motion-safe:transition-colors ${
                                        active
                                            ? "text-neutral-900 dark:text-white"
                                            : "text-neutral-400 group-hover:text-neutral-900 dark:text-neutral-500 dark:group-hover:text-white"
                                    }`}
                                >
                                    {heading.text}
                                </span>
                            </a>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
