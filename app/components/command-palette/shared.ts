import type { ClientPost } from "app/lib/posts";

/**
 * What the palette knows about a post. Built on the server in
 * CommandPalette.tsx and serialized into every page, so it carries only what
 * the palette shows or searches.
 */
export type PalettePost = Pick<
    ClientPost,
    | "slug"
    | "href"
    | "title"
    | "summary"
    | "date"
    | "minutes"
    | "artIndex"
    | "headings"
>;

const OPEN_EVENT = "command-palette:open";

/**
 * Asks the palette to open. A window event rather than shared state, so the
 * header's trigger doesn't need to sit inside the palette's tree.
 * `returnFocus` is where focus goes when it closes: Safari doesn't focus a
 * clicked button, so the trigger has to name itself.
 */
export function requestPalette(returnFocus: HTMLElement | null) {
    window.dispatchEvent(
        new CustomEvent<HTMLElement | null>(OPEN_EVENT, {
            detail: returnFocus,
        }),
    );
}

export function onPaletteRequest(
    listener: (returnFocus: HTMLElement | null) => void,
) {
    const handle = (event: Event) =>
        listener((event as CustomEvent<HTMLElement | null>).detail);
    window.addEventListener(OPEN_EVENT, handle);
    return () => window.removeEventListener(OPEN_EVENT, handle);
}

/**
 * The dialog's code, and the one place it's imported. An `import()` written
 * inside `dynamic()` is compiled as a separate entry with its own chunk, so a
 * preload through any other `import()` would fetch a copy nothing uses.
 */
export function loadPalette() {
    return import("app/components/command-palette/Palette");
}

/** Starts fetching the dialog's code ahead of the first open. Idempotent. */
export function preloadPalette() {
    loadPalette().catch(() => {
        // Offline, say. Opening will try again.
    });
}

/** ⌘K or Ctrl+K, on every platform. */
export function isPaletteShortcut(event: KeyboardEvent) {
    return (
        (event.key ?? "").toLowerCase() === "k" &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey
    );
}
