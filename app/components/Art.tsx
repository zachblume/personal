/**
 * Procedural per-article artwork.
 *
 * Everything is derived deterministically from the post slug, so each article
 * gets a stable, unique monochrome composition and there are no image assets
 * to manage. Colors come from the `--art-*` custom properties in global.css,
 * so one SVG covers both light and dark mode.
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

type Ink = {
    bg: string;
    /** darkest → lightest in light mode; `.dark` inverts the ramp in CSS */
    ramp: string[];
};

const INK: Ink = {
    bg: "var(--art-bg)",
    ramp: [
        "var(--art-0)",
        "var(--art-1)",
        "var(--art-2)",
        "var(--art-3)",
        "var(--art-4)",
        "var(--art-5)",
    ],
};

type Draw = (r: () => number, ink: Ink) => React.ReactNode;

/** Concentric rings, cropped by the frame. */
const rings: Draw = (r, ink) => {
    const cx = 30 + r() * 100;
    const cy = 10 + r() * 80;
    const count = 7 + Math.floor(r() * 7);
    const step = 5 + r() * 6;
    const solid = Math.floor(r() * count);
    return (
        <g>
            {Array.from({ length: count }, (_, i) => {
                const radius = step * (i + 1);
                return i === solid ? (
                    <circle
                        key={i}
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill={ink.ramp[1]}
                    />
                ) : (
                    <circle
                        key={i}
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill="none"
                        stroke={ink.ramp[i > solid ? 3 : 2]}
                        strokeWidth={i > solid ? 0.6 : 1}
                    />
                );
            })}
        </g>
    );
};

/** Topographic contour lines. */
const topo: Draw = (r, ink) => {
    const count = 9 + Math.floor(r() * 7);
    const amp = 6 + r() * 12;
    const freq = 0.02 + r() * 0.035;
    const phase = r() * 6;
    const drift = -3 + r() * 6;
    return (
        <g fill="none">
            {Array.from({ length: count }, (_, i) => {
                const base = (H / (count - 1)) * i;
                const squash = 1 - Math.abs(i / (count - 1) - 0.5) * 1.2;
                const pts: string[] = [];
                for (let x = -4; x <= W + 4; x += 4) {
                    const y =
                        base +
                        Math.sin(x * freq + phase + i * 0.4) * amp * squash +
                        (x / W) * drift * i * 0.3;
                    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
                }
                return (
                    <polyline
                        key={i}
                        points={pts.join(" ")}
                        stroke={ink.ramp[i % 2 ? 3 : 2]}
                        strokeWidth={i % 3 === 0 ? 1 : 0.55}
                    />
                );
            })}
        </g>
    );
};

/** Vertical bars stepping through the grey ramp. */
const bars: Draw = (r, ink) => {
    const count = 14 + Math.floor(r() * 16);
    const gap = 1.2;
    const w = (W - gap * (count - 1)) / count;
    const skew = r() * Math.PI;
    return (
        <g>
            {Array.from({ length: count }, (_, i) => {
                const t = i / (count - 1);
                const h =
                    H *
                    (0.18 +
                        0.78 * Math.abs(Math.sin(skew + t * 3.1 + r() * 0.4)));
                return (
                    <rect
                        key={i}
                        x={i * (w + gap)}
                        y={H - h}
                        width={w}
                        height={h}
                        fill={ink.ramp[1 + (i % 4)]}
                    />
                );
            })}
        </g>
    );
};

/** Fan of rays from an off-canvas focal point. */
const mesh: Draw = (r, ink) => {
    const fx = W * (0.2 + r() * 0.6);
    const below = r() < 0.5;
    const fy = below ? -18 - r() * 18 : H + 18 + r() * 18;
    const count = 26 + Math.floor(r() * 22);
    /* Rays are aimed across a span wider than the frame so the fan fills it. */
    const spread = W * 1.8;
    return (
        <g>
            {Array.from({ length: count }, (_, i) => {
                const x = fx - spread / 2 + (spread / (count - 1)) * i;
                return (
                    <line
                        key={i}
                        x1={fx}
                        y1={fy}
                        x2={x}
                        y2={below ? H + 12 : -12}
                        stroke={ink.ramp[2 + (i % 3)]}
                        strokeWidth={i % 4 === 0 ? 0.9 : 0.45}
                    />
                );
            })}
        </g>
    );
};

/** Nested rectangles drifting off-frame. */
const blocks: Draw = (r, ink) => {
    const count = 7 + Math.floor(r() * 4);
    const dx = -9 + r() * 18;
    const dy = -6 + r() * 12;
    const x0 = 18 + r() * 40;
    const y0 = 14 + r() * 30;
    const step = 11 + r() * 7;
    return (
        <g>
            {Array.from({ length: count }, (_, i) => {
                /* Drawn largest-first so the solid core lands on top. */
                const j = count - 1 - i;
                const size = 16 + j * step;
                return (
                    <rect
                        key={i}
                        x={x0 + dx * j - size * 0.65}
                        y={y0 + dy * j - size * 0.5}
                        width={size * 1.3}
                        height={size}
                        fill={j === 0 ? ink.ramp[0] : "none"}
                        stroke={j === 0 ? "none" : ink.ramp[1 + (j % 4)]}
                        strokeWidth={j < 3 ? 1 : 0.6}
                    />
                );
            })}
        </g>
    );
};

/** Dot matrix with a radial falloff. */
const dots: Draw = (r, ink) => {
    const cols = 24;
    const rows = 15;
    const cx = r() * cols;
    const cy = r() * rows;
    const reach = 8 + r() * 10;
    return (
        <g>
            {Array.from({ length: cols * rows }, (_, i) => {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const d = Math.hypot(col - cx, (row - cy) * 1.4);
                const t = Math.max(0, 1 - d / reach);
                if (t < 0.04) return null;
                return (
                    <circle
                        key={i}
                        cx={(col + 0.5) * (W / cols)}
                        cy={(row + 0.5) * (H / rows)}
                        r={0.6 + t * 2.6}
                        fill={ink.ramp[Math.min(5, Math.floor((1 - t) * 6))]}
                    />
                );
            })}
        </g>
    );
};

/** A single wide arc sweep, like a horizon. */
const sweep: Draw = (r, ink) => {
    const count = 4 + Math.floor(r() * 4);
    const cy = H * (0.9 + r() * 0.6);
    const base = 40 + r() * 40;
    return (
        <g fill="none">
            <rect width={W} height={H} fill={ink.ramp[5]} />
            {Array.from({ length: count }, (_, i) => (
                <circle
                    key={i}
                    cx={W / 2 + (-20 + r() * 40)}
                    cy={cy}
                    r={base + i * (10 + r() * 14)}
                    stroke={ink.ramp[1 + (i % 3)]}
                    strokeWidth={i === 0 ? 1.4 : 0.7}
                />
            ))}
            <circle
                cx={W * (0.2 + r() * 0.6)}
                cy={H * (0.15 + r() * 0.3)}
                r={5 + r() * 9}
                fill={ink.ramp[0]}
            />
        </g>
    );
};

const DRAWINGS: Draw[] = [rings, topo, bars, mesh, blocks, dots, sweep];

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

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid slice"
            className={className}
            aria-hidden
        >
            <rect width={W} height={H} fill={INK.bg} />
            {draw(r, INK)}
        </svg>
    );
}
