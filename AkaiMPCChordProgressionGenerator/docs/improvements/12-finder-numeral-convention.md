# 12 - Dropped: align the Finder's minor-key numerals with the Generator

| | |
|---|---|
| Status | dropped on 2026-11-15: the maintainer does not need the Finder to match the Generator. Kept as a record |
| Type | consistency (other tool) |
| Size | S |
| Depends on | nothing; read spec 02 §1 for the background |
| Recommended model | Claude Sonnet 5.5 (`claude-sonnet-5-5`): one function in a single-file app, with a pattern list to re-check |

## 1. Problem

The two tools disagree on what a roman numeral means in a minor key.

- The Generator reads every numeral against the **parallel major**: Am G F
  in A minor is `i ♭VII ♭VI` (`generateProgressionChords()`, spec 02 D1).
- The Finder labels each chord by the **degree of the detected scale**
  (`generateRomanNumerals()`, `../../AkaiMPCChordProgressionFinder/index.html:919`):
  the same file analysed in A minor comes back `i VII VI`, upper case because
  the chords are major.

A user who reads `i VII VI` in the Finder and looks for it in the
Generator finds, before spec 02, templates that play A♭ and G♭ major, and
after spec 02 finds nothing, because the Generator spells it `i ♭VII ♭VI`.
The Finder's README (line 12) promises "simplified notation (I, ii, iii, IV,
etc.)" and says nothing about minor keys.

Both conventions are legitimate and widespread. The point is not which is
right but that two tools shipped together should agree, and the Generator's
convention is frozen by 161 templates, the pack's labels and its
documentation.

## 2. Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | The Finder adopts the **parallel-major convention for every detected scale**: degrees are measured against the major scale on the detected root, lowered degrees get `b`, raised ones `#`. | One rule for all scales rather than a minor-only special case; it is also what the Finder already does for chords *outside* the detected scale. |
| D2 | Case keeps encoding quality, as today. | `bVII` for G major in A minor, `bvi` for F minor. |
| D3 | The ASCII `b` and `#` of the Finder are kept. | The Finder renders in the browser only and never writes MPC names; changing its glyphs is a separate question. |
| D4 | The "playable progressions" pattern list is **re-expressed** in the same convention and re-checked. | Patterns are matched against the generated numerals; a convention change without a pattern pass silently breaks detection. |
| D5 | The README states the convention in one sentence. | Users of both tools should be told once. |

## 3. Normative specification

### 3.1 `generateRomanNumerals()`

Replace the `scale.indexOf(interval)` lookup with a lookup against
`[0, 2, 4, 5, 7, 9, 11]` regardless of `progression.key.scale`:

```
interval := (chordRoot - keyRoot) mod 12
if interval in MAJOR:            roman := romanBase[index], no accidental
else if interval + 1 in MAJOR:   roman := 'b' + romanBase[index of interval + 1]
else if interval - 1 in MAJOR:   roman := '#' + romanBase[index of interval - 1]
```

Both branches of the `else` are reachable for the same interval (6
semitones is `#IV` or `bV`); prefer `#IV` when the detected scale is
Lydian-family or contains the raised fourth, `bV` otherwise. Keep the
quality-driven casing and the `°` suffix as today.

### 3.2 Patterns

Walk the pattern list at `index.html:698` and surroundings. Any pattern
written in scale-relative minor terms (a `VII`, `VI` or `III` in a pattern
whose tonic is `i`) is rewritten with `b`. Add the natural-minor staples so
detection improves rather than merely surviving: `i bVII bVI bVII`,
`i bVI bIII bVII`, `i bVII bVI V`, `bVI bVII i`, `i bIII bVII IV`.

### 3.3 README

`../../AkaiMPCChordProgressionFinder/README.md` line 12: state that numerals
are read against the parallel major, so a minor key's natural mediant,
submediant and subtonic appear as `bIII`, `bVI`, `bVII`, the same convention
as the Generator's templates.

## 4. Code changes

| File | Change |
|---|---|
| `AkaiMPCChordProgressionFinder/index.html:919-985` | lookup against the major scale |
| `AkaiMPCChordProgressionFinder/index.html:~690-710` | pattern pass |
| `AkaiMPCChordProgressionFinder/README.md` | one sentence |
| Root `README.md` | nothing, unless the Finder bullet "Roman numeral analysis" is expanded |

## 5. i18n

None. The Finder is not localised.

## 6. Acceptance

1. A `.progression` file holding Am, G, F, G in A minor (export one from the
   Generator's `i—♭VII—♭VI—♭VII` after spec 02, or build one by hand)
   analyses as `i bVII bVI bVII`.
2. A C major file holding C, F, G, Am still analyses as `I IV V vi`.
3. A D Dorian file (Dm, F, C, G) analyses as `i bIII bVII IV`, and the new
   pattern of §3.2 detects it.
4. The Generator's "Hotel California" exported in B minor analyses in the
   Finder as `i V bVII IV bVI bIII iv V`, which is the Generator's template
   value with ASCII flats. This is the cross-tool round trip that motivates
   the spec.
5. No pattern in the list references a numeral the new function can no
   longer produce; verify by generating numerals for every pattern's
   implied chords and matching.

## 7. Out of scope

- Sharing code between the tools.
- Unicode accidentals in the Finder.
