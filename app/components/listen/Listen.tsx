import { SPOKEN_WPM, isListenEnabled, voiceKey } from "app/lib/cartesia";
import { getPost } from "app/lib/posts";
import { ListenControls } from "./ListenControls";

/**
 * "Listen · n min" for the date row under a post's title: Cartesia reads
 * the post aloud a sentence at a time, highlighting each as it goes, from a
 * player docked to the bottom of the screen.
 *
 * Renders nothing without CARTESIA_API_KEY. Article pages are prerendered,
 * so adding or removing the key takes a redeploy to show up.
 */
export function Listen({ slug }: { slug: string }) {
    if (!isListenEnabled()) return null;
    const post = getPost(slug);
    if (!post) return null;

    return (
        <ListenControls
            key={post.slug}
            slug={post.slug}
            title={post.title}
            voice={voiceKey()}
            wpm={SPOKEN_WPM}
            minutes={Math.max(1, Math.round(post.words / SPOKEN_WPM))}
        />
    );
}
