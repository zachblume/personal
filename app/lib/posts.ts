import { getBlogPosts } from "app/blog/utils";
import { slugify } from "app/lib/slugify";

/**
 * Server-only. Every published post with the derived fields several pages
 * keep needing, computed once: plain text, word count, reading time,
 * headings, and the chronological art index.
 */
export type Post = {
    slug: string;
    href: string;
    title: string;
    summary: string;
    /** YYYY-MM-DD */
    publishedAt: string;
    /** "Oct 29, 2026" */
    date: string;
    year: string;
    /** Chronological rank, oldest = 0 — what <Art index> takes. */
    artIndex: number;
    /** Raw MDX body, frontmatter removed. Pass to <CustomMDX source>. */
    content: string;
    /** Prose only: code, markup and link targets stripped. */
    text: string;
    words: number;
    /** At 230 wpm, minimum 1. */
    minutes: number;
    headings: { level: number; text: string; id: string }[];
};

const WPM = 230;

export function shortDate(publishedAt: string) {
    return new Date(`${publishedAt}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

/** MDX → readable prose. Good enough for counting, indexing and speaking. */
export function toPlainText(mdx: string) {
    return mdx
        .replace(/```[\s\S]*?```/g, " ") // fenced code
        .replace(/<[^>]+>/g, " ") // JSX / HTML tags
        .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → their text
        .replace(/`([^`]*)`/g, "$1") // inline code → its text
        .replace(/^#{1,6}\s+/gm, "") // heading markers
        .replace(/^\s*>\s?/gm, "") // blockquote markers
        .replace(/^\s*([-*+]|\d+\.)\s+/gm, "") // list markers
        .replace(/(\*\*|__|\*|_|~~)(?=\S)([\s\S]*?\S)\1/g, "$2") // emphasis
        .replace(/^\s*[-*_]{3,}\s*$/gm, " ") // rules
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function headingsOf(mdx: string) {
    return mdx
        .replace(/```[\s\S]*?```/g, "")
        .split("\n")
        .filter((line) => /^#{1,6}\s/.test(line))
        .map((line) => {
            const level = line.match(/^#+/)![0].length;
            const text = line.replace(/^#+\s*/, "").trim();
            return { level, text, id: slugify(text) };
        });
}

/** Newest first, like the homepage. */
export function getPosts(): Post[] {
    const oldestFirst = getBlogPosts().sort((a, b) =>
        a.metadata.publishedAt < b.metadata.publishedAt ? -1 : 1,
    );
    return oldestFirst
        .map((post, artIndex) => {
            const text = toPlainText(post.content);
            const words = text.split(/\s+/).filter(Boolean).length;
            return {
                slug: post.slug,
                href: `/blog/${post.slug}`,
                title: post.metadata.title,
                summary: post.metadata.summary || "",
                publishedAt: post.metadata.publishedAt,
                date: shortDate(post.metadata.publishedAt),
                year: post.metadata.publishedAt.slice(0, 4),
                artIndex,
                content: post.content,
                text,
                words,
                minutes: Math.max(1, Math.round(words / WPM)),
                headings: headingsOf(post.content),
            };
        })
        .reverse();
}

/**
 * The fields that are safe and cheap to hand to a client component —
 * everything except the raw MDX and the full text.
 */
export function toClientPost(post: Post) {
    return {
        slug: post.slug,
        href: post.href,
        title: post.title,
        summary: post.summary,
        publishedAt: post.publishedAt,
        date: post.date,
        year: post.year,
        artIndex: post.artIndex,
        words: post.words,
        minutes: post.minutes,
        headings: post.headings,
    };
}

export type ClientPost = ReturnType<typeof toClientPost>;
