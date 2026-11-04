import { Link } from "app/components/Link";
import { SITE } from "app/lib/site";

/** Horizontal padding shared by every full-bleed section. */
export const PAD = "px-6 md:px-10 lg:px-16";

function SiteNavigation({ current }: { current: "home" | "about" }) {
    return (
        <>
            <Link
                href="/"
                className="site-name text-[13px] font-medium tracking-tight text-neutral-900 dark:text-white"
            >
                {SITE.name}
            </Link>
            <nav className="flex gap-7 text-[13px] text-neutral-500 dark:text-neutral-400">
                {current === "about" ? (
                    <Link
                        href="/"
                        className="hover:text-neutral-900 dark:hover:text-white"
                    >
                        Writing
                    </Link>
                ) : (
                    <Link
                        href="/about"
                        className="hover:text-neutral-900 dark:hover:text-white"
                    >
                        About
                    </Link>
                )}
                <a
                    href={SITE.github.href}
                    className="hover:text-neutral-900 dark:hover:text-white"
                >
                    GitHub
                </a>
            </nav>
        </>
    );
}

export function SiteHeader({ current }: { current: "home" | "about" }) {
    return (
        <header
            className={`${PAD} flex h-14 items-center justify-between border-b border-neutral-200 dark:border-neutral-800`}
        >
            <SiteNavigation current={current} />
        </header>
    );
}

export function SiteFooter({ bordered = false }: { bordered?: boolean }) {
    return (
        <footer
            className={`${PAD} flex h-14 items-center justify-between ${
                bordered
                    ? "border-t border-neutral-200 dark:border-neutral-800"
                    : ""
            }`}
        >
            <SiteNavigation current="home" />
        </footer>
    );
}
