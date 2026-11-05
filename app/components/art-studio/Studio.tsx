"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { CYCLE, degrees, JITTER } from "app/components/art-studio/cycle";
import styles from "app/components/art-studio/studio.module.css";
import {
    gridArt,
    presetArt,
    PRESETS,
    previewArt,
    type Preset,
} from "app/components/art-studio/tiles";
import {
    Art,
    artParams,
    COMPOSITIONS,
    HUE_OFFSETS,
    HUE_STEP,
} from "app/components/Art";
import { Link } from "app/components/Link";
import { slugify } from "app/lib/slugify";

export type StudioPost = {
    slug: string;
    title: string;
    artIndex: number;
    /** Its tile, drawn on the server (see tiles.tsx). */
    art: React.ReactNode;
};

/** The opening seed and index, with their art drawn on the server. */
export type StudioOpening = {
    seed: string;
    index: number;
    preview: React.ReactNode;
    /** One per composition, for the block of twelve `index` falls in. */
    grid: React.ReactNode[];
    /** One per entry in PRESETS. */
    presets: React.ReactNode[];
};

type Palette = "site" | "light" | "dark";
type Format = "svg" | "png";

const WORDS = [
    "lantern",
    "meridian",
    "harbor",
    "ember",
    "atlas",
    "tundra",
    "sonnet",
    "orchard",
    "basalt",
    "willow",
    "comet",
    "estuary",
    "saffron",
    "glacier",
    "parallax",
    "cinder",
    "halcyon",
    "juniper",
    "monsoon",
    "obsidian",
    "prairie",
    "quartz",
    "solstice",
    "thimble",
    "umber",
    "vellum",
    "zephyr",
];

const PALETTES: { value: Palette; label: string }[] = [
    { value: "site", label: "Site" },
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
];

const LABEL =
    "text-[12px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500";
const MONO = "font-[family-name:var(--font-geist-mono)]";
const NOTE =
    "text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400";
const FOCUS =
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-white";
const INLINE_LINK = `text-neutral-900 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-900 dark:text-neutral-100 dark:decoration-neutral-700 dark:hover:decoration-white ${FOCUS}`;
const BUTTON = `rounded-md border border-neutral-200 text-neutral-700 transition-colors hover:border-neutral-400 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:text-white ${FOCUS}`;

const pad = (n: number) => String(n).padStart(2, "0");

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
    const query = window.matchMedia(REDUCED_MOTION);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
}

function useReducedMotion() {
    return useSyncExternalStore(
        subscribeReducedMotion,
        () => window.matchMedia(REDUCED_MOTION).matches,
        () => false,
    );
}

/**
 * A standalone SVG file of <Art literal>. Rendered into a detached node
 * rather than read off the page: a literal copy in the document would share
 * gradient ids with the hue walk's tile for the same slug and index, and pick
 * up whichever variable-colored defs came first.
 */
function svgFile(slug: string, index: number, width: number, height: number) {
    const host = document.createElement("div");
    const root = createRoot(host);
    flushSync(() => {
        root.render(
            <Art
                slug={slug}
                index={index}
                width={width}
                height={height}
                literal
            />,
        );
    });
    const svg = host.querySelector("svg");
    if (!svg) throw new Error("Art rendered nothing");
    svg.removeAttribute("class");
    svg.removeAttribute("aria-hidden");
    let markup = new XMLSerializer().serializeToString(svg);
    root.unmount();
    if (!/^<svg[^>]*\sxmlns=/.test(markup)) {
        markup = markup.replace(
            "<svg",
            '<svg xmlns="http://www.w3.org/2000/svg"',
        );
    }
    return `<?xml version="1.0" encoding="UTF-8"?>\n${markup}\n`;
}

/** SVG → <img> → canvas → PNG, all in the browser. */
async function pngFile(markup: string, width: number, height: number) {
    const url = URL.createObjectURL(
        new Blob([markup], { type: "image/svg+xml" }),
    );
    try {
        const image = new Image(width, height);
        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = reject;
            image.src = url;
        });
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("No 2D canvas");
        context.drawImage(image, 0, 0, width, height);
        return await new Promise<Blob>((resolve, reject) =>
            canvas.toBlob(
                (blob) => (blob ? resolve(blob) : reject(new Error("No PNG"))),
                "image/png",
            ),
        );
    } finally {
        URL.revokeObjectURL(url);
    }
}

async function exportArt(
    seed: string,
    index: number,
    preset: Preset,
    format: Format,
) {
    const markup = svgFile(seed, index, preset.width, preset.height);
    const blob =
        format === "svg"
            ? new Blob([markup], { type: "image/svg+xml" })
            : await pngFile(markup, preset.width, preset.height);
    const filename = `${slugify(seed) || "art"}-${index}-${preset.width}x${preset.height}.${format}`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    // Revoking straight away can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return filename;
}

