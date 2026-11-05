import type { Metadata } from "next";
import { Art } from "app/components/Art";
import { Chevron } from "app/components/icons";
import { Link } from "app/components/Link";
import { PAD, SiteFooter, SiteHeader } from "app/components/SiteChrome";
import { getPosts, type Post } from "app/lib/posts";
import { SITE } from "app/lib/site";
import { getRepos, type Repo } from "./github";
import { ROLES, type Role } from "./roles";
import styles from "./work.module.css";

export const metadata: Metadata = {
    title: "Work",
    description: `${SITE.name}’s work at ${SITE.employer.label}, ${SITE.previousEmployer.label} and ${SITE.company.label}, and his open-source projects on GitHub.`,
};

// The GitHub response itself is cached for a day. Rebuilding the page hourly
// from that cache costs nothing, and means a failed fetch recovers within the
// hour instead of leaving the fallback up until tomorrow.
export const revalidate = 3600;

const MONO = "font-[family-name:var(--font-geist-mono)]";

function host(href: string) {
    return new URL(href).hostname.replace(/^www\./, "");
}

function pushedDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    });
}

function ArrowOut() {
    return (
        <svg
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5 shrink-0 text-neutral-300 transition-all duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-neutral-900 dark:text-neutral-700 dark:group-hover:text-white"
            aria-hidden
        >
            <path d="M4.5 9.5l5-5M5.5 4.5h4v4" />
        </svg>
    );
}

function SectionHead({
    id,
    title,
    children,
}: {
    id: string;
    title: string;
    children?: React.ReactNode;
}) {
    return (
        <div
            className={`${PAD} flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-neutral-200 pt-14 pb-4 dark:border-neutral-800`}
        >
            <h2
                id={id}
                className="text-[28px] leading-tight text-neutral-900 md:text-[32px] dark:text-white"
            >
                {title}
            </h2>
            {children ? (
                <div
                    className={`${MONO} text-[12px] text-neutral-400 dark:text-neutral-500`}
                >
                    {children}
                </div>
            ) : null}
        </div>
    );
}

