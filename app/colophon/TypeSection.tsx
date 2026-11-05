import { SITE } from "app/lib/site";
import type { Post } from "app/lib/posts";
import { Label, MONO, Prose, SERIF, Section } from "app/colophon/ui";

const FACES = [
    {
        name: "Geist Sans",
        font: "font-[family-name:var(--font-geist-sans)]",
        weights: "400, 500",
        role: "The interface and the prose.",
    },
    {
        name: "Geist Serif",
        font: SERIF,
        weights: "400 only",
        role: "The signature and every heading. It ships in one weight.",
    },
    {
        name: "Geist Mono",
        font: MONO,
        weights: "400, 500",
        role: "Code, and small labels like these.",
    },
];

/** The first fenced block in the archive that names its language. */
export function firstCodeSample(posts: Post[]) {
    const oldestFirst = [...posts].sort((a, b) =>
        a.publishedAt < b.publishedAt ? -1 : 1,
    );
    for (const post of oldestFirst) {
        const m = post.content.match(/```(\w+)[^\n]*\n([\s\S]*?)```/);
        if (m) {
            return {
                lang: m[1],
                lines: m[2].trimEnd().split("\n").slice(0, 6),
                post,
            };
        }
    }
    return undefined;
}

function Specimen({
    face,
    spec,
    use,
    children,
}: {
    face: string;
    spec: string;
    use: string;
    children: React.ReactNode;
}) {
    return (
        <li className="grid gap-x-8 gap-y-3 border-t border-neutral-200 py-7 lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] dark:border-neutral-800">
            <div>
                <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                    {face}
                </p>
                <p
                    className={`${MONO} mt-1 text-[11px] tabular-nums text-neutral-500 dark:text-neutral-400`}
                >
                    {spec}
                </p>
                <p className="mt-1 text-[13px] leading-snug text-neutral-500 dark:text-neutral-400">
                    {use}
                </p>
            </div>
            <div className="min-w-0 text-neutral-900 dark:text-white">
                {children}
            </div>
        </li>
    );
}

