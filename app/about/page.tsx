import Image from "next/image";
import { Art } from "app/components/Art";
import { Link } from "app/components/Link";
import { SiteFooter, SiteHeader } from "app/components/SiteChrome";
import { getPosts, type Post } from "app/lib/posts";
import { SITE } from "app/lib/site";
import { getRepos } from "./github";
import { ROLES } from "./roles";
import styles from "./about.module.css";

export const metadata = {
    title: "About",
    description: `${SITE.name}: senior software engineer at ${SITE.employer.label} in ${SITE.city} and founder of ${SITE.company.label}, with work history and open-source projects.`,
};

// The GitHub response is cached for a day; rebuilding hourly from that cache
// costs nothing and lets a failed fetch recover within the hour.
export const revalidate = 3600;

const REPOS = 6;

function host(href: string) {
    return new URL(href).hostname.replace(/^www\./, "");
}

function pushed(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    });
}

function Work({ posts }: { posts: Post[] }) {
    return (
        <section className={styles.section} aria-labelledby="work-title">
            <h2 id="work-title" className={styles.label}>
                Work
            </h2>
            <ol className={styles.roles}>
                {ROLES.map((role) => {
                    const writing = role.writing
                        .map((slug) => posts.find((post) => post.slug === slug))
                        .filter((post): post is Post => post !== undefined);
                    return (
                        <li
                            key={role.slug}
                            // `group` runs the shared art drift on hover.
                            className={`${styles.role} group`}
                        >
                            <span className={styles.roleArt}>
                                <Art slug={role.slug} index={role.artIndex} />
                            </span>
                            <div className={styles.roleBody}>
                                <p className={styles.roleHead}>
                                    <a href={role.href}>{role.company}</a>
                                    <span className={styles.meta}>
                                        {role.dates ?? role.status}
                                    </span>
                                </p>
                                <p className={styles.roleTitle}>
                                    {role.role}
                                    <span className={styles.host}>
                                        {" "}
                                        · {host(role.href)}
                                    </span>
                                </p>
                                {role.description ? (
                                    <p className={styles.roleText}>
                                        {role.description}
                                    </p>
                                ) : null}
                                {writing.length ? (
                                    <ul
                                        className={styles.writing}
                                        aria-label={`Writing about ${role.company}`}
                                    >
                                        {writing.map((post) => (
                                            <li key={post.slug}>
                                                <Link href={post.href}>
                                                    {post.title}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}

async function OpenSource() {
    const result = await getRepos(REPOS);

    return (
        <section className={styles.section} aria-labelledby="code-title">
            <h2 id="code-title" className={styles.label}>
                Open source
            </h2>
            {result.ok ? (
                <>
                    <ul className={styles.repos}>
                        {result.repos.map((repo) => (
                            <li key={repo.name}>
                                <a href={repo.url} className={styles.repo}>
                                    <span className={styles.repoName}>
                                        {repo.name}
                                    </span>
                                    {repo.description ? (
                                        <span className={styles.repoText}>
                                            {repo.description}
                                        </span>
                                    ) : null}
                                    <span className={styles.meta}>
                                        {[
                                            repo.language,
                                            repo.stars
                                                ? `★ ${repo.stars}`
                                                : null,
                                            pushed(repo.pushedAt),
                                        ]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </span>
                                </a>
                            </li>
                        ))}
                    </ul>
                    <p className={styles.more}>
                        <a href={SITE.github.href}>
                            All {result.total} repositories on GitHub
                        </a>
                    </p>
                </>
            ) : (
                <p className={styles.more}>
                    <a href={result.profile}>Repositories on GitHub</a>
                </p>
            )}
        </section>
    );
}

export default function About() {
    const posts = getPosts();

    return (
        <div className={`full-bleed ${styles.page}`}>
            <SiteHeader current="about" />

            <article
                className={styles.content}
                aria-label={`About ${SITE.name}`}
            >
                <div className={styles.bio}>
                    <Image
                        src="/zach.jpeg"
                        alt="Zach Blume"
                        width={160}
                        height={160}
                        sizes="(max-width: 480px) 88px, 160px"
                        priority
                        className={styles.avatar}
                    />
                    <p>
                        I&rsquo;m a senior software engineer at{" "}
                        <a href={SITE.employer.href}>{SITE.employer.label}</a>.
                        I&rsquo;m based in{" "}
                        <span className={styles.nowrap}>{SITE.city}</span>.
                    </p>
                    <p>
                        I also founded{" "}
                        <a href={SITE.company.href}>{SITE.company.label}</a>,{" "}
                        {SITE.companyBlurb}.
                    </p>
                </div>

                <Work posts={posts} />

                <OpenSource />

                <section
                    className={styles.section}
                    aria-labelledby="home-title"
                >
                    <h2 id="home-title" className={styles.label}>
                        At home
                    </h2>
                    <div className={styles.pets}>
                        {SITE.pets.map((pet) => (
                            <figure
                                key={pet.name}
                                className={styles.pet}
                                tabIndex={0}
                                aria-label={`Photo of ${pet.name}`}
                            >
                                <Image
                                    src={pet.src}
                                    alt={pet.name}
                                    width={700}
                                    height={467}
                                    sizes="(min-width: 768px) 240px, (max-width: 640px) 30vw, 190px"
                                />
                                <figcaption>{pet.name}</figcaption>
                            </figure>
                        ))}
                    </div>
                </section>

                <footer className={styles.contact}>
                    <a href={`mailto:${SITE.email}`}>Email</a>
                    <a href={SITE.github.href}>GitHub</a>
                </footer>
            </article>
            <SiteFooter bordered />
        </div>
    );
}
