import { Fragment } from "react";
import { Art, artParams } from "app/components/Art";
import { Link } from "app/components/Link";
import { PAD } from "app/components/SiteChrome";
import { diameter } from "app/timeline/geometry";
import type { Mark, PhoneItem, Timeline } from "app/timeline/geometry";

const MONO = "font-[family-name:var(--font-geist-mono)]";
const FOCUS =
    "focus-visible:outline-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-white";

/** Px between the baseline and the lowest mark: room for the date ticks. */
const BASE = 12;
/** Px above the tallest stack, so the top mark's card has somewhere to go. */
const HEADROOM = 56;

const pct = (x: number) => `${(x * 100).toFixed(3)}%`;
const px = (v: number) => `${v.toFixed(1)}px`;

/** One px value per solve width, as --{name}0…3 for the breakpoint classes to pick from. */
function breakpointVars(name: string, values: number[]) {
    return Object.fromEntries(
        values.map((v, i) => [`${name}${i}`, px(v)]),
    ) as React.CSSProperties;
}

/** A post's artwork, cropped to a disc. The surface ring keeps stacked discs apart. */
function Disc({ mark, className = "" }: { mark: Mark; className?: string }) {
    return (
        <span
            className={`relative block shrink-0 overflow-hidden rounded-full ring-2 ring-white dark:ring-black ${className}`}
            style={{ width: mark.d, height: mark.d }}
        >
            <Art
                slug={mark.slug}
                index={mark.artIndex}
                className="absolute inset-0 h-full w-full"
            />
        </span>
    );
}

/** Desktop only: the hover/focus card beside a disc. */
function Card({ mark }: { mark: Mark }) {
    return (
        <span
            aria-hidden
            className={`pointer-events-none absolute top-1/2 z-10 hidden w-64 -translate-y-1/2 rounded-lg border border-neutral-200 bg-white p-3.5 text-left opacity-0 shadow-[0_10px_30px_-16px_rgba(0,0,0,0.25)] group-hover:opacity-100 group-focus-visible:opacity-100 motion-safe:transition-opacity motion-safe:duration-150 md:block dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none ${
                mark.side === "right" ? "left-full ml-4" : "right-full mr-4"
            }`}
        >
            <span
                className={`${MONO} block text-[11px] tabular-nums text-neutral-500 dark:text-neutral-400`}
            >
                {mark.date} · {mark.minutes} min ·{" "}
                {mark.words.toLocaleString("en-US")} words
            </span>
            <span className="mt-1.5 block text-[15px] font-medium leading-snug tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                {mark.title}
            </span>
            {mark.summary ? (
                <span className="mt-1 block text-[13px] leading-snug text-neutral-500 dark:text-neutral-400">
                    {mark.summary}
                </span>
            ) : null}
        </span>
    );
}

function Axis({ t }: { t: Timeline }) {
    return (
        <div aria-hidden className="relative hidden md:block">
            <div className="h-px bg-neutral-300 dark:bg-neutral-700" />
            <div className="relative h-11">
                {t.months.map((m) => (
                    <Fragment key={m.x0}>
                        <span
                            className={`absolute top-0 w-px -translate-x-1/2 ${
                                m.year
                                    ? "h-2.5 bg-neutral-400 dark:bg-neutral-600"
                                    : "h-1.5 bg-neutral-300 dark:bg-neutral-700"
                            }`}
                            style={{ left: pct(m.x0) }}
                        />
                        {m.labelled ? (
                            <span
                                className={`${MONO} absolute top-2 -translate-x-1/2 text-[10px] text-neutral-400 dark:text-neutral-500`}
                                style={{ left: pct((m.x0 + m.x1) / 2) }}
                            >
                                {m.initial}
                            </span>
                        ) : null}
                        {m.year ? (
                            <span
                                className={`${MONO} absolute top-6 pl-1 text-[11px] tabular-nums text-neutral-600 dark:text-neutral-300`}
                                style={{ left: pct(m.x0) }}
                            >
                                {m.year}
                            </span>
                        ) : null}
                    </Fragment>
                ))}
                <span className="absolute right-0 top-0 h-2.5 w-px bg-neutral-900 dark:bg-white" />
                <span
                    className={`${MONO} absolute right-0 top-6 pr-1 text-[11px] text-neutral-900 dark:text-white`}
                >
                    Today
                </span>
            </div>
        </div>
    );
}

/** The column the phone rail runs down, wide enough for the largest disc. */
const RAIL_COL = "w-[76px]";

