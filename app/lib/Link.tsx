import { Link as NextLink } from "next-view-transitions";

function Link({ href, children, ...props }) {
    const isBlogLink = href.includes("/blog/");
    const className = isBlogLink ? "visited-blog-link" : "";

    return (
        <NextLink href={href} className={className} {...props}>
            {children}
        </NextLink>
    );
}

export { Link };
