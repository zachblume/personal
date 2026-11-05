"use client";

import { useState } from "react";

export type HuePoint = {
    ordinal: string;
    title: string;
    composition: string;
    h: number;
    h2: number;
};

const SIZE = 300;
const C = SIZE / 2;
const OUTER = 118;
const INNER = 82;

/** Trig's last digit differs between Node and the browser, so round before it
 *  reaches an attribute — otherwise hydration sees a mismatch. */
const fixed = (v: number) => Math.round(v * 100) / 100;

/** 0° at twelve o'clock, clockwise. */
function polar(deg: number, r: number) {
    const a = ((deg - 90) * Math.PI) / 180;
    return [fixed(C + r * Math.cos(a)), fixed(C + r * Math.sin(a))];
}

const deg = (h: number) => `${Math.round(h)}°`;

function artVars(p: HuePoint) {
    return {
        "--art-h": p.h.toFixed(1),
        "--art-h2": p.h2.toFixed(1),
    } as React.CSSProperties;
}

function ActivePair({ point }: { point: HuePoint }) {
    const [x1, y1] = polar(point.h, OUTER);
    const [x2, y2] = polar(point.h2, INNER);
    return (
        <g
            aria-hidden
            className="art pointer-events-none"
            style={artVars(point)}
        >
            <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                strokeWidth={1}
                className="stroke-neutral-900 dark:stroke-white"
            />
            <circle
                cx={x2}
                cy={y2}
                r={6}
                fill="var(--art-3)"
                strokeWidth={2}
                className="stroke-white dark:stroke-black"
            />
            <circle
                cx={x1}
                cy={y1}
                r={8}
                fill="var(--art-1)"
                strokeWidth={2}
                className="stroke-white dark:stroke-black"
            />
            <circle
                cx={x1}
                cy={y1}
                r={12}
                fill="none"
                strokeWidth={1}
                className="stroke-neutral-900 dark:stroke-white"
            />
        </g>
    );
}

/**
 * Every post's two hues on one wheel: the first hue on the outer ring, the
 * second on the inner. The dots are drawn in the post's own ramp (the `.art`
 * class resolves it), so in dark mode they take the dark steps. Hover or
 * focus a post to join its pair and read it in the middle.
 */
export function HueWheel({
    points,
    widest,
}: {
    points: HuePoint[];
    widest: number;
}) {
    const [active, setActive] = useState<number | null>(null);
    const current = active === null ? null : points[active];

    return (
        <div className="relative mx-auto w-full max-w-[340px]">
            <svg
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                className="block h-auto w-full overflow-visible"
                role="group"
                aria-label="Each post's first and second hue around the color wheel"
            >
                <circle
                    cx={C}
                    cy={C}
                    r={OUTER}
                    fill="none"
                    strokeWidth={1}
                    className="stroke-neutral-200 dark:stroke-neutral-800"
                />
                <circle
                    cx={C}
                    cy={C}
                    r={INNER}
                    fill="none"
                    strokeWidth={1}
                    className="stroke-neutral-200 dark:stroke-neutral-800"
                />
                {/* One tick per composition step: the hue advances 30° a post. */}
                {Array.from({ length: 12 }, (_, i) => {
                    const [x1, y1] = polar(i * 30, OUTER + 8);
                    const [x2, y2] = polar(i * 30, OUTER + (i % 3 ? 12 : 15));
                    return (
                        <line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            strokeWidth={1}
                            className="stroke-neutral-300 dark:stroke-neutral-700"
                        />
                    );
                })}
                {[0, 90, 180, 270].map((d) => {
                    const [x, y] = polar(d, OUTER + 26);
                    return (
                        <text
                            key={d}
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            className="fill-neutral-400 font-[family-name:var(--font-geist-mono)] text-[10px] dark:fill-neutral-500"
                        >
                            {d}°
                        </text>
                    );
                })}

                {points.map((p, i) => {
                    const [x1, y1] = polar(p.h, OUTER);
                    const [x2, y2] = polar(p.h2, INNER);
                    return (
                        <g
                            key={p.ordinal}
                            className="art cursor-default outline-none"
                            style={artVars(p)}
                            tabIndex={0}
                            role="img"
                            aria-label={`${p.ordinal}, ${p.title}: ${deg(p.h)} and ${deg(p.h2)}, ${p.composition}`}
                            onPointerEnter={() => setActive(i)}
                            onPointerLeave={() => setActive(null)}
                            onFocus={() => setActive(i)}
                            onBlur={() => setActive(null)}
                        >
                            <circle
                                cx={x2}
                                cy={y2}
                                r={4.5}
                                fill="var(--art-3)"
                                strokeWidth={2}
                                className="stroke-white dark:stroke-black"
                            />
                            <circle
                                cx={x1}
                                cy={y1}
                                r={6}
                                fill="var(--art-1)"
                                strokeWidth={2}
                                className="stroke-white dark:stroke-black"
                            />
                            {/* Hit areas larger than the dots. */}
                            <circle cx={x1} cy={y1} r={12} fill="transparent" />
                            <circle cx={x2} cy={y2} r={10} fill="transparent" />
                        </g>
                    );
                })}

                {/* The active pair, drawn last so it sits on top. A separate
                    layer rather than reordering the groups, which would move
                    the focused element and blur it. */}
                {current ? <ActivePair point={current} /> : null}
            </svg>

            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
                <div className="w-[44%] text-center">
                    {current ? (
                        <>
                            <p className="font-[family-name:var(--font-geist-mono)] text-[10px] tabular-nums text-neutral-400 dark:text-neutral-500">
                                {current.ordinal} · {current.composition}
                            </p>
                            <p className="mt-1 line-clamp-3 text-[13px] font-medium leading-snug tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                                {current.title}
                            </p>
                            <p className="mt-1 font-[family-name:var(--font-geist-mono)] text-[11px] tabular-nums text-neutral-500 dark:text-neutral-400">
                                {deg(current.h)} + {deg(current.h2)}
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-[13px] leading-snug text-neutral-900 dark:text-neutral-100">
                                {points.length} posts, {points.length * 2} hues
                            </p>
                            <p className="mt-1 font-[family-name:var(--font-geist-mono)] text-[10px] leading-snug text-neutral-400 dark:text-neutral-500">
                                widest gap between first hues: {deg(widest)}
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