function Rail({
    from = "top",
    to = "bottom",
    faint = false,
}: {
    from?: "top" | "middle";
    to?: "bottom" | "middle";
    faint?: boolean;
}) {
    return (
        <span
            aria-hidden
            className={`absolute left-[38px] w-px -translate-x-1/2 md:hidden ${
                from === "top" ? "top-0" : "top-1/2"
            } ${to === "bottom" ? "bottom-0" : "bottom-1/2"} ${
                faint
                    ? "bg-neutral-200 dark:bg-neutral-800"
                    : "bg-neutral-300 dark:bg-neutral-700"
            }`}
        />
    );
}

/**
 * One post, laid out twice by CSS from a single set of nodes. On a phone it's
 * a row on the rail: disc, then title and date. From md up it's lifted out of
 * the flow onto the axis — the row's text becomes its accessible name, and
 * the card takes over showing it.
 */
function PostMark({
    mark,
    space,
    last,
}: {
    mark: Mark;
    space: number;
    last: boolean;
}) {
    return (
        <li
            className="relative pt-(--tl-space) md:absolute md:bottom-(--b0) md:left-(--tl-left) md:h-(--tl-d) md:w-(--tl-d) md:pt-0 md:hover:z-20 md:focus-within:z-20 lg:bottom-(--b1) xl:bottom-(--b2) 2xl:bottom-(--b3)"
            style={
                {
                    "--tl-space": `${space}px`,
                    "--tl-left": `calc(${pct(mark.x)} - ${mark.d / 2}px)`,
                    "--tl-d": `${mark.d}px`,
                    ...breakpointVars(
                        "--b",
                        mark.ys.map((y) => BASE + y - mark.d / 2),
                    ),
                } as React.CSSProperties
            }
        >
            <Rail to={last ? "middle" : "bottom"} />
            <Link
                href={mark.href}
                className={`group relative flex items-center gap-3 rounded-md py-2 focus-visible:outline-offset-2 md:block md:h-full md:w-full md:rounded-full md:py-0 md:focus-visible:outline-offset-[3px] ${FOCUS}`}
            >
                {/* A hit target a little larger than the smallest disc. */}
                <span
                    aria-hidden
                    className="absolute -inset-1 hidden rounded-full md:block"
                />
                <span
                    className={`${RAIL_COL} flex shrink-0 justify-center md:block md:w-auto`}
                >
                    <Disc
                        mark={mark}
                        className="md:group-hover:scale-110 motion-safe:transition-transform motion-safe:duration-200"
                    />
                </span>
                <span className="min-w-0 flex-1 md:sr-only">
                    <span className="block text-[15px] font-medium leading-snug tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                        {mark.title}
                    </span>
                    <span
                        className={`${MONO} mt-1 block text-[11px] tabular-nums text-neutral-500 dark:text-neutral-400`}
                    >
                        {mark.date} · {mark.minutes} min
                        <span className="sr-only">
                            {" "}
                            · {mark.words.toLocaleString("en-US")} words
                        </span>
                    </span>
                </span>
                <Card mark={mark} />
            </Link>
        </li>
    );
}

/** The rows only a phone draws. From md up they stay for screen readers. */
function RailItem({ item }: { item: Exclude<PhoneItem, { kind: "post" }> }) {
    if (item.kind === "year") {
        return (
            <li className="relative flex h-11 items-center md:sr-only">
                <Rail />
                <span
                    className={`${RAIL_COL} relative flex shrink-0 justify-center`}
                >
                    <span
                        className={`${MONO} bg-white px-1 py-0.5 text-[11px] tabular-nums text-neutral-900 dark:bg-black dark:text-white`}
                    >
                        {item.year}
                    </span>
                </span>
            </li>
        );
    }
    return (
        <li
            className="relative flex h-(--tl-gap) items-center md:sr-only"
            style={
                {
                    "--tl-gap": `${36 + item.months * 4}px`,
                } as React.CSSProperties
            }
        >
            <Rail faint />
            <span className={`${RAIL_COL} shrink-0`} />
            <span
                className={`${MONO} text-[11px] text-neutral-400 dark:text-neutral-500`}
            >
                {item.label}
            </span>
        </li>
    );
}

/**
 * Every post's disc, drawn once. From md up it's one linear axis, first
 * post's month to today; on a phone the same marks run down a rail, newest
 * first, with long silences folded. One set of art nodes for both is what
 * keeps the page light: each post's art is several kilobytes of SVG, and a
 * copy per layout would also repeat its ids, which `url(#…)` can't tell apart.
 *
 * Both layouts read newest first, so from md up focus walks the axis from
 * today backwards.
 */
