import { Link as NextLink } from "next-view-transitions";

function Link({ href, children, ...props }) {
    const isBlogLink = href.includes("/blog/");
    const className = isBlogLink ? "visited-blog-link" : "";

    return (
        <span className={className}>
        <NextLink href={href} {...props}>
            {children}
        </NextLink>
        </span>
    );
}

export { Link };
