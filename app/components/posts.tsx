import { formatDate, getBlogPosts } from "app/blog/utils";
import { BlogLink } from "./BlogLink";

export function BlogPosts() {
    const allBlogs = getBlogPosts();

    return (
        <div>
            {allBlogs
                .sort((a, b) => {
                    if (
                        new Date(a.metadata.publishedAt) >
                        new Date(b.metadata.publishedAt)
                    ) {
                        return -1;
                    }
                    return 1;
                })
                .map((post) => (
                    <BlogLink post={post} key={post.slug} />
                ))}
        </div>
    );
}
