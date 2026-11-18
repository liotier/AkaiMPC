# 07 - Key-mode awareness for the palette and row 4

| | |
|---|---|
| Status | implemented |
| Type | defect, design |
| Size | L |
| Depends on | 00, 02, 03, 04, 05 |
| Blocks | 10 |
| Recommended model | Claude Opus 5.5 (`claude-opus-5-5`), with the checkpoint of §3.7 reviewed before the work goes on. The theory decisions are already in this spec's tables; what is left is the tooltip prose and judging the snapshot diff, which the checkpoint covers. Fable 5.2 is not required (revised 2026-11-15, after specs 02-06, 08 and 09 were implemented from their tables without it) |

## 1. Problem

Template mode has no concept of a minor key. `generateVariant()`
(`modules/generation.js:512`) fixes `scaleDegrees = getScaleDegrees('Major')`
so that roman numerals read against the parallel major, which is correct
for the *numerals*. But everything downstream treats the key as C major
even when the template is `i—♭VII—♭VI—V`. Measured in A, Metal/Rock
`i—♭VII—♭VI—V`, Classic variant, all sixteen pads:

```
 1 Am [i]     2 G [♭VII]    3 F [♭VI]     4 E [V]
 5 Bm7 [ii7]  6 Am7 [i7]    7 G7 [♭VII7]  8 F7 [♭VI7]
 9 E7 [V7]   10 Bm [ii]    11 Gbm [vi]   12 Gbm7 [vi7]
13 B7 [V7/V] 14 Dm [iv]    15 F7 [Ger+6] 16 Bb [♭II]
```

Four pads carry chords foreign to A minor in every form of it. B minor
(pads 5, 10) is the supertonic of A *major*; in A minor the supertonic is B
diminished, and only A Dorian has a B minor. F♯ minor (pads 11, 12) is the
submediant of A major and belongs to no A minor scale at all. They are
labelled `ii` and `vi` as though diatonic, with tooltips written for a major
key. Every one of the 68 minor-tonic templates in the catalogue gets these
four pads, because the palette's "complementary chords" at
`generation.js:711-718` are hard-coded `ii7`, `ii`, `vi`, `vi7` on the major
scale's degrees.

The same blindness shows in four other places:

1. **Row-4 secondary dominants** are the major key's: `V7/ii`, `V7/vi`,
   `V7/IV`, `V7/V`. In A minor, `V7/ii` is F♯7 and `V7/vi` is C♯7, whose
   targets B minor and F♯ minor are not chords of the key. The dominants a
   minor key actually uses - `V7/iv` (A7), `V7/♭III` (G7), `V7/♭VI` (C7),
   `V7/♭VII` (D7) - are never offered.
2. **Modal interchange runs one way.** The palette offers `iv`, `♭VI`,
   `♭VII`, `♭III` as chords "borrowed from the parallel minor"
   (`generation.js:732`). For a minor template these are diatonic, and the
   chords a minor key *borrows* - the Dorian `IV`, the Picardy `I`, the major
   `ii` - are never offered. The guard that was meant to stop labelling
   diatonic chords as borrowed compares against `scaleDegrees`, which is
   always Major, so it is dead code in template mode.
3. **Tooltips** (`chordRoles.♭VI` and others in `locales/*.json`) say
   "Borrowed from parallel minor" on pads that are diatonic to the minor key
   being shown.
4. **The analysis line** (`analyzeProgression()`, `app.js:690`) reports
   "Modal interchange" for every minor template, because `♭VII` contains `♭`.

Spec 02 fixed what the templates *say*; this spec fixes what the palette
*offers around them*. The two things the review video made most of - the
Dorian IV of game and film scores, and borrowing between parallel keys - are
exactly what a minor-key template cannot currently reach.

