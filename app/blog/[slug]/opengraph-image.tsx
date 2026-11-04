import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { Children, cloneElement, isValidElement } from "react";
import { getArtIndex, getBlogPosts } from "app/blog/utils";
import { Art } from "app/components/Art";
import { SITE } from "app/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "The post's title over its generated artwork";

// Render every card at build time, so nothing reads the posts or fonts from
// disk at request time.
export function generateStaticParams() {
    return getBlogPosts().map((post) => ({ slug: post.slug }));
}

// Satori reads TTF/OTF/WOFF but not WOFF2, which is all Geist Serif ships
// as, so the card sets its type in Geist Sans.
const fonts = (weight: "Regular" | "Medium") =>
    readFile(
        join(
            process.cwd(),
            `node_modules/geist/dist/fonts/geist-sans/Geist-${weight}.ttf`,
        ),
    );

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
    const title = post?.metadata.title ?? SITE.name;

    return new ImageResponse(
        <div tw="flex w-full h-full relative bg-white">
            {/* No stylesheet here, so the art inlines literal colors. */}
            {inline(
                <Art
                    slug={slug}
                    index={Math.max(0, getArtIndex(slug))}
                    literal
                    width={size.width}
                    height={size.height}
                />,
            )}
            <div tw="absolute left-12 right-12 bottom-12 flex flex-col rounded-2xl bg-white px-12 py-10">
                <div tw="text-[26px] text-neutral-500">{SITE.name}</div>
                <div
                    tw="mt-3 text-[60px] leading-[1.08] text-neutral-900"
                    style={{ fontWeight: 500 }}
                >
                    {title}
                </div>
            </div>
        </div>,
        {
            ...size,
            fonts: [
                {
                    name: "Geist",
                    data: await fonts("Regular"),
                    weight: 400,
                },
                {
                    name: "Geist",
                    data: await fonts("Medium"),
                    weight: 500,
                },
            ],
        },
    );
}