export function Studio({
    posts,
    opening,
}: {
    posts: StudioPost[];
    opening: StudioOpening;
}) {
    const [seed, setSeed] = useState(opening.seed);
    const [index, setIndex] = useState(opening.index);
    const [palette, setPalette] = useState<Palette>("site");
    const [animate, setAnimate] = useState(false);
    const [busy, setBusy] = useState<string | null>(null);
    const [status, setStatus] = useState("");
    const reducedMotion = useReducedMotion();
    const ids = useId();

    const max = Math.max(CYCLE, posts.length) - 1;
    const { composition, h, h2 } = artParams(seed, index);
    const block = index - (index % COMPOSITIONS.length);
    const match = posts.find((post) => post.slug === seed);
    const running = animate && !reducedMotion;

    // Use the server's drawings while they still show the current state;
    // see tiles.tsx for why the client can't draw the first frame itself.
    const atOpening = seed === opening.seed && index === opening.index;
    const openingBlock =
        seed === opening.seed &&
        block === opening.index - (opening.index % COMPOSITIONS.length);
    const ramp =
        palette === "light"
            ? styles.lightRamp
            : palette === "dark"
              ? styles.darkRamp
              : "";

    const roll = () => {
        const options = WORDS.filter((word) => word !== seed);
        setSeed(options[Math.floor(Math.random() * options.length)]);
    };

    const download = (preset: Preset, format: Format) => {
        setBusy(`${preset.name}-${format}`);
        setStatus("");
        exportArt(seed, index, preset, format)
            .then(
                (filename) => setStatus(`Saved ${filename}.`),
                () =>
                    setStatus(
                        `Couldn’t make the ${format.toUpperCase()} in this browser.`,
                    ),
            )
            .then(() => setBusy(null));
    };

    // Sized for the reading column: one bordered figure, the preview on top
    // and each part under a hairline. Text blocks are divs and the parts are
    // labelled groups, not headings, so `.prose` styles and the outline leave
    // them alone.
    return (
        <figure
            aria-label="Art studio"
            className={`${styles.embed} ${ramp} my-10 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800`}
        >
            <div className={running ? styles.animate : ""}>
                {atOpening ? opening.preview : previewArt(seed, index)}
            </div>

            <div className="grid gap-x-8 gap-y-6 border-t border-neutral-200 p-5 sm:grid-cols-2 dark:border-neutral-800">
                <div>
                    <label htmlFor={`${ids}-seed`} className={LABEL}>
                        Seed
                    </label>
                    <div className="mt-2 flex">
                        <input
                            id={`${ids}-seed`}
                            type="text"
                            value={seed}
                            onChange={(event) => setSeed(event.target.value)}
                            spellCheck={false}
                            autoComplete="off"
                            autoCapitalize="off"
                            className={`${MONO} h-9 min-w-0 flex-1 rounded-l-md border border-neutral-200 bg-transparent px-3 text-[13px] text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-800 dark:text-neutral-100 dark:focus:border-neutral-400`}
                        />
                        <button
                            type="button"
                            onClick={roll}
                            aria-label="Random word"
                            title="Random word"
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-l-none border-l-0 ${BUTTON}`}
                        >
                            <DiceIcon />
                        </button>
                    </div>
                    <div className={`mt-2 ${NOTE}`}>
                        {match ? (
                            match.artIndex === index ? (
                                <>
                                    The artwork for{" "}
                                    <Link
                                        href={`/blog/${match.slug}`}
                                        className={INLINE_LINK}
                                    >
                                        {match.title}
                                    </Link>
                                    .
                                </>
                            ) : (
                                <>
                                    A post’s slug; its own artwork is at index{" "}
                                    {match.artIndex}.{" "}
                                    <button
                                        type="button"
                                        onClick={() => setIndex(match.artIndex)}
                                        className={INLINE_LINK}
                                    >
                                        Go there
                                    </button>
                                </>
                            )
                        ) : (
                            <>
                                Any string works. A post’s slug at its own index
                                reproduces that post’s artwork.
                            </>
                        )}
                    </div>
                </div>

                <div>
                    <div className="flex items-baseline justify-between">
                        <label htmlFor={`${ids}-index`} className={LABEL}>
                            Index
                        </label>
                        <output
                            htmlFor={`${ids}-index`}
                            className={`${MONO} text-[13px] tabular-nums text-neutral-900 dark:text-neutral-100`}
                        >
                            {pad(index)}
                        </output>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIndex(index - 1)}
                            disabled={index === 0}
                            aria-label="Previous index"
                            className={`h-8 w-8 shrink-0 text-[15px] ${BUTTON}`}
                        >
                            −
                        </button>
                        <input
                            id={`${ids}-index`}
                            type="range"
                            min={0}
                            max={max}
                            step={1}
                            value={index}
                            onChange={(event) =>
                                setIndex(Number(event.target.value))
                            }
                            aria-valuetext={`${index}, ${composition.name}`}
                            className={`h-8 min-w-0 flex-1 cursor-pointer rounded-sm accent-neutral-900 dark:accent-neutral-100 ${FOCUS}`}
                        />
                        <button
                            type="button"
                            onClick={() => setIndex(index + 1)}
                            disabled={index === max}
                            aria-label="Next index"
                            className={`h-8 w-8 shrink-0 text-[15px] ${BUTTON}`}
                        >
                            +
                        </button>
                    </div>
                    <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-[13px]">
                        <dt className="text-neutral-500 dark:text-neutral-400">
                            Composition
                        </dt>
                        <dd className="text-neutral-900 dark:text-neutral-100">
                            {composition.name}
                        </dd>
                        <dt className="text-neutral-500 dark:text-neutral-400">
                            Hues
                        </dt>
                        <dd
                            className={`${MONO} tabular-nums text-neutral-900 dark:text-neutral-100`}
                        >
                            {degrees(h)} / {degrees(h2)}
                        </dd>
                    </dl>
                </div>

                <fieldset>
                    <legend className={LABEL}>Palette</legend>
                    <div className="mt-2 grid grid-cols-3 gap-0.5 rounded-md border border-neutral-200 p-0.5 dark:border-neutral-800">
                        {PALETTES.map((option) => (
                            <label key={option.value}>
                                <input
                                    type="radio"
                                    name={`${ids}-palette`}
                                    value={option.value}
                                    checked={palette === option.value}
                                    onChange={() => setPalette(option.value)}
                                    className="peer sr-only"
                                />
                                <span className="block cursor-pointer rounded-[5px] py-1.5 text-center text-[13px] text-neutral-500 transition-colors peer-checked:bg-neutral-900 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-neutral-900 dark:text-neutral-400 dark:peer-checked:bg-white dark:peer-checked:text-black dark:peer-focus-visible:outline-white">
                                    {option.label}
                                </span>
                            </label>
                        ))}
                    </div>
                    <div className={`mt-2 ${NOTE}`}>
                        For the artwork in this studio. Site follows the page’s
                        theme.
                    </div>
                </fieldset>

                <div className="flex items-start justify-between gap-6">
                    <div>
                        <span id={`${ids}-motion`} className={LABEL}>
                            Animate
                        </span>
                        <div className={`mt-1 ${NOTE}`}>
                            {reducedMotion
                                ? "Off: your system asks for reduced motion."
                                : "Runs the drift the archive plays on hover."}
                        </div>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={running}
                        aria-labelledby={`${ids}-motion`}
                        disabled={reducedMotion}
                        onClick={() => setAnimate(!animate)}
                        className={`group/switch relative mt-0.5 h-6 w-10 shrink-0 rounded-full border border-neutral-300 transition-colors aria-checked:border-neutral-900 aria-checked:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:aria-checked:border-white dark:aria-checked:bg-white ${FOCUS}`}
                    >
                        <span className="absolute left-[3px] top-[3px] h-4 w-4 rounded-full bg-neutral-900 transition-transform group-aria-checked/switch:translate-x-4 group-aria-checked/switch:bg-white motion-reduce:transition-none dark:bg-white dark:group-aria-checked/switch:bg-black" />
                    </button>
                </div>
            </div>

            <Part
                id={`${ids}-compositions`}
                title="Twelve compositions"
                note={`Indices ${block}–${block + COMPOSITIONS.length - 1} for this seed`}
            >
                <ul className="grid grid-cols-4 gap-x-3 gap-y-4 sm:grid-cols-6">
                    {COMPOSITIONS.map(({ name }, k) => {
                        const i = block + k;
                        const current = i === index;
                        return (
                            <li key={name}>
                                <button
                                    type="button"
                                    onClick={() => setIndex(i)}
                                    aria-pressed={current}
                                    aria-label={`Index ${i}, ${name}`}
                                    className={`group block w-full rounded-md text-left ${FOCUS}`}
                                >
                                    <Tile current={current}>
                                        {openingBlock
                                            ? opening.grid[k]
                                            : gridArt(seed, i)}
                                    </Tile>
                                    <span
                                        className={`mt-1.5 block truncate text-[11px] ${
                                            current
                                                ? "text-neutral-900 dark:text-white"
                                                : "text-neutral-500 dark:text-neutral-400"
                                        }`}
                                    >
                                        {name}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </Part>

            <Part
                id={`${ids}-walk`}
                title="The hue walk"
                note={`Every post, oldest first · ${HUE_STEP}° a step, ±${JITTER}°`}
            >
                <ol className="grid auto-cols-[3.25rem] grid-flow-col gap-2 overflow-x-auto pb-1 sm:auto-cols-fr sm:overflow-visible">
                    {posts.map((post) => {
                        const current =
                            post.slug === seed && post.artIndex === index;
                        return (
                            <li key={post.slug}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSeed(post.slug);
                                        setIndex(post.artIndex);
                                    }}
                                    aria-pressed={current}
                                    aria-label={`${post.title}, index ${post.artIndex}`}
                                    title={`${post.title} · ${degrees(artParams(post.slug, post.artIndex).h)}`}
                                    className={`group block w-full rounded-md text-left ${FOCUS}`}
                                >
                                    <Tile current={current}>{post.art}</Tile>
                                    <span
                                        className={`${MONO} mt-1.5 block text-[10px] tabular-nums ${
                                            current
                                                ? "text-neutral-900 dark:text-white"
                                                : "text-neutral-400 dark:text-neutral-500"
                                        }`}
                                    >
                                        {pad(post.artIndex)}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ol>
            </Part>

            <Part
                id={`${ids}-download`}
                title="Download"
                note="Cropped to each size; files use the light palette"
            >
                <ul className="grid grid-cols-3 gap-4">
                    {PRESETS.map((preset, n) => (
                        <li key={preset.name}>
                            <span className="flex h-20 items-end">
                                <span
                                    className="block h-full overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800"
                                    style={{
                                        aspectRatio: `${preset.width} / ${preset.height}`,
                                    }}
                                >
                                    {atOpening
                                        ? opening.presets[n]
                                        : presetArt(seed, index, preset)}
                                </span>
                            </span>
                            <span className="mt-2 block text-[12px] text-neutral-900 dark:text-neutral-100">
                                {preset.name}
                            </span>
                            <span
                                className={`${MONO} block text-[10px] tabular-nums text-neutral-400 dark:text-neutral-500`}
                            >
                                {preset.width} × {preset.height}
                            </span>
                            <span className="mt-2 flex gap-1.5">
                                {(["svg", "png"] as const).map((format) => (
                                    <button
                                        key={format}
                                        type="button"
                                        onClick={() => download(preset, format)}
                                        disabled={busy !== null}
                                        aria-label={`Download ${preset.name} ${format.toUpperCase()}`}
                                        className={`${MONO} h-7 flex-1 text-[11px] uppercase ${BUTTON}`}
                                    >
                                        {busy === `${preset.name}-${format}`
                                            ? "…"
                                            : format}
                                    </button>
                                ))}
                            </span>
                        </li>
                    ))}
                </ul>
                <div
                    role="status"
                    className={`${MONO} mt-3 min-h-4 text-[11px] text-neutral-500 dark:text-neutral-400`}
                >
                    {status}
                </div>
            </Part>
        </figure>
    );
}

function Tile({
    current,
    children,
}: {
    current: boolean;
    children: React.ReactNode;
}) {
    return (
        <span
            className={`block overflow-hidden rounded-md border ${
                current
                    ? "border-neutral-900 ring-1 ring-neutral-900 dark:border-white dark:ring-white"
                    : "border-neutral-200 dark:border-neutral-800"
            }`}
        >
            {children}
        </span>
    );
}

/** One part of the studio under a hairline, labelled for assistive tech. */
function Part({
    id,
    title,
    note,
    children,
}: {
    id: string;
    title: string;
    note: string;
    children: React.ReactNode;
}) {
    return (
        <div
            role="group"
            aria-labelledby={id}
            className="border-t border-neutral-200 p-5 dark:border-neutral-800"
        >
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <span id={id} className={LABEL}>
                    {title}
                </span>
                <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
                    {note}
                </span>
            </div>
            {children}
        </div>
    );
}

function DiceIcon() {
    return (
        <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.25}
            className="h-4 w-4"
            aria-hidden
        >
            <rect x="2.5" y="2.5" width="11" height="11" rx="2.5" />
            <g fill="currentColor" stroke="none">
                <circle cx="5.75" cy="5.75" r="0.95" />
                <circle cx="8" cy="8" r="0.95" />
                <circle cx="10.25" cy="10.25" r="0.95" />
            </g>
        </svg>
    );
}
