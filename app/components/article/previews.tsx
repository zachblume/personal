"use client";

import { ReaderIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import {
    createContext,
    use,
    useEffect,
    useEffectEvent,
    useId,
    useLayoutEffect,
    useRef,
    useState,
    useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import styles from "app/components/article/previews.module.css";
import { Link } from "app/components/Link";

export type Preview =
    | {
          kind: "post";
          title: string;
          summary: string;
          date: string;
          minutes: number;
          /** Drawn on the server and handed over, so Art stays off the client. */
          art: React.ReactNode;
      }
    | { kind: "external"; host: string; path: string };

type Open = {
    id: string;
    href: string;
    anchor: HTMLElement;
    /** Which line of a wrapped link the pointer came in on. */
    line: number;
    preview: Preview;
};

type Api = {
    openId: string | null;
    tooltipId: string;
    hoverStart: (next: Open) => void;
    hoverEnd: () => void;
    focus: (next: Open) => void;
    blur: (id: string) => void;
    /** A touch tap: true when it should follow the link, false to preview. */
    tap: (next: Open) => boolean;
    close: () => void;
};

const PreviewContext = createContext<Api | null>(null);

/** Long enough that sweeping the pointer across a paragraph opens nothing. */
const OPEN_DELAY = 300;
/** Once one card is up, moving to the next link shouldn't wait again. */
const SWITCH_DELAY = 80;
/** Room to cross the gap between link and card, or to wobble off and back. */
const CLOSE_DELAY = 220;
const GAP = 8;
const MARGIN = 8;

/** What components/Link records on click; the card follows links itself. */
function recordVisit(href: string) {
    try {
        const { pathname } = new URL(href, window.location.href);
        window.localStorage.setItem(pathname, "true");
    } catch (error) {
        console.error(error);
    }
}

function subscribeStorage(callback: () => void) {
    window.addEventListener("storage", callback);
    return () => window.removeEventListener("storage", callback);
}

/** The same localStorage visit record PostRow reads, keyed by pathname. */
function useVisited(href: string) {
    const pathname = href.split(/[?#]/)[0];
    return useSyncExternalStore(
        subscribeStorage,
        () => !!window.localStorage.getItem(pathname),
        () => false,
    );
}

/**
 * Below the link, or above it when there isn't room below and there is more
 * above; clamped to the viewport horizontally. Writes straight to the card's
 * style so a scroll doesn't re-render anything. False once the link has
 * scrolled out of view.
 */
function place(card: HTMLElement, anchor: HTMLElement, line: number) {
    const rects = anchor.getClientRects();
    const rect = rects[Math.min(line, rects.length - 1)];
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    if (!rect || rect.bottom < 0 || rect.top > vh) return false;

    const { offsetWidth: w, offsetHeight: h } = card;
    const below = vh - rect.bottom - GAP - MARGIN;
    const above = rect.top - GAP - MARGIN;
    const flip = h > below && above > below;
    const top = flip ? Math.max(MARGIN, rect.top - GAP - h) : rect.bottom + GAP;
    const left = Math.max(MARGIN, Math.min(rect.left, vw - w - MARGIN));

    card.style.top = `${Math.round(top)}px`;
    card.style.left = `${Math.round(left)}px`;
    card.dataset.side = flip ? "top" : "bottom";
    return true;
}

/**
 * Owns the one preview card on the page: which link it belongs to, the
 * hover-intent timers, and dismissal. Links talk to it through context.
 *
 * The card is portalled to <body>: it's fixed, so it can't sit under a
 * transformed ancestor, and it stays out of the article's text.
 */
export function PreviewProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState<Open | null>(null);
    // Mirrors `open` for handlers and timers, which shouldn't act on the
    // render they were created in.
    const openRef = useRef<Open | null>(null);
    const timers = useRef({ open: 0, close: 0 });
    const overCard = useRef(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const tooltipId = useId();
    const router = useRouter();

    function show(next: Open | null) {
        window.clearTimeout(timers.current.open);
        window.clearTimeout(timers.current.close);
        openRef.current = next;
        if (!next) overCard.current = false;
        setOpen(next);
    }

    function scheduleClose() {
        window.clearTimeout(timers.current.close);
        timers.current.close = window.setTimeout(() => {
            if (!overCard.current) show(null);
        }, CLOSE_DELAY);
    }

    const api: Api = {
        openId: open?.id ?? null,
        tooltipId,
        hoverStart(next) {
            window.clearTimeout(timers.current.close);
            window.clearTimeout(timers.current.open);
            // Back on the link after a trip into the card.
            if (openRef.current?.id === next.id) return;
            timers.current.open = window.setTimeout(
                () => show(next),
                openRef.current ? SWITCH_DELAY : OPEN_DELAY,
            );
        },
        hoverEnd() {
            window.clearTimeout(timers.current.open);
            if (openRef.current) scheduleClose();
        },
        focus(next) {
            show(next);
        },
        blur(id) {
            if (openRef.current?.id === id && !overCard.current) show(null);
        },
        tap(next) {
            if (openRef.current?.id === next.id) return true;
            show(next);
            return false;
        },
        close() {
            show(null);
        },
    };

    const dismiss = useEffectEvent(() => show(null));

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") dismiss();
        };
        // A tap anywhere else puts a touch preview away.
        const onDown = (e: PointerEvent) => {
            const target = e.target as Node;
            if (open.anchor.contains(target)) return;
            if (cardRef.current?.contains(target)) return;
            dismiss();
        };
        document.addEventListener("keydown", onKey);
        document.addEventListener("pointerdown", onDown);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("pointerdown", onDown);
        };
    }, [open]);

    useEffect(() => {
        const pending = timers.current;
        return () => {
            window.clearTimeout(pending.open);
            window.clearTimeout(pending.close);
        };
    }, []);

    function follow() {
        if (!open) return;
        const { href, preview } = open;
        show(null);
        if (preview.kind === "external") {
            window.open(href, "_blank", "noopener,noreferrer");
        } else {
            recordVisit(href);
            router.push(href);
        }
    }

    return (
        <PreviewContext value={api}>
            {children}
            {open
                ? createPortal(
                      <Card
                          key={open.id}
                          ref={cardRef}
                          id={tooltipId}
                          open={open}
                          onGone={() => show(null)}
                          onEnter={() => {
                              overCard.current = true;
                              window.clearTimeout(timers.current.close);
                          }}
                          onLeave={() => {
                              overCard.current = false;
                              scheduleClose();
                          }}
                          onFollow={follow}
                      />,
                      document.body,
                  )
                : null}
        </PreviewContext>
    );
}

