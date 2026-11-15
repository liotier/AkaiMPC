#!/usr/bin/env node
/**
 * Theory integrity audit for the Progression Palette Mode catalogue.
 *
 * Run with:  node tools/audit-theory.mjs
 * Exits non-zero on any finding outside the whitelist below.
 *
 * Nine theory defects shipped unnoticed in this catalogue - see
 * docs/mpc-export-specification.md §7 for the full account of each, how they
 * were found, and how they were fixed. They shipped for the same reason two
 * locale drifts shipped before check-translations.mjs existed: nothing
 * checked. This is that check for the theory layer.
 *
 * Method: run the real generation functions - the same ones the app and
 * tools/build-pack.mjs use - over every progression template, in every key,
 * in every style, and assert machine-checkable invariants against every pad.
 * ~10,000 variants, ~160,000 pads.
 */

import { progressions, keys, CHORD_INTERVALS, CHORD_NAME_SUFFIX, buildChordRaw, getKeyOffset, resolveTemplate, parseRomanStem } from '../modules/musicTheory.js';
import { generateVariant, VARIANT_STYLES, determineChordFunction, analyzeExistingChords, scoreCandidate } from '../modules/generation.js';
import { templateTonality, CHORD_SEPARATOR } from './lib/template-tonality.mjs';

const NOTE_PITCH_CLASSES = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, 'E#': 5, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11, Cb: 11, Fb: 4 };
const DEGREE_SEMITONES = { I: 0, II: 2, III: 4, IV: 5, V: 7, VI: 9, VII: 11 };

// It+6 / Fr+6 / Ger+6 are not degree-based roman numerals - an augmented
// sixth is always rooted on the flat submediant by convention, unrelated to
// scale-degree arithmetic, and the '+' in its name is notation for the
// augmented-sixth interval, not an augmented triad. A checker that does not
// know this misreads both the root and the quality (§7.9) - teach it rather
// than whitelist the false positives it would otherwise report.
const AUGMENTED_SIXTH_STEMS = new Set(['It+6', 'Fr+6', 'Ger+6']);

// Two pads holding the same notes under two different, both-correct,
// functional labels (§7.9) - not a defect, and not something a future
// catalogue change should silently add to. Keyed by the sorted pair of
// roman numerals so a new occurrence of a KNOWN pair passes, but a new KIND
// of duplicate still fails.
const KNOWN_FUNCTIONAL_TWINS = new Set([
    'Ger+6 + ♭VI7',       // A German sixth is a dominant 7th on the flat submediant
    'SubV7 + ♭II7',       // A tritone substitute for V7 is the dominant 7th on ♭II
    'I7 + V7/IV',         // I7 functions as the dominant of IV
    'II7 + V7/V',         // The major-II seventh chord is the dominant of V
    'V7/ii + VI7',        // Coincide on A7 in a major key: P5 above ii, and dom7 on VI
    'isus4 + ivsus2',      // Suspended chords are inversions of each other
    'IVsus2 + Isus4',
    'isus4sus4 + ivsus2sus2', // Same pair with a doubled extension applied by the palette
    'IVsus2sus2 + Isus4sus4',
    'V/ii + VI',           // A major triad on the submediant, reached two ways
    'II + V/V'
]);

function pitchClasses(notes) {
    return new Set(notes.map(n => ((n % 12) + 12) % 12));
}

function setsEqual(a, b) {
    return a.size === b.size && [...a].every(x => b.has(x));
}

const SUFFIX_TO_TYPE = Object.entries(CHORD_NAME_SUFFIX)
    .map(([type, suffix]) => [suffix, type])
    .sort((a, b) => b[0].length - a[0].length);