function RoleRow({ role, n, posts }: { role: Role; n: number; posts: Post[] }) {
    const writing = role.writing
        .map((slug) => posts.find((post) => post.slug === slug))
        .filter((post): post is Post => post !== undefined);
    const headingId = `${role.slug}-title`;

    return (
        <li
            className={`${styles.role} border-b border-neutral-200 dark:border-neutral-800`}
        >
            <article
                aria-labelledby={headingId}
                className={`${PAD} grid gap-x-12 gap-y-8 py-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:py-14`}
            >
                <div
                    className={`${styles.roleArt} overflow-hidden rounded-md border border-neutral-200/80 md:self-start dark:border-neutral-800`}
                >
                    <Art
                        slug={role.slug}
                        index={role.artIndex}
                        className="aspect-[16/9] w-full"
                    />
                </div>

                <div className="min-w-0 max-w-2xl">
                    <p
                        className={`${MONO} text-[12px] tabular-nums text-neutral-400 dark:text-neutral-500`}
                    >
                        {String(n).padStart(2, "0")} · {role.status}
                    </p>
                    <h3
                        id={headingId}
                        className="mt-3 text-[34px] leading-[1.05] text-balance text-neutral-900 md:text-[44px] dark:text-white"
                    >
                        {role.company}
                    </h3>
                    <p className="mt-3 text-[17px] leading-snug text-neutral-700 dark:text-neutral-300">
                        {role.role}
                    </p>
                    {role.blurb ? (
                        <p className="mt-1 text-[15px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                            {role.company} is {role.blurb}.
                        </p>
                    ) : null}

                    {role.description ? (
                        <p className="mt-6 text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                            {role.description}
                        </p>
                    ) : null}

                    <dl className="mt-6 grid grid-cols-[5.5rem_minmax(0,1fr)] items-baseline gap-x-4 gap-y-3 border-t border-neutral-200 pt-5 text-[14px] dark:border-neutral-800">
                        {role.dates ? (
                            <>
                                <dt
                                    className={`${MONO} text-[12px] text-neutral-400 dark:text-neutral-500`}
                                >
                                    When
                                </dt>
                                <dd className="tabular-nums text-neutral-700 dark:text-neutral-300">
                                    {role.dates}
                                </dd>
                            </>
                        ) : null}
                        <dt
                            className={`${MONO} text-[12px] text-neutral-400 dark:text-neutral-500`}
                        >
                            Site
                        </dt>
                        <dd>
                            <a
                                href={role.href}
                                className="group inline-flex items-center gap-1"
                            >
                                {/* Colored on a span: the full-bleed rule in
                                    global.css resets link color on hover. */}
                                <span className="text-neutral-900 underline decoration-neutral-300 underline-offset-4 group-hover:decoration-neutral-900 dark:text-neutral-100 dark:decoration-neutral-600 dark:group-hover:decoration-white">
                                    {host(role.href)}
                                </span>
                                <ArrowOut />
                            </a>
                        </dd>
                    </dl>

                    {writing.length > 0 ? (
                        <div className="mt-8">
                            <p
                                className={`${MONO} mb-3 text-[12px] text-neutral-400 dark:text-neutral-500`}
                            >
                                Writing about this
                            </p>
                            <ul className="border-t border-neutral-200 dark:border-neutral-800">
                                {writing.map((post) => (
                                    <li
                                        key={post.slug}
                                        className="border-b border-neutral-200 dark:border-neutral-800"
                                    >
                                        <Link
                                            href={post.href}
                                            className="group flex items-center gap-4 py-3"
                                        >
                                            <span className="block w-16 shrink-0 overflow-hidden rounded-[5px] border border-neutral-200/80 dark:border-neutral-800">
                                                <Art
                                                    slug={post.slug}
                                                    index={post.artIndex}
                                                    className="aspect-[16/9] w-full transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none"
                                                />
                                            </span>
                                            <span className="min-w-0 flex-1 text-[15px] font-medium leading-snug tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                                                {post.title}
                                            </span>
                                            <time
                                                dateTime={post.publishedAt}
                                                className="hidden w-28 shrink-0 text-[13px] tabular-nums text-neutral-400 sm:block dark:text-neutral-500"
                                            >
                                                {post.date}
                                            </time>
                                            <Chevron />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </div>
            </article>
        </li>
    );
}

function RepoRow({ repo, column }: { repo: Repo; column: 0 | 1 }) {
    return (
        <li
            className={`border-b border-neutral-200 dark:border-neutral-800 ${
                column === 0 ? "lg:border-r" : ""
            }`}
        >
            <a
                href={repo.url}
                className={`${PAD} group flex h-full items-center gap-5 py-5 hover:bg-neutral-50 dark:hover:bg-neutral-900/60 ${
                    // Two columns share the page's outer padding: full on the
                    // outside edge, half either side of the rule.
                    column === 0 ? "lg:pr-8" : "lg:pl-8"
                }`}
            >
                <span className="block w-16 shrink-0 overflow-hidden rounded-md border border-neutral-200/80 sm:w-20 dark:border-neutral-800">
                    <Art
                        slug={repo.name}
                        index={repo.artIndex}
                        className="aspect-[16/9] w-full transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none"
                    />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] font-medium leading-snug tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                        {repo.name}
                    </span>
                    {repo.description ? (
                        <span className="mt-0.5 block truncate text-[13px] text-neutral-500 dark:text-neutral-400">
                            {repo.description}
                        </span>
                    ) : null}
                    <span
                        className={`${MONO} mt-1.5 flex flex-wrap gap-x-3 text-[11px] tabular-nums text-neutral-400 dark:text-neutral-500`}
                    >
                        {repo.language ? <span>{repo.language}</span> : null}
                        {repo.stars > 0 ? (
                            <span>
                                <span aria-hidden>★ </span>
                                {repo.stars}
                                <span className="sr-only">
                                    {repo.stars === 1 ? " star" : " stars"}
                                </span>
                            </span>
                        ) : null}
                        <span>
                            Pushed{" "}
                            <time dateTime={repo.pushedAt}>
                                {pushedDate(repo.pushedAt)}
                            </time>
                        </span>
                    </span>
                </span>
                <ArrowOut />
            </a>
        </li>
    );
}

function ProfileLink({ href }: { href: string }) {
    return (
        <a href={href} className="group inline-flex items-center gap-1">
            <span className="text-neutral-500 group-hover:text-neutral-900 dark:text-neutral-400 dark:group-hover:text-white">
                {host(href)}
                {new URL(href).pathname}
            </span>
            <ArrowOut />
        </a>
    );
}

export default async function Page() {
    const posts = getPosts();
    const github = await getRepos();

    return (
        <div
            className={`full-bleed ${styles.page} min-h-screen w-full bg-white dark:bg-black`}
        >
            <SiteHeader current="work" />

            <section
                className={`${PAD} border-b border-neutral-200 py-10 dark:border-neutral-800`}
            >
                <h1 className="font-[family-name:var(--font-editorial)] text-[34px] leading-[1.08] tracking-[-0.025em] text-neutral-900 md:text-[44px] dark:text-white">
                    Work
                </h1>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                    Where I work, where I&rsquo;ve worked, the company I
                    founded, and what&rsquo;s on my GitHub.
                </p>
            </section>

            <section aria-labelledby="work-roles">
                <SectionHead id="work-roles" title="Roles">
                    {SITE.role}
                </SectionHead>
                <ul>
                    {ROLES.map((role, i) => (
                        <RoleRow
                            key={role.slug}
                            role={role}
                            n={i + 1}
                            posts={posts}
                        />
                    ))}
                </ul>
            </section>

            <section aria-labelledby="work-oss">
                <SectionHead id="work-oss" title="Open source">
                    {github.ok ? (
                        <span className="flex flex-wrap items-baseline gap-x-4">
                            <span>
                                Latest {github.repos.length} of {github.total}
                            </span>
                            <ProfileLink href={SITE.github.href} />
                        </span>
                    ) : null}
                </SectionHead>

                {github.ok ? (
                    <ul className="grid grid-cols-1 lg:grid-cols-2">
                        {github.repos.map((repo, i) => (
                            <RepoRow
                                key={repo.name}
                                repo={repo}
                                column={i % 2 === 0 ? 0 : 1}
                            />
                        ))}
                    </ul>
                ) : (
                    <div
                        className={`${PAD} border-b border-neutral-200 py-10 dark:border-neutral-800`}
                    >
                        <p className="max-w-xl text-[15px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                            This list comes from GitHub, which didn&rsquo;t
                            answer just now. Everything is at{" "}
                            <a href={github.profile} className="group">
                                <span className="text-neutral-900 underline decoration-neutral-300 underline-offset-4 group-hover:decoration-neutral-900 dark:text-white dark:decoration-neutral-600 dark:group-hover:decoration-white">
                                    {host(github.profile)}
                                    {new URL(github.profile).pathname}
                                </span>
                            </a>
                            .
                        </p>
                    </div>
                )}
            </section>

            <SiteFooter />
        </div>
    );
}
