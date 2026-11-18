# 14 - Pad descriptions and the analysis line say what the chords are

| | |
|---|---|
| Status | implemented |
| Type | defect |
| Size | M |
| Depends on | 00, 07, 09, 10, 13 (all implemented) |
| Blocks | - |
| Recommended model | Claude Sonnet 5.5 (`claude-sonnet-5-5`): one classifier and one lookup moved into a module, rules and English texts given verbatim, nine keys translated into five locales, one audit check and one snapshot line, all with the decisions made |

## 1. Problem

Two pieces of text describe the harmony on screen. Both are wrong in places,
and one of the errors comes from spec 07 itself.

### 1.1 The analysis line

Under each variant's title, `analyzeProgression()` (`app.js:722`) labels the
progression: "Modal Interchange", "Secondary Dominants", "Extended Harmony",
"Chromatic", or "Diatonic progression" when none applies. Spec 07 §3.5 fixed
the minor-key side and wrote the major-key side as "any `♭` or `♯`". That
rule is wrong in both directions, and the "Chromatic" flag has its own error:

- **Borrowings without an accidental are missed.** In a major key the
  chords borrowed from the parallel minor include `iv`, `i`, `v`, `ii°` and
  `iiø7`, none of which carries an accidental. "Modal Interchange:
  `I—iv—I—V`" is labelled "Diatonic progression", against its own genre.
- **Chromatic chords are called borrowed.** `♯I°`, `♯II°` and `♯iv°` are
  leading-tone chords of the next chord, and `♯IV7` is a tritone-related
  approach chord. None of them is in a parallel mode, yet six templates are
  labelled "Modal Interchange" for them alone. `♭II7`, a tritone substitute,
  is called a borrowing for its `♭`.
- **"Chromatic" means "contains a diminished triad".** `vii°` in a major
  key is diatonic, yet `I—IV—vii°—iii—vi—ii—V—I`, the diatonic circle of
  fifths, is labelled "Chromatic". Meanwhile augmented chords and spec 09's
  `i♯5` raise no flag at all: `i—i♯5—i6—i♯5` is labelled "Diatonic
  progression", although spec 13 spells its second chord E G B♯ precisely
  because the B♯ is chromatic.
- **Chromatic mediants and double mixture.** `i—♭vi—i—iii` is labelled
  "Diatonic progression"; `♭vi` there and in `I—♭vi—♭VI—I` holds C♭, a note
  that neither C major nor C minor contains.

Measured over the 184 templates in C, Smooth style: 28 labels are wrong or
incomplete. §5.1 lists them with the label this spec produces.

### 1.2 Pad descriptions

Hovering a pad shows a description from `getChordTooltip()` (`app.js:787`).
It tries the minor-key table, then the numeral as written, then the numeral
without quality markings, then the chord type. When all of these fail, it
says "Borrowed chord - adds expressive color by borrowing from parallel mode"
for any numeral with an accidental. Measured over 184 templates × six styles:

| Numeral (type) | Templates | Description today | What the chord is |
|---|---|---|---|
| `i♯5` (minAug), minor | 1 | Borrowed chord | the line cliché's chromatic step; spec 09 added it with no description |
| `i` (minor), major | 11 | "Tonic - the home chord, gives resolution and stability" | spec 10's mode flip: the parallel minor's tonic, borrowed |
| `iv`, `iv7`, `iv9`, major | 67, 22, 1 | "Subdominant - predominant chord, prepares motion to V" | the minor subdominant, the most common borrowing in a major key |
| `♭II7`, `♭II9`, major and minor | 5, 2, 3, 2 | "Borrowed flat-II (Neapolitan), strong predominant, prepares V" | the tritone substitute of V7, a dominant |
| `♭II7♭5`, major | 1 | Borrowed chord | the tritone substitute, altered |
| `I7♭5` (dom7b5), major | 1 | Borrowed chord | a dominant seventh with a flattened fifth |
| `♯IV`, `♯IV7`, `♯IV9`, major | 1 | Borrowed chord, or "Extended" | a chromatic chord a tritone from the tonic, sliding into IV |
| `♯iv°`, major | 2 | Borrowed chord | the leading-tone chord of V |
| `i°`, major | 1 | "Tonic - the home chord" | a common-tone diminished chord on the tonic's root |
| `iii°`, `iiiø7`, major | 1 | "Mediant - weaker predominant..." | the leading-tone chord of IV |