## 2. Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Every template gets a **`tonality`**: `'major'` or `'minor'`. Derived from the tonic token where there is one; **declared explicitly** on the nine templates without a tonic token (§3.1); the lint of spec 02 (check H) learns to require the declaration. | Nothing else distinguishes `i—♭VII—♭VI—V` from `I—♭VII—♭VI—V`, and that distinction drives everything below. |
| D2 | Roman numerals **keep the parallel-major convention** (`♭VII` stays `♭VII` in a minor key). Only categories, spice levels, tooltips and candidate pools become mode-aware. | Spec 02 D1. The labels are the catalogue's public contract; what changes is what the palette does with them. |
| D3 | For a minor template, the four hard-coded complements become `iiø7`, `ii°`, `v`, `v7`. | Supertonic and dominant of the natural minor. The relative major ♭III is already in the diatonic list (D4). |
| D4 | For a minor template, `♭VII`, `♭VI`, `♭III` (major) and `iv` are **diatonic**, category `diatonic`, spice 1. For a major template they stay `borrowed` with today's spice. | The dead guard, made live and correct. |
| D5 | Row-4 candidate pool is **split by tonality** (§3.3). The minor pool drops `V7/ii`, `V7/vi`, the Lydian `II` and the major `VI`; adds `IV` (Dorian), `I` (Picardy), `vii°7`, `V7/iv`, `V7/♭III`, `V7/♭VI`, `V7/♭VII`; keeps `V7`, `V7/V`, `♭II`, augmented sixths, `SubV7`. | Each dropped chord targets a degree the key does not have; each added one is a textbook minor-key device. |
| D6 | Tooltips get a **minor-key table**, `chordRolesMinor`, consulted first when the template is minor. | The same numeral means a different thing in the two modes: ♭VI is a borrowing in C major and the submediant in C minor. |
| D7 | The analysis line reports "Modal interchange" only for numerals that are borrowed **relative to the template's tonality**. | Otherwise every minor template is "modal interchange", which makes the label worthless. |
| D8 | Scale Mode is untouched. | It already derives everything from the chosen scale. |
| D9 | A new audit check **I** asserts palette diatonicity for minor templates (§3.6). | Without it this spec's central claim cannot be kept true as the catalogue grows. |

## 3. Normative specification

### 3.1 Tonality

Derivation: the first token whose stem is `I`/`i` without `/`; lower case is
`minor`, upper case `major`. Explicit `tonality` on the template object
overrides. The nine templates without a tonic token and their declarations:

| Genre | Template | tonality |
|---|---|---|
| Pop/Rock | `vi—V—IV—V` | major |
| Blues/Soul | `12-bar-blues` | major |
| Jazz/Functional | `iii—vi—ii—V` | major |
| Jazz/Functional | `IVM7—V7—iii7—vi` | major |
| Jazz/Functional | `III7—VI7—II7—V7` | major |
| Classical/Modal | `iv—♭VII—♭III—♭VI` | **minor** |
| R&B/Neo-Soul | `vi—ii—iii—IV` | major |
| Funk/Groove | `ii7—V7` | major |
| Gospel/Worship | `IV—V—iii—vi` | major |

Export `templateTonality(template)` from `modules/musicTheory.js`; spec 00's
snapshot tool and spec 02's check H switch to it. Check H gains **H3**: a
template with no tonic token and no `tonality` field is a finding.

### 3.2 Palette, minor tonality

In `generateVariant()`, when `tonality === 'minor'`:

- Complements (`generation.js:711-718`) become, in this order and with these
  spice levels: `iiø7` (type `m7b5`, spice 2), `ii°` (`diminished`, 2), `v`
  (`minor`, 1), `v7` (`minor7`, 1). Numerals via `getRomanNumeralForChord()`.
- The borrowed list (`generation.js:732`) is renamed in code to the
  mode-dependent `colourChords`. For minor: `♭VII` major spice 1, `♭VI` major
  spice 1, `♭III` major spice 1, `iv` minor spice 1, all category
  `diatonic`. For major: unchanged content and spice, category `borrowed`.
- The iv-only rule after it (`fourthQuality`) is subsumed by the list above
  and removed.
- `V7` (harmonic-minor dominant) is **not** added to the palette here; it
  stays a row-4 candidate so that minor loops that avoid dominants (spec 04)
  keep avoiding them.

Everything else in the palette (extensions of the progression's own chords,
Chord Matcher injections, the top-up when a filter starves the palette) is
unchanged. The top-up list is major-key; make it mode-dependent too
(`i`, `i7`, `iiø7`, `♭III`, `iv`, `iv7`, `v`, `v7`, `♭VI`, `♭VII` for
minor).

### 3.3 Row 4, candidate pools

`generateRow4Candidates(keyOffset, scaleDegrees, analysis, variantType, tonality, …)`.

Common to both tonalities: `V7` (when no dominant seventh present), `♭II`
(Neapolitan), `It+6` / `Ger+6` / `Fr+6` (Classic and Jazz), `SubV7` (Jazz),
`V7/V`.

