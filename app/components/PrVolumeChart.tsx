import { getArtIndex } from "app/blog/utils";
import { Fragment } from "react";
import { artParams } from "app/components/Art";

/**
 * Pull requests of mine merged per month on my side project, from GitHub
 * search (`is:pr author:zachblume merged:<month>`). Starts at my first PR
 * there and stops at the last full month.
 */
const MONTHS: [string, number][] = [
    ["2023-03", 16],
    ["2023-04", 23],
    ["2023-05", 14],
    ["2023-06", 42],
    ["2023-07", 13],
    ["2023-08", 1],
    ["2023-09", 14],
    ["2023-10", 25],
    ["2023-11", 19],
    ["2023-12", 18],
    ["2024-01", 14],
    ["2024-02", 12],
    ["2024-03", 21],
    ["2024-04", 25],
    ["2024-05", 23],
    ["2024-06", 8],
    ["2024-07", 11],
    ["2024-08", 3],
    ["2024-09", 0],
    ["2024-10", 0],
    ["2024-11", 8],
    ["2024-12", 0],
    ["2025-01", 0],
    ["2025-02", 6],
    ["2025-03", 8],
    ["2025-04", 20],
    ["2025-05", 5],
    ["2025-06", 5],
    ["2025-07", 25],
    ["2025-08", 16],
    ["2025-09", 33],
    ["2025-10", 39],
    ["2025-11", 123],
    ["2025-12", 85],
    ["2026-01", 171],
    ["2026-02", 211],
    ["2026-03", 50],
    ["2026-04", 45],
    ["2026-05", 259],
    ["2026-06", 178],
    ["2026-07", 157],
    ["2026-08", 196],
    ["2026-09", 201],
    ["2026-10", 553],
];

/**
 * When each coding agent first shows up in my PRs: its bot opening one, its
 * branch prefix (`codex/`, `claude/`, ...), or its signature in a PR body.
 * Aider and SWE-agent left no trace in the repo; they sit at their release
 * months, which is when I tried them.
 * Rows go top to bottom in date order, so a label's leader line only ever
 * passes to the left of the labels below it.
 */
const TOOLS: {
    month: string;
    /** One or more tools that arrived the same month, each with its site. */
    links: [name: string, href: string][];
    anchor?: "end";
    /** Override the date-order row, for a label with room higher up. */
    row?: number;
}[] = [
    { month: "2023-05", links: [["Aider", "https://aider.chat"]] },
    {
        month: "2024-04",
        links: [
            ["SWE-agent", "https://swe-agent.com"],
            ["sweep.dev", "https://sweep.dev"],
        ],
    },
    { month: "2024-08", links: [["usetusk.ai", "https://usetusk.ai"]] },
    {
        month: "2025-03",
        links: [["Claude Code", "https://claude.com/claude-code"]],
    },
    { month: "2025-04", links: [["Devin", "https://devin.ai"]] },
    { month: "2025-06", links: [["Codex", "https://openai.com/codex"]] },
    { month: "2025-07", links: [["Cursor agents", "https://cursor.com"]] },
    {
        month: "2025-09",
        links: [["Copilot agent", "https://github.com/features/copilot"]],
    },
    {
        month: "2025-10",
        links: [["Claude Code on the web", "https://claude.ai/code"]],
    },
    { month: "2025-11", links: [["Conductor", "https://conductor.build"]] },
    {
        month: "2026-08",
        links: [["Conductor cloud", "https://conductor.build"]],
        anchor: "end",
        row: 3,
    },
];
const ROW_TOP = 36;
const ROW = 14;

const W = 600;
const H = 300;
const M = { top: 28, right: 4, bottom: 26, left: 34 };
const GAP = 2;
const MAX = 600;
const TICKS = [0, 200, 400, 600];

const label = (month: string) =>
    new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    });

