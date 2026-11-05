import { COMPOSITIONS, HUE_OFFSETS, HUE_STEP } from "app/components/Art";

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

/**
 * The composition and the first hue repeat every COMPOSITIONS.length
 * indices, the hue offset every HUE_OFFSETS.length. Index n and n + CYCLE
 * draw the same shape in the same hues, so this is the whole range worth
 * scrubbing.
 */
export const CYCLE =
    (COMPOSITIONS.length * HUE_OFFSETS.length) /
    gcd(COMPOSITIONS.length, HUE_OFFSETS.length);

/** Art jitters the first hue across half a step, so a quarter either way. */
export const JITTER = HUE_STEP / 4;

export function degrees(hue: number) {
    return `${Math.round(hue) % 360}°`;
}
