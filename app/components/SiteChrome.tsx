import { PaletteTrigger } from "app/components/command-palette/PaletteTrigger";
import { Link } from "app/components/Link";
import styles from "app/components/SiteChrome.module.css";
import { SITE } from "app/lib/site";

/** Horizontal padding shared by every full-bleed section. */
export const PAD = "px-6 md:px-10 lg:px-16";

/** Which page the chrome is on, so navigation can mark or skip it. */
export type Section =
    | "home"
    | "about"
    | "work"
    | "start-here"
    | "constellation"
    | "timeline"
    | "art"
    | "colophon"
    | "article";

type NavItem = { href: string; label: string; section: Section };

const WRITING: NavItem = { href: "/", label: "Writing", section: "home" };
const START_HERE: NavItem = {
    href: "/start-here",
    label: "Start here",
    section: "start-here",
};
const WORK: NavItem = { href: "/work", label: "Work", section: "work" };
const ABOUT: NavItem = { href: "/about", label: "About", section: "about" };

/** Every page, in the order the footer lists them. */
const SITEMAP: NavItem[] = [
    WRITING,
    START_HERE,
    WORK,
    {
        href: "/constellation",
        label: "Constellation",
        section: "constellation",
    },
    { href: "/timeline", label: "Timeline", section: "timeline" },
    { href: "/art", label: "Art studio", section: "art" },
    { href: "/colophon", label: "Colophon", section: "colophon" },
    ABOUT,
];

function Signature({ current }: { current?: Section }) {
    return (
        <Link
            href="/"
            aria-current={current === "home" ? "page" : undefined}
            className="site-name shrink-0 text-neutral-900 dark:text-white"
        >
            {SITE.name}
        </Link>
    );
}

/**
 * `actions` is page-specific controls set between the signature and the
 * navigation — the homepage puts its archive view switcher there.
 *
 * The header has to hold all of it down to 360px, so as the width runs out
 * the navigation gives way before the actions do, least-needed first: Start
 * here and Work, then the rest. The footer lists every page and ⌘K reaches
 * them all, so nothing becomes unreachable.
 */
export function SiteHeader({
    current,
    actions,
}: {
    current: Section;
    actions?: React.ReactNode;
}) {
    // The signature already leads home, so Writing joins only elsewhere.
    const items = [
        ...(current === "home" ? [] : [{ ...WRITING, narrow: true }]),
        { ...START_HERE, narrow: false },
        { ...WORK, narrow: false },
        { ...ABOUT, narrow: true },
    ];
    // Breakpoints from the widths involved: the homepage's switcher is about
    // 290px with its labels, and "Ctrl K" makes the trigger about 95px.
    const nav = actions ? "hidden md:flex" : "flex";
    const roomy = actions ? "hidden lg:block" : "hidden sm:block";

    return (
        <header
            className={`${PAD} ${styles.chrome} flex h-14 items-center gap-4 border-b border-neutral-200 md:gap-6 dark:border-neutral-800`}
        >
            <Signature current={current} />
            <div className="ml-auto flex items-center gap-4 md:gap-6">
                {actions ? (
                    <div className="flex items-center">{actions}</div>
                ) : null}
                <nav
                    aria-label="Primary"
                    className={`${nav} items-center gap-5 text-[13px] md:gap-6 lg:gap-7`}
                >
                    {items.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={
                                item.section === current ? "page" : undefined
                            }
                            className={
                                item.narrow
                                    ? styles.link
                                    : `${styles.link} ${roomy}`
                            }
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <PaletteTrigger />
            </div>
        </header>
    );
}

export function SiteFooter({ bordered = false }: { bordered?: boolean }) {
    return (
        <footer
            className={`${PAD} ${styles.chrome} flex flex-col gap-3 py-6 lg:min-h-14 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:py-3 ${
                bordered
                    ? "border-t border-neutral-200 dark:border-neutral-800"
                    : ""
            }`}
        >
            <Signature />
            <nav aria-label="Sitemap">
                <ul className="flex flex-wrap gap-x-5 text-[13px] leading-7 lg:justify-end">
                    {SITEMAP.map((item) => (
                        <li key={item.href}>
                            <Link href={item.href} className={styles.link}>
                                {item.label}
                            </Link>
                        </li>
                    ))}
                    <li>
                        <a href={SITE.github.href} className={styles.link}>
                            GitHub
                        </a>
                    </li>
                    <li>
                        {/* A feed, not a page: no client-side navigation. */}
                        <a href="/rss" className={styles.link}>
                            RSS
                        </a>
                    </li>
                </ul>
            </nav>
        </footer>
    );
}
