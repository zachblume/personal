"use client";

import { useId, useState, useSyncExternalStore } from "react";
import styles from "app/components/article/sidenotes.module.css";

/** Where notes move into the margin. Keep in step with the stylesheet. */
const WIDE = "(min-width: 64rem)";

function subscribe(onChange: () => void) {
    const query = window.matchMedia(WIDE);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
}

const isWide = () => window.matchMedia(WIDE).matches;

/** Hover or focus anywhere in the pair lights up both halves of it. */
const LIT =
    "group-hover/sn:bg-neutral-900 group-hover/sn:text-white group-focus-within/sn:bg-neutral-900 group-focus-within/sn:text-white dark:group-hover/sn:bg-white dark:group-hover/sn:text-black dark:group-focus-within/sn:bg-white dark:group-focus-within/sn:text-black";

const MARKER = `relative -top-[0.5em] ml-px inline-block rounded-[3px] px-[3px] align-baseline font-[family-name:var(--font-geist-mono)] text-[10.5px] leading-[1.4] tabular-nums text-neutral-500 motion-safe:transition-colors dark:text-neutral-400 ${LIT}`;

/**
 * One aside, as sidenotes.ts writes it into the MDX — so `n` arrives as a
 * string. Wide screens show every note in the margin, so the marker is just
 * a number; narrow ones fold the note away behind it, so it's a button.
 *
 * The note stays in the DOM straight after its marker, so anything reading
 * the article in order (a screen reader, Listen) reads it in place. The
 * numbers are skipped by Listen.
 */
export function Sidenote({
    n,
    children,
}: {
    n: string;
    children: React.ReactNode;
}) {
    const id = useId();
    const [open, setOpen] = useState(false);
    const wide = useSyncExternalStore(subscribe, isWide, () => false);

    return (
        <span
            className={`${styles.sidenote} group/sn`}
            data-open={open ? "" : undefined}
        >
            {wide ? (
                <span className={MARKER} aria-hidden data-listen-skip>
                    {n}
                </span>
            ) : (
                <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={id}
                    aria-label={`Aside ${n}`}
                    onClick={() => setOpen(!open)}
                    data-listen-skip
                    className={`${MARKER} cursor-pointer after:absolute after:-inset-2 after:content-[''] focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 aria-expanded:bg-neutral-900 aria-expanded:text-white dark:focus-visible:outline-white dark:aria-expanded:bg-white dark:aria-expanded:text-black`}
                >
                    {n}
                </button>
            )}
            <span
                id={id}
                role="note"
                className={`${styles.note} border-l border-neutral-200 pl-3 text-[13px] leading-[1.5] tracking-normal text-neutral-500 motion-safe:transition-colors group-hover/sn:text-neutral-900 group-focus-within/sn:text-neutral-900 lg:border-l-0 lg:pl-0 dark:border-neutral-800 dark:text-neutral-400 dark:group-hover/sn:text-neutral-100 dark:group-focus-within/sn:text-neutral-100`}
            >
                <span
                    aria-hidden
                    data-listen-skip
                    className="mr-1.5 font-[family-name:var(--font-geist-mono)] text-[10.5px] tabular-nums text-neutral-400 group-hover/sn:text-neutral-900 dark:text-neutral-500 dark:group-hover/sn:text-white"
                >
                    {n}
                </span>
                {children}
            </span>
        </span>
    );
}
