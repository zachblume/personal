"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * The `#` beside a post heading. Following it still jumps to the heading;
 * it also copies the full link and says so.
 *
 * The toast is portalled to <body> rather than rendered in the heading:
 * OutlineNavLink matches headings by their textContent, and a toast inside
 * one would stop it matching while it shows.
 */
export function HeadingAnchor({ slug }: { slug: string }) {
    const [copied, setCopied] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

    return (
        <>
            <a
                href={`#${slug}`}
                aria-label="Copy link to this section"
                className="anchor"
                onClick={() => {
                    const url = new URL(`#${slug}`, window.location.href);
                    navigator.clipboard?.writeText(url.href).catch(() => {});
                    setCopied(true);
                    clearTimeout(timer.current);
                    timer.current = setTimeout(() => setCopied(false), 1600);
                }}
            />
            {copied
                ? createPortal(
                      <div
                          role="status"
                          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-neutral-900 px-3.5 py-1.5 text-[13px] text-white shadow-lg dark:bg-white dark:text-black"
                      >
                          Link copied
                      </div>,
                      document.body,
                  )
                : null}
        </>
    );
}