function Card({
    ref,
    id,
    open,
    onGone,
    onEnter,
    onLeave,
    onFollow,
}: {
    ref: React.RefObject<HTMLDivElement | null>;
    id: string;
    open: Open;
    onGone: () => void;
    onEnter: () => void;
    onLeave: () => void;
    onFollow: () => void;
}) {
    const gone = useEffectEvent(onGone);
    const { anchor, line, preview } = open;

    // Before paint, so the card never shows at 0,0 or on the wrong side.
    useLayoutEffect(() => {
        const card = ref.current;
        if (!card) return;
        const update = () => {
            if (!place(card, anchor, line)) gone();
        };
        update();
        window.addEventListener("scroll", update, {
            capture: true,
            passive: true,
        });
        window.addEventListener("resize", update);
        return () => {
            window.removeEventListener("scroll", update, { capture: true });
            window.removeEventListener("resize", update);
        };
    }, [ref, anchor, line]);

    return (
        // Clicking the card follows the link, as a convenience for the
        // pointer; keyboard and screen-reader users already have the link,
        // which this card describes.
        <div
            ref={ref}
            id={id}
            role="tooltip"
            onPointerEnter={(e) => {
                if (e.pointerType !== "touch") onEnter();
            }}
            onPointerLeave={(e) => {
                if (e.pointerType !== "touch") onLeave();
            }}
            // Keep focus on the link, so a click here doesn't blur it shut.
            onMouseDown={(e) => e.preventDefault()}
            onClick={onFollow}
            className={`${styles.card} fixed left-0 top-0 z-50 max-w-[calc(100vw-16px)] cursor-pointer overflow-hidden rounded-lg border border-neutral-200 bg-white text-left shadow-[0_16px_40px_-16px_rgba(0,0,0,0.25)] dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.9)] ${
                preview.kind === "post" ? "w-80" : "w-72"
            }`}
        >
            {preview.kind === "post" ? (
                <PostCard href={open.href} preview={preview} />
            ) : (
                <ExternalCard preview={preview} />
            )}
        </div>
    );
}

