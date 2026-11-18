# 05 - Pads that duplicate a chord or misname it

| | |
|---|---|
| Status | implemented |
| Type | defect |
| Size | M |
| Depends on | 00 |
| Blocks | 07, 10 |
| Recommended model | Claude Sonnet 5.5 (`claude-sonnet-5-5`): two filters keyed on a pitch-class signature, one whitelist deleted, a fix to the Jazz upgrade, two chord types renamed and two audit checks added, all with the decisions already made |

## 1. Problem

`../mpc-export-specification.md` §7.11 records 1 227 pairs of pads within one
variant that hold byte-identical notes, classifies every pair as "the same
sonority under two functionally correct labels" and closes with:

> All of it is now a design question - whether a 16-pad grid should spend two
> pads on one sonority to show two functions - not a bug, and out of scope
> here.

`tools/audit-theory.mjs` whitelists the eleven pair kinds in
`KNOWN_FUNCTIONAL_TWINS` so that check F passes.

This spec answers the design question: no. From the player's seat a grid
with two pads that sound identical is a fifteen-pad grid. The function a
chord serves is already carried by the roman numeral on the pad; the second
pad adds a label and removes a chord. The German sixth against ♭VI7 alone
accounts for most of it, and in a Film/Cinematic palette it means an A♭7 at
pad 7 and the same A♭7 at pad 15.

Measured today over 10 380 variants (the §7.11 figure has drifted):

| Pair | Count | Where the later pad sits |
|---|---|---|
| `Ger+6` + `♭VI7` | 832 | row 4 |
| `SubV7` + `♭II7` | 119 | row 4 |
| `I7` + `V7/IV` | 81 | row 4 |
| `II7` + `V7/V` | 60 | row 4 |
| `V7/ii` + `VI7` | 48 | row 4 |
| `isus4` + `ivsus2`, `IVsus2` + `Isus4` | 96 | rows 1-3 |
| `isus4sus4` + `ivsus2sus2`, `IVsus2sus2` + `Isus4sus4` | 24 | rows 1-3 |
| `V/ii` + `VI`, `II` + `V/V` | 5 | row 4 |
| **Total** | **1 265** | 1 085 in row 4, 180 inside rows 1-3 |

Three causes, three fixes. Row 4 is deduplicated against rows 1-3 by roman
numeral only (`generation.js:383`), so a chord reached under a second name
passes. The palette's `addChord()` (`generation.js:579`) deduplicates by
roman numeral too, so suspended chords that are inversions of each other
both get in.

The third is a labelling defect, and it belongs to the Jazz variant, not to
the palette. The seventh-upgrade at `generation.js:895` maps only `minor`,
`major`, `diminished` and `augmented` to a seventh chord, then appends the
suffix of the resulting type to the numeral instead of replacing the old
one. A `dom9`, `minor9`, `sus2`, `sus4`, `quartal` or `minor6` pad passes its
`!chordType.includes('7')` guard but is not upgraded, so it gets its own
suffix a second time: `i9` becomes `i99`, `V9/V` becomes `V99/V`, `Isus4`
becomes `Isus4sus4`. A diminished pad gets the seventh's suffix after the
triad's: `vii°` becomes `vii°ø7`. The chord underneath is correct, which is
why checks D and E cannot see it, and it is what produces the `sus4sus4`
pairs in the table above.

Found by the snapshot of spec 00, which first made it visible. Measured over
the whole catalogue in the key of C, comparing each numeral's suffix with
`getRomanSuffix(pad.chordType)`: **168 pads in 88 variants, all of them Jazz**
(Smooth, Classic, Modal and Experimental have none).

| Chord type | Pads |
|---|---|
| `minor9` | 58 |
| `dom9` | 42 |
| `sus2` | 23 |
| `sus4` | 22 |
| `quartal` | 10 |
| `dom13` | 9 |
| `m7b5` (upgraded from `diminished`) | 2 |
| `minor11` | 1 |
| `minor6` | 1 |

