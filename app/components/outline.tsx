import { CustomMDX } from "./mdx";
import { OutlineNavLink } from "./OutlineNavLink";

const Outline = ({
    // title,
    headers,
}) => {
    if (!Array.isArray(headers) || !headers?.length) {
        return null;
    }
    return (
        <nav>
            <h3 className="text-xs mb-1 text-neutral-400">Outline</h3>
            <ul className="list-none">
                {headers.map((header) => (
                    <OutlineNavLink key={header.text} header={header}>
                        <CustomMDX
                            source={
                                header.text.replaceAll(
                                    // links
                                    /\[([^\]]+)\]\(([^\)]+)\)/g,
                                    "$1",
                                ).length > 20
                                    ? header.text
                                          .replaceAll(
                                              // links
                                              /\[([^\]]+)\]\(([^\)]+)\)/g,
                                              "$1",
                                          )
                                          .slice(0, 20) + "..."
                                    : header.text
                            }
                        />
                    </OutlineNavLink>
                ))}
            </ul>
        </nav>
    );
};

export default Outline;
