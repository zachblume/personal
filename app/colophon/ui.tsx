import { PAD } from "app/components/SiteChrome";

export const MONO = "font-[family-name:var(--font-geist-mono)]";
export const SERIF = "font-[family-name:var(--font-editorial)]";

/**
 * A chapter of the colophon: its numeral and name in a narrow left column
 * that holds its place while the section scrolls, the content to the right.
 */
export function Section({
    id,
    numeral,
    title,
    children,
}: {
    id: string;
    numeral: string;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section
            id={id}
            aria-labelledby={`${id}-title`}
            className={`${PAD} border-t border-neutral-200 py-14 md:py-20 dark:border-neutral-800`}
        >
            <div className="grid gap-y-8 md:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] md:gap-x-12 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] lg:gap-x-16">
                <header className="md:sticky md:top-10 md:self-start">
                    <p
                        className={`${SERIF} text-[15px] text-neutral-400 dark:text-neutral-500`}
                    >
                        {numeral}
                    </p>
                    <h2
                        id={`${id}-title`}
                        className={`${SERIF} mt-1 text-[28px] leading-[1.15] tracking-[-0.025em] text-neutral-900 dark:text-white`}
                    >
                        {title}
                    </h2>
                </header>
                <div className="min-w-0 space-y-14">{children}</div>
            </div>
        </section>
    );
}

/**
 * global.css sets every heading inside the layout in Geist Serif with tight
 * tracking, unlayered, so it beats utilities. Small-caps labels that are
 * headings for structure opt back out with important utilities.
 */
export const LABEL_FACE =
    "font-[family-name:var(--font-geist-sans)]! tracking-wider!";

export function Label({
    children,
    as: As = "p",
    id,
}: {
    children: React.ReactNode;
    as?: "p" | "h3" | "figcaption";
    id?: string;
}) {
    return (
        <As
            id={id}
            className={`${LABEL_FACE} text-[12px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500`}
        >
            {children}
        </As>
    );
}

export function Prose({ children }: { children: React.ReactNode }) {
    return (
        <div className="max-w-[62ch] space-y-4 text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-300 [&_code]:font-[family-name:var(--font-geist-mono)] [&_code]:text-[13px] [&_code]:text-neutral-900 dark:[&_code]:text-neutral-100">
            {children}
        </div>
    );
}

/** The global stylesheet makes every table a scrolling block; these want to be tables. */
export const TABLE =
    "table! w-full! max-w-none! border-collapse whitespace-normal! text-left";

export const deg = (h: number) => `${Math.round(h)}°`;

const SMALL =
    "zero one two three four five six seven eight nine ten eleven twelve".split(
        " ",
    );

/** Small counts as words in prose, so they can come from the code. */
export const spell = (n: number) => SMALL[n] ?? String(n);

/** Monochrome focus ring for links and controls. */
export const FOCUS =
    "rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-white";

export const ordinal = (artIndex: number) =>
    String(artIndex + 1).padStart(2, "0");
