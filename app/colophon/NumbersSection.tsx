import { WPM, type writingNumbers } from "app/colophon/stats";
import { FOCUS, Label, MONO, Prose, Section, ordinal } from "app/colophon/ui";
import { Art } from "app/components/Art";
import { Link } from "app/components/Link";
import type { Post } from "app/lib/posts";

type Numbers = ReturnType<typeof writingNumbers>;

const n = (v: number) => v.toLocaleString("en-US");

function Disc({ post, size = 16 }: { post: Post; size?: number }) {
    return (
        <span
            aria-hidden
            className="relative block shrink-0 overflow-hidden rounded-full"
            style={{ width: size, height: size }}
        >
            <Art
                slug={post.slug}
                index={post.artIndex}
                idPrefix="length-"
                className="absolute inset-0 h-full w-full"
            />
        </span>
    );
}

/**
 * A thin bar from a square baseline to a rounded end, the value at its tip.
 * The bar's share of the track leaves room for the label at full length.
 */
function Bar({
    value,
    max,
    label,
    strong = false,
}: {
    value: number;
    max: number;
    label: React.ReactNode;
    strong?: boolean;
}) {
    return (
        <span className="flex min-w-0 items-center gap-2">
            <span
                aria-hidden
                className={`block h-2 shrink-0 rounded-r-[4px] ${
                    strong
                        ? "bg-neutral-900 dark:bg-white"
                        : "bg-neutral-300 dark:bg-neutral-700"
                }`}
                style={{
                    width: `calc((100% - 7rem) * ${(value / max).toFixed(4)})`,
                }}
            />
            <span className="shrink-0 whitespace-nowrap text-[12px] tabular-nums text-neutral-900 dark:text-neutral-100">
                {label}
            </span>
        </span>
    );
}

function Figure({
    label,
    value,
    detail,
}: {
    label: string;
    value: string;
    detail?: React.ReactNode;
}) {
    return (
        <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <dt className="text-[12px] text-neutral-500 dark:text-neutral-400">
                {label}
            </dt>
            <dd className="mt-1 text-[24px] font-medium tracking-[-0.02em] text-neutral-900 dark:text-white">
                {value}
            </dd>
            {detail ? (
                <dd className="mt-1 text-[12px] leading-snug text-neutral-500 dark:text-neutral-400">
                    {detail}
                </dd>
            ) : null}
        </div>
    );
}

function YearBars({
    title,
    years,
    pick,
    unit,
}: {
    title: string;
    years: Numbers["years"];
    pick: (y: Numbers["years"][number]) => number;
    unit: string;
}) {
    const max = Math.max(...years.map(pick));
    return (
        <figure>
            <Label as="figcaption">{title}</Label>
            <ul className="mt-3">
                {years.map((y) => (
                    <li
                        key={y.year}
                        className="grid grid-cols-[3rem_minmax(0,1fr)] items-center border-t border-neutral-200 py-2.5 dark:border-neutral-800"
                    >
                        <span
                            className={`${MONO} text-[12px] tabular-nums text-neutral-500 dark:text-neutral-400`}
                        >
                            {y.year}
                        </span>
                        <Bar
                            value={pick(y)}
                            max={max}
                            strong
                            label={`${n(pick(y))} ${pick(y) === 1 ? unit.replace(/s$/, "") : unit}`}
                        />
                    </li>
                ))}
            </ul>
        </figure>
    );
}

