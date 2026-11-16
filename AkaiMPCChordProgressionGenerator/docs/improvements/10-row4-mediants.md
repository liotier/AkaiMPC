# 10 - Row 4: chromatic mediants and mode flips

| | |
|---|---|
| Status | in progress: §3.1 to §3.3 done, blocked on acceptance items 1, 3 and 5 (§8) |
| Type | feature |
| Size | M |
| Depends on | 03, 04, 05, 07 |
| Recommended model | Claude Opus 5.5 (`claude-opus-5-5`): a new candidate family whose scoring must be weighed against five existing categories, with a per-template hint mechanism and a tooltip lookup change |

## 1. Problem

The device the review found most characteristic of film and game scoring is
the chromatic mediant: from a triad, move to the triad of the same quality
whose root is a third away, sharing one note (from C major: E, E♭, A and A♭
major). The generator can only reach it through templates. Row 4, the
"spice" row that exists to offer what the progression lacks, offers `♭VI`,
`♭III` and a major `VI` under the categories `borrowed` and `borrowed`, never
the upward major third `III`, never the minor-key mediants, never the
hexatonic pole. After spec 07 the minor pool does not offer mediants at all.

The second device, mode mixture on a single chord - the same root with the
third flipped, F major to F minor, the minor iv in a major key, the major IV
in a minor one - is offered only as `iv` for major templates and `IV` for
minor ones. Flipping the tonic (the Picardy third and its reverse) or any
other progression chord is not available.

Both are one-step relations from a chord already on the grid, which is
exactly what a palette for improvisation should hold.

A related defect in the tooltip layer: `getChordTooltip()` (`app.js:721`)
upper-cases the numeral before looking up `chordRoles`, so a major `VI` pad
is described with the text written for `vi`, "Submediant - relative minor".
The upward `III` added here would be described as a "weaker predominant".

## 2. Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | New row-4 category **`mediant`**: the four same-quality chromatic mediants of the tonic, plus the hexatonic pole. `♭VI`, `♭III` and `VI` move from `borrowed` into it for major templates. | They are one family and should compete as one in the diversity pass; today two of them compete under `borrowed` against `iv` and `♭VII`. |
| D2 | New row-4 category **`modeFlip`**: for every distinct progression chord of major or minor family, the same root with the opposite third. | The video's "modal interchange" trick generalised; costs nothing per candidate. |
| D3 | Templates may carry an optional **`row4`** hint: `{ prefer: [categories], avoid: [categories] }`. Preferred categories earn a point, avoided ones are excluded with the usual fallback. Default when absent: today's behaviour. | Film/Cinematic wants mediants and flips and not secondary dominants; Jazz wants the opposite. A per-template hint is cheaper and more honest than retuning `commonUsage`. |
| D4 | Film/Cinematic templates (the seventeen after spec 08, eighteen after 09) receive `row4: { prefer: ['mediant', 'modeFlip'], avoid: ['secondary', 'augmented6th'] }`. No other genre is tagged in this spec. | That is the genre whose palette the review found wanting. |
| D5 | Tooltip lookup tries the **exact-case numeral first**, then the upper-cased one. `chordRoles` gains lower-case keys where the meaning differs (`vi`, `iii`, `♭vi`, `♭iii`) and the upper-case `VI`, `III` entries are rewritten for the major chords they now describe. | The case of a numeral is its quality; discarding it loses the meaning. |

## 3. Normative specification

### 3.1 Mediant candidates

Relative to the tonic root `t` (semitones, parallel-major convention for the
numeral):

Major tonality:

| Candidate | Root | Type | Numeral | commonUsage |
|---|---|---|---|---|
| upward major third | t+4 | major | `III` | 0.6 |
| downward major third | t+8 | major | `♭VI` | 0.8 (existing) |
| upward minor third | t+3 | major | `♭III` | 0.5 (existing) |
| downward minor third | t+9 | major | `VI` | 0.6 (was 0.8 under `borrowed`) |
| hexatonic pole | t+8 | minor | `♭vi` | 0.4 |

