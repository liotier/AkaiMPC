/**
 * Whether a progression template is in a major or a minor key.
 *
 * One rule, shared by tools/catalogue-snapshot.mjs (which renders major
 * templates in C and minor ones in A) and tools/audit-theory.mjs (check H, which
 * only polices minor-tonality templates). Both need the same answer, and two
 * copies of a derivation drift. It is specified in
 * docs/improvements/00-catalogue-snapshot.md §3.2.
 */

/** The em dash that joins the chords of a template value ('I—V—vi—IV'). */
export const CHORD_SEPARATOR = '—';

/**
 * An explicit `tonality` on the template wins; until templates carry one, the
 * first token whose stem is a bare I or i decides, by its case. Tokens with a
 * slash are applied chords (V7/ii), and a token with an accidental or a longer
 * stem (♭III, IV, ii) is not the tonic. A template with no tonic token at all
 * renders as major.
 *
 * @param {Object} template - A progressions[category] entry
 * @returns {'major'|'minor'}
 */
export function templateTonality(template) {
    if (template.tonality !== undefined) {
        if (template.tonality !== 'major' && template.tonality !== 'minor') {
            throw new Error(`Template ${template.value}: tonality must be 'major' or 'minor', got ${JSON.stringify(template.tonality)}`);
        }
        return template.tonality;
    }

    for (const token of template.value.split(CHORD_SEPARATOR)) {
        if (token.includes('/')) continue;
        const tonic = token.match(/^([iI])(?![ivIV])/);
        if (tonic) return tonic[1] === 'i' ? 'minor' : 'major';
    }
    return 'major';
}
