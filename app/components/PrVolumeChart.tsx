import { getArtIndex } from "app/blog/utils";
import { artHues } from "app/components/Art";

/**
 * Pull requests I opened per month on my side project, from GitHub search
 * (`is:pr author:zachblume created:<month>`). Starts at my first PR there and
 * stops at the last full month.
 */
const MONTHS: [string, number][] = [
    ["2023-03", 16],
    ["2023-04", 23],
    ["2023-05", 14],
    ["2023-06", 42],
    ["2023-07", 16],
    ["2023-08", 2],
    ["2023-09", 17],
    ["2023-10", 28],
    ["2023-11", 21],
    ["2023-12", 21],
    ["2024-01", 17],
    ["2024-02", 12],
    ["2024-03", 27],
    ["2024-04", 27],
    ["2024-05", 26],
    ["2024-06", 8],
    ["2024-07", 16],
    ["2024-08", 6],
    ["2024-09", 1],
    ["2024-10", 0],
    ["2024-11", 7],
    ["2024-12", 0],
    ["2025-01", 1],
    ["2025-02", 14],
    ["2025-03", 12],
    ["2025-04", 26],
    ["2025-05", 9],
    ["2025-06", 24],
    ["2025-07", 32],
    ["2025-08", 20],
    ["2025-09", 49],
    ["2025-10", 48],
    ["2025-11", 159],
    ["2025-12", 101],
    ["2026-01", 199],
    ["2026-02", 259],
    ["2026-03", 55],
    ["2026-04", 59],
    ["2026-05", 309],
    ["2026-06", 200],
    ["2026-07", 184],
    ["2026-08", 239],
    ["2026-09", 245],
    ["2026-10", 631],
];

const W = 600;
const H = 300;
const M = { top: 28, right: 4, bottom: 26, left: 34 };
const GAP = 2;
const MAX = 700;
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
    const { h, h2 } = artHues(slug, getArtIndex(slug));
    const plotW = W - M.left - M.right;
    const plotH = H - M.top - M.bottom;
    const step = plotW / MONTHS.length;
    const y = (n: number) => M.top + plotH - (n / MAX) * plotH;
    const peak = MONTHS.reduce((a, b) => (b[1] > a[1] ? b : a));
    const peakX = M.left + MONTHS.indexOf(peak) * step + step / 2;

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
                aria-label={`Bar chart of pull requests I opened per month, from about 20 a month in 2023 and 2024 to ${peak[1]} in ${label(peak[0])}.`}
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
                                <title>{`${label(month)}: ${n} PRs`}</title>
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
                Pull requests I opened per month on my side project.
            </figcaption>
            <details className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                <summary className="cursor-pointer">Data</summary>
                <table className="mt-2">
                    <tbody>
                        {MONTHS.map(([month, n]) => (
                            <tr key={month}>
                                <td className="pr-6">{label(month)}</td>
                                <td className="text-right tabular-nums">{n}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </details>
        </figure>
    );
}
