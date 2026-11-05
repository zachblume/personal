"use client";

import { useSyncExternalStore } from "react";
import { Chevron } from "app/components/icons";
import { Link } from "app/components/Link";

export type PathPost = {
    href: string;
    title: string;
    adds: string;
    minutes: number;
};

function subscribe(onChange: () => void) {
    // Another tab reading a post, or this one coming back from the bfcache.
    window.addEventListener("storage", onChange);
    window.addEventListener("pageshow", onChange);
    return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener("pageshow", onChange);
    };
}

/** One character per href, "1" for visited — a string, so it compares by value. */
function readVisits(hrefs: string[]) {
    try {
        return hrefs
            .map((href) => (window.localStorage.getItem(href) ? "1" : "0"))
            .join("");
    } catch {
        return "";
    }
}

/**
 * Which of these posts this browser has opened, from the visits that
 * components/Link and LocalStorageLinkSyncer record (key = pathname). The
 * server can't know, so it renders a first visit and the client fills in.
 */
function useVisited(hrefs: string[]) {
    const visits = useSyncExternalStore(
        subscribe,
        () => readVisits(hrefs),
        () => "",
    );
    return hrefs.map((_, i) => visits[i] === "1");
}

/** A path's progress and its ordered list of posts. */
export function PathReading({
    posts,
    next,
}: {
    posts: PathPost[];
    /** Where to send someone who's finished this path. */
    next: { href: string; label: string };
}) {
    const visited = useVisited(posts.map((post) => post.href));
    const read = visited.filter(Boolean).length;
    const upNext = posts.find((_, i) => !visited[i]);
    const minutes = posts.reduce((sum, post) => sum + post.minutes, 0);

    return (
        <div className="mt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <p className="text-[13px] tabular-nums text-neutral-500 dark:text-neutral-400">
                    {read === 0
                        ? `${posts.length} posts · ${minutes} min`
                        : read === posts.length
                          ? `All ${posts.length} read`
                          : `${read} of ${posts.length} read`}
                </p>
                {read === 0 ? (
                    <Link
                        href={posts[0].href}
                        className="group inline-flex items-center gap-2 text-[14px] font-medium text-neutral-900 dark:text-white"
                    >
                        Start
                        <span className="sr-only">: {posts[0].title}</span>
                        <Chevron />
                    </Link>
                ) : upNext ? (
                    <Link
                        href={upNext.href}
                        className="group inline-flex min-w-0 items-center gap-2 text-[14px] text-neutral-500 dark:text-neutral-400"
                    >
                        Continue:
                        <span className="min-w-0 truncate font-medium text-neutral-900 dark:text-white">
                            {upNext.title}
                        </span>
                        <Chevron />
                    </Link>
                ) : (
                    <a
                        href={next.href}
                        className="group inline-flex items-center gap-2 text-[14px] text-neutral-500 dark:text-neutral-400"
                    >
                        {next.label}
                        <Chevron />
                    </a>
                )}
            </div>

            {/* The count above says the same thing in words, so this is
                decoration. It keeps its space on a first visit, so nothing
                shifts when the client finds you've read something. */}
            <div
                aria-hidden
                className={`mt-3 flex gap-1 ${read === 0 ? "invisible" : ""}`}
            >
                {posts.map((post, i) => (
                    <span
                        key={post.href}
                        className={`h-1.5 flex-1 rounded-full ${
                            visited[i]
                                ? "bg-neutral-900 dark:bg-white"
                                : "bg-neutral-200 dark:bg-neutral-800"
                        }`}
                    />
                ))}
            </div>

            <ol className="mt-8 border-t border-neutral-200 dark:border-neutral-800">
                {posts.map((post, i) => (
                    <li
                        key={post.href}
                        className="border-b border-neutral-200 dark:border-neutral-800"
                    >
                        <Link
                            href={post.href}
                            className="group -mx-3 flex items-start gap-4 rounded-md px-3 py-5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/60"
                        >
                            <span className="w-6 shrink-0 pt-1 font-[family-name:var(--font-geist-mono)] text-[12px] tabular-nums text-neutral-300 dark:text-neutral-700">
                                {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-[17px] font-medium leading-snug tracking-[-0.015em] text-neutral-900 dark:text-neutral-100">
                                    {post.title}
                                </span>
                                <span className="mt-1 block text-[14px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                                    {post.adds}
                                </span>
                            </span>
                            <span className="w-14 shrink-0 pt-1 text-right text-[12px] tabular-nums text-neutral-400 dark:text-neutral-500">
                                {visited[i] ? (
                                    <span className="inline-flex items-center gap-1 text-neutral-900 dark:text-white">
                                        <svg
                                            viewBox="0 0 12 12"
                                            className="h-3 w-3"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth={1.5}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            aria-hidden
                                        >
                                            <path d="m2.5 6.5 2.25 2.25L9.5 3.5" />
                                        </svg>
                                        Read
                                    </span>
                                ) : (
                                    `${post.minutes} min`
                                )}
                            </span>
                        </Link>
                    </li>
                ))}
            </ol>
        </div>
    );
}