`iv` was already wrong before this development phase. `i♯5` and the
mode-flip `i` were added by specs 09 and 10 without descriptions.

## 2. Goal

1. A progression's label names what its chords are, by one written rule
   applied to every progression chord.
2. No pad in Progression Palette mode falls back to the generic "Borrowed
   chord" or "Harmonic color" texts.
3. Both stay true when the catalogue grows: an audit check guards the
   descriptions, and the snapshot shows each progression chord's class.

## 3. Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Every progression chord gets exactly one class: **diatonic**, **borrowed**, **applied** or **chromatic**, by the ordered rules of §4.1. The label lists Modal Interchange (any borrowed), Secondary Dominants (any applied), Extended Harmony (any chord whose quality label contains "7", unchanged), Chromatic (any chromatic), in that order, or "Diatonic progression" when none applies. The five label strings are unchanged. | One classifier, readable as a table, replaces three ad hoc tests. |
| D2 | Pitch classes are read relative to the template's tonic. The **diatonic** collection is the major scale in a major key, and the natural minor plus the raised seventh in a minor key. **Borrowed** means every pitch class lies in one parallel source: Aeolian, Dorian, Phrygian or harmonic minor in a major key; Ionian, Dorian or Phrygian in a minor key. | The minor key's V and vii°7 are its own. The sources cover every borrowing the catalogue uses and stop short of Lydian, which would turn `♯iv°` into a borrowing. |
| D3 | The Neapolitan, `♭II` as a major triad or major seventh, is **borrowed** (from Phrygian). `♭II` with a dominant type (a major third and a minor seventh) is the tritone substitute and is **chromatic**, as is `SubV7`. | Common-practice theory files the Neapolitan as a chromatic predominant. Pop and modal theory call it a Phrygian borrowing, as the existing `♭II` description already does. Keeping the description and the label consistent matters more than which school wins. |
| D4 | The raised sixth in a minor key (`IV`, `ii`, `i6`) is **borrowed**. | Spec 07 already decided this and the minor-key `IV` description says so ("borrowed from the parallel major"). The consequence is that the descending line cliché `i—i(maj7)—i7—i6` is labelled Modal Interchange for its `i6`. |
| D5 | In a major key, a dominant seventh on `I` or `IV` (blues `I7`, `IV7`) is **diatonic**. | Today these chords raise no flag. Calling every blues template "Modal Interchange" for its Mixolydian seventh would be defensible, but it would relabel a genre for no gain to the player. |
| D6 | In a major key, a dominant seventh on `II`, `III`, `VI` or `VII` without a slash is **applied** (`III7—VI7—II7—V7` is a chain of secondary dominants). A plain major triad on those degrees is not: it falls through to the pitch-class rules and comes out **chromatic**. | A major triad on II, III or VI is a secondary dominant in `I—VI—ii—V`, a chromatic mediant in `I—♭VI—I—III` and a Lydian colour in `I—II`. "Chromatic" is true in all three readings; "Secondary Dominants" is true in one. |
| D7 | The augmented family (`augmented`, `aug7`, `augMaj7`, `minAug`) and the augmented sixths are **chromatic**, whatever their pitch classes. | `i♯5` sounds E G C in E minor, three diatonic pitch classes, but it is spelled E G B♯ (spec 13 D5) because the B♯ is a raised fifth. A pitch-class test cannot see that, so the type decides. |
| D8 | A minor chord on a flattened degree (`♭vi`, `♭iii`) is **chromatic**. | Double mixture. A♭ C♭ E♭ shares its pitch classes with A♭ B E♭, and B is diatonic in C minor, so a pitch-class test would call `♭vi` diatonic in minor and borrowed in major. |
| D9 | A chord of the diminished family (`diminished`, `dim7`, `m7b5`) is **chromatic**, except on the key's own degrees without an accidental: `vii` and `ii` in a major key, `ii` and `vii` in a minor key. Those go on to the pitch-class rules. | `vii°` is diatonic in major. `ii°`, `iiø7` and `vii°7` in a major key are borrowings from minor. `i°`, `iii°`, `♯i°`, `♯ii°` and `♯iv°` are passing or leading-tone chords, which is chromatic. |
| D10 | Pad descriptions gain a major-key table, `chordRolesMajor`, consulted first when the template's tonality is `'major'`, as `chordRolesMinor` is when it is `'minor'`. Scale Mode passes no tonality (`app.js:785`) and is unaffected. | A Scale Mode `i` is its scale's tonic and must not be described as a borrowing. |
| D11 | In both tonality tables, a numeral containing `°` or `ø` tries its diminished reading (upper case, `ø` read as `°`, a trailing `°7` read as `°`) **before** quality markings are stripped. | Stripping first turns `i°` into `i`, which would describe a diminished chord as the minor tonic. The minor table's order changes too; nothing in the current catalogue resolves differently because of it (§5.2). |
| D12 | A chord on `♭II` with a dominant type, and `SubV7`, read `chordRoles.SUBV7` before any table is consulted, in both tonalities. | Without this, `♭II7` strips to `♭II` and reads as the Neapolitan. |
| D13 | The classifier and the description lookup move into `modules/musicTheory.js` as pure functions: `classifyProgressionChord()` and `chordRoleKey()`. `app.js` keeps only the calls to `i18n`. | The audit and the snapshot tools must run them without a browser. |
| D14 | The snapshot gains one line per template block, the Classic variant's class for each progression chord. | The classes become reviewable in the same diff as the chords. The labels do not depend on the style (measured: no template's label varies across the six styles once Extended Harmony is set aside), so one line is enough. |
| D15 | New audit check **R**: no Progression Palette pad, over all templates × six styles in C, resolves to `chordRoles.borrowed` or `chordRoles.default`, and every key it resolves to exists in `en.json`. Scale Mode is not covered. | Scale Mode numerals carry no accidentals, so "borrowed" cannot occur. Its seventh-degree chords (`VII`, `vii` and their sevenths, in 26 scale and numeral pairs such as Minor `VII` and Phrygian `vii`) read "Harmonic color", which is neutral and true. Describing them is a feature, not this defect. |

