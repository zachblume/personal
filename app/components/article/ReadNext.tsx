import { readNext } from "app/components/article/related";
import { Art } from "app/components/Art";
import { Link } from "app/components/Link";
import { PAD } from "app/components/SiteChrome";
import type { Post } from "app/lib/posts";

/**
 * The end of an article: the three posts closest to it by what they talk
 * about rather than by date, each with the words they share.
 */
export function ReadNext({ posts, slug }: { posts: Post[]; slug: string }) {
    const items = readNext(posts, slug);
    if (items.length === 0) return null;

    return (
        <section aria-labelledby="read-next-title">
            <h2
                id="read-next-title"
                className={`${PAD} border-t border-neutral-200 py-6 font-semibold dark:border-neutral-800`}
            >
                Read next
            </h2>
            <nav
                aria-labelledby="read-next-title"
                className="grid border-t border-neutral-200 md:grid-cols-3 dark:border-neutral-800"
            >
                {items.map(({ post, why }, i) => (
                    <Link
                        key={post.slug}
                        href={post.href}
                        className={`${PAD} group flex items-start gap-5 border-neutral-200 py-6 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-neutral-900 md:flex-col md:gap-4 md:px-6 md:py-10 lg:px-10 dark:border-neutral-800 dark:hover:bg-neutral-900/60 dark:focus-visible:outline-white ${
                            i > 0 ? "border-t md:border-l md:border-t-0" : ""
                        }`}
                    >
                        <span className="block w-24 shrink-0 overflow-hidden rounded-md border border-neutral-200/80 md:w-full md:max-w-sm dark:border-neutral-800">
                            <Art
                                slug={post.slug}
                                index={post.artIndex}
                                idPrefix="read-next-"
                                className="aspect-[16/9] w-full transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none"
                            />
                        </span>
                        <span className="flex min-w-0 flex-col gap-2 md:gap-3">
                            <span className="text-[12px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                                {post.date}
                            </span>
                            <span className="max-w-sm font-[family-name:var(--font-editorial)] text-[20px] leading-tight tracking-[-0.025em] text-neutral-900 md:text-[22px] lg:text-[26px] dark:text-white">
                                {post.title}
                            </span>
                            {why ? (
                                <span className="max-w-sm text-[13px] leading-snug text-neutral-500 md:text-[14px] dark:text-neutral-400">
                                    {why}
                                </span>
                            ) : null}
                        </span>
                    </Link>
                ))}
            </nav>
        </section>
    );
}
