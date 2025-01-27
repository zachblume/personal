import { Link } from "app/components/Link";
import { formatDate, getBlogPosts } from "app/blog/utils";

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
                    <Link
                        key={post.slug}
                        className="flex flex-col space-y-1 mb-4"
                        href={`/blog/${post.slug}`}
                    >
                        <div className="w-full flex flex-col md:flex-row space-x-0 md:space-x-2">
                            <p className="text-neutral-400 dark:text-neutral-400 w-[115px]">
                                {formatDate(post.metadata.publishedAt, false)}
                            </p>
                            <p className="underline-link text-neutral-900 dark:text-neutral-100 tracking-tight">
                                {post.metadata.title}
                            </p>
                        </div>
                    </Link>
                ))}
        </div>
    );
}
