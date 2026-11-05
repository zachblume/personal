import type { Post } from "app/lib/posts";
import { pairReason, relatedPosts } from "app/lib/similarity";

/**
 * Server-only. The posts closest to one post by what they talk about, each
 * with a readable reason: "Both about tests, expectations and journeys".
 */
export function readNext(posts: Post[], slug: string, limit = 3) {
    const { related, vectors } = relatedPosts(posts);
    const index = new Map(posts.map((post, i) => [post.slug, i]));
    const from = index.get(slug);
    if (from === undefined) return [];

    return (related[slug] ?? [])
        .slice(0, limit)
        .map(({ slug: other, score }) => {
            const to = index.get(other)!;
            return {
                post: posts[to],
                why: pairReason(posts, vectors, from, to, score).why,
            };
        });
}
