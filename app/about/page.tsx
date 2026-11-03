import Image from "next/image";
import { SiteHeader } from "app/components/SiteChrome";
import { SITE } from "app/lib/site";
import styles from "./about.module.css";

export const metadata = {
    title: "About",
    description: `About ${SITE.name}, a senior software engineer at ${SITE.employer.label} in ${SITE.city}.`,
};

export default function About() {
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
                        I&rsquo;m based in {SITE.city}.
                    </p>
                    <p>
                        Previously, I worked as an engineer and team lead at{" "}
                        <a href={SITE.previousEmployer.href}>
                            {SITE.previousEmployer.label}
                        </a>
                        . I also founded{" "}
                        <a href={SITE.company.href}>{SITE.company.label}</a>,{" "}
                        {SITE.companyBlurb}.
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
                                <span>{SITE.employer.role}</span>
                            </dd>
                        </div>
                        <div>
                            <dt>previously</dt>
                            <dd>
                                <a href={SITE.previousEmployer.href}>
                                    {SITE.previousEmployer.label}
                                </a>
                                <span>{SITE.previousEmployer.role}</span>
                            </dd>
                        </div>
                        <div>
                            <dt>founded</dt>
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
                                    sizes="(min-width: 768px) 230px, (max-width: 640px) 30vw, 190px"
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
