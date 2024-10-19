import React from "react";

const Outline = ({ headers }) => {
    return (
        <nav>
            <ul>
                {headers.map((header, index) => (
                    <li key={index} style={{ marginLeft: `${header.level - 1}em` }}>
                        <a href={`#${header.text.toLowerCase().replace(/\s+/g, '-')}`}>
                            {header.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Outline;