A fourth defect, also a label, decided separately on 2026-11-15. The two
quartal chord types are named as suspended chords. `quartal`, C F B♭, is
exported as `Csus4`, and `quartal4`, C F B♭ E♭, as `Csus4(add11)`. A sus4
chord is root, fourth and fifth, so `Csus4` tells a player to play G where
the pad sounds B♭, and `sus4(add11)` contradicts itself, since the 11th is
the 4th. The wrong name reaches the chord name of every exported file, which
is what Pad Perform shows on the pad, as well as the app's pad label and the
numeral (`Isus4`). The guitar diagram falls back to a sus4 shape. Measured in
the key of C over the five styles: 70 `quartal` pads in 35 variants of 7
templates, and 12 in Scale Mode across 9 scales. `quartal4` reaches no pad
today.

It is not only a label. `quartal` and `sus4` share the numeral suffix
`sus4`, and `addChord()` drops a chord whose numeral is already taken, so a
template that declares both loses its quartal pad: Trance/Psytrance/Goa
"Harmonic Minor Psy" has none. Given a numeral of its own in a scratch copy,
the pad appears. The audit could not see any of this, because check C
compares a name's suffix with `CHORD_NAME_SUFFIX` and the table itself was
wrong. Two chord types sharing one suffix is the pattern to forbid.

## 2. Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Identity of a pad, for de-duplication, is its **pitch-class set**, in addition to its roman numeral. | Two pads with the same pitch classes sound the same chord whatever the voicing style does to octaves; the voicing styles run after this check. |
| D2 | Applies to **both** the palette (`addChord`) and row 4. | 180 of the pairs are inside rows 1-3. |
| D3 | `KNOWN_FUNCTIONAL_TWINS` is **deleted** and check F becomes strict. | A whitelist that says "these duplicates are fine" is what let the count drift from 1 227 to 1 265 unnoticed. |
| D4 | Progression chords are **exempt** from the check against each other, as today. | A template may legitimately repeat a chord (`I—IV—I—V`, the 12-bar blues); those pads are the progression, not the palette. |
| D5 | A numeral whose suffix is not exactly its chord type's suffix (`sus4sus4`, `i99`, `vii°ø7`) is a defect to fix, not a label to tolerate. | It produces a numeral nobody writes. |
| D6 | Quartal chords take seventh-chord symbols, the maintainer's choice among three options: `quartal` is **`7sus4(no5)`** (`C7sus4(no5)`) and `quartal4` is **`m7(11)`** (`Cm7(11)`). | Standard symbols any player reads. C F B♭ is how jazz players voice a 7sus4 with the fifth left out, the same way the catalogue already exports an Italian sixth, which also lacks its fifth, as `Ab7`. Four stacked fourths read as a minor eleventh, as the So What chord does (https://en.wikipedia.org/wiki/So_What_chord), and the engine already classes `quartal4` as minor. `(no5)` keeps `quartal` distinct from `dom7sus4`, which already owns `7sus4`: four Scale Mode grids hold both on one root and would otherwise show two `C7sus4` pads that sound different. Rejected: a slash name of the sus chord each one inverts (`Fsus4/C`), which clashes with how the app shows inversions and has no readable four-note form; and a descriptive `C4ths`, which no player or tool reads as a chord symbol. |
| D7 | No two chord types share a chord-name suffix, nor a numeral suffix in the same case, except the augmented sixths, which deliberately take the name of the dominant-family chord they sound like. Enforced by audit check M. | A shared suffix is what hid the quartal defect, and what made the palette drop the quartal pad. |

## 3. Normative specification

### 3.1 Signature

```js
const pcSignature = notes => [...new Set(notes.map(n => ((n % 12) + 12) % 12))].sort((a, b) => a - b).join(',');
```

Place it in `modules/musicTheory.js` as an export; `tools/audit-theory.mjs`
has an equivalent and should import this one.

### 3.2 Palette

