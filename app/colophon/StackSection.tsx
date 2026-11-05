import { packages } from "app/colophon/sources";
import { MONO, Prose, Section } from "app/colophon/ui";

/**
 * What each piece is for, from AGENTS.md, next.config.ts and package.json.
 * `pkgs` names the packages whose installed versions are printed; a service
 * the site calls over HTTP has none.
 */
const STACK = [
    {
        label: "Next.js",
        pkgs: ["next"],
        role: "The App Router, with app/ at the repo root. Posts are MDX files read from disk; share cards are drawn at build time with next/og.",
    },
    {
        label: "React",
        pkgs: ["react", "react-dom"],
        role: "Most of the site renders on the server, and the artwork arrives as finished SVG. Only the Art studio draws it in the browser.",
    },
    {
        label: "React Compiler",
        pkgs: ["babel-plugin-react-compiler"],
        role: "On in next.config.ts. Every build first runs the compiler over app/ and fails if it would skip any component.",
    },
    {
        label: "Tailwind CSS",
        pkgs: ["tailwindcss", "@tailwindcss/postcss"],
        role: "Version 4, through PostCSS. There is no tailwind.config.js; the configuration is CSS, in app/global.css.",
    },
    {
        label: "Radix Themes",
        pkgs: ["@radix-ui/themes", "@radix-ui/react-icons"],
        role: "Wraps the whole app, and supplies the tooltips and icons.",
    },
    {
        label: "next-mdx-remote",
        pkgs: ["next-mdx-remote"],
        role: "Renders the posts, with the site's own links, code blocks and heading anchors swapped in.",
    },
    {
        label: "sugar-high",
        pkgs: ["sugar-high"],
        role: "Tokenizes code. No token colors are set, so code stays in the text color like everything else.",
    },
    {
        label: "Geist",
        pkgs: ["geist"],
        role: "Sans, Serif and Mono, bundled with the site.",
    },
    {
        label: "next-themes",
        pkgs: ["next-themes"],
        role: "Dark mode, by class on <html>, following the system setting by default.",
    },
    {
        label: "TypeScript",
        pkgs: ["@typescript/native", "typescript"],
        role: "TypeScript 7 runs tsc. A TypeScript 6 build stays installed, aliased as typescript, for the lint and build tools that still need its API.",
    },
    {
        label: "Cartesia",
        pkgs: [],
        role: "Text-to-speech for Listen, which reads a post aloud.",
    },
    {
        label: "Vercel",
        pkgs: ["@vercel/analytics", "@vercel/speed-insights"],
        role: "Hosting, plus Vercel's analytics and Speed Insights.",
    },
];

const TOOLING = ["eslint", "prettier", "husky"];

export function StackSection() {
    const { versions, packageManager, node } = packages([
        ...STACK.flatMap((s) => s.pkgs),
        ...TOOLING,
    ]);
    const [pm, pmVersion] = (packageManager ?? "").split("@");

    return (
        <Section id="stack" numeral="IV" title="Stack">
            <Prose>
                <p>
                    What the site is built from, with the versions installed
                    when this page was built — read from{" "}
                    <code>package.json</code> and the packages themselves.
                </p>
            </Prose>
            <dl className="grid gap-x-12 sm:grid-cols-2">
                {STACK.map((item) => (
                    <div
                        key={item.label}
                        className="border-t border-neutral-200 py-5 dark:border-neutral-800"
                    >
                        <dt className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                            <span className="text-[15px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                                {item.label}
                            </span>
                            <span
                                className={`${MONO} text-[11px] tabular-nums text-neutral-500 dark:text-neutral-400`}
                            >
                                {item.pkgs
                                    .filter((p) => versions[p]?.installed)
                                    .map(
                                        (p) =>
                                            `${item.pkgs.length > 1 ? `${p} ` : ""}${versions[p].installed}`,
                                    )
                                    .join(" · ")}
                            </span>
                        </dt>
                        <dd className="mt-1.5 text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                            {item.role}
                        </dd>
                    </div>
                ))}
            </dl>
            <p
                className={`${MONO} border-t border-neutral-200 pt-5 text-[11px] leading-relaxed text-neutral-500 dark:border-neutral-800 dark:text-neutral-400`}
            >
                {[
                    pm && pmVersion ? `${pm} ${pmVersion}` : null,
                    node ? `Node ${node}` : null,
                    ...TOOLING.filter((p) => versions[p]?.installed).map(
                        (p) => `${p} ${versions[p].installed}`,
                    ),
                ]
                    .filter(Boolean)
                    .join(" · ")}
            </p>
        </Section>
    );
}
