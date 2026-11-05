import { HueWheel } from "app/colophon/HueWheel";
import { widestGap } from "app/colophon/hues";
import type { RampStep } from "app/colophon/sources";
import {
    FOCUS,
    Label,
    MONO,
    Prose,
    Section,
    TABLE,
    deg,
    ordinal,
    spell,
} from "app/colophon/ui";
import {
    artParams,
    COMPOSITIONS,
    HUE_OFFSETS,
    HUE_STEP,
} from "app/components/Art";
import type { Post } from "app/lib/posts";

/** Light value, dark value, what it does — from PostRow and SiteChrome. */
const INTERFACE = [
    { light: "white", dark: "black", role: "Ground" },
    { light: "neutral-50", dark: "neutral-900 at 60%", role: "Row hover" },
    { light: "neutral-200", dark: "neutral-800", role: "Hairline rules" },
    {
        light: "neutral-300",
        dark: "neutral-700",
        role: "Ordinals and chevrons at rest",
    },
    { light: "neutral-400", dark: "neutral-500", role: "Dates" },
    {
        light: "neutral-500",
        dark: "neutral-400",
        role: "Summaries and navigation",
    },
    { light: "neutral-900", dark: "neutral-100", role: "Titles" },
];

function chipColor(token: string, scale: Record<string, string>) {
    if (token === "white") return "#fff";
    if (token === "black") return "#000";
    const [, step, alpha] = token.match(/neutral-(\d+)(?: at (\d+)%)?/) ?? [];
    const value = scale[step];
    if (!value) return "transparent";
    // Over the dark ground, as the hover sits on the page.
    return alpha ? `color-mix(in oklab, ${value} ${alpha}%, #000)` : value;
}

function Chip({ color, label }: { color: string; label: string }) {
    return (
        <span
            className="block h-6 w-6 shrink-0 rounded-[4px] border border-neutral-300/70 dark:border-neutral-700/70"
            style={{ background: color }}
            title={label}
        />
    );
}

function rampColor(step: RampStep, h: number, h2: number) {
    return `oklch(${step.l} ${step.c} ${(step.hue === "h" ? h : h2).toFixed(1)})`;
}

/** One post's eight steps; a 2px gap of ground between them. */
function Strip({ steps, h, h2 }: { steps: RampStep[]; h: number; h2: number }) {
    return (
        <span className="flex gap-0.5 overflow-hidden rounded-[4px]">
            {steps.map((step) => (
                <span
                    key={step.name}
                    className="block h-7 flex-1"
                    style={{ background: rampColor(step, h, h2) }}
                    title={`--art-${step.name}: ${rampColor(step, h, h2)}`}
                />
            ))}
        </span>
    );
}

/**
 * A fixed light or dark specimen. Its ground deliberately ignores the site
 * theme — the point is to see both ramps whichever one the page is in. The
 * swatches are inline oklch() from the numbers parsed out of global.css,
 * because a light `.art` ramp can't be had under a `.dark` ancestor.
 */
function RampPanel({
    tone,
    steps,
    samples,
}: {
    tone: "light" | "dark";
    steps: RampStep[];
    samples: { post: Post; h: number; h2: number }[];
}) {
    const light = tone === "light";
    return (
        <figure
            className={`rounded-lg border p-4 ${
                light
                    ? "border-neutral-200 bg-white"
                    : "dark border-neutral-800 bg-black"
            }`}
        >
            <figcaption
                className={`${MONO} text-[11px] ${light ? "text-neutral-500" : "text-neutral-400"}`}
            >
                {light ? ".art" : ".dark .art"}
            </figcaption>
            <div
                aria-hidden
                className={`${MONO} mt-4 flex gap-0.5 text-[10px] ${light ? "text-neutral-400" : "text-neutral-500"}`}
            >
                {steps.map((s) => (
                    <span key={s.name} className="flex-1 truncate">
                        {s.name}
                    </span>
                ))}
            </div>
            <ul className="mt-1.5 space-y-3">
                {samples.map(({ post, h, h2 }) => (
                    <li key={post.slug}>
                        <Strip steps={steps} h={h} h2={h2} />
                        <p
                            className={`mt-1.5 truncate text-[12px] ${light ? "text-neutral-500" : "text-neutral-400"}`}
                        >
                            <span className={`${MONO} tabular-nums`}>
                                {ordinal(post.artIndex)}
                            </span>{" "}
                            {post.title}
                        </p>
                    </li>
                ))}
            </ul>
        </figure>
    );
}

