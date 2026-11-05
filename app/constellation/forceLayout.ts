/**
 * A small force-directed layout, run once on the server.
 *
 * Deterministic on purpose — seeded starts, a fixed number of steps, no
 * clock — so the positions the server renders are exactly the ones that
 * hydrate, and nothing settles in front of the reader.
 *
 * Each attempt is three passes. A Fruchterman–Reingold simulation in a unit
 * square gives the shape of the graph; the result is stretched to fill the
 * frame; then labels pick a side of their node and anything still colliding
 * is pushed apart, alternating until it's clean. A handful of seeds are tried
 * and the tidiest kept — label collisions first, then crossed edges, then
 * edges running under labels. It's a few milliseconds each.
 *
 * Labels are a fixed pixel size while the map scales, so they're measured at
 * the smallest scale the layout is shown at, where they're largest relative to
 * everything else. Anything clear there is clear at every larger size.
 */

export type Side = "right" | "left" | "below" | "above";

export type LayoutSpec = {
    width: number;
    height: number;
    /** Pixels per layout unit at the narrowest the frame renders. */
    minScale: number;
    /** Node radius range in layout units, smallest post to largest. */
    radius: [number, number];
    /** Label type, in px. */
    font: number;
    lineHeight: number;
    labelMax: number;
    maxLines: number;
    /** Space between a node and its label, in px. */
    gap: number;
    /** Clear space inside the edge of the frame, in layout units. */
    margin: number;
};

export type LayoutInput = {
    /** 0–1 per node; sets its radius. */
    sizes: number[];
    labels: string[];
    edges: { a: number; b: number; strength: number }[];
};

export type Placement = { x: number; y: number; r: number; side: Side };

/* Geist Sans advance widths for ASCII 32–126, in hundredths of an em. */
const WIDTHS =
    "25,21,35,48,63,80,62,18,27,27,43,56,20,42,20,48,66,38,62,61,62,63,59,52,60,59,30,30,54,54,54,56,91,67,68,70,69,60,59,70,71,27,60,64,58,88,74,74,65,73,67,64,55,69,67,94,61,58,54,35,46,35,43,56,25,55,60,55,60,56,40,59,58,24,26,59,27,88,58,57,60,60,38,52,39,57,54,82,58,54,54,39,26,39,52"
        .split(",")
        .map((w) => Number(w) / 100);

function textWidth(text: string, font: number) {
    let em = 0;
    for (const ch of text) {
        const code = ch.charCodeAt(0);
        em += code >= 32 && code < 127 ? WIDTHS[code - 32] : 0.6;
    }
    return em * font;
}

/** Greedy word wrap — the browser's, or a little wider. */
function measureLabel(text: string, spec: LayoutSpec) {
    const space = textWidth(" ", spec.font);
    const lines: number[] = [];
    let line = 0;
    for (const word of text.split(/\s+/)) {
        const w = textWidth(word, spec.font);
        if (line > 0 && line + space + w > spec.labelMax) {
            lines.push(line);
            line = w;
        } else {
            line = line > 0 ? line + space + w : w;
        }
    }
    lines.push(line);
    const count = Math.min(lines.length, spec.maxLines);
    const width = Math.min(spec.labelMax, Math.max(...lines.slice(0, count)));
    return { w: width, h: count * spec.lineHeight };
}

/** mulberry32 — the same PRNG the artwork uses. */
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

type Box = { x0: number; y0: number; x1: number; y1: number };

function overlap(a: Box, b: Box) {
    const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
    const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
    return w > 0 && h > 0 ? { w, h } : null;
}

type Point = { x: number; y: number };

const orient = (p: Point, q: Point, r: Point) =>
    Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));

/** Whether segments ab and cd properly cross. */
function intersects(a: Point, b: Point, c: Point, d: Point) {
    return (
        orient(a, b, c) * orient(a, b, d) < 0 &&
        orient(c, d, a) * orient(c, d, b) < 0
    );
}

const SIDES: Side[] = ["right", "left", "below", "above"];
/** Right reads most naturally; above least, since edges come in from there. */
const SIDE_COST: Record<Side, number> = {
    right: 0,
    left: 0.4,
    below: 1,
    above: 1.4,
};

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const SEEDS = 16;

export function layout(input: LayoutInput, spec: LayoutSpec): Placement[] {
    let best: { placements: Placement[]; score: number } | null = null;
    for (let seed = 1; seed <= SEEDS; seed++) {
        const attempt = attemptLayout(input, spec, seed);
        if (!best || attempt.score < best.score) best = attempt;
    }
    return best!.placements;
}

