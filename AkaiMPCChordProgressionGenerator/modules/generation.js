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
    progressions,
    getKeyOffset,
    getScaleDegrees,
    getChordQualityForMode,
    getScaleTriad,
    getScaleSeventh,
    getQualityLabel,
    getRomanNumeralForChord,
    getHarmonyPitchClasses,
    chordFitsScale,
    getRomanSuffix,
    getChordFamily,
    getChordComplexity,
    MATCHER_QUALITY_TYPES,
    buildChord,
    getChordName,
    generateProgressionChords,
    applyVoicingStyle,
    optimizeVoiceLeading,
    optimizeSmoothVoiceLeading
} from './musicTheory.js';

export const NOTE_PITCH_CLASSES = { 'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11 };

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

        // Check for subdominant (IV or ii)
        if (chord.romanNumeral && (chord.romanNumeral.includes('IV') || chord.romanNumeral.includes('ii'))) {
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

export function determineChordFunction(romanNumeral) {
    if (!romanNumeral) return null;
    const upper = romanNumeral.toUpperCase();

    if (upper.includes('I') && !upper.includes('II') && !upper.includes('V')) return 'tonic';
    if (upper.includes('IV') || upper.includes('II')) return 'subdominant';
    if (upper.includes('V')) return 'dominant';
    if (upper.includes('VI') || upper.includes('III')) return 'mediant';
    return 'chromatic';
}

export function generateRow4Candidates(keyOffset, scaleDegrees, analysis, variantType) {
    const candidates = [];

    // Always consider these common non-diatonic chords
    // ♭VII (borrowed from mixolydian/minor)
    const flatSeven = (scaleDegrees[0] + 10) % 12;
    candidates.push({
        root: flatSeven,
        notes: buildChord(flatSeven, 'major', keyOffset),
        chordType: 'major',
        chordName: getChordName(flatSeven, 'major', keyOffset, '♭VII'),
        romanNumeral: '♭VII',
        quality: 'Major',
        category: 'borrowed',
        commonUsage: 0.9
    });

    // ♭VI (borrowed from minor)
    const flatSix = (scaleDegrees[0] + 8) % 12;
    candidates.push({
        root: flatSix,
        notes: buildChord(flatSix, 'major', keyOffset),
        chordType: 'major',
        chordName: getChordName(flatSix, 'major', keyOffset, '♭VI'),
        romanNumeral: '♭VI',
        quality: 'Major',
        category: 'borrowed',
        commonUsage: 0.8
    });

    // V7 (dominant seventh)
    if (!analysis.hasDominant7 && scaleDegrees.length > 4) {
        const fifth = scaleDegrees[4 % scaleDegrees.length];
        candidates.push({
            root: fifth,
            notes: buildChord(fifth, 'dom7', keyOffset),
            chordType: 'dom7',
            chordName: getChordName(fifth, 'dom7', keyOffset),
            romanNumeral: 'V7',
            quality: 'Dominant 7',
            category: 'dominant',
            commonUsage: 1.0
        });
    }

    // ii7 (subdominant seventh)
    if (!analysis.hasSubdominant && scaleDegrees.length > 1) {
        const second = scaleDegrees[1 % scaleDegrees.length];
        candidates.push({
            root: second,
            notes: buildChord(second, 'minor7', keyOffset),
            chordType: 'minor7',
            chordName: getChordName(second, 'minor7', keyOffset),
            romanNumeral: 'ii7',
            quality: 'Minor 7',
            category: 'subdominant',
            commonUsage: 0.85
        });
    }

    // iv (minor subdominant - borrowed from parallel minor)
    if (scaleDegrees.length > 3) {
        const fourth = scaleDegrees[3 % scaleDegrees.length];
        candidates.push({
            root: fourth,
            notes: buildChord(fourth, 'minor', keyOffset),
            chordType: 'minor',
            chordName: getChordName(fourth, 'minor', keyOffset),
            romanNumeral: 'iv',
            quality: 'Minor',
            category: 'borrowed',
            commonUsage: 0.85
        });
    }

    // VI (major sixth - raised submediant, common in pop/rock)
    if (scaleDegrees.length > 5) {
        const sixth = scaleDegrees[5 % scaleDegrees.length];
        // A major VI is a major triad on the submediant - the quality changes,
        // not the root. Raising the root built the chord on the flat seventh
        // and still labelled it VI.
        candidates.push({
            root: sixth,
            notes: buildChord(sixth, 'major', keyOffset),
            chordType: 'major',
            chordName: getChordName(sixth, 'major', keyOffset),
            romanNumeral: 'VI',
            quality: 'Major',
            category: 'borrowed',
            commonUsage: 0.8
        });
    }

    // Secondary dominants (V7/x chords)
    // Always calculated from major scale degrees (P5 above target), not the
    // current mode's scale degrees, since secondary dominants are chromatic
    // and not derived from the diatonic scale.
    // In key of C: V/V=D7, V/ii=A7, V/vi=E7, V/IV=C7
    if (scaleDegrees.length > 1) {
        // V7/V: P5 above V (scale degree 7) = scale degree 2
        const vOfV = 2;  // Always D in key of C, regardless of mode
        candidates.push({
            root: vOfV,
            notes: buildChord(vOfV, 'dom7', keyOffset),
            chordType: 'dom7',
            chordName: getChordName(vOfV, 'dom7', keyOffset),
            romanNumeral: 'V7/V',
            quality: 'Dominant 7',
            category: 'secondary',
            commonUsage: 0.7
        });

        // V7/ii: P5 above ii (scale degree 2) = scale degree 9
        const vOfii = 9;  // Always A in key of C
        candidates.push({
            root: vOfii,
            notes: buildChord(vOfii, 'dom7', keyOffset),
            chordType: 'dom7',
            chordName: getChordName(vOfii, 'dom7', keyOffset),
            romanNumeral: 'V7/ii',
            quality: 'Dominant 7',
            category: 'secondary',
            commonUsage: 0.5
        });

        // V7/vi: P5 above vi (scale degree 9) = scale degree 4
        const vOfvi = 4;  // Always E in key of C
        candidates.push({
            root: vOfvi,
            notes: buildChord(vOfvi, 'dom7', keyOffset),
            chordType: 'dom7',
            chordName: getChordName(vOfvi, 'dom7', keyOffset),
            romanNumeral: 'V7/vi',
            quality: 'Dominant 7',
            category: 'secondary',
            commonUsage: 0.5
        });

        // V7/IV: P5 above IV (scale degree 5) = scale degree 0 (tonic as dom7)
        const vOfIV = 0;  // Always C7 in key of C (I7 functions as V7/IV)
        candidates.push({
            root: vOfIV,
            notes: buildChord(vOfIV, 'dom7', keyOffset),
            chordType: 'dom7',
            chordName: getChordName(vOfIV, 'dom7', keyOffset),
            romanNumeral: 'V7/IV',
            quality: 'Dominant 7',
            category: 'secondary',
            commonUsage: 0.4
        });
    }

    // Augmented 6th chords (classical approach to V)
    if (variantType === 'Classic' || variantType === 'Jazz') {
        const flatSix = (scaleDegrees[0] + 8) % 12;  // ♭6 scale degree

        // Italian 6th (It+6): ♭VI with raised 4th
        candidates.push({
            root: flatSix,
            notes: buildChord(flatSix, 'It6', keyOffset),
            chordType: 'It6',
            chordName: getChordName(flatSix, 'It6', keyOffset, 'It+6'),
            romanNumeral: 'It+6',
            quality: 'Italian 6th',
            category: 'augmented6th',
            commonUsage: 0.3
        });

        // German 6th (Ger+6): like It6 but with ♭3
        candidates.push({
            root: flatSix,
            notes: buildChord(flatSix, 'Ger6', keyOffset),
            chordType: 'Ger6',
            chordName: getChordName(flatSix, 'Ger6', keyOffset, 'Ger+6'),
            romanNumeral: 'Ger+6',
            quality: 'German 6th',
            category: 'augmented6th',
            commonUsage: 0.3
        });

        // French 6th (Fr+6): like It6 but with 2
        candidates.push({
            root: flatSix,
            notes: buildChord(flatSix, 'Fr6', keyOffset),
            chordType: 'Fr6',
            chordName: getChordName(flatSix, 'Fr6', keyOffset, 'Fr+6'),
            romanNumeral: 'Fr+6',
            quality: 'French 6th',
            category: 'augmented6th',
            commonUsage: 0.2
        });
    }

    // ♭III (borrowed from minor)
    const flatThree = (scaleDegrees[0] + 3) % 12;
    candidates.push({
        root: flatThree,
        notes: buildChord(flatThree, 'major', keyOffset),
        chordType: 'major',
        chordName: getChordName(flatThree, 'major', keyOffset, '♭III'),
        romanNumeral: '♭III',
        quality: 'Major',
        category: 'borrowed',
        commonUsage: 0.5
    });

    // ♭II (Neapolitan)
    const neapolitan = (scaleDegrees[0] + 1) % 12;
    candidates.push({
        root: neapolitan,
        notes: buildChord(neapolitan, 'major', keyOffset),
        chordType: 'major',
        chordName: getChordName(neapolitan, 'major', keyOffset, '♭II'),
        romanNumeral: '♭II',
        quality: 'Major',
        category: 'chromatic',
        commonUsage: 0.4
    });

    // Variant-specific additions
    if (variantType === 'Jazz') {
        // SubV7 (tritone substitution for V7)
        const tritone = (scaleDegrees[4] + 6) % 12;  // Tritone from V, not I
        candidates.push({
            root: tritone,
            notes: buildChord(tritone, 'dom7', keyOffset),
            chordType: 'dom7',
            chordName: getChordName(tritone, 'dom7', keyOffset, 'SubV7'),
            romanNumeral: 'SubV7',
            quality: 'Dominant 7',
            category: 'substitution',
            commonUsage: 0.5
        });
    }

    if (variantType === 'Modal') {
        // Lydian II
        const lydianTwo = (scaleDegrees[0] + 2) % 12;
        candidates.push({
            root: lydianTwo,
            notes: buildChord(lydianTwo, 'major', keyOffset),
            chordType: 'major',
            chordName: getChordName(lydianTwo, 'major', keyOffset),
            romanNumeral: 'II',
            quality: 'Major',
            category: 'modal',
            commonUsage: 0.3
        });
    }

    return candidates;
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
        const interval = Math.abs((candidate.root - root + 12) % 12);
        return interval === 1 || interval === 5 || interval === 7; // semitone, fourth, or fifth
    });
    if (leadsWell) score += 1;

    // 3. Common in modern music (0 or 1)
    if (candidate.commonUsage > 0.6) score += 1;

    // 4. Adds harmonic variety (0 or 1)
    if (!analysis.hasBorrowed && candidate.category === 'borrowed') score += 1;
    if (!analysis.hasSecondary && candidate.category === 'secondary') score += 1;
    if (!analysis.hasDominant7 && candidate.category === 'dominant') score += 1;

    return score;
}

