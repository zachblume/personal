"use client";

import { createContext, use, useEffect, useState } from "react";

const CurrentSectionContext = createContext<string | null>(null);

/**
 * Which section of the article is being read, as its heading's id — null in
 * the introduction, before the first heading. The margin outline and the
 * reading bar both read it, so they can't disagree.
 *
 * The observer's root reaches far above the viewport and stops 30% of the
 * way down it, so a heading intersects exactly while it's above that line,
 * and the current section is the last heading that does. That holds after a
 * jump in either direction, which a band-shaped root misses: headings that
 * skip past a band never report.
 */
export function CurrentSectionProvider({
    ids,
    children,
}: {
    /** Heading ids in document order. */
    ids: string[];
    children: React.ReactNode;
}) {
    const [current, setCurrent] = useState<string | null>(null);
    // A string, so a fresh-but-equal array doesn't rebuild the observer.
    const key = ids.join("\n");

    useEffect(() => {
        const elements = key
            .split("\n")
            .map((id) => (id ? document.getElementById(id) : null))
            .filter((el) => el !== null);
        const above = new Set<Element>();
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) above.add(entry.target);
                    else above.delete(entry.target);
                }
                let id: string | null = null;
                for (const el of elements) if (above.has(el)) id = el.id;
                setCurrent(id);
            },
            { rootMargin: "999999px 0px -70% 0px" },
        );
        elements.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [key]);

    return (
        <CurrentSectionContext value={current}>
            {children}
        </CurrentSectionContext>
    );
}

export function useCurrentSection() {
    return use(CurrentSectionContext);
}
