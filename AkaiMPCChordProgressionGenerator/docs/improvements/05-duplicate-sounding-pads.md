# 05 - No two pads may sound the same chord

| | |
|---|---|
| Status | proposed |
| Type | defect |
| Size | S |
| Depends on | 00 |
| Blocks | 07, 10 |
| Recommended model | Claude Sonnet 5.5 (`claude-sonnet-5-5`): two filters keyed on a pitch-class signature, one whitelist deleted, one audit check tightened |

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

Two mechanisms, two fixes. Row 4 is deduplicated against rows 1-3 by roman
numeral only (`generation.js:383`), so a chord reached under a second name
passes. The palette's `addChord()` (`generation.js:579`) deduplicates by
roman numeral too, so suspended chords that are inversions of each other
both get in. The `sus4sus4` pairs are also a labelling defect: the palette
appends a suffix to a `romanBase` that already carries one.

## 2. Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Identity of a pad, for de-duplication, is its **pitch-class set**, in addition to its roman numeral. | Two pads with the same pitch classes sound the same chord whatever the voicing style does to octaves; the voicing styles run after this check. |
| D2 | Applies to **both** the palette (`addChord`) and row 4. | 180 of the pairs are inside rows 1-3. |
| D3 | `KNOWN_FUNCTIONAL_TWINS` is **deleted** and check F becomes strict. | A whitelist that says "these duplicates are fine" is what let the count drift from 1 227 to 1 265 unnoticed. |
| D4 | Progression chords are **exempt** from the check against each other, as today. | A template may legitimately repeat a chord (`I—IV—I—V`, the 12-bar blues); those pads are the progression, not the palette. |
| D5 | A doubled suffix (`sus4sus4`) is a defect to fix, not a label to tolerate. | It produces a numeral nobody writes. |

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

Fix the doubled suffix at its source: in the `declaredTypes.forEach` block
that offers the genre's preferred and allowed types on each degree, when
`romanBase` already ends with the suffix that `getRomanSuffix(type)` would
append, do not append it again. Under D1 the duplicate chord would be
rejected anyway; the fix is so that the label on a *surviving* `Isus4` is
never `Isus4sus4`.

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

### 3.5 Documentation

`../mpc-export-specification.md` §7.11 is historical; do not rewrite it.
Add one sentence at its end pointing to this spec as the later decision.
Update the README "All 16 pads are unique" bullet to say unique in sound,
which it now is.

## 4. Code changes

| File | Change |
|---|---|
| `modules/musicTheory.js` | export `pcSignature()` |
| `modules/generation.js:579-640` | `usedSignatures` in `addChord()`; doubled-suffix guard |
| `modules/generation.js:375-420` | signature filters in row-4 selection |
| `tools/audit-theory.mjs` | delete the whitelist; import `pcSignature()` |
| `docs/mpc-export-specification.md` | one sentence after §7.11 |
| `README.md` | one bullet |
| `docs/catalogue-snapshot.txt` | regenerated |
| `CHANGELOG.md` | entry: the duplicate-pad count, 1 265 to 0 |

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
4. No pad anywhere carries a numeral containing `sus4sus4` or `sus2sus2`.
5. Full verification protocol passes.

## 7. Out of scope

- Deduplicating across variants. Five styles of one template are five
  voicings of the same chords by design.
- Enharmonic spelling of the surviving pad. When the ♭VI7 survives and the
  German sixth does not, the pad reads `Ab7 [♭VI7]`, which is correct.
