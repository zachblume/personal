import { COMPOSITIONS, HUE_STEP, hash } from "app/components/Art";

/** Art jitters the first hue across half a step, so a quarter either way. */
export const JITTER = HUE_STEP / 4;

/** The road not taken: both choices straight off the slug's hash. */
export function artByHash(slug: string) {
    const v = hash(slug);
    return {
        h: v % 360,
        composition: COMPOSITIONS[v % COMPOSITIONS.length],
    };
}

/** The widest stretch of the wheel with no hue in it, wrapping past 360°. */
export function widestGap(hues: number[]) {
    const sorted = [...hues].sort((a, b) => a - b);
    let best = { size: 0, from: 0, to: 0 };
    sorted.forEach((from, i) => {
        const to = sorted[(i + 1) % sorted.length];
        const size = (to - from + 360) % 360 || 360;
        if (size > best.size) best = { size, from, to };
    });
    return best;
}