In `generateVariant()`, maintain `usedSignatures`, seeded with the
signatures of the progression chords. `addChord()` returns without adding
when the candidate's signature is present, and records it when adding. The
roman-numeral set stays as a second key; both must be new.

Fix the wrong suffix at its source, which is the Jazz seventh-upgrade in
`generateVariant()` (`generation.js:895`), not the palette. Upgrade a pad only
when its chord type is one of the four the block maps (`minor`, `major`,
`diminished`, `augmented`) and leave every other pad exactly as the palette
built it. When it does upgrade, replace the old type's suffix on the numeral
instead of appending the new one: remove `getRomanSuffix` of the old type
from the end of the stem (before the slash, for an applied chord), then add
that of the new type, so `vii°` becomes `viiø7` and `III+` becomes `III+7`.
The guard `!chordType.includes('7')` is not a substitute for this, since
`dom9` and `minor9` pass it. Under D1 the twin pads would be removed anyway;
the fix is so that the label on a *surviving* pad is right.

### 3.3 Row 4

In `selectDynamicRow4Chords()`, compute the signature set of
`existingChords` (rows 1-3) and drop every candidate whose signature is in
it, immediately after the roman-numeral filter. Also drop a candidate whose
signature matches a candidate already selected for row 4. These two filters
are never relaxed by the fallback; the fallback of spec 04 §3.2 step 5
re-admits numeral-duplicates and avoided chords, not sound-duplicates.

If the pool still has fewer than four, the existing tonic filler applies.
Record in the PR whether it was reached anywhere (it should not be).

### 3.4 Audit

Delete `KNOWN_FUNCTIONAL_TWINS`. Check F reports every duplicate signature
within a variant except pairs where both pads are progression chords.
Expected count after this spec: 0.

Add check **K**: a pad's roman numeral carries exactly its chord type's
suffix. Read the numeral as accidentals, stem and suffix, with the suffix
sitting before the slash on an applied chord (`V7/ii`), and compare the suffix
with `getRomanSuffix(pad.chordType)`. `It+6`, `Fr+6`, `Ger+6` and `SubV7` stay
exempt, as they are in checks D and E. At baseline it reports 168 in the key
of C, all Jazz; after this spec it reports 0. Tested the way spec 02's check H
is: revert the Jazz fix temporarily and the check must fail.

### 3.5 Quartal chord names

In `modules/musicTheory.js`:

| Table | Type | Today | After |
|---|---|---|---|
| `CHORD_NAME_SUFFIX` | `quartal` | `sus4` | `7sus4(no5)` |
| `CHORD_NAME_SUFFIX` | `quartal4` | `sus4(add11)` | `m7(11)` |
| `CHORD_TYPE_DISPLAY` | `quartal` | label `Suspended`, suffix `sus4` | label `Quartal`, suffix `7sus4(no5)` |
| `CHORD_TYPE_DISPLAY` | `quartal4` | label `Suspended`, suffix `sus4` | label `Quartal`, `lowercase: true`, suffix `7(11)` |

`CHORD_INTERVALS` does not change: the notes were right, only the names were
wrong. A quartal pad on I in C then reads `C7sus4(no5)` `[I7sus4(no5)]`. On a
minor degree its numeral keeps the degree's case, as every suspended chord's
does, since a quartal triad has no third: `ii7sus4(no5)`. A `quartal4` pad on
ii would read `Dm7(11)` `[ii7(11)]`.

The new names are ASCII, as `CHORD_NAME_SUFFIX` requires for the MPC.
`C#7sus4(no5)` is 12 characters, one fewer than the `C#sus4(add11)` the
catalogue could already emit.

Three places read these types and must follow:

- **Tooltips.** `getChordTooltip()` (`app.js:735`) finds a pad's description
  by stripping the quality from its numeral. Add `\(NO5\)` and `\(11\)` to
  that pattern, so `I7sus4(no5)` and `ii7(11)` strip to `I` and `II` and get
  their degree's description first, like every other pad. The existing
  `chordRoles.types.quartal` text ("Stacked fourths - open and modal...")
  stays the fallback.
