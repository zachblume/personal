"use client";
import { Link as NextLink, useTransitionRouter } from "next-view-transitions";
import { useState, useEffect } from "react";

const loadIsVisited = (href) => {
    if (typeof window !== "undefined" && window?.localStorage) {
        return window.localStorage.getItem(href) || false;
    }
    return false;
};

const useIsVisited = (href) => {
    const [isVisited, setIsVisited] = useState(loadIsVisited(href) || false);
    useEffect(() => {
        setIsVisited(loadIsVisited(href));
    }, [href]);
    return isVisited;
};

function Link({ href, children, ...props }) {
    const router = useTransitionRouter();
    const isBlogLink = href.includes("/blog/");
    const isVisited = useIsVisited(href);
    const className = isBlogLink && isVisited ? "visited-blog-link" : "";

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
