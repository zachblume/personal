import Image from "next/image";
import { Art } from "app/components/Art";
import { Link } from "app/components/Link";
import { SiteFooter, SiteHeader } from "app/components/SiteChrome";
import { getPosts, type Post } from "app/lib/posts";
import { SITE } from "app/lib/site";
import { WORK } from "./work";
import styles from "./about.module.css";

export const metadata = {
    title: "About",
    description: `${SITE.name}: senior software engineer at ${SITE.employer.label} in ${SITE.city} and founder of ${SITE.company.label}.`,
};

/** "Posts about Stripe", and so on: the writing that came out of each job. */
function Work({ posts }: { posts: Post[] }) {
    return WORK.map((group) => {
        const writing = group.posts
            .map((slug) => posts.find((post) => post.slug === slug))
            .filter((post): post is Post => post !== undefined);
        const id = `posts-about-${group.company.toLowerCase().replace(/\W+/g, "-")}`;
        return (
            <section
                key={group.company}
                className={styles.section}
                aria-labelledby={id}
            >
                <h2 id={id} className={styles.label}>
                    Posts about {group.company}
                </h2>
                <ul className={styles.posts}>
                    {writing.map((post) => (
                        <li key={post.slug}>
                            {/* `group` runs the shared art drift on hover. */}
                            <Link
                                href={post.href}
                                className={`${styles.post} group`}
                            >
                                <span className={styles.postArt}>
                                    <Art
                                        slug={post.slug}
                                        index={post.artIndex}
                                    />
                                </span>
                                <span className={styles.postTitle}>
                                    {post.title}
                                </span>
                                <time
                                    dateTime={post.publishedAt}
                                    className={styles.postDate}
                                >
                                    {post.date}
                                </time>
                            </Link>
                        </li>
                    ))}
                </ul>
            </section>
        );
    });
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
