/**
 * Server-only. Cartesia text-to-speech for the article player
 * (app/components/listen and app/api/listen).
 *
 * Plain fetch against the REST API rather than the SDK: it's one endpoint
 * and one request shape. Nothing here may ever log or return the key.
 */

const ENDPOINT = "https://api.cartesia.ai/tts/bytes";

/** The newest documented API version (docs.cartesia.ai, checked Nov 2026). */
const VERSION = "2026-08-14";

/**
 * Sonic 3.6, the newest generally available model, pinned to its dated
 * snapshot. The bare `sonic-3.6` alias moves to each new snapshot, and the
 * CDN keeps every clip for a year, so an unpinned model could read one post
 * in two slightly different voices.
 */
const MODEL_ID = "sonic-3.6-2026-08-27";

/**
 * Clyde, "Calm Narrator" (98a34ef2-2140-4c28-9c71-663dc4dd7022): a gentle,
 * measured American male voice that Cartesia's library describes as made
 * for storytelling and informative reads. Set CARTESIA_VOICE_ID to use
 * another, such as a clone of Zach's own voice.
 */
const DEFAULT_VOICE_ID = "98a34ef2-2140-4c28-9c71-663dc4dd7022";

/**
 * Clyde's pace at 1×, for the "n min" estimates: two sample sentences
 * came back at 179 and 186 words a minute.
 */
export const SPOKEN_WPM = 180;

/** The most the route will voice in one request. */
export const MAX_CHARS = 600;

export function isListenEnabled() {
    return Boolean(process.env.CARTESIA_API_KEY);
}

function voiceId() {
    return process.env.CARTESIA_VOICE_ID?.trim() || DEFAULT_VOICE_ID;
}

/**
 * Part of every audio URL. Clips are cached as immutable for a year, so
 * changing the voice or the model has to change every URL too, or the CDN
 * would go on serving the old recordings.
 */
export function voiceKey() {
    return `${MODEL_ID}.${voiceId()}`;
}

/**
 * Letters and digits only, lowercased. What the route compares, so that
 * the same words match whatever happened to the punctuation, whitespace,
 * quotes and markup on the way from MDX to the rendered page.
 */
export function normalizeForMatch(text: string) {
    return text
        .normalize("NFKC")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "");
}

/**
 * Is `text` a run of words from one of `sources`? The route passes a post's
 * plain text and, as a fallback, its raw MDX: the plain text is lossy in
 * places (a heading like "## 1. Setup" loses its "1." to the list-marker
 * rule), and the raw body still holds only the post's own words.
 */
export function isExcerptOf(text: string, ...sources: string[]) {
    const words = normalizeForMatch(text);
    return (
        words.length > 0 &&
        sources.some((source) => normalizeForMatch(source).includes(words))
    );
}

/** MP3 bytes of `transcript` read in the site's voice. */
export async function synthesize(transcript: string) {
    const key = process.env.CARTESIA_API_KEY;
    if (!key) throw new Error("CARTESIA_API_KEY is not set");

    const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${key}`,
            "Cartesia-Version": VERSION,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model_id: MODEL_ID,
            transcript,
            voice: { id: voiceId() },
            language: "en",
            // Speech doesn't need music bitrates; this keeps a sentence
            // around 100 KB.
            output_format: {
                container: "mp3",
                sample_rate: 44100,
                bit_rate: 96000,
            },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
        // Cartesia's error bodies are JSON with a message; they never echo
        // the key, but cap them anyway.
        const detail = (await response.text().catch(() => "")).slice(0, 200);
        throw new Error(`Cartesia ${response.status}: ${detail}`);
    }
    const audio = await response.arrayBuffer();
    if (!audio.byteLength) throw new Error("Cartesia sent no audio");
    return audio;
}
