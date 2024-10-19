"use client";
import { useEffect, useState } from "react";
import { slugify } from "./mdx";

export function HeaderNavLink({ header, children }) {
    // use window dom to get the current header ie the first header that is in view
    const [isCurrentHeader, setIsCurrentHeader] = useState<boolean>(false);
    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        const headers = Array.from(
            document.querySelectorAll(
                "article > h1, article > h2, article > h3, article > h4, article > h5, article > h6",
            ),
        );

        const onScroll = () => {
            let foundCurrent = false;
            for (const el of headers) {
                const rect = el.getBoundingClientRect();
                if (rect.top >= 0) {
                    foundCurrent = el.textContent === header.text;
                    break;
                }
            }
            setIsCurrentHeader(foundCurrent);
        };

        window.addEventListener("scroll", onScroll);
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, [header.text]);
    return (
        <li className={`ml-${header.level - 1}`}>
            <a
                href={`#${slugify(header.text)}`}
                className={
                    "text-neutral-400 !decoration-neutral-200 text-sm " +
                    (isCurrentHeader ? "text-neutral-800 font-medium" : "")
                }
            >
                {children}
            </a>
        </li>
    );
}
