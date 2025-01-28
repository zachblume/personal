"use client";
import { Link } from "app/components/Link";
import { useState, useEffect } from "react";
import { CheckboxIcon, BookmarkIcon, ReaderIcon } from "@radix-ui/react-icons";
import { formatDate } from "app/blog/clientUtils";
import { Tooltip } from "@radix-ui/themes";

const loadIsVisited = (href) => {
    if (typeof window !== "undefined" && window?.localStorage) {
        return window.localStorage.getItem(href) || false;
    }
    return false;
};

const useIsVisited = (href) => {
    const [isVisited, setIsVisited] = useState(false);
    useEffect(() => {
        setIsVisited(!!loadIsVisited(href));
    }, [href]);
    return isVisited;
};

const ConditionalTooltip = (props) => {
    const [show, setShow] = useState(false);
    useEffect(() => {
        setShow(!!props.content);
    }, [props.content]);
    if (!show) {
        return props.children;
    }
    return <Tooltip {...props}>{props.children}</Tooltip>;
};

const BlogLink = ({ post }) => {
    const href = `/blog/${post.slug}`;
    const isVisited = useIsVisited(href);
    const cn = isVisited ? "visited-blog-link" : "";
    return (
        <span className={cn}>
            <Link
                key={post.slug}
                className="flex flex-col space-y-1 mb-4"
                href={href}
                show="true"
            >
                <div className="w-full flex flex-col md:flex-row space-x-0 md:space-x-2">
                    <p className="text-neutral-400 dark:text-neutral-400 w-[115px]">
                        {formatDate(post.metadata.publishedAt, false)}
                    </p>
                    <p className="underline-link text-neutral-900 dark:text-neutral-100 tracking-tight">
                        {post.metadata.title}
                    </p>
                    {isVisited ? (
                        <ConditionalTooltip
                            content={isVisited ? "Previously read" : null}
                            side="bottom"
                        >
                            <ReaderIcon
                                height={13}
                                width={13}
                                className="my-auto !text-gray-400 mx-1"
                            />
                        </ConditionalTooltip>
                    ) : null}
                </div>
            </Link>
        </span>
    );
};

export { BlogLink };
