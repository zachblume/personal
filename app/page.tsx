import { getBlogPosts } from "app/blog/utils";
import { Art } from "app/components/Art";
import { PostRow } from "app/components/PostRow";
import { SiteFooter, SiteHeader } from "app/components/SiteChrome";

function shortDate(publishedAt: string) {
    return new Date(`${publishedAt}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export default function Page() {
    const posts = getBlogPosts().sort((a, b) =>
        a.metadata.publishedAt < b.metadata.publishedAt ? 1 : -1,
    );

    // Art is keyed on chronological rank, not display position: new posts
    // append to the end of that order, so publishing never reshuffles the
    // artwork of a post that's already out.
    const rank: Record<string, number> = {};
    posts.forEach((post, i) => {
        rank[post.slug] = posts.length - 1 - i;
    });

    return (
        <div className="full-bleed min-h-screen w-full bg-white dark:bg-black">
            <SiteHeader current="home" />

            <ul>
                {posts.map((post, i) => (
                    <PostRow
                        key={post.slug}
                        slug={post.slug}
                        title={post.metadata.title}
                        summary={post.metadata.summary || ""}
                        date={shortDate(post.metadata.publishedAt)}
                        ordinal={posts.length - i}
                        art={
                            <Art
                                slug={post.slug}
                                index={rank[post.slug]}
                                className="aspect-[16/9] w-full transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                            />
                        }
                    />
                ))}
            </ul>

            <SiteFooter />
        </div>
    );
}