- **Guitar.** `SHAPE_FALLBACKS` in `modules/guitarChords.js` keeps
  `quartal -> sus4`, because the library has no 7sus4 shape; the diagram is
  flagged as simplified, as every fallback is. Add `quartal4 -> minor7`, which
  shares three of its four notes, so a future `quartal4` pad does not get the
  muted-strings diagram.
- **Audit check M**, static, beside check L: every pair of chord types sharing
  a `CHORD_NAME_SUFFIX` value is a finding, as is every pair sharing a
  `CHORD_TYPE_DISPLAY` suffix with the same `lowercase` flag. `It6`, `Ger6` and
  `Fr6` are exempt in both: their names deliberately match `dom7` and
  `dom7b5`, and their numerals are fixed strings never built from the table.
  `CHORD_TYPE_DISPLAY` is not exported today; export it, or a read-only view of
  it. At baseline the check reports 4 pairs, all quartal; after this spec, 0.
  Tested the usual way: give `quartal` back the `sus4` suffix and the check
  must fail.

### 3.6 Documentation

`../mpc-export-specification.md` §7.11 is historical; do not rewrite it.
Add one sentence at its end pointing to this spec as the later decision.
Update the README "All 16 pads are unique" bullet to say unique in sound,
which it now is.

## 4. Code changes

| File | Change |
|---|---|
| `modules/musicTheory.js` | export `pcSignature()` |
| `modules/generation.js:579-640` | `usedSignatures` in `addChord()` |
| `modules/generation.js:895-915` | Jazz upgrade: upgrade only the four mapped types, replace the old suffix |
| `modules/generation.js:375-420` | signature filters in row-4 selection |
| `modules/musicTheory.js` (`CHORD_NAME_SUFFIX`, `CHORD_TYPE_DISPLAY`) | quartal names (§3.5); export the display table for check M |
| `modules/guitarChords.js` | `quartal4` fallback |
| `app.js:735` | tooltip stripping pattern learns `(NO5)` and `(11)` |
| `tools/audit-theory.mjs` | delete the whitelist; import `pcSignature()`; checks K and M |
| `docs/mpc-export-specification.md` | one sentence after §7.11 |
| `README.md` | one bullet |
| `docs/catalogue-snapshot.txt` | regenerated |
| `CHANGELOG.md` | entry: the duplicate-pad count, 1 265 to 0, and quartal chords named for what they are |

## 5. i18n

None.

## 6. Acceptance

1. A script equivalent to the measurement in §1 (iterate all variants,
   count duplicate signatures excluding progression-progression pairs)
   reports **0**. Record the number in the PR.
2. `node tools/audit-theory.mjs` passes with no whitelist in the file.
3. Snapshot diff: pads change only where a duplicate was removed and the
   next chord in the queue moved up, or where row 4 chose a different
   candidate. The implementer verifies on three templates by hand, one of
   each: a `Ger+6` case (any Film/Cinematic template, Classic), a `SubV7`
   case (any template, Jazz), a suspended case (Folk `I—IV—I—V`, whose
   priorities allow `sus2` and `sus4`).
4. Audit check K reports 0, and no pad anywhere carries a numeral containing
   `sus4sus4`, `sus2sus2`, `99`, `66` or `°ø7`.
5. Every pad of type `quartal` is named with the suffix `7sus4(no5)` and
   carries it in its numeral; no `quartal` or `quartal4` pad is named or
   numbered `sus4`. Record the number of renamed pads (70 in template mode
   and 12 in Scale Mode at baseline, key of C).
6. Trance/Psytrance/Goa "Harmonic Minor Psy", key C, Classic: at least one
   pad of type `quartal`, which it lacked while its numeral was taken.
