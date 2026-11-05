"use client";

import {
    choose as chooseView,
    VIEWS as ARCHIVE_VIEWS,
} from "app/components/archive/viewStore";
import {
    BackpackIcon,
    BookmarkIcon,
    CalendarIcon,
    ColorWheelIcon,
    CopyIcon,
    Cross2Icon,
    GitHubLogoIcon,
    GridIcon,
    HomeIcon,
    ListBulletIcon,
    MagnifyingGlassIcon,
    MoonIcon,
    PersonIcon,
    PilcrowIcon,
    ReaderIcon,
    ShuffleIcon,
    StarIcon,
    SunIcon,
    TextAlignLeftIcon,
} from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Art } from "app/components/Art";
import { fuzzyMatch, segments } from "app/components/command-palette/fuzzy";
import styles from "app/components/command-palette/palette.module.css";
import type { PalettePost } from "app/components/command-palette/shared";
import { SITE } from "app/lib/site";

/*
 * Client-only: PaletteHost loads this with `ssr: false` on first open, which
 * is also why <Art> can be drawn here. Nothing server-renders it, so there is
 * no hydration for its float coordinates to disagree with.
 */

type Heading = PalettePost["headings"][number];

/** Where a command is listed. */
type CommandGroup = "Pages" | "Archive views" | "Actions";

type Command = {
    id: string;
    group: CommandGroup;
    label: string;
    /** Matched as well as the label, but never highlighted — they aren't on screen. */
    keywords: string;
    detail: string;
    icon: React.ReactNode;
    run: () => void;
};

type Item =
    | { kind: "post"; key: string; post: PalettePost }
    | { kind: "section"; key: string; post: PalettePost; heading: Heading }
    | { kind: "command"; key: string; command: Command };

type PostItem = Extract<Item, { kind: "post" }>;

type Scored = {
    score: number;
    /** Into the row's label: title, heading or command name. */
    positions: number[];
    strong: boolean;
    /** When the match was on text the row doesn't show (a post's summary,
     *  a command's keywords), that text, so the row can say why it's here. */
    via?: { text: string; positions: number[] };
};

type Result = Item &
    Scored & {
        /** Position in the flattened list, which is what the arrow keys walk. */
        index: number;
        group: number;
        first: boolean;
    };

type Group = { label: string; results: Result[] };

const RECENT_KEY = "command-palette:recent";
const MAX_PER_GROUP = 6;
/** Below this per query character, a match is scattered letters with no word
 *  starts — technically a subsequence, useless as a result. */
const MIN_PER_CHAR = 0.25;
/** And below this fraction of the best match on screen, it only crowds. */
const MIN_OF_BEST = 0.4;
/** What a match on a secondary field (summary, keywords) gives up. */
const SECONDARY = 1;

/** While searching, groups sort by their best match; ties keep this order. */
const SEARCH_GROUPS = [
    "Posts",
    "Sections",
    "Pages",
    "Archive views",
    "Actions",
] as const;

type Destination = {
    href: string;
    label: string;
    keywords: string;
    detail: string;
    icon: React.ReactNode;
};

const PAGES: Destination[] = [
    {
        href: "/",
        label: "Writing",
        keywords: "home archive posts blog index",
        detail: "Every post, newest first.",
        icon: <HomeIcon />,
    },
    {
        href: "/start-here",
        label: "Start here",
        keywords: "begin new reading paths guide themes",
        detail: "Short reading paths through the archive, by theme.",
        icon: <BookmarkIcon />,
    },
    {
        href: "/work",
        label: "Work",
        keywords: "portfolio projects jobs career resume open source",
        detail: "Roles, companies and open-source projects.",
        icon: <BackpackIcon />,
    },
    {
        href: "/constellation",
        label: "Constellation",
        keywords: "map graph related similar network",
        detail: "Every post on one map, linked by the vocabulary they share.",
        icon: <StarIcon />,
    },
    {
        href: "/timeline",
        label: "Timeline",
        keywords: "chronology history years dates",
        detail: "The archive laid out in time, each post sized by its length.",
        icon: <CalendarIcon />,
    },
    {
        href: "/art",
        label: "Art studio",
        keywords: "artwork generative playground wallpaper",
        detail: "Draw the site’s generated artwork from any seed, and download it as a wallpaper.",
        icon: <ColorWheelIcon />,
    },
    {
        href: "/colophon",
        label: "Colophon",
        keywords: "how made design typography fonts stack",
        detail: "How the site is made: type, color, the artwork and the stack.",
        icon: <PilcrowIcon />,
    },
    {
        href: "/about",
        label: "About",
        keywords: "bio contact zach me",
        detail: "Bio, the pets, and how to get in touch.",
        icon: <PersonIcon />,
    },
];

