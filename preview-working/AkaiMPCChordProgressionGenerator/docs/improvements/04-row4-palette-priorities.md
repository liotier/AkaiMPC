# 04 - Row 4 honours the template's palette priorities

| | |
|---|---|
| Status | implemented |
| Type | defect |
| Size | M |
| Depends on | 00, 03 |
| Blocks | 07, 08 (recommended), 10 |
| Recommended model | Claude Sonnet 5.5 (`claude-sonnet-5-5`): one mechanism to add, priorities for eleven templates given below, effect visible in the snapshot |

## 1. Problem

The README's "Dynamic Row 4: Your Secret Weapon" section promises:

> Genre Intelligence with Palette Priorities - 100+ progressions use a
> sophisticated 3-tier weighting system (preferred, allowed, avoided) to
> prioritize genre-authentic chord voicings.

Rows 2 and 3 do this. Row 4 does not: `selectDynamicRow4Chords()`
(`modules/generation.js:375`) and `generateRow4Candidates()`
(`generation.js:95`) never receive `palettePriorities` or `paletteFilter`.
Measured, Folk/Singer-Songwriter `I—IV—I—V`, which declares

```js
preferred: ['major', 'minor'],
allowed:   ['sus2', 'sus4'],
avoided:   ['major7', 'minor7', 'dom7', 'quartal', 'augmented', 'diminished']
```

gets row 4 `G7 [V7] · A [VI] · D7 [V7/V] · Ab7 [Ger+6]` in the Classic
variant: three of four pads are the avoided quality, and one of them is a
German sixth in a folk palette.

The same mechanism defeats the cinematic aesthetic the catalogue advertises.
The `V7` candidate carries `commonUsage: 1.0` and earns the "fills a gap"
point and the "no dominant seventh yet" point, so it scores three or four
almost everywhere. Every Film/Cinematic, Trance and Electronic palette gets
`V7` and usually `V7/V` in row 4, including loops whose entire character is
the absence of a dominant (the plagal "endless motion" of Dorian and Lydian
scoring). Film/Cinematic carries no priorities at all: 0 of 7 templates.

## 2. Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Row-4 candidates get the **same three-tier priority** as palette chords, computed from `chordType` by the same rule. | One notion of "what this genre wants", applied to all sixteen pads. |
| D2 | **Avoided** candidates are excluded, not merely demoted. | A row-4 slot is one of four; demoting an avoided chord still lets it in when the pool is thin, which is the folk case above. Exclusion has a fallback (§3.2). |
| D3 | **Preferred** candidates earn one scoring point. | Parity with the "common in modern music" point; a genre's preference is at least as strong a signal. |
| D4 | The legacy hard `paletteFilter` applies to row 4 as a filter with the same fallback. | Three templates still use it; they should not behave differently from priority-bearing ones. |
| D5 | Augmented sixths and the tritone substitute are judged by their **sounding family**: `It6`, `Ger6` and `Fr6` as `dom7`, `SubV7` is already `dom7`. | The priority lists speak of sonorities; a folk template that avoids `dom7` means the A♭7 whatever its label. The French sixth is a dominant seventh with a flat fifth, and no priority list names `dom7b5`, so judging it by that type let it through every avoid list (corrected after the first attempt, §8). |
| D6 | Film/Cinematic's seven templates and the four Trance templates without priorities **receive** priorities, given in §3.4. The other 57 templates without priorities are left alone. | Those eleven are where the missing weighting is audible; a blanket pass over 57 templates is a separate data task with its own review. |
| D7 | The README sentence becomes true rather than being deleted. | It describes the intended design. |
| D8 | When fewer than four non-avoided candidates remain, the **palette's unused chords** become row-4 candidates (§3.2 step 4b). | Row 4 shares its chord list with the palette, which has already spent the borrowed chords on rows 2-3, so a template that avoids the dominant family is left with two or three candidates. The palette built more chords than it had pads for; they are what the template wants next, and they honour its priorities and filter by construction. Added after the first attempt measured the starvation (§8). |
| D9 | The avoided list and the hard filter give way in the order the **palette** gives them up: avoided candidates first, then filter-excluded ones, then a numeral already on the grid (§3.2 step 5). | D4 asks for "the same fallback". The palette's top-up ignores its filter when the filter starves it, so row 4 must be able to as well; refusing to would have given Italo-Disco `i—iv` a row 4 of one chord and three copies of the tonic. |

