import { ViewSwitcher } from "app/components/archive/ViewSwitcher";
import { PAD, SiteFooter, SiteHeader } from "app/components/SiteChrome";
import { getPosts, shortDate, toClientPost } from "app/lib/posts";
import { buildTimeline } from "app/timeline/geometry";
import { SizeKey, TimelineChart, YearTally } from "app/timeline/Timeline";

export const metadata = {
    title: "Timeline",
    description:
        "Every post on one time axis, sized by length, with the quiet stretches between them and a tally by year.",
};

export default function TimelinePage() {
    // The right end of the axis is the day the page was rendered — for a
    // static page, the last deploy.
    const now = new Date();
    const todayIso = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
    ].join("-");
    const t = buildTimeline(getPosts().map(toClientPost), todayIso);

    return (
        <div className="full-bleed min-h-screen w-full bg-white dark:bg-black">
            <SiteHeader
                current="timeline"
                actions={<ViewSwitcher current="timeline" />}
            />
            <section
                aria-labelledby="timeline-title"
                className={`${PAD} py-12`}
            >
                <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
                    <div>
                        <h1
                            id="timeline-title"
                            className="font-[family-name:var(--font-geist-sans)]! text-[12px] uppercase tracking-wider! text-neutral-400 dark:text-neutral-500"
                        >
                            {t.total.posts} posts since {t.firstMonth}
                        </h1>
                        <p className="mt-2 max-w-md text-[14px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                            Each disc is a post&rsquo;s artwork, its area the
                            post&rsquo;s length in words.
                        </p>
                    </div>
                    <SizeKey />
                </div>
                <TimelineChart t={t} today={shortDate(todayIso)} />
            </section>
            <YearTally t={t} todayYear={todayIso.slice(0, 4)} />
            <SiteFooter bordered />
        </div>
    );
}
