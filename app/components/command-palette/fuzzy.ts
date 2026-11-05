/**
 * Fuzzy matching for the palette: does every character of the query appear in
 * the target, in order — and if so, how well?
 *
 * Scored so the alignment a person would pick wins. A character at the start
 * of the string or of a word earns a bonus, one that continues a run earns
 * more, and every skipped character costs a little — so "dc" takes the D and
 * C of "Docker Compose" over the d and c buried in "production". The shape is
 * fzy's: one dynamic-programming pass over query × target, then a walk back
 * through the table to recover which characters were used, for highlighting.
 */

// Leading gaps cost a hair more than trailing ones, so of two equally good
// places to match, the earlier wins.
const GAP_LEADING = -0.005;
const GAP_INNER = -0.01;
const GAP_TRAILING = -0.004;
const CONSECUTIVE = 1;
const BONUS_START = 0.9;
const BONUS_WORD = 0.8;
const BONUS_CAPITAL = 0.7;
const BONUS_DOT = 0.6;
/** On top of the per-character score, for the whole target or its start. */
const BONUS_EXACT = 2;
const BONUS_PREFIX = 1;
/** For a query that is one whole word of the target: "test" in "e2e test
 *  expectations" over "tests" or "testing". */
const BONUS_WHOLE_WORD = 0.5;

export type Match = {
    score: number;
    positions: number[];
    /**
     * One unbroken run, or every run starting a word (word prefixes, an
     * acronym). The alternative — letters picked out of the middle of words
     * — is a subsequence on paper and noise to a reader.
     */
    strong: boolean;
};

function bonuses(target: string) {
    const out = new Array<number>(target.length);
    for (let j = 0; j < target.length; j++) {
        const prev = target[j - 1];
        const ch = target[j];
        if (j === 0) out[j] = BONUS_START;
        else if (prev === ".") out[j] = BONUS_DOT;
        else if (/[^a-z0-9]/i.test(prev)) out[j] = BONUS_WORD;
        else if (/[a-z]/.test(prev) && /[A-Z]/.test(ch)) out[j] = BONUS_CAPITAL;
        else out[j] = 0;
    }
    return out;
}

/**
 * Whitespace in the query is ignored, so "fly io" finds "Fly.io". Returns null
 * when the query isn't a subsequence of the target at all.
 */
export function fuzzyMatch(query: string, target: string): Match | null {
    const q = query.replace(/\s+/g, "").toLowerCase();
    if (!q) return { score: 0, positions: [], strong: true };
    const t = target.toLowerCase();
    const n = q.length;
    const m = t.length;
    if (n > m) return null;

    // Cheap rejection before building the table.
    let k = 0;
    for (let j = 0; j < m && k < n; j++) if (t[j] === q[k]) k++;
    if (k < n) return null;

    const bonus = bonuses(target);
    // D[i][j]: best score with q[i] matched exactly at t[j].
    // M[i][j]: best score with q[0..i] matched anywhere within t[0..j].
    const D: number[][] = [];
    const M: number[][] = [];
    for (let i = 0; i < n; i++) {
        const d = new Array<number>(m).fill(-Infinity);
        const best = new Array<number>(m).fill(-Infinity);
        const gap = i === n - 1 ? GAP_TRAILING : GAP_INNER;
        let prev = -Infinity;
        for (let j = 0; j < m; j++) {
            if (q[i] === t[j]) {
                let score = -Infinity;
                if (i === 0) score = j * GAP_LEADING + bonus[j];
                else if (j > 0)
                    score = Math.max(
                        M[i - 1][j - 1] + bonus[j],
                        D[i - 1][j - 1] + CONSECUTIVE,
                    );
                d[j] = score;
                prev = Math.max(score, prev + gap);
            } else {
                prev = prev + gap;
            }
            best[j] = prev;
        }
        D.push(d);
        M.push(best);
    }

    // Walk back from the end. Once a match was reached by extending a run,
    // the previous character has to be the one just before it.
    const positions = new Array<number>(n);
    let j = m - 1;
    let required = false;
    for (let i = n - 1; i >= 0; i--) {
        for (; j >= 0; j--) {
            if (D[i][j] !== -Infinity && (required || D[i][j] === M[i][j])) {
                required =
                    i > 0 && j > 0 && D[i][j] === D[i - 1][j - 1] + CONSECUTIVE;
                positions[i] = j--;
                break;
            }
        }
    }

    let contiguous = true;
    let wordStarts = true;
    for (let i = 0; i < n; i++) {
        if (i > 0 && positions[i] === positions[i - 1] + 1) continue;
        if (i > 0) contiguous = false;
        if (bonus[positions[i]] === 0) wordStarts = false;
    }

    let score = M[n - 1][m - 1];
    const compact = t.replace(/\s+/g, "");
    if (compact === q) score += BONUS_EXACT;
    else if (compact.startsWith(q)) score += BONUS_PREFIX;
    const after = t[positions[n - 1] + 1];
    if (
        contiguous &&
        bonus[positions[0]] > 0 &&
        (after === undefined || /[^a-z0-9]/.test(after))
    ) {
        score += BONUS_WHOLE_WORD;
    }
    return { score, positions, strong: contiguous || wordStarts };
}

/** Splits `text` into runs of matched and unmatched characters. */
export function segments(text: string, positions: number[]) {
    const hits = new Set(positions);
    const out: { text: string; hit: boolean }[] = [];
    for (let i = 0; i < text.length; i++) {
        const hit = hits.has(i);
        const last = out[out.length - 1];
        if (last && last.hit === hit) last.text += text[i];
        else out.push({ text: text[i], hit });
    }
    return out;
}