/** The homepage's layouts, which it reads from `?view=`. */
const VIEWS: Destination[] = [
    {
        href: "/?view=list",
        label: "List view",
        keywords: "archive layout homepage rows",
        detail: "The archive as rows: artwork, title, summary and date.",
        icon: <ListBulletIcon />,
    },
    {
        href: "/?view=grid",
        label: "Grid view",
        keywords: "archive layout homepage artwork tiles",
        detail: "The archive as a grid, artwork first.",
        icon: <GridIcon />,
    },
    {
        href: "/?view=index",
        label: "Index view",
        keywords: "archive layout homepage dense titles years",
        detail: "Titles only, grouped by year, like the index of a book.",
        icon: <TextAlignLeftIcon />,
    },
];

/* ---------- storage ---------- */

/** Visits are recorded by components/Link and LocalStorageLinkSyncer under the pathname. */
function readPosts(posts: PalettePost[]) {
    const read = new Set<string>();
    try {
        for (const post of posts) {
            if (window.localStorage.getItem(post.href)) read.add(post.slug);
        }
    } catch {
        // Storage blocked; everything reads as unread.
    }
    return read;
}

function readRecent(): string[] {
    try {
        const value = JSON.parse(
            window.localStorage.getItem(RECENT_KEY) || "[]",
        );
        return Array.isArray(value)
            ? value.filter((key) => typeof key === "string")
            : [];
    } catch {
        return [];
    }
}

function remember(key: string) {
    try {
        const next = [key, ...readRecent().filter((k) => k !== key)];
        window.localStorage.setItem(
            RECENT_KEY,
            JSON.stringify(next.slice(0, 5)),
        );
    } catch {
        // Not worth surfacing; recents are a nicety.
    }
}

/* ---------- search ---------- */

function itemsFor(posts: PalettePost[], commands: Command[]) {
    const items: Item[] = posts.map((post) => ({
        kind: "post",
        key: `post:${post.slug}`,
        post,
    }));
    for (const post of posts) {
        for (const heading of post.headings) {
            items.push({
                kind: "section",
                key: `section:${post.slug}#${heading.id}`,
                post,
                heading,
            });
        }
    }
    for (const command of commands) {
        items.push({ kind: "command", key: `command:${command.id}`, command });
    }
    return items;
}

function groupOf(item: Item) {
    if (item.kind === "post") return "Posts";
    if (item.kind === "section") return "Sections";
    return item.command.group;
}

/** Starts a long summary a little before its first hit, so truncation
 *  doesn't hide the reason the row is there. */
function excerpt(text: string, positions: number[]) {
    const first = positions[0] ?? 0;
    if (first <= 24) return { text, positions };
    const space = text.lastIndexOf(" ", first - 12);
    const start = space < 0 ? 0 : space + 1;
    return {
        text: `…${text.slice(start)}`,
        positions: positions.map((p) => p - start + 1),
    };
}

/** Just the keywords a match touched, e.g. "shuffle" for Random post. */
function touchedWords(text: string, positions: number[]) {
    const hits = new Set(positions);
    const words: { text: string; positions: number[] }[] = [];
    let offset = 0;
    for (const word of text.split(" ")) {
        const inWord = [...word].flatMap((_, i) =>
            hits.has(offset + i) ? [i] : [],
        );
        if (inWord.length) words.push({ text: word, positions: inWord });
        offset += word.length + 1;
    }
    let length = 0;
    return {
        text: words.map((w) => w.text).join(" "),
        positions: words.flatMap((w) => {
            const shifted = w.positions.map((p) => p + length);
            length += w.text.length + 1;
            return shifted;
        }),
    };
}

