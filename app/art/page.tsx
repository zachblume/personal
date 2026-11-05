import { Fragment } from "react";
import { Studio } from "app/art/Studio";
import {
    gridArt,
    presetArt,
    PRESETS,
    previewArt,
    tileArt,
} from "app/art/tiles";
import { COMPOSITIONS } from "app/components/Art";
import { Link } from "app/components/Link";
import { PAD, SiteFooter, SiteHeader } from "app/components/SiteChrome";
import { getPosts } from "app/lib/posts";

export const metadata = {
    title: "Art studio",
    description:
        "Draw this site's generated artwork from any seed and index, and download it as a wallpaper.",
};

export default function ArtPage() {
    // Oldest first, the order the art indexes them in.
    const posts = getPosts()
        .sort((a, b) => a.artIndex - b.artIndex)
        .map((post) => ({
            slug: post.slug,
            title: post.title,
            artIndex: post.artIndex,
            art: tileArt(post.slug, post.artIndex),
        }));

    // Open on the newest post's own artwork, drawn here rather than in
    // Studio so it hydrates (see tiles.tsx).
    const newest = posts[posts.length - 1];
    const seed = newest.slug;
    const index = newest.artIndex;
    const block = index - (index % COMPOSITIONS.length);
    const opening = {
        seed,
        index,
        preview: previewArt(seed, index),
        // Keyed: Flight checks keys on arrays of elements, even as props.
        grid: COMPOSITIONS.map(({ name }, k) => (
            <Fragment key={name}>{gridArt(seed, block + k)}</Fragment>
        )),
        presets: PRESETS.map((preset) => (
            <Fragment key={preset.name}>
                {presetArt(seed, index, preset)}
            </Fragment>
        )),
    };

    return (
        <div className="full-bleed min-h-screen w-full bg-white dark:bg-black">
            <SiteHeader current="art" />

            <div
                className={`${PAD} border-b border-neutral-200 py-10 dark:border-neutral-800`}
            >
                <h1 className="font-[family-name:var(--font-editorial)] text-[34px] leading-[1.08] tracking-[-0.025em] text-neutral-900 md:text-[44px] dark:text-white">
                    Art studio
                </h1>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                    Every post here has artwork drawn in code from two inputs:
                    its slug and its place in the archive. Here you choose both.
                    Type any seed, step through the index, and download what you
                    like as a wallpaper.
                </p>
            </div>

            <Studio posts={posts} opening={opening} />

            <SiteFooter bordered />
        </div>
    );
}
