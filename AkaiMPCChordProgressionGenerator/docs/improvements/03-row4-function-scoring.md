# 03 - Row-4 scoring: harmonic function classifier and root-motion test

| | |
|---|---|
| Status | proposed |
| Type | defect |
| Size | S |
| Depends on | 00 |
| Blocks | 04, 07, 10 |
| Recommended model | Claude Haiku 5.5 (`claude-haiku-5-5`): the classifier is given as a table, the regex pattern already exists in `tools/audit-theory.mjs`, and the snapshot shows the effect |

## 1. Problem

`determineChordFunction()` (`modules/generation.js:84`) decides a chord's
harmonic function with substring tests on the roman numeral:

```js
if (upper.includes('I') && !upper.includes('II') && !upper.includes('V')) return 'tonic';
if (upper.includes('IV') || upper.includes('II')) return 'subdominant';
if (upper.includes('V')) return 'dominant';
if (upper.includes('VI') || upper.includes('III')) return 'mediant';
return 'chromatic';
```

`VI` contains `V`, `III` contains `II`, so the `mediant` branch is
unreachable and most numerals land in the wrong group. Measured:

| Numeral | Returned | Textbook group |
|---|---|---|
| `I`, `i`, `IM7` | tonic | tonic |
| `ii` | subdominant | subdominant |
| `iii`, `iii7` | subdominant | tonic (tonic prolongation) |
| `IV`, `iv` | subdominant | subdominant |
| `V` | dominant | dominant |
| `vi`, `VI` | dominant | tonic (vi); chromatic mediant (VI) |
| `vii°` | subdominant | dominant |
| `♭III` | subdominant | chromatic mediant |
| `♭VI` | dominant | subdominant (predominant) |
| `♭VII` | subdominant | subdominant |
| `♭II` | subdominant | subdominant (Neapolitan) |
| `V7/ii` | subdominant | applied dominant |

