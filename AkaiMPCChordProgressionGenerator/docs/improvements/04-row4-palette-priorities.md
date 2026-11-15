# 04 - Row 4 honours the template's palette priorities

| | |
|---|---|
| Status | proposed |
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
| D5 | Augmented sixths and the tritone substitute are judged by their **sounding family**: `It6`, `Ger6` as `dom7`, `Fr6` as `dom7b5`, `SubV7` is already `dom7`. | The priority lists speak of sonorities; a folk template that avoids `dom7` means the A♭7 whatever its label. |
| D6 | Film/Cinematic's seven templates and the four Trance templates without priorities **receive** priorities, given in §3.4. The other 57 templates without priorities are left alone. | Those eleven are where the missing weighting is audible; a blanket pass over 57 templates is a separate data task with its own review. |
| D7 | The README sentence becomes true rather than being deleted. | It describes the intended design. |

## 3. Normative specification

### 3.1 Priority of a candidate

Move the palette's `getChordPriority(chordType)` closure out of
`generateVariant()` into a module-level
`chordPriority(chordType, palettePriorities)` returning 3, 2 or 1 as today,
with the family mapping of D5 applied first:

```js
const SOUNDING_FAMILY = { It6: 'dom7', Ger6: 'dom7', Fr6: 'dom7b5' };
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
5. If fewer than four remain after steps 1-3, re-admit in this order until
   four are reached: first the avoided candidates (best score first), then
   candidates whose numeral is already on the grid. Never re-admit a
   filter-excluded candidate; the palette's own top-up rule does not either.
6. The existing category-diversity pass and the top-four fill stay.

Measured pool size without any filter is 12 to 16 candidates depending on
variant; Folk's avoidance list removes nine (V7, four secondary dominants,
three augmented sixths, SubV7) and leaves ♭VII, ♭VI, ii7, iv, VI, ♭III, ♭II,
so step 5 is rarely needed. Record in the PR how many templates hit step 5.

### 3.3 Spec 05 interaction

When spec 05 has landed, its pitch-class filter is step 1b, between the
numeral filter and the type filter, and is never relaxed in step 5. When
this spec lands first, nothing changes here; 05 inserts its step.

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
| `modules/generation.js` | `chordPriority()` at module level; `SOUNDING_FAMILY`; new parameters on `generateRow4Candidates()` and `selectDynamicRow4Chords()`; steps 2-5 of §3.2; `generateVariant()` passes the template's priorities and filter to row 4 |
| `modules/musicTheory.js` | eleven `palettePriorities` blocks (§3.4) |
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
5. Count and record the templates that needed the fallback of §3.2 step 5.
6. Folk/Singer-Songwriter "Post-Rock Build", key C: at least one pad of type
   `quartal` (§3.5).
7. Full verification protocol passes.

## 7. Out of scope

- Priorities for the remaining 57 templates without them. List them in the
  PR description as a follow-up candidate, grouped by genre.
- Replacing `commonUsage` numbers. They are hand-tuned and stay.

## 8. Implementation attempt (blocked, not implemented)

Status stays **proposed**: acceptance items 1, 2 and 3 cannot be met by the
mechanism of §3.2, and the maintainer's decision is needed. The attempt is
committed so the work is not lost; it does what the spec says except for one
departure, below, and it fails those three items.

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
