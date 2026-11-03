import nextVitals from "eslint-config-next/core-web-vitals";
import * as mdx from "eslint-plugin-mdx";

const config = [
    ...nextVitals,
    {
        ignores: [
            ".next/**",
            "out/**",
            "build/**",
            ".context/**",
            "next-env.d.ts",
        ],
    },
    {
        ...mdx.flat,
        processor: mdx.createRemarkProcessor({ lintCodeBlocks: true }),
    },
    mdx.flatCodeBlocks,
];

export default config;