Major only (today's list minus nothing): `♭VII`, `♭VI`, `♭III`, `iv`, `ii7`,
`VI`, `V7/ii`, `V7/vi`, `V7/IV`, Lydian `II` (Modal).

Minor only:

| Candidate | Type | Category | commonUsage | Note |
|---|---|---|---|---|
| `IV` | major | borrowed | 0.8 | Dorian subdominant; the Skyrim and Inception chord |
| `I` | major | borrowed | 0.5 | Picardy third; also the parallel-major tonic for a bright turn |
| `vii°7` | dim7 | dominant | 0.6 | leading-tone seventh of harmonic minor |
| `V7/iv` | dom7 | secondary | 0.6 | the minor tonic as a dominant seventh, `I7` |
| `V7/♭III` | dom7 | secondary | 0.5 | `♭VII7` |
| `V7/♭VI` | dom7 | secondary | 0.5 | `♭III7` |
| `V7/♭VII` | dom7 | secondary | 0.4 | `IV7` |
| `ii` | minor | borrowed | 0.3 | Dorian supertonic, Modal variant only |

Numerals for the secondary dominants follow the existing `V7/x` form; the
audit's `romanNumeralRootPc()` already resolves `♭` targets. Candidates that
duplicate a pad already on the grid by numeral or by pitch-class set are
removed by the filters of specs 04 and 05, which run after generation.

### 3.4 Tooltips

`locales/*.json` gain `chordRolesMinor` with at least these keys, English
text to be written by the implementer in the register of the existing
`chordRoles` entries and translated to the five other locales: `I` (Picardy
third), `i`, `II°` (used for `ii°` and `iiø7` after the existing upper-casing),
`♭III` (relative major), `IV` (Dorian subdominant, borrowed from the
parallel major), `iv`, `V` (dominant from harmonic minor), `v` (natural-minor
dominant, weak), `♭VI` (submediant, diatonic), `♭VII` (subtonic, diatonic),
`VII°` (leading-tone chord), `♭II`, `V/IV`, `V/♭III`, `V/♭VI`, `V/♭VII`.

`getChordTooltip(romanNumeral, chordType, tonality)` consults
`chordRolesMinor` first for minor templates and falls through to the
existing lookup. The pad renderer passes the tonality of the current
template; Scale Mode passes `'major'` for major-family scales and `'minor'`
otherwise, or nothing, in which case the existing behaviour holds.

### 3.5 Analysis line

`analyzeProgression()` computes `hasBorrowed` as: any progression numeral
whose accidental makes it non-diatonic to the template's tonality. For
major, any `♭` or `♯`; for minor, a `♯`, a `♭II`, an upper-case `IV`, an
upper-case `I`, or a `ii`/`II` without `°`/`ø`. Keep the string
`analysis.modalInterchange`.

### 3.6 Audit check I

For every variant of a minor-tonality template: every pad in rows 2 and 3
that is not a progression chord, not a Chord Matcher injection and not built on
the root of one of the template's progression chords (amended at the checkpoint
review, §8.1) must have
its pitch-class set contained in the union of A natural minor, A harmonic
minor and A Dorian transposed to the key (that is, the pitch classes
`{0, 2, 3, 5, 7, 8, 9, 10, 11}` relative to the tonic). Row 4 is exempt: it
is chromatic by design. Report `I minor palette offers a chord foreign to the
key` with the pad named. Expected after this spec: 0. At baseline this check
would report four pads per minor variant, roughly 16 000 findings; record
the number the implementer measures before the fix.

### 3.7 Checkpoint

After §3.1-§3.3 are implemented and before §3.4-§3.5, regenerate the
snapshot and stop for review. The diff covers all 68 minor templates' rows
2-4; the maintainer confirms the complements and the row-4 pool by reading
ten of them. Only then do the tooltip and analysis changes proceed, since
they depend on no further theory decisions.

## 4. Code changes

| File | Change |
|---|---|
| `modules/musicTheory.js` | `tonality` on nine templates; export `templateTonality()` |
| `modules/generation.js:505-760` | mode-aware complements, colour chords, top-up |
| `modules/generation.js:95-345` | split candidate pools |
| `modules/generation.js:375` | pass tonality through |
| `app.js:690`, `app.js:721` | analysis line; tooltip lookup with tonality |
| `locales/*.json` | `chordRolesMinor` in six files |
| `tools/audit-theory.mjs` | check H3; check I |
| `tools/catalogue-snapshot.mjs` | use `templateTonality()` |
| `docs/catalogue-snapshot.txt` | regenerated |
| `README.md` | "Borrowed Chords" bullet: borrowing runs both ways; a minor progression is offered the Dorian IV and the Picardy I |
| `CHANGELOG.md` | entry |

