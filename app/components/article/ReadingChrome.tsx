"use client";

import { useEffect, useRef, useState } from "react";
import { PAD } from "app/components/SiteChrome";

/** Everything the scroll handler needs, in document coordinates. */
type Geometry = {
    titleBottom: number;
    articleBottom: number;
};

const BAR = 48;

/**
 * Wraps a post's title and article. Once the title scrolls off, a bar pins
 * the title.
 *
 * The bar is fixed, so it must never end up inside a transformed ancestor.
 */
export function ReadingChrome({
    title,
    className,
    children,
}: {
    title: string;
    className?: string;
    /** Must contain the post's <h1> and its <article>. */
    children: React.ReactNode;
}) {
    const rootRef = useRef<HTMLDivElement>(null);
    const geometry = useRef<Geometry | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const root = rootRef.current;
        const article = root?.querySelector("article");
        const titleEl = root?.querySelector("h1");
        if (!article || !titleEl) return;

        let frame = 0;

        const measure = () => {
            const y = window.scrollY;
            const box = article.getBoundingClientRect();
            const g: Geometry = {
                titleBottom: titleEl.getBoundingClientRect().bottom + y,
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
        };

        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };

        const onResize = () => {
            measure();
            schedule();
        };

        measure();
        schedule();

        // Fonts and images settle after mount and move every block.
        const resizeObserver = new ResizeObserver(onResize);
        resizeObserver.observe(article);
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", onResize);

        return () => {
            cancelAnimationFrame(frame);
            resizeObserver.disconnect();
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", onResize);
        };
    }, []);

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
            </aside>
        </>
    );
}
