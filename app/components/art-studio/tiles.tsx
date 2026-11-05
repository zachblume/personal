import { Art } from "app/components/Art";

/**
 * The studio's <Art> elements, shared by the server page and the client
 * Studio so both draw them identically.
 *
 * Why both: Art writes its coordinates as raw floats, and Node and the
 * browser don't always agree on the last digit of a Math.cos or Math.sin. Art
 * rendered on the client therefore fails to hydrate against the server's
 * HTML. So the page draws everything it can on the server — the opening seed
 * and index, and the hue walk — and Studio only draws its own once the seed
 * or index has moved, when there's nothing left to hydrate.
 *
 * The same seed and index can be on the page several times at once (preview,
 * grid, download crops, hue walk), so each role gets its own id prefix.
 */

export type Preset = { name: string; width: number; height: number };

export const PRESETS: Preset[] = [
    { name: "Desktop", width: 2560, height: 1440 },
    { name: "Phone", width: 1179, height: 2556 },
    { name: "Square", width: 2048, height: 2048 },
];

export function previewArt(slug: string, index: number) {
    return (
        <Art
            slug={slug}
            index={index}
            idPrefix="preview-"
            className="aspect-[16/9] w-full"
        />
    );
}

export function tileArt(slug: string, index: number, idPrefix = "") {
    return (
        <Art
            slug={slug}
            index={index}
            idPrefix={idPrefix}
            className="aspect-[16/9] w-full transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.06]"
        />
    );
}

export function gridArt(slug: string, index: number) {
    return tileArt(slug, index, "grid-");
}

export function presetArt(slug: string, index: number, preset: Preset) {
    return (
        <Art
            slug={slug}
            index={index}
            width={preset.width}
            height={preset.height}
            idPrefix={`${preset.name.toLowerCase()}-`}
            className="h-full w-full"
        />
    );
}
