import { readdirSync } from "node:fs";
import { transformFileSync } from "@babel/core";

// Audit every source file, including components unreachable from today's routes.
// Use the same default inference mode as Next; utilities aren't React components.
const files = readdirSync("app", { recursive: true })
    .filter((file) => /\.[jt]sx?$/.test(file))
    .sort();
let compiled = 0;
let failed = false;

for (const file of files) {
    const filename = `app/${file}`;
    try {
        transformFileSync(filename, {
            babelrc: false,
            configFile: false,
            parserOpts: { plugins: ["typescript", "jsx"] },
            plugins: [
                [
                    "babel-plugin-react-compiler",
                    {
                        logger: {
                            logEvent(source, event) {
                                if (event.kind === "CompileSuccess") {
                                    compiled++;
                                } else if (event.kind !== "Timing") {
                                    failed = true;
                                    console.error(source, event);
                                }
                            },
                        },
                    },
                ],
            ],
        });
    } catch (error) {
        failed = true;
        console.error(`${filename}: ${error.message}`);
    }
}

// Catch broken tooling/configuration that accidentally stops compiling anything.
if (compiled === 0) {
    failed = true;
    console.error("React Compiler did not compile any components or hooks.");
}

console.log(
    `React Compiler: ${compiled} components/hooks compiled across ${files.length} source files${failed ? "; audit failed" : "; no skips or diagnostics"}.`,
);
process.exitCode = failed ? 1 : 0;
