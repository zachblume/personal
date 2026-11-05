import { Art } from "app/components/Art";
import { Link } from "app/components/Link";
import { PAD } from "app/components/SiteChrome";
import type { Post } from "app/lib/posts";

const MONO = "font-[family-name:var(--font-geist-mono)]";

/**
 * Art first. Every cell draws its right and bottom rule; the list is a pixel
 * wider than its clipping parent, so the last column's right rule falls
 * outside and only the rules between cells show. A short last row just ends,
 * rather than leaving grey gap-filler the way a `gap-px` grid would.
 *
 * The list view draws the same art, so this copy takes its own SVG ids.
 */
export function GridView({ posts }: { posts: Post[] }) {
    return (
        <div className="overflow-hidden">
            <ul className="-mr-px grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {posts.map((post) => (
                    <li
                        key={post.slug}
                        className="border-r border-b border-neutral-200 dark:border-neutral-800"
                    >
                        <Link
                            href={post.href}
                            className="group flex h-full flex-col gap-5 p-6 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-neutral-900 md:p-8 dark:hover:bg-neutral-900/60 dark:focus-visible:outline-white"
                        >
                            <span className="block overflow-hidden rounded-md border border-neutral-200/80 dark:border-neutral-800">
                                <Art
                                    slug={post.slug}
                                    index={post.artIndex}
                                    idPrefix="grid-"
                                    className="aspect-[16/9] w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                                />
                            </span>
                            <span className="flex flex-1 flex-col gap-3">
                                <span className="font-[family-name:var(--font-editorial)] text-[22px] leading-[1.15] tracking-[-0.025em] text-balance text-neutral-900 dark:text-white">
                                    {post.title}
                                </span>
                                <span
                                    className={`${MONO} mt-auto text-[12px] tabular-nums text-neutral-400 dark:text-neutral-500`}
                                >
                                    <time dateTime={post.publishedAt}>
                                        {post.date}
                                    </time>{" "}
                                    · {post.minutes} min
                                </span>
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function monthDay(publishedAt: string) {
    return new Date(`${publishedAt}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

/**
 * The index at the back of a book: no art, a large numeral per year, and a
 * dotted leader from each title to its length.
 */
export function IndexView({ posts }: { posts: Post[] }) {
    const years: { year: string; posts: Post[] }[] = [];
    for (const post of posts) {
        const last = years[years.length - 1];
        if (last?.year === post.year) last.posts.push(post);
        else years.push({ year: post.year, posts: [post] });
    }

    return (
        <div>
            {years.map((group, i) => (
                <section
                    key={group.year}
                    aria-labelledby={`index-${group.year}`}
                    className={`${PAD} grid gap-x-12 gap-y-6 py-10 md:grid-cols-[11rem_minmax(0,1fr)] md:py-14 lg:grid-cols-[14rem_minmax(0,1fr)] ${
                        i > 0
                            ? "border-t border-neutral-200 dark:border-neutral-800"
                            : ""
                    }`}
                >
                    <div className="flex items-baseline gap-4 md:sticky md:top-8 md:block md:self-start">
                        <h2
                            id={`index-${group.year}`}
                            className="text-[56px] leading-[0.9] text-neutral-900 md:text-[88px] dark:text-white"
                        >
                            {/* The heading rule in global.css fixes h2 tracking;
                                a child sets its own. */}
                            <span className="tracking-[-0.045em] tabular-nums">
                                {group.year}
                            </span>
                        </h2>
                        <p
                            className={`${MONO} text-[12px] text-neutral-400 md:mt-3 dark:text-neutral-500`}
                        >
                            {group.posts.length}{" "}
                            {group.posts.length === 1 ? "post" : "posts"}
                        </p>
                    </div>

                    <ol className="max-w-2xl md:pt-2">
                        {group.posts.map((post) => (
                            <li key={post.slug}>
                                <Link
                                    href={post.href}
                                    className="group flex items-baseline-last gap-x-3 rounded-sm py-2 text-[15px] leading-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 md:text-[16px] dark:focus-visible:outline-white"
                                >
                                    {/* Pinned to the first line when a title
                                        wraps; the leader and the length
                                        follow its last line, as in print. */}
                                    <time
                                        dateTime={post.publishedAt}
                                        className={`${MONO} w-14 shrink-0 self-start text-[12px] leading-6 tabular-nums text-neutral-400 dark:text-neutral-500`}
                                    >
                                        {monthDay(post.publishedAt)}
                                    </time>
                                    <span className="min-w-0 text-neutral-900 decoration-neutral-300 underline-offset-4 group-hover:underline dark:text-neutral-100 dark:decoration-neutral-600">
                                        {post.title}
                                    </span>
                                    <span
                                        aria-hidden
                                        className="relative -top-1 min-w-6 flex-1 border-b border-dotted border-neutral-300 group-hover:border-neutral-500 dark:border-neutral-700"
                                    />
                                    <span
                                        className={`${MONO} shrink-0 text-[12px] tabular-nums text-neutral-500 dark:text-neutral-400`}
                                    >
                                        {post.minutes} min
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ol>
                </section>
            ))}
        </div>
    );
}
