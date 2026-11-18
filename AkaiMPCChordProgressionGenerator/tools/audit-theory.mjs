#!/usr/bin/env node
/**
 * Theory integrity audit for the Progression Palette Mode catalogue and Scale
 * Mode.
 *
 * Run with:  node tools/audit-theory.mjs
 * Exits non-zero on any finding.
 *
 * Nine theory defects shipped unnoticed in this catalogue - see
 * docs/mpc-export-specification.md §7 for the full account of each, how they
 * were found, and how they were fixed. They shipped for the same reason two
 * locale drifts shipped before check-translations.mjs existed: nothing
 * checked. This is that check for the theory layer.
 *
 * Method: run the real generation functions - the same ones the app and
 * tools/build-pack.mjs use - over every progression template, in every key,
 * in every style, and every scale in every key, and assert machine-checkable
 * invariants against every pad: 13,248 variants and 211,968 pads, plus 6,528
 * Scale Mode pads. The checks are lettered A to T; each one's comment says what
 * it guards and which spec in docs/improvements/ introduced it.
 */

import { readFileSync } from 'node:fs';
import { progressions, modes, keys, CHORD_INTERVALS, CHORD_DEGREES, CHORD_NAME_SUFFIX, CHORD_TYPE_DISPLAY, buildChordRaw, buildChord, getKeyOffset, getHarmonyPitchClasses, resolveTemplate, parseRomanStem, getRomanSuffix, pcSignature, parseProgression, templateTonality, templateSpelling, spellChord, chordRoleKey, chordPhraseKeys, TEMPLATE_SEPARATOR as CHORD_SEPARATOR } from '../modules/musicTheory.js';
import { generateVariant, generateScaleExploration, VARIANT_STYLES, ROW4_CATEGORIES, determineChordFunction, analyzeExistingChords, scoreCandidate } from '../modules/generation.js';

const NOTE_PITCH_CLASSES = { C: 0, 'B#': 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, 'E#': 5, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11, Cb: 11, Fb: 4 };
const DEGREE_SEMITONES = { I: 0, II: 2, III: 4, IV: 5, V: 7, VI: 9, VII: 11 };

// T: a Scale Mode numeral in C names its root's letter degree and accidental
const ROMAN_BY_LETTER = { C: 'I', D: 'II', E: 'III', F: 'IV', G: 'V', A: 'VI', B: 'VII' };
const ALTERATION_SIGN = { '': '', '#': '♯', 'b': '♭' };
const scaleNumeralCache = new Map();
const scaleNumeralsInC = mode => {
    if (!scaleNumeralCache.has(mode)) scaleNumeralCache.set(mode, generateScaleExploration({ key: 'C', mode }).pads.map(pad => pad.romanNumeral));
    return scaleNumeralCache.get(mode);
};
// R in Scale Mode: the keys that describe a chord by its type or family only
const TYPE_AND_FAMILY_ROLE = /^chordRoles\.(types\..+|sus|add9|6|extended)$/;

// R: what a pad's description resolves to. The English locale is the reference:
// check-translations.mjs keeps the other five in step with it.
const ENGLISH = JSON.parse(readFileSync(new URL('../locales/en.json', import.meta.url), 'utf8'));
const hasEnglishKey = key => key.split('.').reduce((node, part) =>
    (node && typeof node === 'object' && part in node) ? node[part] : undefined, ENGLISH) !== undefined;

// R: every pad, in both modes, can say what it is in plain words, "Major triad
// on the flattened seventh degree" (spec 17 D6)
function checkPhrase(pad, label) {
    const keys = chordPhraseKeys(pad);
    if (!keys) { report('R pad has no degree for its phrase', label); return; }
    if (!hasEnglishKey(keys.name)) report('R chord type has no name in en.json', `${label} -> ${keys.name}`);
    if (!hasEnglishKey(keys.degree)) report('R degree has no phrase in en.json', `${label} -> ${keys.degree}`);
}

