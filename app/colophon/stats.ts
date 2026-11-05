import type { Post } from "app/lib/posts";
import { tfidf, topTerms } from "app/lib/similarity";

/** Server-only. The numbers on the writing, from the same prose the site counts. */

const DAY = 86_400_000;
/** The reading speed app/lib/posts.ts uses for each post's minutes. */
export const WPM = 230;

function dayOf(iso: string) {
    const [y, m, d] = iso.split("-").map(Number);
    return Date.UTC(y, m - 1, d) / DAY;
}

export function writingNumbers(posts: Post[]) {
    const oldestFirst = [...posts].sort((a, b) =>
        a.publishedAt < b.publishedAt ? -1 : 1,
    );
    const words = posts.reduce((sum, p) => sum + p.words, 0);

    const byLength = [...posts].sort((a, b) => b.words - a.words);
    const mid = Math.floor(byLength.length / 2);
    const median =
        byLength.length % 2
            ? { words: byLength[mid].words, post: byLength[mid] }
            : {
                  words: Math.round(
                      (byLength[mid - 1].words + byLength[mid].words) / 2,
                  ),
                  post: undefined,
              };

    const years: { year: string; posts: number; words: number }[] = [];
    for (const post of oldestFirst) {
        let year = years.find((y) => y.year === post.year);
        if (!year) {
            year = { year: post.year, posts: 0, words: 0 };
            years.push(year);
        }
        year.posts++;
        year.words += post.words;
    }

    let gap = { days: 0, from: oldestFirst[0], to: oldestFirst[0] };
    for (let i = 1; i < oldestFirst.length; i++) {
        const days =
            dayOf(oldestFirst[i].publishedAt) -
            dayOf(oldestFirst[i - 1].publishedAt);
        if (days > gap.days) {
            gap = { days, from: oldestFirst[i - 1], to: oldestFirst[i] };
        }
    }

    const vectors = tfidf(posts);
    const terms = Object.fromEntries(
        posts.map((post, i) => [post.slug, topTerms(vectors[i], 6)]),
    );

    return {
        posts: posts.length,
        words,
        minutes: Math.round(words / WPM),
        byLength,
        median,
        longest: byLength[0],
        shortest: byLength[byLength.length - 1],
        years,
        gap,
        terms,
    };
}
