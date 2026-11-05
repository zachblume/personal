"use client";

import dynamic from "next/dynamic";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
    isPaletteShortcut,
    loadPalette,
    onPaletteRequest,
    preloadPalette,
    type PalettePost,
} from "app/components/command-palette/shared";

// The dialog — search, icons, artwork — is nearly all of the palette's code,
// and nobody needs it until they ask, so it loads on first open. What every
// page carries is this listener.
const Palette = dynamic(() => loadPalette().then((mod) => mod.Palette), {
    ssr: false,
});

/**
 * ⌘K / Ctrl+K toggles the palette from anywhere; the header's trigger asks
 * for it with requestPalette(). The toast lives here rather than in the
 * dialog because "Copied" has to outlast the dialog it came from.
 */
export function PaletteHost({ posts }: { posts: PalettePost[] }) {
    const [open, setOpen] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const returnFocus = useRef<HTMLElement | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    const show = (from: HTMLElement | null) => {
        returnFocus.current =
            from ??
            (document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null);
        setOpen(true);
    };

    const close = (restoreFocus: boolean) => {
        setOpen(false);
        if (restoreFocus) returnFocus.current?.focus();
    };

    const notify = (message: string) => {
        setToast(message);
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 2600);
    };

    const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
        // A held modifier is the likeliest prelude to ⌘K: start the download.
        if (event.key === "Meta" || event.key === "Control") {
            preloadPalette();
            return;
        }
        if (!isPaletteShortcut(event)) return;
        event.preventDefault();
        if (event.repeat) return;
        if (open) close(true);
        else show(null);
    });

    const onRequest = useEffectEvent((from: HTMLElement | null) => {
        if (!open) show(from);
    });

    useEffect(() => {
        const listener = (event: KeyboardEvent) => onKeyDown(event);
        window.addEventListener("keydown", listener);
        const stopRequests = onPaletteRequest((from) => onRequest(from));
        return () => {
            window.removeEventListener("keydown", listener);
            stopRequests();
        };
    }, []);

    return (
        <>
            {open ? (
                <Palette posts={posts} onClose={close} notify={notify} />
            ) : null}
            <div
                role="status"
                className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
            >
                {toast ? (
                    <span className="rounded-full bg-neutral-900 px-4 py-2 font-[family-name:var(--font-geist-mono)] text-[12px] text-white shadow-lg dark:bg-white dark:text-black">
                        {toast}
                    </span>
                ) : null}
            </div>
        </>
    );
}
