import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { Children, cloneElement, isValidElement } from "react";
import { getArtIndex, getBlogPosts } from "app/blog/utils";
import { Art } from "app/components/Art";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "The post's title and summary over its generated artwork";

// Render every card at build time, so nothing reads the posts or fonts from
// disk at request time.
export function generateStaticParams() {
    return getBlogPosts().map((post) => ({ slug: post.slug }));
}

/**
 * Both faces are copies with the `kern` feature removed (see app/fonts).
 * Satori breaks lines using unkerned glyph widths but draws each word kerned,
 * so with kerning on, every word ends early and the space after it opens up.
 * Geist Serif also ships only as WOFF2, which Satori can't read.
 */
const font = (file: string) => readFile(join(process.cwd(), "app/fonts", file));
const [serif, sans] = await Promise.all([
    font("GeistSerif-Regular.ttf"),
    font("Geist-Regular.ttf"),
]);

/** As big as the title can go: LinkedIn and X show the card as a thumbnail,
 *  so it has to read at a fraction of its size. Most titles take two lines. */
function titleSize(title: string) {
    if (title.length <= 16) return 150;
    if (title.length <= 30) return 116;
    if (title.length <= 50) return 96;
    return 80;
}

/**
 * Satori serializes an <svg> subtree as-is and can't expand function
 * components inside it (Art draws with <Blob>), so call them down to plain
 * SVG elements first.
 */
function inline(node: React.ReactNode): React.ReactNode {
    if (!isValidElement<{ children?: React.ReactNode }>(node)) return node;
    if (typeof node.type === "function") {
        return inline(
            (node.type as (props: object) => React.ReactNode)(node.props),
        );
    }
    if (node.props.children === undefined) return node;
    return cloneElement(
        node,
        undefined,
        ...Children.toArray(node.props.children).map(inline),
    );
}

export default async function Image({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const post = getBlogPosts().find((post) => post.slug === slug);
    if (!post) notFound();
    const { title, summary } = post.metadata;

    return new ImageResponse(
        <div tw="relative flex w-full h-full">
            {/* No stylesheet here, so the art inlines literal colors. */}
            <div tw="absolute inset-0 flex">
                {inline(
                    <Art
                        slug={slug}
                        index={getArtIndex(slug)}
                        literal
                        width={size.width}
                        height={size.height}
                    />,
                )}
            </div>
            {/* A white wash under the text keeps it legible on any artwork. */}
            <div
                tw="absolute inset-0 flex"
                style={{
                    backgroundImage:
                        "linear-gradient(90deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.6) 55%, rgba(255,255,255,0) 100%)",
                }}
            />
            {/* Centred rather than bottom-aligned: X lays the domain over
                the card's bottom-left corner. */}
            <div tw="relative flex flex-col justify-center w-full h-full px-20 pb-6">
                <div
                    tw="text-neutral-900"
                    style={{
                        fontFamily: "Geist Serif",
                        fontSize: titleSize(title),
                        lineHeight: 1.04,
                        letterSpacing: "-0.03em",
                        textWrap: "balance",
                        maxWidth: 980,
                    }}
                >
                    {title}
                </div>
                {summary ? (
                    <div
                        tw="mt-9 text-neutral-700"
                        style={{
                            fontFamily: "Geist",
                            display: "block",
                            fontSize: 38,
                            lineClamp: 3,
                            lineHeight: 1.3,
                            letterSpacing: "-0.01em",
                            textWrap: "pretty",
                            maxWidth: 900,
                        }}
                    >
                        {summary}
                    </div>
                ) : null}
            </div>
        </div>,
        {
            ...size,
            fonts: [
                { name: "Geist Serif", data: serif, weight: 400 },
                { name: "Geist", data: sans, weight: 400 },
            ],
        },
    );
}
