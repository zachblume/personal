import type { Metadata } from "next";
import { Art } from "app/components/Art";
import { Chevron } from "app/components/icons";
import { Link } from "app/components/Link";
import { PAD, SiteFooter, SiteHeader } from "app/components/SiteChrome";
import { getPosts, type Post } from "app/lib/posts";
import { PathReading } from "./PathReading";
import { ONLY_ONE, PATHS, welcome } from "./paths";
import styles from "./start-here.module.css";

export const metadata: Metadata = {
    title: "Start here",
    description:
        "Short reading paths through the archive by theme, with your progress through each.",
};

const NUMBERS =
    "Zero One Two Three Four Five Six Seven Eight Nine Ten Eleven Twelve Thirteen Fourteen Fifteen Sixteen Seventeen Eighteen Nineteen Twenty".split(
        " ",
    );

/**
 * A path's posts as a fanned stack of their artwork, first post in front.
 * Spreads a little further on hover.
 */
function ArtStack({ posts }: { posts: Post[] }) {
    const steps = Math.max(posts.length - 1, 1);
    return (
        <div className="relative aspect-[16/10] w-full" aria-hidden>
            {posts.map((post, i) => (
                <span
                    key={post.slug}
                    className="absolute block w-[64%] overflow-hidden rounded-md border border-neutral-200/80 shadow-[0_0_0_4px_#fff] transition-transform duration-500 ease-out motion-safe:group-hover/path:translate-x-[var(--spread)] dark:border-neutral-800 dark:shadow-[0_0_0_4px_#000]"
                    style={
                        {
                            left: `${(i / steps) * 36}%`,
                            top: `${(i / steps) * 42}%`,
                            zIndex: posts.length - i,
                            "--spread": `${i * 6}px`,
                        } as React.CSSProperties
                    }
                >
                    <Art
                        slug={post.slug}
                        index={post.artIndex}
                        className="aspect-[16/9] w-full"
                    />
                </span>
            ))}
        </div>
    );
}