For the textbook grouping see
[Open Music Theory, Harmonic Functions](https://human.libretexts.org/Bookshelves/Music/Open_Music_Theory_1e/03:_Harmony/3.02:_Harmonic_Functions)
(I, iii and vi as tonic; ii and IV as subdominant; V and vii° as dominant)
and [Puget Sound, Harmonic Function](https://musictheory.pugetsound.edu/mt21c/HarmonicFunctionInClassicalMusic.html)
(iii and vi as tonic prolongation).

Two more substring tests sit in `analyzeExistingChords()`
(`generation.js:37`): `romanNumeral.includes('IV') || romanNumeral.includes('ii')`
sets `hasSubdominant`, so `iii` and `vii°` count as subdominant presence; and
the function set `functionsPresent` is fed by the broken classifier.

The consequence is confined to row 4: `scoreCandidate()` (`generation.js:348`)
awards one point to a candidate whose function is absent from rows 1-3. With
vi filed as dominant, a progression `I—vi—IV—V` is seen as having no tonic
gap and no dominant gap either way, while `I—IV—vi—iii` is seen as having a
dominant already. The points are awarded on wrong premises. Row 4 is still
filled, with the wrong preferences.

A smaller asymmetry in the same function: the "leads well" test accepts a
candidate root 1, 5 or 7 semitones above an existing root, never 11. A root
a semitone *below* an existing root (the leading-tone relation) is the
strongest voice-leading approach there is, and it is excluded by accident.

## 2. Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Classify by parsing the numeral: optional accidentals, stem, case, suffix. | Substring tests on roman numerals cannot be made correct; `II` is a substring of `III`. |
| D2 | Four classes: `tonic`, `subdominant`, `dominant`, `chromatic`. The `mediant` class is dropped. | The scoring only asks whether a function is missing; a fifth class that never fills a gap is noise. Diatonic mediants join tonic; chromatic mediants are chromatic. |
| D3 | The table in §3.1 is normative, including the contestable rows (♭VII as subdominant, applied dominants as chromatic). | Theorists differ on ♭VII; the scoring needs one answer and the double-plagal reading (♭VII as IV of IV) is the one the catalogue's rock templates use. Applied dominants are chromatic because they are not *the* dominant; the `secondary` category already rewards their presence separately. |
| D4 | Root-motion test becomes symmetric: 1, 11, 5, 7 semitones. | The leading-tone approach from below is at least as idiomatic as the approach from above. |

## 3. Normative specification

### 3.1 Classifier

```
classify(romanNumeral):
  if numeral is one of It+6, Fr+6, Ger+6            -> subdominant   (predominant to V)
  if numeral is SubV7                                -> dominant      (substitute for V7)
  if numeral contains '/'                            -> chromatic     (applied chord)
  accidentals := leading run of ♭ ♯ b #
  stem        := following run of [ivIV]+            (no stem -> chromatic)
  lower       := stem is lower case
  degree      := I II III IV V VI VII

  no accidental:
    I            -> tonic
    II           -> subdominant
    III          -> lower ? tonic : chromatic
    IV           -> subdominant
    V            -> dominant
    VI           -> lower ? tonic : chromatic
    VII          -> lower ? dominant : chromatic
  one flat:
    ♭II          -> subdominant
    ♭III         -> chromatic
    ♭VI          -> subdominant
    ♭VII         -> subdominant
    other        -> chromatic
  any sharp or other accidental                      -> chromatic
```

Suffixes (`7`, `M7`, `°`, `ø7`, `(maj7)`, `sus4`, …) never change the class.
`i`, `i7`, `i(maj7)`, `i6` are all tonic; `V7`, `v` are both dominant.

### 3.2 Call sites

- `determineChordFunction()` returns the class above. Its name stays.
- `analyzeExistingChords()` sets `hasSubdominant` from
  `classify(numeral) === 'subdominant'` instead of the substring test, and
  keeps feeding `functionsPresent` from the classifier.
- `scoreCandidate()` leads-well test:
  `[1, 5, 7, 11].includes((candidate.root - root + 12) % 12)`. Drop the
  `Math.abs`, which was a no-op on a non-negative operand.

### 3.3 Reuse

`tools/audit-theory.mjs` already parses numerals with
`/^([♭♯#b]*)([ivIV]+)/` in `romanNumeralRootPc()`. Lift that pattern into
`modules/musicTheory.js` as an exported `parseRomanStem(numeral)` returning
`{ accidentals, stem, lower, degree }`, use it in both places, and let the
audit import it. One parser for numerals, not two.

## 4. Code changes

| File | Change |
|---|---|
| `modules/musicTheory.js` | export `parseRomanStem()` |
| `modules/generation.js:37-82` | `analyzeExistingChords`: classifier instead of substrings |
| `modules/generation.js:84-93` | `determineChordFunction`: table of §3.1 |
| `modules/generation.js:358-362` | symmetric root-motion test |
| `tools/audit-theory.mjs` | import `parseRomanStem()` instead of its local regex |
| `docs/catalogue-snapshot.txt` | regenerated |

## 5. i18n

None.

## 6. Acceptance

1. Unit table: every row of §1's first column returns the §3.1 class; add
   `♭VI7`, `viiø7`, `i(maj7)`, `V7/♭III`, `Ger+6`, `SubV7`, `II` (Lydian) to
   the table. Put the table in a small test script under `tools/` or extend
   the audit with a static check; either is acceptable, but it must run in
   CI.
2. Snapshot diff: only row-4 lines (pads 13-16) change, and only where the
   old classifier awarded or withheld the functional-gap point wrongly. The
   implementer lists, in the PR, three templates whose row 4 changed and
   explains each in one sentence with the old and new classification.
3. `node tools/audit-theory.mjs` passes, and so does the full protocol.

## 7. Out of scope

- Making row 4 respect palette priorities (spec 04) or avoid duplicate
  sonorities (spec 05). This spec only makes the existing points honest.
