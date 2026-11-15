# 06 - A strict template parser

| | |
|---|---|
| Status | proposed |
| Type | refactor |
| Size | M |
| Depends on | 00 |
| Blocks | 09 |
| Recommended model | Claude Opus 5.5 (`claude-opus-5-5`): a replacement that must reproduce every quirk of the old parser on 173 inputs, proven by a byte-identical pack, while rejecting everything the old one silently accepted |

## 1. Problem

`parseProgression()` (`modules/musicTheory.js:2791`) reads a template by
stripping characters and looking what is left up in a table:

```js
const cleanChord = chord.replaceAll(/M7|m7|7|°|dim|maj|min/g, '');
...
const degree = romanToNumber[baseChord] !== undefined ? romanToNumber[baseChord] : 0;
```

Three consequences, all measured:

1. **An unknown token is the tonic.** `II6` is not in the table, so it maps
   to degree 0 and plays C major in C. `IM7—II6—iii` renders as
   `Cmaj7 C Em`. A typo in a future template becomes a plausible chord, and
   nothing - not the audit, not the snapshot - distinguishes it from intent.
   This is the fallback the project's own comment at `getKeyOffset()`
   condemns: "A silent fallback that fabricates plausible output is worse
   than a crash."
2. **The vocabulary is seven suffixes.** No augmented (`I+` plays `I`), no
   suspended, no sixth except the hard-coded `i6`, no ninth, no
   half-diminished, no `♯5`. The catalogue cannot express the ascending line
   cliché (spec 09) or a Lydian `II6`.
3. **Dead code.** The three special cases `♯I°`, `♯II°`, `♯iv°` test
   `cleanChord` for a string containing `°`, after `°` has been stripped;
   they never match, and the general path happens to produce the right
   chord. The map entries `♭IIIM7` and `♭VIM7` are unreachable for the same
   reason. The code works by accident where it works.

The parser is only ever fed the 173 catalogue values and the special
`12-bar-blues`, so this is not a user-input problem. It is a
maintainability problem with a theory consequence: the catalogue can only
grow in the directions the stripping regex allows.

## 2. Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | A **tokenizer**: accidentals, stem, suffix, with the suffix looked up in a table derived from `CHORD_TYPE_DISPLAY`. | The display table already defines the suffix each chord type prints; reading is the inverse of printing, and a single source of truth stops the two from drifting. |
| D2 | **Unknown token throws.** | Every template is exercised by the audit and the snapshot in CI, so a throw can never reach a user through the catalogue. |
| D3 | **Output identical** for all 173 current values: same `degree`, `quality`, `alteration` per token, hence the same chords, names, numerals and voicings. Proven by pack hash and snapshot. | A parser rewrite that changed one chord would be a theory change smuggled in as a refactor. |
| D4 | `12-bar-blues` stays a special case in `generateProgressionChords()`. | Its value is a nickname, not a numeral string, and its MPC label depends on it. |
| D5 | Secondary dominants keep today's semantics (`V/x`, `V7/x`, target may carry ♭ or ♯, root a perfect fifth above the target). Secondary leading-tone chords (`vii°/x`, `vii°7/x`) are **specified but optional** (§3.5). | They are the natural next step and the grammar should leave room, but no current template needs them. |
| D6 | The numeral written in a template is **not** what the pad displays; `generateProgressionChords()` keeps building the pad's numeral from `CHORD_TYPE_DISPLAY`. | Unchanged behaviour; stated so the implementer does not "improve" it. |

## 3. Normative specification

### 3.1 Grammar

```
template   := chord ( '—' chord )*                  U+2014 separator, no spaces
chord      := applied | plain
plain      := accidental? stem suffix?
applied    := 'V' '7'? '/' accidental? stem          (secondary dominant)
           |  'vii' ('°' | '°7') '/' accidental? stem (secondary leading-tone, optional, §3.5)
accidental := '♭' | '♯'
stem       := 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII'
           |  'i' | 'ii' | 'iii' | 'iv' | 'v' | 'vi' | 'vii'
suffix     := one entry of the suffix table (§3.2), matched longest first
```

A stem is matched greedily against the seven numerals of its case; `iii`
never parses as `i` + `ii`.

### 3.2 Suffix table

Derived at module load from `CHORD_TYPE_DISPLAY`: for each chord type, the
key is `(display.lowercase ? 'lower' : 'upper', display.suffix)`. Where two
chord types share a case and suffix, the table lists the **first declared**
and the implementer adds the second to the explicit exception list below.
Known collisions in the current table and their resolution:

