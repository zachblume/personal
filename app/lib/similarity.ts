import type { Post } from "app/lib/posts";

/**
 * Server-only. TF-IDF over post prose, for "these two posts are about the
 * same thing" — the Read next list under each article.
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

/** At or above this a pairing is "about" its shared terms, not just "mentions" them. */
const STRONG = 0.05;

/*
 * With a dozen or so documents TF-IDF can't tell "someone" from "Stripe" —
 * both turn up in two or three posts, so both look distinctive. These are the
 * words it kept surfacing as reasons two posts belong together.
 */
const FILLER = new Set(
    `able across already always anyways approach around ask away based becomes better big bit break build built
bunch call called change changes come comes coming couple current definitely different differently done either
else end enough entirely era everyone everything existing experience far fast faster feel figured find finish
first found four full future generally give good great guess handle harder head heavy idea imagine instead
interesting job keep kept learn learned least length less let life line little live long look looks machine making
manually maybe mean means minutes months name new nice number ones part passing past path people per person
picture possible probably produce put putting quite read real reason regardless run running said sense side
set simple since slow solution someone sometimes somewhere start started starting starts state step straightforward
strong
surprised surprising telling terrible thinking thoughts time together took towards trying turned turns
understand understanding uses usually value variety viable video wait ways weird went whatever whether work
working write writing written year years`.split(/\s+/),
);

const stem = (term: string) => term.replace(/(ing|es|s|ed)$/, "");

/**
 * How a term is written across two posts, ignoring sentence starts: "stripe"
 * comes back as "Stripe", "dbt" stays "dbt", and a word that's capitalised
 * only now and then stays lower-case. `uses` is how often it appears.
 */
function written(term: string, texts: string[]) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
    const pattern = new RegExp(`(^|[^A-Za-z'-])(${escaped})(?![A-Za-z])`, "gi");
    const forms = new Map<string, number>();
    let uses = 0;
    let midSentence = 0;
    for (const text of texts) {
        for (const match of text.matchAll(pattern)) {
            uses++;
            const before = text.slice(0, match.index + match[1].length);
            if (/(^|[.!?:]\s+|\n\s*)$/.test(before)) continue;
            midSentence++;
            if (match[2] !== term) {
                forms.set(match[2], (forms.get(match[2]) ?? 0) + 1);
            }
        }
    }
    let form = term;
    let most = 0;
    for (const [candidate, count] of forms) {
        if (count > most) {
            form = candidate;
            most = count;
        }
    }
    const capitalised = [...forms.values()].reduce((a, b) => a + b, 0);
    return { form: capitalised >= midSentence * 0.75 ? form : term, uses };
}

function list(terms: string[]) {
    if (terms.length <= 1) return terms.join("");
    return `${terms.slice(0, -1).join(", ")} and ${terms[terms.length - 1]}`;
}

/**
 * Why two posts belong together, as a readable line: "Both about tests,
 * expectations and journeys". `vectors` come from tfidf()/relatedPosts() over
 * the same `posts`; i and j index into both, and `score` is their cosine.
 */
export function pairReason(
    posts: Post[],
    vectors: Vector[],
    a: number,
    b: number,
    score: number,
) {
    // Same order both ways round, so a pair always gives the same reason.
    const [i, j] = [a, b].sort((x, y) => x - y);
    // The strongest shared terms, one per stem — written the way the posts
    // more often write it ("tests" over "test").
    const picked = new Map<string, { form: string; uses: number }>();
    for (const term of sharedTerms(vectors[i], vectors[j], Infinity)) {
        if (FILLER.has(term)) continue;
        const seen = picked.get(stem(term));
        if (!seen && picked.size === 3) continue;
        const w = written(term, [posts[i].text, posts[j].text]);
        if (!seen || w.uses > seen.uses) picked.set(stem(term), w);
    }
    const terms = [...picked.values()].map((w) => w.form);
    const verb =
        score >= STRONG && terms.length > 1 ? "Both about" : "Both mention";
    return { terms, why: terms.length ? `${verb} ${list(terms)}` : "" };
}
