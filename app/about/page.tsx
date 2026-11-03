import Image from "next/image";
import { Link } from "app/components/Link";
import { PAD, SiteFooter, SiteHeader } from "app/components/SiteChrome";
import { SITE } from "app/lib/site";

export const metadata = {
    title: "About",
    description: "About Zach Blume.",
};

const NOW: [string, string][] = [
    ["Role", "Software engineer, Stripe"],
    ["Founded", "Raise More"],
    ["Based", "New York City"],
    ["Writing about", "Testing, reliability, infrastructure"],
];

const ELSEWHERE: [string, string, string][] = [
    ["Email", `mailto:${SITE.email}`, SITE.email],
    ["GitHub", SITE.github.href, "github.com/zachblume"],
    ["RSS", "/rss", "/rss"],
];

const inlineLink =
    "text-neutral-900 underline decoration-neutral-300 underline-offset-[5px] hover:decoration-neutral-900 dark:text-white dark:decoration-neutral-600 dark:hover:decoration-white";

export default function About() {
    return (
        <div className="full-bleed min-h-screen w-full bg-white dark:bg-black">
            <SiteHeader current="about" />

            <section
                className={`${PAD} grid gap-12 py-16 md:grid-cols-[1fr_20rem] md:gap-20 md:py-24`}
            >
                <div>
                    <h1 className="text-[34px] font-medium leading-[1.1] tracking-[-0.03em] text-neutral-900 md:text-[46px] dark:text-white">
                        About
                    </h1>
                    <div className="mt-8 max-w-xl space-y-5 text-[17px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                        <p>
                            I&rsquo;m {SITE.name}, a software engineer in{" "}
                            {SITE.city}. I build at{" "}
                            <a href={SITE.employer.href} className={inlineLink}>
                                Stripe
                            </a>
                            , and before that I founded{" "}
                            <a href={SITE.company.href} className={inlineLink}>
                                Raise More
                            </a>
                            , {SITE.companyBlurb}.
                        </p>
                        <p>{SITE.intro}</p>
                        <p>
                            Most of what I publish starts as something I had to
                            figure out at work and couldn&rsquo;t find written
                            down anywhere.{" "}
                            <Link href="/" className={inlineLink}>
                                Read the archive
                            </Link>
                            .
                        </p>
                    </div>
                </div>

                <div className="md:pt-3">
                    <Image
                        src={SITE.avatar}
                        alt={SITE.name}
                        width={160}
                        height={160}
                        className="h-32 w-32 rounded-full object-cover"
                    />
                    <dl className="mt-8 space-y-3 text-[13px]">
                        {NOW.map(([k, v]) => (
                            <div
                                key={k}
                                className="border-b border-neutral-200 pb-3 dark:border-neutral-800"
                            >
                                <dt className="text-neutral-400 dark:text-neutral-500">
                                    {k}
                                </dt>
                                <dd className="mt-1 text-neutral-900 dark:text-neutral-200">
                                    {v}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </section>

            <section className="border-t border-neutral-200 dark:border-neutral-800">
                <div
                    className={`${PAD} flex items-baseline justify-between border-b border-neutral-200 py-3 dark:border-neutral-800`}
                >
                    <h2 className="text-[13px] font-medium text-neutral-900 dark:text-white">
                        The household
                    </h2>
                    <span className="text-[13px] text-neutral-400 dark:text-neutral-500">
                        Waldo, Millie &amp; Luna
                    </span>
                </div>
                <div className="grid gap-px bg-neutral-200 sm:grid-cols-3 dark:bg-neutral-800">
                    {SITE.pets.map((pet) => (
                        <figure
                            key={pet.name}
                            className="group relative overflow-hidden bg-white dark:bg-black"
                        >
                            <Image
                                src={pet.src}
                                alt={pet.name}
                                width={700}
                                height={460}
                                className="h-[300px] w-full object-cover grayscale transition-all duration-700 ease-out group-hover:scale-[1.03] group-hover:grayscale-0"
                            />
                            <figcaption className="absolute bottom-3 left-4 text-[13px] font-medium text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)]">
                                {pet.name}
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </section>

            <section className={`${PAD} py-16`}>
                <h2 className="text-[13px] font-medium text-neutral-900 dark:text-white">
                    Elsewhere
                </h2>
                <ul className="mt-4 space-y-2 text-[15px]">
                    {ELSEWHERE.map(([label, href, display]) => (
                        <li key={label} className="flex gap-6">
                            <span className="w-20 shrink-0 text-neutral-400 dark:text-neutral-500">
                                {label}
                            </span>
                            <a href={href} className={inlineLink}>
                                {display}
                            </a>
                        </li>
                    ))}
                </ul>
            </section>

            <SiteFooter bordered />
        </div>
    );
}
