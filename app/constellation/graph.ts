import type { Post } from "app/lib/posts";
import { relatedPosts, sharedTerms } from "app/lib/similarity";
import { layout, type LayoutSpec, type Side } from "./forceLayout";

/**
 * Server-only. The posts as a graph: TF-IDF similarity for the edges, a
 * readable "why" for each pairing, and two precomputed layouts — landscape
 * for anything wider than a phone, portrait for phones.
 */

export const WIDE: LayoutSpec = {
    width: 1000,
    height: 620,
    // The landscape layout takes over at a 640px-wide map.
    minScale: 0.64,
    radius: [15, 28],
    font: 12,
    lineHeight: 15,
    labelMax: 170,
    maxLines: 3,
    gap: 8,
    margin: 16,
};

export const NARROW: LayoutSpec = {
    width: 360,
    height: 640,
    // A 360px phone, less the map's padding.
    minScale: 0.9,
    radius: [11, 19],
    font: 11,
    lineHeight: 14,
    labelMax: 116,
    maxLines: 2,
    gap: 6,
    margin: 8,
};

/** Below this, two posts share little more than an author's habits. */
const THRESHOLD = 0.03;
/** At or above this a pairing is "about" its shared terms, not just "mentions" them. */
const STRONG = 0.05;

/*
 * With a dozen or so documents TF-IDF can't tell "someone" from "Stripe" — both
 * turn up in two or three posts, so both look distinctive. These are the
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

export type Pairing = {
    slug: string;
    score: number;
    terms: string[];
    /** "Both about tests, expectations and property-based" */
    why: string;
};

export type Spot = { x: number; y: number; d: number; side: Side };

export type GraphNode = {
    slug: string;
    neighbours: string[];
    readNext: Pairing[];
    /** Centre and diameter as percentages of the frame. */
    wide: Spot;
    narrow: Spot;
};

export type GraphEdge = {
    id: string;
    a: string;
    b: string;
    /** 0–1 across the edges drawn. */
    weight: number;
    terms: string[];
    /** Endpoints in each layout's own units, for its viewBox. */
    wide: [number, number, number, number];
    narrow: [number, number, number, number];
};

export function buildConstellation(posts: Post[]) {
    const { related, vectors } = relatedPosts(posts);
    const index = new Map(posts.map((post, i) => [post.slug, i]));

    const pairing = (from: Post, slug: string, score: number) => {
        // Same order both ways round, so a pair always gives the same reason.
        const [i, j] = [index.get(from.slug)!, index.get(slug)!].sort(
            (a, b) => a - b,
        );
        // The strongest shared terms, one per stem — written the way the
        // posts more often write it ("tests" over "test").
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
        return { slug, score, terms, why: `${verb} ${list(terms)}` };
    };

    const readNext = new Map(
        posts.map((post) => [
            post.slug,
            related[post.slug]
                .slice(0, 3)
                .map((r) => pairing(post, r.slug, r.score)),
        ]),
    );

    // Each post's two nearest, if they clear the bar; one line per pair.
    const pairs = new Map<string, Pairing & { a: string }>();
    for (const post of posts) {
        for (const r of related[post.slug].slice(0, 2)) {
            if (r.score < THRESHOLD) continue;
            const [a, b] = [post.slug, r.slug].sort();
            const id = `${a}~${b}`;
            if (!pairs.has(id)) {
                pairs.set(id, {
                    ...pairing(post, r.slug, r.score),
                    a,
                    slug: b,
                });
            }
        }
    }
    const scores = [...pairs.values()].map((p) => p.score);
    const lo = Math.min(...scores);
    const hi = Math.max(...scores);
    const weight = (score: number) => (score - lo) / (hi - lo || 1);

    const words = posts.map((post) => post.words);
    const fewest = Math.min(...words);
    const most = Math.max(...words);
    const input = {
        // Square root, so the one long post doesn't dwarf the rest.
        sizes: words.map((w) => Math.sqrt((w - fewest) / (most - fewest || 1))),
        labels: posts.map((post) => post.title),
        edges: [...pairs.values()].map((p) => ({
            a: index.get(p.a)!,
            b: index.get(p.slug)!,
            strength: weight(p.score),
        })),
    };
    const wide = layout(input, WIDE);
    const narrow = layout(input, NARROW);

    const round = (n: number) => Math.round(n * 100) / 100;
    const percent = (spec: LayoutSpec, p: (typeof wide)[number]) => ({
        x: round((p.x / spec.width) * 100),
        y: round((p.y / spec.height) * 100),
        d: round(((p.r * 2) / spec.width) * 100),
        side: p.side,
    });

    const nodes: GraphNode[] = posts.map((post, i) => ({
        slug: post.slug,
        neighbours: [...pairs.values()]
            .filter((p) => p.a === post.slug || p.slug === post.slug)
            .map((p) => (p.a === post.slug ? p.slug : p.a)),
        readNext: readNext.get(post.slug)!,
        wide: percent(WIDE, wide[i]),
        narrow: percent(NARROW, narrow[i]),
    }));

    const ends = (
        placements: typeof wide,
        a: number,
        b: number,
    ): [number, number, number, number] => [
        round(placements[a].x),
        round(placements[a].y),
        round(placements[b].x),
        round(placements[b].y),
    ];
    const edges: GraphEdge[] = [...pairs.entries()].map(([id, p]) => {
        const a = index.get(p.a)!;
        const b = index.get(p.slug)!;
        return {
            id,
            a: p.a,
            b: p.slug,
            weight: weight(p.score),
            terms: p.terms,
            wide: ends(wide, a, b),
            narrow: ends(narrow, a, b),
        };
    });

    return { nodes, edges };
}
