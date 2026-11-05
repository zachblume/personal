import type { ClientPost } from "app/lib/posts";

/**
 * Server-only layout for the timeline: a linear time scale from the first
 * post's month to today, marks sized by length, collisions stacked, and the
 * long silences between posts measured.
 *
 * Horizontal positions are fractions of the axis, so the chart stretches
 * with the viewport; mark sizes and stacking heights are pixels. Stacking is
 * solved at the narrowest axis width of each breakpoint the horizontal
 * layout is shown at, and CSS picks the solution. Within a breakpoint marks
 * only move further apart as the viewport widens, so nothing can start
 * overlapping — and a mark that had to climb at 768px comes back down to
 * the baseline by 1280px instead of floating there.
 */

const DAY = 86_400_000;

/**
 * Axis width at the bottom of md, lg, xl and 2xl: the breakpoint less PAD
 * (md:px-10, lg:px-16), the plot's own px-8 inset, and room for a classic
 * scrollbar, which media queries count as viewport.
 */
const SCROLLBAR = 16;
export const SOLVE_WIDTHS = [
    768 - 2 * 40 - 2 * 32 - SCROLLBAR,
    1024 - 2 * 64 - 2 * 32 - SCROLLBAR,
    1280 - 2 * 64 - 2 * 32 - SCROLLBAR,
    1536 - 2 * 64 - 2 * 32 - SCROLLBAR,
];
const SOLVE_WIDTH = SOLVE_WIDTHS[0];

/** Space between stacked marks: the 2px surface ring plus a hair. */
const GAP = 3;

/** A silence longer than this is called out on the axis. */
const QUIET_DAYS = 91;

const WPM = 230;

export type TimelinePost = Pick<
    ClientPost,
    | "slug"
    | "href"
    | "title"
    | "summary"
    | "date"
    | "publishedAt"
    | "year"
    | "artIndex"
    | "words"
    | "minutes"
>;

export type Mark = TimelinePost & {
    /** 0–1 along the axis. */
    x: number;
    /** Centre height above the baseline, px, at each of SOLVE_WIDTHS. */
    ys: number[];
    /** Diameter, px. */
    d: number;
    /** Which side the hover card opens on, away from the nearer edge. */
    side: "left" | "right";
};

export type Quiet = {
    x0: number;
    x1: number;
    /** Px to keep clear of the marks at either end of the silence. */
    clearLeft: number;
    clearRight: number;
    days: number;
    label: string;
};

export type MonthBand = {
    x0: number;
    x1: number;
    initial: string;
    /** Set on January and on the first month, where a year label goes. */
    year?: string;
    /** Wide enough to carry its initial. */
    labelled: boolean;
};

export type PhoneItem =
    | { kind: "year"; key: string; year: string }
    | { kind: "post"; key: string; mark: Mark; space: number }
    | { kind: "quiet"; key: string; label: string; months: number };

export type YearTally = {
    year: string;
    posts: Mark[];
    words: number;
    minutes: number;
};

function dayOf(iso: string) {
    const [y, m, d] = iso.split("-").map(Number);
    return Date.UTC(y, m - 1, d) / DAY;
}

/** Area follows word count, so the 2,000-word post reads as 2,000 words. */
export function diameter(words: number) {
    return Math.max(20, Math.round(1.6 * Math.sqrt(words)));
}

export function quietLabel(days: number) {
    const months = Math.round(days / 30.44);
    return {
        months,
        label: `quiet · ${months} ${months === 1 ? "month" : "months"}`,
    };
}

/**
 * Beeswarm against a baseline: each mark keeps its x and takes the lowest
 * height that clears everything already placed. The candidates are resting
 * on the baseline or resting on a neighbour; the highest candidate always
 * clears, so the search always lands.
 */
function stack(items: { px: number; r: number }[]) {
    const placed: { px: number; y: number; r: number }[] = [];
    return items.map(({ px, r }) => {
        const candidates = [r];
        for (const p of placed) {
            const reach = r + p.r + GAP;
            const dx = Math.abs(px - p.px);
            if (dx < reach) {
                const dy = Math.sqrt(reach * reach - dx * dx);
                candidates.push(p.y + dy, p.y - dy);
            }
        }
        const y = candidates
            .filter((c) => c >= r)
            .sort((a, b) => a - b)
            .find((c) =>
                placed.every(
                    (p) =>
                        Math.hypot(px - p.px, c - p.y) >= r + p.r + GAP - 0.01,
                ),
            )!;
        placed.push({ px, y, r });
        return y;
    });
}

const INITIALS = "JFMAMJJASOND";

