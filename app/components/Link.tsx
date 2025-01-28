"use client";
import { Link as NextLink, useTransitionRouter } from "next-view-transitions";

function Link({ href, children, ...props }) {
    const router = useTransitionRouter();

    return (
        <NextLink
            onMouseDown={(e) => {
                // If it is not a left click, exit
                if (e.button !== 0) return;

                // If the command key is held, let the link open in a new tab
                if (e.metaKey || e.ctrlKey) return;

                e.preventDefault();
                // Put the pathname of the href in localstorage
                try {
                    const pathnameOfHref = new URL(href).pathname;
                    window.localStorage.setItem(pathnameOfHref, "true");
                } catch (e) {
                    console.error(e);
                }
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
    );
}

export { Link };
