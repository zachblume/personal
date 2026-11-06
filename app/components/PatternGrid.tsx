import { slugify } from "app/lib/slugify";

/**
 * A grid of the post's patterns, each linking to its section. Icons are drawn
 * in a 64×64 box with currentColor ink, so they follow the text color in dark
 * mode; the pastel fills are the only color, dimmed in dark mode so the
 * light strokes over them still show. `heading` must match the post's
 * heading text exactly, since the link target is its slug.
 */
const PATTERNS: { heading: string; label: string; icon: string }[] = [
    {
        heading:
            "1. Giant refactors with backfilled coverage against main shipped first",
        label: "Big refactors, tested against main",
        icon: '<path d="M14 6v52" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <path d="M14 16c0 10 22 6 22 16s-22 6-22 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <circle cx="14" cy="16" r="4" class="fill-neutral-50 dark:fill-neutral-900" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <circle cx="14" cy="48" r="4" class="fill-neutral-50 dark:fill-neutral-900" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <rect x="40" y="22" width="20" height="20" rx="5" fill="#f2e7b8" class="acc" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <path d="M45 32l4 4 7-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    },
    {
        heading: "2. PR walkthrough videos",
        label: "PR walkthrough videos",
        icon: '<rect x="6" y="12" width="44" height="32" rx="6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <path d="M23 21l12 7-12 7z" fill="#c6dcf2" class="acc" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <path d="M20 52h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <path d="M55 20c4 4 4 12 0 16M60 15c7 7 7 19 0 26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    },
    {
        heading: "3. Expansive custom linters to enforce architectural purity",
        label: "Linters for architectural purity",
        icon: '<path d="M8 56V10l46 46z" fill="#efc4bc" class="acc" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <path d="M16 44V30l14 14z" class="fill-neutral-50 dark:fill-neutral-900" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <path d="M8 20h5M8 30h3M8 40h5M8 50h3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <path d="M38 14l5 5 11-12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    },
    {
        heading: "4. A useful explosion of integration and end-to-end tests",
        label: "A useful explosion of e2e tests",
        icon: '<path d="M6 12h52L32 56z" fill="#bde9dc" class="acc" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <path d="M14 25h36M22 38h20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <path d="M32 2v4M48 4l-2 4M16 4l2 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    },
    {
        heading:
            "5. A return to verbose and expensive architectural patterns like data access layer Repositories and DDD (now much cheaper!)",
        label: "Verbose architecture, now cheap",
        icon: '<path d="M32 8l24 10-24 10L8 18z" fill="#eec6dd" class="acc" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <path d="M8 30l24 10 24-10M8 42l24 10 24-10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    },
    {
        heading: "6. Spiking slowly/by hand, then expanding rapidly by agent",
        label: "Slowly by hand, then by agent",
        icon: '<rect x="4" y="21" width="22" height="22" rx="5" fill="#c8ecc1" class="acc" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <path d="M26 32h8M34 14v36M34 14h4M34 32h4M34 50h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <rect x="40" y="7" width="18" height="14" rx="3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="3.5 3.5"/> <rect x="40" y="25" width="18" height="14" rx="3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="3.5 3.5"/> <rect x="40" y="43" width="18" height="14" rx="3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="3.5 3.5"/>',
    },
    {
        heading:
            "7. Build guardrails and metrics first, then let the agent rip against them",
        label: "Guardrails and metrics first",
        icon: '<path d="M6 8v48M58 8v48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <path d="M14 44a18 18 0 0 1 36 0M32 44l9-12M18 54h28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <circle cx="32" cy="44" r="4" fill="#dcccf1" class="acc" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    },
    {
        heading: "8. Automated PR approval with backtested judges",
        label: "Automated PR approval",
        icon: '<path d="M6 50l10-10 8 6 10-14 10 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <path d="M42 6l16 6v12c0 10-7 16-16 20-9-4-16-10-16-20V12z" fill="#e3ebc2" class="acc" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <path d="M35 24l5 5 9-10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    },
    {
        heading: "9. Agents launching agents",
        label: "Agents launching agents",
        icon: '<circle cx="32" cy="12" r="8" fill="#cfd3f3" class="acc" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <path d="M32 20v8M32 28L12 40M32 28l20 12M32 28v12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <circle cx="12" cy="48" r="6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="32" cy="48" r="6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="52" cy="48" r="6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    },
    {
        heading: "10. Build instead of buy (maintenance became cheaper)",
        label: "Build instead of buy",
        icon: '<path d="M4 32l20-16 20 16v24H4z" fill="#ecd6c0" class="acc" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <path d="M18 56V42h12v14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <rect x="44" y="6" width="18" height="9" rx="2.5" class="fill-neutral-50 dark:fill-neutral-900" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <path d="M53 15v36" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    },
    {
        heading: "11. Project chats",
        label: "Project chats",
        icon: '<path d="M8 10h48a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H26l-12 10v-10H8a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <rect x="12" y="18" width="10" height="20" rx="2" fill="#c3e6ee" class="acc" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <rect x="27" y="18" width="10" height="14" rx="2" fill="#c3e6ee" class="acc" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <rect x="42" y="18" width="10" height="8" rx="2" fill="#c3e6ee" class="acc" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    },
    {
        heading:
            "12. Project chats left to run on their own /goal for weeks with guardrails",
        label: "A /goal that runs for weeks",
        icon: '<rect x="6" y="12" width="44" height="42" rx="6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <path d="M6 24h44M18 6v10M38 6v10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <circle cx="16" cy="34" r="2" fill="currentColor"/><circle cx="28" cy="34" r="2" fill="currentColor"/><circle cx="40" cy="34" r="2" fill="currentColor"/> <circle cx="16" cy="45" r="2" fill="currentColor"/><circle cx="28" cy="45" r="2" fill="currentColor"/> <path d="M46 58V30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <path d="M46 30h14l-4 6 4 6H46z" fill="#f0c9d5" class="acc" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    },
    {
        heading:
            "13. Readability is more important; notice you followed Claude too far down the hole",
        label: "Followed Claude too far",
        icon: '<ellipse cx="38" cy="52" rx="18" ry="6.5" fill="#c7ebd3" class="acc" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <path d="M6 8c18 0 2 14 18 18s2 14 14 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="4 5"/> <circle cx="50" cy="16" r="9" class="fill-neutral-50 dark:fill-neutral-900" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <path d="M45 16h10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    },
];

export function PatternGrid() {
    return (
        <nav
            aria-label="The patterns"
            className="not-prose my-8 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4"
        >
            {PATTERNS.map(({ heading, label, icon }, i) => (
                <a
                    key={heading}
                    href={`#${slugify(heading)}`}
                    className="group block no-underline!"
                >
                    <span className="relative block aspect-square rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-800 transition-colors group-hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:group-hover:border-neutral-600">
                        <span className="absolute top-2 left-2.5 font-mono text-[10px] text-neutral-400 dark:text-neutral-500">
                            {String(i + 1).padStart(2, "0")}
                        </span>
                        <svg
                            viewBox="0 0 64 64"
                            aria-hidden
                            className="absolute inset-[24%] dark:[&_.acc]:[fill-opacity:0.3]"
                            dangerouslySetInnerHTML={{ __html: icon }}
                        />
                    </span>
                    <span className="mt-2 block text-center text-[12.5px] leading-snug text-balance text-neutral-600 group-hover:text-neutral-900 dark:text-neutral-400 dark:group-hover:text-neutral-100">
                        {label}
                    </span>
                </a>
            ))}
        </nav>
    );
}