export function selectDynamicRow4Chords(existingChords, keyOffset, scaleDegrees, variantType) {
    const analysis = analyzeExistingChords(existingChords);
    const allCandidates = generateRow4Candidates(keyOffset, scaleDegrees, analysis, variantType);
    const existingRoots = existingChords.map(c => c.notes && c.notes[0] ? c.notes[0] % 12 : 0);

    // Rows 1-3 are already on the grid; a candidate that repeats one of them
    // wastes a pad. Fall back to the full list only if filtering leaves too few.
    const usedRomanNumerals = new Set(existingChords.map(c => c.romanNumeral));
    const fresh = allCandidates.filter(c => !usedRomanNumerals.has(c.romanNumeral));
    const candidates = fresh.length >= 4 ? fresh : allCandidates;

    // Score and sort candidates
    const scoredCandidates = candidates.map(candidate => ({
        ...candidate,
        score: scoreCandidate(candidate, analysis, existingRoots)
    }));

    // Sort by score (descending) and then by common usage as tiebreaker
    scoredCandidates.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.commonUsage - a.commonUsage;
    });

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
export function generateScaleExploration({ key, mode, chordRequirements = [] }) {
    const keyOffset = getKeyOffset(key);
    const scaleDegrees = getScaleDegrees(mode);
    const scaleLength = scaleDegrees.length;
    const pads = [];

    const used = new Set();

    const addPad = (degree, chordType) => {
        const scaleDegree = scaleDegrees[degree % scaleLength];
        const romanNumeral = getRomanNumeralForChord(degree, chordType);
        used.add(romanNumeral);
        pads.push({
            id: pads.length + 1,
            chordName: getChordName(scaleDegree, chordType, keyOffset),
            romanNumeral,
            notes: buildChord(scaleDegree, chordType, keyOffset),
            chordType,
            quality: getQualityLabel(chordType),
            row: Math.floor(pads.length / 4) + 1,
            col: (pads.length % 4) + 1,
            isProgressionChord: false,
            isChordMatcherChord: matchesChordRequirement(scaleDegree, chordType, keyOffset, chordRequirements)
        });
    };

    // Scales with fewer than 8 degrees leave gaps in each half of the grid.
    // Fill them with further colours the scale supports rather than repeating
    // the tonic, which wasted two of the sixteen pads on every 7-note scale.
    const harmonyPitchClasses = getHarmonyPitchClasses(mode);
    const fillGaps = (limit, extras, fallbackType) => {
        const candidates = extras.filter(type =>
            chordFitsScale(((scaleDegrees[0] % 12) + 12) % 12, type, harmonyPitchClasses) &&
            !used.has(getRomanNumeralForChord(0, type))
        );
        while (pads.length < limit) {
            addPad(0, candidates.shift() || fallbackType);
        }
    };

    // Suspended colours first in the triad half, extensions first in the
    // seventh half; each list then falls through to the other's so short
    // scales still get distinct chords rather than a repeated tonic.
    const SUSPENDED_COLOURS = ['sus4', 'sus2', 'quartal'];
    const EXTENDED_COLOURS = ['major6', 'minor6', 'dom7sus4', 'add9', 'minAdd9', 'major9', 'minor9', 'dom9', 'quartal4'];

    // Triads, one per scale degree (pads 1-8)
    for (let i = 0; i < scaleLength && pads.length < 8; i++) {
        addPad(i, getScaleTriad(i, mode));
    }
    fillGaps(8, [...SUSPENDED_COLOURS, ...EXTENDED_COLOURS], getScaleTriad(0, mode));

    // Seventh chords, one per scale degree (pads 9-16)
    for (let i = 0; i < scaleLength && pads.length < 16; i++) {
        addPad(i, getScaleSeventh(i, mode));
    }
    fillGaps(16, [...EXTENDED_COLOURS, ...SUSPENDED_COLOURS], getScaleSeventh(0, mode));

    return {
        name: mode,
        titleKey: 'scaleExploration',
        pads: pads
    };
}

