import type { Post } from "app/lib/posts";

/**
 * Server-only. TF-IDF over post prose, for "these two posts are about the
 * same thing" — Read next and the constellation.
 */

const STOPWORDS = new Set(
    `a about above after again against all also am an and any are aren't as at be because been before being
below between both but by can can't cannot could couldn't did didn't do does doesn't doing don't down during
each even ever every few for from further get gets getting got had hadn't has hasn't have haven't having he
her here hers herself him himself his how however i i'd i'll i'm i've if in into is isn't it it's its itself
just know let's like lot lots make makes many may me might more most much must my myself need no nor not now
of off often on once one only or other ought our ours ourselves out over own really right same say says see
she should shouldn't so some something still such than that that's the their theirs them themselves then
there there's these they they'd they'll they're they've thing things think this those though through to too
two under until up upon us use used using very want was wasn't way we we'd we'll we're we've well were weren't
what what's when where which while who whom why will with without won't would wouldn't yes yet you you'd
you'll you're you've your yours yourself yourselves going go goes want wants actually pretty kind sort`.split(
        /\s+/,
    ),
);

export function tokenize(text: string) {
    return (text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? [])
        .map((w) => w.replace(/'s$/, "").replace(/^-+|-+$/g, ""))
        .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

type Vector = Map<string, number>;

export function tfidf(posts: Post[]) {
    const docs = posts.map((p) => tokenize(`${p.title} ${p.title} ${p.text}`));
    const df = new Map<string, number>();
    for (const doc of docs) {
        for (const term of new Set(doc)) df.set(term, (df.get(term) ?? 0) + 1);
    }
    const n = docs.length;
    const vectors: Vector[] = docs.map((doc) => {
        const tf = new Map<string, number>();
        for (const term of doc) tf.set(term, (tf.get(term) ?? 0) + 1);
        const v: Vector = new Map();
        let norm = 0;
        for (const [term, count] of tf) {
            // Terms in every post say nothing about any one of them.
            const idf = Math.log(n / df.get(term)!);
            if (idf <= 0) continue;
            const w = (1 + Math.log(count)) * idf;
            v.set(term, w);
            norm += w * w;
        }
        norm = Math.sqrt(norm) || 1;
        for (const [term, w] of v) v.set(term, w / norm);
        return v;
    });
    return vectors;
}

export function cosine(a: Vector, b: Vector) {
    let dot = 0;
    const [small, large] = a.size < b.size ? [a, b] : [b, a];
    for (const [term, w] of small) dot += w * (large.get(term) ?? 0);
    return dot;
}

/** The terms that contribute most to two posts' similarity. */
export function sharedTerms(a: Vector, b: Vector, limit = 5) {
    const shared: [string, number][] = [];
    for (const [term, w] of a) {
        const other = b.get(term);
        if (other) shared.push([term, w * other]);
    }
    return shared
        .sort((x, y) => y[1] - x[1])
        .slice(0, limit)
        .map(([term]) => term);
}

/** A post's most distinctive terms. */
export function topTerms(v: Vector, limit = 8) {
    return [...v.entries()]
        .sort((x, y) => y[1] - x[1])
        .slice(0, limit)
        .map(([term]) => term);
}

export type Related = {
    slug: string;
    score: number;
    shared: string[];
};

/** For each post, every other post ranked by similarity, most similar first. */
export function relatedPosts(posts: Post[]) {
    const vectors = tfidf(posts);
    const out: Record<string, Related[]> = {};
    posts.forEach((post, i) => {
        out[post.slug] = posts
            .map((other, j) => ({
                slug: other.slug,
                score: i === j ? -1 : cosine(vectors[i], vectors[j]),
                shared: i === j ? [] : sharedTerms(vectors[i], vectors[j]),
            }))
            .filter((r) => r.slug !== post.slug)
            .sort((a, b) => b.score - a.score);
    });
    return { related: out, vectors };
}
