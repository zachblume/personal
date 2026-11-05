import { segmentArticle, segmentAtPoint, type Segment } from "./segment";

export const RATES = [0.8, 1, 1.2, 1.4, 1.6, 2];

/** How many clips past the current one to have on hand. */
const PREFETCH = 2;

const RATE_KEY = "listen:rate";

export type PlayerState = {
    open: boolean;
    /** Meant to be playing, including while the clip is still on its way. */
    playing: boolean;
    /** Playing, but the current clip hasn't arrived yet. */
    waiting: boolean;
    /** Reached the end; play starts over. */
    ended: boolean;
    index: number;
    count: number;
    rate: number;
    minutesLeft: number;
    error: string | null;
};

const CLOSED: PlayerState = {
    open: false,
    playing: false,
    waiting: false,
    ended: false,
    index: 0,
    count: 0,
    rate: 1,
    minutesLeft: 0,
    error: null,
};

export type PlayerConfig = {
    slug: string;
    title: string;
    /** voiceKey() from app/lib/cartesia, passed through to the route. */
    voice: string;
    /** Spoken words per minute at 1×, for the time left. */
    wpm: number;
};

type Clip = {
    url: Promise<string>;
    controller: AbortController;
    /** Set once the blob URL exists, so a ready clip starts without a wait. */
    ready?: string;
};

function read(key: string) {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

function write(key: string, value: string) {
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // Private mode or storage disabled: the choice just won't stick.
    }
}

/**
 * Reads an article aloud one chunk at a time through a single audio
 * element, as an external store for useSyncExternalStore.
 *
 * Each chunk is its own request to /api/listen, so the CDN caches sentences
 * rather than whole posts, a jump costs one short clip, and the highlight
 * moves exactly when the audio does. Clips are fetched as blobs, not handed
 * to the element as URLs: that surfaces the route's status codes, and
 * sidesteps Safari wanting range requests for media.
 */
export class Player {
    segments: Segment[] = [];
    private config: PlayerConfig;
    private state = CLOSED;
    private listeners = new Set<() => void>();
    private audio: HTMLAudioElement | null = null;
    private clips = new Map<number, Clip>();
    /** Which segment the audio element holds, so resume continues
     *  mid-sentence instead of starting it over. */
    private loaded = -1;
    /** Bumped whenever playback is redirected, so a clip that arrives late
     *  for a sentence nobody wants any more doesn't start playing. */
    private token = 0;

    constructor(config: PlayerConfig) {
        this.config = config;
    }

