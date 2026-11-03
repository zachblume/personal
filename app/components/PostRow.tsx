"use client";

import { ReaderIcon } from "@radix-ui/react-icons";
import { Tooltip } from "@radix-ui/themes";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Chevron } from "app/components/icons";
import { Link } from "app/components/Link";
import { PAD } from "app/components/SiteChrome";

/** Mirrors BlogLink: visits are recorded in localStorage by components/Link. */
function useIsVisited(href: string) {
    const [isVisited, setIsVisited] = useState(false);
    const pathname = usePathname();
    useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        setIsVisited(!!window.localStorage.getItem(href));
    }, [href, pathname]);
    return isVisited;
}

export function PostRow({
    slug,
    title,
    summary,
    date,
    ordinal,
    art,
}: {
    slug: string;
    title: string;
    summary: string;
    date: string;
    ordinal: number;
    /** Rendered on the server and passed down, so Art stays off the client. */
    art: React.ReactNode;
}) {
    const href = `/blog/${slug}`;
    const isVisited = useIsVisited(href);

    return (
        <li className="border-b border-neutral-200 dark:border-neutral-800">
            <Link
                href={href}
                className={`${PAD} group flex items-center gap-6 py-6 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/60`}
            >
                <span className="hidden w-8 shrink-0 text-[12px] tabular-nums text-neutral-300 sm:block dark:text-neutral-700">
                    {String(ordinal).padStart(2, "0")}
                </span>

                <span className="block w-20 shrink-0 overflow-hidden rounded-md border border-neutral-200/80 sm:w-28 dark:border-neutral-800">
                    {art}
                </span>

                <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                        <span className="text-[19px] font-medium leading-snug tracking-[-0.015em] text-neutral-900 md:text-[22px] dark:text-neutral-100">
                            {title}
                        </span>
                        {isVisited ? (
                            <Tooltip content="Previously read" side="bottom">
                                <ReaderIcon
                                    height={13}
                                    width={13}
                                    className="shrink-0 text-neutral-400"
                                />
                            </Tooltip>
                        ) : null}
                    </span>
                    {summary ? (
                        <span className="mt-1 block max-w-2xl truncate text-[14px] text-neutral-500 dark:text-neutral-400">
                            {summary}
                        </span>
                    ) : null}
                </span>

                <time className="hidden w-32 shrink-0 text-[13px] tabular-nums text-neutral-400 sm:block dark:text-neutral-500">
                    {date}
                </time>

                <Chevron />
            </Link>
        </li>
    );
}
