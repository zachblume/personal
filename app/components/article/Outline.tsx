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

    // The outline's original look: a small "Outline" heading, plain links
    // cut at 20 characters, the current one a shade darker.
    return (
        <nav ref={navRef} aria-labelledby={labelId}>
            <h3
                id={labelId}
                data-row="label"
                className={`mb-1 text-xs text-neutral-400 ${fade(isHidden("label"))}`}
            >
                Outline
            </h3>
            <ul className="list-none">
                {headings.map((heading, i) => {
                    const active = heading.id === current;
                    const gone = isHidden(String(i));
                    return (
                        <li
                            key={heading.id}
                            data-row={i}
                            className={`${heading.level > 2 ? "ml-2" : "ml-1"} ${fade(gone)}`}
                        >
                            <a
                                href={`#${heading.id}`}
                                title={heading.text}
                                aria-current={active ? "location" : undefined}
                                tabIndex={gone ? -1 : undefined}
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
