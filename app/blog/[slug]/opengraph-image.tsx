import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { Children, cloneElement, isValidElement } from "react";
import { formatDate, getArtIndex, getBlogPosts } from "app/blog/utils";
import { Art } from "app/components/Art";
import { SITE } from "app/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "The post's title and summary beside its generated artwork";

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

/** Large for a word or two; most titles settle at 60px in two or three lines. */
function titleSize(title: string) {
    if (title.length <= 16) return 96;
    if (title.length <= 30) return 76;
    if (title.length <= 50) return 60;
    return 56;
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
    const { title, summary, publishedAt } = post.metadata;

    return new ImageResponse(
        <div tw="flex w-full h-full bg-white" style={{ fontFamily: "Geist" }}>
            <div tw="flex flex-col flex-1 h-full">
                {/* The site header in miniature: signature, then a hairline. */}
                <div tw="flex items-center justify-between h-[112px] pl-16 pr-14 border-b-2 border-neutral-200">
                    <div
                        tw="text-[34px] text-neutral-900"
                        style={{
                            fontFamily: "Geist Serif",
                            letterSpacing: "-0.035em",
                        }}
                    >
                        {SITE.name}
                    </div>
                    <div tw="text-[24px] text-neutral-500">
                        {formatDate(publishedAt)}
                    </div>
                </div>
                {/* Centred rather than bottom-aligned: X lays the domain over
                    the card's bottom-left corner. */}
                <div tw="flex flex-col flex-1 justify-center pl-16 pr-14 pb-10">
                    <div
                        tw="text-neutral-900"
                        style={{
                            fontFamily: "Geist Serif",
                            fontSize: titleSize(title),
                            lineHeight: 1.08,
                            letterSpacing: "-0.025em",
                            textWrap: "balance",
                        }}
                    >
                        {title}
                    </div>
                    {summary ? (
                        <div
                            tw="mt-7 text-[26px] text-neutral-500"
                            style={{
                                display: "block",
                                lineClamp: 3,
                                lineHeight: 1.4,
                                textWrap: "pretty",
                            }}
                        >
                            {summary}
                        </div>
                    ) : null}
                </div>
            </div>
            {/* No stylesheet here, so the art inlines literal colors. */}
            {inline(
                <Art
                    slug={slug}
                    index={getArtIndex(slug)}
                    literal
                    width={480}
                    height={size.height}
                />,
            )}
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
