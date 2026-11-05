import { notFound } from "next/navigation";
import { getBlogPosts } from "app/blog/utils";
import { ArticleLink } from "app/components/article/ArticleLink";
import { CurrentSectionProvider } from "app/components/article/CurrentSection";
import { articleHeadings } from "app/components/article/headings";
import { PreviewProvider } from "app/components/article/previews";
import { ReadingChrome } from "app/components/article/ReadingChrome";
import { ReadNext } from "app/components/article/ReadNext";
import { Sidenote } from "app/components/article/Sidenote";
import { toSidenotes } from "app/components/article/sidenotes";
import { Listen } from "app/components/listen/Listen";
import { CustomMDX } from "app/components/mdx";
import { PostList } from "app/components/PostList";
import { PAD, SiteFooter, SiteHeader } from "app/components/SiteChrome";
import { getPosts } from "app/lib/posts";
import { baseUrl } from "app/sitemap";

export async function generateStaticParams() {
    const posts = getBlogPosts();

    return posts.map((post) => ({
        slug: post.slug,
    }));
}

type BlogProps = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: BlogProps) {
    const { slug } = await params;
    const post = getBlogPosts().find((post) => post.slug === slug);
    if (!post) {
        return;
    }

    const {
        title,
        publishedAt: publishedTime,
        summary: description,
        image,
    } = post.metadata;
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "article",
            publishedTime,
            url: `${baseUrl}/blog/${post.slug}`,
            // Without a hand-authored image, opengraph-image.tsx draws one.
            ...(image ? { images: [{ url: image }] } : {}),
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            ...(image ? { images: [image] } : {}),
        },
    };
}

/*
 * The reading column. From lg up the right margin holds the sidenotes (each
 * hangs 17rem past the text): at lg that's reserved inside the column, which
 * pushes the text left of centre; from xl there's room for them past a
 * centred column. The outline lives in the reading bar. Headings land below
 * the reading bar after a jump.
 */
const COLUMN =
    "relative mx-6 max-w-xl py-12 md:mx-auto md:py-16 lg:max-w-[53rem] lg:pr-[17rem] xl:max-w-xl xl:pr-0 [&_:is(h2,h3)]:scroll-mt-[72px]";

export default async function Blog({ params }: BlogProps) {
    const { slug } = await params;
    const posts = getPosts();
    const post = posts.find((post) => post.slug === slug);

    if (!post) {
        notFound();
    }

    const image = getBlogPosts().find((entry) => entry.slug === slug)?.metadata
        .image;
    const headings = articleHeadings(post.headings);
    // Headings and the outline come from the untransformed post; only the
    // body's prose gets margin notes.
    const { source } = toSidenotes(post.content);

    return (
        <div className="full-bleed min-h-screen w-full bg-white dark:bg-black">
            <SiteHeader current="article" />
            <CurrentSectionProvider ids={headings.map((heading) => heading.id)}>
                <PreviewProvider>
                    <ReadingChrome
                        slug={post.slug}
                        title={post.title}
                        headings={headings}
                        hasIntro={!post.content.trimStart().startsWith("#")}
                        className={COLUMN}
                    >
                        <script
                            type="application/ld+json"
                            suppressHydrationWarning
                            dangerouslySetInnerHTML={{
                                __html: JSON.stringify({
                                    "@context": "https://schema.org",
                                    "@type": "BlogPosting",
                                    headline: post.title,
                                    datePublished: post.publishedAt,
                                    dateModified: post.publishedAt,
                                    description: post.summary,
                                    image: image
                                        ? `${baseUrl}${image}`
                                        : `${baseUrl}/blog/${post.slug}/opengraph-image`,
                                    url: `${baseUrl}/blog/${post.slug}`,
                                    author: {
                                        "@type": "Person",
                                        name: "Zach Blume's portfolio",
                                    },
                                }),
                            }}
                        />
                        <h1 className="title font-semibold text-2xl tracking-tighter">
                            {post.title}
                        </h1>
                        <div className="mt-2 mb-8 flex min-h-8 items-center justify-between gap-4 text-sm">
                            <p className="flex flex-wrap items-baseline gap-x-3 text-sm text-neutral-600 dark:text-neutral-400">
                                <time dateTime={post.publishedAt}>
                                    {post.date}
                                </time>
                                <span className="font-[family-name:var(--font-geist-mono)] text-[12px] tabular-nums text-neutral-400 dark:text-neutral-500">
                                    {post.minutes} min read
                                </span>
                            </p>
                            <Listen slug={post.slug} />
                        </div>
                        <article className="prose">
                            <CustomMDX
                                source={source}
                                components={{ a: ArticleLink, Sidenote }}
                            />
                        </article>
                        {/* The last notes can hang past the final paragraph. */}
                        <div className="clear-both" />
                    </ReadingChrome>
                </PreviewProvider>
            </CurrentSectionProvider>
            <ReadNext posts={posts} slug={post.slug} />
            <section aria-labelledby="past-writing-title">
                <h2
                    id="past-writing-title"
                    className={`${PAD} border-y border-neutral-200 py-6 font-semibold dark:border-neutral-800`}
                >
                    Past Writing
                </h2>
                <PostList />
            </section>
            <SiteFooter />
        </div>
    );
}