function parseChordName(name) {
    const m = name.match(/^([A-G][#b]?)(.*)$/);
    if (!m || NOTE_PITCH_CLASSES[m[1]] === undefined) return null;
    const hit = SUFFIX_TO_TYPE.find(([suffix]) => suffix === m[2]);
    return { rootPc: NOTE_PITCH_CLASSES[m[1]], suffix: m[2], type: hit ? hit[1] : null };
}

function romanNumeralRootPc(romanNumeral) {
    if (AUGMENTED_SIXTH_STEMS.has(romanNumeral)) return null; // exempt, see above
    if (romanNumeral.includes('/')) {
        const [numerator, denominator] = romanNumeral.split('/');
        const num = romanNumeralRootPc(numerator);
        const den = romanNumeralRootPc(denominator);
        return (num === null || den === null) ? null : (num + den) % 12;
    }
    const parsed = parseRomanStem(romanNumeral);
    if (!parsed || parsed.degree === null) return null;
    const base = DEGREE_SEMITONES[parsed.degree];
    let accidental = 0;
    for (const ch of parsed.accidentals) accidental += (ch === '♭' || ch === 'b') ? -1 : 1;
    return ((base + accidental) % 12 + 12) % 12;
}

function romanNumeralQuality(romanNumeral) {
    if (AUGMENTED_SIXTH_STEMS.has(romanNumeral)) return null; // exempt, see above
    const core = romanNumeral.split('/')[0];
    if (/ø/.test(core)) return 'halfdim';
    if (/°/.test(core)) return 'dim';
    if (/\+/.test(core)) return 'aug';
    const stem = core.match(/([ivIV]+)/);
    if (!stem) return null;
    return stem[1] === stem[1].toLowerCase() ? 'minor' : 'major';
}

function chordTypeQuality(chordType) {
    const intervals = CHORD_INTERVALS[chordType];
    if (!intervals) return null;
    const degrees = new Set(intervals.map(i => i % 12));
    if (degrees.has(3) && degrees.has(6) && degrees.has(10)) return 'halfdim';
    if (degrees.has(3) && degrees.has(6)) return 'dim';
    if (degrees.has(4) && degrees.has(8) && !degrees.has(7)) return 'aug';
    if (degrees.has(3)) return 'minor';
    if (degrees.has(4)) return 'major';
    return 'sus';
}

const findings = new Map(); // check id -> { count, examples: [] }
function report(checkId, example) {
    const entry = findings.get(checkId) || { count: 0, examples: [] };
    entry.count++;
    if (entry.examples.length < 5) entry.examples.push(example);
    findings.set(checkId, entry);
}

let variantCount = 0, padCount = 0;

// L: template identity. Every (category, value) pair must resolve to its own
// entry, by reference - not to the same value listed under an earlier genre,
// whose palette priorities and MPC heading would then be used instead
// (docs/improvements/01-template-identity.md). Static: no generation needed.
for (const [category, list] of Object.entries(progressions)) {
    for (const template of list) {
        const resolved = resolveTemplate(template.value, category);
        if (!resolved || resolved.template !== template || resolved.category !== category) {
            report('L template does not resolve to its own entry', `${category} | ${template.value} -> ${resolved ? resolved.category : 'nothing'}`);
        }
    }
}

// H: template numeral convention. The engine reads every roman numeral against
// the parallel major (generateProgressionChords()), so in a minor key the natural
// minor's mediant, submediant and subtonic are written ♭III, ♭VI, ♭VII, and a bare
// III, VI or VII is a major triad on the raised degree: G♯ major in A minor.
// Twelve templates were written in the scale-relative convention and played that
// way, and nothing noticed because a label and the chord it names agree whatever
// the nickname says (docs/improvements/02-minor-key-numerals.md). Static: no
// generation needed.
//
// A bare uppercase III, VI or VII is read from the stem, whatever suffix follows
// (VII, VII7, VIM7, VIsus4). A token containing '/' is an applied chord, whose
// numerator is not a degree of the key, and is skipped.
const RAISED_DEGREE_STEMS = new Set(['III', 'VI', 'VII']);

function templateTokens(template) {
    return template.value.split(CHORD_SEPARATOR).filter(token => !token.includes('/'));
}

function isBareRaisedDegree(token) {
    const parsed = parseRomanStem(token);
    return parsed !== null && parsed.accidentals === '' && RAISED_DEGREE_STEMS.has(parsed.stem);
}

for (const [category, list] of Object.entries(progressions)) {
    for (const template of list) {
        const tokens = templateTokens(template);
        const bare = tokens.filter(isBareRaisedDegree);
        const whitelisted = new Set(template.allowRaisedDegrees || []);

        // H1: a minor template may use a raised degree only if it says so, and why.
        if (templateTonality(template) === 'minor') {
            const unlisted = bare.filter(token => !whitelisted.has(parseRomanStem(token).stem));
            if (unlisted.length > 0) {
                report('H1 minor template uses a raised-degree numeral', `${category} | ${template.value} (${unlisted.join(', ')})`);
            }
        }

        // H2: both conventions in one string is always a typo, with no whitelist.
        if (bare.length > 0 && tokens.some(token => token.startsWith('♭'))) {
            report('H2 template mixes numeral conventions', `${category} | ${template.value}`);
        }
    }
}

// N: the row-4 classifier. determineChordFunction() once filed vi as a dominant and
// iii and ♭III as subdominants, because it asked whether a numeral's string
// contained 'V' or 'II'; the row-4 scorer then awarded its "fills a functional
// gap" point on the wrong premises (docs/improvements/03-row4-function-scoring.md).
// Static: a table of numerals and the function each must have, the textbook
// grouping of Open Music Theory ch. 3.2 and of the spec's §3.1. The contestable
// rows (♭VII as subdominant, an applied chord as chromatic) are decisions, not
// accidents; changing one is changing the spec.
const FUNCTION_TABLE = [
    ['I', 'tonic'], ['i', 'tonic'], ['IM7', 'tonic'], ['i7', 'tonic'], ['i(maj7)', 'tonic'], ['i6', 'tonic'],
    ['ii', 'subdominant'], ['ii7', 'subdominant'], ['II', 'subdominant'],
    ['iii', 'tonic'], ['iii7', 'tonic'],
    ['IV', 'subdominant'], ['iv', 'subdominant'], ['IVM7', 'subdominant'],
    ['V', 'dominant'], ['V7', 'dominant'], ['v', 'dominant'],
    ['vi', 'tonic'], ['vi7', 'tonic'], ['VI', 'chromatic'],
    ['vii°', 'dominant'], ['viiø7', 'dominant'], ['VII', 'chromatic'],
    ['♭II', 'subdominant'], ['♭III', 'chromatic'], ['♭VI', 'subdominant'], ['♭VI7', 'subdominant'], ['♭VII', 'subdominant'],
    ['♯iv°', 'chromatic'], ['♯I°', 'chromatic'],
    ['V7/ii', 'chromatic'], ['V/V', 'chromatic'], ['V7/♭III', 'chromatic'],
    ['It+6', 'subdominant'], ['Fr+6', 'subdominant'], ['Ger+6', 'subdominant'],
    ['SubV7', 'dominant']
];
for (const [numeral, expected] of FUNCTION_TABLE) {
    const got = determineChordFunction(numeral);
    if (got !== expected) report('N row-4 classifier disagrees with its table', `${numeral}: ${got}, expected ${expected}`);
}

// The 'hasSubdominant' flag is read from the classifier, so a chord whose numeral
// merely contains 'ii' (iii, vii°) is not a subdominant presence.
for (const [numerals, expected] of [[['I', 'iii', 'vii°'], false], [['I', 'IV'], true], [['I', 'ii7'], true], [['I', '♭VII'], true]]) {
    const got = analyzeExistingChords(numerals.map(romanNumeral => ({ romanNumeral, quality: '', notes: [60] }))).hasSubdominant;
    if (got !== expected) report('N row-4 classifier disagrees with its table', `hasSubdominant of ${numerals.join(' ')}: ${got}, expected ${expected}`);
}

// The voice-leading point is symmetric: a root a semitone above or below an
// existing root, a fourth or a fifth away, earns it; nothing else does. The
// candidate's own function is already present so no other point is awarded.
{
    const analysis = { functionsPresent: new Set(['tonic']), hasBorrowed: true, hasSecondary: true, hasDominant7: true };
    for (let root = 0; root < 12; root++) {
        const earned = scoreCandidate({ romanNumeral: 'I', root, commonUsage: 0, category: 'none' }, analysis, [0]);
        const expected = [1, 5, 7, 11].includes(root) ? 1 : 0;
        if (earned !== expected) report('N row-4 classifier disagrees with its table', `voice-leading point for a root ${root} semitones above an existing root: ${earned}, expected ${expected}`);
    }
}

for (const key of keys) {
    const keyPc = getKeyOffset(key);
    for (const [category, list] of Object.entries(progressions)) {
        for (const template of list) {
            for (const style of VARIANT_STYLES) {
                const variant = generateVariant(style, { key, mode: 'Major', progression: template.value, category, chordRequirements: [] });
                variantCount++;
                const where = `${key} ${template.value} ${style}`;

                // A: structure
                if (variant.pads.length !== 16) report('A structural: pad count != 16', `${where} -> ${variant.pads.length}`);

                const seenRomanNumerals = new Map();
                const seenPitchClassSets = new Map();

                variant.pads.forEach((pad, i) => {
                    padCount++;
                    const label = `${where} pad${i + 1} ${pad.chordName} [${pad.romanNumeral}]`;

                    if (!pad.notes || pad.notes.length === 0) { report('A structural: empty notes', label); return; }
                    if (pad.notes.some(n => n < 0 || n > 127)) report('A structural: MIDI note out of range', `${label} ${pad.notes.join(',')}`);
                    if (!pad.chordName) { report('A structural: empty chord name', label); return; }
                    if (!CHORD_INTERVALS[pad.chordType]) { report('A structural: unknown chordType', `${label} type=${pad.chordType}`); return; }

                    const parsed = parseChordName(pad.chordName);
                    if (!parsed) { report('C unparseable chord name', label); return; }

                    // B: sounding chord contains every pitch class its type requires
                    const expected = pitchClasses(buildChordRaw(60 + parsed.rootPc, pad.chordType));
                    if (!setsEqual(pitchClasses(pad.notes), expected)) {
                        report('B sounding chord misses a required pitch class', `${label} ${pad.notes.join(',')}`);
                    }

                    // C: chord name's suffix matches its chordType
                    if (parsed.type === null) report('C chord-name suffix not in CHORD_NAME_SUFFIX', `${label} suffix=${JSON.stringify(parsed.suffix)}`);
                    else if (CHORD_NAME_SUFFIX[pad.chordType] !== parsed.suffix) report('C chord name disagrees with chordType', `${label} type=${pad.chordType}`);

                    // D: roman numeral root matches chord root
                    const romanPc = romanNumeralRootPc(pad.romanNumeral);
                    if (romanPc !== null && (keyPc + romanPc) % 12 !== parsed.rootPc) {
                        report('D roman numeral root != chord root', label);
                    }

                    // E: roman numeral quality matches chord quality
                    const romanQ = romanNumeralQuality(pad.romanNumeral);
                    const chordQ = chordTypeQuality(pad.chordType);
                    if (romanQ && chordQ && romanQ !== chordQ && chordQ !== 'sus') {
                        report('E roman numeral quality != chord quality', `${label} numeral=${romanQ} chord=${chordQ}`);
                    }

                    // F: two pads sounding the same chord
                    const pcSignature = [...pitchClasses(pad.notes)].sort((a, b) => a - b).join(',');
                    if (seenPitchClassSets.has(pcSignature)) {
                        const j = seenPitchClassSets.get(pcSignature);
                        const bothInProgression = pad.isProgressionChord && variant.pads[j].isProgressionChord;
                        if (!bothInProgression) {
                            const kind = [variant.pads[j].romanNumeral, pad.romanNumeral].sort().join(' + ');
                            if (!KNOWN_FUNCTIONAL_TWINS.has(kind)) {
                                report('F two pads sound the same chord (new/unwhitelisted pair)', `${label} == pad${j + 1} ${variant.pads[j].chordName} [${variant.pads[j].romanNumeral}] (kind: ${kind})`);
                            }
                        }
                    } else {
                        seenPitchClassSets.set(pcSignature, i);
                    }

                    // G: duplicate roman numeral within one variant
                    if (seenRomanNumerals.has(pad.romanNumeral)) {
                        const j = seenRomanNumerals.get(pad.romanNumeral);
                        const bothInProgression = pad.isProgressionChord && variant.pads[j].isProgressionChord;
                        if (!bothInProgression) report('G duplicate roman numeral outside the progression', `${label} == pad${j + 1}`);
                    } else {
                        seenRomanNumerals.set(pad.romanNumeral, i);
                    }
                });
            }
        }
    }
}

console.log(`Audited ${variantCount} variants / ${padCount} pads across ${keys.length} keys.\n`);

if (findings.size === 0) {
    console.log('No findings.');
    process.exit(0);
}

for (const [checkId, { count, examples }] of [...findings].sort((a, b) => b[1].count - a[1].count)) {
    console.error(`${checkId}: ${count}`);
    examples.forEach(e => console.error(`    ${e}`));
}

console.error(`\n${findings.size} distinct problem(s) found.`);
process.exit(1);
