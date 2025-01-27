import { Link as NextLink } from "next-view-transitions";
import { Checkbox } from "@radix-ui/themes";

function Link({ href, children, ...props }) {
    const isBlogLink = href.startsWith("/blog/");
    const className = isBlogLink ? "visited-blog-link" : "";

    return (
        <NextLink href={href} className={className} {...props}>
            {children}
            {isBlogLink && <Checkbox />}
        </NextLink>
    );
}

export { Link };
