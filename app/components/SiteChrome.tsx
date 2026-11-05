import { PaletteTrigger } from "app/components/command-palette/PaletteTrigger";
import { Link } from "app/components/Link";
import styles from "app/components/SiteChrome.module.css";
import { SITE } from "app/lib/site";

/** Horizontal padding shared by every full-bleed section. */
export const PAD = "px-6 md:px-10 lg:px-16";

/** Which page the chrome is on, so navigation can mark or skip it. */
export type Section = "home" | "about" | "timeline" | "article";

type NavItem = { href: string; label: string; section: Section };

const WRITING: NavItem = { href: "/", label: "Writing", section: "home" };
const TIMELINE: NavItem = {
    href: "/timeline",
    label: "Timeline",
    section: "timeline",
};
const ABOUT: NavItem = { href: "/about", label: "About", section: "about" };

/** Every page, in the order the footer lists them. */
const SITEMAP: NavItem[] = [WRITING, TIMELINE, ABOUT];

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
 * The header holds down to 360px: as the width runs out, Timeline gives way
 * first. The footer lists every page and ⌘K reaches them all, so nothing
 * becomes unreachable.
 */
export function SiteHeader({ current }: { current: Section }) {
    // The signature already leads home, so Writing joins only elsewhere.
    const items = [
        ...(current === "home" ? [] : [{ ...WRITING, narrow: true }]),
        { ...TIMELINE, narrow: false },
        { ...ABOUT, narrow: true },
    ];

    return (
        <header
            className={`${PAD} ${styles.chrome} flex h-14 items-center gap-4 border-b border-neutral-200 md:gap-6 dark:border-neutral-800`}
        >
            <Signature current={current} />
            <div className="ml-auto flex items-center gap-4 md:gap-6">
                <nav
                    aria-label="Primary"
                    className="flex items-center gap-5 text-[13px] md:gap-6 lg:gap-7"
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
                                    : `${styles.link} hidden sm:block`
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