function attemptLayout(input: LayoutInput, spec: LayoutSpec, seed: number) {
    const { width: W, height: H, minScale, margin } = spec;
    const n = input.sizes.length;
    const rand = rng(seed);
    const r = input.sizes.map(
        (s) => spec.radius[0] + (spec.radius[1] - spec.radius[0]) * s,
    );
    const label = input.labels.map((text) => {
        const { w, h } = measureLabel(text, spec);
        return { w: w / minScale, h: h / minScale };
    });
    const gap = spec.gap / minScale;

    // 1. Shape. A sunflower spiral is an even start; the seed rotates it and
    //    jitters each point enough to break its symmetry.
    const turn = rand() * Math.PI * 2;
    const u: number[] = [];
    const v: number[] = [];
    for (let i = 0; i < n; i++) {
        const rad = 0.42 * Math.sqrt((i + 0.5) / n);
        const angle = turn + i * GOLDEN_ANGLE + rand() * 0.6;
        u.push(0.5 + rad * Math.cos(angle));
        v.push(0.5 + rad * Math.sin(angle));
    }

    const k = 0.8 * Math.sqrt(1 / n);
    const STEPS = 400;
    for (let step = 0; step < STEPS; step++) {
        const temperature = 0.08 * (1 - step / STEPS) + 0.002;
        const du = new Array(n).fill(0);
        const dv = new Array(n).fill(0);
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const x = u[i] - u[j];
                const y = v[i] - v[j];
                const d = Math.max(Math.hypot(x, y), 0.01);
                const f = (k * k) / d;
                du[i] += (x / d) * f;
                dv[i] += (y / d) * f;
                du[j] -= (x / d) * f;
                dv[j] -= (y / d) * f;
            }
        }
        for (const { a, b, strength } of input.edges) {
            const x = u[a] - u[b];
            const y = v[a] - v[b];
            const d = Math.max(Math.hypot(x, y), 0.01);
            const f = ((d * d) / k) * (0.4 + strength);
            du[a] -= (x / d) * f;
            dv[a] -= (y / d) * f;
            du[b] += (x / d) * f;
            dv[b] += (y / d) * f;
        }
        for (let i = 0; i < n; i++) {
            // Gravity, so loosely connected posts don't drift to the walls.
            du[i] += (0.5 - u[i]) * k * 1.2;
            dv[i] += (0.5 - v[i]) * k * 1.2;
            const d = Math.hypot(du[i], dv[i]);
            if (d > 0) {
                const move = Math.min(d, temperature);
                u[i] += (du[i] / d) * move;
                v[i] += (dv[i] / d) * move;
            }
        }
    }

    // 2. Stretch to the frame, leaving room for the biggest node.
    const minU = Math.min(...u);
    const maxU = Math.max(...u);
    const minV = Math.min(...v);
    const maxV = Math.max(...v);
    const inset = margin + spec.radius[1];
    const x = u.map(
        (p) => inset + ((p - minU) / (maxU - minU || 1)) * (W - 2 * inset),
    );
    const y = v.map(
        (p) => inset + ((p - minV) / (maxV - minV || 1)) * (H - 2 * inset),
    );

    // 3. Labels, and pushing apart whatever still collides.
    const side: Side[] = new Array(n).fill("right");

    const nodeBox = (i: number): Box => ({
        x0: x[i] - r[i] - 2,
        y0: y[i] - r[i] - 2,
        x1: x[i] + r[i] + 2,
        y1: y[i] + r[i] + 2,
    });
    const labelBox = (i: number, s: Side = side[i]): Box => {
        const { w, h } = label[i];
        const reach = r[i] + gap;
        switch (s) {
            case "right":
                return {
                    x0: x[i] + reach,
                    y0: y[i] - h / 2,
                    x1: x[i] + reach + w,
                    y1: y[i] + h / 2,
                };
            case "left":
                return {
                    x0: x[i] - reach - w,
                    y0: y[i] - h / 2,
                    x1: x[i] - reach,
                    y1: y[i] + h / 2,
                };
            case "below":
                return {
                    x0: x[i] - w / 2,
                    y0: y[i] + reach,
                    x1: x[i] + w / 2,
                    y1: y[i] + reach + h,
                };
            case "above":
                return {
                    x0: x[i] - w / 2,
                    y0: y[i] - reach - h,
                    x1: x[i] + w / 2,
                    y1: y[i] - reach,
                };
        }
    };
    const outside = (b: Box) =>
        Math.max(0, margin - b.x0) +
        Math.max(0, b.x1 - (W - margin)) +
        Math.max(0, margin - b.y0) +
        Math.max(0, b.y1 - (H - margin));
    const underLabel = (b: Box) => {
        let count = 0;
        for (const { a, b: c } of input.edges) {
            for (let t = 0.15; t < 0.9; t += 0.1) {
                const px = x[a] + (x[c] - x[a]) * t;
                const py = y[a] + (y[c] - y[a]) * t;
                if (px > b.x0 && px < b.x1 && py > b.y0 && py < b.y1) {
                    count++;
                    break;
                }
            }
        }
        return count;
    };
    const cost = (i: number, s: Side) => {
        const box = labelBox(i, s);
        let c = SIDE_COST[s] + outside(box) * 50 + underLabel(box) * 0.6;
        for (let j = 0; j < n; j++) {
            if (j === i) continue;
            const a = overlap(box, nodeBox(j));
            if (a) c += 20 + (a.w * a.h) / 20;
            const b = overlap(box, labelBox(j));
            if (b) c += 20 + (b.w * b.h) / 20;
        }
        return c;
    };
    const chooseSides = () => {
        // Biggest first: they're the hardest to fit.
        const order = [...r.keys()].sort((a, b) => r[b] - r[a]);
        for (let pass = 0; pass < 3; pass++) {
            for (const i of order) {
                let pick = side[i];
                let pickCost = cost(i, pick);
                for (const s of SIDES) {
                    const c = cost(i, s);
                    if (c < pickCost - 1e-6) {
                        pick = s;
                        pickCost = c;
                    }
                }
                side[i] = pick;
            }
        }
    };
    const clamp = (i: number) => {
        const lo = margin + r[i];
        x[i] = Math.min(W - lo, Math.max(lo, x[i]));
        y[i] = Math.min(H - lo, Math.max(lo, y[i]));
    };
    const nudge = (i: number, j: number, dx: number, dy: number) => {
        // Split the move between the two, and if a wall stops one of them
        // the other takes the rest — otherwise a node pinned to the edge
        // holds an overlap in place.
        const [xi, yi, xj, yj] = [x[i], y[i], x[j], y[j]];
        x[i] += dx / 2;
        y[i] += dy / 2;
        x[j] -= dx / 2;
        y[j] -= dy / 2;
        clamp(i);
        clamp(j);
        const spareX = dx - (x[i] - xi) + (x[j] - xj);
        const spareY = dy - (y[i] - yi) + (y[j] - yj);
        if (x[i] - xi === dx / 2) x[i] += spareX;
        else x[j] -= spareX;
        if (y[i] - yi === dy / 2) y[i] += spareY;
        else y[j] -= spareY;
        clamp(i);
        clamp(j);
    };
    const push = (i: number, j: number, a: Box, b: Box) => {
        const o = overlap(a, b);
        if (!o) return false;
        // Separate along whichever axis needs the smaller move.
        if (o.w < o.h * (W / H)) {
            const dir = (a.x0 + a.x1) / 2 < (b.x0 + b.x1) / 2 ? -1 : 1;
            nudge(i, j, dir * (o.w + 1), 0);
        } else {
            const dir = (a.y0 + a.y1) / 2 < (b.y0 + b.y1) / 2 ? -1 : 1;
            nudge(i, j, 0, dir * (o.h + 1));
        }
        return true;
    };

    for (let round = 0; round < 120; round++) {
        if (round % 4 === 0) chooseSides();
        let moved = false;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) continue;
                if (j > i && push(i, j, nodeBox(i), nodeBox(j))) moved = true;
                if (j > i && push(i, j, labelBox(i), labelBox(j))) moved = true;
                if (push(i, j, labelBox(i), nodeBox(j))) moved = true;
            }
        }
        if (!moved && round % 4 === 3) break;
    }
    chooseSides();

    // Score the attempt.
    let collisions = 0;
    let underLabels = 0;
    let sideCost = 0;
    for (let i = 0; i < n; i++) {
        const box = labelBox(i);
        sideCost += SIDE_COST[side[i]];
        underLabels += underLabel(box);
        if (outside(box) > 0) collisions++;
        for (let j = 0; j < n; j++) {
            if (j === i) continue;
            if (overlap(box, nodeBox(j))) collisions++;
            if (j > i && overlap(box, labelBox(j))) collisions++;
            if (j > i && overlap(nodeBox(i), nodeBox(j))) collisions++;
        }
    }
    let crossings = 0;
    const { edges } = input;
    for (let e = 0; e < edges.length; e++) {
        for (let f = e + 1; f < edges.length; f++) {
            const p = edges[e];
            const q = edges[f];
            if (p.a === q.a || p.a === q.b || p.b === q.a || p.b === q.b) {
                continue;
            }
            const at = (i: number) => ({ x: x[i], y: y[i] });
            if (intersects(at(p.a), at(p.b), at(q.a), at(q.b))) crossings++;
        }
    }

    return {
        placements: x.map((px, i) => ({
            x: px,
            y: y[i],
            r: r[i],
            side: side[i],
        })),
        score: collisions * 100 + crossings * 3 + underLabels + sideCost * 0.5,
    };
}
