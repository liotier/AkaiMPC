# 07 - Key-mode awareness for the palette and row 4

| | |
|---|---|
| Status | proposed |
| Type | defect, design |
| Size | L |
| Depends on | 00, 02, 03, 04, 05 |
| Blocks | 10 |
| Recommended model | Claude Fable 5.2 (`claude-fable-5-2`): changes the sounding content of 68 templates' palettes, every added or removed candidate is a theory decision with alternatives, and the acceptance test is partly new. Opus 5.5 is acceptable with a maintainer review at the checkpoint in §3.7 |

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
that is not a progression chord and not a Chord Matcher injection must have
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

1. Audit check I reports 0; the baseline number is recorded in the PR.
2. Metal/Rock `i—♭VII—♭VI—V`, key A, Classic: no pad reads `Bm`, `Bm7`,
   `Gbm`/`F#m` or `Gbm7`/`F#m7`. Pads in rows 2-3 include `Bm7b5 [iiø7]` and
   `Em [v]`. Row 4 offers `D [IV]` unless a filter or priority excludes it.
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
