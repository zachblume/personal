"use client";

import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useSyncExternalStore } from "react";
import {
    preloadPalette,
    requestPalette,
} from "app/components/command-palette/shared";

const subscribeNever = () => () => {};

/** ⌘ on Apple keyboards, Ctrl elsewhere. The server guesses ⌘. */
function useShortcutLabel() {
    return useSyncExternalStore(
        subscribeNever,
        () =>
            /Mac|iPhone|iPad|iPod/.test(navigator.userAgent) ? "⌘K" : "Ctrl K",
        () => "⌘K",
    );
}

/** The header's way into the palette. Icon-only on phones, where ⌘K means nothing. */
export function PaletteTrigger() {
    const shortcut = useShortcutLabel();
    return (
        <button
            type="button"
            onClick={(event) => requestPalette(event.currentTarget)}
            // Intent: fetch the dialog's code before the click lands.
            onPointerEnter={preloadPalette}
            onFocus={preloadPalette}
            aria-haspopup="dialog"
            aria-label="Search"
            aria-keyshortcuts="Meta+K Control+K"
            className="-mr-2 flex h-9 min-w-9 shrink-0 items-center justify-center gap-2 rounded-md px-2 text-neutral-500 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-neutral-900 dark:text-neutral-400 dark:hover:text-white dark:focus-visible:outline-white"
        >
            <MagnifyingGlassIcon aria-hidden className="shrink-0" />
            <kbd className="hidden h-5 min-w-5 items-center justify-center rounded border border-neutral-200 px-1.5 font-[family-name:var(--font-geist-mono)] text-[11px] font-normal text-neutral-500 sm:inline-flex dark:border-neutral-800 dark:text-neutral-400">
                {shortcut}
            </kbd>
        </button>
    );
}
