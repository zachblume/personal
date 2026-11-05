/**
 * Splits a rendered article into the chunks the player voices, each with a
 * DOM Range over the text it came from, so one unit drives the audio
 * request, the highlight and click-to-jump.
 *
 * It works on the rendered DOM rather than the MDX source because that's
 * what the highlight has to point at: a sentence that runs through a link or
 * an inline `code` spans several text nodes, and only the DOM knows where
 * they are.
 *
 * The middle of it (groupRuns, chunkSpans) touches no DOM, so a Node script
 * can run the same segmentation over server-rendered HTML and confirm that
 * every chunk passes the route's "is this text from the post" check.
 *
 * Self-contained on purpose (no imports): that script loads it directly.
 */

export const BLOCKS = "p, li, h1, h2, h3, h4, h5, h6, blockquote";

/**
 * Never spoken: code, the heading `#`, the code-block toolbar, footnote and
 * sidenote markers, anything hidden or meant only for screen readers. A
 * sidenote's own text sits right after its marker and is read in place.
 */
export const SKIP =
    "pre, figure, figcaption, button, .anchor, sup, table, svg, script, style, .sr-only, [aria-hidden='true'], [data-listen-skip]";

/**
 * A sentence shorter than this joins its neighbour: a clip of just "So."
 * comes back clipped and flat, while two short sentences read together keep
 * their rhythm. A merge never makes a chunk longer than MERGE_TO.
 */
const SHORT = 80;
const MERGE_TO = 240;

/**
 * Sentences past this get split at a clause boundary, never leaving a scrap
 * shorter than MIN_CHARS on either side: a long clip is a long wait for the
 * first sound and for the highlight to move. Well under the route's cap.
 */
const MAX_CHARS = 400;
const MIN_CHARS = 40;

export type Piece<N, B> = {
    node: N;
    data: string;
    /** The innermost block it sits in, or null outside any. */
    block: B | null;
    skip: boolean;
};

export type Run<N, B> = {
    block: B;
    parts: { node: N; start: number }[];
    text: string;
};

export type Span = { start: number; end: number };

/**
 * Consecutive text nodes grouped by the block they belong to. Where an
 * unspoken node sat between two spoken ones (a sidenote marker, say) and the
 * words on either side would otherwise run together, the run gets a space
 * that belongs to neither node.
 */
export function groupRuns<N, B>(pieces: Iterable<Piece<N, B>>) {
    const runs: Run<N, B>[] = [];
    let run: Run<N, B> | null = null;
    let gap = false;
    for (const piece of pieces) {
        if (piece.skip || !piece.block) {
            gap = true;
            continue;
        }
        if (!run || run.block !== piece.block) {
            run = { block: piece.block, parts: [], text: "" };
            runs.push(run);
        } else if (
            gap &&
            /\S$/.test(run.text) &&
            /^[\p{L}\p{N}]/u.test(piece.data)
        ) {
            run.text += " ";
        }
        gap = false;
        run.parts.push({ node: piece.node, start: run.text.length });
        run.text += piece.data;
    }
    return runs;
}

function sentenceSpans(text: string, lang: string): Span[] {
    if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
        const segmenter = new Intl.Segmenter(lang, { granularity: "sentence" });
        return Array.from(segmenter.segment(text), (s) => ({
            start: s.index,
            end: s.index + s.segment.length,
        }));
    }
    // Older engines: end at terminal punctuation (plus any closing quote or
    // bracket) that's followed by a space. Trips on "e.g.", which is fine.
    const spans: Span[] = [];
    const re = /\S.*?(?:[.!?…]+["'”’)\]]*(?=\s|$)|$)/g;
    for (const match of text.matchAll(re)) {
        if (!match[0]) continue;
        spans.push({
            start: match.index,
            end: match.index + match[0].length,
        });
    }
    return spans;
}

/** Break an over-long sentence at commas, semicolons and dashes. */
function splitLong(text: string, span: Span): Span[] {
    const out: Span[] = [];
    let start = span.start;
    while (span.end - start > MAX_CHARS) {
        const window = text.slice(start, start + MAX_CHARS);
        const fits = (cut: number) =>
            cut >= MIN_CHARS && span.end - (start + cut) >= MIN_CHARS;
        let cut = -1;
        for (const match of window.matchAll(/[,;:—–)]\s+|\s--?\s/g)) {
            const at = match.index + match[0].length;
            if (fits(at)) cut = at;
        }
        if (cut < 0) {
            for (const match of window.matchAll(/\s+/g)) {
                const at = match.index + match[0].length;
                if (fits(at)) cut = at;
            }
        }
        if (cut < 0) break;
        out.push({ start, end: start + cut });
        start += cut;
    }
    out.push({ start, end: span.end });
    return out;
}

