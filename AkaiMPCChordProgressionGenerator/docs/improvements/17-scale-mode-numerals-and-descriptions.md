# 17 - Scale Mode numerals and descriptions, and a plain-language chord phrase

| | |
|---|---|
| Status | implemented |
| Type | defect, regression, feature |
| Size | L |
| Depends on | 13, 14, 15 (all implemented) |
| Blocks | - (it blocked the merge: §1.2 was a regression of this phase) |
| Recommended model | Claude Opus 5.5 (`claude-opus-5-5`): numerals derived from spelling, a description lookup split by mode, and about 400 strings of musical terminology in six languages. A Sonnet 5.5 session can do the translations from the English given here |

## 1. Problem

### 1.1 Scale Mode numerals count positions, not degrees

Scale Mode names a chord by the position of its root in the scale: first note
`I`, second `II`. In the 23 seven-note scales position and degree coincide; in
the other 11 they do not:

- Pentatonic Major (C D E G A) labels G `IV` and A `V`; its formula is
  1 2 3 5 6. Hirajoshi labels A♭ `V`, Insen labels G `IV`.
- The two eight-note diminished scales wrap their eighth note to `I`, so two
  roots share a numeral: W-H has `Cdim [i°]` and `B [I]`. The tables of
  declared qualities call that eighth note "(octave)"; it is a degree.

Template mode reads numerals against the parallel major (index §2), so the app
has two conventions: Scale Mode's natural minor shows E♭ as `III`, a minor
template shows it as `♭III`.

### 1.2 Scale Mode descriptions describe other chords

Scale Mode passes no tonality to `chordRoleKey()`, which then reads the
`chordRoles` table, written for parallel-major numerals in a key. Given
positional numerals, 181 of the 544 pads in C, in 32 of the 34 scales, get the
description of a chord on another root:

| Scale | Pad | Description shown |
|---|---|---|
| Minor | `Eb [III]` | "Chromatic mediant - major chord a major third above the tonic" |
| Phrygian | `Db [II]` | "Supertonic - predominant chord, often leading to V" |
| Pentatonic Major | `G [IV]`, `Am [v]` | "Subdominant...", "Dominant - creates tension that resolves to I" |
| Hirajoshi | `Ab [V]` | "Dominant - creates tension that resolves to I" |

62 of them, in 23 scales, are a **regression of spec 10**, which rewrote the
`III` and `VI` texts as chromatic mediants with a fixed interval. On `main`,
those 30 `III` pads read a neutral "Mediant" text, which was true, and the 32
`VI` pads "Submediant - relative minor", which was already wrong. Spec 10
proved the Scale Mode chords unchanged, not their descriptions, and spec 14's
check R covers Scale Mode only for the "borrowed" fallback.

Correct numerals alone would not fix it. The template texts are written for
keys: predominants, dominants, borrowing. Only Major and Minor are keys among
the 34 scales; in Dorian the IV is the scale's own chord, not "borrowed from the
parallel major" as `chordRolesMinor.IV` says.

### 1.3 The half-whole grid hides its dominant chords

The declared qualities of Diminished (H-W) put minor triads on 1, ♭3, ♯4 and 6
and diminished triads on the others. The scale holds major triads and dominant
sevenths on the same four roots, and its grid shows none:

```
Cm  C#dim  D#m  Edim  F#m  Gdim  Am  A#dim / Cm7  C#dim7  D#m7  Cm6  F#m7  D#m6  Am7  F#m6
```

Both traditions that use the scale build on those major chords. Jazz: "the
half-whole scale is used in dominant harmony (e.g., with an F13♭9 chord)".
Classical: the Petrushka chord sounds "two major triads, C major and F♯ major",
and the article cites "dominant seventh chords a minor third apart" in
Tchaikovsky (<https://en.wikipedia.org/wiki/Octatonic_scale>, sections Jazz,
Petrushka chord, 19th century).

### 1.4 Nothing says what a chord is in plain words

A beginner reading `♭VII` or `V7/V` gets a function ("Subtonic - ...") but not
the chord itself. A phrase such as "Major triad on the flattened seventh degree"
spells it out.

### 1.5 One more unused export

`getChordQualityForMode()` (`musicTheory.js`) is referenced nowhere; spec 16
missed it because a comment mentions it.

## 2. Decisions

D1, D4, D6 and D9 are the maintainer's; the others follow from them.