/** A top-rounded bar anchored to the baseline. */
function bar(x: number, y: number, w: number, h: number) {
    if (h <= 0) return "";
    const r = Math.min(4, w / 2, h);
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

export function PrVolumeChart({ slug }: { slug: string }) {
    // Colored with the post's own artwork hues, through the same .art ramp, so
    // it matches the thumbnail and gets the dark ramp for free.
    const { h, h2 } = artParams(slug, getArtIndex(slug));
    const plotW = W - M.left - M.right;
    const plotH = H - M.top - M.bottom;
    const step = plotW / MONTHS.length;
    const y = (n: number) => M.top + plotH - (n / MAX) * plotH;
    const peak = MONTHS.reduce((a, b) => (b[1] > a[1] ? b : a));
    const peakX = M.left + MONTHS.indexOf(peak) * step + step / 2;
    const monthX = (month: string) =>
        M.left + MONTHS.findIndex(([m]) => m === month) * step + step / 2;
    const monthY = (month: string) =>
        y(MONTHS.find(([m]) => m === month)?.[1] ?? 0);

    return (
        <figure
            className="art not-prose my-8"
            style={
                {
                    "--art-h": h.toFixed(1),
                    "--art-h2": h2.toFixed(1),
                } as React.CSSProperties
            }
        >
            <svg
                viewBox={`0 0 ${W} ${H}`}
                className="h-auto w-full overflow-visible text-neutral-500 dark:text-neutral-400"
                role="img"
                aria-label={`Bar chart of my merged pull requests per month, from about 14 a month in 2023 and 2024 to ${peak[1]} in ${label(peak[0])}.`}
            >
                <defs>
                    <linearGradient
                        id="pr-volume-fill"
                        gradientUnits="userSpaceOnUse"
                        x1="0"
                        y1={y(0)}
                        x2="0"
                        y2={y(MAX)}
                    >
                        <stop offset="0%" stopColor="var(--art-4)" />
                        <stop offset="100%" stopColor="var(--art-1)" />
                    </linearGradient>
                </defs>
                {TICKS.map((t) => (
                    <g key={t}>
                        <line
                            x1={M.left}
                            x2={W - M.right}
                            y1={y(t)}
                            y2={y(t)}
                            stroke="currentColor"
                            strokeOpacity={t === 0 ? 0.5 : 0.18}
                            strokeWidth={1}
                        />
                        <text
                            x={M.left - 8}
                            y={y(t)}
                            dy="0.32em"
                            textAnchor="end"
                            fontSize={11}
                            fill="currentColor"
                        >
                            {t}
                        </text>
                    </g>
                ))}
                {MONTHS.map(([month, n], i) => {
                    const x = M.left + i * step + GAP / 2;
                    return (
                        <g key={month}>
                            <path
                                d={bar(x, y(n), step - GAP, y(0) - y(n))}
                                fill="url(#pr-volume-fill)"
                            />
                            {/* Full-height hit target, bigger than the bar. */}
                            <rect
                                x={x - GAP / 2}
                                y={M.top}
                                width={step}
                                height={plotH}
                                fill="transparent"
                            >
                                <title>{`${label(month)}: ${n} merged PRs`}</title>
                            </rect>
                            {month.endsWith("-01") || i === 0 ? (
                                <text
                                    x={x}
                                    y={H - 6}
                                    fontSize={11}
                                    fill="currentColor"
                                >
                                    {month.slice(0, 4)}
                                </text>
                            ) : null}
                        </g>
                    );
                })}
                {TOOLS.map(({ month, links, anchor, row }, i) => {
                    const x = monthX(month);
                    const rowY = ROW_TOP + (row ?? i) * ROW;
                    return (
                        <g key={month}>
                            <line
                                x1={x}
                                x2={x}
                                y1={rowY + 3}
                                y2={monthY(month) - 3}
                                stroke="currentColor"
                                strokeOpacity={0.45}
                                strokeWidth={1}
                            />
                            <circle
                                cx={x}
                                cy={monthY(month) - 3}
                                r={2}
                                fill="currentColor"
                            />
                            <text
                                x={anchor === "end" ? x - 4 : x + 4}
                                y={rowY}
                                dy="0.32em"
                                textAnchor={anchor ?? "start"}
                                fontSize={10.5}
                                paintOrder="stroke"
                                strokeWidth={3}
                                className="fill-neutral-700 stroke-white dark:fill-neutral-300 dark:stroke-black"
                            >
                                {links.map(([name, href], j) => (
                                    <Fragment key={name}>
                                        {j > 0 ? ", " : null}
                                        <a
                                            href={href}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="no-underline! hover:underline!"
                                        >
                                            {name}
                                        </a>
                                    </Fragment>
                                ))}
                            </text>
                        </g>
                    );
                })}
                <text
                    x={peakX}
                    y={y(peak[1]) - 8}
                    textAnchor="end"
                    fontSize={12}
                    className="fill-neutral-900 dark:fill-neutral-100"
                >
                    {`${peak[1]} in ${label(peak[0])}`}
                </text>
            </svg>
            <figcaption className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                My merged pull requests per month on my side project, labeled
                with roughly when I started using each coding agent.
            </figcaption>
        </figure>
    );
}
