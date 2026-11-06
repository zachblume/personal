import { getArtIndex } from "app/blog/utils";
import { artParams } from "app/components/Art";

/**
 * Non-blank lines of JavaScript, TypeScript and Python on `main` of my side
 * project, counted from the git history: one snapshot a month, then twice a
 * month through 2026, plus the day this was written. Lockfiles, JSON, SQL,
 * CSV and docs aren't counted.
 */
const SNAPSHOTS: [string, number][] = [
    ["2023-01-01", 1966],
    ["2023-02-01", 1966],
    ["2023-03-01", 3890],
    ["2023-04-01", 5630],
    ["2023-05-01", 6956],
    ["2023-06-01", 7726],
    ["2023-07-01", 10471],
    ["2023-08-01", 17467],
    ["2023-09-01", 18143],
    ["2023-10-01", 19733],
    ["2023-11-01", 22542],
    ["2023-12-01", 26739],
    ["2024-01-01", 30629],
    ["2024-02-01", 32520],
    ["2024-03-01", 33721],
    ["2024-04-01", 34891],
    ["2024-05-01", 35760],
    ["2024-06-01", 37203],
    ["2024-07-01", 41622],
    ["2024-08-01", 42629],
    ["2024-09-01", 47915],
    ["2024-10-01", 49078],
    ["2024-11-01", 49172],
    ["2024-12-01", 49342],
    ["2025-01-01", 49731],
    ["2025-02-01", 49775],
    ["2025-03-01", 50155],
    ["2025-04-01", 60791],
    ["2025-05-01", 94079],
    ["2025-06-01", 96351],
    ["2025-07-01", 98384],
    ["2025-08-01", 100618],
    ["2025-09-01", 104237],
    ["2025-10-01", 115087],
    ["2025-11-01", 136653],
    ["2025-12-01", 154107],
    ["2026-01-01", 171784],
    ["2026-01-15", 190227],
    ["2026-02-01", 216922],
    ["2026-02-15", 233307],
    ["2026-03-01", 256209],
    ["2026-03-15", 268002],
    ["2026-04-01", 274119],
    ["2026-04-15", 281973],
    ["2026-05-01", 291491],
    ["2026-05-15", 321811],
    ["2026-06-01", 402626],
    ["2026-06-15", 453332],
    ["2026-07-01", 504612],
    ["2026-07-15", 534474],
    ["2026-08-01", 577225],
    ["2026-08-15", 643727],
    ["2026-09-01", 681583],
    ["2026-09-15", 725952],
    ["2026-10-01", 864909],
    ["2026-10-15", 1006444],
    ["2026-11-01", 1198285],
    ["2026-11-06", 1414672],
];

const W = 600;
const H = 260;
const M = { top: 24, right: 8, bottom: 26, left: 40 };
const MAX = 1_500_000;
const TICKS = [0, 500_000, 1_000_000, 1_500_000];
const START = Date.parse("2023-01-01");
const END = Date.parse("2026-11-06");

const tick = (n: number) =>
    n === 0 ? "0" : n >= 1e6 ? `${n / 1e6}M` : `${n / 1e3}k`;
const day = (d: string) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    });

export function LocChart({ slug }: { slug: string }) {
    // Same artwork hues as the PR chart, so the two read as a pair.
    const { h, h2 } = artParams(slug, getArtIndex(slug));
    const plotW = W - M.left - M.right;
    const plotH = H - M.top - M.bottom;
    const x = (d: string) =>
        M.left + ((Date.parse(d) - START) / (END - START)) * plotW;
    const y = (n: number) => M.top + plotH - (n / MAX) * plotH;
    const points = SNAPSHOTS.map(([d, n]) => `${x(d)},${y(n)}`);
    const line = `M${points.join("L")}`;
    const area = `${line}L${x(SNAPSHOTS.at(-1)![0])},${y(0)}L${x(SNAPSHOTS[0][0])},${y(0)}Z`;
    const [lastDay, last] = SNAPSHOTS.at(-1)!;

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
                aria-label={`Area chart of lines of code on my side project, from under 50,000 for most of 2023 to 2025 to ${last.toLocaleString("en-US")} on ${day(lastDay)}.`}
            >
                <defs>
                    <linearGradient
                        id="loc-stroke"
                        gradientUnits="userSpaceOnUse"
                        x1="0"
                        y1={y(0)}
                        x2="0"
                        y2={y(MAX)}
                    >
                        <stop offset="0%" stopColor="var(--art-4)" />
                        <stop offset="100%" stopColor="var(--art-1)" />
                    </linearGradient>
                    <linearGradient
                        id="loc-fill"
                        gradientUnits="userSpaceOnUse"
                        x1="0"
                        y1={y(0)}
                        x2="0"
                        y2={y(MAX)}
                    >
                        <stop
                            offset="0%"
                            stopColor="var(--art-4)"
                            stopOpacity={0.08}
                        />
                        <stop
                            offset="100%"
                            stopColor="var(--art-1)"
                            stopOpacity={0.3}
                        />
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
                            {tick(t)}
                        </text>
                    </g>
                ))}
                {["2023", "2024", "2025", "2026"].map((yr) => (
                    <text
                        key={yr}
                        x={x(`${yr}-01-01`)}
                        y={H - 6}
                        fontSize={11}
                        fill="currentColor"
                    >
                        {yr}
                    </text>
                ))}
                <path d={area} fill="url(#loc-fill)" />
                <path
                    d={line}
                    fill="none"
                    stroke="url(#loc-stroke)"
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
                <circle
                    cx={x(lastDay)}
                    cy={y(last)}
                    r={4}
                    fill="var(--art-1)"
                    className="stroke-white dark:stroke-black"
                    strokeWidth={2}
                />
                <text
                    x={x(lastDay) - 8}
                    y={y(last)}
                    dy="0.32em"
                    textAnchor="end"
                    fontSize={12}
                    className="fill-neutral-900 dark:fill-neutral-100"
                >
                    {last.toLocaleString("en-US")}
                </text>
                {/* Hover targets: one column per snapshot, wider than the line. */}
                {SNAPSHOTS.map(([d, n], i) => {
                    const prev = i > 0 ? x(SNAPSHOTS[i - 1][0]) : M.left;
                    const next =
                        i < SNAPSHOTS.length - 1
                            ? x(SNAPSHOTS[i + 1][0])
                            : W - M.right;
                    const left = (prev + x(d)) / 2;
                    return (
                        <rect
                            key={d}
                            x={left}
                            y={M.top}
                            width={(x(d) + next) / 2 - left}
                            height={plotH}
                            fill="transparent"
                        >
                            <title>{`${day(d)}: ${n.toLocaleString("en-US")} lines`}</title>
                        </rect>
                    );
                })}
            </svg>
            <figcaption className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                Lines of code on my side project&apos;s main branch (non-blank
                JavaScript, TypeScript and Python).
            </figcaption>
        </figure>
    );
}