| # | Decision | Rationale |
|---|---|---|
| D1 | **Scale Mode numerals use the parallel-major convention, as templates do.** The stem is the root's letter degree, the accidental is the root's against the tonic's major scale, and case and suffix follow the chord type as today. Dorian reads `i ii ♭III IV v vi° ♭VII`, Pentatonic Major `I ii iii V vi`, Whole Tone `I II III ♯IV ♯V ♯VI`. | One convention in the whole app. It also makes the template description tables usable where they apply (D4). |
| D2 | The numeral is read from the scale **spelled in C**, not in the selected key, so a scale's numerals are the same in every key. | For seven-note and abridged scales this is identical to reading the key's own spelling. Symmetric scales have no letter per degree (spec 13 D8): their names are pitch-class names on the tonic's side, so in a flat key a name and its numeral can disagree on the accidental (E♭ H-W names G♭, numbered `♯II`). The numeral then states the scale's structure; the name states the pitch. |
| D3 | A suspended or quartal chord's numeral takes the case of its degree's triad, as in templates: `isus4` in a minor scale, `Isus4` in a major one. | Today Scale Mode writes every suspended chord in upper case; in Minor, `Isus4` would read the Picardy-third description. |
| D4 | **Descriptions:** Major and Minor pass tonality `'major'` and `'minor'`, and their pads read the template tables. Every other scale passes none, and `chordRoleKey()` with no tonality reads only the chord type and family: no numeral-keyed text, no tritone-substitution rule. | Only those two scales are keys. Elsewhere a functional text is either false or unproven. |
| D5 | Six new type descriptions, for the types that would otherwise read the generic text: major, minor, diminished, major 7, minor 7, dominant 7 (§3.4). | Measured: with type and family texts only, these six types are the only ones that reach "Harmonic color", on 320 pads. |
| D6 | **A plain-language phrase in the tooltip, in both modes:** "{chord name} {degree phrase}", such as "Augmented seventh chord on the tonic". The tooltip shows the phrase on its first line and the description on its second. The card keeps the description alone. | The maintainer's choice: the card stays short; the tooltip, which has room, spells the chord out for beginners. |
| D7 | In the Keyboard view, which prints the description on the card and shows no tooltip today, the tooltip shows the phrase alone. | Otherwise the phrase would be missing from one view. |
| D8 | The phrase's degree is the pad's: in Scale Mode the D1 numeral's degree and accidental; in template mode the spelled root against the spelled tonic (spec 13 spells by function, so `V7/V`'s D is the second degree, `SubV7`'s D♭ the flattened second). Generation stores it on the pad as `pad.degree = { step: 1-7, alteration: -1, 0 or 1 }`. | One field read by the phrase in both modes. Roots never carry a double accidental (spec 13 respells them). |
| D9 | **Diminished (H-W) declares major triads on its degrees 1, 3, 5 and 7** (C, D♯, F♯, A in C) instead of minor. Diminished (W-H) is unchanged. The replacement rule of spec 15 stays uniform: no 7♭9 preference. | §1.3. The degree sevenths become C7, D♯7, F♯7, A7, four dominant sevenths a minor third apart. Both readings are in the scale; this one is the attested use. |
| D10 | The declared-quality tables lose their "(octave)" comments, and their numeral comments follow D1. | The eighth note of a diminished scale is a degree. |
| D11 | Delete `getChordQualityForMode()`. | §1.5. |
| D12 | The chord names are a new locale table, not the English labels of `CHORD_TYPE_DISPLAY`. The labels on the pads stay English, as today; translating them with the new table is a possible later change. | Out of scope here; noted because the table makes it cheap. |

## 3. Specification

### 3.1 Numerals

In `generateScaleExploration()`, spell each pad's root in the scale spelled in C
(`spellRoot(scaleSpelling('C', mode), { semitones })`). The stem is
`I`-`VII` by that note's letter, the accidental its `♭` or `♯`. The case comes
from the chord type as today, except D3. The suffix is the type's
(`getRomanSuffix()`). `getRomanNumeralForChord()` is no longer used by Scale
Mode. Measured with a prototype: in C, 212 of the 544 numerals change, D9
included, and no grid has two roots sharing a numeral stem.

### 3.2 Descriptions

- `generateScaleExploration()` returns `tonality: 'major'` for Major,
  `'minor'` for Minor, nothing for the other 32 scales.
- `chordRoleKey(numeral, type, tonality, has)`: when `tonality` is absent,
  return `chordRoles.types.<type>` if it exists, else the family fallbacks
  (sus, add9, 6, extended), else `chordRoles.default`. Template calls always
  pass a tonality, so template mode is unchanged.
