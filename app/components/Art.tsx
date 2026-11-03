/**
 * Procedural per-article artwork.
 *
 * Everything is derived deterministically from the post slug, so each article
 * gets a stable, unique composition and there are no image assets to manage.
 *
 * Color works in two halves. The slug picks a pair of hues, set as `--art-h`
 * and `--art-h2` inline on the <svg>; global.css turns those into the six-step
 * `--art-*` ramp with oklch(), which keeps chroma and lightness consistent
 * whatever the hue and lets `.dark` restate the ramp for dark mode. So each
 * post is a different duotone, but all of them share one tuned palette.
 *
 * The compositions lean on soft gradients, blur and overlapping translucent
 * shapes rather than flat fills — overlaps blend the two hues into colors
 * neither slot contains, which is most of what makes these read as artwork
 * instead of charts.
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

const C = [
    "var(--art-0)",
    "var(--art-1)",
    "var(--art-2)",
    "var(--art-3)",
    "var(--art-4)",
    "var(--art-5)",
];

type Ctx = {
    r: () => number;
    /** Namespaced so several <Art> on one page don't collide on gradient ids. */
    id: (name: string) => string;
};

type Draw = (ctx: Ctx) => React.ReactNode;

/** Soft blurred blob — the workhorse behind most of these. */
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

/** Drifting fields of color, mesh-gradient style. */
const aurora: Draw = ({ r, id }) => {
    const blur = `url(#${id("blur")})`;
    // Spread the pools around a ring rather than sampling positions freely —
    // four large blobs left to overlap in the middle just average out into a
    // flat wash, which is the whole failure mode of this composition.
    const spin = r() * Math.PI * 2;
    const blobs = Array.from({ length: 4 }, (_, i) => {
        const a = spin + (i * Math.PI) / 2 + (r() - 0.5) * 0.7;
        return {
            cx: W / 2 + Math.cos(a) * (38 + r() * 20),
            cy: H / 2 + Math.sin(a) * (26 + r() * 14),
            rx: 24 + r() * 14,
            ry: 20 + r() * 12,
            fill: C[[1, 3, 2, 0][i]],
            opacity: 0.8 + r() * 0.15,
        };
    });
    return (
        <g>
            {blobs.map((b, i) => (
                <Blob key={i} {...b} filter={blur} />
            ))}
        </g>
    );
};

/** A low sun behind soft bands. */
const halo: Draw = ({ r, id }) => {
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

/** Stacked smooth ridges, filled and overlapping. */
const dunes: Draw = ({ r, id }) => {
    const count = 4 + Math.floor(r() * 3);
    return (
        <g>
            {Array.from({ length: count }, (_, i) => {
                const t = i / count;
                const base = H * (0.3 + t * 0.62);
                const amp = 10 + r() * 16;
                const skew = r() * 60 - 30;
                const d = [
                    `M -10 ${base}`,
                    `C ${W * 0.22} ${base - amp} ${W * 0.42} ${base + amp * 0.7} ${W * 0.56} ${base - amp * 0.3 + skew * 0.1}`,
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
const orbs: Draw = ({ r, id }) => {
    const blur = `url(#${id("soft")})`;
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
                filter={blur}
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

/** Wide diagonal light, falling across the frame. */
const beams: Draw = ({ r, id }) => {
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

/** Dot field blooming out of one corner. */
const bloom: Draw = ({ r, id }) => {
    const blur = `url(#${id("soft")})`;
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
                filter={blur}
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

/** A single thick ribbon with round caps, over a soft field. */
const ribbon: Draw = ({ r, id }) => {
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

const DRAWINGS: Draw[] = [aurora, halo, dunes, orbs, beams, bloom, ribbon];

export function Art({
    slug,
    className = "",
}: {
    slug: string;
    className?: string;
}) {
    const seed = hash(slug);
    const r = rng(seed);
    const draw = DRAWINGS[seed % DRAWINGS.length];

    // Golden-angle stepping spreads consecutive seeds far apart on the wheel,
    // so neighbouring posts in the list never land on near-identical hues.
    const h = (seed * 137.508) % 360;
    const offset = [38, 62, 150, 196, -45, -72][seed % 6];
    const h2 = (h + offset + 360) % 360;

    const uid = seed.toString(36);
    const id = (name: string) => `art-${uid}-${name}`;
    const angle = Math.floor(r() * 360);

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid slice"
            className={`art ${className}`}
            style={
                {
                    "--art-h": h.toFixed(1),
                    "--art-h2": h2.toFixed(1),
                } as React.CSSProperties
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
                    <stop offset="0%" stopColor="var(--art-bg)" />
                    <stop offset="100%" stopColor={C[5]} />
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
            <rect width={W} height={H} fill={`url(#${id("bg")})`} />
            {draw({ r, id })}
        </svg>
    );
}
