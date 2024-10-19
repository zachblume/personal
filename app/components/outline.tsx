import { CustomMDX } from "./mdx";
import { HeaderNavLink } from "./HeaderNavLink";

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
                    <HeaderNavLink key={header.text} header={header}>
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
                    </HeaderNavLink>
                ))}
            </ul>
        </nav>
    );
};

export default Outline;
