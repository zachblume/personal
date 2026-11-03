import Image from "next/image";
import { Link } from "app/components/Link";
import { SiteHeader } from "app/components/SiteChrome";
import { SITE } from "app/lib/site";
import styles from "./about.module.css";

export const metadata = {
    title: "About",
    description: `About ${SITE.name}, a software engineer in ${SITE.city}.`,
};

export default function About() {
    return (
        <div className={`full-bleed ${styles.page}`}>
            <SiteHeader current="about" />

            <article className={styles.content}>
                <header className={styles.identity}>
                    <div>
                        <h1>{SITE.name}</h1>
                        <p>{SITE.city}</p>
                    </div>
                    <Image
                        src="/zach.jpeg"
                        alt="Zach Blume"
                        width={56}
                        height={56}
                        sizes="56px"
                        priority
                        className={styles.avatar}
                    />
                </header>

                <div className={styles.bio}>
                    <p>
                        I&rsquo;m a software engineer at{" "}
                        <a href={SITE.employer.href}>{SITE.employer.label}</a>.
                        Before that, I founded{" "}
                        <a href={SITE.company.href}>{SITE.company.label}</a>,{" "}
                        {SITE.companyBlurb}.
                    </p>
                    <p>{SITE.intro}</p>
                    <p>
                        Most of what I publish starts as something I had to
                        figure out at work and couldn&rsquo;t find written down
                        anywhere. <Link href="/">The writing lives here</Link>.
                    </p>
                </div>

                <section
                    className={styles.section}
                    aria-labelledby="work-title"
                >
                    <h2 id="work-title">Work</h2>
                    <dl className={styles.work}>
                        <div>
                            <dt>now</dt>
                            <dd>
                                <a href={SITE.employer.href}>
                                    {SITE.employer.label}
                                </a>
                                <span>Software engineer</span>
                            </dd>
                        </div>
                        <div>
                            <dt>previously</dt>
                            <dd>
                                <a href={SITE.company.href}>
                                    {SITE.company.label}
                                </a>
                                <span>Founder</span>
                            </dd>
                        </div>
                    </dl>
                </section>

                <section
                    className={styles.section}
                    aria-labelledby="home-title"
                >
                    <h2 id="home-title">At home</h2>
                    <div className={styles.pets}>
                        {SITE.pets.map((pet) => (
                            <figure key={pet.name} className={styles.pet}>
                                <Image
                                    src={pet.src}
                                    alt={pet.name}
                                    width={700}
                                    height={467}
                                    sizes="(max-width: 640px) 30vw, 190px"
                                />
                                <figcaption>{pet.name}</figcaption>
                            </figure>
                        ))}
                    </div>
                </section>

                <footer className={styles.contact}>
                    <a href={`mailto:${SITE.email}`}>Email</a>
                    <a href={SITE.github.href}>GitHub</a>
                    <a href="/rss">RSS</a>
                </footer>
            </article>
        </div>
    );
}
