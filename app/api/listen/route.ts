import type { NextRequest } from "next/server";
import {
    MAX_CHARS,
    isExcerptOf,
    isListenEnabled,
    synthesize,
    voiceKey,
} from "app/lib/cartesia";
import { getPost } from "app/lib/posts";

/**
 * GET /api/listen?slug=…&text=…&v=…: one sentence of a post as MP3.
 *
 * GET with everything in the query, so Vercel's CDN can cache each clip
 * and a sentence is only ever synthesized once per region. The text has to
 * come from the post itself, so the endpoint can't be used to voice
 * anything else.
 */

const PARAMS = ["slug", "text", "v"];

function fail(status: number, message: string) {
    return new Response(message, {
        status,
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
        },
    });
}

export async function GET(request: NextRequest) {
    if (!isListenEnabled()) return fail(503, "Listening isn't set up.");

    const params = request.nextUrl.searchParams;
    const slug = params.get("slug");
    const text = params.get("text");
    // Every distinct URL is its own cache entry, and a miss costs a
    // synthesis, so extra, repeated or stale parameters are turned away
    // rather than allowed to bust the cache.
    const keys = [...params.keys()];
    if (
        !slug ||
        !text ||
        keys.length !== PARAMS.length ||
        keys.some((key) => !PARAMS.includes(key))
    ) {
        return fail(400, "Expected slug, text and v.");
    }
    if (params.get("v") !== voiceKey()) {
        return fail(400, "Unknown voice; reload the page.");
    }

    const post = getPost(slug);
    if (!post) return fail(404, "No such post.");
    if (text.length > MAX_CHARS) return fail(413, "Too long for one clip.");
    if (!isExcerptOf(text, post.text, post.content)) {
        return fail(403, "That text isn't from this post.");
    }

    try {
        const audio = await synthesize(text.replace(/\s+/g, " ").trim());
        return new Response(audio, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Cache-Control":
                    "public, max-age=31536000, s-maxage=31536000, immutable",
            },
        });
    } catch (error) {
        const reason = error instanceof Error ? error.message : "unknown";
        console.error(`[listen] synthesis failed for ${slug}: ${reason}`);
        return fail(502, "Couldn't make the audio.");
    }
}
