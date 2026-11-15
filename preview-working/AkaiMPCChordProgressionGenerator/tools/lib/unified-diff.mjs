// A small unified-diff writer, for tools/catalogue-snapshot.mjs.
//
// The project has no npm dependency anywhere, and diff(1) is not on every
// contributor's machine, so the one tool that has to show "what changed"
// carries its own. It is a line-based longest-common-subsequence, run only on
// the stretch between the lines both sides share at the start and at the end:
// the snapshot is about two thousand lines and a typical change touches a
// handful of them, so the table is tiny in practice.
//
// MAX_TABLE_CELLS bounds the worst case. A rewrite so wide that the table
// would be larger degrades to "everything between the shared head and tail
// was replaced" - still a correct diff, just not a minimal one - instead of
// exhausting memory in CI.

const MAX_TABLE_CELLS = 40_000_000;

/**
 * Split text into lines, ignoring one final newline. The empty string has no
 * lines; a lone newline is one empty line.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function splitLines(text) {
    if (text === '') return [];
    const lines = text.split('\n');
    if (lines.at(-1) === '') lines.pop();
    return lines;
}

// Edit script for the part of the two files that is not shared head or tail.
function middleOps(a, b) {
    const n = a.length;
    const m = b.length;

    if (n === 0 || m === 0 || n * m > MAX_TABLE_CELLS) {
        const ops = [];
        for (const line of a) ops.push({ type: '-', line });
        for (const line of b) ops.push({ type: '+', line });
        return ops;
    }

    // lcs[i][j] is the length of the longest common subsequence of a[i..] and
    // b[j..]. It cannot exceed min(n, m), which the cell cap keeps below
    // sqrt(40 million) - comfortably inside 16 bits.
    const width = m + 1;
    const lcs = new Uint16Array((n + 1) * width);
    for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
            lcs[i * width + j] = a[i] === b[j]
                ? lcs[(i + 1) * width + j + 1] + 1
                : Math.max(lcs[(i + 1) * width + j], lcs[i * width + j + 1]);
        }
    }

    // Walk the table. On a tie, delete before inserting, so a replaced run
    // reads as all its '-' lines and then all its '+' lines, as diff(1) does.
    const ops = [];
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
        if (a[i] === b[j]) {
            ops.push({ type: ' ', line: a[i] });
            i++;
            j++;
        } else if (lcs[(i + 1) * width + j] >= lcs[i * width + j + 1]) {
            ops.push({ type: '-', line: a[i++] });
        } else {
            ops.push({ type: '+', line: b[j++] });
        }
    }
    while (i < n) ops.push({ type: '-', line: a[i++] });
    while (j < m) ops.push({ type: '+', line: b[j++] });
    return ops;
}

function diffOps(a, b) {
    let head = 0;
    while (head < a.length && head < b.length && a[head] === b[head]) head++;

    let tail = 0;
    while (
        tail < a.length - head &&
        tail < b.length - head &&
        a[a.length - 1 - tail] === b[b.length - 1 - tail]
    ) tail++;

    const ops = [];
    for (let k = 0; k < head; k++) ops.push({ type: ' ', line: a[k] });
    for (const op of middleOps(a.slice(head, a.length - tail), b.slice(head, b.length - tail))) ops.push(op);
    for (let k = a.length - tail; k < a.length; k++) ops.push({ type: ' ', line: a[k] });
    return ops;
}

function formatHunks(ops, context, headingPattern) {
    const changed = [];
    ops.forEach((op, k) => {
        if (op.type !== ' ') changed.push(k);
    });
    if (changed.length === 0) return [];

    // How many old and new lines precede each op, so a hunk can say where it starts.
    const oldBefore = new Array(ops.length + 1);
    const newBefore = new Array(ops.length + 1);
    let oldCount = 0;
    let newCount = 0;
    for (let k = 0; k < ops.length; k++) {
        oldBefore[k] = oldCount;
        newBefore[k] = newCount;
        if (ops[k].type !== '+') oldCount++;
        if (ops[k].type !== '-') newCount++;
    }

    // Changes separated by no more than twice the context share one hunk,
    // exactly as diff(1) merges hunks whose context would touch.
    const groups = [];
    let first = changed[0];
    let last = changed[0];
    for (const k of changed.slice(1)) {
        if (k - last - 1 > 2 * context) {
            groups.push([first, last]);
            first = k;
        }
        last = k;
    }
    groups.push([first, last]);

    const out = [];
    for (const [groupFirst, groupLast] of groups) {
        const from = Math.max(0, groupFirst - context);
        const to = Math.min(ops.length - 1, groupLast + context);

        let oldLines = 0;
        let newLines = 0;
        for (let k = from; k <= to; k++) {
            if (ops[k].type !== '+') oldLines++;
            if (ops[k].type !== '-') newLines++;
        }
        // An empty side starts on the line before it, as diff(1) writes it
        const oldStart = oldLines === 0 ? oldBefore[from] : oldBefore[from] + 1;
        const newStart = newLines === 0 ? newBefore[from] : newBefore[from] + 1;

        // Name the block the first change falls in: the nearest heading at or
        // above it, which may be the changed line itself. A hunk's context is
        // only three lines, so without this a change deep inside a block
        // would not say which block it belongs to.
        let heading = '';
        if (headingPattern) {
            for (let k = groupFirst; k >= 0; k--) {
                if (headingPattern.test(ops[k].line)) {
                    heading = ' ' + ops[k].line;
                    break;
                }
            }
        }

        out.push(`@@ -${oldStart},${oldLines} +${newStart},${newLines} @@${heading}`);
        for (let k = from; k <= to; k++) out.push(ops[k].type + ops[k].line);
    }
    return out;
}

/**
 * Unified diff of two texts, as an array of lines.
 *
 * @param {string} oldText
 * @param {string} newText
 * @param {Object} [options]
 * @param {number} [options.context=3] - Unchanged lines shown around each change
 * @param {string} [options.oldLabel='old'] - Name on the '---' line
 * @param {string} [options.newLabel='new'] - Name on the '+++' line
 * @param {RegExp|null} [options.headingPattern=null] - Lines matching this are
 *        quoted after '@@' on the hunk that falls beneath them
 * @returns {string[]} Empty when the two texts have the same lines
 */
export function unifiedDiff(oldText, newText, { context = 3, oldLabel = 'old', newLabel = 'new', headingPattern = null } = {}) {
    const hunks = formatHunks(diffOps(splitLines(oldText), splitLines(newText)), context, headingPattern);
    if (hunks.length === 0) return [];
    return [`--- ${oldLabel}`, `+++ ${newLabel}`, ...hunks];
}
