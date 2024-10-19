import React from "react";

const Outline = ({ headers }) => {
    return (
        <nav className="w-full pl-4">
            <ul className="list-none">
                {headers.map((header, index) => (
                    <li key={index} className={`ml-${header.level - 1}`}>
                        <a href={`#${header.text.toLowerCase().replace(/\s+/g, '-')}`} className="text-blue-500 hover:underline">
                            {header.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Outline;