7. Audit check M reports 0, and fails when `quartal` is given back `sus4`.
8. Hovering a quartal pad on I shows the tonic's description, as before.
9. Full verification protocol passes.

## 7. Out of scope

- Deduplicating across variants. Five styles of one template are five
  voicings of the same chords by design.
- Enharmonic spelling of the surviving pad. When the ♭VI7 survives and the
  German sixth does not, the pad reads `Ab7 [♭VI7]`, which is correct.
- How the Finder reads a quartal chord. It names C F B♭ as Fsus4 over C,
  which is also correct: the same notes form an inversion of Fsus4. The Finder
  is another tool, left alone (spec 12, which would have touched it, was dropped).
- The note names printed on each pad. The app spells every chord as a stack
  of thirds, so a quartal chord reads C E♯ A♯; sus, sixth and 7sus4 chords
  suffer the same way. It is recorded in the index as a finding of its own.
- Real quartal shapes in the guitar library.

## 8. Implementation notes

Implemented as specified, with the choices and findings below.

- **Where.** `pcSignature()` was introduced by spec 04, which needed it first.
  `addChord()` in `generateVariant()` keeps `usedSignatures`, seeded with the
  progression's own chords, and refuses a chord whose numeral or sound is taken.
  The Jazz upgrade is a table, `JAZZ_SEVENTH`, of the four triads it touches; the
  new suffix replaces the old one before the slash. `CHORD_NAME_SUFFIX` and
  `CHORD_TYPE_DISPLAY` carry the quartal names of §3.5, and the latter is exported
  directly, which §3.5 allows. The tooltip pattern, the guitar fallback and checks
  F, K and M are as written; `KNOWN_FUNCTIONAL_TWINS` is gone from the audit.
- **Row 4 keeps its sounds in score order.** §3.3 drops a candidate whose sound
  matches one "already selected". Applied at the end of selection, that would let
  two sound-alike candidates count as two toward the four and leave three pads. A
  single `keep()` admits each candidate best score first, at the pool, at step 4b
  and at step 5, and records its sound, so what is kept never repeats a sound; the
  grid's own sounds are removed up front and never come back. The result is the
  same as §3.3's wording whenever no two candidates sound alike.
- **The tonic filler is not reached.** In 10 380 variants, 12 keys and 5 styles,
  row 4 always found four candidates.
- **The numeral guard on the Jazz upgrade stays.** An upgrade whose numeral the
  palette already carries is skipped, as before. The upgrade happens after the
  palette's sound check, and no sound-alike pair arises from it: check F reports 0.
- **The new checks were seen to fail.** With the old Jazz upgrade put back, K
  reports 2 484 findings, the number measured above. With the sound filters taken out
  of the palette and row 4, F reports 599. With `quartal` given back `sus4`, M reports
  its name pair and its numeral pair, one each.
