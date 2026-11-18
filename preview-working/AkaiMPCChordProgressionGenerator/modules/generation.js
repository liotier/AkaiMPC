// Pure generation core, extracted from app.js so it can run under Node (for
// tools/build-pack.mjs and tools/audit-theory.mjs) as well as in the browser.
// app.js registers a DOMContentLoaded listener at module top level, which
// throws the moment Node evaluates it - this module contains no DOM reference
// at all, so it can be imported from either side.
//
// The functions below used to read selectedKey / selectedMode /
// selectedProgression / chordRequirements as app.js module globals. Here they
// are explicit parameters instead, so a caller (the running app, the pack
// builder, the audit tool) supplies its own state.

import {
    keys,
    resolveTemplate,
    templateTonality,
    templateSpelling,
    scaleSpelling,
    spellChord,
    getKeyOffset,
    getScaleDegrees,
    getScaleTriad,
    getScaleSeventh,
    getQualityLabel,
    getRomanNumeralForChord,
    getHarmonyPitchClasses,
    chordFitsScale,
    getRomanSuffix,
    parseRomanStem,
    pcSignature,
    getChordFamily,
    getChordComplexity,
    MATCHER_QUALITY_TYPES,
    buildChord,
    getChordName,
    generateProgressionChords,
    applyVoicingStyle,
    applyPedalVoicing,
    optimizeVoiceLeading,
    optimizeSmoothVoiceLeading
} from './musicTheory.js';