## 4. Specification

### 4.1 `classifyProgressionChord(pad, tonality, tonicPitchClass)`

Export it from `modules/musicTheory.js`. It returns `'diatonic'`,
`'borrowed'`, `'applied'` or `'chromatic'`. `pad` supplies `romanNumeral`,
`chordType` and `notes`. Let `head` be the numeral before any `/`, `p`
be `parseRomanStem(head)`, `dominant` mean that the type's intervals contain
4 and 10 (mod 12), and `family` be `getChordFamily(chordType)`. Apply in order;
the first rule that matches decides:

| # | Rule | Class |
|---|---|---|
| 1 | The numeral contains `/` | applied |
| 2 | The numeral is `It+6`, `Fr+6`, `Ger+6` or starts with `SubV`, or the type is `augmented`, `aug7`, `augMaj7` or `minAug` | chromatic |
| 3 | `p` has a flat and degree II, and `dominant` | chromatic |
| 4 | Major key, `p` has no accidental, degree II, III, VI or VII, and `dominant` | applied |
| 5 | `p` has a flat, the stem is lower case, and `family` is `'minor'` | chromatic |
| 6 | `family` is `'diminished'`, unless `p` has no accidental and its degree is VII or II | chromatic |
| 7 | Major key, `p` has no accidental, degree I or IV, and `dominant` | diatonic |
| 8 | Every pitch class of `notes`, relative to the tonic, is in the diatonic collection (D2) | diatonic |
| 9 | Every pitch class is in one of the parallel sources (D2) | borrowed |
| 10 | Otherwise | chromatic |

Collections, in semitones above the tonic:

| Name | Pitch classes |
|---|---|
| major (diatonic, major key) / Ionian | 0 2 4 5 7 9 11 |
| minor (diatonic, minor key) | 0 2 3 5 7 8 10 11 |
| Aeolian | 0 2 3 5 7 8 10 |
| Dorian | 0 2 3 5 7 9 10 |
| Phrygian | 0 1 3 5 7 8 10 |
| harmonic minor | 0 2 3 5 7 8 11 |

`analyzeProgression()` in `app.js` calls it for each progression chord,
with the tonic's pitch class from the selected key, and composes the label
by D1. `isBorrowedNumeral()` and its comment are deleted; nothing else uses
it.

### 4.2 `chordRoleKey(romanNumeral, chordType, tonality, has)`