## 3. Normative specification

### 3.1 Priority of a candidate

Move the palette's `getChordPriority(chordType)` closure out of
`generateVariant()` into a module-level
`chordPriority(chordType, palettePriorities)` returning 3, 2 or 1 as today,
with the family mapping of D5 applied first:

```js
const SOUNDING_FAMILY = { It6: 'dom7', Ger6: 'dom7', Fr6: 'dom7' };
```

`generateRow4Candidates()` and `selectDynamicRow4Chords()` take
`palettePriorities` and `paletteFilter` as parameters; `generateVariant()`
passes the ones it resolved for the template (through spec 01's resolution).

### 3.2 Selection

In `selectDynamicRow4Chords()`, after generating candidates:

1. Drop candidates whose roman numeral is already on rows 1-3 (today's
   `fresh` filter).
2. Drop candidates excluded by `paletteFilter` (type not in the list) when a
   filter is declared.
3. Drop candidates with priority 1 (avoided).
4. Score the rest; a candidate with priority 3 gets `+1`.
4b. If fewer than four remain, fill from the palette. The candidates are the
   chords the palette built and had no pad for, `allChords.slice(chordQueueIndex)`
   in `generateVariant()`, passed in as `unusedPaletteChords` and given category
   `palette`. Skip any that is avoided, excluded by the filter, or duplicates a
   grid pad or a candidate already in the pool, by roman numeral or by
   pitch-class set (`pcSignature()`). Score them like the others, best first, and
   take only as many as reach four. A row 4 that has four candidates at step 4 is
   never touched by this step.
5. If fewer than four remain, re-admit in this order until four are reached:
   first the avoided candidates that are new to the grid (best score first), then
   the candidates the filter excluded, then candidates whose numeral is already on
   the grid. This is the palette's own top-up rule: when its filter starves it,
   `generateVariant()` sets `filterActive = false` and tops up regardless.
6. The existing category-diversity pass and the top-four fill stay.

Why 4b exists. Row 4 offers the same chords the palette places on rows 2-3: ♭VII,
♭VI, ♭III and iv are palette chords, so step 1 removes them, and `ii7` is not
offered when the progression already holds a subdominant. What is left is mostly
the dominant family and the augmented sixths, which are exactly what a template
that avoids `dom7` avoids. Folk `I—IV—I—V`, Classic: the candidates new to the
grid are V7, V7/V, V7/ii, V7/vi, V7/IV, It+6, Ger+6, Fr+6, VI and ♭II; the avoid
list removes eight and leaves VI and ♭II. Step 4b adds the palette's next two
chords, which the template allows. Measured in the key of C over the 580 variants
of the 116 templates that carry priorities or a filter, 105 variants in 25
templates have fewer than four candidates after step 3; 4b covers 85 of them and
step 5 is reached by the other 20 (§6 item 8). The first attempt, which went
from step 3 straight to step 5, filled the shortfall from the avoided list and
failed items 1 to 3 (§8).

### 3.3 Spec 05 interaction

When spec 05 has landed, its pitch-class filter is step 1b, between the
numeral filter and the type filter, and is never relaxed in step 5. When
this spec lands first, nothing changes here; 05 inserts its step. Step 4b
already compares pitch-class sets, so `pcSignature()` is introduced by this spec,
with the definition of spec 05 §3.1, and 05 reuses it.

### 3.4 Priorities to add

Film/Cinematic, all seven templates. The Heroic Theme has a V and may keep a
dominant seventh; the others may not.

```js
// I—♭VI—♭III—♭VII (Epic Trailer), i—♭VI—♭VII—i (Dark Cinematic),
// I—V—vi—♭VI—IV (Emotional Score), I—♭VII—♭VI—♭VII (Adventure),
// i—iv—♭VI—♭III (Suspense), I—♭III—♭VI—♭II (Chromatic Film):
palettePriorities: {
    preferred: ['major', 'minor', 'major7', 'add9'],
    allowed:   ['minor7', 'sus2', 'sus4', 'major9', 'minAdd9'],
    avoided:   ['dom7', 'dom9', 'diminished', 'augmented', 'quartal']
},
// i—♭III—♭VII—♭VI—V (Heroic Theme):
palettePriorities: {
    preferred: ['major', 'minor', 'dom7'],
    allowed:   ['major7', 'minor7', 'sus4', 'add9'],
    avoided:   ['diminished', 'augmented', 'quartal']
},
```

The nicknames in the comments are those of `locales/en.json`. Trance/Psytrance/Goa, the four templates without
priorities (after spec 02 their values are `i—♭VII—♭VI—♭VII`,
`i—♭II—♭VII—V`, `i—iv—i—♭VII`, `i—♭III—♭VII—IV`):

```js
palettePriorities: {
    preferred: ['minor', 'major'],
    allowed:   ['minor7', 'sus2', 'sus4', 'quartal'],
    avoided:   ['major7', 'dom7', 'diminished', 'augmented']
},
```

except `i—♭II—♭VII—V`, whose V may carry `dom7`: move `dom7` to `allowed`.

### 3.5 Colours named only by a filter

`generateVariant()` offers declared colours on each degree from
`palettePriorities.preferred` and `.allowed` only (`generation.js:689`). A
template that declares a `paletteFilter` instead never receives the extended
types its filter names: Folk/Singer-Songwriter "Post-Rock Build" (`I—V—vi—IV`)
filters to `major`, `quartal`, `major7` and has no quartal pad. Read the
filter's types into the declared colours as well. It is the only filter today
that names a type beyond triads and sevenths. Found while implementing spec 01.

### 3.6 README

In "Dynamic Row 4", replace the "Genre Intelligence with Palette Priorities"
bullet with a sentence that is now true: row 4 is chosen under the same
preferred, allowed and avoided tiers as the rest of the palette, so a folk
template never receives a dominant seventh in its spice row and a cinematic
template is not handed a dominant it set out to avoid.

## 4. Code changes

| File | Change |
|---|---|
| `modules/generation.js` | `chordPriority()` at module level; `SOUNDING_FAMILY`; new parameters on `generateRow4Candidates()` and `selectDynamicRow4Chords()`; steps 2-5 of §3.2 including 4b; `generateVariant()` passes the template's priorities and filter, and the palette's unused chords, to row 4 |
| `modules/musicTheory.js` | eleven `palettePriorities` blocks (§3.4); export `pcSignature()` |
| `README.md` | one bullet |
| `docs/catalogue-snapshot.txt` | regenerated |
| `CHANGELOG.md` | entry |

## 5. i18n

None.

## 6. Acceptance

1. Folk `I—IV—I—V`, key C, Classic: row 4 contains no `dom7`-family chord
   and no augmented sixth. Record the four pads in the PR.
2. Film/Cinematic `I—♭VI—♭III—♭VII`, key C, every style: row 4 contains no
   `V7`, `V7/V`, augmented sixth or `SubV7`.
3. Trance `i—♭II—♭VII—V`, key A: row 4 may contain `E7 [V7]`; the other
   three Trance templates' row 4 may not contain a dominant seventh.
4. Snapshot diff: row-4 lines of templates with priorities or a filter
   (105 at baseline plus the 11 added here), and rows 2-3 of the 11 that
   gained priorities. No other block changes. Any change to a priority-less
   template's row 4 is a regression.
5. Count and record the variants and templates that needed step 4b and those
   that still needed step 5.
6. Folk/Singer-Songwriter "Post-Rock Build", key C: at least one pad of type
   `quartal` (§3.5).
7. Full verification protocol passes.
8. Step 5 is reached only by the 20 variants of Modal Interchange `♭VI—iv—I` (3),
   Electronic/Modern `i—iv—v` (4), Hip-Hop/Trap `i—♭III—♭VI—♭VII` (4) and
   `i—♭VII—iv` (4), and Italo-Disco/House `i—iv` (5). They are left to spec 07,
   which makes the palette minor-key aware, and to a later decision on their
   priorities. The first three have unused palette chords, but the template
   avoids all of them except one (Electronic's `vi7`); the last two declare a
   filter so narrow that the palette's top-up fills exactly twelve pads and
   leaves nothing. Row 4 then falls back, by step 5, on the dominant chords the
   template avoids, as it did before this spec.
9. A template that carries neither priorities nor a filter generates exactly the
   variants it generated before, in every key and style.

## 7. Out of scope

- Priorities for the remaining 57 templates without them. List them in the
  PR description as a follow-up candidate, grouped by genre.
- Replacing `commonUsage` numbers. They are hand-tuned and stay.

## 8. Record of the first attempt

The first attempt implemented §3.2 as it then stood, steps 1 to 6 without 4b, and
was stopped because acceptance items 1, 2 and 3 could not be met. The maintainer's
decision, widening the pool (D5, D8, D9), is what §3 now says, and §9 records how
it was implemented. What follows is the record of why, kept as found; the
attempt itself was committed as `cd0b705`, marked as not an implementation.

What is in the attempt: `chordPriority()` and `SOUNDING_FAMILY` at module level;
`priority` and `excludedByFilter` carried on every row-4 candidate; the
preferred point in `scoreCandidate()`; steps 1-6 of §3.2 in
`selectDynamicRow4Chords()`; the eleven blocks of §3.4; the filter-named colours
of §3.5. The README bullet of §3.6 and the CHANGELOG entry are not written.

Findings, measured in the key of C:

1. **The pool starves.** Row 4's candidates are the same chords the palette
   already places on rows 2-3 (♭VII, ♭VI, ♭III and iv come from the palette's
   borrowed-chord block), so step 1 removes them, and `ii7` is not generated when
   the progression already has a subdominant. Folk `I—IV—I—V`, Classic: the
   fresh candidates are V7, V7/V, V7/ii, V7/vi, V7/IV, It+6, Ger+6, Fr+6, VI and
   ♭II; the template avoids the first seven, leaving VI, ♭II and Fr+6, three
   for four slots. §3.2's remark that step 5 "is rarely needed" counted chords
   the numeral filter removes. Of 580 variants of the 116 templates with
   priorities or a filter, **94 variants, in 25 templates, need step 5**.
2. **D5 against items 1 and 2.** `Fr6` is judged as `dom7b5`, which no avoid list
   names, so `Fr+6` always survives, and items 1 and 2 ask for no augmented sixth.
   Mapping it to `dom7` instead does not help item 1: the pool is then one
   smaller and Folk Classic row 4 reads `G7 A D7 D♭`.
3. **Step 5 misdescribes the palette.** It says the palette's top-up does not
   re-admit filter-excluded chords; it does (`filterActive = false` in
   `generateVariant()`). Applied literally, Italo-Disco `i—iv` has one eligible
   candidate and row 4 reads `Fm [iv]  C [I]  C [I]  C [I]`, Hip-Hop `i—♭VII—iv`
   repeats ♭VII and iv, and audit checks F and G report 408 findings each.
   **The departure:** the attempt follows D4, "the same fallback" as the palette,
   and re-admits filter-excluded candidates after the avoided ones and before
   a numeral already on the grid. The audit passes with it.

Result of the attempt: item 1 fails in 5 of 5 styles, item 2 in 4 of 5, item 3 in
12 of the 15 variants that must hold no dominant seventh; item 6 (Post-Rock Build
gets quartal pads) passes; the audit is clean.

Ways forward, for the maintainer: widen row 4's pool with non-dominant colours
(a minor ii, iii or vi, suspended chords on ♭VII, IV or V) so that avoided lists
can be honoured; decide `Fr6` as `dom7`; amend step 5 to the palette's top-up; or
restate items 1-3 as "fewer avoided chords than before" and accept step 5 as the
safety net.

## 9. Implementation notes

Implemented as the corrected §3 says, on top of the first attempt (`cd0b705`):
`SOUNDING_FAMILY` maps all three augmented sixths to `dom7` (D5), and
`selectDynamicRow4Chords()` gained step 4b (D8) with the re-admission order of D9,
which the first attempt already had. The palette's unused chords reach row 4 as the
seventh parameter, `generateVariant()` passing `allChords.slice(chordQueueIndex)`.

Choices inside the decisions:

- **A palette candidate scores like any other.** It carries `root`, `notes`,
  `chordType`, `chordName` and `romanNumeral` from the palette, `quality` from
  `getQualityLabel()`, category `palette`, and `commonUsage` 0.5, which earns
  neither the common-usage point nor a tiebreak. Its priority comes from the same
  `chordPriority()`. Ties between palette candidates keep the palette's order.
- **The hard filter is read on the chord type as built**, as the palette reads it,
  not on its sounding family. An augmented sixth is therefore never offered under a
  template that declares a `paletteFilter`, since no filter names `It6`, `Ger6` or
  `Fr6`. D5 applies to the priority tiers only.
- **Step 5 orders its pools as follows.** Within each re-admission tier the
  unavoided come before the avoided, then the best score. Only as many are taken as
  reach four.
- **`pcSignature()` is introduced here**, in `modules/musicTheory.js`, with the
  definition spec 05 §3.1 gives. Nothing but step 4b uses it yet.
- **Item 4's list gains Post-Rock Build.** Its rows 2-3 change by §3.5, which the
  item does not name: the quartal chords the filter lists now reach the grid.

Measured on this tree, key C:

| Quantity | Before | After |
|---|---|---|
| Templates with priorities or a filter / with neither | 105 / 68 | 116 / 57 |
| Item 1, Folk `I—IV—I—V`, Classic, row 4 | `G7 D7 A D♭` (spec 03's tree) | `A [VI]  D♭ [♭II]  Fsus4 [IVsus4]  Gsus2 [Vsus2]` |
| Item 1 in all five styles / item 2 / item 3 | | holds in 5 of 5 / 5 of 5 / 20 of 20 |
| Variants with fewer than four candidates after step 3 | | 105, in 25 templates |
| Of those, covered by step 4b / still short, so step 5 | | 85 / 20, in five templates (item 8) |
| Priority-less templates short of candidates | | 0 |
| Snapshot blocks changed, against spec 03's | | 100 of 207, all templates with settings; no scale block |
| Variants of the 57 priority-less templates that differ, 12 keys, 5 styles | | 0 of 3 420 |
| Variants of the other 116 templates that differ | | 5 387 of 6 960, of which 720 change rows 1-3: the twelve templates of §3.4 and §3.5 |
| `.progression` / MIDI files in the pack | 864 / 10 374 | 863 / 10 363 |
| Pack names carrying two styles | 1 | 2 (Pop/Rock "Creep", Smooth+Classic; Italo-Disco "Minimal House", Classic+Jazz) |

The figures in the decision were 126 variants leaking an avoided or filtered chord
and 106 covered by the unused chords. This tree measures 105 and 85. The 20 left
over, which are what item 8 names, agree. I did not find where the 21 come from; a
leak needs a short pool, so it cannot exceed the 105 counted here, which suggests a
different unit rather than a different behaviour.

Resolved afterwards, measured on `cd0b705`: the decision's 126 counted the
variants whose row 4 held an avoided or filtered chord on that commit, judging
the French sixth as a dominant seventh. That is the 94 which starved there, plus
32 whose only offending pad was a French sixth, which `cd0b705` still judged as
`dom7b5` and so selected freely. Once the French sixth is avoided, 11 of those
32 starve, which takes 94 to the 105 above, and the other 21 replace it with
another candidate from the regular pool. The two counts measure different
things; both lead to the same 20 variants at step 5.

Item 8, listed in the key of C (the counts in A and F♯/G♭ are the same 20): Modal Interchange `♭VI—iv—I` in Smooth, Classic and Modal; Electronic/Modern
`i—iv—v` in all but Jazz; Hip-Hop/Trap `i—♭III—♭VI—♭VII` and `i—♭VII—iv` in all but
Jazz; Italo-Disco/House `i—iv` in all five.

Seen and left alone. The suspended chords step 4b offers are the palette's, so they
carry the palette's labels: Folk Classic's `Fsus4 [IVsus4]` is a real suspended
chord, but Post-Rock Build's quartal pads read `Csus4 [Isus4]` and Jazz doubles the
suffix (`Isus4sus4`); both are spec 05's. The sus2 and sus4 on one root that
Trance's four templates now receive are different pitch-class sets, so spec 05's
filter will leave them.

**Item 8 after later commits.** The 20 is the count when this spec was implemented.
Spec 05's sound filter raised it to 28, adding Hip-Hop/Trap `ii7—V7—IM7` and
Synthwave/Retrowave `IM7—iii7—vi7—IVM7` (four variants each; both declare a
`paletteFilter` of `minor7`, `major7` and `dom7`), and spec 05's notes did not record
it; spec 09's Ascending Line Cliché adds five, 33 in the key of C. Measured by
counting the entries into step 5 at each commit. The two filter templates are in the
same position as the five: left to spec 07 and to a later decision on their settings.

