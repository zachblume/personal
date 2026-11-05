import { Fragment } from "react";
import { COMPOSITIONS } from "app/components/Art";
import { Studio } from "app/components/art-studio/Studio";
import {
    gridArt,
    presetArt,
    PRESETS,
    previewArt,
    tileArt,
} from "app/components/art-studio/tiles";
import { getPosts } from "app/lib/posts";

/**
 * The art studio, for a post to embed as `<ArtStudio />`. A server component:
 * it draws the opening frame and the hue walk here so they hydrate (see
 * tiles.tsx), and hands them to the client Studio.
 */
export function ArtStudio() {
    // Oldest first, the order the art indexes them in. The walk's tiles get
    // their own ids: the archive list under the post draws the same art.
    const posts = getPosts()
        .sort((a, b) => a.artIndex - b.artIndex)
        .map((post) => ({
            slug: post.slug,
            title: post.title,
            artIndex: post.artIndex,
            art: tileArt(post.slug, post.artIndex, "walk-"),
        }));

    // Open on the newest post's own artwork.
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

    return <Studio posts={posts} opening={opening} />;
}