function PostCard({
    href,
    preview,
}: {
    href: string;
    preview: Extract<Preview, { kind: "post" }>;
}) {
    const visited = useVisited(href);
    return (
        <>
            <div className="overflow-hidden border-b border-neutral-200 dark:border-neutral-800">
                {preview.art}
            </div>
            <div className="px-4 pb-3.5 pt-3">
                <p className="font-[family-name:var(--font-editorial)] text-[19px] leading-[1.2] tracking-[-0.02em] text-neutral-900 [text-wrap:balance] dark:text-white">
                    {preview.title}
                </p>
                {preview.summary ? (
                    <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                        {preview.summary}
                    </p>
                ) : null}
                <p className="mt-3 flex items-center justify-between gap-3 font-[family-name:var(--font-geist-mono)] text-[11.5px] tabular-nums text-neutral-400 dark:text-neutral-500">
                    <span>
                        {preview.date} · {preview.minutes} min read
                    </span>
                    {visited ? (
                        <span className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
                            <ReaderIcon width={12} height={12} aria-hidden />
                            Read
                        </span>
                    ) : null}
                </p>
            </div>
        </>
    );
}

function ExternalCard({
    preview,
}: {
    preview: Extract<Preview, { kind: "external" }>;
}) {
    return (
        <div className="flex items-start gap-3 p-3.5">
            {/* A monogram in place of a favicon: no request to the other site
                just for hovering. */}
            <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-neutral-200 font-[family-name:var(--font-geist-mono)] text-[14px] uppercase text-neutral-500 dark:border-neutral-800 dark:text-neutral-400"
            >
                {preview.host[0]}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-white">
                    {preview.host}
                </span>
                {preview.path ? (
                    <span className="block truncate font-[family-name:var(--font-geist-mono)] text-[11.5px] text-neutral-400 dark:text-neutral-500">
                        {preview.path}
                    </span>
                ) : null}
                <span className="mt-1.5 block text-[12px] text-neutral-500 dark:text-neutral-400">
                    External link · opens in a new tab{" "}
                    <span aria-hidden>↗</span>
                </span>
            </span>
        </div>
    );
}

/** The line of a wrapped link that a point falls on. */
function lineAt(el: HTMLElement, x: number, y: number) {
    const rects = Array.from(el.getClientRects());
    const i = rects.findIndex(
        (r) =>
            y >= r.top - 1 &&
            y <= r.bottom + 1 &&
            x >= r.left - 1 &&
            x <= r.right + 1,
    );
    return Math.max(0, i);
}

/**
 * An inline link that previews its destination. Pointer: after a short
 * hover. Keyboard: as soon as it takes focus. Touch: the first tap previews
 * and the second follows.
 */
export function PreviewLink({
    href,
    preview,
    className = "",
    children,
    ...props
}: {
    href: string;
    preview: Preview;
    children: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
    const api = use(PreviewContext);
    const id = useId();
    // Set on pointerdown, read by the click that follows it. A click with
    // no pointerdown before it is the keyboard.
    const pointer = useRef("");

    if (!api) throw new Error("PreviewLink needs a PreviewProvider above it");

    const at = (anchor: HTMLElement, line = 0): Open => ({
        id,
        href,
        anchor,
        line,
        preview,
    });

    const handlers = {
        onPointerEnter(e: React.PointerEvent<HTMLAnchorElement>) {
            if (e.pointerType === "touch") return;
            const el = e.currentTarget;
            api.hoverStart(at(el, lineAt(el, e.clientX, e.clientY)));
        },
        onPointerLeave(e: React.PointerEvent<HTMLAnchorElement>) {
            if (e.pointerType !== "touch") api.hoverEnd();
        },
        onPointerDown(e: React.PointerEvent<HTMLAnchorElement>) {
            pointer.current = e.pointerType;
        },
        onFocus(e: React.FocusEvent<HTMLAnchorElement>) {
            // Only keyboard focus: a mouse click focuses the link too, and
            // shouldn't skip the hover delay.
            if (e.currentTarget.matches(":focus-visible")) {
                api.focus(at(e.currentTarget));
            }
        },
        onBlur() {
            api.blur(id);
        },
        onClick(e: React.MouseEvent<HTMLAnchorElement>) {
            const touch = pointer.current === "touch";
            pointer.current = "";
            if (touch && !api.tap(at(e.currentTarget))) {
                e.preventDefault();
                return;
            }
            api.close();
            // Passing onClick replaces components/Link's visit tracking.
            if (preview.kind === "post") recordVisit(href);
        },
    };

    const describedBy = api.openId === id ? api.tooltipId : undefined;
    const classes =
        `focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-white ${className}`.trim();

    if (preview.kind === "post") {
        return (
            <Link
                href={href}
                aria-describedby={describedBy}
                className={classes}
                {...props}
                {...handlers}
            >
                {children}
            </Link>
        );
    }
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-describedby={describedBy}
            className={classes}
            {...props}
            {...handlers}
        >
            {children}
            <span className="sr-only"> (opens in a new tab)</span>
        </a>
    );
}
