// The single authority on the MPC display name and export file name grammar
// specified in docs/mpc-export-specification.md §5. Nothing else may assemble
// a name - the running app's single-progression and current-selection exports
// use this module exactly as tools/build-pack.mjs does, so a name typed in the
// app and the same file found in the published pack are never different
// strings (see §3, note on D8: this is the one place that must not drift).
//
// Pure string construction, no I/O, no musicTheory.js dependency: every input
// - category, nickname, value, style - is a plain string the caller already
// resolved. That keeps this module trivially portable between the browser and
// Node (tools/build-pack.mjs, tools/audit-theory.mjs).

const EM_DASH = '—';

// A2 in docs/mpc-export-specification.md §4: the only hardware assumption with
// wide exposure (47% of labels carry a flat or sharp) and no fallback evidence
// beyond a single MPC XL. Flip to false if a report says the sign renders as a
// box or mojibake on other MPC hardware, then rebuild the pack - no other
// change needed.
export const USE_UNICODE_ACCIDENTALS = true;

/**
 * Sanitiser for the MPC `name` field. Hyphen is reserved as the sole category
 * separator (§5.1): every other hyphen in the source data - four category
 * keys, fourteen nicknames, the '12-bar-blues' template value - is replaced
 * with a space rather than deleted or CamelCased (§5.1.1, D10).
 *
 * @param {string} s
 * @returns {string}
 */
export function mpcSafe(s) {
    return String(s)
        .split(EM_DASH).join(' ')
        .split('-').join(' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Sanitiser for file names. Hyphen is free here - the filesystem's reserved
 * set is not. Em dashes become hyphens so the roman-numeral segment of a file
 * name stays readable.
 *
 * @param {string} s
 * @returns {string}
 */
export function fileSafe(s) {
    return String(s)
        .split(EM_DASH).join('-')
        .replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_')
        .replace(/\s+/g, ' ')
        .trim();
}

function applyAccidentalPolicy(s) {
    if (USE_UNICODE_ACCIDENTALS) return s;
    return String(s).split('♭').join('b').split('♯').join('#');
}

// sanitizeFileName() in app.js truncates to 120 characters; do the same here
// so a name built through this module and one built by the legacy helper
// agree. Truncate before the extension is appended, not after (§5.6).
const MAX_FILE_NAME_LENGTH = 120;

function truncateFileName(name) {
    return name.slice(0, MAX_FILE_NAME_LENGTH) || 'progression';
}

/**
 * The MPC `name` field (§5.3, §5.5). `style` is the already-joined style
 * segment - a single style name, or several joined with '+' where
 * deduplication collapsed them onto the same chord content (§5.2.1).
 *
 * @param {object} params
 * @param {'template'|'scale'} params.generationMode
 * @param {string} [params.category] - Progression category (template mode)
 * @param {string} [params.nickname] - English nickname (template mode)
 * @param {string} [params.value] - Progression template string (template mode)
 * @param {string} [params.style] - Style name, or 'A+B' where fused (template mode)
 * @param {string} [params.modeCategory] - Mode category (scale mode)
 * @param {string} [params.mode] - Mode/scale name (scale mode)
 * @returns {string}
 */
export function buildMpcDisplayName({ generationMode, category, nickname, value, style, modeCategory, mode }) {
    const name = generationMode === 'scale'
        ? `${mpcSafe(modeCategory)}-${mpcSafe(mode)} Scale`
        : `${mpcSafe(category)}-${mpcSafe(nickname)} ${style} (${mpcSafe(value)})`;

    return applyAccidentalPolicy(name);
}

/**
 * The export file name (§5.6), key included so a progression exported in
 * several keys can sit side by side on disk. `extension` is passed without
 * its leading dot ('progression' or 'mid').
 *
 * @param {object} params
 * @param {string} params.key
 * @param {'template'|'scale'} params.generationMode
 * @param {string} [params.category]
 * @param {string} [params.nickname]
 * @param {string} [params.value]
 * @param {string} [params.style]
 * @param {string} [params.modeCategory]
 * @param {string} [params.mode]
 * @param {string} params.extension
 * @returns {string}
 */
export function buildExportFileName({ key, generationMode, category, nickname, value, style, modeCategory, mode, extension }) {
    const keyName = key.split('/')[0];
    const parts = generationMode === 'scale'
        ? [keyName, modeCategory, mode, 'Scale']
        : [keyName, category, nickname, style, value];

    const base = fileSafe(parts.join('_'));
    return truncateFileName(base) + '.' + extension;
}