// It+6 / Fr+6 / Ger+6 are not degree-based roman numerals - an augmented
// sixth is always rooted on the flat submediant by convention, unrelated to
// scale-degree arithmetic, and the '+' in its name is notation for the
// augmented-sixth interval, not an augmented triad. A checker that does not
// know this misreads both the root and the quality (§7.9) - teach it rather
// than whitelist the false positives it would otherwise report.
const AUGMENTED_SIXTH_STEMS = new Set(['It+6', 'Fr+6', 'Ger+6']);

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

        // H2: both conventions in one minor-key string is always a typo, with no
        // whitelist. Only minor tonality: in a major key a bare III or VI beside a
        // ♭ token is two chromatic mediants read against the parallel major, which
        // is what Film/Cinematic's Major and Minor Third Mediants are
        // (docs/improvements/08-cinematic-templates.md).
        if (templateTonality(template) === 'minor' && bare.length > 0 && tokens.some(token => token.startsWith('♭'))) {
            report('H2 minor template mixes numeral conventions', `${category} | ${template.value}`);
        }

        // H3: a template with no tonic token says which tonality it is in. Without
        // one it was read as major, which put Classical/Modal iv—♭VII—♭III—♭VI,
        // a minor progression, in C major (docs/improvements/07-minor-key-awareness.md §3.1).
        const hasTonicToken = template.value.split(CHORD_SEPARATOR).some(token => !token.includes('/') && /^([iI])(?![ivIV])/.test(token));
        if (!hasTonicToken && template.tonality === undefined) {
            report('H3 template without a tonic token declares no tonality', `${category} | ${template.value}`);
        }
    }
}

// J: a template's row-4 hint names categories row 4 has. A misspelt category
// would be ignored silently and the hint would do nothing
// (docs/improvements/10-row4-mediants.md §3.3). Static.
for (const [category, list] of Object.entries(progressions)) {
    for (const template of list) {
        if (template.row4 === undefined) continue;
        const hint = template.row4;
        const fields = hint && typeof hint === 'object' ? Object.keys(hint) : [];
        if (!hint || typeof hint !== 'object' || fields.some(field => field !== 'prefer' && field !== 'avoid')) {
            report('J row-4 hint is malformed', `${category} | ${template.value}: ${JSON.stringify(hint)}`);
            continue;
        }
        for (const field of fields) {
            if (!Array.isArray(hint[field])) { report('J row-4 hint is malformed', `${category} | ${template.value}: ${field} is not a list`); continue; }
            for (const name of hint[field]) {
                if (!ROW4_CATEGORIES.includes(name)) report('J row-4 hint names an unknown category', `${category} | ${template.value}: ${field} ${JSON.stringify(name)}`);
            }
        }
    }
}

// M: no two chord types share a suffix. Quartal chords were named 'sus4' and
// numbered 'sus4' like the real sus4 chord, so Csus4 told a player to play G where
// the pad sounds B♭, and the palette, which drops a chord whose numeral is taken,
// lost the quartal pad from any template that declared both
// (docs/improvements/05-duplicate-sounding-pads.md). Two types may not share a chord
// name suffix, nor a numeral suffix in the same case. The augmented sixths are
// exempt: their names deliberately match the dominant-family chord they sound like,
// and their numerals are fixed strings never built from the table. Static.
{
    const exemptFromM = new Set(['It6', 'Ger6', 'Fr6']);
    const byName = Object.entries(CHORD_NAME_SUFFIX).filter(([type]) => !exemptFromM.has(type));
    for (let a = 0; a < byName.length; a++) {
        for (let b = a + 1; b < byName.length; b++) {
            if (byName[a][1] === byName[b][1]) report('M two chord types share a name suffix', `${byName[a][0]} and ${byName[b][0]}: ${JSON.stringify(byName[a][1])}`);
        }
    }
    const byNumeral = Object.entries(CHORD_TYPE_DISPLAY).filter(([type]) => !exemptFromM.has(type));
    for (let a = 0; a < byNumeral.length; a++) {
        for (let b = a + 1; b < byNumeral.length; b++) {
            const [typeA, displayA] = byNumeral[a], [typeB, displayB] = byNumeral[b];
            if (displayA.suffix === displayB.suffix && Boolean(displayA.lowercase) === Boolean(displayB.lowercase)) {
                report('M two chord types share a numeral suffix', `${typeA} and ${typeB}: ${JSON.stringify(displayA.suffix)}${displayA.lowercase ? ' (lower case)' : ''}`);
            }
        }
    }
}

