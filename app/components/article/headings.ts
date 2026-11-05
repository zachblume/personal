import { slugify } from "app/lib/slugify";

/** A section heading as the outline and the reading bar list it. */
export type Heading = { level: number; text: string; id: string };

/** Heading markdown → the text it renders as. */
function plain(text: string) {
    return text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/`/g, "");
}

/**
 * The sections worth navigating to: h2 and h3, in plain text, with the ids
 * the MDX headings render with (mdx.tsx slugifies their rendered text, so
 * links and code in a heading don't change its id).
 */
export function articleHeadings(headings: { level: number; text: string }[]) {
    return headings
        .filter((heading) => heading.level === 2 || heading.level === 3)
        .map((heading): Heading => {
            const text = plain(heading.text);
            return { level: heading.level, text, id: slugify(text) };
        });
}
