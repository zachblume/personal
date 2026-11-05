"use client";

import {
    ROOT_ID,
    SCRIPT,
    useView,
    VIEWS,
} from "app/components/archive/viewStore";
import styles from "./archive.module.css";

/**
 * Inline script helper from the Next guide on preventing flash: executable in
 * the server HTML, inert when React renders it on a client navigation (where
 * the store already has the right answer on first render).
 */
function InlineScript({ html }: { html: string }) {
    return (
        <script
            type={
                typeof window === "undefined" ? "text/javascript" : "text/plain"
            }
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

/**
 * All three layouts arrive server-rendered; this only decides which one
 * shows. Visibility and the switcher's selected option both key off
 * `data-view` in CSS, which is what lets the inline script fix them before
 * paint. React catches up on hydration.
 *
 * The header comes in here rather than sitting beside it so the switcher in
 * its `actions` slot is inside the element carrying `data-view`.
 */
export function ArchiveViews({
    header,
    list,
    grid,
    index,
}: {
    header: React.ReactNode;
    list: React.ReactNode;
    grid: React.ReactNode;
    index: React.ReactNode;
}) {
    const view = useView();
    const panels = { list, grid, index };

    return (
        <div
            id={ROOT_ID}
            data-view={view}
            className={styles.root}
            suppressHydrationWarning
        >
            <InlineScript html={SCRIPT} />
            {header}
            {VIEWS.map((v) => (
                <div key={v} data-panel={v} className={styles.panel}>
                    {panels[v]}
                </div>
            ))}
        </div>
    );
}