export const NOTE_PITCH_CLASSES = { 'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11 };

// Row-4 candidates that are labelled as augmented sixths are judged by what they
// sound like: a dominant seventh spelt on ♭VI. The Italian sixth is that chord
// without its fifth, the German sixth is it whole, and the French sixth has a
// flat fifth, but a template that avoids dom7 means the A♭7 whatever its label,
// and none of the three is ever named on its own in a priority list. SubV7 is
// already typed dom7.
const SOUNDING_FAMILY = { It6: 'dom7', Ger6: 'dom7', Fr6: 'dom7' };

/**
 * How much a template wants a chord type: 3 preferred, 2 allowed, 1 avoided.
 * The one rule for all sixteen pads: the palette in generateVariant() sorts by
 * it, and row 4 excludes avoided candidates and rewards preferred ones. A
 * template with no priorities allows everything.
 *
 * @param {string} chordType - Chord type key
 * @param {Object|null} palettePriorities - { preferred, allowed, avoided } of the template
 * @returns {number} 3, 2 or 1
 */
export function chordPriority(chordType, palettePriorities) {
    if (!palettePriorities) return 2; // Default: allowed

    const sonority = SOUNDING_FAMILY[chordType] || chordType;
    if (palettePriorities.preferred && palettePriorities.preferred.includes(sonority)) {
        return 3; // Preferred - highest priority
    }
    if (palettePriorities.avoided && palettePriorities.avoided.includes(sonority)) {
        return 1; // Avoided - lowest priority
    }
    // Default to allowed (or explicitly in allowed list)
    return 2;
}

export function analyzeExistingChords(chords) {
    const analysis = {
        hasDominant7: false,
        hasSubdominant: false,
        hasBorrowed: false,
        hasSecondary: false,
        hasPivot: false,
        functionsPresent: new Set(),
        roots: [],
        romanNumerals: []
    };

    chords.forEach(chord => {
        // Check for dominant 7
        if (chord.quality === 'Dominant 7' || chord.romanNumeral === 'V7') {
            analysis.hasDominant7 = true;
        }

        // Check for subdominant function. Asked of the classifier, not of the
        // string: 'iii' and 'vii°' contain 'ii' and are not subdominants.
        if (determineChordFunction(chord.romanNumeral) === 'subdominant') {
            analysis.hasSubdominant = true;
        }

        // Check for borrowed chords
        if (chord.romanNumeral && (chord.romanNumeral.includes('♭') || chord.romanNumeral.includes('♯'))) {
            analysis.hasBorrowed = true;
        }

        // Check for secondary dominants
        if (chord.romanNumeral && chord.romanNumeral.includes('/')) {
            analysis.hasSecondary = true;
        }

        // Track roots and roman numerals
        if (chord.notes && chord.notes.length > 0) {
            analysis.roots.push(chord.notes[0] % 12);
        }
        analysis.romanNumerals.push(chord.romanNumeral);

        // Determine function
        const func = determineChordFunction(chord.romanNumeral);
        if (func) analysis.functionsPresent.add(func);
    });

    return analysis;
}

// Harmonic function of a numeral that has no accidental, by degree: the function
// of the upper-case numeral, then of the lower-case one. Diatonic mediants and
// submediants (iii, vi) prolong the tonic; the major triads VI and III and the
// raised-degree VII are chromatic mediants and leading-tone chords outside the
// key; vii° leads to the tonic like the dominant.
const NATURAL_DEGREE_FUNCTION = {
    I: ['tonic', 'tonic'],
    II: ['subdominant', 'subdominant'],
    III: ['chromatic', 'tonic'],
    IV: ['subdominant', 'subdominant'],
    V: ['dominant', 'dominant'],
    VI: ['chromatic', 'tonic'],
    VII: ['chromatic', 'dominant']
};

// Function of a numeral with exactly one flat. ♭VII and ♭VI are the double
// plagal reading (IV of IV, and the predominant of the minor mode); ♭II is the
// Neapolitan; ♭III is a chromatic mediant. Anything else flattened is chromatic.
const FLAT_DEGREE_FUNCTION = {
    II: 'subdominant',
    III: 'chromatic',
    VI: 'subdominant',
    VII: 'subdominant'
};

const AUGMENTED_SIXTH_NUMERALS = new Set(['It+6', 'Fr+6', 'Ger+6']);

// Degree index and major-scale step of a numeral's stem, for the mode flips of row 4
const FLIP_DEGREE_INDEX = { I: 0, II: 1, III: 2, IV: 3, V: 4, VI: 5, VII: 6 };
const MAJOR_SCALE_STEPS = [0, 2, 4, 5, 7, 9, 11];

/**
 * The row-4 categories a template's `row4` hint may name
 * (docs/improvements/10-row4-mediants.md §3.3). Audit check J refuses any other.
 */
export const ROW4_CATEGORIES = ['borrowed', 'diatonic', 'dominant', 'subdominant', 'secondary', 'augmented6th',
    'chromatic', 'substitution', 'modal', 'mediant', 'modeFlip'];

/**
 * Harmonic function of a roman numeral: 'tonic', 'subdominant', 'dominant' or
 * 'chromatic'. Read from the parsed numeral, never from substrings: 'II' is a
 * substring of 'III' and 'V' of 'VI', which filed vi as a dominant. Suffixes
 * never change the class. The table is spec 03 §3.1.
 *
 * @param {string} romanNumeral - e.g. 'vi', '♭VII7', 'V7/ii', 'Ger+6'
 * @returns {string|null} The function, or null for an empty numeral
 */
export function determineChordFunction(romanNumeral) {
    if (!romanNumeral) return null;

    if (AUGMENTED_SIXTH_NUMERALS.has(romanNumeral)) return 'subdominant'; // predominant to V
    if (romanNumeral === 'SubV7') return 'dominant';                       // stands in for V7
    if (romanNumeral.includes('/')) return 'chromatic';                    // an applied chord

    const parsed = parseRomanStem(romanNumeral);
    if (!parsed || parsed.degree === null) return 'chromatic';

    if (parsed.accidentals === '') return NATURAL_DEGREE_FUNCTION[parsed.degree][parsed.lower ? 1 : 0];
    if (parsed.accidentals === '♭' || parsed.accidentals === 'b') return FLAT_DEGREE_FUNCTION[parsed.degree] || 'chromatic';
    return 'chromatic';
}

/**
 * The chords row 4 may choose from, before selectDynamicRow4Chords() filters and
 * scores them. The pool depends on the template's tonality
 * (docs/improvements/07-minor-key-awareness.md §3.3): every chord a major pool
 * offers that targets or borrows a degree a minor key lacks - V7/ii, V7/vi, the
 * major VI, the Lydian II - gives way in a minor pool to the devices a minor key
 * uses: the Dorian IV, the Picardy I, the leading-tone seventh and the applied
 * dominants of the minor key's own degrees. A template whose row-4 hint prefers
 * `mediant` is also offered the chromatic mediants of the tonic and the
 * hexatonic pole, with the major pool's ♭VI, VI and ♭III counted among them; one
 * that prefers `modeFlip` is offered the mode flip of every major or minor
 * progression chord (docs/improvements/10-row4-mediants.md). Without such a hint
 * the pools are exactly what they were before. Order breaks ties, after score
 * and common usage; the new candidates come last.
 *
 * @param {number} keyOffset - The key's pitch class
 * @param {number[]} scaleDegrees - The major scale
 * @param {Object} analysis - From analyzeExistingChords()
 * @param {string} variantType - The style
 * @param {'major'|'minor'} [tonality='major'] - From templateTonality()
 * @param {Object|null} [palettePriorities=null] - The template's
 * @param {string[]|null} [paletteFilter=null] - The template's
 * @param {Object} [spelling] - From templateSpelling()
 * @param {Array<Object>} [progressionChords=[]] - The progression's pads, whose
 *   mode flips are offered
 * @param {Object|null} [row4Hint=null] - The template's `row4` hint
 * @returns {Array<Object>} Candidates with priority and excludedByFilter
 */
export function generateRow4Candidates(keyOffset, scaleDegrees, analysis, variantType, tonality = 'major', palettePriorities = null, paletteFilter = null, spelling = templateSpelling(keys[keyOffset], tonality), progressionChords = [], row4Hint = null) {
    const candidates = [];
    const tonic = scaleDegrees[0];

    // Spec 10 is opt-in: its candidates, its categories and VI's lower usage
    // apply only to a template whose hint prefers the category (§8.1 there)
    const mediants = Boolean(row4Hint?.prefer?.includes('mediant'));
    const modeFlips = Boolean(row4Hint?.prefer?.includes('modeFlip'));

    // Every candidate is named after its numeral, in the variant's spelling
    // context: the VI of A is F#, not Gb (docs/improvements/13-spelling.md)
    const add = (romanNumeral, root, chordType, category, commonUsage) => candidates.push({
        root,
        notes: buildChord(root, chordType, keyOffset),
        chordType,
        chordName: getChordName(spelling, { romanNumeral }, chordType),
        romanNumeral,
        quality: getQualityLabel(chordType),
        category,
        commonUsage
    });

    // V7, the dominant seventh: in a minor key the harmonic minor's
    const addDominant = () => {
        if (!analysis.hasDominant7 && scaleDegrees.length > 4) add('V7', scaleDegrees[4], 'dom7', 'dominant', 1.0);
    };
    // Augmented sixths, rooted on ♭6, in the classical styles
    const addAugmentedSixths = () => {
        if (variantType !== 'Classic' && variantType !== 'Jazz') return;
        const flatSix = (tonic + 8) % 12;
        add('It+6', flatSix, 'It6', 'augmented6th', 0.3);
        add('Ger+6', flatSix, 'Ger6', 'augmented6th', 0.3);
        add('Fr+6', flatSix, 'Fr6', 'augmented6th', 0.2);
    };
    // ♭II, the Neapolitan, and in Jazz the tritone substitute for V7
    const addNeapolitanAndSubstitute = () => {
        add('♭II', (tonic + 1) % 12, 'major', 'chromatic', 0.4);
        if (variantType === 'Jazz') add('SubV7', (scaleDegrees[4] + 6) % 12, 'dom7', 'substitution', 0.5);
    };

    if (tonality === 'minor') {
        add('IV', scaleDegrees[3], 'major', 'borrowed', 0.8);      // Dorian subdominant
        add('I', tonic, 'major', 'borrowed', 0.5);                 // Picardy third
        addDominant();
        add('vii°7', scaleDegrees[6], 'dim7', 'dominant', 0.6);    // harmonic minor's leading-tone seventh
        // Applied dominants, each a fifth above its target: the key's own degrees
        add('V7/V', 2, 'dom7', 'secondary', 0.7);
        add('V7/iv', 0, 'dom7', 'secondary', 0.6);                 // the tonic as I7
        add('V7/♭III', 10, 'dom7', 'secondary', 0.5);              // ♭VII7
        add('V7/♭VI', 3, 'dom7', 'secondary', 0.5);                // ♭III7
        add('V7/♭VII', 5, 'dom7', 'secondary', 0.4);               // IV7
        addAugmentedSixths();
        addNeapolitanAndSubstitute();
        if (variantType === 'Modal') add('ii', scaleDegrees[1], 'minor', 'borrowed', 0.3); // Dorian supertonic
        // Last, so that a tie goes to the chords the pool always had: the
        // chromatic mediants of the minor tonic, minor like it, each sharing one
        // note with it; and the hexatonic pole, the major triad a major third up,
        // which shares none (spec 10 §3.1)
        if (mediants) {
            add('♭vi', (tonic + 8) % 12, 'minor', 'mediant', 0.6);
            add('iii', (tonic + 4) % 12, 'minor', 'mediant', 0.5);
            add('♭iii', (tonic + 3) % 12, 'minor', 'mediant', 0.5);
            add('vi', (tonic + 9) % 12, 'minor', 'mediant', 0.4);
            add('III', (tonic + 4) % 12, 'major', 'mediant', 0.4);
        }
    } else {
        // Under a hint that prefers mediants, ♭VI, VI and ♭III compete as the
        // mediants they are, and VI at the usage of the other mediants (spec 10 D1)
        const borrowedOrMediant = mediants ? 'mediant' : 'borrowed';
        // Borrowed from the parallel minor; ♭VI is also the downward major-third
        // mediant, and under a mediant hint competes as one (spec 10 D1)
        add('♭VII', (tonic + 10) % 12, 'major', 'borrowed', 0.9);
        add('♭VI', (tonic + 8) % 12, 'major', borrowedOrMediant, 0.8);
        addDominant();
        if (!analysis.hasSubdominant && scaleDegrees.length > 1) add('ii7', scaleDegrees[1], 'minor7', 'subdominant', 0.85);
        if (scaleDegrees.length > 3) add('iv', scaleDegrees[3], 'minor', 'borrowed', 0.85);
        // A major VI is a major triad on the submediant - the quality changes,
        // not the root. Raising the root built the chord on the flat seventh and
        // still labelled it VI. It is the downward minor-third mediant
        if (scaleDegrees.length > 5) add('VI', scaleDegrees[5], 'major', borrowedOrMediant, mediants ? 0.6 : 0.8);
        // Applied dominants, a fifth above their targets, from the major scale
        // whatever the mode: in C, V7/V = D7, V7/ii = A7, V7/vi = E7, V7/IV = C7
        if (scaleDegrees.length > 1) {
            add('V7/V', 2, 'dom7', 'secondary', 0.7);
            add('V7/ii', 9, 'dom7', 'secondary', 0.5);
            add('V7/vi', 4, 'dom7', 'secondary', 0.5);
            add('V7/IV', 0, 'dom7', 'secondary', 0.4);
        }
        addAugmentedSixths();
        add('♭III', (tonic + 3) % 12, 'major', borrowedOrMediant, 0.5);
        addNeapolitanAndSubstitute();
        if (variantType === 'Modal') add('II', (tonic + 2) % 12, 'major', 'modal', 0.3); // Lydian II
        // Last, so that a tie goes to the chords the pool always had: the upward
        // major-third mediant, and the hexatonic pole, the minor triad on ♭6,
        // which shares no note with the tonic (spec 10 §3.1)
        if (mediants) {
            add('III', (tonic + 4) % 12, 'major', 'mediant', 0.6);
            add('♭vi', (tonic + 8) % 12, 'minor', 'mediant', 0.4);
        }
    }

    // Mode flips: every distinct root of a major or minor progression chord, as
    // the triad of the other family. The numeral is the progression chord's stem
    // with its case inverted, its accidental kept and no suffix: IV becomes iv,
    // ♭VI ♭vi, i I. The tonic's flip is the likeliest (spec 10 §3.2). An applied
    // chord has no numeral a flip could take, and produces none.
    const flipped = new Set();
    for (const chord of modeFlips ? progressionChords : []) {
        const family = getChordFamily(chord.chordType);
        if ((family !== 'major' && family !== 'minor') || !chord.romanNumeral || chord.romanNumeral.includes('/')) continue;
        const parsed = parseRomanStem(chord.romanNumeral);
        if (!parsed || parsed.degree === null) continue;
        const index = FLIP_DEGREE_INDEX[parsed.degree];
        let shift = 0;
        for (const symbol of parsed.accidentals) shift += symbol === '♭' || symbol === 'b' ? -1 : 1;
        const root = ((tonic + MAJOR_SCALE_STEPS[index] + shift) % 12 + 12) % 12;
        if (flipped.has(root)) continue;
        flipped.add(root);
        const type = family === 'major' ? 'minor' : 'major';
        add(parsed.accidentals + getRomanNumeralForChord(index, type), root, type, 'modeFlip', root === tonic % 12 ? 0.6 : 0.5);
    }

    // Each candidate carries what the template thinks of it, so selection can
    // exclude, reward or re-admit it without asking again.
    return candidates.map(candidate => ({
        ...candidate,
        priority: chordPriority(candidate.chordType, palettePriorities),
        excludedByFilter: Boolean(paletteFilter) && !paletteFilter.includes(candidate.chordType)
    }));
}

export function scoreCandidate(candidate, analysis, existingRoots) {
    let score = 0;

    // 1. Fills functional gap (0 or 1)
    const candidateFunction = determineChordFunction(candidate.romanNumeral);
    if (candidateFunction && !analysis.functionsPresent.has(candidateFunction)) {
        score += 1;
    }

    // 2. Provides useful voice leading (0 or 1)
    const leadsWell = existingRoots.some(root => {
        const interval = (candidate.root - root + 12) % 12;
        return [1, 11, 5, 7].includes(interval); // a semitone either way, a fourth or a fifth
    });
    if (leadsWell) score += 1;

    // 3. Common in modern music (0 or 1)
    if (candidate.commonUsage > 0.6) score += 1;

    // 4. Adds harmonic variety (0 or 1)
    if (!analysis.hasBorrowed && candidate.category === 'borrowed') score += 1;
    if (!analysis.hasSecondary && candidate.category === 'secondary') score += 1;
    if (!analysis.hasDominant7 && candidate.category === 'dominant') score += 1;

    // 5. The template prefers this type (0 or 1). A preference is at least as
    // strong a signal as being common in modern music.
    if (candidate.priority === 3) score += 1;

    return score;
}

export function selectDynamicRow4Chords(existingChords, keyOffset, scaleDegrees, variantType, tonality = 'major', palettePriorities = null, paletteFilter = null, unusedPaletteChords = [], spelling = templateSpelling(keys[keyOffset], tonality), row4Hint = null) {
    const analysis = analyzeExistingChords(existingChords);
    const existingRoots = existingChords.map(c => c.notes && c.notes[0] ? c.notes[0] % 12 : 0);

    // The template's row-4 hint: a preferred category earns a point, an avoided
    // one is left out until the fallback needs it (spec 10 §3.3)
    const preferredCategories = new Set(row4Hint?.prefer || []);
    const avoidedCategories = new Set(row4Hint?.avoid || []);
    const isCategoryAvoided = c => avoidedCategories.has(c.category);

    const scoreAndSort = list => list
        .map(candidate => ({ ...candidate, score: scoreCandidate(candidate, analysis, existingRoots) + (preferredCategories.has(candidate.category) ? 1 : 0) }))
        // Sort by score (descending) and then by common usage as tiebreaker
        .sort((a, b) => b.score !== a.score ? b.score - a.score : b.commonUsage - a.commonUsage);

    // What the grid already sounds like. A candidate that sounds like a pad on
    // rows 1-3 under another name (a German sixth is the ♭VI7 already there) is
    // one pad spent twice, and so is one that sounds like another row-4 pad. This
    // is never relaxed, unlike the numeral and the template's preferences below,
    // and it is the first thing asked after the numeral. 'keep' admits a
    // candidate only if its sound is new, and records it, so what is kept is kept
    // best score first and no two kept chords sound alike.
    const takenSignatures = new Set(existingChords.map(c => pcSignature(c.notes)));
    const keep = candidate => {
        const signature = pcSignature(candidate.notes);
        if (takenSignatures.has(signature)) return false;
        takenSignatures.add(signature);
        return true;
    };
    const soundsNew = candidate => !takenSignatures.has(pcSignature(candidate.notes));

    const allCandidates = generateRow4Candidates(keyOffset, scaleDegrees, analysis, variantType, tonality, palettePriorities, paletteFilter, spelling,
        existingChords.filter(c => c.isProgressionChord), row4Hint)
        .filter(soundsNew);

    // Rows 1-3 are already on the grid; a candidate that repeats one of them
    // wastes a pad. A candidate the template's hard filter does not list is
    // left out, and so is one the template avoids, while others remain.
    const usedRomanNumerals = new Set(existingChords.map(c => c.romanNumeral));
    const isNew = c => !usedRomanNumerals.has(c.romanNumeral);
    const isAvoided = c => c.priority === 1;
    const listed = allCandidates.filter(c => !c.excludedByFilter);

    let scoredCandidates = scoreAndSort(listed.filter(c => isNew(c) && !isAvoided(c) && !isCategoryAvoided(c))).filter(keep);

    // Too few left, because the template avoids what row 4 usually offers and the
    // palette has already spent the borrowed chords on rows 2-3. The chords the
    // palette built and had no pad for are, by construction, what the template
    // wants next, so they fill the gap: not avoided, not outside the hard filter,
    // and not a chord the grid or the pool already holds, by numeral or by
    // sounding pitch classes. They are taken only as far as four, best score
    // first, so a row 4 that does not starve is the row 4 it always was.
    if (scoredCandidates.length < 4 && unusedPaletteChords.length > 0) {
        const takenNumerals = new Set([...usedRomanNumerals, ...scoredCandidates.map(c => c.romanNumeral)]);
        const fill = [];
        for (const chord of unusedPaletteChords) {
            const candidate = {
                root: chord.root ?? chord.scaleDegree,
                notes: chord.notes,
                chordType: chord.chordType,
                chordName: chord.chordName,
                romanNumeral: chord.romanNumeral,
                quality: getQualityLabel(chord.chordType),
                category: 'palette',
                commonUsage: 0.5, // no data; neither common enough for the point nor a tiebreak
                priority: chordPriority(chord.chordType, palettePriorities),
                excludedByFilter: Boolean(paletteFilter) && !paletteFilter.includes(chord.chordType)
            };
            if (isAvoided(candidate) || candidate.excludedByFilter) continue;
            if (takenNumerals.has(candidate.romanNumeral)) continue;
            takenNumerals.add(candidate.romanNumeral);
            fill.push(candidate);
        }
        for (const candidate of scoreAndSort(fill)) {
            if (scoredCandidates.length >= 4) break;
            if (keep(candidate)) scoredCandidates.push(candidate);
        }
        scoredCandidates = scoreAndSort(scoredCandidates);
    }

    // Still too few. Re-admit until there are four, softest exclusion first: the
    // avoided candidates that are new to the grid; then the ones the hard filter
    // dropped, which is what the palette itself does when its filter starves it
    // (the top-up in generateVariant() ignores the filter); only then a numeral
    // already on the grid. Within each step the unavoided come first, then the
    // best score. A chord that sounds like one already kept is never re-admitted.
    if (scoredCandidates.length < 4) {
        // The categories the template's hint avoids come back right after the
        // types its priorities avoid (spec 10 §3.3)
        const readmission = [
            scoreAndSort(listed.filter(c => isNew(c) && isAvoided(c) && !isCategoryAvoided(c))),
            scoreAndSort(listed.filter(c => isNew(c) && isCategoryAvoided(c) && !isAvoided(c))),
            scoreAndSort(listed.filter(c => isNew(c) && isCategoryAvoided(c) && isAvoided(c))),
            scoreAndSort(allCandidates.filter(c => c.excludedByFilter && isNew(c) && !isAvoided(c))),
            scoreAndSort(allCandidates.filter(c => c.excludedByFilter && isNew(c) && isAvoided(c))),
            scoreAndSort(listed.filter(c => !isNew(c) && !isAvoided(c))),
            scoreAndSort(listed.filter(c => !isNew(c) && isAvoided(c))),
            scoreAndSort(allCandidates.filter(c => c.excludedByFilter && !isNew(c)))
        ].flat();
        for (const candidate of readmission) {
            if (scoredCandidates.length >= 4) break;
            if (keep(candidate)) scoredCandidates.push(candidate);
        }
        scoredCandidates = scoreAndSort(scoredCandidates);
    }

    // Take top 4, ensuring some diversity in categories
    const selected = [];
    const usedCategories = new Set();

    // First pass: get highest scoring from each unique category
    for (const chord of scoredCandidates) {
        if (selected.length >= 4) break;
        if (!usedCategories.has(chord.category) || selected.length < 2) {
            selected.push(chord);
            usedCategories.add(chord.category);
        }
    }

    // Fill remaining slots with highest scores
    for (const chord of scoredCandidates) {
        if (selected.length >= 4) break;
        if (!selected.includes(chord)) {
            selected.push(chord);
        }
    }

    return selected;
}

// Helper to check if a chord matches Chord Matcher requirements
export function matchesChordRequirement(scaleDegree, chordType, keyOffset, chordRequirements = []) {
    if (chordRequirements.length === 0) return false;

    const chordRoot = ((scaleDegree + keyOffset) % 12 + 12) % 12;

    return chordRequirements.some(req =>
        NOTE_PITCH_CLASSES[req.note] === chordRoot &&
        MATCHER_QUALITY_TYPES[req.quality] === chordType
    );
}

// Generate scale exploration (all chords from a scale/mode)
// Rows 1-2 hold the triad on every scale degree, rows 3-4 the seventh chord on
// every scale degree. Both are derived from the scale itself (see getScaleTriad
// / getScaleSeventh), so nothing on the grid contains a note the scale does not
// have - which is how half-diminished, diminished 7th, minor-major 7th and 6th
// chords turn up wherever the scale actually calls for them.
//
// No two pads sound alike (docs/improvements/15-scale-mode-gap-filler.md). A
// degree chord whose sound is already on the grid - Whole Tone's augmented
// triads on I, III and V are one chord, a diminished scale's dim7 on every other
// degree is one chord, a degree with no seventh would repeat its triad - is
// replaced by another chord the scale supports, on the same degree when one
// fits. Scales with fewer than 8 degrees leave gaps in each half, filled the
// same way rather than by repeating the tonic.
export function generateScaleExploration({ key, mode, chordRequirements = [] }) {
    const keyOffset = getKeyOffset(key);
    const scaleDegrees = getScaleDegrees(mode);
    const scaleLength = scaleDegrees.length;
    const pads = [];
    // Roots take the letter of their scale degree: C Lydian's fourth degree is
    // F#, not Gb (docs/improvements/13-spelling.md D1, D8)
    const spelling = scaleSpelling(key, mode);
    const harmonyPitchClasses = getHarmonyPitchClasses(mode);

    const addPad = (degree, chordType) => {
        const scaleDegree = scaleDegrees[degree % scaleLength];
        const romanNumeral = getRomanNumeralForChord(degree, chordType);
        const notes = buildChord(scaleDegree, chordType, keyOffset);
        const position = { romanNumeral, semitones: scaleDegree };
        pads.push({
            id: pads.length + 1,
            chordName: getChordName(spelling, position, chordType),
            romanNumeral,
            notes,
            spelling: spellChord(spelling, position, chordType, notes),
            chordType,
            quality: getQualityLabel(chordType),
            row: Math.floor(pads.length / 4) + 1,
            col: (pads.length % 4) + 1,
            isProgressionChord: false,
            isChordMatcherChord: matchesChordRequirement(scaleDegree, chordType, keyOffset, chordRequirements)
        });
    };

    // Suspended colours first in the triad half, extensions first in the
    // seventh half; each list then falls through to the other's. The further
    // colours are tried only once those are spent, which only the symmetric
    // scales and degrees without a seventh reach.
    const SUSPENDED_COLOURS = ['sus4', 'sus2', 'quartal'];
    const EXTENDED_COLOURS = ['major6', 'minor6', 'dom7sus4', 'add9', 'minAdd9', 'major9', 'minor9', 'dom9', 'quartal4'];
    const FURTHER_COLOURS = ['dom7b5', 'aug9', 'aug7', 'augMaj7', 'dom7b9', 'dom7sharp9', 'dom7alt',
        'major7', 'dom7', 'minor7', 'minMaj7', 'm7b5', 'dim7', 'major', 'minor', 'augmented', 'diminished',
        'maj6/9', 'add11', 'dom11', 'minor11', 'major13', 'dom13', 'minor13'];
    const TRIAD_HALF_COLOURS = [...SUSPENDED_COLOURS, ...EXTENDED_COLOURS];
    const SEVENTH_HALF_COLOURS = [...EXTENDED_COLOURS, ...SUSPENDED_COLOURS];

    const degreeSlots = Math.min(scaleLength, 8);
    const plan = new Array(16).fill(null);       // pad index -> { degree, type }
    const takenSounds = new Set();
    const takenNumerals = new Set();
    const soundOf = (degree, type) => pcSignature(buildChord(scaleDegrees[degree], type, keyOffset));
    const isNew = (degree, type) =>
        chordFitsScale(((scaleDegrees[degree] % 12) + 12) % 12, type, harmonyPitchClasses) &&
        !takenNumerals.has(getRomanNumeralForChord(degree, type)) &&
        !takenSounds.has(soundOf(degree, type));
    const take = (index, degree, type) => {
        plan[index] = { degree, type };
        takenSounds.add(soundOf(degree, type));
        takenNumerals.add(getRomanNumeralForChord(degree, type));
    };
    // First new-sounding chord from the lists, trying the degrees in order and
    // every degree with one list before moving to the next list
    const findNew = (degrees, lists) => {
        for (const list of lists) {
            for (const degree of degrees) {
                const type = list.find(candidate => isNew(degree, candidate));
                if (type) return { degree, type };
            }
        }
        return null;
    };
    const allDegrees = [...Array(scaleLength).keys()];

    // 1. Every degree chord whose sound is not on the grid yet, triads first
    const repeats = [];
    for (let degree = 0; degree < degreeSlots; degree++) {
        const type = getScaleTriad(degree, mode);
        if (isNew(degree, type)) take(degree, degree, type); else repeats.push(degree);
    }
    for (let degree = 0; degree < degreeSlots; degree++) {
        const type = getScaleSeventh(degree, mode);
        if (isNew(degree, type)) take(8 + degree, degree, type); else repeats.push(8 + degree);
    }

    // 2. A repeated degree chord gives way to another chord, on its own degree
    //    when one fits, otherwise on the first degree that has one
    for (const index of repeats) {
        const degree = index % 8;
        const colours = index < 8 ? TRIAD_HALF_COLOURS : SEVENTH_HALF_COLOURS;
        const otherDegrees = allDegrees.filter(other => other !== degree);
        const found = findNew([degree], [colours, FURTHER_COLOURS]) ||
            findNew(otherDegrees, [colours, FURTHER_COLOURS]);
        if (found) take(index, found.degree, found.type);
        else plan[index] = { degree, type: index < 8 ? getScaleTriad(degree, mode) : getScaleSeventh(degree, mode) };
    }

    // 3. The gaps of scales with fewer than 8 degrees: the tonic first, then
    //    every other degree
    for (let index = 0; index < 16; index++) {
        if (plan[index]) continue;
        const colours = index < 8 ? TRIAD_HALF_COLOURS : SEVENTH_HALF_COLOURS;
        const found = findNew(allDegrees, [colours, FURTHER_COLOURS]);
        if (found) take(index, found.degree, found.type);
        else plan[index] = { degree: 0, type: index < 8 ? getScaleTriad(0, mode) : getScaleSeventh(0, mode) };
    }

    plan.forEach(({ degree, type }) => addPad(degree, type));

    return {
        name: mode,
        titleKey: 'scaleExploration',
        pads: pads
    };
}

// The triads the Jazz style turns into seventh chords, and what they become.
const JAZZ_SEVENTH = { minor: 'minor7', major: 'major7', diminished: 'm7b5', augmented: 'aug7' };

export function generateVariant(variantType, { key, mode, progression, category = null, chordRequirements = [] }) {
    const keyOffset = getKeyOffset(key);
    // Progression Palette Mode reads every roman numeral against the parallel
    // major scale (see generateProgressionChords), and the Mode/Scale selector
    // is disabled here. Build the palette on the same reference so a mode left
    // over from Scale Mode cannot silently transpose the palette away from the
    // progression it is supposed to extend.
    const scaleDegrees = getScaleDegrees('Major');
    const pads = [];

    // The palette preferences belong to the template as listed under its genre:
    // a value listed under several genres carries different priorities in each
    // (docs/improvements/01-template-identity.md). Without a category, the first
    // genre listing the value is used, as it always was.
    const template = resolveTemplate(progression, category)?.template;
    const paletteFilter = template?.paletteFilter || null;
    const palettePriorities = template?.palettePriorities || null;

    // Every chord on the grid is named, and every pad spelled, in the key and the
    // template's tonality: C# minor, not Db minor; the vi of A is F#m
    // (docs/improvements/13-spelling.md). A pad's spelling is computed from its
    // final notes, after voicing and after the Jazz upgrade.
    // Numerals are read against the parallel major in either tonality; what the
    // palette and row 4 offer around them depends on it
    // (docs/improvements/07-minor-key-awareness.md)
    const tonality = template ? templateTonality(template) : 'major';
    const spelling = templateSpelling(key, tonality);
    const spelled = pad => ({ ...pad, spelling: spellChord(spelling, { romanNumeral: pad.romanNumeral }, pad.chordType, pad.notes) });

    let progressionChords = generateProgressionChords(progression, keyOffset, scaleDegrees, mode, spelling);

    // Store the ORIGINAL progression chords before building palette
    const originalProgression = [...progressionChords];
    const originalProgressionLength = progressionChords.length;

    // Convert progression sequence to palette ensuring ALL 16 PADS ARE UNIQUE
    // Harmonic gradient: Row 1 (pads 1-4, bottom visual row) = foundation with tonic
    //                    Row 4 (pads 13-16, top visual row) = spicy adventurous chords

    // Extract unique chord degrees
    const uniqueDegrees = [];
    const seenDegrees = new Set();
    progressionChords.forEach(chord => {
        // Key on the sounding root, not the degree index: ♭VII and VII share a
        // degree, so keying on the index silently dropped one of them.
        const rootKey = chord.scaleDegree ?? chord.degree;
        if (!seenDegrees.has(rootKey)) {
            seenDegrees.add(rootKey);
            uniqueDegrees.push({ degree: chord.degree, original: chord });
        }
    });

    // Build comprehensive palette with DIFFERENT extensions for each degree.
    // The progression chords are claimed up front: the palette is appended
    // after them, so without this the palette re-emitted the progression's own
    // chords as its cheapest entries and rows 1 and 2 came out identical.
    const palette = [];
    const usedRomanNumerals = new Set(progressionChords.map(chord => chord.romanNumeral));
    // A pad's identity is also its sound: two chords with the same pitch classes
    // are one chord whatever they are called, and a grid that spends two pads on
    // one sonority has fifteen. The progression's own chords seed the set, but
    // they are not checked against each other: a template may repeat a chord on
    // purpose (I-IV-I-V, the twelve-bar blues), and those pads are the progression.
    const usedSignatures = new Set(progressionChords.map(chord => pcSignature(chord.notes)));

    // Set false by the top-up pass below when the filter has starved the palette
    let filterActive = true;

    // Helper to add unique chord
    const addChord = (degree, type, romanBase, suffix, spice, isChordMatcher = false, rootOverride = null, category = null) => {
        // Apply palette filter if defined (hard filter - backward compatibility)
        if (filterActive && paletteFilter && !paletteFilter.includes(type)) {
            return; // Skip chord types not in the filter
        }

        // A secondary-dominant numeral carries its slash in the middle
        // ('V/ii'), so appending the suffix at the end produced 'V/ii7'
        // instead of the conventional 'V7/ii' - a different string from the
        // 'V7/ii' generateRow4Candidates() offers for the same chord, so the
        // two survived as duplicate pads instead of deduplicating.
        const roman = romanBase.includes('/')
            ? romanBase.replace('/', suffix + '/')
            : romanBase + suffix;
        const scaleDegree = rootOverride === null ? scaleDegrees[degree % scaleDegrees.length] : rootOverride;
        const notes = buildChord(scaleDegree, type, keyOffset);

        // Both keys must be new: the numeral, and what the chord sounds like
        const signature = pcSignature(notes);
        if (usedRomanNumerals.has(roman) || usedSignatures.has(signature)) return; // Skip duplicates
        usedRomanNumerals.add(roman);
        usedSignatures.add(signature);

        const priority = chordPriority(type, palettePriorities); // 1=avoided, 2=allowed, 3=preferred

        palette.push({
            degree,
            root: scaleDegree,
            notes,
            chordType: type,
            chordName: getChordName(spelling, { romanNumeral: roman, semitones: scaleDegree }, type),
            romanNumeral: roman,
            spiceLevel: spice, // 0=foundation, 1=standard, 2=colorful, 3=spicy
            priority: priority, // 1=avoided, 2=allowed, 3=preferred
            category, // 'diatonic' or 'borrowed' for the colour chords, else null
            isChordMatcherChord: isChordMatcher
        });
    };

    // Helper to determine spice level based on harmonic function
    const getSpiceLevelForDegree = (degree) => {
        // Tonic (I or i) = foundation (0)
        if (degree === 0) return 0;
        // Subdominant/Dominant (IV, V) = standard (1)
        if (degree === 3 || degree === 4) return 1;
        // Supertonic, Submediant (ii, vi) = standard (1)
        if (degree === 1 || degree === 5) return 1;
        // Mediant (iii) = colorful (2)
        if (degree === 2) return 2;
        // Leading tone/Subtonic (vii°, ♭VII) = spicy (3)
        if (degree === 6) return 3;
        // Default
        return 1;
    };

    // Inject Chord Matcher requirements into palette
    if (chordRequirements.length > 0) {
        chordRequirements.forEach(req => {
            const reqNoteOffset = NOTE_PITCH_CLASSES[req.note];

            // Find which scale degree this chord corresponds to
            const matchedDegree = scaleDegrees.findIndex(
                degree => ((degree + keyOffset) % 12 + 12) % 12 === reqNoteOffset
            );

            if (matchedDegree === -1) {
                // Chord not in scale - skip it (shouldn't happen if Chord Matcher filtering works)
                console.warn(`Chord Matcher chord ${req.display} not found in ${key} ${mode}`);
                return;
            }

            const chordType = MATCHER_QUALITY_TYPES[req.quality] || 'major';

            // Add to palette with Chord Matcher flag. The roman numeral already
            // carries the quality (viiø7, i(maj7)...), so no extra suffix.
            addChord(
                matchedDegree,
                chordType,
                getRomanNumeralForChord(matchedDegree, chordType),
                '',
                getSpiceLevelForDegree(matchedDegree),
                true
            );
        });
    }

    // Generate extensions for each unique degree
    uniqueDegrees.forEach(({ degree, original }) => {
        const romanBase = original.romanNumeral.replaceAll(/7|M7|m7|°/g, '');
        const baseType = original.chordType;
        const baseFamily = getChordFamily(baseType);
        // Rebuild extensions on the chord's own root. Indexing back into
        // scaleDegrees discarded any ♭ or ♯, so a ♭VII in the progression grew
        // its extensions on the natural VII while keeping the flat in its label.
        const rootPc = original.scaleDegree ?? null;

        if (baseFamily === 'major') {
            // Major/dominant chords: generate varied extensions
            addChord(degree, 'major', romanBase, '', degree === 0 ? 0 : 1, false, rootPc);
            addChord(degree, 'dom7', romanBase, '7', 1, false, rootPc);
            addChord(degree, 'major7', romanBase, 'M7', 2, false, rootPc);
            if (variantType === 'Jazz' || variantType === 'Experimental') {
                addChord(degree, 'dom9', romanBase, '9', 2, false, rootPc);
            }
        } else if (baseFamily === 'minor') {
            // Minor chords
            addChord(degree, 'minor', romanBase, '', 1, false, rootPc);
            addChord(degree, 'minor7', romanBase, '7', 1, false, rootPc);
            if (variantType === 'Jazz') {
                addChord(degree, 'minor9', romanBase, '9', 2, false, rootPc);
            }
        } else {
            // Diminished, augmented, suspended. The suffix has to be restored:
            // romanBase has had the ° stripped off it, so passing '' relabelled
            // a diminished chord as a plain numeral and let the palette re-add
            // the chord the progression already had.
            addChord(degree, baseType, romanBase, getRomanSuffix(baseType), 1, false, rootPc);
        }

        // Offer the colours this genre actually asks for. Without this the
        // palette only ever emitted plain triads and 7ths, so the dom9 / sus4 /
        // quartal / m7b5 preferences declared by the progression templates had
        // no way to reach a pad. Only chords built on the same triad as the
        // degree are offered (plus suspensions, which fit either).
        // A template that declares only a paletteFilter names its colours there.
        const declaredTypes = [
            ...(palettePriorities?.preferred || []),
            ...(palettePriorities?.allowed || []),
            ...(paletteFilter || [])
        ];
        declaredTypes.forEach(type => {
            const family = getChordFamily(type);
            if (family !== baseFamily && family !== 'suspended') return;
            addChord(degree, type, romanBase, getRomanSuffix(type), getChordComplexity(type), false, rootPc);
        });
    });

    // Add complementary chords (foundation and spicy). They are the key's own
    // supertonic and dominant or submediant: in a major key ii and vi, in a minor
    // key the natural minor's iiø7, ii°, v and v7. The major key's ii and vi, B
    // minor and F♯ minor in A minor, were offered to every minor template though
    // F♯ minor belongs to no form of A minor (spec 07 D3).
    // [degree, chord type, spice]
    const complements = tonality === 'minor'
        ? [[1, 'm7b5', 2], [1, 'diminished', 2], [4, 'minor', 1], [4, 'minor7', 1]]
        : [[1, 'minor7', 0], [1, 'minor', 1], [5, 'minor', 1], [5, 'minor7', 1]];
    for (const [degree, type, spice] of complements) {
        if (degree < scaleDegrees.length) addChord(degree, type, getRomanNumeralForChord(degree, type), '', spice);
    }

    // The colour chords of the other mode. In a major key ♭VII, ♭VI, ♭III and iv
    // are borrowed from the parallel minor; in a minor key they are its own
    // diatonic chords, offered as plainly as any (spec 07 D4). The guard that was
    // meant to tell the two apart compared against the major scale, which
    // template mode always uses, so it never fired. Routed through addChord so
    // they take part in the same de-duplication and priority handling as
    // everything else: pushing them straight onto the palette meant a
    // progression containing ♭VII got a second ♭VII pad, and left them without a
    // priority so the palette sort compared against undefined.
    // [semitones above tonic, degree, roman numeral, chord type, spice]
    const colourChords = tonality === 'minor'
        ? [[10, 6, '♭VII', 'major', 1], [8, 5, '♭VI', 'major', 1], [3, 2, '♭III', 'major', 1], [5, 3, 'iv', 'minor', 1]]
        : [[10, 6, '♭VII', 'major', 2], [8, 5, '♭VI', 'major', 3], [3, 2, '♭III', 'major', 3], [5, 3, 'iv', 'minor', 2]];
    const colourCategory = tonality === 'minor' ? 'diatonic' : 'borrowed';
    for (const [semitones, degree, roman, type, spice] of colourChords) {
        addChord(degree, type, roman, '', spice, false, (scaleDegrees[0] + semitones) % 12, colourCategory);
    }

    // A narrow paletteFilter can leave fewer chords than the grid needs. The MPC
    // layout is always 4x4, and a short grid exports a .progression file with
    // fewer than 16 chords, so top up with diatonic chords ignoring the filter.
    // These land last: they are all priority 2 or lower and spicier than the
    // filtered chords that earned their place.
    const PADS_BEFORE_DYNAMIC_ROW = 12;
    if (originalProgressionLength + palette.length < PADS_BEFORE_DYNAMIC_ROW) {
        filterActive = false;
        // The key's own chords, so a minor template is topped up from the minor
        // key (spec 07 §3.2). The spec's ten mostly repeat the colour chords and
        // complements already offered, so a template whose filter keeps few of
        // those ran dry and its grid came out short: Hip-Hop/Trap i—♭VII—iv and
        // Italo-Disco/House i—iv got fourteen pads. The natural minor's three
        // other diatonic sevenths follow them, used only when the ten are spent
        // (spec 07 §8). [degree, chord type, roman numeral, semitones above the
        // tonic for a root off the major scale]
        const topUp = tonality === 'minor'
            ? [
                [0, 'minor', 'i'], [0, 'minor7', 'i7'], [1, 'm7b5', 'iiø7'], [2, 'major', '♭III', 3],
                [3, 'minor', 'iv'], [3, 'minor7', 'iv7'], [4, 'minor', 'v'], [4, 'minor7', 'v7'],
                [5, 'major', '♭VI', 8], [6, 'major', '♭VII', 10],
                [2, 'major7', '♭IIIM7', 3], [5, 'major7', '♭VIM7', 8], [6, 'dom7', '♭VII7', 10]
            ]
            : [
                [0, 'major'], [0, 'major7'], [1, 'minor'], [1, 'minor7'],
                [2, 'minor'], [2, 'minor7'], [3, 'major'], [3, 'major7'],
                [4, 'major'], [4, 'dom7'], [5, 'minor'], [5, 'minor7']
            ].map(([degree, type]) => [degree, type,
                getRomanNumeralForChord(degree, type === 'major7' ? 'major' : type === 'minor7' ? 'minor' : type) + getRomanSuffix(type)]);
        for (const [degree, type, roman, semitones] of topUp) {
            if (originalProgressionLength + palette.length >= PADS_BEFORE_DYNAMIC_ROW) break;
            if (degree >= scaleDegrees.length) continue;
            addChord(degree, type, roman, '', 3, false, semitones === undefined ? null : (scaleDegrees[0] + semitones) % 12);
        }
        filterActive = true;
    }

    // Sort by spice level (foundation first, spicy last)
    // Sort palette by priority (preferred first), then by spice level within same priority
    // Priority: 3=preferred, 2=allowed, 1=avoided
    // Spice: 0=foundation, 1=standard, 2=colorful, 3=spicy
    palette.sort((a, b) => {
        // Higher priority first (3 > 2 > 1)
        if (b.priority !== a.priority) {
            return b.priority - a.priority;
        }
        // Within same priority, lower spice first (foundation before spicy)
        return a.spiceLevel - b.spiceLevel;
    });

    // The Pedal style holds the bass of the progression's first chord under the
    // whole grid, palette and row 4 included (docs/improvements/11-pedal-voicing-style.md D5)
    const pedalPitchClass = originalProgression.length ? ((Math.min(...originalProgression[0].notes) % 12) + 12) % 12 : 0;

    // Apply variant-specific voicing styles to ORIGINAL PROGRESSION
    let voicedProgression = [...originalProgression];
    switch (variantType) {
        case 'Smooth':
            voicedProgression = optimizeSmoothVoiceLeading(voicedProgression);
            break;
        case 'Classic':
            voicedProgression = optimizeVoiceLeading(voicedProgression);
            break;
        case 'Jazz':
            voicedProgression = applyVoicingStyle(voicedProgression, 'close');
            voicedProgression = optimizeVoiceLeading(voicedProgression);
            break;
        case 'Modal':
            voicedProgression = applyVoicingStyle(voicedProgression, 'open');
            break;
        case 'Experimental':
            voicedProgression = applyVoicingStyle(voicedProgression, 'spread');
            break;
        case 'Pedal':
            voicedProgression = applyPedalVoicing(voicedProgression, pedalPitchClass);
            break;
    }

    // Apply same voicing to palette (for pads beyond progression)
    let voicedPalette = palette;
    switch (variantType) {
        case 'Smooth':
            voicedPalette = optimizeSmoothVoiceLeading(voicedPalette);
            break;
        case 'Classic':
            voicedPalette = optimizeVoiceLeading(voicedPalette);
            break;
        case 'Jazz':
            voicedPalette = applyVoicingStyle(voicedPalette, 'close');
            voicedPalette = optimizeVoiceLeading(voicedPalette);
            break;
        case 'Modal':
            voicedPalette = applyVoicingStyle(voicedPalette, 'open');
            break;
        case 'Experimental':
            voicedPalette = applyVoicingStyle(voicedPalette, 'spread');
            break;
        case 'Pedal':
            voicedPalette = applyPedalVoicing(voicedPalette, pedalPitchClass);
            break;
    }

    // Build complete chord queue: progression + palette
    const allChords = [...voicedProgression, ...voicedPalette];
    let chordQueueIndex = 0;

    // Helper: Get next chord from queue
    const getNextChord = () => {
        if (chordQueueIndex < allChords.length) {
            return allChords[chordQueueIndex++];
        }
        return null;
    };

    // Fill first 12 pads (rows 1-3) and collapse contiguous duplicates per row
    const rows1to3 = [];
    const initialPads = []; // Temporary storage before deduplication

    // First pass: fill all 12 slots
    for (let i = 0; i < 12; i++) {
        const sourceChord = getNextChord();
        if (!sourceChord) break;

        initialPads.push({
            sourceChord,
            isProgressionChord: i < originalProgressionLength
        });
    }

    // Second pass: collapse contiguous duplicates per row and refill
    for (let row = 0; row < 3; row++) {
        const rowStart = row * 4;
        const rowEnd = rowStart + 4;
        const rowPads = [];

        // Collapse duplicates in this row
        for (let i = rowStart; i < rowEnd && i < initialPads.length; i++) {
            const current = initialPads[i];
            const previous = rowPads.length > 0 ? rowPads[rowPads.length - 1] : null;

            // Skip if same chord as previous in this row
            if (previous && previous.sourceChord.romanNumeral === current.sourceChord.romanNumeral) {
                continue; // Skip duplicate
            }

            rowPads.push(current);
        }

        // Refill row to 4 pads with next available chords
        while (rowPads.length < 4) {
            const nextChord = getNextChord();
            if (!nextChord) break;

            rowPads.push({
                sourceChord: nextChord,
                isProgressionChord: false // Refilled slots are not progression chords
            });
        }

        // Convert to final pad format
        rowPads.forEach((padData, colIndex) => {
            const paletteChord = padData.sourceChord;
            let notes = paletteChord.notes;
            let chordName = paletteChord.chordName;
            let romanNumeral = paletteChord.romanNumeral;
            let chordType = paletteChord.chordType;
            const isProgressionChord = padData.isProgressionChord;
            const isChordMatcherChord = paletteChord.isChordMatcherChord || false;

            const padIndex = rowStart + colIndex;

            // Enhance chords based on variant type
            if (variantType === 'Jazz' && padIndex >= 4 && JAZZ_SEVENTH[chordType]) {
                // Add 7ths to chords in Jazz variant: triads become 7th chords.
                // Only the four triads of JAZZ_SEVENTH are upgraded; every other
                // pad is left exactly as the palette built it. A dom9 or a sus4
                // used to pass a "has no 7 in its name" guard, be upgraded to
                // itself and have its own suffix appended a second time: i99,
                // Isus4sus4, Iadd9add9.
                //
                // Build on the root the chord was actually made from - indexing
                // back into scaleDegrees turned a ♭VII pad into a maj7 on the
                // natural VII while it kept its flat label.
                const scaleDegree = paletteChord.root ?? scaleDegrees[paletteChord.degree % scaleDegrees.length];
                const upgraded = JAZZ_SEVENTH[chordType];
                // The numeral has to follow the chord, and the upgrade must not
                // recreate a chord the palette already carries. The new suffix
                // replaces the old one, and goes before the slash on an applied
                // chord ('V/ii' -> 'V7/ii'): appending it at the end produced
                // 'V/iiM7', a different string from the 'VM7/ii' the same upgrade
                // produces elsewhere for the identical chord, and a diminished
                // 'vii°' became 'vii°ø7' where it is 'viiø7'.
                const slash = romanNumeral.indexOf('/');
                const head = slash === -1 ? romanNumeral : romanNumeral.slice(0, slash);
                const tail = slash === -1 ? '' : romanNumeral.slice(slash);
                const oldSuffix = getRomanSuffix(chordType);
                const stem = oldSuffix && head.endsWith(oldSuffix) ? head.slice(0, -oldSuffix.length) : head;
                const upgradedRoman = stem + getRomanSuffix(upgraded) + tail;
                if (!usedRomanNumerals.has(upgradedRoman)) {
                    usedRomanNumerals.delete(romanNumeral);
                    usedRomanNumerals.add(upgradedRoman);
                    chordType = upgraded;
                    romanNumeral = upgradedRoman;
                    notes = buildChord(scaleDegree, chordType, keyOffset);
                    chordName = getChordName(spelling, { romanNumeral, semitones: scaleDegree }, chordType);
                }
            }

            const pad = spelled({
                id: padIndex + 1,
                chordName,
                romanNumeral,
                notes,
                chordType,
                quality: getQualityLabel(chordType),
                row: row + 1,
                col: colIndex + 1,
                isProgressionChord,
                isChordMatcherChord
            });

            pads.push(pad);
            rows1to3.push(pad);
        });
    }

    // Dynamically generate row 4 based on analysis of rows 1-3
    const row4Chords = selectDynamicRow4Chords(rows1to3, keyOffset, scaleDegrees, variantType, tonality, palettePriorities, paletteFilter, allChords.slice(chordQueueIndex), spelling, template?.row4 || null);

    // Fallback if not enough candidates (shouldn't happen)
    while (row4Chords.length < 4) {
        row4Chords.push({
            chordName: getChordName(spelling, { romanNumeral: 'I' }, 'major'),
            romanNumeral: 'I',
            notes: buildChord(scaleDegrees[0], 'major', keyOffset),
            chordType: 'major',
            quality: 'Major'
        });
    }

    // Row 4 is chosen after the palette is voiced, and the other styles leave it
    // in root position; the Pedal style holds its pedal under row 4 as well
    const row4 = variantType === 'Pedal' ? applyPedalVoicing(row4Chords.slice(0, 4), pedalPitchClass) : row4Chords;

    // Add Row 4 chords to pads
    for (let i = 0; i < 4; i++) {
        const chord = row4[i];
        pads.push(spelled({
            id: 13 + i,
            chordName: chord.chordName,
            romanNumeral: chord.romanNumeral,
            notes: chord.notes,
            chordType: chord.chordType,
            quality: chord.quality,
            row: 4,
            col: i + 1,
            isProgressionChord: false,
            isChordMatcherChord: false
        }));
    }

    return {
        name: variantType,
        // The tonality the grid was built in, for the tooltips and the analysis
        // line of the app (spec 07 §3.4, §3.5)
        tonality,
        pads
    };
}

// Helper to create a chord-based signature (ignoring voicing)
export function getChordProgressionSignature(variant) {
    // Notes belong in the signature. Without them this dropped any variant whose
    // chords matched an earlier one even when its voicings differed - which is
    // the entire reason the five styles exist. Of 175 variants discarded over
    // the catalogue in C, only 5 were genuinely redundant; Modal alone was
    // dropped 64 times, with distinct voicings every time.
    return variant.pads.map(pad =>
        `${pad.chordName}|${pad.romanNumeral}|${pad.notes.join(',')}`
    ).join('||');
}

// Remove duplicate variants
export function deduplicateVariants(variantList) {
    const seenProgressions = new Map();
    const unique = [];

    variantList.forEach(variant => {
        const chordSignature = getChordProgressionSignature(variant);

        // Keep the first variant with a given set of chords; later variants that
        // differ only in voicing are dropped
        if (!seenProgressions.has(chordSignature)) {
            seenProgressions.set(chordSignature, variant.name);
            unique.push(variant);
        }
    });

    return unique;
}

// The six voicing treatments a Progression Palette Mode template is rendered
// through. A nominal set, not an ordinal one - see docs/mpc-export-specification.md
// D5 for why these carry no rank number in the exported name. Pedal is appended
// last so that every fused label of the first five (Classic+Jazz) is unchanged
// (docs/improvements/11-pedal-voicing-style.md D1).
export const VARIANT_STYLES = ['Smooth', 'Classic', 'Jazz', 'Modal', 'Experimental', 'Pedal'];

// Single entry point used by the running app, tools/build-pack.mjs and
// tools/audit-theory.mjs alike, so all three generate identical output for
// identical input.
export function generateVariants({ key, mode, progression, category = null, generationMode, chordRequirements = [] }) {
    if (generationMode === 'template') {
        const allVariants = VARIANT_STYLES.map(style =>
            generateVariant(style, { key, mode, progression, category, chordRequirements })
        );

        // Track every style that produced a given signature before dedup
        // discards the losers, so a caller building the MPC display name
        // (modules/mpcNaming.js) can join them with '+' rather than naming the
        // surviving variant only for the first style that reached it - see
        // docs/mpc-export-specification.md §5.2.1.
        const stylesBySignature = new Map();
        allVariants.forEach(variant => {
            const signature = getChordProgressionSignature(variant);
            if (!stylesBySignature.has(signature)) stylesBySignature.set(signature, []);
            stylesBySignature.get(signature).push(variant.name);
        });

        return deduplicateVariants(allVariants).map(variant => ({
            ...variant,
            styles: stylesBySignature.get(getChordProgressionSignature(variant))
        }));
    }

    return [generateScaleExploration({ key, mode, chordRequirements })];
}
