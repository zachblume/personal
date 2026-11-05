import type { Metadata } from "next";
import { Art } from "app/components/Art";
import { PAD, SiteFooter, SiteHeader } from "app/components/SiteChrome";
import { getPosts } from "app/lib/posts";
import { Constellation, type MapPost } from "./Constellation";
import { buildConstellation, NARROW, WIDE } from "./graph";
import styles from "./constellation.module.css";

export const metadata: Metadata = {
    title: "Constellation",
    description:
        "Every post on one map, linked to the posts it shares the most vocabulary with.",
};

const frame = ({
    width,
    height,
    font,
    lineHeight,
    labelMax,
    maxLines,
    gap,
}: typeof WIDE) => ({
    width,
    height,
    font,
    lineHeight,
    labelMax,
    maxLines,
    gap,
});

export default function ConstellationPage() {
    const posts = getPosts();
    const { nodes, edges } = buildConstellation(posts);
    const bySlug = new Map(posts.map((post) => [post.slug, post]));

    const mapPosts: MapPost[] = nodes.map((node) => {
        const post = bySlug.get(node.slug)!;
        return {
            ...node,
            href: post.href,
            title: post.title,
            summary: post.summary,
            date: post.date,
            minutes: post.minutes,
        };
    });

    // Rendered here and handed down, so Art stays off the client.
    const art = Object.fromEntries(
        posts.map((post) => [
            post.slug,
            <Art
                key={post.slug}
                slug={post.slug}
                index={post.artIndex}
                className="block h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.08] motion-reduce:transition-none"
            />,
        ]),
    );
    const panelArt = Object.fromEntries(
        posts.map((post) => [
            post.slug,
            <Art
                key={post.slug}
                slug={post.slug}
                index={post.artIndex}
                idPrefix="panel-"
                className="block h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none"
            />,
        ]),
    );

    return (
        <div
            className={`full-bleed ${styles.page} min-h-screen w-full bg-white dark:bg-black`}
        >
            <SiteHeader current="constellation" />

            <section
                className={`${PAD} border-b border-neutral-200 py-10 dark:border-neutral-800`}
            >
                <h1 className="font-[family-name:var(--font-editorial)] text-[34px] leading-[1.08] tracking-[-0.025em] text-neutral-900 md:text-[44px] dark:text-white">
                    Constellation
                </h1>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                    The archive as a map: each post sits near the ones it shares
                    the most vocabulary with. Pick one to see what to read next.
                </p>
            </section>

            <section aria-labelledby="constellation-title">
                <div
                    className={`${PAD} flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-neutral-200 py-4 dark:border-neutral-800`}
                >
                    <h2
                        id="constellation-title"
                        className="text-[20px] tracking-[-0.02em] text-neutral-900 dark:text-white"
                    >
                        Every post, by what it shares
                    </h2>
                    <p className="text-[12px] tabular-nums text-neutral-400 dark:text-neutral-500">
                        {posts.length} posts · {edges.length} links
                        <span className="md:hidden"> · Tap a circle</span>
                    </p>
                </div>
                <Constellation
                    posts={mapPosts}
                    edges={edges}
                    art={art}
                    panelArt={panelArt}
                    wide={frame(WIDE)}
                    narrow={frame(NARROW)}
                />
            </section>

            <SiteFooter />
        </div>
    );
}
