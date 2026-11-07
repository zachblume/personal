"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Link } from "app/components/Link";
import { PAD } from "app/components/SiteChrome";

type Post = { slug: string; title: string; year: string };

/**
 * "You've read n of m": the archive as a strip with your reads filled in, and
 * the newest post you haven't opened. Reads the visits that components/Link
 * and LocalStorageLinkSyncer record, so it renders nothing for a first visit.
 */
export function ReadingHistory({ posts }: { posts: Post[] }) {
    const pathname = usePathname();
    const [read, setRead] = useState<string[]>([]);

    useEffect(() => {
        // The syncer records the current page in an effect that may run after
        // this one, so count the page you're on directly.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRead(
            posts
                .map((post) => post.slug)
                .filter(
                    (slug) =>
                        pathname === `/blog/${slug}` ||
                        !!window.localStorage.getItem(`/blog/${slug}`),
                ),
        );
    }, [posts, pathname]);

    if (read.length === 0) return null;

    const oldestFirst = [...posts].reverse();
    const next = posts.find((post) => !read.includes(post.slug));

    return (
        <section
            aria-label="Reading history"
            className={`${PAD} border-b border-neutral-200 py-8 dark:border-neutral-800`}
        >
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <p className="font-[family-name:var(--font-editorial)] text-[22px] leading-tight tracking-[-0.025em] text-neutral-900 dark:text-white">
                    You&rsquo;ve read {read.length} of {posts.length}.
                </p>
                {next && (
                    <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
                        Up next:{" "}
                        <Link
                            href={`/blog/${next.slug}`}
                            className="rounded-sm text-neutral-900 underline decoration-neutral-300 underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:text-white dark:decoration-neutral-700 dark:focus-visible:outline-white"
                        >
                            {next.title}
                        </Link>
                    </p>
                )}
            </div>
            <div className="mt-4 flex gap-1">
                {oldestFirst.map((post) => (
                    <Link
                        key={post.slug}
                        href={`/blog/${post.slug}`}
                        title={post.title}
                        className={`h-2 flex-1 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-white ${
                            read.includes(post.slug)
                                ? "bg-neutral-900 dark:bg-white"
                                : "bg-neutral-200 hover:bg-neutral-400 dark:bg-neutral-800 dark:hover:bg-neutral-600"
                        }`}
                    >
                        <span className="sr-only">{post.title}</span>
                    </Link>
                ))}
            </div>
            <div className="mt-2 flex justify-between text-[11px] tabular-nums text-neutral-400 dark:text-neutral-500">
                <span>{oldestFirst[0].year}</span>
                <span>{posts[0].year}</span>
            </div>
        </section>
    );
}
