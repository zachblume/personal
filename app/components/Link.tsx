"use client";
import NextLink from "next/link";

function Link({ href, children, ...props }) {
    return (
        <NextLink
            onClick={() => {
                try {
                    const pathname = new URL(href, window.location.href)
                        .pathname;
                    window.localStorage.setItem(pathname, "true");
                } catch (error) {
                    console.error(error);
                }
            }}
            prefetch={true}
            href={href}
            {...props}
        >
            {children}
        </NextLink>
    );
}

export { Link };
