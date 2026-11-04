import { getPostsOldestFirst } from "app/blog/utils";
import { Art } from "app/components/Art";
import { Link } from "app/components/Link";
import { PAD } from "app/components/SiteChrome";

/** The posts on either side of this one in time, as a pair of art tiles. */
export function PostNeighbours({ slug }: { slug: string }) {
    const posts = getPostsOldestFirst();
    const i = posts.findIndex((post) => post.slug === slug);
    const neighbours = [
        { label: "Previous", index: i - 1 },
        { label: "Next", index: i + 1 },
    ];

    return (
        <nav
            aria-label="More writing"
            className="grid grid-cols-2 border-t border-neutral-200 dark:border-neutral-800"
        >
            {neighbours.map(({ label, index }) => {
                const post = posts[index];
                if (!post) return <div key={label} />;
                return (
                    <Link
                        key={label}
                        href={`/blog/${post.slug}`}
                        className={`${PAD} group flex flex-col gap-4 py-8 transition-colors hover:bg-neutral-50 even:border-l even:border-neutral-200 md:py-10 dark:hover:bg-neutral-900/60 dark:even:border-neutral-800 ${
                            label === "Next" ? "items-end text-right" : ""
                        }`}
                    >
                        <span className="block w-full max-w-sm overflow-hidden rounded-md border border-neutral-200/80 dark:border-neutral-800">
                            <Art
                                slug={post.slug}
                                index={index}
                                className="aspect-[16/9] w-full transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                            />
                        </span>
                        <span className="text-[12px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                            {label}
                        </span>
                        <span className="max-w-sm font-[family-name:var(--font-editorial)] text-[22px] leading-tight tracking-[-0.025em] text-neutral-900 md:text-[26px] dark:text-white">
                            {post.metadata.title}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
