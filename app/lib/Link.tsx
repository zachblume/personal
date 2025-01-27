import { Link as NextLink } from "next-view-transitions";
import { useRouter } from "next/router";


function Link({ href, children, ...props }) {
    const router = useRouter();
    const isBlogLink = href.includes("/blog/");
    const className = isBlogLink ? "visited-blog-link" : "";

    return (
        <span className={className}>
            <NextLink
                onMouseDown={(e) => {
                    // If it is not a left click, exit
                    if (e.button !== 0) return;

                    // If the command key is held, let the link open in a new tab
                    if (e.metaKey || e.ctrlKey) return;

                    e.preventDefault();
                    router.push(href);
                }}
                onClick={(e) => {
                    // If it is not a left click, exit
                    if (e.button !== 0) return;

                    // If the command key is held, let the link open in a new tab
                    if (e.metaKey || e.ctrlKey) return;

                    e.preventDefault();
                }}
                prefetch={true}
                href={href}
                {...props}
                >
                    {children}
            </NextLink>
        </span>
    );
}

export { Link };
