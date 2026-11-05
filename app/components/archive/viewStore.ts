import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

/**
 * Which layout the homepage archive shows. Client-only: the server always
 * renders "list", and the inline SCRIPT corrects the page before first paint.
 */
export const VIEWS = ["list", "grid", "index"] as const;
export type View = (typeof VIEWS)[number];

export const LABELS: Record<View, string> = {
    list: "List",
    grid: "Grid",
    index: "Index",
};

const KEY = "archive-view";
export const ROOT_ID = "archive";

function isView(value: unknown): value is View {
    return VIEWS.includes(value as View);
}

/** The URL wins, so a shared link shows what the sharer saw; then the saved choice. */
function readView(): View {
    try {
        const fromUrl = new URLSearchParams(window.location.search).get("view");
        if (isView(fromUrl)) return fromUrl;
        const saved = window.localStorage.getItem(KEY);
        if (isView(saved)) return saved;
    } catch {
        // Storage can throw when it's blocked; the default is fine.
    }
    return "list";
}

/**
 * readView() as a string, run before first paint. It sets the attribute the
 * stylesheet keys off, so a returning grid reader never sees the list flash
 * first. The store below reads the same sources, so React agrees with it.
 */
export const SCRIPT = `(function(){try{var v=${JSON.stringify(VIEWS)},p=new URLSearchParams(location.search).get("view");if(v.indexOf(p)<0)p=localStorage.getItem(${JSON.stringify(KEY)});if(v.indexOf(p)>=0)document.getElementById(${JSON.stringify(ROOT_ID)}).setAttribute("data-view",p)}catch(e){}})()`;

// The snapshot is cached rather than re-read from the URL on every call: Next
// patches history.replaceState to update its router, and a re-render from that
// mustn't swap the view ahead of the crossfade.
let current: View | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): View {
    current ??= readView();
    return current;
}

function getServerSnapshot(): View {
    return "list";
}

function subscribe(onChange: () => void) {
    // A client-side navigation can arrive with a different ?view=.
    current = readView();
    const resync = () => {
        current = readView();
        onChange();
    };
    listeners.add(onChange);
    window.addEventListener("popstate", resync);
    window.addEventListener("storage", resync);
    return () => {
        listeners.delete(onChange);
        window.removeEventListener("popstate", resync);
        window.removeEventListener("storage", resync);
        if (listeners.size === 0) current = null;
    };
}

export function useView() {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Remember a choice without touching the page. The timeline's links call this
 * on click: during a client-side navigation the first render of `/` can still
 * see the old URL, and the saved choice keeps it from drawing the wrong view.
 */
export function remember(view: View) {
    try {
        window.localStorage.setItem(KEY, view);
    } catch {
        // Not remembered, but the URL still carries it.
    }
}

function publish(view: View) {
    current = view;
    listeners.forEach((listener) => listener());
}

export function choose(view: View) {
    remember(view);
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    window.history.replaceState(null, "", url);

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (typeof document.startViewTransition !== "function" || still) {
        publish(view);
        return;
    }
    // A crossfade between the two layouts. flushSync so the new view is in
    // the DOM by the time the transition takes its second snapshot.
    document.startViewTransition(() => flushSync(() => publish(view)));
}
