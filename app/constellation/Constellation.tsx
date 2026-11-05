"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "app/components/Link";
import type { GraphEdge, GraphNode } from "./graph";
import styles from "./constellation.module.css";

export type MapPost = GraphNode & {
    href: string;
    title: string;
    summary: string;
    date: string;
    minutes: number;
};

type Frame = {
    width: number;
    height: number;
    font: number;
    lineHeight: number;
    labelMax: number;
    maxLines: number;
    gap: number;
};

function frameVars(wide: Frame, narrow: Frame) {
    const vars: Record<string, string | number> = {};
    for (const [name, f] of [
        ["wide", wide],
        ["narrow", narrow],
    ] as const) {
        vars[`--${name}-aspect`] = `${f.width} / ${f.height}`;
        vars[`--${name}-font`] = `${f.font}px`;
        vars[`--${name}-line`] = `${f.lineHeight}px`;
        vars[`--${name}-label`] = `${f.labelMax}px`;
        vars[`--${name}-lines`] = f.maxLines;
        vars[`--${name}-gap`] = `${f.gap}px`;
    }
    return vars as React.CSSProperties;
}

/** Inline custom properties that place something in both layouts. */
function placeAt(
    wide: { x: number; y: number; d?: number },
    narrow: { x: number; y: number; d?: number },
) {
    return {
        "--wx": `${wide.x}%`,
        "--wy": `${wide.y}%`,
        "--nx": `${narrow.x}%`,
        "--ny": `${narrow.y}%`,
        ...(wide.d ? { "--wd": `${wide.d}%`, "--nd": `${narrow.d}%` } : {}),
    } as React.CSSProperties;
}

const round = (n: number) => Math.round(n * 100) / 100;

const midpoint = ([x1, y1, x2, y2]: number[], f: Frame) => ({
    x: round(((x1 + x2) / 2 / f.width) * 100),
    y: round(((y1 + y2) / 2 / f.height) * 100),
});