/** Without the whitespace at either end; null if nothing worth saying. */
function trim(text: string, span: Span): Span | null {
    const raw = text.slice(span.start, span.end);
    const start = span.start + (raw.length - raw.trimStart().length);
    const end = span.end - (raw.length - raw.trimEnd().length);
    if (end <= start || !/[\p{L}\p{N}]/u.test(text.slice(start, end))) {
        return null;
    }
    return { start, end };
}

/** A block's text → the spans to voice, in order. */
export function chunkSpans(text: string, lang = "en") {
    // Source line wraps arrive as "\n" inside text nodes, and the sentence
    // segmenter treats a line feed as a paragraph break. Swap every
    // whitespace character for a space, one for one, so offsets still line
    // up with the DOM.
    const flat = text.replace(/\s/g, " ");
    const chunks: Span[] = [];
    for (const sentence of sentenceSpans(flat, lang)) {
        for (const piece of splitLong(flat, sentence)) {
            const span = trim(flat, piece);
            if (!span) continue;
            const last = chunks[chunks.length - 1];
            const short =
                last &&
                (last.end - last.start < SHORT ||
                    span.end - span.start < SHORT);
            if (short && span.end - last.start <= MERGE_TO) {
                last.end = span.end;
            } else {
                chunks.push(span);
            }
        }
    }
    return chunks;
}

/** What gets sent to be spoken: whitespace collapsed. */
export function spokenText(text: string, span: Span) {
    return text.slice(span.start, span.end).replace(/\s+/g, " ");
}

export type Segment = {
    text: string;
    range: Range;
    words: number;
    /** The paragraph, list item, heading or quote it sits in. */
    block: Element;
};

function* domPieces(root: HTMLElement) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node as Text;
        const parent = text.parentElement;
        if (!parent || !text.data) continue;
        // The innermost block, so `li > p` reads as the p, and an outer list
        // item's own words stay separate from its nested list.
        const block = parent.closest(BLOCKS);
        const piece: Piece<Text, Element> = {
            node: text,
            data: text.data,
            block: block && root.contains(block) ? block : null,
            skip: parent.closest(SKIP) !== null,
        };
        yield piece;
    }
}

function locate(run: Run<Text, Element>, offset: number, atEnd: boolean) {
    for (const part of run.parts) {
        const end = part.start + part.node.data.length;
        // A boundary between two nodes belongs to the next one when starting
        // a range and to the previous one when ending it, so a range never
        // begins or ends on an empty edge. An offset on a space groupRuns
        // added lands at the start of the node after it.
        if (atEnd ? offset <= end : offset < end) {
            return {
                node: part.node,
                offset: Math.max(0, offset - part.start),
            };
        }
    }
    const last = run.parts[run.parts.length - 1];
    return { node: last.node, offset: last.node.data.length };
}

export function segmentArticle(root: HTMLElement, lang = "en"): Segment[] {
    const segments: Segment[] = [];
    for (const run of groupRuns(domPieces(root))) {
        for (const span of chunkSpans(run.text, lang)) {
            const text = spokenText(run.text, span);
            const a = locate(run, span.start, false);
            const b = locate(run, span.end, true);
            const range = document.createRange();
            range.setStart(a.node, a.offset);
            range.setEnd(b.node, b.offset);
            segments.push({
                text,
                range,
                words: text.split(" ").length,
                block: run.block,
            });
        }
    }
    return segments;
}

/** The standard API, or the older WebKit one that Safari had first. */
type CaretDocument = Partial<
    Pick<Document, "caretPositionFromPoint" | "caretRangeFromPoint">
>;

function caretAt(x: number, y: number) {
    const doc: CaretDocument = document;
    if (doc.caretPositionFromPoint) {
        const pos = doc.caretPositionFromPoint(x, y);
        return pos ? { node: pos.offsetNode, offset: pos.offset } : null;
    }
    if (doc.caretRangeFromPoint) {
        const range = doc.caretRangeFromPoint(x, y);
        return range
            ? { node: range.startContainer, offset: range.startOffset }
            : null;
    }
    return null;
}

/**
 * The segment under a point, or -1. Between two sentences (on the space
 * after a full stop) it picks the one just before; with no caret API at all
 * it falls back to the first sentence of the block that was hit.
 */
export function segmentAtPoint(
    segments: Segment[],
    x: number,
    y: number,
    target: Element,
) {
    const caret = caretAt(x, y);
    const block = target.closest(BLOCKS);

    if (caret) {
        let before = -1;
        for (let i = 0; i < segments.length; i++) {
            let where: number;
            try {
                where = segments[i].range.comparePoint(
                    caret.node,
                    caret.offset,
                );
            } catch {
                continue;
            }
            if (where === 0) return i;
            if (where > 0 && segments[i].block === block) before = i;
            if (where < 0) break;
        }
        if (before >= 0) return before;
    }
    return block ? segments.findIndex((s) => s.block === block) : -1;
}