// P: the template parser. The parser it replaced stripped the characters it
// knew and looked up what was left, so an unknown token silently became the
// tonic: 'II6' played C major (docs/improvements/06-template-parser.md). Every
// catalogue template is parsed by the generation below, so a typo there already
// fails this run; these tables pin what the grammar accepts and refuses.
const PARSE_TABLE = [
    // [token, degree, chord type, alteration]
    ['I', 0, 'major', ''], ['vi', 5, 'minor', ''], ['♭VII', 6, 'major', 'flat'], ['♭vi', 5, 'minor', 'flat'],
    ['IM7', 0, 'major7', ''], ['ii7', 1, 'minor7', ''], ['V7', 4, 'dom7', ''], ['♯IV7', 3, 'dom7', 'sharp'],
    ['vii°', 6, 'diminished', ''], ['i(maj7)', 0, 'minMaj7', ''], ['i6', 0, 'minor6', ''],
    // Suffixes that fix the third themselves read after either case; the
    // catalogue writes its passing diminished chords on upper-case stems
    ['I°', 0, 'diminished', ''], ['♯II°', 1, 'diminished', 'sharp'], ['isus4', 0, 'sus4', ''],
    // Shapes the old parser could not read at all
    ['I+', 0, 'augmented', ''], ['I6', 0, 'major6', ''], ['II6', 1, 'major6', ''], ['Isus4', 0, 'sus4', ''],
    ['V7sus4', 4, 'dom7sus4', ''], ['viiø7', 6, 'm7b5', ''], ['vii°7', 6, 'dim7', ''],
    ['I7sus4(no5)', 0, 'quartal', ''], ['ii7(11)', 1, 'quartal4', ''],
    // The minor chord with a raised fifth, for the ascending line cliché
    // (docs/improvements/09-ascending-line-cliche.md)
    ['i♯5', 0, 'minAug', ''], ['♭vi♯5', 5, 'minAug', 'flat'],
    // Applied dominants: the root a fifth above the target, spelled after the
    // target's accidental, raised for a natural target the scale cannot reach
    ['V7/ii', 5, 'dom7', ''], ['V/V', 1, 'major', ''], ['V7/♭III', 6, 'dom7', 'flat'], ['V/vii', 3, 'major', 'sharp']
];
for (const [token, degree, quality, alteration] of PARSE_TABLE) {
    let parsed;
    try {
        [parsed] = parseProgression(token);
    } catch (error) {
        report('P template parser disagrees with its table', `${token}: threw "${error.message}"`);
        continue;
    }
    if (parsed.degree !== degree || parsed.quality !== quality || parsed.alteration !== alteration) {
        report('P template parser disagrees with its table', `${token}: degree ${parsed.degree} ${parsed.quality} '${parsed.alteration}', expected degree ${degree} ${quality} '${alteration}'`);
    }
}
const sequence = parseProgression('I—II—iii—II').map(chord => `${chord.degree}:${chord.quality}`).join(' ');
if (sequence !== '0:major 1:major 2:minor 1:major') report('P template parser disagrees with its table', `I—II—iii—II: ${sequence}`);