Export it from `modules/musicTheory.js`. It returns the i18n key of the
description; `has(key)` reports whether a key exists. `getChordTooltip()` in
`app.js` becomes `i18n.t(chordRoleKey(..., key => i18n.has(key)))`, and the
`QUALITY_MARKINGS` regular expressions move with the lookup. Order:

1. `SubV7`, or `p` with a flat and degree II without a slash and a dominant
   type: `chordRoles.SUBV7` (D12).
2. If `tonality` is `'minor'`, table `chordRolesMinor`; if `'major'`, table
   `chordRolesMajor`. Candidates, first hit wins: the numeral as written;
   if it contains `°` or `ø`, its diminished reading (D11); the numeral
   without quality markings, case kept; upper-cased without quality markings.
3. `chordRoles` exactly as today: as written, upper case, without markings
   with case kept, without markings in upper case, `chordRoles.types.<type>`.
4. The generic families, then `chordRoles.borrowed` for a numeral with an
   accidental, then `chordRoles.default`, as today.

### 4.3 New locale keys

English text verbatim; translate into `fr`, `es`, `de`, `pt`, `it`. American
spelling, as `en.json` uses throughout.

| Key | English |
|---|---|
| `chordRolesMinor.i♯5` | Line-cliché chord - the minor tonic with its fifth raised a semitone, a chromatic step between i and i6. |
| `chordRolesMajor.i` | Minor tonic - the parallel minor's home chord, borrowed; it darkens the tonic without leaving it. |
| `chordRolesMajor.iv` | Minor subdominant - borrowed from the parallel minor; its flattened sixth sinks to the fifth, a darker plagal pull. |
| `chordRolesMajor.I°` | Common-tone diminished chord - keeps the tonic's root while its other notes move chromatically, a passing color. |
| `chordRolesMajor.III°` | Leading-tone diminished chord of IV (vii°/IV) - a passing chord whose root rises a semitone to IV's. |
| `chordRoles.♯IV` | Tritone chord - a chromatic major chord a tritone from the tonic, the furthest point from home; it slides a semitone down into IV. |
| `chordRoles.♯IV°` | Leading-tone diminished chord of V (vii°/V) - a passing chord whose root rises a semitone to V's. |
| `chordRoles.types.dom7b5` | Dominant seventh with a flattened fifth - it has the same notes as the dominant seventh a tritone away, so it can resolve to either one's target. |
| `chordRoles.types.minAug` | Minor triad with a raised fifth - it sounds like a major triad in first inversion; in a line cliché it is the chromatic step between i and i6. |

`chordRolesMajor` is a new top-level object in every locale file, beside
`chordRolesMinor`.

### 4.4 Audit check R

In `tools/audit-theory.mjs`, over every template and the six styles in C:
resolve every pad's key with `chordRoleKey()` and a `has` that reads
`locales/en.json`. Fail when the key is `chordRoles.borrowed` or
`chordRoles.default`, or does not exist. The message names the template,
style, pad and numeral.

### 4.5 Snapshot

In every template block of `docs/catalogue-snapshot.txt`, after the `Smooth`
line, add one line: the word `Classes`, then the Classic variant's class for
each progression chord in progression order, separated by two spaces:

```
Classes        diatonic  borrowed  diatonic  diatonic
```

Update the file's header comment to say so. Scale blocks are unchanged.

### 4.6 Records

- Spec 07's notes: one line saying §3.5's major-key rule is superseded by
  this spec.