export function generateVariant(variantType, { key, mode, progression, chordRequirements = [] }) {
    const keyOffset = getKeyOffset(key);
    // Progression Palette Mode reads every roman numeral against the parallel
    // major scale (see generateProgressionChords), and the Mode/Scale selector
    // is disabled here. Build the palette on the same reference so a mode left
    // over from Scale Mode cannot silently transpose the palette away from the
    // progression it is supposed to extend.
    const scaleDegrees = getScaleDegrees('Major');
    const pads = [];

    let progressionChords = generateProgressionChords(progression, keyOffset, scaleDegrees, mode);

    // Store the ORIGINAL progression chords before building palette
    const originalProgression = [...progressionChords];
    const originalProgressionLength = progressionChords.length;

    // Look up the full progression template object to get palette preferences
    let paletteFilter = null;
    let palettePriorities = null;
    for (const category in progressions) {
        const template = progressions[category].find(p => p.value === progression);
        if (template) {
            if (template.paletteFilter) {
                paletteFilter = template.paletteFilter;
            }
            if (template.palettePriorities) {
                palettePriorities = template.palettePriorities;
            }
            break;
        }
    }

    // Helper to get chord priority (1=avoided, 2=allowed, 3=preferred)
    const getChordPriority = (chordType) => {
        if (!palettePriorities) return 2; // Default: allowed

        if (palettePriorities.preferred && palettePriorities.preferred.includes(chordType)) {
            return 3; // Preferred - highest priority
        }
        if (palettePriorities.avoided && palettePriorities.avoided.includes(chordType)) {
            return 1; // Avoided - lowest priority
        }
        // Default to allowed (or explicitly in allowed list)
        return 2;
    };

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

    // Set false by the top-up pass below when the filter has starved the palette
    let filterActive = true;

    // Helper to add unique chord
    const addChord = (degree, type, romanBase, suffix, spice, isChordMatcher = false, rootOverride = null) => {
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
        if (usedRomanNumerals.has(roman)) return; // Skip duplicates
        usedRomanNumerals.add(roman);

        const scaleDegree = rootOverride === null ? scaleDegrees[degree % scaleDegrees.length] : rootOverride;
        const priority = getChordPriority(type);

        palette.push({
            degree,
            root: scaleDegree,
            notes: buildChord(scaleDegree, type, keyOffset),
            chordType: type,
            chordName: getChordName(scaleDegree, type, keyOffset, romanBase),
            romanNumeral: roman,
            spiceLevel: spice, // 0=foundation, 1=standard, 2=colorful, 3=spicy
            priority: priority, // 1=avoided, 2=allowed, 3=preferred
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
        const declaredTypes = [
            ...(palettePriorities?.preferred || []),
            ...(palettePriorities?.allowed || [])
        ];
        declaredTypes.forEach(type => {
            const family = getChordFamily(type);
            if (family !== baseFamily && family !== 'suspended') return;
            addChord(degree, type, romanBase, getRomanSuffix(type), getChordComplexity(type), false, rootPc);
        });
    });

    // Add complementary chords (foundation and spicy)
    // ii7 - foundation (if not already present)
    if (scaleDegrees.length > 1) {
        addChord(1, 'minor7', 'ii', '7', 0);
        addChord(1, 'minor', 'ii', '', 1);
    }

    // vi - foundation/standard
    if (scaleDegrees.length > 5) {
        addChord(5, 'minor', 'vi', '', 1);
        addChord(5, 'minor7', 'vi', '7', 1);
    }

    // Add borrowed/modal interchange chords only if they are NOT already
    // diatonic to the current mode. In minor keys, ♭VII, ♭VI, ♭III are
    // native - labeling them "borrowed" is incorrect.
    // Routed through addChord so they take part in the same de-duplication and
    // priority handling as everything else: pushing them straight onto the
    // palette meant a progression containing ♭VII got a second ♭VII pad, and
    // left them without a priority so the palette sort compared against
    // undefined.
    const diatonicPitchClasses = new Set(scaleDegrees.map(d => ((d % 12) + 12) % 12));

    // [semitones above tonic, degree, roman numeral, chord type, spice]
    const borrowedChords = [
        [10, 6, '♭VII', 'major', 2],  // colorful (Mixolydian/blues flavor)
        [8, 5, '♭VI', 'major', 3],    // borrowed from parallel minor
        [3, 2, '♭III', 'major', 3]    // borrowed from parallel minor
    ];
    borrowedChords.forEach(([semitones, degree, roman, type, spice]) => {
        if (diatonicPitchClasses.has(semitones)) return;
        addChord(degree, type, roman, '', spice, false, (scaleDegrees[0] + semitones) % 12);
    });

    // iv - borrowed from parallel minor - skip if IV is already minor in mode
    const fourthQuality = scaleDegrees.length > 3 ? getChordQualityForMode(3, 'Major') : null;
    if (scaleDegrees.length > 3 && fourthQuality !== 'minor') {
        addChord(3, 'minor', 'iv', '', 2);
    }

    // A narrow paletteFilter can leave fewer chords than the grid needs. The MPC
    // layout is always 4x4, and a short grid exports a .progression file with
    // fewer than 16 chords, so top up with diatonic chords ignoring the filter.
    // These land last: they are all priority 2 or lower and spicier than the
    // filtered chords that earned their place.
    const PADS_BEFORE_DYNAMIC_ROW = 12;
    if (originalProgressionLength + palette.length < PADS_BEFORE_DYNAMIC_ROW) {
        filterActive = false;
        const topUp = [
            [0, 'major'], [0, 'major7'], [1, 'minor'], [1, 'minor7'],
            [2, 'minor'], [2, 'minor7'], [3, 'major'], [3, 'major7'],
            [4, 'major'], [4, 'dom7'], [5, 'minor'], [5, 'minor7']
        ];
        for (const [degree, type] of topUp) {
            if (originalProgressionLength + palette.length >= PADS_BEFORE_DYNAMIC_ROW) break;
            if (degree >= scaleDegrees.length) continue;
            const romanBase = getRomanNumeralForChord(degree, type === 'major7' ? 'major' : type === 'minor7' ? 'minor' : type);
            addChord(degree, type, romanBase, getRomanSuffix(type), 3);
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
            if (variantType === 'Jazz' && padIndex >= 4 && !chordType.includes('7') && !chordType.includes('m7b5')) {
                // Add 7ths to chords in Jazz variant: triads become 7th chords.
                // Build on the root the chord was actually made from - indexing
                // back into scaleDegrees turned a ♭VII pad into a maj7 on the
                // natural VII while it kept its flat label.
                const scaleDegree = paletteChord.root ?? scaleDegrees[paletteChord.degree % scaleDegrees.length];
                const upgraded = chordType === 'minor' ? 'minor7' :
                           chordType === 'major' ? 'major7' :
                           chordType === 'diminished' ? 'm7b5' :
                           chordType === 'augmented' ? 'aug7' : chordType;
                // The numeral has to follow the chord, and the upgrade must not
                // recreate a chord the palette already carries. Insert the
                // suffix before the slash on a secondary-dominant numeral
                // ('V/ii' -> 'V7/ii'): appending it at the end produced
                // 'V/iiM7', a different string from the 'VM7/ii' the same
                // upgrade produces elsewhere for the identical chord.
                const suffix = getRomanSuffix(upgraded);
                const upgradedRoman = romanNumeral.includes('/')
                    ? romanNumeral.replace('/', suffix + '/')
                    : romanNumeral + suffix;
                if (!usedRomanNumerals.has(upgradedRoman)) {
                    usedRomanNumerals.delete(romanNumeral);
                    usedRomanNumerals.add(upgradedRoman);
                    chordType = upgraded;
                    romanNumeral = upgradedRoman;
                    notes = buildChord(scaleDegree, chordType, keyOffset);
                    chordName = getChordName(scaleDegree, chordType, keyOffset);
                }
            }

            const pad = {
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
            };

            pads.push(pad);
            rows1to3.push(pad);
        });
    }

    // Dynamically generate row 4 based on analysis of rows 1-3
    const row4Chords = selectDynamicRow4Chords(rows1to3, keyOffset, scaleDegrees, variantType);

    // Add Row 4 chords to pads
    for (let i = 0; i < 4; i++) {
        if (i < row4Chords.length) {
            const chord = row4Chords[i];
            pads.push({
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
            });
        } else {
            // Fallback if not enough candidates (shouldn't happen)
            const degree = scaleDegrees[0];
            const notes = buildChord(degree, 'major', keyOffset);
            pads.push({
                id: 13 + i,
                chordName: getChordName(degree, 'major', keyOffset),
                romanNumeral: 'I',
                notes: notes,
                chordType: 'major',
                quality: 'Major',
                row: 4,
                col: i + 1,
                isProgressionChord: false,
                isChordMatcherChord: false
            });
        }
    }

    return {
        name: variantType,
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

// The five voicing treatments a Progression Palette Mode template is rendered
// through. A nominal set, not an ordinal one - see docs/mpc-export-specification.md
// D5 for why these carry no rank number in the exported name.
export const VARIANT_STYLES = ['Smooth', 'Classic', 'Jazz', 'Modal', 'Experimental'];

// Single entry point used by the running app, tools/build-pack.mjs and
// tools/audit-theory.mjs alike, so all three generate identical output for
// identical input.
export function generateVariants({ key, mode, progression, generationMode, chordRequirements = [] }) {
    if (generationMode === 'template') {
        const allVariants = VARIANT_STYLES.map(style =>
            generateVariant(style, { key, mode, progression, chordRequirements })
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
