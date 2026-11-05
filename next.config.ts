import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactCompiler: true,
    // /api/listen reads the posts at request time (to check that the text it
    // voices is really in the post). Pages read them at build, so nothing else
    // pulls the MDX into a function bundle.
    outputFileTracingIncludes: {
        "/api/listen": ["./app/blog/posts/**/*"],
    },
};

export default nextConfig;