Minor tonality (spec 07's pool):

| Candidate | Root | Type | Numeral | commonUsage |
|---|---|---|---|---|
| upward major third | t+4 | minor | `iii` | 0.5 |
| downward major third | t+8 | minor | `♭vi` | 0.6 |
| upward minor third | t+3 | minor | `♭iii` | 0.5 |
| downward minor third | t+9 | minor | `vi` | 0.4 |
| hexatonic pole | t+4 | major | `III` | 0.4 |

Numerals follow `getRomanNumeralForChord()` with the accidental prefixed,
as `generateProgressionChords()` does; the audit's checks D and E then hold
by construction. Note that for a minor tonic the hexatonic pole is the major
triad on the raised mediant - the chord the twelve broken templates of spec
02 produced by accident.

### 3.2 Mode-flip candidates

For each distinct sounding root among the progression chords whose
`getChordFamily()` is `major` or `minor`: a triad on the same root with the
other family. Numeral: the progression chord's numeral stem with case
inverted and no suffix (`IV` becomes `iv`, `♭VI` becomes `♭vi`, `i` becomes
`I`). Category `modeFlip`, `commonUsage` 0.5, except the tonic flip at 0.6.
Candidates whose numeral or pitch-class set is already on the grid are
removed by the existing filters. Diminished, augmented and suspended
progression chords produce no flip.

### 3.3 Hint

```js
// on a template object, optional
row4: { prefer: ['mediant', 'modeFlip'], avoid: ['secondary', 'augmented6th'] }
```

Valid category names: `borrowed`, `diatonic`, `dominant`, `subdominant`,
`secondary`, `augmented6th`, `chromatic`, `substitution`, `modal`,
`mediant`, `modeFlip`. An unknown name is a finding in `tools/audit-theory.mjs`
(new check J, static, over the template objects).

In `selectDynamicRow4Chords()`: after spec 04's type-based exclusion,
exclude candidates whose category is in `avoid`; after scoring, add one
point to candidates whose category is in `prefer`. The fallback of spec 04
§3.2 step 5 re-admits avoided categories after avoided types.

### 3.4 Diversity pass

The existing first pass takes the two best candidates regardless, then one
per new category. With two new categories the pass stays as it is; the hint
is what tilts the outcome. Do not change the pass in this spec; record in
the PR, for the eighteen Film/Cinematic templates, how many mediant and flip
candidates reached row 4 (expect two to three of four pads).

### 3.5 Tooltips

`getChordTooltip()`: build the candidate list as `chordRoles.<numeral>`
(exact case), then `chordRoles.<NUMERAL>` (upper), then the stripped forms
as today. `locales/*.json` `chordRoles`:

- `VI`: rewrite for the major chord: a chromatic mediant a minor third below
  the tonic, bright and sudden; also the dominant of ii.
- `III`: rewrite for the major chord: a chromatic mediant a major third
  above the tonic; also the dominant of vi.
- new `vi`: the existing "Submediant - relative minor" text moves here.
- new `iii`: the existing "Mediant - weaker predominant" text moves here.
- new `♭vi`: the hexatonic pole, no common tone with I, every voice a
  semitone away.
- new `♭iii`: a doubly chromatic mediant, remote and dark.
- `chordRolesMinor` (spec 07) gains `iii`, `♭iii`, `♭vi`, `vi`, `III`.

Six locales.

## 4. Code changes

| File | Change |
|---|---|
| `modules/generation.js:95-345` | mediant and flip candidates in both pools; categories renamed as D1 |
| `modules/generation.js:375` | hint handling |
| `modules/musicTheory.js:638` | `row4` hints on Film/Cinematic templates |
| `app.js:721` | exact-case lookup first |
| `locales/*.json` | `chordRoles` and `chordRolesMinor` additions, six files |
| `tools/audit-theory.mjs` | check J |
| `docs/catalogue-snapshot.txt` | regenerated |
| `README.md` | "Dynamic Row 4" gains one sentence on mediants and mode flips; "Advanced Harmonic Concepts" gains "Chromatic mediants and the hexatonic pole" |
| `CHANGELOG.md` | entry |

## 5. i18n

About eight `chordRoles` keys and five `chordRolesMinor` keys, six locales.

## 6. Acceptance

1. Film/Cinematic `I—♭VI—♭III—♭VII` (Epic Trailer), key C, Classic: row 4
   contains `E [III]` or `Abm [♭vi]` and `Cm [i]` (tonic flip); it contains
   no secondary dominant and no augmented sixth.
2. Film/Cinematic `i—♭VI—♭VII—i` (Dark Cinematic), key A: row 4 contains at
   least one of `Fm [♭vi]`, `C#m [iii]`, `C# [III]`, and `A [I]` (Picardy)
   unless a numeral or signature filter removed it.
3. A Jazz/Functional template's row 4 is unchanged from the post-spec-07
   snapshot, since it carries no hint and its candidates' scores did not
   move except where `VI` lost 0.2 of `commonUsage`; the implementer
   explains any other change.
4. Hovering a `VI` pad shows the new major-VI text; hovering a `vi` pad shows
   the relative-minor text. Same for `III` versus `iii`.
5. Snapshot diff: row-4 lines of Film/Cinematic templates, and of any
   template where `VI`'s lowered usage changed the outcome; nothing in rows
   1-3.
6. Audit check J reports 0; a deliberately misspelled hint reports 1.
7. Full verification protocol passes.

## 7. Out of scope

- Hints for genres other than Film/Cinematic. A follow-up may tag
  Jazz/Functional with `prefer: ['secondary', 'substitution']` and
  Folk/Singer-Songwriter with `avoid: ['secondary', 'augmented6th',
  'substitution']`; list it in the PR.
- Neo-Riemannian labelling (P, L, R, H) on pads. The numerals already carry
  the information for anyone who reads them.

## 8. Implementation notes

### 8.1 Blocked: acceptance items 1, 3 and 5

Done, in a work-in-progress commit: §3.1, §3.2 and §3.3. Not done: §3.5 (tooltips),
the README and the CHANGELOG, which wait for the decision below.

- **Candidates.** `generateRow4Candidates()` takes the progression's pads as a last
  parameter. The major pool's `♭VI`, `VI` and `♭III` are category `mediant`, `VI` at
  0.6; `III` and `♭vi` are added. The minor pool adds `♭vi`, `iii`, `♭iii`, `vi` and
  `III`. Every new candidate is placed last in its pool, so a tie goes to the
  chords the pool already had. Both pools end with the mode flips: one per distinct
  root of a major or minor progression chord, the stem's case inverted, its
  accidental kept, category `modeFlip`, 0.6 for the tonic and 0.5 otherwise. An
  applied chord has no numeral a flip could take and produces none, which §3.2
  does not say.
- **Hint.** `selectDynamicRow4Chords()` takes the template's `row4` as a last
  parameter. A preferred category earns a point; an avoided one is left out of the
  regular pool and comes back in step 5 right after the avoided types, unavoided
  types first. `ROW4_CATEGORIES` is exported from `modules/generation.js`; check J
  reads it and reports 1 for a hint that names `mediants`. The eighteen
  Film/Cinematic templates carry the hint of D4.

What holds: item 2 (Dark Cinematic in A: `D [IV]  Fm [♭vi]  A [I]  G♯dim7 [vii°7]`
in all six styles), item 6, item 7, and §3.4's expectation: in C, Classic, the
eighteen Film/Cinematic rows hold 25 mediants and 19 flips in 72 pads, two or
three per template, and no secondary dominant or augmented sixth.

What does not hold:

1. **Items 3 and 5: the new categories reach every template.** Item 3 expects a
   Jazz/Functional row 4 unchanged, item 5 a diff limited to Film/Cinematic and to
   templates where `VI`'s lower usage matters. Measured: 182 of 184 template blocks
   change row 4 (nothing outside row 4), all 21 Jazz/Functional ones included.
   Gained, over the snapshot's Classic and Jazz rows: `♭vi` 135, `♭VI` 126, the
   tonic flip `i` 105; lost: `♭II` 217, `It+6` 104, `VI` 82, `SubV7` 69. The cause is
   the diversity pass, which §3.4 says not to change: after the two best
   candidates it gives a seat to every category not yet on row 4, and `mediant` and
   `modeFlip` are now in every pool. D1's move of `♭VI` out of `borrowed` adds to it:
   `♭VII` and `♭VI` no longer compete for one seat, and the three moved chords lose
   the point `scoreCandidate()` gives a `borrowed` candidate when the progression
   has no borrowed chord. Placing the new candidates last changes nothing measurable.
2. **Item 1: `E [III]` or `A♭m [♭vi]`.** Epic Trailer in C, Classic, gives
   `Fm [iv]  A [VI]  Cm [i]  D♭ [♭II]`: the tonic flip is there, no secondary dominant
   or augmented sixth, but the mediant seat goes to `A [VI]`, score 3, against
   `E [III]`'s 2 and `A♭m`'s 3 at lower usage. `VI` is itself a chromatic mediant
   under D1, which the item's list leaves out. Smooth and Pedal give `A♭m [♭vi]`.

Measured alternatives, snapshot blocks whose row 4 changes (of 184), each with the
hints of D4:

| Variant | Blocks | Jazz/Functional (of 21) | Item 1, Classic |
|---|---|---|---|
| As specified | 182 | 21 | fails, `A [VI]` |
| New candidates (III, ♭vi, the minor mediants, flips) only where the hint prefers their category | 117 | 20 | fails |
| The same, and D1's move of `♭VI`, `VI`, `♭III` only where the hint prefers `mediant` | 89 | 9, from `VI`'s usage alone | fails |
| As specified, but `mediant` and `modeFlip` get no diversity seat unless preferred (changes the pass, against §3.4) | 119 | 13 | fails |

Item 1 fails in every variant, since `A [VI]` outscores `E [III]` there; it holds
if the item admits `A [VI]`, or if `III` and `♭vi` earn more than `VI` under the hint.

Measured against `f9f3ab0`, as specified: `.progression` files 1 094 to 1 068 and
MIDI files 13 135 to 12 838, since more styles now coincide and fuse; audit,
translations and snapshot check pass.