## 5. i18n

`chordRolesMinor`, about fifteen keys, six locales. `check-translations.mjs`
enforces parity.

## 6. Acceptance

1. Audit check I reports 0, pads built on the root of one of the template's own
   progression chords being exempt like the progression chords themselves; the
   baseline number is recorded in the PR. (Amended at the checkpoint review,
   §8.1.)
2. Metal/Rock `i—♭VII—♭VI—V`, key A, Classic: no pad in rows 2-3 is `Bm`, `Bm7`,
   `F♯m` or `F♯m7` (the major key's ii and vi); rows 2-3 hold `Em [v]` and a
   minor-key supertonic, `ii°` or `iiø7`. Row 4 offers `D [IV]` unless a filter or
   priority excludes it. (Amended at the checkpoint review, §8.1.)
3. Trance `i—♭VII—i—♭VI`, key A, Modal variant: row 4 contains `D [IV]`
   (Dorian) and does not contain `Gb [VI]`, `F#7 [V7/ii]` or `C#7 [V7/vi]`.
4. A major template's sixteen pads are **unchanged** from the snapshot after
   specs 03-05, except where §3.3 reordered nothing. Verify: the snapshot
   diff touches only minor-tonality blocks.
5. Tooltip on the ♭VI pad of a minor template reads the `chordRolesMinor.♭VI`
   text; on a major template it reads the existing `chordRoles.♭VI` text.
6. The analysis line for `i—♭VII—♭VI—V` no longer says "Modal interchange";
   for `i—IV—i—V` it does.
7. Full verification protocol passes; check H reports 0 including H3.

## 7. Out of scope

- Harmonic-minor or Dorian *templates*; those are data (spec 08 adds some).
- Mediant candidates (spec 10).
- Scale Mode (D8).

## 8. Implementation notes

### 8.1 Checkpoint (§3.7)

At the checkpoint, `9e6ea29`, §3.1 to §3.3 were implemented; §3.4, §3.5 and
§3.6 waited for the review. What follows is the state reported for it, then the
review's decisions.

- **§3.1.** `templateTonality()` was already exported from `modules/musicTheory.js`
  by spec 13, which needed it first, and the snapshot tool and check H already
  import it. The nine templates of the table declare their `tonality`; check H3
  reports a template that has no tonic token and no declaration, and reported the
  nine before they were declared. 74 templates are minor: the 73 derived ones and
  Classical/Modal "Plagal Cascade", `iv—♭VII—♭III—♭VI`, which moves in the
  snapshot from `major | C` to `minor | A`.
- **§3.2.** `generateVariant()` reads the tonality once and uses it for the
  complements, for `colourChords` (which replaces the borrowed list, the dead
  guard and the separate `iv` rule) and for the top-up. Palette chords carry a
  `category`, `diatonic` or `borrowed` for the colour chords, `null` otherwise;
  nothing reads it yet.
- **§3.3.** `generateRow4Candidates()` takes `tonality` after `variantType`, as
  written; `selectDynamicRow4Chords()` takes it in the same place. The major pool
  is today's, in today's order. The minor pool, in tie-breaking order: `IV`, `I`,
  `V7`, `vii°7`, `V7/V`, `V7/iv`, `V7/♭III`, `V7/♭VI`, `V7/♭VII`, the augmented
  sixths, `♭II`, `SubV7`, and `ii` in Modal.

One gap filled, to be confirmed: **the minor top-up list of §3.2 runs dry.** Its
ten chords are mostly the colour chords and complements the palette has already
offered, so a template whose `paletteFilter` keeps few of them came out with
fewer than sixteen pads: Hip-Hop/Trap "Footwork Juke" `i—♭VII—iv` and
Italo-Disco/House "Minimal House" `i—iv` with fourteen, Trance "Minimal Trance"
`i—v—♭VII` with fifteen, which audit check A and the snapshot tool refuse and
which would export a short `.progression` file. The natural minor's other three
diatonic sevenths, `♭IIIM7`, `♭VIM7` and `♭VII7`, follow the ten and are used only
when the ten are spent; that makes the minor list the counterpart of the major
one, which pairs each triad with its seventh. Every grid has sixteen pads again.

Two acceptance items cannot be met under the decisions as they stand:

1. **Item 1, check I at 0.** Before this work check I reports 11 268, not the
   estimated 16 000: the major key's `ii` and `ii7` are B minor in A, which A Dorian
   contains, so the check passes them; `vi` and `vi7` account for 7 440. After §3.1
   to §3.3 it reports 3 972, in 39 templates, and every one is an extension of the
   progression's own chords, which §3.2 leaves unchanged: `♭VI7` 1 704 (F7 in A
   minor, whose E♭ is in none of the three scales; it sounds as the German sixth),
   `♭III7` 984, `♭II7` 288, the quartal and suspended chords built on ♭VI and ♭III
   480, `♭VI9` 180, `♭vi7` 72, `iii7` 72, `♭IIsus2` 72, `♭III9` 48, `♭II9` 48. §1 lists
   four foreign pads for `i—♭VII—♭VI—V` and misses its fifth, `F7 [♭VI7]`. Reaching 0
   needs one of: check I exempting the extensions of progression chords as it
   exempts the progression chords themselves; the palette not extending ♭VI, ♭III
   and ♭II with chords that leave the key in a minor template; or a recorded
   non-zero expectation.
