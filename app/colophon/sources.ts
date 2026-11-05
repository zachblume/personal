import fs from "fs";
import path from "path";

/**
 * Server-only. The colophon reads its facts from the files that define them —
 * the stylesheet, Tailwind's theme, package.json — at render time, so it can't
 * drift from the site it describes. Every page here is static, so in
 * production "render time" is the build.
 */

function read(...parts: string[]) {
    // Static page, so these reads only happen at build; keep Turbopack from
    // tracing the whole project into the server bundle on their account.
    return fs.readFileSync(
        path.join(/*turbopackIgnore: true*/ process.cwd(), ...parts),
        "utf8",
    );
}

export type RampStep = {
    /** "bg", "bg2", "0" … "5" */
    name: string;
    l: number;
    c: number;
    hue: "h" | "h2";
};

function rampIn(css: string, selector: string): RampStep[] {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const body =
        css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`))?.[1] ??
        "";
    return [
        ...body.matchAll(
            /--art-([\w-]+):\s*oklch\(\s*([\d.]+)\s+([\d.]+)\s+var\(--art-(h2?)\)\s*\)/g,
        ),
    ].map((m) => ({
        name: m[1],
        l: Number(m[2]),
        c: Number(m[3]),
        hue: m[4] as "h" | "h2",
    }));
}

/** The `.art` and `.dark .art` ramps, exactly as global.css declares them. */
export function artRamp() {
    const css = read("app", "global.css");
    return { light: rampIn(css, ".art"), dark: rampIn(css, ".dark .art") };
}

/** Tailwind's neutral scale, as its theme declares it. */
export function neutrals(): Record<string, string> {
    try {
        const css = read("node_modules", "tailwindcss", "theme.css");
        return Object.fromEntries(
            [
                ...css.matchAll(
                    /--color-neutral-(\d+):\s*(oklch\([^)]*\))\s*;/g,
                ),
            ].map((m) => [m[1], m[2]]),
        );
    } catch {
        return {};
    }
}

type PackageJson = {
    version?: string;
    packageManager?: string;
    engines?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
};

function installed(name: string) {
    try {
        return (
            JSON.parse(
                read("node_modules", name, "package.json"),
            ) as PackageJson
        ).version;
    } catch {
        return undefined;
    }
}

/** Declared range and installed version for each package. */
export function packages(names: string[]) {
    const pkg = JSON.parse(read("package.json")) as PackageJson;
    const declared = { ...pkg.dependencies, ...pkg.devDependencies };
    const versions = Object.fromEntries(
        names.map((name) => [
            name,
            {
                declared: declared[name],
                installed:
                    installed(name) ?? declared[name]?.replace(/^\D+/, ""),
            },
        ]),
    );
    return {
        versions,
        packageManager: pkg.packageManager,
        node: pkg.engines?.node,
    };
}