    subscribe = (listener: () => void) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };

    getSnapshot = () => this.state;
    getServerSnapshot = () => CLOSED;

    private set(patch: Partial<PlayerState>) {
        const next = { ...this.state, ...patch };
        let words = 0;
        for (let i = next.index; i < this.segments.length; i++) {
            words += this.segments[i].words;
        }
        next.minutesLeft = next.ended
            ? 0
            : Math.max(1, Math.round(words / (this.config.wpm * next.rate)));
        this.state = next;
        if ("mediaSession" in navigator) {
            navigator.mediaSession.playbackState = !next.open
                ? "none"
                : next.playing
                  ? "playing"
                  : "paused";
        }
        this.listeners.forEach((listener) => listener());
    }

    private element() {
        if (this.audio) return this.audio;
        const audio = new Audio();
        audio.preload = "auto";
        audio.addEventListener("ended", () => {
            if (this.state.playing && this.loaded === this.state.index) {
                this.play(this.state.index + 1);
            }
        });
        // Paused by something else: headphones pulled out, another tab's
        // media, the OS. Not ours: our pauses update the state first, a
        // source swap has already called play() again by the time the event
        // lands, and the element also fires `pause` on its way to `ended`.
        audio.addEventListener("pause", () => {
            if (
                audio.paused &&
                !audio.ended &&
                this.state.playing &&
                !this.state.waiting
            ) {
                this.set({ playing: false });
            }
        });
        audio.addEventListener("error", () => {
            if (this.state.playing && audio.getAttribute("src")) this.fail();
        });
        // iOS only lets a media element start inside a tap, and the first
        // clip arrives after an await, outside it. load() during the tap
        // unlocks this element for every play() after.
        audio.load();
        this.audio = audio;
        return audio;
    }

    /** Open the player on an article and start reading where it left off. */
    open(root: HTMLElement) {
        if (!this.segments.length) {
            this.segments = segmentArticle(
                root,
                document.documentElement.lang || "en",
            );
        }
        if (!this.segments.length) return;
        this.element();
        const rate = Number(read(RATE_KEY));
        this.set({
            open: true,
            count: this.segments.length,
            rate: RATES.includes(rate) ? rate : 1,
            error: null,
        });
        this.mediaSession(true);
        this.play(this.state.ended ? 0 : this.state.index);
    }

    private clip(index: number) {
        const existing = this.clips.get(index);
        if (existing) return existing;
        const controller = new AbortController();
        const params = new URLSearchParams({
            slug: this.config.slug,
            text: this.segments[index].text,
            v: this.config.voice,
        });
        const clip: Clip = {
            controller,
            url: fetch(`/api/listen?${params}`, { signal: controller.signal })
                .then((response) => {
                    if (!response.ok) throw new Error(String(response.status));
                    return response.blob();
                })
                .then((blob) => {
                    clip.ready = URL.createObjectURL(blob);
                    return clip.ready;
                }),
        };
        // A prefetch nobody is waiting on yet mustn't surface as an
        // unhandled rejection; play() sees the failure when it gets there.
        clip.url.catch(() => {});
        this.clips.set(index, clip);
        return clip;
    }

    private drop(index: number) {
        const clip = this.clips.get(index);
        if (!clip) return;
        clip.controller.abort();
        if (clip.ready) URL.revokeObjectURL(clip.ready);
        this.clips.delete(index);
    }

    play(index: number) {
        const audio = this.element();
        const token = ++this.token;
        const segment = this.segments[index];
        if (!segment) {
            audio.pause();
            this.loaded = -1;
            this.set({ playing: false, waiting: false, ended: true, index: 0 });
            return;
        }

        // Whatever was playing stops now, not when the next clip arrives.
        audio.pause();
        const clip = this.clip(index);
        for (let i = index + 1; i <= index + PREFETCH; i++) {
            if (i < this.segments.length) this.clip(i);
        }
        // Keep the one before for a quick "previous"; let the rest go.
        for (const i of [...this.clips.keys()]) {
            if (i < index - 1 || i > index + PREFETCH) this.drop(i);
        }

        this.set({
            index,
            playing: true,
            waiting: !clip.ready,
            ended: false,
            error: null,
        });
        clip.url
            .then((url) => {
                if (token !== this.token) return;
                audio.src = url;
                this.loaded = index;
                // A new source resets the rate to the default one.
                audio.defaultPlaybackRate = this.state.rate;
                audio.playbackRate = this.state.rate;
                return audio.play().then(() => {
                    if (token === this.token) this.set({ waiting: false });
                });
            })
            .catch((error: unknown) => {
                if (token !== this.token) return;
                const name = error instanceof Error ? error.name : "";
                // The browser wants a tap first: wait for one, quietly.
                if (name === "NotAllowedError") {
                    this.set({ playing: false, waiting: false });
                } else if (name !== "AbortError") {
                    this.fail();
                }
            });
    }

    /**
     * Stop and say so. One attempt per clip: the failed one is forgotten,
     * so pressing play again tries it once more, and nothing retries on
     * its own.
     */
    private fail() {
        this.token++;
        this.drop(this.state.index);
        this.loaded = -1;
        this.audio?.pause();
        this.set({
            playing: false,
            waiting: false,
            error: "Couldn’t load the audio. Press play to try again.",
        });
    }

    pause() {
        this.token++;
        this.audio?.pause();
        if (this.state.playing) this.set({ playing: false, waiting: false });
    }

    resume() {
        if (this.state.playing) return;
        if (this.state.ended) return this.play(0);
        const audio = this.audio;
        if (!audio || this.loaded !== this.state.index || audio.ended) {
            return this.play(this.state.index);
        }
        const token = ++this.token;
        this.set({ playing: true, error: null });
        audio.play().catch(() => {
            if (token === this.token) this.set({ playing: false });
        });
    }

    toggle() {
        if (this.state.playing) this.pause();
        else this.resume();
    }

    step(delta: number) {
        // From "finished", back steps to the last sentence.
        const from = this.state.ended ? this.segments.length : this.state.index;
        const index = Math.min(
            Math.max(from + delta, 0),
            Math.max(this.segments.length - 1, 0),
        );
        if (this.state.playing) this.play(index);
        else this.set({ index, ended: false, error: null });
    }

    jumpTo(x: number, y: number, target: Element) {
        const index = segmentAtPoint(this.segments, x, y, target);
        if (index >= 0) this.play(index);
    }

    hoverAt(x: number, y: number, target: Element) {
        const index = segmentAtPoint(this.segments, x, y, target);
        return index >= 0 ? this.segments[index] : null;
    }

    setRate(rate: number) {
        write(RATE_KEY, String(rate));
        this.set({ rate });
        if (this.audio) {
            this.audio.defaultPlaybackRate = rate;
            this.audio.playbackRate = rate;
        }
    }

    /** Lock-screen and headset controls. */
    private mediaSession(on: boolean) {
        if (!("mediaSession" in navigator)) return;
        const session = navigator.mediaSession;
        session.metadata = on
            ? new MediaMetadata({
                  title: this.config.title,
                  artist: "Zach Blume",
                  album: "zachblume.com",
                  artwork: [
                      {
                          src: `/blog/${this.config.slug}/opengraph-image`,
                          sizes: "1200x630",
                          type: "image/png",
                      },
                  ],
              })
            : null;
        const handlers: [MediaSessionAction, () => void][] = [
            ["play", () => this.resume()],
            ["pause", () => this.pause()],
            ["previoustrack", () => this.step(-1)],
            ["nexttrack", () => this.step(1)],
        ];
        for (const [action, handler] of handlers) {
            try {
                session.setActionHandler(action, on ? handler : null);
            } catch {
                // Not every browser knows every action.
            }
        }
    }

    close() {
        this.pause();
        for (const i of [...this.clips.keys()]) this.drop(i);
        this.loaded = -1;
        // Releases the decoder and the last clip.
        this.audio?.removeAttribute("src");
        this.audio?.load();
        this.mediaSession(false);
        if (this.state.open) this.set({ open: false });
    }
}
