import { ArtSection } from "app/colophon/ArtSection";
import { ColorSection } from "app/colophon/ColorSection";
import { NumbersSection } from "app/colophon/NumbersSection";
import { artRamp, neutrals, packages } from "app/colophon/sources";
import { StackSection } from "app/colophon/StackSection";
import { writingNumbers } from "app/colophon/stats";
import { TypeSection, firstCodeSample } from "app/colophon/TypeSection";
import { SERIF } from "app/colophon/ui";
import { PAD, SiteFooter, SiteHeader } from "app/components/SiteChrome";
import { getPosts, shortDate } from "app/lib/posts";

export const metadata = {
    title: "Colophon",
    description:
        "How this site is made — its type, color, generated artwork and stack — and the numbers on the writing itself.",
};

export default function ColophonPage() {
    const posts = getPosts();
    // The newest post, whose title, heading and opening line are set as specimens.
    const demo = posts[0];
    // An archive row with a summary that isn't the demo post's.
    const row = posts.find((p) => p.slug !== demo.slug && p.summary) ?? demo;
    const stats = writingNumbers(posts);
    const { versions } = packages(["next", "react"]);
    // Static, so this is the build date in production.
    const now = new Date();
    const built = shortDate(
        [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, "0"),
            String(now.getDate()).padStart(2, "0"),
        ].join("-"),
    );

    return (
        <div className="full-bleed min-h-screen w-full bg-white dark:bg-black">
            <SiteHeader current="colophon" />

            <div
                className={`${PAD} border-b border-neutral-200 py-10 dark:border-neutral-800`}
            >
                <h1
                    className={`${SERIF} text-[34px] leading-[1.08] tracking-[-0.025em] text-neutral-900 md:text-[44px] dark:text-white`}
                >
                    Colophon
                </h1>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                    How this site is made — type, color, the system that draws
                    the artwork, the stack — and the numbers on the writing
                    itself.
                </p>
            </div>

            <div className={`${PAD} py-14 md:py-20`}>
                <p
                    className={`${SERIF} mx-auto max-w-[34ch] text-center text-[22px] leading-[1.45] tracking-[-0.015em] text-neutral-800 md:text-[26px] dark:text-neutral-200`}
                >
                    This site is set in Geist Sans, with headings in Geist Serif
                    and code in Geist Mono. The interface is black and white;
                    the only color is the artwork, drawn for each post from two
                    hues. It is built with Next.js {versions.next.installed} and
                    React {versions.react.installed}, styled with Tailwind CSS,
                    and served by Vercel.
                </p>
            </div>

            <TypeSection
                demo={demo}
                row={row}
                dates={posts.slice(0, 4).map((p) => p.date)}
                code={firstCodeSample(posts)}
            />
            <ColorSection
                posts={posts}
                neutrals={neutrals()}
                ramp={artRamp()}
            />
            <ArtSection posts={posts} />
            <StackSection />
            <NumbersSection stats={stats} newestFirst={posts} />

            <p
                className={`${PAD} border-t border-neutral-200 py-14 text-center text-[13px] leading-relaxed text-neutral-500 dark:border-neutral-800 dark:text-neutral-400`}
            >
                Read from the site&rsquo;s own files when this page was built,{" "}
                {built}.
            </p>

            <SiteFooter bordered />
        </div>
    );
}