export function ColorSection({
    posts,
    neutrals,
    ramp,
}: {
    posts: Post[];
    neutrals: Record<string, string>;
    ramp: { light: RampStep[]; dark: RampStep[] };
}) {
    const oldestFirst = [...posts].sort((a, b) => a.artIndex - b.artIndex);
    const hues = oldestFirst.map((post) => ({
        post,
        ...artParams(post.slug, post.artIndex),
    }));
    // The first, the middle and the newest: three corners of the wheel.
    const samples = [
        hues[0],
        hues[Math.floor(hues.length / 2)],
        hues[hues.length - 1],
    ].filter((s, i, all) => all.indexOf(s) === i);
    const widest = widestGap(hues.map((x) => x.h)).size;

    const inks = ramp.light.filter((s) => /^\d+$/.test(s.name));
    const tints = ramp.light.length - inks.length;
    const inksPerHue = inks.filter((s) => s.hue === "h").length;

    return (
        <Section id="color" numeral="II" title="Color">
            <Prose>
                <p>
                    The interface is black and white: a white or black ground,
                    with text and hairlines in Tailwind&rsquo;s neutral grays.
                    Dark mode isn&rsquo;t an inversion — each gray is chosen
                    again for the dark ground. The only color anywhere on the
                    site is the artwork.
                </p>
            </Prose>

            <div>
                <Label as="h3">Interface</Label>
                <table className={`${TABLE} mt-4 text-[13px]`}>
                    <thead className="sr-only">
                        <tr>
                            <th scope="col">Light</th>
                            <th scope="col">Dark</th>
                            <th scope="col">Used for</th>
                        </tr>
                    </thead>
                    <tbody>
                        {INTERFACE.map((row) => (
                            <tr
                                key={row.role}
                                className="border-t border-neutral-200 dark:border-neutral-800"
                            >
                                <td className="py-2.5 pr-4">
                                    <span className="flex items-center gap-2.5">
                                        <Chip
                                            color={chipColor(
                                                row.light,
                                                neutrals,
                                            )}
                                            label={`${row.light}: ${chipColor(row.light, neutrals)}`}
                                        />
                                        <span
                                            className={`${MONO} hidden text-[11px] text-neutral-500 sm:inline dark:text-neutral-400`}
                                        >
                                            {row.light}
                                        </span>
                                    </span>
                                </td>
                                <td className="py-2.5 pr-4">
                                    <span className="flex items-center gap-2.5">
                                        <Chip
                                            color={chipColor(
                                                row.dark,
                                                neutrals,
                                            )}
                                            label={`${row.dark}: ${chipColor(row.dark, neutrals)}`}
                                        />
                                        <span
                                            className={`${MONO} hidden text-[11px] text-neutral-500 sm:inline dark:text-neutral-400`}
                                        >
                                            {row.dark}
                                        </span>
                                    </span>
                                </td>
                                <td className="w-full py-2.5 text-neutral-900 dark:text-neutral-100">
                                    {row.role}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Prose>
                <p>
                    Each post gets two hues. The stylesheet expands them into
                    one fixed ramp: {tints} background tints and {inks.length}{" "}
                    inks, {inksPerHue} on each hue. The lightness and chroma of
                    every step are the same for every post, so a yellow post and
                    a blue one are equally loud. That&rsquo;s why the ramp is in{" "}
                    <code>oklch</code>: the same numbers in <code>hsl</code>{" "}
                    make the yellows glare and the blues go muddy.
                </p>
                <p>
                    The ramp is declared on <code>.art</code>, the element that
                    carries the hues, not on <code>:root</code>. A custom
                    property that contains <code>var()</code> resolves where
                    it&rsquo;s declared, so on <code>:root</code> it would
                    resolve against hues that aren&rsquo;t there and every tile
                    would draw black.
                </p>
            </Prose>

            <div>
                <Label as="h3">The ramp, from global.css</Label>
                <table
                    className={`${TABLE} mt-4 text-[12px] tabular-nums [&_td]:py-2 [&_th]:py-2`}
                >
                    <thead>
                        <tr className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                            <th scope="col" className="pr-4 font-normal">
                                Step
                            </th>
                            <th scope="col" className="pr-4 font-normal">
                                Hue
                            </th>
                            <th scope="col" className="pr-4 font-normal">
                                Light L / C
                            </th>
                            <th scope="col" className="font-normal">
                                Dark L / C
                            </th>
                        </tr>
                    </thead>
                    <tbody className={MONO}>
                        {ramp.light.map((step) => {
                            const dark = ramp.dark.find(
                                (d) => d.name === step.name,
                            );
                            return (
                                <tr
                                    key={step.name}
                                    className="border-t border-neutral-200 text-neutral-900 dark:border-neutral-800 dark:text-neutral-100"
                                >
                                    <th
                                        scope="row"
                                        className="pr-4 font-normal"
                                    >
                                        --art-{step.name}
                                    </th>
                                    <td className="pr-4 text-neutral-500 dark:text-neutral-400">
                                        {step.hue === "h" ? "first" : "second"}
                                    </td>
                                    <td className="pr-4">
                                        {step.l} / {step.c}
                                    </td>
                                    <td>
                                        {dark ? `${dark.l} / ${dark.c}` : "—"}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div>
                <Label as="h3">Three posts, both themes</Label>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <RampPanel
                        tone="light"
                        steps={ramp.light}
                        samples={samples}
                    />
                    <RampPanel
                        tone="dark"
                        steps={ramp.dark}
                        samples={samples}
                    />
                </div>
            </div>

            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
                <div className="order-2 lg:order-1">
                    <Label as="h3">Every post&rsquo;s two hues</Label>
                    <Prose>
                        <p className="mt-4">
                            First hues on the outer ring, second hues on the
                            inner. The first hue steps {deg(HUE_STEP)} a post,
                            coming round every {spell(COMPOSITIONS.length)}{" "}
                            posts in step with the compositions; a little jitter
                            from the slug keeps the run from reading as a color
                            wheel. The second sits at one of{" "}
                            {spell(HUE_OFFSETS.length)} offsets that cycle, from
                            near-analogous to near-complementary. The widest
                            stretch of the outer ring with no post in it is{" "}
                            {deg(widest)}.
                        </p>
                    </Prose>
                    <details className="mt-6 text-[13px]">
                        <summary
                            className={`cursor-pointer text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white ${FOCUS}`}
                        >
                            The wheel as a table
                        </summary>
                        <table
                            className={`${TABLE} mt-3 tabular-nums [&_td]:py-1.5 [&_th]:py-1.5`}
                        >
                            <thead>
                                <tr className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                                    <th
                                        scope="col"
                                        className="pr-3 font-normal"
                                    >
                                        #
                                    </th>
                                    <th
                                        scope="col"
                                        className="pr-3 font-normal"
                                    >
                                        Post
                                    </th>
                                    <th
                                        scope="col"
                                        className="pr-3 font-normal"
                                    >
                                        Shape
                                    </th>
                                    <th
                                        scope="col"
                                        className="pr-3 text-right font-normal"
                                    >
                                        First
                                    </th>
                                    <th
                                        scope="col"
                                        className="text-right font-normal"
                                    >
                                        Second
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {hues.map(({ post, h, h2, composition }) => (
                                    <tr
                                        key={post.slug}
                                        className="border-t border-neutral-200 text-neutral-900 dark:border-neutral-800 dark:text-neutral-100"
                                    >
                                        <td
                                            className={`${MONO} pr-3 text-[11px] text-neutral-400 dark:text-neutral-500`}
                                        >
                                            {ordinal(post.artIndex)}
                                        </td>
                                        <th
                                            scope="row"
                                            className="pr-3 font-normal"
                                        >
                                            {post.title}
                                        </th>
                                        <td
                                            className={`${MONO} pr-3 text-[11px] text-neutral-500 dark:text-neutral-400`}
                                        >
                                            {composition.name}
                                        </td>
                                        <td className="pr-3 text-right">
                                            {deg(h)}
                                        </td>
                                        <td className="text-right">
                                            {deg(h2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </details>
                </div>
                <div className="order-1 lg:order-2">
                    <HueWheel
                        points={hues.map(({ post, h, h2, composition }) => ({
                            ordinal: ordinal(post.artIndex),
                            title: post.title,
                            composition: composition.name,
                            h,
                            h2,
                        }))}
                        widest={widest}
                    />
                </div>
            </div>
        </Section>
    );
}