export function TypeSection({
    demo,
    row,
    dates,
    code,
}: {
    /** The post whose title, heading and opening line are set as specimens. */
    demo: Post;
    /** A post to set as an archive row. */
    row: Post;
    /** A few real dates, to set as a column. */
    dates: string[];
    code?: ReturnType<typeof firstCodeSample>;
}) {
    const opening = demo.text.replace(/\s+/g, " ").split(/(?<=[.!?])\s/)[0];
    const heading = demo.headings[0]?.text;

    return (
        <Section id="type" numeral="I" title="Type">
            <Prose>
                <p>
                    Three faces from one family, all from the <code>geist</code>{" "}
                    package, which bundles the font files with the site instead
                    of fetching them from a font service. Radix Themes sets the
                    font on its own wrapper, so the faces are assigned through
                    its tokens rather than on <code>&lt;html&gt;</code>, where
                    they would reach nothing visible.
                </p>
            </Prose>

            <ul className="grid gap-px overflow-hidden rounded-lg border border-neutral-200 bg-neutral-200 sm:grid-cols-3 dark:border-neutral-800 dark:bg-neutral-800">
                {FACES.map((face) => (
                    <li key={face.name} className="bg-white p-5 dark:bg-black">
                        <p
                            aria-hidden
                            className={`${face.font} text-[56px] leading-none tracking-[-0.03em] text-neutral-900 dark:text-white`}
                        >
                            Aa
                        </p>
                        <p className="mt-5 text-[14px] font-medium text-neutral-900 dark:text-neutral-100">
                            {face.name}
                        </p>
                        <p className="mt-1 text-[13px] leading-snug text-neutral-500 dark:text-neutral-400">
                            {face.role}
                        </p>
                        <p
                            className={`${MONO} mt-3 text-[11px] text-neutral-400 dark:text-neutral-500`}
                        >
                            Weights {face.weights}
                        </p>
                        <p
                            aria-hidden
                            className={`${face.font} mt-4 break-all text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400`}
                        >
                            ABCDEFGHIJKLMNOPQRSTUVWXYZ
                            abcdefghijklmnopqrstuvwxyz 0123456789 &amp;?!
                        </p>
                    </li>
                ))}
            </ul>

            <div>
                <Label as="h3">At the sizes the site sets them</Label>
                <ul className="mt-4 border-b border-neutral-200 dark:border-neutral-800">
                    <Specimen
                        face="Geist Serif"
                        spec="34–48px / 1.08 · −0.025em"
                        use="Article titles. The size follows the viewport, 4.5vw, between the two."
                    >
                        <p
                            className={`${SERIF} title text-[clamp(34px,4.5vw,48px)] leading-[1.08] tracking-[-0.025em]`}
                        >
                            {demo.title}
                        </p>
                    </Specimen>
                    {heading ? (
                        <Specimen
                            face="Geist Serif"
                            spec="28px / 1.2 · −0.025em"
                            use="Headings inside a post."
                        >
                            <p
                                className={`${SERIF} text-[28px] leading-[1.2] tracking-[-0.025em]`}
                            >
                                {heading}
                            </p>
                        </Specimen>
                    ) : null}
                    <Specimen
                        face="Geist Serif"
                        spec="18px · −0.035em"
                        use="The signature in the header."
                    >
                        <p
                            className={`${SERIF} text-[18px] tracking-[-0.035em]`}
                        >
                            {SITE.name}
                        </p>
                    </Specimen>
                    <Specimen
                        face="Geist Sans 500"
                        spec="22px / 1.375 · −0.015em"
                        use="Titles in the archive list; 19px on a phone."
                    >
                        <p className="text-[19px] font-medium leading-snug tracking-[-0.015em] md:text-[22px]">
                            {row.title}
                        </p>
                    </Specimen>
                    <Specimen
                        face="Geist Sans"
                        spec="16px / 1.625"
                        use="The body of a post."
                    >
                        <p className="max-w-xl text-[16px] leading-[1.625] text-neutral-800 dark:text-neutral-200">
                            {opening}
                        </p>
                    </Specimen>
                    {row.summary ? (
                        <Specimen
                            face="Geist Sans"
                            spec="14px"
                            use="Summaries under archive titles."
                        >
                            <p className="text-[14px] text-neutral-500 dark:text-neutral-400">
                                {row.summary}
                            </p>
                        </Specimen>
                    ) : null}
                    <Specimen
                        face="Geist Sans"
                        spec="13px · tabular figures"
                        use="Dates and navigation, so a column of dates lines up."
                    >
                        <ul className="text-[13px] leading-[1.7] tabular-nums text-neutral-400 dark:text-neutral-500">
                            {dates.map((date, i) => (
                                <li key={`${i}-${date}`}>{date}</li>
                            ))}
                        </ul>
                    </Specimen>
                    {code ? (
                        <Specimen
                            face="Geist Mono 500"
                            spec="14px / 1.5"
                            use={`Code blocks. This one is the first in “${code.post.title}”.`}
                        >
                            <pre
                                className={`${MONO} overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[14px] font-medium leading-[1.5] text-neutral-800 dark:border-white/[0.06] dark:bg-black/50 dark:text-neutral-100`}
                            >
                                {code.lines.join("\n")}
                            </pre>
                        </Specimen>
                    ) : null}
                    {code ? (
                        <Specimen
                            face="Geist Mono"
                            spec="12px"
                            use="The caption on a code block: its filename, or failing that its language."
                        >
                            <p
                                className={`${MONO} text-[12px] text-neutral-500 dark:text-neutral-400`}
                            >
                                {code.lang}
                            </p>
                        </Specimen>
                    ) : null}
                </ul>
            </div>
        </Section>
    );
}