const MUST_REFUSE = [
    'I—X',      // not a numeral
    'iM7',      // a lower-case stem says minor, M7 a major seventh
    'I(maj7)',  // and the other way round
    'Iv',       // mixed case is no numeral
    'I—',       // empty token from a trailing separator
    'I— V',     // whitespace
    '♭♭II',     // one accidental at most
    'V7/x',     // an applied chord needs a numeral target
    'vii°/V',   // secondary leading-tone chords: reserved, not supported yet
    'I♯5'       // the minor ♯5 chord is a lower-case numeral only
];
for (const template of MUST_REFUSE) {
    try {
        parseProgression(template);
        report('P template parser accepts a malformed template', template);
    } catch (error) {
        if (!/^Unparseable chord token ".*" in template /.test(error.message)) {
            report('P template parser refuses without naming the token', `${template}: ${error.message}`);
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

// S: spelling (docs/improvements/13-spelling.md). Every note was once spelled by
// its pitch class, so a black-key root was a flat whatever the key - A major's vi
// read Gbm - and every chord was spelled as a stack of thirds, so Csus4 read
// C E# G. Nothing compared a spelling with a key, nor a tone's letter with its
// degree. The tables below are written out by hand, not computed, so that the
// checks cannot share a bug with the code under test.

// S1: CHORD_DEGREES has a row for every chord type, as long as its interval list,
// and every degree's semitones equal its interval. A 9th to a 13th is the 2nd to
// the 6th an octave up.
const DEGREE_SEMITONES_S1 = { 1: 0, b2: 1, 2: 2, '#2': 3, b3: 3, 3: 4, 4: 5, '#4': 6, b5: 6, 5: 7, '#5': 8, b6: 8, 6: 9, bb7: 9, '#6': 10, b7: 10, 7: 11 };
function degreeSemitones(degree) {
    const match = /^(bb|b|#)?(\d+)$/.exec(degree);
    if (!match) return undefined;
    const number = Number(match[2]);
    if (number >= 9 && number <= 13) {
        const simple = DEGREE_SEMITONES_S1[(match[1] || '') + (number - 7)];
        return simple === undefined ? undefined : simple + 12;
    }
    return DEGREE_SEMITONES_S1[degree];
}
const degreeNumber = degree => Number(/\d+$/.exec(degree)[0]);
for (const [type, intervals] of Object.entries(CHORD_INTERVALS)) {
    const degrees = CHORD_DEGREES[type];
    if (!degrees) { report('S1 chord type has no CHORD_DEGREES row', type); continue; }
    if (degrees.length !== intervals.length) { report('S1 CHORD_DEGREES row length != interval count', `${type}: ${degrees.join(' ')} for ${intervals.join(',')}`); continue; }
    degrees.forEach((degree, i) => {
        if (degreeSemitones(degree) !== intervals[i]) report('S1 degree semitones != interval', `${type}: ${degree} is ${degreeSemitones(degree)}, interval ${intervals[i]}`);
    });
}
for (const type of Object.keys(CHORD_DEGREES)) {
    if (!CHORD_INTERVALS[type]) report('S1 CHORD_DEGREES row for an unknown chord type', type);
}

// The tonic and scale of every key in either tonality: spec 13 §3.2, verbatim.
// S2 asserts that a pad whose root is a note of the template's scale is spelled
// as this table spells it; S3 that a root outside it is never E#, B#, Cb or Fb.
const KEY_SCALES = `
C      | C D E F G A B        | C D Eb F G Ab Bb
C♯/D♭  | Db Eb F Gb Ab Bb C   | C# D# E F# G# A B
D      | D E F# G A B C#      | D E F G A Bb C
D♯/E♭  | Eb F G Ab Bb C D     | D# E# F# G# A# B C#
E      | E F# G# A B C# D#    | E F# G A B C D
F      | F G A Bb C D E       | F G Ab Bb C Db Eb
F♯/G♭  | F# G# A# B C# D# E#  | F# G# A B C# D E
G      | G A B C D E F#       | G A Bb C D Eb F
G♯/A♭  | Ab Bb C Db Eb F G    | G# A# B C# D# E F#
A      | A B C# D E F# G#     | A B C D E F G
A♯/B♭  | Bb C D Eb F G A      | Bb C Db Eb F Gb Ab
B      | B C# D# E F# G# A#   | B C# D E F# G A
`;
const SCALE_BY_KEY = new Map(KEY_SCALES.trim().split('\n').map(line => {
    const [key, major, minor] = line.split('|').map(field => field.trim());
    const byPitchClass = names => new Map(names.split(' ').map(name => [NOTE_PITCH_CLASSES[name], name]));
    return [key, { major: byPitchClass(major), minor: byPitchClass(minor) }];
}));

// A spelled note name with its octave, as generation writes them ('F#4', 'Bbb3'):
// letter index, accidental, and the MIDI note it sounds, MIDI 60 being C3. The
// octave follows the letter (spec 13 §3.1), so B#2 sounds 60.
const LETTERS = 'CDEFGAB';
const LETTER_PITCH_CLASSES = [0, 2, 4, 5, 7, 9, 11];
function parseSpelledNote(name) {
    const match = /^([A-G])(#*|b*)(-?\d+)?$/.exec(name);
    if (!match) return null;
    const letter = LETTERS.indexOf(match[1]);
    const accidental = match[2].length * (match[2].startsWith('b') ? -1 : 1);
    const midi = match[3] === undefined ? null : (Number(match[3]) + 2) * 12 + LETTER_PITCH_CLASSES[letter] + accidental;
    return { letter, accidental, midi, pitchClass: ((LETTER_PITCH_CLASSES[letter] + accidental) % 12 + 12) % 12 };
}
const AWKWARD_ROOTS = new Set(['E#', 'B#', 'Cb', 'Fb']);

// S3 on one pad: the spelled notes sound the pad's notes, in voicing order and in
// the octave the letter puts them; each letter is the root's plus its degree's
// offset; the root has one accidental at most, is not an E#, B#, Cb or Fb outside
// the key's scale, and is the root of the chord name. The bass coming first is
// what makes the inversion notation read the right note.
function checkSpelling(pad, label, keyScalePitchClasses) {
    const spelling = pad.spelling;
    if (!spelling || typeof spelling.root !== 'string' || !Array.isArray(spelling.notes)) { report('S3 pad has no spelling', label); return; }
    const root = parseSpelledNote(spelling.root);
    if (!root || root.midi !== null) { report('S3 spelled root is not a note name', `${label} root=${JSON.stringify(spelling.root)}`); return; }
    if (pad.chordName !== spelling.root + CHORD_NAME_SUFFIX[pad.chordType]) report('S3 chord name is not the spelled root and its suffix', `${label} root=${spelling.root}`);
    if (Math.abs(root.accidental) > 1) report('S3 root carries a double accidental', `${label} root=${spelling.root}`);
    if (AWKWARD_ROOTS.has(spelling.root) && !keyScalePitchClasses.has(root.pitchClass)) report('S3 root outside the key is E#, B#, Cb or Fb', `${label} root=${spelling.root}`);
    if (spelling.notes.length !== pad.notes.length) { report('S3 spelled note count != note count', `${label} ${spelling.notes.join(' ')}`); return; }
    if (pad.notes.some((note, i) => i > 0 && note <= pad.notes[i - 1])) report('S3 notes are not in ascending voicing order', `${label} ${pad.notes.join(',')}`);
    const degrees = CHORD_DEGREES[pad.chordType] || [];
    spelling.notes.forEach((name, i) => {
        const note = parseSpelledNote(name);
        if (!note || note.midi === null) { report('S3 spelled note is not a note name with an octave', `${label} ${JSON.stringify(name)}`); return; }
        if (note.midi !== pad.notes[i]) { report('S3 spelled note does not sound the pad note', `${label} ${name} for MIDI ${pad.notes[i]}`); return; }
        const degree = degrees.find(d => (root.pitchClass + degreeSemitones(d)) % 12 === note.pitchClass);
        if (!degree) { report('S3 spelled note is no degree of the chord', `${label} ${name}`); return; }
        if (note.letter !== (root.letter + degreeNumber(degree) - 1) % 7) report('S3 tone letter is not its degree above the root', `${label} ${name} as the ${degree} of ${spelling.root}`);
    });
}

// S4: the examples of spec 13, by name. Roots of §3.3, through the spelling
// functions for the contexts no catalogue template reaches and through
// generation for the rest; tones of §1 and §3.7.
{
    const rootOf = (key, tonality, romanNumeral) => spellChord(templateSpelling(key, tonality), { romanNumeral }, 'major', [60]).root;
    const ROOT_EXAMPLES = [
        ['A', 'major', 'vi', 'F#'], ['E', 'major', 'ii', 'F#'], ['E', 'major', 'vi', 'C#'], ['B', 'major', 'V', 'F#'],
        ['C♯/D♭', 'minor', 'i', 'C#'], ['C♯/D♭', 'minor', '♭VII', 'B'], ['C♯/D♭', 'minor', '♭VI', 'A'], ['C♯/D♭', 'minor', 'V', 'G#'],
        ['C♯/D♭', 'major', '♭VI', 'A'], ['C♯/D♭', 'major', '♭VII', 'B'], ['G♯/A♭', 'major', '♭VI', 'E'],
        ['F♯/G♭', 'major', 'vii°', 'E#'], ['D♯/E♭', 'minor', '♭VI', 'B'],
        ['C', 'major', 'V7/♭III', 'Bb'], ['C', 'major', 'Ger+6', 'Ab'], ['C', 'major', 'SubV7', 'Db']
    ];
    for (const [key, tonality, numeral, expected] of ROOT_EXAMPLES) {
        const got = rootOf(key, tonality, numeral);
        if (got !== expected) report('S4 spelling example', `${key} ${tonality} ${numeral}: ${got}, expected ${expected}`);
    }
    const lydianFourth = generateScaleExploration({ key: 'C', mode: 'Lydian' }).pads[3];
    if (lydianFourth.chordName !== 'F#dim') report('S4 spelling example', `C Lydian pad 4: ${lydianFourth.chordName}, expected F#dim`);

    // §1: the progression pads of the Classic variant
    const PROGRESSION_EXAMPLES = [
        ['A', 'Pop/Rock', 'I—V—vi—IV', 'A E F#m D'], ['E', 'Pop/Rock', 'I—V—vi—IV', 'E B C#m A'],
        ['B', 'Pop/Rock', 'I—V—vi—IV', 'B F# G#m E'], ['D', 'Pop/Rock', 'I—V—vi—iii—IV', 'D A Bm F#m G']
    ];
    for (const [key, category, progression, expected] of PROGRESSION_EXAMPLES) {
        const got = generateVariant('Classic', { key, mode: 'Major', progression, category, chordRequirements: [] })
            .pads.filter(pad => pad.isProgressionChord).map(pad => pad.chordName).join(' ');
        if (got !== expected) report('S4 spelling example', `${key} ${progression}: ${got}, expected ${expected}`);
    }

    // Tones, without octaves: [key, tonality, numeral, chord type, root offset in semitones, expected]
    const TONE_EXAMPLES = [
        ['C', 'major', 'I', 'sus4', 0, 'C F G'], ['C', 'major', 'I', 'sus2', 0, 'C D G'], ['C', 'major', 'I', 'dom7sus4', 0, 'C F G Bb'],
        ['C', 'major', 'I', 'major6', 0, 'C E G A'], ['C', 'major', 'i', 'minor6', 0, 'C Eb G A'], ['C', 'major', 'I', 'maj6/9', 0, 'C E G A D'],
        ['C', 'major', 'I', 'quartal', 0, 'C F Bb'], ['C', 'major', 'i', 'quartal4', 0, 'C F Bb Eb'],
        ['C', 'major', 'i', 'dim7', 0, 'C Eb Gb Bbb'], ['C', 'major', 'I', 'dom7sharp9', 0, 'C E G Bb D#'], ['C', 'major', 'I', 'dom7b5', 0, 'C E Gb Bb'],
        ['C', 'major', 'I', 'augmented', 0, 'C E G#'],
        ['C', 'major', 'Fr+6', 'Fr6', 8, 'Ab C D F#'], ['C', 'major', 'Ger+6', 'Ger6', 8, 'Ab C Eb F#'],
        ['E', 'minor', 'i♯5', 'minAug', 0, 'E G B#']
    ];
    for (const [key, tonality, numeral, type, offset, expected] of TONE_EXAMPLES) {
        const notes = buildChord(offset, type, getKeyOffset(key));
        const got = spellChord(templateSpelling(key, tonality), { romanNumeral: numeral }, type, notes).notes.map(name => name.replace(/-?\d+$/, '')).join(' ');
        if (got !== expected) report('S4 spelling example', `${type} on ${numeral} in ${key} ${tonality}: ${got}, expected ${expected}`);
    }
}

// Natural minor, harmonic minor and Dorian together, above the tonic (check I)
const MINOR_KEY_PITCH_CLASSES = new Set([0, 2, 3, 5, 7, 8, 9, 10, 11]);

for (const key of keys) {
    const keyPc = getKeyOffset(key);
    for (const [category, list] of Object.entries(progressions)) {
        for (const template of list) {
            const templateScale = SCALE_BY_KEY.get(key)[templateTonality(template)];
            const templateScalePitchClasses = new Set(templateScale.keys());
            for (const style of VARIANT_STYLES) {
                const variant = generateVariant(style, { key, mode: 'Major', progression: template.value, category, chordRequirements: [] });
                variantCount++;
                const where = `${key} ${template.value} ${style}`;

                // A: structure
                if (variant.pads.length !== 16) report('A structural: pad count != 16', `${where} -> ${variant.pads.length}`);

                // I: a minor template's palette offers the key's chords. The palette
                // used to offer the major key's ii and vi, B minor and F♯ minor in A
                // minor, to every minor template (docs/improvements/07-minor-key-awareness.md
                // §3.6). Rows 2 and 3 stay within natural minor, harmonic minor and
                // Dorian together, pitch classes 0 2 3 5 7 8 9 10 11 above the tonic,
                // apart from the progression's own chords, Chord Matcher injections,
                // and the chords built on a progression chord's root: those are the
                // template's own chords in its genre's colours, and the ones that
                // leave the key are idiomatic minor-key chromaticism (♭VI7 resolving
                // to V like an augmented sixth, ♭III7 as V7/♭VI, ♭II7 as the tritone
                // substitute), as I7 and IV7 are in a major key. Row 4 is chromatic
                // by design and exempt.
                if (templateTonality(template) === 'minor') {
                    const rootPitchClass = pad => parseSpelledNote(pad.spelling.root).pitchClass;
                    const progressionRoots = new Set(variant.pads.filter(pad => pad.isProgressionChord).map(rootPitchClass));
                    variant.pads.slice(4, 12).forEach((pad, i) => {
                        if (pad.isProgressionChord || pad.isChordMatcherChord || progressionRoots.has(rootPitchClass(pad))) return;
                        const foreign = pad.notes.some(note => !MINOR_KEY_PITCH_CLASSES.has(((note - keyPc) % 12 + 12) % 12));
                        if (foreign) report('I minor palette offers a chord foreign to the key', `${where} pad${i + 5} ${pad.chordName} [${pad.romanNumeral}]`);
                    });
                }

                const seenRomanNumerals = new Map();
                const seenPitchClassSets = new Map();

                variant.pads.forEach((pad, i) => {
                    padCount++;
                    const label = `${where} pad${i + 1} ${pad.chordName} [${pad.romanNumeral}]`;

                    if (!pad.notes || pad.notes.length === 0) { report('A structural: empty notes', label); return; }
                    if (pad.notes.some(n => n < 0 || n > 127)) report('A structural: MIDI note out of range', `${label} ${pad.notes.join(',')}`);
                    if (!pad.chordName) { report('A structural: empty chord name', label); return; }
                    if (!CHORD_INTERVALS[pad.chordType]) { report('A structural: unknown chordType', `${label} type=${pad.chordType}`); return; }

                    // R: a pad describes what it is (docs/improvements/14-pad-descriptions-and-analysis.md).
                    // The generic "Borrowed chord" and "Harmonic color" texts once stood in
                    // for the line cliché's i♯5, the tritone substitute and the leading-tone
                    // chord of V. Descriptions do not depend on the key, so C is enough.
                    if (key === 'C') {
                        const roleKey = chordRoleKey(pad.romanNumeral, pad.chordType, templateTonality(template), hasEnglishKey);
                        if (roleKey === 'chordRoles.borrowed' || roleKey === 'chordRoles.default') report('R pad falls back to a generic description', `${label} -> ${roleKey}`);
                        else if (!hasEnglishKey(roleKey)) report('R pad description key missing from en.json', `${label} -> ${roleKey}`);
                        checkPhrase(pad, label);
                    }

                    const parsed = parseChordName(pad.chordName);
                    if (!parsed) { report('C unparseable chord name', label); return; }

                    // B: sounding chord contains every pitch class its type requires
                    const expected = pitchClasses(buildChordRaw(60 + parsed.rootPc, pad.chordType));
                    if (!setsEqual(pitchClasses(pad.notes), expected)) {
                        report('B sounding chord misses a required pitch class', `${label} ${pad.notes.join(',')}`);
                    }

                    // S2: a root that is a note of the template's scale is spelled as
                    // the table of §3.2 spells it. S3: see checkSpelling().
                    if ((style === 'Classic' || style === 'Jazz') && templateScale.has(parsed.rootPc) && pad.spelling?.root !== templateScale.get(parsed.rootPc)) {
                        report('S2 diatonic root not spelled as its key spells it', `${label} root=${pad.spelling?.root}, expected ${templateScale.get(parsed.rootPc)}`);
                    }
                    checkSpelling(pad, label, templateScalePitchClasses);

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

                    // F: two pads sounding the same chord. A pad spent twice on one
                    // sonority leaves a grid of fifteen, whatever the labels say, and
                    // a whitelist of "functional twins" is what let the count drift
                    // unnoticed (docs/improvements/05-duplicate-sounding-pads.md). Only
                    // two progression chords may share a sound: a template may repeat
                    // a chord on purpose.
                    const signature = pcSignature(pad.notes);
                    if (seenPitchClassSets.has(signature)) {
                        const j = seenPitchClassSets.get(signature);
                        const bothInProgression = pad.isProgressionChord && variant.pads[j].isProgressionChord;
                        if (!bothInProgression) {
                            report('F two pads sound the same chord', `${label} == pad${j + 1} ${variant.pads[j].chordName} [${variant.pads[j].romanNumeral}]`);
                        }
                    } else {
                        seenPitchClassSets.set(signature, i);
                    }

                    // K: the roman numeral carries exactly its chord type's suffix. The
                    // Jazz seventh-upgrade once appended the new suffix to a numeral that
                    // already had one: i99, Isus4sus4, vii°ø7. The chord underneath was
                    // right, which is why D and E cannot see it. The suffix is what sits
                    // between the stem and a slash; the augmented sixths and SubV7 are
                    // fixed strings, exempt as they are in D and E.
                    if (!AUGMENTED_SIXTH_STEMS.has(pad.romanNumeral) && pad.romanNumeral !== 'SubV7') {
                        const head = pad.romanNumeral.split('/')[0];
                        const parsedNumeral = parseRomanStem(head);
                        const suffix = parsedNumeral ? head.slice(parsedNumeral.accidentals.length + parsedNumeral.stem.length) : null;
                        if (suffix !== getRomanSuffix(pad.chordType)) {
                            report('K roman numeral suffix != chord type suffix', `${label} suffix=${JSON.stringify(suffix)} expected=${JSON.stringify(getRomanSuffix(pad.chordType))}`);
                        }
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

// S3 over Scale Mode: every scale in every key. The key's scale is the one its
// chords are built from, its parent's notes included for an abridged scale.
// Q: no two pads of a Scale Mode grid sound alike. Whole Tone's augmented triads
// on I, III and V are one chord, as are a diminished scale's dim7 on every other
// degree; the grid replaces such repeats rather than spending pads on them
// (docs/improvements/15-scale-mode-gap-filler.md).
let scalePadCount = 0;
for (const key of keys) {
    const keyPc = getKeyOffset(key);
    for (const list of Object.values(modes)) {
        for (const mode of list) {
            const keyScalePitchClasses = new Set([...getHarmonyPitchClasses(mode)].map(pc => (pc + keyPc) % 12));
            const soundsSeen = new Map();
            const exploration = generateScaleExploration({ key, mode });
            const numeralsInC = scaleNumeralsInC(mode);
            const rootsByStem = new Map();
            exploration.pads.forEach((pad, i) => {
                scalePadCount++;
                const label = `${key} ${mode} pad${i + 1} ${pad.chordName} [${pad.romanNumeral}]`;
                checkSpelling(pad, label, keyScalePitchClasses);
                // R in Scale Mode (docs/improvements/17-scale-mode-numerals-and-descriptions.md).
                // Only Major and Minor are keys and read the numeral texts; any other
                // scale reads its chord type's or family's. A numeral text once gave
                // natural minor's E♭ "a major chord a major third above the tonic".
                const roleKey = chordRoleKey(pad.romanNumeral, pad.chordType, exploration.tonality, hasEnglishKey);
                if (roleKey === 'chordRoles.borrowed' || roleKey === 'chordRoles.default') report('R Scale Mode pad falls back to a generic description', `${label} -> ${roleKey}`);
                else if (!exploration.tonality && !TYPE_AND_FAMILY_ROLE.test(roleKey)) report('R Scale Mode pad outside Major and Minor reads a numeral text', `${label} -> ${roleKey}`);
                else if (!hasEnglishKey(roleKey)) report('R pad description key missing from en.json', `${label} -> ${roleKey}`);
                if (key === 'C') checkPhrase(pad, label);
                // T: numerals follow the parallel-major convention, read from the scale
                // spelled in C: the same in every key, the root's own letter degree, and
                // never one numeral for two roots. Positional numerals once named
                // Pentatonic Major's G 'IV' and a diminished scale's eighth note 'I'.
                if (pad.romanNumeral !== numeralsInC[i]) report('T Scale Mode numeral differs from the same pad in C', `${label} vs ${numeralsInC[i]}`);
                const stem = /^([♭♯]*)([ivIV]+)/.exec(pad.romanNumeral);
                if (!stem) { report('T Scale Mode numeral has no stem', label); return; }
                if (key === 'C') {
                    const root = NOTE_PITCH_CLASSES[pad.spelling.root] !== undefined ? pad.spelling.root : null;
                    const expected = root && (ALTERATION_SIGN[root.slice(1)] ?? null) + ROMAN_BY_LETTER[root[0]];
                    if (expected !== stem[1] + stem[2].toUpperCase()) report('T Scale Mode numeral is not its root\'s degree in C', `${label} root=${pad.spelling.root}`);
                }
                const stemKey = stem[1] + stem[2].toUpperCase();
                if (rootsByStem.has(stemKey) && rootsByStem.get(stemKey) !== pad.spelling.root) report('T two roots share a numeral in one grid', `${label} and ${rootsByStem.get(stemKey)}`);
                rootsByStem.set(stemKey, pad.spelling.root);
                const sound = pcSignature(pad.notes);
                if (soundsSeen.has(sound)) report('Q Scale Mode pad sounds like another pad of its grid', `${label} = pad${soundsSeen.get(sound)}`);
                else soundsSeen.set(sound, i + 1);
            });
        }
    }
}

console.log(`Audited ${variantCount} variants / ${padCount} pads across ${keys.length} keys, and ${scalePadCount} Scale Mode pads.\n`);

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
