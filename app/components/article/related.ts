import type { Post } from "app/lib/posts";
import { relatedPosts, sharedTerms } from "app/lib/similarity";

/**
 * Server-only. The posts closest to one post by what they talk about, each
 * with a readable reason: "Both about tests, expectations and journeys".
 */

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

export function readNext(posts: Post[], slug: string, limit = 3) {
    const { related, vectors } = relatedPosts(posts);
    const index = new Map(posts.map((post, i) => [post.slug, i]));
    const from = index.get(slug);
    if (from === undefined) return [];

    return (related[slug] ?? [])
        .slice(0, limit)
        .map(({ slug: other, score }) => {
            // Same order both ways round, so a pair always gives the same reason.
            const [i, j] = [from, index.get(other)!].sort((a, b) => a - b);
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
                score >= STRONG && terms.length > 1
                    ? "Both about"
                    : "Both mention";
            return {
                post: posts[index.get(other)!],
                why: terms.length ? `${verb} ${list(terms)}` : "",
            };
        });
}
