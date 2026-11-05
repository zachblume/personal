"use client";

import { useId } from "react";
import { useCurrentSection } from "app/components/article/CurrentSection";
import type { Heading } from "app/components/article/headings";

/**
 * The article's sections, for the left margin on wide screens. Narrower
 * screens reach the same list through the reading bar's sheet.
 */
export function Outline({ headings }: { headings: Heading[] }) {
    const current = useCurrentSection();
    const labelId = useId();

    if (headings.length === 0) return null;

    return (
        <nav aria-labelledby={labelId}>
            <p
                id={labelId}
                className="mb-3 text-[12px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500"
            >
                Outline
            </p>
            <ol className="border-l border-neutral-200 dark:border-neutral-800">
                {headings.map((heading) => {
                    const active = heading.id === current;
                    return (
                        <li key={heading.id}>
                            {/* Colour on the inner span: global.css resets
                                a hovered full-bleed link to `color: inherit`,
                                which beats a hover utility on the link. */}
                            <a
                                href={`#${heading.id}`}
                                aria-current={active ? "location" : undefined}
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
