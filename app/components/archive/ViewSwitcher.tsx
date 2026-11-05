"use client";

import { Link } from "app/components/Link";
import {
    choose,
    LABELS,
    remember,
    useView,
    VIEWS,
    type View,
} from "app/components/archive/viewStore";
import styles from "./archive.module.css";

function Icon({ view }: { view: View | "timeline" }) {
    return (
        <svg
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.25}
            strokeLinecap="round"
            className="h-3.5 w-3.5 shrink-0"
            aria-hidden
        >
            {view === "list" ? (
                <>
                    <rect x="1.5" y="2.5" width="3" height="2" rx="0.5" />
                    <rect x="1.5" y="6" width="3" height="2" rx="0.5" />
                    <rect x="1.5" y="9.5" width="3" height="2" rx="0.5" />
                    <path d="M6.5 3.5h6M6.5 7h6M6.5 10.5h6" />
                </>
            ) : view === "grid" ? (
                <>
                    <rect x="1.5" y="1.5" width="4.5" height="4.5" rx="0.75" />
                    <rect x="8" y="1.5" width="4.5" height="4.5" rx="0.75" />
                    <rect x="1.5" y="8" width="4.5" height="4.5" rx="0.75" />
                    <rect x="8" y="8" width="4.5" height="4.5" rx="0.75" />
                </>
            ) : view === "index" ? (
                <>
                    <path d="M1.5 3.5h4M1.5 7h5.5M1.5 10.5h3.5M11 3.5h1.5M11 7h1.5M11 10.5h1.5" />
                    <path
                        d="M7 3.5h2.5M8.5 7h1M6.5 10.5h3"
                        strokeDasharray="0.01 1.5"
                    />
                </>
            ) : (
                // Discs of a few sizes resting on an axis, like the page.
                <>
                    <path d="M1 12h12" />
                    <circle cx="3.25" cy="9.5" r="1.25" />
                    <circle cx="7" cy="8" r="2.75" />
                    <circle cx="11.25" cy="9.75" r="1" />
                </>
            )}
        </svg>
    );
}

function Label({ children }: { children: React.ReactNode }) {
    return <span className="max-sm:sr-only">{children}</span>;
}

/** On the homepage: the three layouts are a radio group, Timeline a link out. */
function HomeSwitcher() {
    const view = useView();

    return (
        <div className={styles.switcher}>
            <div
                role="radiogroup"
                aria-label="Archive layout"
                className={styles.group}
            >
                {VIEWS.map((v) => (
                    <label key={v} data-value={v} className={styles.option}>
                        <input
                            type="radio"
                            name="archive-view"
                            value={v}
                            checked={view === v}
                            onChange={() => choose(v)}
                            className={styles.input}
                        />
                        <Icon view={v} />
                        <Label>{LABELS[v]}</Label>
                    </label>
                ))}
            </div>
            <Link href="/timeline" className={styles.option}>
                <Icon view="timeline" />
                <Label>Timeline</Label>
            </Link>
        </div>
    );
}

/** On /timeline: the same control, with the three layouts as links home. */
function TimelineSwitcher() {
    return (
        <nav aria-label="Archive layout" className={styles.switcher}>
            {VIEWS.map((v) => (
                <Link
                    key={v}
                    href={`/?view=${v}`}
                    onClick={() => remember(v)}
                    className={styles.option}
                >
                    <Icon view={v} />
                    <Label>{LABELS[v]}</Label>
                </Link>
            ))}
            <Link
                href="/timeline"
                aria-current="page"
                className={styles.option}
            >
                <Icon view="timeline" />
                <Label>Timeline</Label>
            </Link>
        </nav>
    );
}

/**
 * The archive's layout control, for the SiteHeader's `actions` slot. On the
 * homepage it must sit inside <ArchiveViews>, whose `data-view` marks the
 * selected option before hydration.
 */
export function ViewSwitcher({ current }: { current?: "timeline" }) {
    return current === "timeline" ? <TimelineSwitcher /> : <HomeSwitcher />;
}
