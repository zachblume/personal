import { PaletteHost } from "app/components/command-palette/PaletteHost";
import type { PalettePost } from "app/components/command-palette/shared";
import { getPosts, toClientPost } from "app/lib/posts";

/**
 * The site-wide ⌘K palette, mounted once in the root layout. The index —
 * titles, summaries and headings — is built here and rides along with the
 * layout, so client-side navigation never sends it again.
 */
export function CommandPalette() {
    const posts: PalettePost[] = getPosts().map((post) => {
        const {
            slug,
            href,
            title,
            summary,
            date,
            minutes,
            artIndex,
            headings,
        } = toClientPost(post);
        // Headings with the same text get the same id on the page, so only
        // the first is reachable by its link.
        const seen = new Set<string>();
        return {
            slug,
            href,
            title,
            summary,
            date,
            minutes,
            artIndex,
            headings: headings.filter((heading) => {
                if (seen.has(heading.id)) return false;
                seen.add(heading.id);
                return true;
            }),
        };
    });
    return <PaletteHost posts={posts} />;
}
