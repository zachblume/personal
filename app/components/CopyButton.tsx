"use client";

import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";
import { useRef, useState } from "react";

/** Copies `text`, then reads "Copied" for a beat. */
export function CopyButton({
    text,
    className = "",
}: {
    text: string;
    className?: string;
}) {
    const [copied, setCopied] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

    return (
        <button
            type="button"
            onClick={() => {
                navigator.clipboard?.writeText(text).catch(() => {});
                setCopied(true);
                clearTimeout(timer.current);
                timer.current = setTimeout(() => setCopied(false), 1400);
            }}
            className={`flex items-center gap-1 text-neutral-400 transition-colors hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white ${className}`}
        >
            {copied ? <CheckIcon /> : <CopyIcon />}
            <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
        </button>
    );
}
