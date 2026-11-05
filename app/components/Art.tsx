/**
 * Procedural per-article artwork.
 *
 * Two inputs. `index` is the post's rank in *chronological* order (oldest = 0)
 * and drives everything that needs to be evenly spread — which composition it
 * gets and what hues. `slug` seeds a PRNG for the parameters inside a
 * composition, so two posts drawing the same shape still look unalike.
 *
 * Indexing chronologically rather than by display order matters: new posts
 * append to the end, so an existing post's artwork never changes when you
 * publish. Deriving either one from the hash instead looks tempting and
 * doesn't work — a hash gives no spacing guarantee, so compositions cluster
 * and hues pile up in one corner of the wheel.
 *
 * Color is a duotone. The two hues are set inline on the <svg> as --art-h and
 * --art-h2; global.css expands them into the --art-* ramp with oklch(), which
 * keeps chroma and lightness even across hues and lets `.dark` restate the
 * whole palette.
 *
 * To hand-author art for a post later, add `image:` to its frontmatter and
 * branch on it at the call site — the layout uses a 16:9 slot.
 */

const W = 160;
const H = 100;

/** FNV-1a — stable across builds, unlike anything hashing object identity. */
function hash(input: string) {
    let h = 2166136261;
    for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

/** mulberry32 */
function rng(seed: number) {
    let a = seed;
    return function next() {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** The ramp as CSS variables, resolved by `.art` in global.css. */
const VARS = {
    bg: "var(--art-bg)",
    bg2: "var(--art-bg2)",
    ramp: [
        "var(--art-0)",
        "var(--art-1)",
        "var(--art-2)",
        "var(--art-3)",
        "var(--art-4)",
        "var(--art-5)",
    ],
};

type Palette = typeof VARS;

/** oklch → sRGB hex, clamped rather than gamut-mapped. */
function oklch(l: number, c: number, h: number) {
    const a = c * Math.cos((h * Math.PI) / 180);
    const b = c * Math.sin((h * Math.PI) / 180);
    const L = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const M = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const S = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
    const linear = [
        4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
        -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
        -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
    ];
    return `#${linear
        .map((x) => {
            const v =
                x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
            return Math.round(Math.min(1, Math.max(0, v)) * 255)
                .toString(16)
                .padStart(2, "0");
        })
        .join("")}`;
}

/**
 * The light ramp from `.art` in global.css, computed to literal colors for
 * renderers that can't resolve CSS variables (the OG image). Keep the numbers
 * in step with the stylesheet.
 */
function literalPalette(h: number, h2: number): Palette {
    return {
        bg: oklch(0.88, 0.138, h),
        bg2: oklch(0.84, 0.152, h2),
        ramp: [
            oklch(0.47, 0.205, h),
            oklch(0.59, 0.225, h),
            oklch(0.71, 0.192, h),
            oklch(0.54, 0.225, h2),
            oklch(0.67, 0.2, h2),
            oklch(0.8, 0.15, h2),
        ],
    };
}

/**
 * How the drawing fills a fixed width × height box. Satori stretches an <svg>
 * to its box whatever preserveAspectRatio says, so the viewBox is cropped here
 * to what `xMidYMid slice` would show. A portrait box takes the drawing on its
 * side: a landscape composition centre-cropped to portrait loses half its
 * width, often including whatever it's centred on.
 */
function fit(width?: number, height?: number) {
    if (!width || !height) return { viewBox: `0 0 ${W} ${H}`, turn: false };
    const turn = height > width;
    const [dw, dh] = turn ? [H, W] : [W, H];
    const scale = Math.max(width / dw, height / dh);
    const w = width / scale;
    const h = height / scale;
    return { viewBox: `${(dw - w) / 2} ${(dh - h) / 2} ${w} ${h}`, turn };
}

type Ctx = {
    r: () => number;
    /** The six-step ramp: 0-2 primary hue, 3-5 secondary. */
    C: string[];
    /** Namespaced so several <Art> on one page don't collide on gradient ids. */
    id: (name: string) => string;
};

type Draw = (ctx: Ctx) => React.ReactNode;

function Blob({
    cx,
    cy,
    rx,
    ry,
    fill,
    opacity,
    filter,
}: {
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    fill: string;
    opacity: number;
    filter: string;
}) {
    return (
        <ellipse
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            fill={fill}
            opacity={opacity}
            filter={filter}
        />
    );
}

/** Pools of color around a ring. Kept apart — blobs free to pile up in the
 *  middle average out into a flat wash, which is this one's failure mode. */
const aurora: Draw = ({ r, id, C }) => {
    const blur = `url(#${id("blur")})`;
    const spin = r() * Math.PI * 2;
    return (
        <g>
            {Array.from({ length: 4 }, (_, i) => {
                const a = spin + (i * Math.PI) / 2 + (r() - 0.5) * 0.7;
                return (
                    <Blob
                        key={i}
                        cx={W / 2 + Math.cos(a) * (38 + r() * 20)}
                        cy={H / 2 + Math.sin(a) * (26 + r() * 14)}
                        rx={24 + r() * 14}
                        ry={20 + r() * 12}
                        fill={C[[1, 3, 2, 0][i]]}
                        opacity={0.8 + r() * 0.15}
                        filter={blur}
                    />
                );
            })}
        </g>
    );
};

/** A low sun behind concentric rings. */
const halo: Draw = ({ r, id, C }) => {
    const blur = `url(#${id("blur")})`;
    const cx = 30 + r() * 100;
    const cy = 30 + r() * 50;
    const count = 4 + Math.floor(r() * 3);
    const base = 10 + r() * 8;
    return (
        <g>
            <Blob
                cx={cx}
                cy={cy}
                rx={58}
                ry={44}
                fill={C[4]}
                opacity={0.45}
                filter={blur}
            />
            <circle cx={cx} cy={cy} r={base} fill={C[1]} />
            {Array.from({ length: count }, (_, i) => (
                <circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r={base + (i + 1) * (8 + r() * 7)}
                    fill="none"
                    stroke={C[i % 2 ? 1 : 3]}
                    strokeWidth={2.8 - i * 0.3}
                    opacity={0.9 - i * 0.08}
                />
            ))}
        </g>
    );
};

/** Stacked smooth ridges. */
const dunes: Draw = ({ r, id, C }) => {
    const count = 4 + Math.floor(r() * 3);
    return (
        <g>
            {Array.from({ length: count }, (_, i) => {
                const base = H * (0.3 + (i / count) * 0.62);
                const amp = 10 + r() * 16;
                const d = [
                    `M -10 ${base}`,
                    `C ${W * 0.22} ${base - amp} ${W * 0.42} ${base + amp * 0.7} ${W * 0.56} ${base - amp * 0.3}`,
                    `S ${W * 0.9} ${base - amp * 0.9} ${W + 10} ${base + 4}`,
                    `L ${W + 10} ${H + 10} L -10 ${H + 10} Z`,
                ].join(" ");
                return (
                    <path
                        key={i}
                        d={d}
                        fill={`url(#${id(`grad${i % 2}`)})`}
                        opacity={0.5 + i * 0.12}
                    />
                );
            })}
        </g>
    );
};

/** Overlapping translucent discs; the intersections make the palette. */
const orbs: Draw = ({ r, id, C }) => {
    const soft = `url(#${id("soft")})`;
    const count = 5 + Math.floor(r() * 3);
    return (
        <g>
            <Blob
                cx={W / 2}
                cy={H / 2}
                rx={80}
                ry={55}
                fill={C[5]}
                opacity={0.4}
                filter={soft}
            />
            {Array.from({ length: count }, (_, i) => (
                <circle
                    key={i}
                    cx={14 + r() * 132}
                    cy={12 + r() * 76}
                    r={13 + r() * 26}
                    fill={C[[1, 3, 2, 4, 0][i % 5]]}
                    opacity={0.55}
                />
            ))}
        </g>
    );
};

/** Wide diagonal light falling across the frame. */
const beams: Draw = ({ r, id, C }) => {
    const blur = `url(#${id("blur")})`;
    const count = 3 + Math.floor(r() * 3);
    const lean = -40 + r() * 80;
    return (
        <g>
            <Blob
                cx={r() * W}
                cy={r() * H}
                rx={70}
                ry={50}
                fill={C[4]}
                opacity={0.7}
                filter={blur}
            />
            {Array.from({ length: count }, (_, i) => {
                const x = -20 + (i + 0.5) * ((W + 40) / count) + r() * 14;
                const w = 10 + r() * 22;
                return (
                    <path
                        key={i}
                        d={`M ${x} -20 L ${x + w} -20 L ${x + w + lean} ${H + 20} L ${x + lean} ${H + 20} Z`}
                        fill={`url(#${id(`grad${i % 2}`)})`}
                        opacity={0.55}
                    />
                );
            })}
        </g>
    );
};

/** Dot field blooming out of a point. */
const bloom: Draw = ({ r, id, C }) => {
    const soft = `url(#${id("soft")})`;
    const cols = 22;
    const rows = 14;
    const cx = r() * cols;
    const cy = r() * rows;
    const reach = 10 + r() * 10;
    return (
        <g>
            <Blob
                cx={(cx / cols) * W}
                cy={(cy / rows) * H}
                rx={66}
                ry={50}
                fill={C[4]}
                opacity={0.6}
                filter={soft}
            />
            {Array.from({ length: cols * rows }, (_, i) => {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const d = Math.hypot(col - cx, (row - cy) * 1.5);
                const t = Math.max(0, 1 - d / reach);
                if (t < 0.06) return null;
                return (
                    <circle
                        key={i}
                        cx={(col + 0.5) * (W / cols)}
                        cy={(row + 0.5) * (H / rows)}
                        r={0.7 + t * 2.9}
                        fill={t > 0.55 ? C[1] : C[3]}
                        opacity={0.35 + t * 0.6}
                    />
                );
            })}
        </g>
    );
};

/** Thick flowing strokes with round caps. */
const ribbon: Draw = ({ r, id, C }) => {
    const blur = `url(#${id("blur")})`;
    const y = 30 + r() * 40;
    const sway = 18 + r() * 24;
    const count = 2 + Math.floor(r() * 2);
    return (
        <g>
            <Blob
                cx={30 + r() * 100}
                cy={20 + r() * 60}
                rx={62}
                ry={44}
                fill={C[4]}
                opacity={0.7}
                filter={blur}
            />
            {Array.from({ length: count }, (_, i) => (
                <path
                    key={i}
                    d={`M -12 ${y + i * 16} C ${W * 0.3} ${y - sway + i * 12} ${W * 0.62} ${y + sway + i * 20} ${W + 12} ${y - 6 + i * 14}`}
                    fill="none"
                    stroke={`url(#${id(`grad${i % 2}`)})`}
                    strokeWidth={9 - i * 2.5}
                    strokeLinecap="round"
                    opacity={0.9 - i * 0.2}
                />
            ))}
        </g>
    );
};

/** Wedges fanning out of one corner. */
const rays: Draw = ({ r, id, C }) => {
    const soft = `url(#${id("soft")})`;
    const corner = Math.floor(r() * 4);
    const ox = corner % 2 ? W + 10 : -10;
    const oy = corner < 2 ? -10 : H + 10;
    const count = 5 + Math.floor(r() * 4);
    const spread = Math.PI / 2;
    const start = Math.atan2(H / 2 - oy, W / 2 - ox) - spread / 2;
    return (
        <g>
            <Blob
                cx={ox}
                cy={oy}
                rx={90}
                ry={70}
                fill={C[4]}
                opacity={0.75}
                filter={soft}
            />
            {Array.from({ length: count }, (_, i) => {
                const a0 = start + (i / count) * spread;
                const a1 = a0 + (spread / count) * (0.45 + r() * 0.4);
                const L = 240;
                return (
                    <path
                        key={i}
                        d={`M ${ox} ${oy} L ${ox + Math.cos(a0) * L} ${oy + Math.sin(a0) * L} L ${ox + Math.cos(a1) * L} ${oy + Math.sin(a1) * L} Z`}
                        fill={`url(#${id(`grad${i % 2}`)})`}
                        opacity={0.5}
                    />
                );
            })}
        </g>
    );
};

/** Soft rounded tiles, fading across a diagonal. */
const mosaic: Draw = ({ r, id, C }) => {
    const cols = 7 + Math.floor(r() * 4);
    const rows = Math.max(3, Math.round(cols * 0.6));
    const cw = W / cols;
    const ch = H / rows;
    const dx = r();
    const dy = r();
    return (
        <g>
            <rect
                width={W}
                height={H}
                fill={`url(#${id("grad0")})`}
                opacity={0.35}
            />
            {Array.from({ length: cols * rows }, (_, i) => {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const t =
                    1 -
                    (Math.abs(col / cols - dx) + Math.abs(row / rows - dy)) /
                        1.6;
                if (t < 0.12) return null;
                const pad = 0.8 + (1 - t) * 2.4;
                return (
                    <rect
                        key={i}
                        x={col * cw + pad}
                        y={row * ch + pad}
                        width={cw - pad * 2}
                        height={ch - pad * 2}
                        rx={2.5}
                        fill={C[t > 0.62 ? 1 : t > 0.38 ? 3 : 2]}
                        opacity={0.25 + t * 0.7}
                    />
                );
            })}
        </g>
    );
};

/** Big offset circle outlines, like overlapping lenses. */
const lens: Draw = ({ r, id, C }) => {
    const soft = `url(#${id("soft")})`;
    const count = 3 + Math.floor(r() * 3);
    const cx = 40 + r() * 80;
    const cy = 20 + r() * 60;
    const step = 14 + r() * 14;
    return (
        <g>
            <Blob
                cx={cx}
                cy={cy}
                rx={72}
                ry={54}
                fill={C[5]}
                opacity={0.55}
                filter={soft}
            />
            {Array.from({ length: count }, (_, i) => (
                <circle
                    key={i}
                    cx={cx + (i - count / 2) * step}
                    cy={cy + (i % 2 ? step * 0.4 : -step * 0.3)}
                    r={26 + r() * 16}
                    fill={C[[1, 3, 2][i % 3]]}
                    opacity={0.4}
                />
            ))}
        </g>
    );
};

/** Arc segments sweeping around a point. */
const spiral: Draw = ({ r, id, C }) => {
    const soft = `url(#${id("soft")})`;
    const cx = 40 + r() * 80;
    const cy = 25 + r() * 50;
    const count = 5 + Math.floor(r() * 4);
    const turn = r() * Math.PI * 2;
    return (
        <g>
            <Blob
                cx={cx}
                cy={cy}
                rx={68}
                ry={52}
                fill={C[4]}
                opacity={0.6}
                filter={soft}
            />
            {Array.from({ length: count }, (_, i) => {
                const rad = 12 + i * (6 + r() * 5);
                const a0 = turn + i * 0.75;
                const a1 = a0 + 1.6 + r() * 1.2;
                const large = a1 - a0 > Math.PI ? 1 : 0;
                return (
                    <path
                        key={i}
                        d={`M ${cx + Math.cos(a0) * rad} ${cy + Math.sin(a0) * rad} A ${rad} ${rad} 0 ${large} 1 ${cx + Math.cos(a1) * rad} ${cy + Math.sin(a1) * rad}`}
                        fill="none"
                        stroke={C[i % 2 ? 1 : 3]}
                        strokeWidth={3.4 - i * 0.22}
                        strokeLinecap="round"
                        opacity={0.9 - i * 0.07}
                    />
                );
            })}
        </g>
    );
};

/** Thick diagonal bars with rounded ends. */
const stripes: Draw = ({ r, id, C }) => {
    const soft = `url(#${id("soft")})`;
    const count = 4 + Math.floor(r() * 4);
    const lean = r() < 0.5 ? -1 : 1;
    const gap = (W + 80) / count;
    return (
        <g>
            <Blob
                cx={r() * W}
                cy={r() * H}
                rx={76}
                ry={56}
                fill={C[5]}
                opacity={0.6}
                filter={soft}
            />
            {Array.from({ length: count }, (_, i) => {
                const x = -40 + i * gap + r() * 8;
                return (
                    <line
                        key={i}
                        x1={x}
                        y1={-6}
                        x2={x + lean * 46}
                        y2={H + 6}
                        stroke={C[[1, 3, 2, 4][i % 4]]}
                        strokeWidth={7 + r() * 11}
                        strokeLinecap="round"
                        opacity={0.5 + r() * 0.3}
                    />
                );
            })}
        </g>
    );
};

const DRAWINGS: Draw[] = [
    aurora,
    halo,
    dunes,
    orbs,
    beams,
    bloom,
    ribbon,
    rays,
    mosaic,
    lens,
    spiral,
    stripes,
];

/**
 * A full turn of the wheel spread across the composition set, so a post's
 * shape and its color advance together and neighbours differ in both.
 */
const HUE_STEP = 360 / DRAWINGS.length;

/** Offsets cycle so pairings range from analogous to near-complementary. */
const HUE_OFFSETS = [42, 165, 70, -52, 198, -78, 120, 32];

/** The duotone for a post. Draws from `r` first, so it must stay the PRNG's
 *  first call in Art. */
function pickHues(index: number, r: () => number) {
    // A half-step of jitter keeps the sequence from looking like a color wheel
    // without letting any two neighbours collide.
    const jitter = (r() - 0.5) * HUE_STEP * 0.5;
    const h = (index * HUE_STEP + jitter + 360) % 360;
    const h2 = (h + HUE_OFFSETS[index % HUE_OFFSETS.length] + 360) % 360;
    return { h, h2 };
}

/** A post's two artwork hues, for anything else that wants to match its art. */
export function artHues(slug: string, index: number) {
    return pickHues(index, rng(hash(slug)));
}

export function Art({
    slug,
    index = 0,
    className = "",
    literal = false,
    width,
    height,
}: {
    slug: string;
    /** Chronological rank of the post, oldest = 0. */
    index?: number;
    className?: string;
    /** Inline literal light-theme colors instead of CSS variables, for
     *  renderers without a stylesheet. */
    literal?: boolean;
    /** A fixed render size, for renderers that size the <svg> themselves.
     *  The drawing is cropped to it rather than stretched, and turned on its
     *  side if the box is portrait. */
    width?: number;
    height?: number;
}) {
    const seed = hash(slug);
    const r = rng(seed);
    const draw = DRAWINGS[index % DRAWINGS.length];
    const { h, h2 } = pickHues(index, r);

    const uid = `${seed.toString(36)}${index}`;
    const id = (name: string) => `art-${uid}-${name}`;
    const angle = Math.floor(r() * 360);
    const palette = literal ? literalPalette(h, h2) : VARS;
    const C = palette.ramp;
    const { viewBox, turn } = fit(width, height);

    const drawing = (
        <>
            <rect width={W} height={H} fill={`url(#${id("bg")})`} />
            {draw({ r, id, C })}
        </>
    );

    return (
        <svg
            viewBox={viewBox}
            preserveAspectRatio="xMidYMid slice"
            width={width}
            height={height}
            className={`art ${className}`}
            style={
                literal
                    ? undefined
                    : ({
                          "--art-h": h.toFixed(1),
                          "--art-h2": h2.toFixed(1),
                      } as React.CSSProperties)
            }
            aria-hidden
        >
            <defs>
                <linearGradient
                    id={id("grad0")}
                    gradientTransform={`rotate(${angle} 0.5 0.5)`}
                >
                    <stop offset="0%" stopColor={C[1]} />
                    <stop offset="100%" stopColor={C[3]} />
                </linearGradient>
                <linearGradient
                    id={id("grad1")}
                    gradientTransform={`rotate(${(angle + 90) % 360} 0.5 0.5)`}
                >
                    <stop offset="0%" stopColor={C[2]} />
                    <stop offset="100%" stopColor={C[4]} />
                </linearGradient>
                <linearGradient
                    id={id("bg")}
                    gradientTransform={`rotate(${(angle + 45) % 360} 0.5 0.5)`}
                >
                    <stop offset="0%" stopColor={palette.bg} />
                    <stop offset="100%" stopColor={palette.bg2} />
                </linearGradient>
                {/* Generous region so the blur isn't clipped at the edges. */}
                <filter
                    id={id("blur")}
                    x="-60%"
                    y="-60%"
                    width="220%"
                    height="220%"
                >
                    <feGaussianBlur stdDeviation="14" />
                </filter>
                <filter
                    id={id("soft")}
                    x="-60%"
                    y="-60%"
                    width="220%"
                    height="220%"
                >
                    <feGaussianBlur stdDeviation="20" />
                </filter>
            </defs>
            {turn ? (
                <g transform={`translate(${H} 0) rotate(90)`}>{drawing}</g>
            ) : (
                drawing
            )}
        </svg>
    );
}
