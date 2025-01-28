import { Link } from "app/components/Link";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import { highlight } from "sugar-high";
import React from "react";
import { slugify } from "app/lib/slugify";

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

function createHeading(level, headers) {
    const Heading = ({ children }) => {
        const slug = slugify(children);
        headers.push({ level, text: children });
        return React.createElement(
            `h${level}`,
            { id: slug },
            [
                React.createElement("a", {
                    href: `#${slug}`,
                    key: `link-${slug}`,
                    className: "anchor",
                }),
            ],
            children,
        );
    };

    Heading.displayName = `Heading${level}`;

    return Heading;
}

const components = (headers) => ({
    h1: createHeading(1, headers),
    h2: createHeading(2, headers),
    h3: createHeading(3, headers),
    h4: createHeading(4, headers),
    h5: createHeading(5, headers),
    h6: createHeading(6, headers),
    Image: RoundedImage,
    a: CustomLink,
    code: Code,
    Table,
});

export function CustomMDX(props) {
    const headers = [];
    return (
        <MDXRemote
            {...props}
            components={{ ...components(headers), ...(props.components || {}) }}
        />
    );
}
