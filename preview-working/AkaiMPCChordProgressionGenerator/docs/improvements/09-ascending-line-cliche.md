# 09 - The ascending line cliché: a minor ♯5 chord type

| | |
|---|---|
| Status | implemented |
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
        allowed:   ['minor7', 'minMaj7', 'major', 'dom7', 'sus4'],
        avoided:   ['major7', 'diminished', 'quartal']
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
   and C♯ in pad 3, with G held. Measured by reading the MIDI notes. (Amended
   after implementation: E is held as a pitch class, not as a pitch; see §8.)
3. `node tools/audit-theory.mjs` passes with no new whitelist.
4. Parser tests of §3.2 pass.
5. Snapshot diff: exactly one new block.
6. Full verification protocol passes.

## 7. Out of scope

- A major-key ascending cliché (`I—I+—I6—I+`): parseable after spec 06 with
  existing types, so it is a data-only addition; not requested here because
  it is a pop and show-tune device rather than a cinematic one.

## 8. Implementation notes

Implemented as specified, on top of spec 06's parser (commit `687882d`), which is why
the parser itself did not change: `SUFFIX_TABLE` is derived from `CHORD_TYPE_DISPLAY`,
so adding `minAug` there made `i♯5` readable. What changed is `minAug` in the three
tables, the guitar fallback `minAug -> minor`, one template appended to
Film/Cinematic after spec 08's ten, and one entry in each of six locale files.

- **Parser tests live in audit check P.** The two positive rows of §3.2, `i♯5` and
  `♭vi♯5`, are in its table, `I♯5` is in its list of refusals, and the placeholder 06
  left, a refusal of `i♯5` that lapsed once the suffix existed, is gone with the
  import it needed. With `minAug` taken out of the display table the run stops at
  the template itself: "Unparseable chord token "i♯5"".
- **The Jazz upgrade leaves `minAug` alone.** In 12 keys and 5 styles there are 120
  `minAug` pads, and every one is still named `…m#5` and numbered `i♯5`.
- **The nickname is English in every locale**, accent included, as `Line Cliché` is.
  The English description reads "harmonization", as `en.json` spells everything.
- **The Finder was left alone.** §3.5's optional `'0,3,8': 'Minor #5'` would change
  nothing: the Finder rotates a chord to every candidate root and prefers a
  tertian reading (`isTertian`), and E G C is a first-inversion C major, which it
  rightly names `C/E`. `Em#5` and `C/E` are the same three notes; the minor ♯5 is
  a spelling for a function, not a different sound.
- **For the same reason a major ♭VI never sits beside the `m♯5` pad.** Spec 05's
  sound filter drops the palette's `♭VI` as a twin of it (in A, `F` against `Am#5`).

Measured against the parent commit (`508ef59`):

| Quantity | Before | After |
|---|---|---|
| Progression templates / Film/Cinematic templates | 183 / 17 | 184 / 18 |
| Variants audited, 12 keys and 5 styles | 10 980 | 11 040 |
| Snapshot blocks | 183 template, 34 scale | 184 template, 34 scale: one new, none changed |
| `.progression` files in the pack | 904 | 909 |
| MIDI files in the pack | 10 855 | 10 915 |
| Pack names carrying two styles | 11 | 11 |

Acceptance. Item 1 holds: key E, Classic, pads 1 to 4 read `Em [i]`, `Em#5 [i♯5]`,
`Em6 [i6]`, `Em#5 [i♯5]`, all progression pads, and pad 2 is E4 G4 C5. Items 3 to 6
hold: the audit passes with no whitelist, the parser tests are in check P, the
snapshot has one new block, and the protocol passes.

**Item 2 holds only in part.** Key E, Smooth, reading the MIDI notes:

| Pad | Notes | MIDI |
|---|---|---|
| 1 `Em` | E4 G4 B4 | 64 67 71 |
| 2 `Em#5` | E4 G4 C5 | 64 67 72 |
| 3 `Em6` | G4 B4 C♯5 E5 | 67 71 73 76 |
| 4 `Em#5` | E4 G4 C5 | 64 67 72 |

The line is there, B 71, C 72, C♯ 73, and G stays on 67 throughout. E does not stay
on 64: in pad 3 the voicer puts G at the bottom and sounds E an octave higher, 76.
The pitch class is held, the pitch is not. Classic keeps the bass: pad 3 is
64 67 71 73. The Smooth voicer picks an inversion for the four-note `Em6` between two
three-note chords, and the same pad 3 shape, bass on the third, comes out in C, A and
F. I did not trace which term of its scorer decides it, and the index (§8,
non-goals) rules out re-tuning it, so it is left as it is.

**A consequence of the priorities as given.** §3.3 avoids `major` and `dom7`, which
is nearly every chord row 4 offers, and the palette has nothing unused to fill the
gap with, so row 4 reaches spec 04's step 5 in all five styles. Classic, key A:
`E7 [V7]  B7 [V7/V]  F♯ [VI]  F♯7 [V7/ii]`, all chords the template avoids. It
joins the templates listed in spec 04 §6 item 8 (see the note in its §9), left to
spec 07 and to a later decision on the priorities.

**Decisions after implementation**, by the maintainer's reviewer:

- **Item 2 amended, the Smooth scorer left alone.** The line the template exists
  for is there in Smooth: B, C, C♯ in one voice, with G held. Holding E at the
  same pitch as well is a held bass, which is the job of the optional Pedal style
  (spec 11), not of a smooth voice-leading search. Re-tuning that search for one
  template would change voicings across the catalogue.
- **The priorities were the spec's error, and are corrected in §3.3 and in the
  catalogue.** All four chords share the tonic, so the palette has almost nothing
  unused, and row 4 is drawn from the general pool, which is mostly major and
  dominant-seventh chords. Avoiding both left it nothing. In a minor key, ♭VI,
  ♭VII and V7 are what follows a line cliché, so `major` and `dom7` are now
  allowed and only `major7`, `diminished` and `quartal` are avoided. The template
  no longer reaches spec 04's step 5: entries fall from 33 to 28 in the key of C.
  Its row 4 in A is now `E7 [V7]  B7 [V7/V]  F♯ [VI]  B♭ [♭II]`, of which `F♯ [VI]`
  is the minor-key apparatus spec 07 replaces.