export function Constellation({
    posts,
    edges,
    art,
    panelArt,
    wide,
    narrow,
}: {
    posts: MapPost[];
    edges: GraphEdge[];
    /** Each post's artwork for the map, rendered on the server. */
    art: Record<string, React.ReactNode>;
    /**
     * A second copy with its own SVG ids, for the panel. A post is never in
     * its own Read next, so one extra copy covers the panel's header and
     * its list.
     */
    panelArt: Record<string, React.ReactNode>;
    wide: Frame;
    narrow: Frame;
}) {
    const [hovered, setHovered] = useState<string | null>(null);
    const [focused, setFocused] = useState<string | null>(null);
    const [selected, setSelected] = useState<string | null>(null);
    const headingRef = useRef<HTMLHeadingElement>(null);

    const bySlug = new Map(posts.map((post) => [post.slug, post]));
    const active = hovered ?? focused ?? selected;
    const lit = new Set(
        active ? [active, ...bySlug.get(active)!.neighbours] : [],
    );
    const current = selected ? bySlug.get(selected)! : null;

    const close = () => {
        const slug = selected;
        setSelected(null);
        if (slug) document.getElementById(`node-${slug}`)?.focus();
    };

    useEffect(() => {
        if (!selected) return;
        // Move focus into the panel so a keyboard or screen reader user lands
        // on what they just opened.
        headingRef.current?.focus({ preventScroll: true });
        const onKey = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            setSelected(null);
            document.getElementById(`node-${selected}`)?.focus();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [selected]);

    return (
        <div className="border-b border-neutral-200 md:grid md:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] dark:border-neutral-800">
            <div className={`${styles.map} px-4 py-8 md:px-6 md:py-10`}>
                <div
                    role="group"
                    aria-label="Map of every post. Lines join posts that share vocabulary."
                    className={styles.frame}
                    style={frameVars(wide, narrow)}
                    onClick={(event) => {
                        if (event.target === event.currentTarget) {
                            setSelected(null);
                        }
                    }}
                >
                    {[
                        { frame: wide, key: "wide", only: styles.wideOnly },
                        {
                            frame: narrow,
                            key: "narrow",
                            only: styles.narrowOnly,
                        },
                    ].map(({ frame, key, only }) => (
                        <svg
                            key={key}
                            viewBox={`0 0 ${frame.width} ${frame.height}`}
                            preserveAspectRatio="none"
                            className={`${only} pointer-events-none absolute inset-0 h-full w-full text-neutral-900 dark:text-neutral-100`}
                            aria-hidden
                        >
                            {edges.map((edge) => {
                                const [x1, y1, x2, y2] =
                                    key === "wide" ? edge.wide : edge.narrow;
                                const on =
                                    active === edge.a || active === edge.b;
                                return (
                                    <line
                                        key={edge.id}
                                        x1={x1}
                                        y1={y1}
                                        x2={x2}
                                        y2={y2}
                                        stroke="currentColor"
                                        strokeWidth={on ? 1.5 : 1}
                                        strokeOpacity={
                                            on
                                                ? 0.85
                                                : active
                                                  ? 0.05
                                                  : 0.14 + edge.weight * 0.4
                                        }
                                        vectorEffect="non-scaling-stroke"
                                        className="transition-[stroke-opacity] duration-200 motion-reduce:transition-none"
                                    />
                                );
                            })}
                        </svg>
                    ))}

                    {posts.map((post) => {
                        const isLit = !active || lit.has(post.slug);
                        const isActive = active === post.slug;
                        const isSelected = selected === post.slug;
                        return (
                            <button
                                key={post.slug}
                                id={`node-${post.slug}`}
                                type="button"
                                aria-pressed={isSelected}
                                aria-describedby={`node-${post.slug}-links`}
                                className={`${styles.at} ${styles.node} group block cursor-pointer rounded-full text-left outline-none transition-opacity duration-200 motion-reduce:transition-none ${
                                    isLit ? "opacity-100" : "opacity-20"
                                } ${isActive ? "z-30" : "z-10"}`}
                                style={placeAt(post.wide, post.narrow)}
                                onPointerEnter={(event) => {
                                    if (event.pointerType === "mouse") {
                                        setHovered(post.slug);
                                    }
                                }}
                                onPointerLeave={(event) => {
                                    if (event.pointerType === "mouse") {
                                        setHovered(null);
                                    }
                                }}
                                onFocus={() => setFocused(post.slug)}
                                onBlur={() => setFocused(null)}
                                onClick={() =>
                                    setSelected(isSelected ? null : post.slug)
                                }
                            >
                                <span
                                    className={`block aspect-square w-full overflow-hidden rounded-full shadow-[0_0_0_3px_#fff] ring-1 ring-black/10 outline-offset-4 group-focus-visible:outline-2 group-focus-visible:outline-neutral-900 dark:shadow-[0_0_0_3px_#000] dark:ring-white/15 dark:group-focus-visible:outline-white ${
                                        isSelected
                                            ? "ring-2 ring-neutral-900 ring-offset-2 ring-offset-white dark:ring-white dark:ring-offset-black"
                                            : ""
                                    }`}
                                >
                                    {art[post.slug]}
                                </span>
                                <span
                                    className={`${styles.label} tracking-[-0.005em] ${
                                        isActive || isSelected
                                            ? "text-neutral-900 dark:text-white"
                                            : "text-neutral-600 dark:text-neutral-400"
                                    }`}
                                    data-wide={post.wide.side}
                                    data-narrow={post.narrow.side}
                                >
                                    {post.title}
                                </span>
                            </button>
                        );
                    })}

                    {active
                        ? edges
                              .filter(
                                  (edge) =>
                                      edge.a === active || edge.b === active,
                              )
                              .map((edge) => (
                                  <span
                                      key={edge.id}
                                      aria-hidden
                                      className={`${styles.at} pointer-events-none z-20 whitespace-nowrap rounded-full border border-neutral-200 bg-white px-2 py-0.5 font-[family-name:var(--font-geist-mono)] text-[10.5px] leading-4 text-neutral-600 dark:border-neutral-800 dark:bg-black dark:text-neutral-300`}
                                      style={placeAt(
                                          midpoint(edge.wide, wide),
                                          midpoint(edge.narrow, narrow),
                                      )}
                                  >
                                      {edge.terms.map((term, i) => (
                                          <span
                                              key={term}
                                              className={
                                                  i > 1
                                                      ? styles.wideInline
                                                      : undefined
                                              }
                                          >
                                              {i > 0 ? " · " : ""}
                                              {term}
                                          </span>
                                      ))}
                                  </span>
                              ))
                        : null}
                </div>

                {/* What a screen reader hears after each node's title. */}
                <div hidden>
                    {posts.map((post) => (
                        <span key={post.slug} id={`node-${post.slug}-links`}>
                            {post.neighbours.length
                                ? `Linked to ${post.neighbours
                                      .map((slug) => bySlug.get(slug)!.title)
                                      .join("; ")}.`
                                : "No close links."}
                        </span>
                    ))}
                </div>
            </div>

            <aside
                aria-labelledby="constellation-panel-title"
                className={
                    current
                        ? `${styles.sheet} fixed inset-x-0 bottom-0 z-50 max-h-[65vh] overflow-y-auto rounded-t-2xl border-t border-neutral-200 bg-white px-6 pb-10 pt-3 shadow-[0_-16px_40px_rgba(0,0,0,0.08)] md:sticky md:inset-x-auto md:bottom-auto md:top-0 md:z-auto md:max-h-screen md:self-start md:rounded-none md:border-l md:border-t-0 md:px-6 md:py-10 md:shadow-none dark:border-neutral-800 dark:bg-neutral-950 md:dark:bg-black`
                        : "hidden md:sticky md:top-0 md:block md:self-start md:border-l md:border-neutral-200 md:px-6 md:py-10 md:dark:border-neutral-800"
                }
            >
                {current ? (
                    <>
                        <span
                            aria-hidden
                            className="mx-auto mb-3 block h-1 w-10 rounded-full bg-neutral-200 md:hidden dark:bg-neutral-800"
                        />
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-[12px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                                Selected
                            </p>
                            <button
                                type="button"
                                onClick={close}
                                className="-mr-2 rounded-md px-2 py-1 text-[12px] text-neutral-500 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-neutral-900 dark:text-neutral-400 dark:hover:text-white dark:focus-visible:outline-white"
                            >
                                Close
                                <span className="sr-only"> panel</span>
                            </button>
                        </div>
                        <span className="mt-4 hidden overflow-hidden rounded-md border border-neutral-200/80 md:block dark:border-neutral-800">
                            <span className="block aspect-[16/9]">
                                {panelArt[current.slug]}
                            </span>
                        </span>
                        <h2
                            id="constellation-panel-title"
                            ref={headingRef}
                            tabIndex={-1}
                            className="mt-3 font-[family-name:var(--font-editorial)] text-[24px] leading-tight tracking-[-0.025em] text-neutral-900 outline-none md:mt-5 dark:text-white"
                        >
                            {current.title}
                        </h2>
                        <p className="mt-2 text-[13px] tabular-nums text-neutral-400 dark:text-neutral-500">
                            {current.date} · {current.minutes} min read
                        </p>
                        {current.summary ? (
                            <p className="mt-3 text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                                {current.summary}
                            </p>
                        ) : null}
                        <Link
                            href={current.href}
                            className="mt-4 inline-block text-[14px] text-neutral-900 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900 dark:text-white dark:decoration-neutral-700 dark:hover:decoration-white"
                        >
                            Read the post
                        </Link>

                        <h3 className="mt-8 font-[family-name:var(--font-editorial)] text-[18px] tracking-[-0.02em] text-neutral-900 dark:text-white">
                            Read next
                        </h3>
                        <ol className="mt-2">
                            {current.readNext.map((next) => {
                                const post = bySlug.get(next.slug)!;
                                return (
                                    <li
                                        key={next.slug}
                                        className="border-t border-neutral-200 first:border-t-0 dark:border-neutral-800"
                                    >
                                        <Link
                                            href={post.href}
                                            className="group flex gap-4 py-3"
                                        >
                                            <span className="mt-0.5 block w-16 shrink-0 overflow-hidden rounded border border-neutral-200/80 dark:border-neutral-800">
                                                <span className="block aspect-[16/9]">
                                                    {panelArt[post.slug]}
                                                </span>
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block text-[14px] font-medium leading-snug tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                                                    {post.title}
                                                </span>
                                                <span className="mt-1 block text-[13px] leading-snug text-neutral-500 dark:text-neutral-400">
                                                    {next.why}
                                                </span>
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ol>
                    </>
                ) : (
                    <>
                        <p
                            id="constellation-panel-title"
                            className="text-[12px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500"
                        >
                            Reading the map
                        </p>
                        <dl className="mt-4 space-y-4 text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                            <div>
                                <dt className="text-neutral-900 dark:text-white">
                                    Circles
                                </dt>
                                <dd>
                                    One per post, with its artwork. Bigger means
                                    longer.
                                </dd>
                            </div>
                            <div>
                                <dt className="text-neutral-900 dark:text-white">
                                    Lines
                                </dt>
                                <dd>
                                    Each post&rsquo;s two closest neighbours by
                                    shared vocabulary. Darker means more in
                                    common.
                                </dd>
                            </div>
                            <div>
                                <dt className="text-neutral-900 dark:text-white">
                                    Hover or focus
                                </dt>
                                <dd>
                                    Shows the words a post shares with its
                                    neighbours.
                                </dd>
                            </div>
                            <div>
                                <dt className="text-neutral-900 dark:text-white">
                                    Select
                                </dt>
                                <dd>Opens it here, with what to read next.</dd>
                            </div>
                        </dl>
                    </>
                )}
            </aside>
        </div>
    );
}
