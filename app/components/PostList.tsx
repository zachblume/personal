import { Art } from "app/components/Art";
import { PostRow } from "app/components/PostRow";
import { ReadingHistory } from "app/components/ReadingHistory";
import { getPosts, type Post } from "app/lib/posts";

/**
 * The archive as rows, newest first. Art is keyed on chronological rank
 * (`artIndex`), not display position: new posts append to the end of that
 * order, so publishing never reshuffles the artwork of a post that's
 * already out.
 */
export function PostRows({ posts }: { posts: Post[] }) {
    return (
        <ul>
            {posts.map((post, i) => (
                <PostRow
                    key={post.slug}
                    slug={post.slug}
                    title={post.title}
                    summary={post.summary}
                    date={post.date}
                    ordinal={posts.length - i}
                    art={
                        <Art
                            slug={post.slug}
                            index={post.artIndex}
                            className="aspect-[16/9] w-full transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                        />
                    }
                />
            ))}
        </ul>
    );
}

/** The reading-history strip, handed only the fields it draws. */
export function PostHistory({ posts }: { posts: Post[] }) {
    return (
        <ReadingHistory
            posts={posts.map(({ slug, title, year }) => ({
                slug,
                title,
                year,
            }))}
        />
    );
}

/** Every post as a row, then the reading-history strip. */
export function PostList() {
    const posts = getPosts();
    return (
        <>
            <PostRows posts={posts} />
            <PostHistory posts={posts} />
        </>
    );
}
