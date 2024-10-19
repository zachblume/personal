import { BlogPosts } from "app/components/posts";
import Link from "next/link";

export default function Page() {
    return (
        <section>
            <h1 className="mb-8 text-2xl font-semibold tracking-tighter">
                Zach Blume
            </h1>
            <p className="mb-4">
                Where my writing lives. Bio at{" "}
                <Link
                    href="https://github.com/zachblume/"
                    className="underline-link"
                >
                    GitHub
                </Link>
                .
            </p>
            <div className="my-8">
                <BlogPosts />
            </div>
        </section>
    );
}