2. **Item 2, `Bm7b5 [iiø7]` in rows 2-3 of `i—♭VII—♭VI—V` in A, Classic.** It is not
   there under any of the five genres that list the progression, in any style.
   §3.2 gives `iiø7` spice 2, and the palette sorts by priority and then spice, so
   the eight spice-1 chords `i7`, `♭VII7`, `♭VI7`, `V7`, `v`, `v7`, `♭III` and `iv` fill
   rows 2-3 first. Across all minor variants `iiø7` reaches rows 2-3 in 1 452 of
   5 328 and is absent from 3 864; `ii°` reaches them in 780, `v` in 4 608, `v7` in
   3 156. The rest of item 2 holds: no `Bm`, `Bm7`, `F#m` or `F#m7` on any pad, `Em [v]`
   in row 3 and `D [IV]` in row 4. Item 3 holds as written.

Measured against `09b19af`:

| Quantity | Result |
|---|---|
| Major-tonality variants, twelve keys, six styles | 7 920, none different, pads, numerals, notes and spellings compared |
| Minor-tonality variants | 5 328, all different, in all 74 templates |
| Snapshot | 73 minor blocks changed, Plagal Cascade moved from C major to A minor; no major or Scale block. No progression pad changes; the 22 row-1 lines and 11 Smooth lines that change are progressions shorter than four chords, whose first row holds palette chords |
| Check I (not yet in the audit) | 11 268 before, 3 972 after |
| Row 4 over the minor variants | `vii°7` 4 420, `IV` 4 245, `V7/V` 4 112, `♭II` 3 922, `I` 1 600, `V7/iv` 1 141, `V7` 556, `SubV7` 442, `It+6` 356, `ii` 156, `V7/♭VI` 105, `V7/♭III` 49, `V7/♭VII` 16, and palette fills |
| Entries into spec 04's step 5, key C, six styles | 35 in seven templates before (spec 04's 28, plus 7 from the Pedal style), 31 in six after: Hip-Hop/Trap `i—♭III—♭VI—♭VII` no longer falls back; Electronic/Modern `i—iv—v` gains its Jazz variant |
| `.progression` / MIDI files in the pack | 1 093 / 13 123 before, 1 094 / 13 135 after; 437 `.progression` files keep their name with new content. Fusions move: "Footwork Juke" Classic and Jazz now fuse, "Minimal House" and "Minor Mediants" no longer do |
| Audit (without check I), translations, snapshot check | pass |

**Review decisions**, relayed on 2026-11-16:

1. **Check I exempts the chords built on a progression chord's root**, as it
   exempts the progression chords. §3.2 leaves those extensions unchanged on
   purpose: they are the template's own chords in the genre's colours, and the
   out-of-key ones are idiomatic minor-key chromaticism (♭VI7 resolving to V like
   an augmented sixth, ♭III7 as V7/♭VI, ♭II7 as the tritone substitute), as I7 and
   IV7 are in a major key. The check exists to catch the major key's ii and vi in
   a minor palette. Measured independently by the reviewer in A, Classic: every
   out-of-key pad in rows 2-3 sits on a progression root, 52 of 52. Expected after
   the exemption: 0. §3.6 and item 1 of §6 are amended.
