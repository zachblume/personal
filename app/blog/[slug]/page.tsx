import { notFound } from "next/navigation";
import { CustomMDX } from "app/components/mdx";
import { formatDate, getArtIndex, getBlogPosts } from "app/blog/utils";
import { Art } from "app/components/Art";
import { baseUrl } from "app/sitemap";
import Outline from "app/components/outline";
import { PostList } from "app/components/PostList";
import { PostNeighbours } from "app/components/PostNeighbours";
import { PAD, SiteFooter, SiteHeader } from "app/components/SiteChrome";

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

export default async function Blog({ params }: BlogProps) {
    const { slug } = await params;
    const post = getBlogPosts().find((post) => post.slug === slug);

    if (!post) {
        notFound();
    }

    const headers = post.content
        .split("\n")
        .filter((line) => line?.startsWith("#"))
        .map((line: string) => {
            const level = line.match(/^#+/)?.[0].length;
            const text = line.replace(/^#+\s*/, "");
            return { level, text };
        });

    return (
        <div className="full-bleed min-h-screen w-full bg-white dark:bg-black">
            <SiteHeader current="home" />
            <section className="relative mx-6 max-w-xl py-12 md:mx-auto md:py-16">
                {/* The post's artwork as a card above the title, so the color
                    clicked in the archive carries through to the page. */}
                <div className="mb-10 overflow-hidden rounded-lg border border-neutral-200/80 dark:border-neutral-800">
                    <Art
                        slug={post.slug}
                        index={getArtIndex(post.slug)}
                        className="aspect-[16/9] w-full"
                    />
                </div>
                <script
                    type="application/ld+json"
                    suppressHydrationWarning
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "BlogPosting",
                            headline: post.metadata.title,
                            datePublished: post.metadata.publishedAt,
                            dateModified: post.metadata.publishedAt,
                            description: post.metadata.summary,
                            image: post.metadata.image
                                ? `${baseUrl}${post.metadata.image}`
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
                    {post.metadata.title}
                </h1>
                <div className="flex justify-between items-center mt-2 mb-8 text-sm">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {formatDate(post.metadata.publishedAt)}
                    </p>
                </div>
                <article className="prose">
                    <CustomMDX source={post.content} />
                </article>
                <aside className="absolute inset-y-16 left-full ml-16 hidden w-48 xl:block">
                    <div className="sticky top-12">
                        <Outline headers={headers} />
                    </div>
                </aside>
            </section>
            <PostNeighbours slug={post.slug} />
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