export function NumbersSection({
    stats,
    newestFirst,
}: {
    stats: Numbers;
    newestFirst: Post[];
}) {
    const { longest, shortest, median, gap } = stats;
    const tag = (post: Post) =>
        post === longest
            ? "longest"
            : post === shortest
              ? "shortest"
              : post === median.post
                ? "median"
                : null;

    return (
        <Section id="numbers" numeral="V" title="The writing, by numbers">
            <Prose>
                <p>
                    Counted on the prose alone: code blocks, markup and link
                    targets are stripped before anything is counted. Reading
                    time is at {WPM} words a minute.
                </p>
            </Prose>

            <div>
                <p className="text-[56px] font-medium leading-none tracking-[-0.035em] text-neutral-900 md:text-[72px] dark:text-white">
                    {n(stats.words)}
                </p>
                <p className="mt-3 text-[14px] text-neutral-500 dark:text-neutral-400">
                    words across {stats.posts} posts
                </p>
            </div>

            <dl className="grid grid-cols-2 gap-x-8 gap-y-6 lg:grid-cols-4">
                <Figure
                    label="To read all of it"
                    value={`${stats.minutes} min`}
                />
                <Figure
                    label="Median post"
                    value={`${n(median.words)} words`}
                    detail={median.post?.title}
                />
                <Figure
                    label="Longest post"
                    value={`${n(longest.words)} words`}
                    detail={longest.title}
                />
                <Figure
                    label="Shortest post"
                    value={`${n(shortest.words)} words`}
                    detail={shortest.title}
                />
            </dl>

            <figure>
                <Label as="figcaption">Every post by length</Label>
                <ol className="mt-3">
                    {stats.byLength.map((post) => {
                        const t = tag(post);
                        return (
                            <li
                                key={post.slug}
                                className="grid items-center gap-x-6 gap-y-1.5 border-t border-neutral-200 py-2.5 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] dark:border-neutral-800"
                            >
                                <Link
                                    href={post.href}
                                    className={`group flex min-w-0 items-center gap-2.5 ${FOCUS}`}
                                >
                                    <Disc post={post} />
                                    <span className="truncate text-[13px] text-neutral-900 group-hover:underline group-hover:decoration-neutral-300 group-hover:underline-offset-2 dark:text-neutral-100 dark:group-hover:decoration-neutral-600">
                                        {post.title}
                                    </span>
                                </Link>
                                <Bar
                                    value={post.words}
                                    max={longest.words}
                                    strong={t !== null}
                                    label={
                                        <>
                                            {n(post.words)}
                                            {t ? (
                                                <span className="text-neutral-500 dark:text-neutral-400">
                                                    {" "}
                                                    · {t}
                                                </span>
                                            ) : null}
                                        </>
                                    }
                                />
                            </li>
                        );
                    })}
                </ol>
            </figure>

            <div className="grid gap-10 md:grid-cols-2">
                <YearBars
                    title="Posts a year"
                    years={stats.years}
                    pick={(y) => y.posts}
                    unit="posts"
                />
                <YearBars
                    title="Words a year"
                    years={stats.years}
                    pick={(y) => y.words}
                    unit="words"
                />
            </div>

            <div>
                <Label as="h3">The longest quiet</Label>
                <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                    <span className="font-medium text-neutral-900 dark:text-white">
                        {n(gap.days)} days
                    </span>{" "}
                    between{" "}
                    <Link
                        href={gap.from.href}
                        className={`underline-link ${FOCUS}`}
                    >
                        {gap.from.title}
                    </Link>{" "}
                    ({gap.from.date}) and{" "}
                    <Link
                        href={gap.to.href}
                        className={`underline-link ${FOCUS}`}
                    >
                        {gap.to.title}
                    </Link>{" "}
                    ({gap.to.date}).
                </p>
            </div>

            <div>
                <Label as="h3">Each post&rsquo;s most distinctive words</Label>
                <p className="mt-2 max-w-[62ch] text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                    By TF-IDF: the words a post uses often that the rest of the
                    archive rarely does.
                </p>
                <ol className="mt-5 grid gap-x-12 md:grid-cols-2">
                    {newestFirst.map((post) => (
                        <li
                            key={post.slug}
                            className="border-t border-neutral-200 py-3.5 dark:border-neutral-800"
                        >
                            <Link
                                href={post.href}
                                className={`group flex items-baseline gap-3 ${FOCUS}`}
                            >
                                <span
                                    className={`${MONO} w-5 shrink-0 text-[11px] tabular-nums text-neutral-400 dark:text-neutral-500`}
                                >
                                    {ordinal(post.artIndex)}
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-[14px] font-medium leading-snug tracking-[-0.01em] text-neutral-900 group-hover:underline group-hover:decoration-neutral-300 group-hover:underline-offset-2 dark:text-neutral-100 dark:group-hover:decoration-neutral-600">
                                        {post.title}
                                    </span>
                                    <span
                                        className={`${MONO} mt-1 block text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400`}
                                    >
                                        {stats.terms[post.slug].join(" · ")}
                                    </span>
                                </span>
                            </Link>
                        </li>
                    ))}
                </ol>
            </div>
        </Section>
    );
}