export function TimelineChart({ t, today }: { t: Timeline; today: string }) {
    const lastPost = t.phone.findLast((item) => item.kind === "post");

    return (
        <div className="md:px-8">
            <div
                className="relative md:h-(--h0) lg:h-(--h1) xl:h-(--h2) 2xl:h-(--h3)"
                style={breakpointVars(
                    "--h",
                    t.heights.map((h) => h + BASE + HEADROOM),
                )}
            >
                {t.quiet.map((q) => (
                    <div
                        key={q.x0}
                        aria-hidden
                        className="absolute hidden items-center justify-center gap-2 md:flex"
                        style={{
                            left: `calc(${pct(q.x0)} + ${px(q.clearLeft)})`,
                            right: `calc(${pct(1 - q.x1)} + ${px(q.clearRight)})`,
                            bottom: BASE + 2,
                        }}
                    >
                        <span className="h-px min-w-0 flex-1 bg-neutral-200 dark:bg-neutral-800" />
                        <span
                            className={`${MONO} shrink-0 whitespace-nowrap text-[11px] text-neutral-400 dark:text-neutral-500`}
                        >
                            {q.label}
                        </span>
                        <span className="h-px min-w-0 flex-1 bg-neutral-200 dark:bg-neutral-800" />
                    </div>
                ))}

                {/* Each post's exact day, legible under a stack. */}
                {t.marks.map((m) => (
                    <span
                        key={m.slug}
                        aria-hidden
                        className="absolute bottom-0 hidden h-[7px] w-px -translate-x-1/2 bg-neutral-400 md:block dark:bg-neutral-600"
                        style={{ left: pct(m.x) }}
                    />
                ))}

                <ol aria-label="Posts, newest first">
                    <li className="relative flex h-9 items-center md:sr-only">
                        <Rail from="middle" />
                        <span
                            className={`${RAIL_COL} flex shrink-0 justify-center`}
                        >
                            <span className="relative block h-2 w-2 rounded-full bg-neutral-900 ring-2 ring-white dark:bg-white dark:ring-black" />
                        </span>
                        <span
                            className={`${MONO} text-[11px] text-neutral-900 dark:text-white`}
                        >
                            Today · {today}
                        </span>
                    </li>
                    {t.phone.map((item) =>
                        item.kind === "post" ? (
                            <PostMark
                                key={item.key}
                                mark={item.mark}
                                space={item.space}
                                last={item === lastPost}
                            />
                        ) : (
                            <RailItem key={item.key} item={item} />
                        ),
                    )}
                </ol>
            </div>
            <Axis t={t} />
        </div>
    );
}

/** Hollow discs at the same scale as the marks, for reading length off area. */
export function SizeKey() {
    return (
        <div aria-hidden className="flex items-end gap-4">
            {[250, 1000, 2000].map((words) => {
                const d = diameter(words);
                return (
                    <span
                        key={words}
                        className="flex flex-col items-center gap-1.5"
                    >
                        <span
                            className="block rounded-full border border-neutral-300 dark:border-neutral-700"
                            style={{ width: d, height: d }}
                        />
                        <span
                            className={`${MONO} text-[10px] tabular-nums text-neutral-400 dark:text-neutral-500`}
                        >
                            {words.toLocaleString("en-US")}
                        </span>
                    </span>
                );
            })}
            <span
                className={`${MONO} pb-px text-[10px] text-neutral-400 dark:text-neutral-500`}
            >
                words
            </span>
        </div>
    );
}

/** Two pools of color on the duotone ground, like the artwork in miniature. */
const SWATCH =
    "radial-gradient(circle at 32% 34%, var(--art-1), transparent 62%), radial-gradient(circle at 72% 70%, var(--art-4), transparent 58%), linear-gradient(135deg, var(--art-bg), var(--art-bg2))";

/**
 * A post's two hues as a 12px dot. The full artwork is a few kilobytes of SVG
 * per copy and reads as little more than this at that size; the `.art` class
 * resolves the same ramp from the same hues.
 */
function Swatch({ mark }: { mark: Mark }) {
    const { h, h2 } = artParams(mark.slug, mark.artIndex);
    return (
        <span
            className="art block h-3 w-3 rounded-full"
            style={
                {
                    "--art-h": h.toFixed(1),
                    "--art-h2": h2.toFixed(1),
                    background: SWATCH,
                } as React.CSSProperties
            }
        />
    );
}