export default function StartHere() {
    const posts = getPosts();
    const bySlug = new Map(posts.map((post) => [post.slug, post]));
    const paths = PATHS.map((path) => ({
        ...path,
        posts: path.posts.flatMap(({ slug, adds }) => {
            const post = bySlug.get(slug);
            return post ? [{ post, adds }] : [];
        }),
    })).filter((path) => path.posts.length > 0);
    // Counted from the paths, not the archive, so the welcome stays true
    // when a new post is out but not yet on a path.
    const onPaths = new Set(
        paths.flatMap((path) => path.posts.map(({ post }) => post.slug)),
    ).size;
    // The pick's line describes one post, so it goes if that post does.
    const pick = bySlug.get(ONLY_ONE.slug);

    return (
        <div
            className={`full-bleed ${styles.page} min-h-screen w-full bg-white dark:bg-black`}
        >
            <SiteHeader current="start-here" />

            <section
                aria-labelledby="start-title"
                className={`${PAD} grid gap-12 border-b border-neutral-200 py-12 md:py-16 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-20 dark:border-neutral-800`}
            >
                <div>
                    <h1
                        id="start-title"
                        className="text-[12px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500"
                    >
                        Start here
                    </h1>
                    <p
                        id="start-welcome"
                        className="mt-5 max-w-2xl font-[family-name:var(--font-editorial)] text-[28px] leading-[1.15] tracking-[-0.025em] text-neutral-900 md:text-[36px] dark:text-white"
                    >
                        {welcome(
                            NUMBERS[onPaths] ?? String(onPaths),
                            NUMBERS[paths.length]?.toLowerCase() ??
                                String(paths.length),
                        )}
                    </p>
                    <nav aria-label="Reading paths" className="mt-10">
                        <ol className="grid border-t border-neutral-200 sm:grid-cols-2 dark:border-neutral-800">
                            {paths.map((path, i) => (
                                <li
                                    key={path.id}
                                    className="border-b border-neutral-200 sm:odd:border-r sm:odd:pr-6 sm:even:pl-6 dark:border-neutral-800"
                                >
                                    <a
                                        href={`#${path.id}`}
                                        className="group flex items-center gap-4 py-4"
                                    >
                                        <span className="font-[family-name:var(--font-geist-mono)] text-[12px] tabular-nums text-neutral-300 dark:text-neutral-700">
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-[15px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-white">
                                                {path.name}
                                            </span>
                                            <span className="block text-[12px] text-neutral-400 dark:text-neutral-500">
                                                {path.posts.length} posts
                                            </span>
                                        </span>
                                        <svg
                                            viewBox="0 0 14 14"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth={1.25}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="h-3.5 w-3.5 shrink-0 text-neutral-300 transition-all duration-300 ease-out group-hover:translate-y-0.5 group-hover:text-neutral-900 dark:text-neutral-700 dark:group-hover:text-white"
                                            aria-hidden
                                        >
                                            <path d="m2.75 5.25 4.25 4.25 4.25-4.25" />
                                        </svg>
                                    </a>
                                </li>
                            ))}
                        </ol>
                    </nav>
                </div>

                {pick ? (
                    <aside aria-labelledby="start-only-one">
                        <h2
                            id="start-only-one"
                            className="text-[20px] tracking-[-0.02em] text-neutral-900 dark:text-white"
                        >
                            If you only read one
                        </h2>
                        <Link
                            href={pick.href}
                            className="group mt-5 block rounded-md"
                        >
                            <span className="block overflow-hidden rounded-md border border-neutral-200/80 dark:border-neutral-800">
                                {/* Also drawn in its path's stack below. */}
                                <Art
                                    slug={pick.slug}
                                    index={pick.artIndex}
                                    idPrefix="pick-"
                                    className="aspect-[16/9] w-full transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
                                />
                            </span>
                            <span className="mt-5 block font-[family-name:var(--font-editorial)] text-[24px] leading-tight tracking-[-0.025em] text-neutral-900 md:text-[28px] dark:text-white">
                                {pick.title}
                            </span>
                            <span className="mt-2 block text-[14px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                                {ONLY_ONE.why}
                            </span>
                            <span className="mt-3 flex items-center gap-2 text-[12px] tabular-nums text-neutral-400 dark:text-neutral-500">
                                {pick.date} · {pick.minutes} min read
                                <Chevron />
                            </span>
                        </Link>
                    </aside>
                ) : null}
            </section>

            {paths.map((path, i) => {
                const next = paths[i + 1];
                return (
                    <section
                        key={path.id}
                        id={path.id}
                        aria-labelledby={`${path.id}-title`}
                        className={`${PAD} group/path grid scroll-mt-6 gap-8 border-b border-neutral-200 py-12 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-12 md:py-16 lg:gap-20 dark:border-neutral-800`}
                    >
                        <div className="md:pt-2">
                            <div className="max-w-md">
                                <ArtStack
                                    posts={path.posts.map(({ post }) => post)}
                                />
                            </div>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[12px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                                Path {String(i + 1).padStart(2, "0")}
                            </p>
                            <h2
                                id={`${path.id}-title`}
                                className="mt-3 text-[30px] leading-[1.1] tracking-[-0.025em] text-neutral-900 md:text-[36px] dark:text-white"
                            >
                                {path.name}
                            </h2>
                            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                                {path.framing}
                            </p>
                            <PathReading
                                posts={path.posts.map(({ post, adds }) => ({
                                    href: post.href,
                                    title: post.title,
                                    adds,
                                    minutes: post.minutes,
                                }))}
                                next={
                                    next
                                        ? {
                                              href: `#${next.id}`,
                                              label: `Next path: ${next.name}`,
                                          }
                                        : {
                                              href: "#start-welcome",
                                              label: "Back to the paths",
                                          }
                                }
                            />
                        </div>
                    </section>
                );
            })}

            <SiteFooter />
        </div>
    );
}