/**
 * The label's match whenever it's a strong one: what's highlighted on screen
 * should be the reason a row is there. The hidden field gets a look only when
 * the label misses or merely scatters, and pays SECONDARY for being hidden.
 */
function either(
    query: string,
    label: string,
    hidden: string,
    show: (text: string, positions: number[]) => Scored["via"],
): Scored | null {
    const a = fuzzyMatch(query, label);
    if (a?.strong) return a;
    const b = fuzzyMatch(query, hidden);
    if (!b) return a;
    const bScore = b.score - SECONDARY;
    if (!a || b.strong || bScore > a.score) {
        return {
            score: bScore,
            positions: [],
            strong: b.strong,
            via: show(hidden, b.positions),
        };
    }
    return a;
}

function matchItem(item: Item, query: string): Scored | null {
    if (item.kind === "post") {
        return either(query, item.post.title, item.post.summary, excerpt);
    }
    if (item.kind === "section") return fuzzyMatch(query, item.heading.text);
    return either(
        query,
        item.command.label,
        item.command.keywords,
        touchedWords,
    );
}

function search(
    query: string,
    items: Item[],
    recent: string[],
    read: Set<string>,
): Group[] {
    let groups: { label: string; items: (Item & Scored)[] }[];

    if (!query.trim()) {
        const blank = (item: Item) => ({
            ...item,
            score: 0,
            positions: [],
            strong: true,
        });
        const byKey = new Map(items.map((item) => [item.key, item]));
        const recentItems = recent
            .map((key) => byKey.get(key))
            .filter((item): item is Item => !!item)
            .slice(0, 4);
        const posts = items.filter(
            (item): item is PostItem =>
                item.kind === "post" && !recent.includes(item.key),
        );
        // Newest first, but what you haven't read before what you have.
        const suggested = [
            ...posts.filter((item) => !read.has(item.post.slug)),
            ...posts.filter((item) => read.has(item.post.slug)),
        ].slice(0, 5);
        const commands = (group: CommandGroup) =>
            items.filter((item) => groupOf(item) === group).map(blank);
        groups = [
            { label: "Recent", items: recentItems.map(blank) },
            { label: "Suggested", items: suggested.map(blank) },
            { label: "Pages", items: commands("Pages") },
            { label: "Actions", items: commands("Actions") },
            { label: "Archive views", items: commands("Archive views") },
        ];
    } else {
        const run = (min: number) => {
            let scored = items
                .map((item) => ({ item, match: matchItem(item, query) }))
                .filter(({ match }) => match && match.score >= min)
                .map(({ item, match }) => ({ ...item, ...match! }))
                .sort((a, b) => b.score - a.score);
            // The quality floor. Once anything matches as a run or by word
            // starts, letters scattered through a title are noise, and so is
            // anything far below the best.
            if (scored.some((result) => result.strong)) {
                scored = scored.filter((result) => result.strong);
            }
            const best = scored[0]?.score ?? 0;
            if (best > 0) {
                scored = scored.filter(
                    (result) => result.score >= best * MIN_OF_BEST,
                );
            }
            // Posts and sections are many and capped; commands are few.
            return SEARCH_GROUPS.map((label) => ({
                label,
                items: scored
                    .filter((item) => groupOf(item) === label)
                    .slice(
                        0,
                        label === "Posts" || label === "Sections"
                            ? MAX_PER_GROUP
                            : Infinity,
                    ),
            }))
                .filter((group) => group.items.length)
                .sort((a, b) => b.items[0].score - a.items[0].score);
        };
        const min = query.replace(/\s+/g, "").length * MIN_PER_CHAR;
        groups = run(min);
        // Nothing good enough: show the weak matches rather than nothing.
        if (!groups.length) groups = run(-Infinity);
    }

    let index = 0;
    return groups
        .filter((group) => group.items.length)
        .map((group, g) => ({
            label: group.label,
            results: group.items.map((item, i) => ({
                ...item,
                index: index++,
                group: g,
                first: i === 0,
            })),
        }));
}

/* ---------- small pieces ---------- */

function pickAtRandom<T>(list: T[]) {
    return list[Math.floor(Math.random() * list.length)];
}

function RssIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
            <path
                d="M3.5 2.5a9 9 0 0 1 9 9M3.5 6.5a5 5 0 0 1 5 5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
            />
            <circle cx="4" cy="11" r="1" fill="currentColor" />
        </svg>
    );
}

/** Weight and an underline rather than a background, which would vanish
 *  into the selected row's own. */
function Highlight({ text, positions }: { text: string; positions: number[] }) {
    if (!positions.length) return text;
    return segments(text, positions).map((part, i) =>
        part.hit ? (
            <mark
                key={i}
                className="bg-transparent font-semibold text-neutral-950 underline decoration-neutral-400 decoration-1 underline-offset-[3px] dark:text-white dark:decoration-neutral-500"
            >
                {part.text}
            </mark>
        ) : (
            <span key={i}>{part.text}</span>
        ),
    );
}

/* ---------- the palette ---------- */

export function Palette({
    posts,
    onClose,
    notify,
}: {
    posts: PalettePost[];
    onClose: (restoreFocus: boolean) => void;
    notify: (message: string) => void;
}) {
    const router = useRouter();
    const { theme, resolvedTheme, setTheme } = useTheme();
    // Mounted per opening, so storage is read once per opening.
    const [read] = useState(() => readPosts(posts));
    const [recent] = useState(readRecent);
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);
    const base = useId();
    const listId = `${base}-list`;

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Hold the page still underneath, without the layout jumping where the
    // scrollbar was.
    useEffect(() => {
        const html = document.documentElement;
        const gutter = window.innerWidth - html.clientWidth;
        const { overflow, paddingRight } = html.style;
        html.style.overflow = "hidden";
        if (gutter > 0) html.style.paddingRight = `${gutter}px`;
        return () => {
            html.style.overflow = overflow;
            html.style.paddingRight = paddingRight;
        };
    }, []);

    const go = (href: string) => {
        onClose(false);
        router.push(href);
    };

    /** Off the site, or a route handler rather than a page: a full load. */
    const leave = (href: string) => {
        onClose(false);
        window.location.assign(new URL(href, window.location.href).href);
    };

    const copy = (text: string) => {
        if (!navigator.clipboard) {
            notify(`Couldn't reach the clipboard. It's ${text}`);
            return;
        }
        navigator.clipboard.writeText(text).then(
            () => notify(`Copied ${text}`),
            () => notify(`Couldn't copy. It's ${text}`),
        );
    };

    const unread = posts.filter((post) => !read.has(post.slug));
    const isDark = resolvedTheme === "dark";

    /** On the archive already: a same-route push wouldn't make it re-read
     *  `?view=`, so switch it in place (which also gets the crossfade). */
    const switchView = (href: string) => {
        const view = new URL(href, window.location.href).searchParams.get(
            "view",
        );
        const inPlace = ARCHIVE_VIEWS.find((v) => v === view);
        if (window.location.pathname !== "/" || !inPlace) return false;
        onClose(false);
        chooseView(inPlace);
        return true;
    };

    const destination =
        (group: CommandGroup) =>
        ({ href, ...rest }: Destination): Command => ({
            id: `${group === "Pages" ? "page" : "view"}:${href}`,
            group,
            ...rest,
            run: () => {
                if (group === "Archive views" && switchView(href)) return;
                go(href);
            },
        });

    const commands: Command[] = [
        ...PAGES.map(destination("Pages")),
        ...VIEWS.map(destination("Archive views")),
        {
            id: "theme",
            group: "Actions",
            label: isDark ? "Switch to light theme" : "Switch to dark theme",
            keywords: "toggle theme appearance mode dark light",
            detail:
                theme === "system"
                    ? "Following your system setting for now. Choosing one pins it."
                    : `Pinned to ${theme}.`,
            icon: isDark ? <SunIcon /> : <MoonIcon />,
            run: () => {
                onClose(true);
                setTheme(isDark ? "light" : "dark");
            },
        },
        {
            id: "email",
            group: "Actions",
            label: "Copy email address",
            keywords: "mail contact clipboard",
            detail: `Puts ${SITE.email} on your clipboard.`,
            icon: <CopyIcon />,
            run: () => {
                onClose(true);
                copy(SITE.email);
            },
        },
        {
            id: "random",
            group: "Actions",
            label: "Random post",
            keywords: "shuffle surprise lucky",
            detail: unread.length
                ? `One of the ${unread.length} you haven't opened yet.`
                : "You've opened every post, so any of them.",
            icon: <ShuffleIcon />,
            run: () => go(pickAtRandom(unread.length ? unread : posts).href),
        },
        {
            id: "rss",
            group: "Actions",
            label: "Open RSS feed",
            keywords: "subscribe feed xml atom reader",
            detail: "Every post as a feed, at /rss.",
            icon: <RssIcon />,
            run: () => leave("/rss"),
        },
        {
            id: "github",
            group: "Actions",
            label: "Open GitHub",
            keywords: "code source repositories",
            detail: SITE.github.href.replace(/^https:\/\//, ""),
            icon: <GitHubLogoIcon />,
            run: () => leave(SITE.github.href),
        },
    ];

    const groups = search(query, itemsFor(posts, commands), recent, read);
    const results = groups.flatMap((group) => group.results);
    const index = results.length ? Math.min(selected, results.length - 1) : -1;
    const active = index >= 0 ? results[index] : null;
    const activeId = active ? `${base}-option-${active.index}` : undefined;
    // A group's first row brings its label into view with it.
    const activeLabelId = active?.first
        ? `${base}-group-${active.group}`
        : undefined;

    useEffect(() => {
        if (activeLabelId) {
            document
                .getElementById(activeLabelId)
                ?.scrollIntoView({ block: "nearest" });
        }
        if (activeId) {
            document
                .getElementById(activeId)
                ?.scrollIntoView({ block: "nearest" });
        }
    }, [activeId, activeLabelId]);

    const run = (result: Result) => {
        remember(result.key);
        if (result.kind === "post") go(result.post.href);
        else if (result.kind === "section")
            go(`${result.post.href}#${result.heading.id}`);
        else result.command.run();
    };

    const move = (delta: number) => {
        if (!results.length) return;
        setSelected((index + delta + results.length) % results.length);
    };

    const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        // Ctrl+N / Ctrl+P too, for the emacs-handed.
        const ctrl = event.ctrlKey && !event.metaKey && !event.altKey;
        if (event.key === "ArrowDown" || (ctrl && event.key === "n")) {
            event.preventDefault();
            move(1);
        } else if (event.key === "ArrowUp" || (ctrl && event.key === "p")) {
            event.preventDefault();
            move(-1);
        } else if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            event.preventDefault();
            if (active) run(active);
        }
    };

    const onDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Escape") {
            event.preventDefault();
            onClose(true);
        } else if (event.key === "Tab") {
            // Two stops — the field and the close button — and focus stays
            // between them while the dialog is up.
            event.preventDefault();
            const next =
                document.activeElement === inputRef.current
                    ? closeRef.current
                    : inputRef.current;
            next?.focus();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-3 pt-3 sm:px-6 sm:pt-[12vh]">
            <div
                aria-hidden
                onClick={() => onClose(true)}
                className={`${styles.scrim} absolute inset-0 bg-neutral-950/25 backdrop-blur-[2px] dark:bg-black/70`}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Command palette"
                onKeyDown={onDialogKeyDown}
                className={`${styles.panel} relative w-full max-w-[46rem] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl shadow-black/10 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-black/60`}
            >
                <div className="flex h-14 items-center gap-3 border-b border-neutral-200 px-5 dark:border-neutral-800">
                    <MagnifyingGlassIcon
                        className="shrink-0 text-neutral-400 dark:text-neutral-500"
                        aria-hidden
                    />
                    <input
                        ref={inputRef}
                        type="text"
                        role="combobox"
                        aria-expanded={results.length > 0}
                        aria-controls={listId}
                        aria-activedescendant={activeId}
                        aria-autocomplete="list"
                        aria-label="Search posts, sections, pages and actions"
                        placeholder="Search posts, pages and actions…"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        enterKeyHint="go"
                        value={query}
                        onChange={(event) => {
                            setQuery(event.target.value);
                            setSelected(0);
                        }}
                        onKeyDown={onInputKeyDown}
                        // 16px on phones, or iOS zooms the page on focus.
                        className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-neutral-900 outline-none placeholder:text-neutral-400 sm:text-[15px] dark:text-white dark:placeholder:text-neutral-600"
                    />
                    <button
                        ref={closeRef}
                        type="button"
                        onClick={() => onClose(true)}
                        aria-label="Close"
                        className="flex h-6 shrink-0 items-center rounded border border-neutral-200 px-1.5 font-[family-name:var(--font-geist-mono)] text-[11px] text-neutral-500 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:text-white dark:focus-visible:outline-white"
                    >
                        <Cross2Icon className="sm:hidden" aria-hidden />
                        <span className="hidden sm:inline">esc</span>
                    </button>
                </div>

                <div className="flex md:h-[24rem]">
                    <div className="max-h-[min(24rem,calc(100dvh-8rem))] min-w-0 flex-1 overflow-y-auto overscroll-contain py-2 md:max-h-none">
                        <div
                            role="listbox"
                            id={listId}
                            aria-label="Results"
                            // Clicking a row mustn't take focus from the field.
                            onMouseDown={(event) => event.preventDefault()}
                        >
                            {groups.map((group, g) => (
                                <div
                                    key={group.label}
                                    role="group"
                                    aria-labelledby={`${base}-group-${g}`}
                                    className="pb-1"
                                >
                                    <div
                                        id={`${base}-group-${g}`}
                                        aria-hidden
                                        className="px-5 pb-1.5 pt-3 text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500"
                                    >
                                        {group.label}
                                    </div>
                                    {group.results.map((result) => (
                                        <div
                                            key={result.key}
                                            id={`${base}-option-${result.index}`}
                                            role="option"
                                            aria-selected={
                                                result.index === index
                                            }
                                            onMouseMove={(event) => {
                                                // Scrolling the list under a still pointer can
                                                // report a zero-distance move; that shouldn't take
                                                // the selection away from the keyboard.
                                                if (
                                                    event.movementX === 0 &&
                                                    event.movementY === 0
                                                ) {
                                                    return;
                                                }
                                                if (result.index !== index) {
                                                    setSelected(result.index);
                                                }
                                            }}
                                            onClick={() => run(result)}
                                            className={`mx-2 flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-3 py-1.5 text-[14px] ${
                                                result.index === index
                                                    ? "bg-neutral-100 text-neutral-950 dark:bg-neutral-900 dark:text-white"
                                                    : "text-neutral-700 dark:text-neutral-300"
                                            }`}
                                        >
                                            <OptionBody
                                                result={result}
                                                read={read}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                        {results.length === 0 ? (
                            <p className="px-5 py-10 text-center text-[13px] text-neutral-500 dark:text-neutral-400">
                                Nothing matches &ldquo;{query.trim()}&rdquo;.
                            </p>
                        ) : null}
                    </div>

                    <div
                        aria-hidden
                        className="hidden w-[18.5rem] shrink-0 border-l border-neutral-200 md:block dark:border-neutral-800"
                    >
                        {active ? (
                            <Preview
                                key={active.key}
                                result={active}
                                read={read}
                            />
                        ) : null}
                    </div>
                </div>

                <div className="hidden h-10 items-center gap-5 border-t border-neutral-200 px-5 font-[family-name:var(--font-geist-mono)] text-[11px] text-neutral-400 sm:flex dark:border-neutral-800 dark:text-neutral-500">
                    <span>↑↓ move</span>
                    <span>↵ open</span>
                    <span>esc close</span>
                    <span className="ml-auto tabular-nums">
                        {results.length}{" "}
                        {results.length === 1 ? "result" : "results"}
                    </span>
                </div>
                <p role="status" className="sr-only">
                    {query.trim()
                        ? `${results.length} ${results.length === 1 ? "result" : "results"}`
                        : ""}
                </p>
            </div>
        </div>
    );
}

function OptionBody({ result, read }: { result: Result; read: Set<string> }) {
    if (result.kind === "post") {
        return (
            <>
                <span className="block aspect-[16/9] w-10 shrink-0 overflow-hidden rounded-[3px] border border-neutral-200/80 dark:border-neutral-800">
                    <Art
                        slug={result.post.slug}
                        index={result.post.artIndex}
                        idPrefix="palette-row-"
                        className="block h-full w-full"
                    />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate">
                        <Highlight
                            text={result.post.title}
                            positions={result.positions}
                        />
                    </span>
                    {/* Matched on the summary: show it, so the row isn't a mystery. */}
                    {result.via ? (
                        <span className="block truncate text-[12px] text-neutral-500 dark:text-neutral-400">
                            <Highlight
                                text={result.via.text}
                                positions={result.via.positions}
                            />
                        </span>
                    ) : null}
                </span>
                {read.has(result.post.slug) ? (
                    <>
                        <ReaderIcon
                            width={12}
                            height={12}
                            aria-hidden
                            className="shrink-0 text-neutral-400 dark:text-neutral-500"
                        />
                        <span className="sr-only">, read</span>
                    </>
                ) : null}
                <span className="hidden shrink-0 text-[12px] tabular-nums text-neutral-400 sm:block dark:text-neutral-500">
                    {result.post.date}
                </span>
            </>
        );
    }
    if (result.kind === "section") {
        return (
            <>
                <span
                    aria-hidden
                    className="flex w-10 shrink-0 justify-center font-[family-name:var(--font-geist-mono)] text-[12px] text-neutral-400 dark:text-neutral-500"
                >
                    #
                </span>
                <span className="min-w-0 flex-1 truncate">
                    <Highlight
                        text={result.heading.text}
                        positions={result.positions}
                    />
                    <span className="text-neutral-400 dark:text-neutral-500">
                        {" "}
                        — in {result.post.title}
                    </span>
                </span>
            </>
        );
    }
    return (
        <>
            <span
                aria-hidden
                className="flex w-10 shrink-0 justify-center text-neutral-500 dark:text-neutral-400"
            >
                {result.command.icon}
            </span>
            <span className="min-w-0 flex-1 truncate">
                <Highlight
                    text={result.command.label}
                    positions={result.positions}
                />
            </span>
            {result.via ? (
                <span className="shrink-0 font-[family-name:var(--font-geist-mono)] text-[11px] text-neutral-500 dark:text-neutral-400">
                    <Highlight
                        text={result.via.text}
                        positions={result.via.positions}
                    />
                </span>
            ) : null}
        </>
    );
}

/** The selected row, larger: the post's artwork, or what a command does. */
function Preview({ result, read }: { result: Result; read: Set<string> }) {
    if (result.kind === "command") {
        return (
            <div className="flex h-full flex-col justify-end p-5">
                <span className="flex size-10 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
                    {result.command.icon}
                </span>
                <p className="mt-4 font-[family-name:var(--font-editorial)] text-[22px] leading-tight tracking-[-0.025em] text-neutral-900 dark:text-white">
                    {result.command.label}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                    {result.command.detail}
                </p>
            </div>
        );
    }

    const { post } = result;
    const section = result.kind === "section" ? result.heading : null;
    return (
        <div className={`${styles.preview} flex h-full flex-col p-5`}>
            <div className="aspect-[16/9] w-full shrink-0 overflow-hidden rounded-md border border-neutral-200/80 dark:border-neutral-800">
                <Art
                    slug={post.slug}
                    index={post.artIndex}
                    idPrefix="palette-preview-"
                    className="block h-full w-full"
                />
            </div>
            <div className="mt-4 min-h-0 flex-1 overflow-hidden">
                {section ? (
                    <>
                        <p className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                            Section
                        </p>
                        <p className="mt-1.5 font-[family-name:var(--font-editorial)] text-[22px] leading-tight tracking-[-0.025em] text-neutral-900 dark:text-white">
                            {section.text}
                        </p>
                        <p className="mt-2 text-[13px] leading-snug text-neutral-500 dark:text-neutral-400">
                            in {post.title}
                        </p>
                    </>
                ) : (
                    <>
                        <p className="font-[family-name:var(--font-editorial)] text-[22px] leading-tight tracking-[-0.025em] text-neutral-900 dark:text-white">
                            {post.title}
                        </p>
                        <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                            {post.summary}
                        </p>
                    </>
                )}
            </div>
            <p className="mt-3 shrink-0 text-[12px] tabular-nums text-neutral-400 dark:text-neutral-500">
                {post.date} · {post.minutes} min read
                {read.has(post.slug) ? " · Read" : ""}
            </p>
        </div>
    );
}