- `CHANGELOG.md`: one entry under the open section ("Chord descriptions and
  the progression summary now say what each chord is: ...").
- This spec's header and the index, as usual.

## 5. Acceptance

### 5.1 Analysis labels

Exactly these 28 labels change (key of C, Smooth style). No other template's
label changes in any style.

| Genre | Template | Before | After |
|---|---|---|---|
| Pop/Rock | `I—III—IV—iv` | Diatonic progression | Modal Interchange • Chromatic |
| Blues/Soul | `ii—V—I—VI` | Diatonic progression | Chromatic |
| Blues/Soul | `I—VI—ii—V` | Diatonic progression | Chromatic |
| Jazz/Functional | `I—vi—IV—♯iv°—V` | Modal Interchange • Chromatic | Chromatic |
| Jazz/Functional | `I—♯I°—ii—♯II°` | Modal Interchange • Chromatic | Chromatic |
| Jazz/Functional | `IM7—♭IIIM7—♭VIM7—♭II7` | Modal Interchange • Extended Harmony | Modal Interchange • Extended Harmony • Chromatic |
| Jazz/Functional | `III7—VI7—II7—V7` | Extended Harmony | Secondary Dominants • Extended Harmony |
| Jazz/Functional | `♭II7—I` | Modal Interchange • Extended Harmony | Extended Harmony • Chromatic |
| Jazz/Functional | `ii7—♭II7—IM7` | Modal Interchange • Extended Harmony | Extended Harmony • Chromatic |
| Jazz/Functional | `ii—V—I—IV—vii°—III7—vi` | Extended Harmony • Chromatic | Secondary Dominants • Extended Harmony |
| Jazz/Functional | `i—i(maj7)—i7—i6` | Extended Harmony | Modal Interchange • Extended Harmony |
| Jazz/Functional | `IM7—♭IIIM7—♭VIM7—♭II7—IM7` | Modal Interchange • Extended Harmony | Modal Interchange • Extended Harmony • Chromatic |
| Jazz/Functional | `I—♯I°—ii—♯II°—iii` | Modal Interchange • Chromatic | Chromatic |
| Jazz/Functional | `I—I°—ii—♯II°—iii—III°—IV` | Modal Interchange • Chromatic | Chromatic |
| Modal Interchange | `I—iv—I—V` | Diatonic progression | Modal Interchange |
| Classical/Modal | `I—IV—vii°—iii—vi—ii—V—I` | Chromatic | Diatonic progression |
| Electronic/Modern | `IM7—IVM7—VM7` | Extended Harmony | Extended Harmony • Chromatic |
| R&B/Neo-Soul | `IM7—V7/IV—IVM7—iv` | Secondary Dominants • Extended Harmony | Modal Interchange • Secondary Dominants • Extended Harmony |
| R&B/Neo-Soul | `I—♯iv°—ii—V` | Modal Interchange • Chromatic | Chromatic |
| Funk/Groove | `I7—♯IV7—IV7—I7` | Modal Interchange • Extended Harmony | Extended Harmony • Chromatic |
| Latin/Bossa | `IM7—VI7—ii7—V7` | Extended Harmony | Secondary Dominants • Extended Harmony |
| Film/Cinematic | `I—♭VI—I—III` | Modal Interchange | Modal Interchange • Chromatic |
| Film/Cinematic | `I—♭III—I—VI` | Modal Interchange | Modal Interchange • Chromatic |
| Film/Cinematic | `i—♭vi—i—iii` | Diatonic progression | Modal Interchange • Chromatic |
| Film/Cinematic | `I—♭vi—♭VI—I` | Modal Interchange | Modal Interchange • Chromatic |
| Film/Cinematic | `I—II` | Diatonic progression | Chromatic |
| Film/Cinematic | `I—II—iii—II` | Diatonic progression | Chromatic |
| Film/Cinematic | `i—i♯5—i6—i♯5` | Diatonic progression | Modal Interchange • Chromatic |

### 5.2 Pad descriptions

Exactly these resolutions change, over 184 templates × six styles in C:

| Tonality | Numeral (type) | Before | After |
|---|---|---|---|
| minor | `i♯5` (minAug) | `chordRoles.borrowed` | `chordRolesMinor.i♯5` |
| minor | `♭II7` (dom7), `♭II9` (dom9) | `chordRolesMinor.♭II` | `chordRoles.SUBV7` |
| major | `i` (minor) | `chordRoles.I` | `chordRolesMajor.i` |
| major | `iv` (minor), `iv7` (minor7), `iv9` (minor9) | `chordRoles.IV` | `chordRolesMajor.iv` |
| major | `i°` (diminished) | `chordRoles.I` | `chordRolesMajor.I°` |
| major | `iii°` (diminished), `iiiø7` (m7b5) | `chordRoles.iii` | `chordRolesMajor.III°` |
| major | `♭II7` (dom7), `♭II9` (dom9) | `chordRoles.♭II` | `chordRoles.SUBV7` |
| major | `♭II7♭5` (dom7b5) | `chordRoles.borrowed` | `chordRoles.SUBV7` |
| major | `I7♭5` (dom7b5) | `chordRoles.borrowed` | `chordRoles.types.dom7b5` |
| major | `♯IV` (major), `♯IV7` (dom7) | `chordRoles.borrowed` | `chordRoles.♯IV` |
| major | `♯IV9` (dom9) | `chordRoles.extended` | `chordRoles.♯IV` |
| major | `♯iv°` (diminished) | `chordRoles.borrowed` | `chordRoles.♯IV°` |

No Scale Mode pad's description changes. Check R passes, and fails if
`chordRolesMinor.i♯5` is removed from `en.json`.

### 5.3 Protocol

- The snapshot diff adds one `Classes` line to each of the 184 template
  blocks and changes nothing else.
- The pack is byte-identical (record `sha256sum pack/*.zip` before and
  after): neither descriptions nor labels are exported.
- `check-translations.mjs` passes with the nine keys in all six locales.
- In the browser: the ascending line cliché in E reads "Modal Interchange •
  Chromatic", and hovering its `i♯5` pad shows the line-cliché description.

## 6. Out of scope

- Scale Mode descriptions (D15).
- Rewording existing descriptions that are correct.
- Template values. `♯IV7` in `I7—♯IV7—IV7—I7` would be spelled `♭V7` by the
  tritone-substitution convention (G♭7 sliding to F7), but a value is a
  template's identity (spec 01) and the name is defensible as a chromatic
  approach chord.

## 7. Sources

- Borrowed chords in a major key, `iv`, `i`, `v`, `ii°`, `♭III`, `♭VI`, `♭VII`:
  <https://en.wikipedia.org/wiki/Borrowed_chord>
- Secondary dominants and secondary leading-tone chords:
  <https://en.wikipedia.org/wiki/Secondary_chord>
- Passing chords: <https://en.wikipedia.org/wiki/Passing_chord>
- Tritone substitution, `♭II7` for `V7`:
  <https://en.wikipedia.org/wiki/Tritone_substitution>
- The Neapolitan chord: <https://en.wikipedia.org/wiki/Neapolitan_chord>
- The line cliché, "any chromatic line that moves against a stationary
  chord": <https://en.wikipedia.org/wiki/Chromaticism#Chromatic_line>
- Chromatic mediants, and Forte's "doubly chromatic" mediant for a chord of
  the opposite mode a third away (`I` to `♭vi`), which D8 calls double
  mixture: <https://en.wikipedia.org/wiki/Chromatic_mediant>

## 8. Implementation notes

- `classifyProgressionChord()` and `chordRoleKey()` are in `musicTheory.js`,
  after `getChordFamily()`, with the quality-marking expressions that moved
  from `app.js`. `app.js` keeps `analyzeProgression()`, which now takes the
  tonic (`getKeyOffset(selectedKey)`), and a one-line `getChordTooltip()`.
  `isBorrowedNumeral()`, `getMinorChordRole()` and the `parseRomanStem` import
  are gone from `app.js`.
- **Rule 2 reads the family.** It tests `getChordFamily(type) === 'augmented'`
  plus `minAug`, not the list of four types. That covers `dom7alt` and spec
  15's new `aug9` too, which a list would have had to follow.
- **Measured, against the code before this spec:** exactly the 28 labels of
  §5.1 change (Smooth, key of C). No template's label varies across the six
  styles once Extended Harmony is set aside. The 18 resolutions of §5.2 change,
  and no other template-mode one does. No template pad resolves to a generic
  text, and every resolved key exists in `en.json`.
- **D15 was wrong on one point.** Scale Mode numerals carry no accidental on
  their degree, but a suffix can: `III7♭5`. Under the old lookup, the seven
  `7♭5` pads that spec 15 adds to Scale Mode read "Borrowed chord" because of
  that ♭. With `chordRoles.types.dom7b5` they read the dominant-seventh-flat-five
  text. Those seven are the only Scale Mode descriptions that change. Check R
  therefore also covers Scale Mode, for the "borrowed" fallback only; "Harmonic
  color" stays allowed there (D15).
- **Check R and `i♯5`.** Removing `chordRolesMinor.i♯5` alone does not fail R:
  the pad then reads `chordRoles.types.minAug`, which is the intended second
  layer. Removing `types.dom7b5` fails R in both modes (6 template findings in C,
  84 Scale Mode findings over the 12 keys).
- **Snapshot:** 186 added lines, the 184 `Classes` lines and two header
  lines; nothing else changes. The pack is byte-identical.
- Translations: the nine keys are in all six locales;
  `check-translations.mjs` passes.
