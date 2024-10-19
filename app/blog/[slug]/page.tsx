import { notFound } from "next/navigation";
import { CustomMDX } from "app/components/mdx";
import { formatDate, getBlogPosts } from "app/blog/utils";
import { baseUrl } from "app/sitemap";
import Outline from "app/components/outline";

export async function generateStaticParams() {
    const posts = getBlogPosts();

    return posts.map((post) => ({
        slug: post.slug,
    }));
}

export function generateMetadata({ params }) {
    const post = getBlogPosts().find((post) => post.slug === params.slug);
    if (!post) {
        return;
    }

    const {
        title,
        publishedAt: publishedTime,
        summary: description,
        image,
    } = post.metadata;
    const ogImage = image
        ? image
        : `${baseUrl}/og?title=${encodeURIComponent(title)}`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "article",
            publishedTime,
            url: `${baseUrl}/blog/${post.slug}`,
            images: [
                {
                    url: ogImage,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [ogImage],
        },
    };
}

export default function Blog({ params }) {
    const post = getBlogPosts().find((post) => post.slug === params.slug);

    if (!post) {
        notFound();
    }

    const headers = post.content.match(/<h[1-6].*?>(.*?)<\/h[1-6]>/g)?.map(header => {
        const level = parseInt(header.match(/<h([1-6])/)[1]);
        const text = header.replace(/<.*?>/g, "");
        return { level, text };
    }) || [];

    return (
        <section className="flex">
            <div className="flex-1">
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
                                : `/og?title=${encodeURIComponent(
                                    post.metadata.title,
                                )}`,
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
            </div>
            <div className="w-1/4 pl-8">
                <Outline headers={headers} />
            </div>
        </section>
    );
}
