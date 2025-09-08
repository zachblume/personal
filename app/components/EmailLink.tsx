"use client";

export function EmailLink() {
    return (
        <a
            href="#"
            onClick={(e) => {
                e.preventDefault();
                const user = "zachblume";
                const domain = "gmail.com";
                window.location.href = `mailto:${user}@${domain}`;
            }}
            className="text-neutral-900 dark:text-white font-medium underline decoration-neutral-300 dark:decoration-neutral-700 underline-offset-2 hover:decoration-neutral-500 dark:hover:decoration-neutral-500 transition-colors"
        >
            <span
                dangerouslySetInnerHTML={{
                    __html: ["zach", "blume", "@", "gmail", ".com"].join(""),
                }}
            />
        </a>
    );
}
