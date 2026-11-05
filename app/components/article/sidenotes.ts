/**
 * Server-only. Rewrites a post's MDX so its longer parenthetical asides
 * become <Sidenote> elements. The posts have no footnotes, but they do have a
 * lot of "(…)" asides, and those are what a margin note would hold if they
 * had been written as such.
 *
 * String-level and deliberately narrow: fenced and inline code, links,
 * headings and JSX are copied through untouched, an aside never crosses a
 * blank line, and anything under MIN_WORDS stays inline where it was.
 */

const MIN_WORDS = 4;

const WORDISH = /[\p{L}\p{N}]/u;
const TRAILING = /[.,;:!?]/;

/** Words in an aside, not counting link targets. */
function wordCount(text: string) {
    return text
        .replace(/\]\([^)]*\)/g, "]")
        .split(/\s+/)
        .filter((word) => WORDISH.test(word)).length;
}

/** Index just past the run of `ch` starting at `from`. */
function runEnd(src: string, from: number, ch: string) {
    let i = from;
    while (src[i] === ch) i++;
    return i;
}

/** Index of the `)` that closes the `(` at `open`, or -1. Doesn't cross a
 *  paragraph break, and skips over inline code so a `)` inside it can't
 *  close anything. */
function closingParen(src: string, open: number) {
    let depth = 0;
    for (let i = open; i < src.length; i++) {
        const ch = src[i];
        if (ch === "`") {
            const ticks = runEnd(src, i, "`") - i;
            const close = src.indexOf("`".repeat(ticks), i + ticks);
            if (close === -1) return -1;
            i = close + ticks - 1;
        } else if (ch === "\n" && /^\n[ \t]*\n/.test(src.slice(i, i + 64))) {
            return -1;
        } else if (ch === "(") {
            depth++;
        } else if (ch === ")") {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

/** Index of the `]` matching the `[` at `open`, or -1. */
function closingBracket(src: string, open: number) {
    let depth = 0;
    for (let i = open; i < src.length; i++) {
        if (src[i] === "\n" && src[i + 1] === "\n") return -1;
        if (src[i] === "[") depth++;
        if (src[i] === "]" && --depth === 0) return i;
    }
    return -1;
}

export function toSidenotes(mdx: string) {
    let out = "";
    let count = 0;
    let i = 0;
    let lineStart = true;

    const copyTo = (end: number) => {
        out += mdx.slice(i, end);
        lineStart = mdx[end - 1] === "\n";
        i = end;
    };
    const lineEnd = (from: number) => {
        const nl = mdx.indexOf("\n", from);
        return nl === -1 ? mdx.length : nl + 1;
    };

    while (i < mdx.length) {
        if (lineStart) {
            const rest = mdx.slice(i, i + 16);
            const fence = /^[ \t]*(`{3,}|~{3,})/.exec(rest);
            if (fence) {
                // Through the closing fence (or to the end, if it's missing).
                const marker = fence[1];
                let j = lineEnd(i);
                while (j < mdx.length) {
                    const next = lineEnd(j);
                    if (mdx.slice(j, next).trim().startsWith(marker)) {
                        j = next;
                        break;
                    }
                    j = next;
                }
                copyTo(j);
                continue;
            }
            if (/^[ \t]*#{1,6}\s/.test(rest)) {
                copyTo(lineEnd(i));
                continue;
            }
        }

        const ch = mdx[i];

        if (ch === "`") {
            const ticks = runEnd(mdx, i, "`") - i;
            const close = mdx.indexOf("`".repeat(ticks), i + ticks);
            copyTo(close === -1 ? i + ticks : close + ticks);
            continue;
        }

        if (ch === "[") {
            // A link or image: copy text and target whole, so neither the
            // URL's parens nor an aside inside the link text are touched.
            const close = closingBracket(mdx, i);
            if (close !== -1 && mdx[close + 1] === "(") {
                const end = closingParen(mdx, close + 1);
                if (end !== -1) {
                    copyTo(end + 1);
                    continue;
                }
            }
        }

        if (ch === "<" || ch === "{") {
            const close = mdx.indexOf(ch === "<" ? ">" : "}", i);
            if (close !== -1) {
                copyTo(close + 1);
                continue;
            }
        }

        if (ch === "(") {
            const aside = asideAt(mdx, i, out);
            if (aside) {
                count++;
                out =
                    aside.before +
                    `<Sidenote n="${count}">${aside.body}</Sidenote>`;
                i = aside.end;
                lineStart = false;
                continue;
            }
        }

        out += ch;
        lineStart = ch === "\n";
        i++;
    }

    return { source: out, count };
}

/**
 * Whether the `(` at `open` starts an aside worth moving to the margin, and
 * if so how to splice it in. `out` is everything emitted so far. The space
 * (or soft line break) before the paren is eaten, since the marker sits hard
 * against the word, and punctuation straight after the `)` moves in front of
 * the marker: "…here (aside)." → "…here.¹".
 */
function asideAt(src: string, open: number, out: string) {
    // `expectation(s)`, `when()`: a paren hard against a word isn't an aside.
    if (out && !/\s$/.test(out)) return null;

    const close = closingParen(src, open);
    if (close === -1) return null;
    const inner = src.slice(open + 1, close);
    if (wordCount(inner) < MIN_WORDS) return null;
    if (/[<>{}]/.test(inner)) return null;

    const before = out.replace(/[ \t]*\n?[ \t]*$/, "");
    const lastLine = before.slice(before.lastIndexOf("\n") + 1);
    // An aside needs a line to hang from: not at the start of a paragraph or
    // list item, and never folded up into a heading.
    if (!WORDISH.test(lastLine.replace(/^\s*([-*+]|\d+[.)]|>)\s+/, "")))
        return null;
    if (/^\s*#/.test(lastLine)) return null;

    const next = src[close + 1];
    const after =
        next && TRAILING.test(next) && !TRAILING.test(src[close + 2] ?? "")
            ? next
            : "";

    return {
        before: before + after,
        body: inner.replace(/\s*\n\s*/g, " ").trim(),
        end: close + 1 + after.length,
    };
}