/** Posts drawn in their own colors; words as a bar with the value at its tip. */
export function YearTally({
    t,
    todayYear,
}: {
    t: Timeline;
    todayYear: string;
}) {
    const maxWords = Math.max(...t.years.map((y) => y.words));
    const first = t.years[0];
    const latest = t.years[t.years.length - 1];
    const partial = [
        t.firstMonth.startsWith("Jan")
            ? null
            : `${first.year} starts in ${t.firstMonth.split(" ")[0]}`,
        latest.year === todayYear ? `${latest.year} runs to today` : null,
    ].filter(Boolean);

    return (
        <section
            aria-labelledby="timeline-by-year"
            className={`${PAD} border-t border-neutral-200 py-10 dark:border-neutral-800`}
        >
            <h2
                id="timeline-by-year"
                className="font-[family-name:var(--font-geist-sans)]! text-[12px] uppercase tracking-wider! text-neutral-400 dark:text-neutral-500"
            >
                By year
            </h2>
            <table className="mt-4 table! w-full! max-w-3xl! border-collapse whitespace-normal! text-left">
                <thead>
                    <tr className="border-b border-neutral-200 text-[11px] uppercase tracking-wider text-neutral-400 dark:border-neutral-800 dark:text-neutral-500">
                        <th scope="col" className="py-2 pr-4 font-normal">
                            Year
                        </th>
                        <th scope="col" className="py-2 pr-4 font-normal">
                            Posts
                        </th>
                        <th scope="col" className="w-1/2 py-2 pr-4 font-normal">
                            Words
                        </th>
                        <th
                            scope="col"
                            className="hidden py-2 text-right font-normal sm:table-cell"
                        >
                            Reading
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {t.years.map((y) => (
                        <tr
                            key={y.year}
                            className="border-b border-neutral-200 dark:border-neutral-800"
                        >
                            <th
                                scope="row"
                                className={`${MONO} py-3 pr-4 text-[13px] font-normal tabular-nums text-neutral-900 dark:text-white`}
                            >
                                {y.year}
                            </th>
                            <td className="py-3 pr-4">
                                <span className="flex items-center gap-3">
                                    <span className="w-4 text-right text-[13px] tabular-nums text-neutral-900 dark:text-neutral-100">
                                        {y.posts.length}
                                    </span>
                                    <span
                                        aria-hidden
                                        className="flex max-w-[84px] flex-wrap gap-1 sm:max-w-none"
                                    >
                                        {y.posts.map((p) => (
                                            <Swatch key={p.slug} mark={p} />
                                        ))}
                                    </span>
                                </span>
                            </td>
                            <td className="py-3 pr-4">
                                <span className="flex items-center gap-2">
                                    <span
                                        aria-hidden
                                        className="block h-2 shrink-0 rounded-r-[4px] bg-neutral-800 dark:bg-neutral-300"
                                        style={{
                                            width: `calc((100% - 3.5rem) * ${(y.words / maxWords).toFixed(4)})`,
                                        }}
                                    />
                                    <span className="text-[13px] tabular-nums text-neutral-900 dark:text-neutral-100">
                                        {y.words.toLocaleString("en-US")}
                                    </span>
                                </span>
                            </td>
                            <td className="hidden py-3 text-right text-[13px] tabular-nums text-neutral-500 sm:table-cell dark:text-neutral-400">
                                {y.minutes} min
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="text-[13px] tabular-nums text-neutral-500 dark:text-neutral-400">
                        <th scope="row" className="py-3 pr-4 font-normal">
                            All
                        </th>
                        <td className="py-3 pr-4">
                            <span className="inline-block w-4 text-right">
                                {t.total.posts}
                            </span>
                        </td>
                        <td className="py-3 pr-4">
                            {t.total.words.toLocaleString("en-US")}
                        </td>
                        <td className="hidden py-3 text-right sm:table-cell">
                            {t.total.minutes} min
                        </td>
                    </tr>
                </tfoot>
            </table>
            <p className="mt-4 max-w-3xl text-[12px] leading-relaxed text-neutral-400 dark:text-neutral-500">
                Words are prose only — code blocks and markup are left out.
                Reading time is at 230 words a minute.
                {partial.length
                    ? ` ${partial.join(", and ")}, so ${
                          partial.length > 1
                              ? "neither end is a whole year"
                              : "one end is a partial year"
                      }.`
                    : null}
            </p>
        </section>
    );
}