export function buildTimeline(posts: TimelinePost[], todayIso: string) {
    const oldestFirst = [...posts].sort((a, b) =>
        a.publishedAt < b.publishedAt ? -1 : 1,
    );
    const first = oldestFirst[0];
    const last = oldestFirst[oldestFirst.length - 1];

    const start = dayOf(`${first.publishedAt.slice(0, 7)}-01`);
    const end = Math.max(dayOf(todayIso), dayOf(last.publishedAt) + 1);
    const xOf = (day: number) => (day - start) / (end - start);

    const sized = oldestFirst.map((post) => {
        const x = xOf(dayOf(post.publishedAt));
        const d = diameter(post.words);
        return { post, x, d, px: x * SOLVE_WIDTH, r: d / 2 };
    });
    const solutions = SOLVE_WIDTHS.map((width) =>
        stack(sized.map(({ x, r }) => ({ px: x * width, r }))),
    );
    const marks: Mark[] = sized.map(({ post, x, d }, i) => ({
        ...post,
        x,
        ys: solutions.map((ys) => ys[i]),
        d,
        side: x < 0.6 ? "right" : "left",
    }));
    /** Tallest stack at each solve width. */
    const heights = solutions.map((ys) =>
        Math.max(...sized.map(({ r }, i) => ys[i] + r)),
    );

    // How far the marks around a point reach past it, in px at the narrowest
    // width, so a gap label can sit clear of them. Wider, they reach less.
    const reachRight = (px: number) =>
        Math.max(
            0,
            ...sized.filter((s) => s.px <= px).map((s) => s.px + s.r - px),
        );
    const reachLeft = (px: number) =>
        Math.max(
            0,
            ...sized.filter((s) => s.px >= px).map((s) => px - (s.px - s.r)),
        );

    const quiet: Quiet[] = [];
    for (let i = 1; i < sized.length; i++) {
        const a = sized[i - 1];
        const b = sized[i];
        const days = dayOf(b.post.publishedAt) - dayOf(a.post.publishedAt);
        if (days <= QUIET_DAYS) continue;
        quiet.push({
            x0: a.x,
            x1: b.x,
            clearLeft: reachRight(a.px) + 8,
            clearRight: reachLeft(b.px) + 8,
            days,
            label: quietLabel(days).label,
        });
    }

    const months: MonthBand[] = [];
    const firstMonth = new Date(start * DAY);
    const cursor = new Date(firstMonth);
    while (cursor.getTime() / DAY < end) {
        const y = cursor.getUTCFullYear();
        const m = cursor.getUTCMonth();
        const x0 = xOf(Date.UTC(y, m, 1) / DAY);
        const x1 = Math.min(1, xOf(Date.UTC(y, m + 1, 1) / DAY));
        months.push({
            x0,
            x1,
            initial: INITIALS[m],
            year: m === 0 || months.length === 0 ? String(y) : undefined,
            labelled: (x1 - x0) * SOLVE_WIDTH >= 14,
        });
        cursor.setUTCMonth(m + 1);
    }

    // Phone: newest first, like the archive. Time still sets the rhythm —
    // posts days apart sit close, a month apart sit further — but the long
    // silences fold into a labelled break rather than a screen of empty rail.
    const newestFirst = [...marks].reverse();
    const phone: PhoneItem[] = [];
    newestFirst.forEach((mark, i) => {
        const prev = newestFirst[i - 1];
        const days = prev
            ? dayOf(prev.publishedAt) - dayOf(mark.publishedAt)
            : dayOf(todayIso) - dayOf(mark.publishedAt);
        if (prev && days > QUIET_DAYS) {
            phone.push({
                kind: "quiet",
                key: `quiet-${mark.slug}`,
                ...quietLabel(days),
            });
        }
        if (!prev || prev.year !== mark.year) {
            phone.push({ kind: "year", key: mark.year, year: mark.year });
        }
        phone.push({
            kind: "post",
            key: mark.slug,
            mark,
            space: days > QUIET_DAYS ? 0 : Math.min(40, Math.round(days * 0.8)),
        });
    });

    const years: YearTally[] = [];
    for (const mark of marks) {
        let tally = years.find((t) => t.year === mark.year);
        if (!tally) {
            tally = { year: mark.year, posts: [], words: 0, minutes: 0 };
            years.push(tally);
        }
        tally.posts.push(mark);
        tally.words += mark.words;
    }
    for (const tally of years) tally.minutes = Math.round(tally.words / WPM);

    const totalWords = marks.reduce((sum, m) => sum + m.words, 0);

    return {
        marks,
        heights,
        quiet,
        months,
        phone,
        years,
        total: {
            posts: marks.length,
            words: totalWords,
            minutes: Math.round(totalWords / WPM),
        },
        firstMonth: firstMonth.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
        }),
    };
}

export type Timeline = ReturnType<typeof buildTimeline>;
