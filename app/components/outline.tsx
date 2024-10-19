import React from "react";
import { CustomMDX, slugify } from "./mdx";

const Outline = ({ headers }) => {
    return (
        <nav>
            <ul className="list-none">
                {headers?.map((header, index) => (
                    <li key={index} className={`ml-${header.level - 1}`}>
                        <a
                            href={`#${slugify(header.text)}`}
                            className="underline-link text-neutral-400 !decoration-neutral-200"
                        >
                            <CustomMDX
                                source={header.text.replaceAll(
                                    // links
                                    /\[([^\]]+)\]\(([^\)]+)\)/g,
                                    "$1",
                                )}
                            />
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Outline;