2. **Item 2 is amended; `iiø7` keeps spice 2.** A half-diminished supertonic is
   foundation in minor-key jazz but colour in minor rock, metal and trance, and
   the genre's priorities decide the rest: Metal prefers diminished, hence `ii°`.
   Measured by the reviewer: `iiø7` reaches rows 2-3 in 24 of 74 minor templates,
   `ii°` in 12, `v` or `v7` in 70. Item 2 of §6 now asks for a minor-key
   supertonic, `ii°` or `iiø7`.
3. **The top-up extension is confirmed**: `♭IIIM7`, `♭VIM7` and `♭VII7` after the
   spec's ten, diatonic to natural minor and only filling short grids.

### 8.2 After the review

- **Check I** is in the audit as amended: a pad's root is read from its
  spelling (spec 13), and the progression's roots are its progression pads'.
  It reports 0. With the major key's complements put back for minor templates it
  reports 7 584, the `vi` and `vi7` pads among them; run against the tree before
  this spec, `09b19af`, the amended check reports the same 7 584, and the check as
  first written 11 268.
- **Tooltips.** `chordRolesMinor` has the sixteen keys of §3.4 in six locales,
  and `check-translations.mjs` counts it among the families reached by computed
  paths. `generateVariant()` returns the `tonality` it built the grid in; the pad
  renderer passes it to `getChordTooltip()` and puts it on each pad as
  `data-tonality`, which the hover and tap handlers read. Scale Mode passes
  nothing, so its tooltips are unchanged.
- **One correction to §3.4.** It names `i` and `I`, `iv` and `IV`, `v` and `V` as
  separate keys, but also says the existing upper-casing applies, under which `i`
  would collapse onto `I` and the minor tonic would be described as a Picardy
  third. The minor table is therefore read with the numeral's case kept: as
  written, then without quality markings (`i7` reads `i`), then upper-cased with a
  half-diminished or diminished seventh read as its triad (`iiø7` and `ii°` read
  `II°`, `vii°7` reads `VII°`), then upper-cased without markings (`V7/iv` reads
  `V/IV`). Anything else falls through to `chordRoles`.
- **Analysis line.** `isBorrowedNumeral()` in `app.js` applies §3.5, an applied
  chord judged by its numerator. The minor rule's ♯ is read as the degree's
  accidental: the ♯5 of the line cliché's `i♯5` is a chord tone, the key's own ♭6,
  and the Ascending Line Cliché is not modal interchange. The major rule is
  unchanged. Minor templates labelled "Modal Interchange": 63 of 74 before, 14
  after.
  Superseded by spec 14: §3.5's major-key rule ("any `♭` or `♯`") missed
  `iv` and `i` and called passing diminished chords borrowed. One classifier,
  `classifyProgressionChord()` in `musicTheory.js`, now serves both tonalities
  and replaces `isBorrowedNumeral()`.
- **README and CHANGELOG** as §4 asks.

Acceptance, final state:

| Item | Result |
|---|---|
| 1. Check I | 0; baseline 11 268 as first specified, 7 584 as amended |
| 2. Andalusian `i—♭VII—♭VI—V`, Metal/Rock, A, Classic | rows 2-3 `Em C Dm Bdim / Am7 G7 F7 E7` hold no `Bm`, `Bm7`, `F♯m`, `F♯m7`, and hold `Em [v]` and `Bdim [ii°]`; row 4 `D [IV]  B7 [V7/V]  B♭ [♭II]  G♯dim7 [vii°7]` |
| 3. Classic Goa `i—♭VII—i—♭VI`, A, Modal | row 4 `D [IV]  G♯dim7 [vii°7]  B♭ [♭II]  A [I]`, no `VI`, `V7/ii` or `V7/vi` |
| 4. Major templates unchanged | 0 of 7 920 major variants differ from `09b19af`; the snapshot diff touches only minor blocks |
| 5. ♭VI tooltip | `chordRolesMinor.♭VI` on the Andalusian, `chordRoles.♭VI` on `I—V—vi—IV` |
| 6. Analysis line | none on `i—♭VII—♭VI—V`, "Modal Interchange" on `i—IV—i—V` |
| 7. Protocol | audit with H3 and I, translations, pack build and snapshot check pass |

Items 5 and 6 and the other minor tooltips were run in headless Chromium against
a local server: 30 checks pass, the page logs no error. The script is not
committed.

Measured against `09b19af`, in addition to §8.1's table, which still holds: the
pack is byte-identical to the checkpoint's build, 1 094 `.progression` and 13 135
MIDI files, and the snapshot is unchanged since the checkpoint.

