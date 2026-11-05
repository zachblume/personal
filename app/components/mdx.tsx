import { Link } from "app/components/Link";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import { highlight } from "sugar-high";
import React from "react";
import { slugify } from "app/lib/slugify";
import { CopyButton } from "app/components/CopyButton";
import { HeadingAnchor } from "app/components/HeadingAnchor";

function Table({ data }) {
    const headers = data.headers.map((header, index) => (
        <th key={index}>{header}</th>
    ));
    const rows = data.rows.map((row, index) => (
        <tr key={index}>
            {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
            ))}
        </tr>
    ));

    return (
        <table>
            <thead>
                <tr>{headers}</tr>
            </thead>
            <tbody>{rows}</tbody>
        </table>
    );
}

function CustomLink(props) {
    const href = props.href;

    if (href.startsWith("/")) {
        return (
            <Link href={href} {...props}>
                {props.children}
            </Link>
        );
    }

    if (href.startsWith("#")) {
        return <a {...props} />;
    }

    return <a target="_blank" rel="noopener noreferrer" {...props} />;
}

function RoundedImage(props) {
    return <Image alt={props.alt} className="rounded-lg" {...props} />;
}

function Code({ children, ...props }) {
    const codeHTML = highlight(children);
    return <code dangerouslySetInnerHTML={{ __html: codeHTML }} {...props} />;
}

/** `title="app/x.ts"`, `filename=...`, or a bare path-looking first token. */
function parseFilename(meta?: string) {
    if (!meta) return undefined;
    const named = meta.match(
        /(?:title|filename|file)=(?:"([^"]+)"|'([^']+)'|(\S+))/,
    );
    if (named) return named[1] ?? named[2] ?? named[3];
    const bare = meta.split(/\s+/)[0];
    return /[./]/.test(bare) && !bare.includes("=") ? bare : undefined;
}

/**
 * Fenced code gets a tab with its filename (from the fence's meta string,
 * e.g. ```ts title="app/x.ts") or, failing that, its language, plus a copy
 * button. Unlabelled blocks keep just the button, shown on hover.
 */
function Pre({ children, ...props }) {
    const code = React.isValidElement(children)
        ? (children.props as {
              className?: string;
              children?: unknown;
              "data-meta"?: string;
          })
        : {};
    const source =
        typeof code.children === "string" ? code.children.trimEnd() : "";
    const language = code.className?.replace(/^language-/, "");
    const label = parseFilename(code["data-meta"]) ?? language;

    // data-listen-skip: the label and button are chrome, not prose to read.
    return (
        <figure className="code-block group">
            {label ? (
                <figcaption data-listen-skip>
                    <span className="truncate">{label}</span>
                    <CopyButton text={source} />
                </figcaption>
            ) : (
                <span data-listen-skip className="contents">
                    <CopyButton
                        text={source}
                        className="absolute right-3 top-2.5 z-10 font-mono text-xs opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    />
                </span>
            )}
            <pre {...props}>{children}</pre>
        </figure>
    );
}

/** MDX drops a code fence's meta string; keep it on the <code> as data-meta. */
function rehypeCodeMeta() {
    const visit = (node) => {
        if (node.tagName === "code" && node.data?.meta) {
            node.properties = { ...node.properties, dataMeta: node.data.meta };
        }
        node.children?.forEach(visit);
    };
    return visit;
}

/** The text a node renders, so a heading with a link or code in it still
 *  gets the id that article/headings.ts gives it. */
function textOf(node: React.ReactNode): string {
    if (typeof node === "string" || typeof node === "number") {
        return String(node);
    }
    if (Array.isArray(node)) return node.map(textOf).join("");
    if (React.isValidElement(node)) {
        return textOf((node.props as { children?: React.ReactNode }).children);
    }
    return "";
}

function createHeading(level) {
    const Heading = ({ children }) => {
        const slug = slugify(textOf(children));
        return React.createElement(
            `h${level}`,
            { id: slug },
            [React.createElement(HeadingAnchor, { slug, key: `link-${slug}` })],
            children,
        );
    };

    Heading.displayName = `Heading${level}`;

    return Heading;
}

const components = {
    h1: createHeading(1),
    h2: createHeading(2),
    h3: createHeading(3),
    h4: createHeading(4),
    h5: createHeading(5),
    h6: createHeading(6),
    Image: RoundedImage,
    a: CustomLink,
    code: Code,
    pre: Pre,
    Table,
};

/**
 * `components` adds to or overrides the defaults — the article page passes
 * its own `a` (link previews) and `Sidenote`.
 */
export function CustomMDX(props) {
    return (
        <MDXRemote
            {...props}
            options={{
                ...props.options,
                mdxOptions: {
                    ...props.options?.mdxOptions,
                    rehypePlugins: [
                        rehypeCodeMeta,
                        ...(props.options?.mdxOptions?.rehypePlugins || []),
                    ],
                },
            }}
            components={{ ...components, ...(props.components || {}) }}
        />
    );
}
