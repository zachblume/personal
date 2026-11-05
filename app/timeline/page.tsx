import { PAD, SiteFooter, SiteHeader } from "app/components/SiteChrome";
import { getPosts, shortDate, toClientPost } from "app/lib/posts";
import { buildTimeline } from "app/timeline/geometry";
import { SizeKey, TimelineChart, YearTally } from "app/timeline/Timeline";

export const metadata = {
    title: "Timeline",
    description: "Everything I've written, laid out by date.",
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
            <SiteHeader current="timeline" />
            <section
                aria-labelledby="timeline-title"
                className={`${PAD} py-12`}
            >
                <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
                    <div>
                        <h1
                            id="timeline-title"
                            className="font-[family-name:var(--font-editorial)] text-[34px] leading-[1.08] tracking-[-0.025em] text-neutral-900 md:text-[44px] dark:text-white"
                        >
                            Timeline
                        </h1>
                        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                            {t.total.posts} posts since {t.firstMonth}, laid out
                            by date. Bigger circles are longer posts.
                        </p>
                    </div>
                    <SizeKey />
                </div>
                <TimelineChart t={t} today={shortDate(todayIso)} />
            </section>
            <YearTally t={t} />
            <SiteFooter bordered />
        </div>
    );
}
