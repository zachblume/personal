import { cache } from "react";
import { PreviewLink } from "app/components/article/previews";
import { Art } from "app/components/Art";
import { Link } from "app/components/Link";
import { getPosts } from "app/lib/posts";
import { baseUrl } from "app/sitemap";

const postsByHref = cache(
    () => new Map(getPosts().map((post) => [post.href, post])),
);

const SITE_HOST = new URL(baseUrl).hostname.replace(/^www\./, "");

/** An http(s) URL, resolving site-rooted paths; null for anything else. */
function parse(href: string, rooted: boolean) {
    try {
        const url = rooted ? new URL(href, baseUrl) : new URL(href);
        return /^https?:$/.test(url.protocol) ? url : null;
    } catch {
        // Relative or unparseable.
        return null;
    }
}

function readable(pathname: string) {
    try {
        return decodeURI(pathname);
    } catch {
        return pathname;
    }
}

/**
 * The article's `a`. Runs on the server: a link to a post gets that post's
 * card and its artwork, drawn here and handed to the client as a node; an
 * outbound link gets its domain. Anything else is an ordinary link.
 */
export function ArticleLink({
    href = "",
    children,
    ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
    if (href.startsWith("#")) {
        return (
            <a href={href} {...props}>
                {children}
            </a>
        );
    }

    const rooted = href.startsWith("/") && !href.startsWith("//");
    const url = parse(href, rooted);
    if (!url) {
        return (
            <a href={href} {...props}>
                {children}
            </a>
        );
    }

    const internal = rooted || url.hostname.replace(/^www\./, "") === SITE_HOST;

    if (internal) {
        const post = postsByHref().get(url.pathname.replace(/\/$/, ""));
        // Same-site links stay relative, so they work on preview deploys.
        const local = `${url.pathname}${url.search}${url.hash}`;
        if (!post) {
            return (
                <Link href={local} {...props}>
                    {children}
                </Link>
            );
        }
        return (
            <PreviewLink
                href={local}
                preview={{
                    kind: "post",
                    title: post.title,
                    summary: post.summary,
                    date: post.date,
                    minutes: post.minutes,
                    art: (
                        <Art
                            slug={post.slug}
                            index={post.artIndex}
                            idPrefix="preview-"
                            className="aspect-[16/9] w-full"
                        />
                    ),
                }}
                {...props}
            >
                {children}
            </PreviewLink>
        );
    }

    return (
        <PreviewLink
            href={href}
            preview={{
                kind: "external",
                host: url.hostname.replace(/^www\./, ""),
                path: url.pathname === "/" ? "" : readable(url.pathname),
            }}
            {...props}
        >
            {children}
        </PreviewLink>
    );
}