- Minor's pads then read, for example, `♭III -> chordRolesMinor.♭III`,
  `iiø7 -> chordRolesMinor.II°`, `isus4 -> chordRolesMinor.i`.

### 3.3 The phrase

- `pad.degree` (D8) is set in both generation paths.
- A new pure function, `chordPhraseKeys(pad)` in `musicTheory.js`, returns
  `{ name: 'chordTypeNames.<type>', degree: 'degreePhrases.<b|#|><step>' }`.
- `app.js` composes `i18n.t(name) + ' ' + i18n.t(degree)`, then the tooltip
  text `phrase + '\n' + description` (`white-space: pre-line` on the tooltip),
  or the phrase alone in the Keyboard view (D7).
- Every degree phrase carries its own preposition and article ("on the tonic",
  "sur la tonique", "sulla tonica", "auf der Tonika"), so no language needs
  agreement between the two parts.

### 3.4 English texts

Translate into `fr`, `es`, `de`, `pt`, `it`; American spelling, as `en.json`.

`chordTypeNames` (one per entry of `CHORD_TYPE_DISPLAY`):

| Type | Name | Type | Name |
|---|---|---|---|
| major | Major triad | aug9 | Dominant ninth chord with a raised fifth |
| minor | Minor triad | major6 | Major sixth chord |
| diminished | Diminished triad | minor6 | Minor sixth chord |
| augmented | Augmented triad | maj6/9 | Major six-nine chord |
| minAug | Minor triad with a raised fifth | major9 | Major ninth chord |
| sus2 | Suspended-second chord | minor9 | Minor ninth chord |
| sus4 | Suspended-fourth chord | dom9 | Dominant ninth chord |
| quartal | Stacked-fourths chord (7sus4 without fifth) | dom7b9 | Dominant seventh chord with a flattened ninth |
| quartal4 | Stacked-fourths chord (minor seventh with an eleventh) | dom7sharp9 | Dominant seventh chord with a raised ninth |
| major7 | Major seventh chord | dom7b5 | Dominant seventh chord with a flattened fifth |
| minor7 | Minor seventh chord | dom7alt | Altered dominant chord |
| dom7 | Dominant seventh chord | major11 | Major eleventh chord |
| dom7sus4 | Dominant seventh chord with a suspended fourth | minor11 | Minor eleventh chord |
| dim7 | Diminished seventh chord | dom11 | Dominant eleventh chord |
| m7b5 | Half-diminished seventh chord | major13 | Major thirteenth chord |
| minMaj7 | Minor-major seventh chord | minor13 | Minor thirteenth chord |
| aug7 | Augmented seventh chord | dom13 | Dominant thirteenth chord |
| augMaj7 | Augmented major seventh chord | add9 | Major triad with an added ninth |
| It6 | Italian augmented sixth | minAdd9 | Minor triad with an added ninth |
| Fr6 | French augmented sixth | add11 | Major triad with an added eleventh |
| Ger6 | German augmented sixth | | |

`degreePhrases` (21 keys: `1` to `7`, each also with `b` and `#`):

| Key | English | Key | English |
|---|---|---|---|
| `1` | on the tonic | `5` | on the fifth degree |
| `b1`, `#1` | on the flattened tonic, on the raised tonic | `b5`, `#5` | on the flattened fifth degree, on the raised fifth degree |
| `2` | on the second degree | `6` | on the sixth degree |
| `b2`, `#2` | on the flattened second degree, on the raised second degree | `b6`, `#6` | on the flattened sixth degree, on the raised sixth degree |
| `3` | on the third degree | `7` | on the seventh degree |
| `b3`, `#3` | on the flattened third degree, on the raised third degree | `b7`, `#7` | on the flattened seventh degree, on the raised seventh degree |
| `4` | on the fourth degree | | |
| `b4`, `#4` | on the flattened fourth degree, on the raised fourth degree | | |

`chordRoles.types` additions (D5):

| Type | English |
|---|---|
| major | Major triad - bright and stable, the most common chord. |
| minor | Minor triad - darker than major, and as stable. |
| diminished | Diminished triad - two stacked minor thirds, tense; it wants to move on. |
| major7 | Major seventh chord - a major triad with a major seventh, soft and open. |
| minor7 | Minor seventh chord - a minor triad with a minor seventh, mellow. |
| dom7 | Dominant seventh chord - a major triad with a minor seventh; its tritone pulls toward a resolution. |

### 3.5 Data

- `Diminished (H-W)` in the declared-quality table: degrees 0, 2, 4 and 6
  become `'major'` (D9).