| Case + suffix | Candidates | Resolution |
|---|---|---|
| upper + `sus4` | `sus4`, `quartal`, `quartal4` | `sus4` |
| upper + `''` | `major`, `It6`, `Fr6`, `Ger6` | `major` |
| lower + `6` | `minor6` | (no collision; the old parser's `i6` special case folds in) |
| lower + `(maj7)` | `minMaj7` | (folds in the old `i(maj7)` special case) |

Resulting reading of the suffixes that the current catalogue uses, which the
new parser must reproduce exactly:

| Token shape | Quality |
|---|---|
| `I`, `IV`, `♭VII`, `♯II`… (upper, no suffix) | `major` |
| `i`, `vi`, `♭vi`… (lower, no suffix) | `minor` |
| upper + `7` | `dom7` |
| lower + `7` | `minor7` |
| upper + `M7` | `major7` |
| lower + `°` | `diminished` |
| lower + `(maj7)` | `minMaj7` |
| lower + `6` | `minor6` |

New shapes available after this spec, from the same table: upper `6`
(`major6`), upper `+` (`augmented`), upper/lower `sus2`, `sus4`, upper `9`
(`dom9`), lower `9` (`minor9`), upper `M9` (`major9`), upper `add9`
(`add9`), lower `add9` (`minAdd9`), lower `°7` (`dim7`), lower `ø7`
(`m7b5`), upper `7sus4` (`dom7sus4`), upper `+7` (`aug7`), upper `+M7`
(`augMaj7`), upper `6/9` (`maj6/9`), and after spec 09, lower `♯5`
(`minAug`).

Resolution rule when the table is ambiguous for a *case*: the display table
marks minor-family types `lowercase: true`; a lower-case stem may only take
a lower-case suffix and an upper-case stem only an upper-case one. `i7` is
therefore `minor7` and never `dom7`; `IM7` is `major7` and `iM7` is an
error.

### 3.3 Degree and alteration

Unchanged semantics: the stem gives the major-scale degree index 0-6; `♭`
lowers the sounding root by one semitone, `♯` raises it. The returned
object stays `{ degree, quality, alteration }` with `alteration` in
`''`, `'flat'`, `'sharp'`, plus `isSecondary`, `secondaryTarget`,
`originalChord` for applied chords, exactly as today, so
`generateProgressionChords()` needs no change.

For applied dominants the current code also computes `degree` as the
*closest* major-scale degree to the dominant's root and sets `alteration`
accordingly. Reproduce it; `V7/♭III` in C is B♭7, degree 6 flat.

### 3.4 Errors

`parseProgression()` throws on any token the grammar rejects, including an
empty token from a doubled separator and any whitespace, with a message that
names the token and the template:

```js
throw new Error(`Unparseable chord token "${token}" in template "${value}"`);
```

The audit, the snapshot tool and the pack builder let the exception
propagate; a template with a typo fails CI with the token named.

### 3.5 Optional: secondary leading-tone chords

If implemented: `vii°/x` is a diminished triad and `vii°7/x` a diminished
seventh whose root is one semitone below the target's root; `romanNumeral`
on the pad is the token verbatim, as for secondary dominants. The audit's
`romanNumeralRootPc()` must learn the `vii°/x` form (numerator root is the
target minus one semitone, not a scale degree added to the denominator).
Not required for acceptance; if skipped, the grammar still reserves the
form and the parser throws on it with a message saying it is not supported
yet.

## 4. Code changes

| File | Change |
|---|---|
| `modules/musicTheory.js:2791-2906` | replace `parseProgression()`; export a `SUFFIX_TABLE` built from `CHORD_TYPE_DISPLAY` for spec 09 to extend by adding a chord type only |
| `modules/musicTheory.js` | nothing else; `generateProgressionChords()` unchanged |
| `tools/audit-theory.mjs` | optional §3.5 only |

## 5. i18n

None.

## 6. Acceptance

1. **Pack hash.** `sha256sum pack/*.zip` before and after are identical.
   Builds are deterministic, so this proves every chord, voicing and name
   of the 839 files is unchanged.
2. **Snapshot** `--check` passes without regeneration.
3. **Parse-level equivalence**, recorded in the PR: a one-off script runs
   the old and the new parser over all 173 values and diffs the returned
   objects token by token. Zero differences. Keep the script out of the
   repository or under `tools/` marked as a one-off; the pack hash is the
   durable proof.
4. **Negative tests**, in a small CI-run script: `I—X`, `iM7`, `I—`,
   `I— V`, `♭♭II`, `V7/x` each throw with the token named. Before spec 09,
   `i♯5` throws too; after it, `i♯5` parses to `minAug` and `I♯5` throws.
5. **Positive tests** for the new shapes in §3.2, asserting quality and
   degree: `I+`, `I6`, `II6`, `Isus4`, `V7sus4`, `viiø7`, `vii°7`, `♭vi`,
   `V7/♭III`, `I—II—iii—II`.
6. `node tools/audit-theory.mjs` passes.

## 7. Out of scope

- Any change to how pads are labelled or named.
- Parsing chord *symbols* (`Cm7`) from user input; the Chord Matcher has its
  own dropdown-based path and does not parse.
