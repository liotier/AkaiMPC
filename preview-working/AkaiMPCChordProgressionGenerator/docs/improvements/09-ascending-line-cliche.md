# 09 - The ascending line cliché: a minor ♯5 chord type

| | |
|---|---|
| Status | proposed |
| Type | feature |
| Size | S |
| Depends on | 00, 06 |
| Recommended model | Claude Sonnet 5.5 (`claude-sonnet-5-5`): one chord type added to three tables, one template, one locale entry, with the audit and the parser tests already defining correctness |

## 1. Problem

The catalogue has the descending minor line cliché, Jazz/Functional
`i—i(maj7)—i7—i6` ("Line Cliché"): a static minor chord whose seventh walks
down. It does not have the ascending one, where the *fifth* walks up by
semitones: Em, Em with C instead of B, Em6, back. That is the harmonisation
of the spy-theme riff and, according to the review video, one of the most
copied devices in heroic scoring
([Hooktheory](https://hooktheory.com/theorytab/view/monty-norman/james-bond-theme),
[Rick Beato on the chromatic line motion](https://rosetta.to/u/rickbeato/the-music-of-james-bond-chromatic-line-motion),
[jazzguitar.be](https://www.jazzguitar.be/blog/james-bond-theme/)).

Two things block it. The chord with the raised fifth, a minor triad with
its fifth sharpened to `[0, 3, 8]`, written `m♯5` (also `m(♭6)` without the
fifth), has no entry in `CHORD_INTERVALS`. And the parser, before spec 06,
reads no `♯5` suffix; after spec 06 it reads suffixes from
`CHORD_TYPE_DISPLAY`, so adding the type is enough.

## 2. Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | New chord type key **`minAug`**, intervals `[0, 3, 8]`. | Minor third, augmented fifth: the name says what it is. `minSharp5` would be the alternative; `minAug` matches the `aug7` / `augMaj7` naming already in the table. |
| D2 | Roman suffix **`♯5`**, lower-case stem (`i♯5`); chord-name suffix **`m#5`** (ASCII, `Em#5`). | Roman numerals may use ♯ (U+266F); chord names in exports stay ASCII, as `CHORD_NAME_SUFFIX` documents. |
| D3 | The template is `i—i♯5—i6—i♯5`, Film/Cinematic, nickname **Ascending Line Cliché**. | Four pads for the four positions of the moving voice: 5, ♯5, 6, ♯5. The existing "Line Cliché" keeps its name. |
| D4 | The third chord uses the existing `minor6` `[0, 3, 7, 9]`, with its fifth. | A three-note `m6(no5)` would be a type defined by an omission; the Smooth voicer places the notes, and the pad still reads as `Em6`. Noted as a limitation in the description. |
| D5 | No guitar shape is added; `guitarChords.js` falls back along its `SHAPE_FALLBACKS` chain and must be given a hop `minAug -> minor`. | A `m♯5` shape is rarely wanted on a fretboard diagram; the fallback renders a playable approximation and marks it simplified. |

## 3. Normative specification

### 3.1 Tables, `modules/musicTheory.js`

```js
// CHORD_INTERVALS, after 'augmented':
minAug: [0, 3, 8],            // Minor ♯5: minor third, augmented fifth (ascending line cliché)

// CHORD_TYPE_DISPLAY:
minAug: { label: 'Minor ♯5', lowercase: true, suffix: '♯5' },

// CHORD_NAME_SUFFIX:
'minAug': 'm#5',
```

Verify the derived helpers without changing them:

- `getChordFamily('minAug')`: the pitch set `{0, 3, 8}` has 3 and not 7, so
  it returns `minor`. Correct: a palette built on it offers minor-family
  extensions.
- `getChordComplexity('minAug')`: three notes, returns 1.
- `tools/audit-theory.mjs`: `chordTypeQuality()` sees 3 without 6 and
  returns `minor`; `romanNumeralQuality('i♯5')` sees a lower-case stem and
  returns `minor`; check E agrees. `romanNumeralRootPc('i♯5')` reads the
  leading accidentals (none) and the stem `i`: degree 0. Checks D and E pass
  by construction.
- Scale Mode's `TRIAD_CANDIDATES` is **not** extended with `minAug`; a
  minor-♯5 triad is not a scale-degree triad.

### 3.2 Parser

After spec 06, `SUFFIX_TABLE` derives the lower-case `♯5` entry from
`CHORD_TYPE_DISPLAY` automatically. Add positive tests: `i♯5` parses to
`{ degree: 0, quality: 'minAug', alteration: '' }`; `♭vi♯5` to degree 5,
flat; `I♯5` throws (no upper-case `♯5` type).

### 3.3 Template

```js
{
    value: 'i—i♯5—i6—i♯5',
    palettePriorities: {
        preferred: ['minor', 'minAug', 'minor6'],
        allowed:   ['minor7', 'minMaj7', 'sus4'],
        avoided:   ['major', 'major7', 'dom7', 'diminished', 'quartal']
    },
},
```

Appended to `progressions['Film/Cinematic']` after spec 08's ten. All four
chords share degree 0, so the palette extends only the tonic, as the
existing descending cliché already does; rows 2-4 come from complements and
candidates.

The Jazz variant's seventh-upgrade leaves `minAug` alone (its map covers
`minor`, `major`, `diminished`, `augmented` only); confirm, do not extend.

### 3.4 Locale entry, English

> Em E G C E G C♯ and back, as chords: the fifth of a minor triad climbs by
> semitones over a held root and third, i, i♯5, i6, i♯5. The spy-theme
> harmonisation and a staple of heroic and suspense scoring. The i6 pad
> keeps the fifth alongside the sixth; for the pure single-voice line, play
> only the top note change from the i♯5 pad.

Nickname `Ascending Line Cliché`. Translate to the five other locales.

### 3.5 Other surfaces

- `modules/guitarChords.js`: `SHAPE_FALLBACKS.minAug = 'minor'`.
- The Chord Matcher's `MATCHER_QUALITY_TYPES` is **not** extended; `m♯5` is
  not a quality users identify in samples.
- The Finder's interval table (`../../AkaiMPCChordProgressionFinder/index.html`,
  the `'0,3,7': 'Minor'` map) gains `'0,3,8': 'Minor #5'` so a re-imported
  `.progression` is recognised. Optional; if done, the Finder's name-suffix
  map gets `'Minor #5': 'm#5'`.
- `README.md`: the chord-type lists do not enumerate every type; no change
  unless the implementer finds one that does.

## 4. Code changes

| File | Change |
|---|---|
| `modules/musicTheory.js:1568`, `:2537`, `:2670` | three table entries |
| `modules/musicTheory.js:638` | one template |
| `modules/guitarChords.js` | one fallback hop |
| `locales/*.json` | one entry, six files |
| `docs/catalogue-snapshot.txt` | regenerated, one new block |
| `CHANGELOG.md` | entry |
| Finder `index.html` | optional two map entries |

## 5. i18n

One entry × six locales.

## 6. Acceptance

1. Key E, Classic variant: pads 1-4 read `Em [i]`, `Em#5 [i♯5]`, `Em6 [i6]`,
   `Em#5 [i♯5]`; pad 2's notes are E G C in some octave arrangement.
   Progression chords may repeat (pads 2 and 4), as `I—IV—I—V` already does.
2. Key E, Smooth variant: the voice carrying B in pad 1 carries C in pad 2
   and C♯ in pad 3, with E and G held. Measured by reading the MIDI notes.
3. `node tools/audit-theory.mjs` passes with no new whitelist.
4. Parser tests of §3.2 pass.
5. Snapshot diff: exactly one new block.
6. Full verification protocol passes.

## 7. Out of scope

- A major-key ascending cliché (`I—I+—I6—I+`): parseable after spec 06 with
  existing types, so it is a data-only addition; not requested here because
  it is a pop and show-tune device rather than a cinematic one.