- **Scale Mode changes by more than the rename.** Nine of its 34 snapshot blocks
  change. The 12 quartal pads are renamed; three more pads appear. `fillGaps()` in
  `generateScaleExploration()` offers a colour only if its numeral is unused, and
  the quartal chords' numeral `Isus4` was always taken by the real sus4 chord, so
  they were never offered. With their own numerals they are, and they replace
  repeats: Locrian and Locrian ♯2 pad 16, `Cm7b5`, a copy of pad 9, becomes
  `Cm7(11)`, and Insen pad 14, a third `Cm7`, becomes `Cm7(11)`. Scale Mode still
  repeats chords elsewhere (Insen's `Cm7` twice more); §7 leaves it alone.

Measured against the parent commit (`ff22ca0`), 12 keys and 5 styles unless said:

| Quantity | Before | After |
|---|---|---|
| Duplicate-sounding pairs (progression-progression excluded) | 455: 275 in row 4, 180 in rows 1-3 | 0 |
| Same count at `0593d6d`, the baseline of the series | 1 265: 1 085 and 180 | |
| Check K, numeral suffix against chord type | 2 484 pads in 1 176 variants; 207 in 98 in the key of C | 0 |
| Numerals containing `sus4sus4` / `sus2sus2` / `99` / `66` / `°ø7` | 612 / 384 / 1 140 / 12 / 24 | 0 / 0 / 0 / 0 / 0 |
| Check M, shared suffixes | 4 pairs: one name, three numeral | 0 |
| Quartal pads in template mode, key of C | 122 in 40 variants of 8 templates, all named `sus4` | 144 in 57 variants of 12 templates, all named `7sus4(no5)` |
| Quartal pads in Scale Mode, key of C | 12 in 9 scales | 15 in 9 scales |
| Snapshot blocks changed | | 105 template blocks and 9 of 34 scale blocks |
| `.progression` / MIDI files in the pack | 863 / 10 363 | 855 / 10 267 |
| Pack names carrying two styles | 2 | 10 |

Across all twelve keys, template mode and Scale Mode together, the 1 872 `quartal`
pads and 36 `quartal4` pads all carry `7sus4(no5)` and `m7(11)` in their name and
`7sus4(no5)` and `7(11)` in their numeral; none is named or numbered `sus4`.

Why the quartal count grows: the palette no longer drops the quartal chord for
sharing a numeral with a suspended one, so 22 more appear in template mode; this is
acceptance item 6 at work. Why two-style names grow: the Jazz style's doubled
suffixes (`Iadd9add9`) used to make its numerals differ from Classic's, and the two
now coincide in eight more templates, Film/Cinematic's among them.

Case by case, key C, parent against this commit (acceptance item 3). The `Ger+6`
and `♭VI7` pair, the first row of §1's table, no longer occurs at the parent
commit: spec 03's classifier and spec 04's priorities removed it, so the cases
below stand for the other kinds.

- **`SubV7` and `♭II7`**, Jazz/Functional `IM7—♭IIIM7—♭VIM7—♭II7`, Jazz. Pad 4 is the
  progression's `D♭7 [♭II7]`, and row 4 held `D♭7 [SubV7]` at pad 15, in
  `D7  B♭  D♭7  A♭7 [It+6]`. Now row 4 is `D7 [V7/V]  B♭ [♭VII]  A♭7 [It+6]  Fm [iv]`:
  the `SubV7` is gone and the next candidate, `Fm [iv]`, has moved up.
- **`I7` and `V7/IV`**, R&B/Neo-Soul `IM7—V7/IV—IVM7—iv`, Classic. Pad 2 is the
  progression's `C7 [V7/IV]`, and the palette repeated it as `C7 [I7]` at pad 6.
  The palette's copy is gone, the queue moves up one place, and row 4 changes from
  `B♭  A♭  D7  A♭7 [It+6]` to `D7 [V7/V]  A♭ [♭VI]  A♭7 [It+6]  D♭ [♭II]`.
- **Suspended**, Trance `i—iv—V—♭VI`, Classic, in place of the Folk `I—IV—I—V` the
  item names, which holds no sound-alike pair at the parent commit. Pads 9-12 were
  `Csus2  Csus4  Fsus2 [ivsus2]  Fsus4 [ivsus4]`: `Fsus2` is the same three notes as
  `Csus4`, and `Fsus4` the same as the quartal chord C F B♭. The later of each pair
  is dropped, and `C7sus4(no5) [i7sus4(no5)]` and `F7sus4(no5) [iv7sus4(no5)]`, which
  the shared `sus4` numeral had been hiding, take pads 11 and 12. Reggae/Dub `I—IV`
  loses `Fsus2 [IVsus2]` in the same way.

Acceptance item 8 was run in headless Chromium: Post-Rock Build's `C7sus4(no5)
[I7sus4(no5)]` pad carries the tonic's description, its `V`, `vi` and `IV`
neighbours carry theirs, and the page logged no error. The script is not committed.

Not done, and not this spec's: the note names printed on each pad still spell a
quartal chord as a stack of thirds (index, §7).