- Comments in the declared-quality tables: no "(octave)"; numerals as D1
  writes them.
- Delete `getChordQualityForMode()`.

### 3.6 Audit

- **New check T**, over every scale in every key: each pad's numeral stem and
  accidental equal its root's letter degree and accidental in the scale spelled
  in C (D1, D2); within a grid, no two roots share a stem.
- **Check R, extended:** in Scale Mode, a pad of a scale other than Major and
  Minor resolves only to `chordRoles.types.*` or a family key; no pad, in
  either mode, resolves to `chordRoles.default`; every pad, in either mode, has
  an existing `chordTypeNames` and `degreePhrases` key.

### 3.7 Records

- Spec 10's notes: the `III` and `VI` texts misdescribed Scale Mode pads until
  this spec.
- `CHANGELOG.md`: one entry.
- Index §2: Scale Mode numerals follow the same convention as templates.

## 4. Acceptance

- Snapshot: the 34 Scale blocks change their numerals (212 pads in C), and
  Diminished (H-W) changes 11 pads:
  `C C#dim D# Edim F# Gdim A A#dim / C7 C#dim7 D#7 C6 F#7 Cm6 A7 D#6`.
  No template block changes.
- The pack is byte-identical: no exported file carries a Scale Mode numeral or
  a description.
- No Scale Mode pad's description names another root (the measurement of §1.2
  gives 0), and checks R and T pass.
- In the browser: Minor's E♭ pad reads `♭III` and the relative major's
  description; hovering a template's `♭VII` pad shows "Major triad on the
  flattened seventh degree" above its description; the Keyboard view shows the
  phrase alone; the French UI shows French phrases.
- `check-translations.mjs` passes with 68 new keys in six locales (41 names,
  21 degree phrases, 6 type descriptions).

## 5. Out of scope

- Translating the English quality labels on the pads (D12).
- The jazz-idiomatic 7♭9 preference for the diminished scales (§2 D9).
- Conventional formulas for the symmetric scales (`♭II` rather than `♯I` in
  H-W): D2 follows spec 13's spelling instead.

## 6. Implementation notes

- **Code.** `musicTheory.js` gains `rootDegree()`, which reads the root
  before spec 13 respells an awkward name, so a phrase agrees with its numeral
  (in C♯ major, ♯iv° stands on F𝄪, shown as G, and reads "raised fourth");
  `scaleModeNumeral()`, `chordPhraseKeys()` and `degreePhraseKey()`.
  `spellRoot()` is split into `functionalRoot()` and the respelling, with
  unchanged results. `chordRoleKey()` with no tonality returns the type's or
  family's key. `generation.js` sets `pad.degree` in both modes, Scale Mode's
  numerals and its `tonality` for Major and Minor. `app.js` adds `data-degree`
  to pads and `getPadTooltipText()`.
- **Numerals:** 247 of 544 change in C, not the 212 of the prototype. The
  difference is D3: suspended chords now take their degree's case (`isus4`,
  `ii7sus4`), which the prototype did not do. No grid gives two roots one
  numeral.
- **Chords:** only Diminished (H-W) changes, the 11 pads of §4. The
  replacement planner's numeral test reads the new numerals; since a numeral
  and a (degree, type) pair correspond one to one, no other grid moves.
- **Comments:** 79 numeral comments in the declared-quality table were
  rewritten by script from `scaleModeNumeral()`; "(octave)" and the "(with
  b2)" notes, which the accidental now states, are gone.
- **One wording change:** `aug9` is named "Dominant ninth chord with a raised
  fifth", not "Augmented ninth chord": an "augmented ninth" is also the ♯9
  interval, which this chord does not have.
- **Checks.** T reports 208 and 60 findings when Scale Mode is given back its
  positional numerals. R reports 5 628 findings when the no-tonality branch is
  removed, and 3 356 and 1 588 when a chord name and a degree phrase are
  deleted from `en.json`.
- **Protocol:** the snapshot changes 121 lines, all in `## Scale` blocks; the
  pack is byte-identical; audit, translations and snapshot checks pass.
- **Browser:** template `♭VII` shows "Major triad on the flattened seventh
  degree" above its description; the Keyboard view shows the phrase alone;
  Minor's E♭ reads `♭III` and the relative-major text; French and German
  phrases display; no console error.
- **Seen, not changed.** Outside Major and Minor, the tooltip names the chord
  type twice: "Major triad on the fourth degree", then "Major triad - bright
  and stable...". Showing only the text after the type's name there would remove
  it.
