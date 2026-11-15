# 11 - A Pedal voicing style

| | |
|---|---|
| Status | proposed |
| Type | feature |
| Size | M |
| Depends on | 00 |
| Recommended model | Claude Opus 5.5 (`claude-opus-5-5`): a voicing algorithm with range and inversion rules, plus a sixth style that changes the pack's size and label set |

## 1. Motivation

The heroic form of the wandering fifth is not a chord change but a voicing:
Em, C major, A major played with E held in the bass, so that the top voice
climbs B, C, C♯ while the bass does not move. The Smooth variant finds this
voicing by accident of its scoring (measured: E G B, E G C, E A C♯ for
`i—♭VI—IV` in E), but only when the common-tone bass also happens to be the
cheapest motion. A pedal is a deliberate choice: hold the first chord's bass
under everything that can take it.

The five existing styles are voicing treatments, a nominal set
(`../mpc-export-specification.md` D5), and the pack and naming scheme already
handle a style set of any size. Adding a sixth is cheap on every surface but
the pack's file count.

Made mandatory by the maintainer on 2026-11-15; it was written as optional.
It adds a sixth of the catalogue to the pack and a sixth card to every
generation, a cost now accepted. It also settles a point spec 09 left to it:
the line cliché's held bass (spec 09 §8).

## 2. Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Style name **`Pedal`**, appended **last** in `VARIANT_STYLES`. | Appending keeps every existing fused label (`Classic+Jazz`) stable; fused labels follow generation order. |
| D2 | The pedal note is the **first progression chord's bass**, placed in the octave of MIDI 48-59 (C3 to B3). | A pedal lives below the chords. The Smooth voicer's own range model keeps upper voices in C3-C6. |
| D3 | A chord that **contains** the pedal pitch class is voiced with the pedal note as its lowest note and its remaining pitch classes stacked closely above, in ascending order from the pedal. | That is a pedal. `buildVoicingFromBass()` already does exactly this when given a bass note and the chord's pitch classes. |
| D4 | A chord that **does not contain** the pedal pitch class is voiced by `findBestVoicing()` against the previous chord, and then transposed by octaves so its lowest note is at or above the pedal. | A pedal held under a chord that lacks it is a different, dissonant device (an actual pedal point against foreign harmony). Pad Perform plays one pad at a time, so the pedal cannot sound under a chord that omits it; the honest rendering is the nearest inversion kept above the pedal's register. |
| D5 | Palette chords (rows 2-4) are treated the same way, pedal taken from the progression's first chord. | One rule for the whole grid; the MPC pads of one progression file share a register. |
| D6 | `deduplicateVariants()` is unchanged; a Pedal variant byte-identical to another style fuses with it and the label says so (`Smooth+Pedal`). | Existing mechanism, §5.2.1 of the export spec. |

## 3. Normative specification

### 3.1 Algorithm, `modules/musicTheory.js`

```
applyPedalVoicing(chords):
  if chords is empty -> chords
  pedalPc  := lowest note of chords[0].notes, mod 12
  pedal    := the MIDI note with pitch class pedalPc in [48, 59]
  prev     := null
  for each chord in order:
    pcs := distinct pitch classes of chord.notes, in the order of the root-position chord
           (root first), rotated so that pedalPc comes first when present
    if pedalPc in pcs:
      voicing := buildVoicingFromBass(pedal, pcs)          # existing helper, pedal in the bass
    else:
      voicing := findBestVoicing(chord.notes, prev ?? chord.notes)
      while min(voicing) < pedal: voicing := voicing + 12
    prev := voicing
    emit { ...chord, notes: voicing }
```

`buildVoicingFromBass()` returns the voicing within two octaves of the bass
and guarantees every pitch class is placed (fixed in §7.1 of the export
spec); if it ever returns fewer distinct pitch classes than `pcs`, fall back
to the `else` branch. Export the function; `generateVariant()` calls it for
both the progression and the palette, as the other styles are called.

### 3.2 Style registration

- `VARIANT_STYLES = ['Smooth', 'Classic', 'Jazz', 'Modal', 'Experimental', 'Pedal']`.
- `generateVariant()`: two new `case 'Pedal'` branches calling
  `applyPedalVoicing()`.
- Nothing in `modules/mpcNaming.js` changes; it takes the style name as a
  string.
- `tools/build-pack.mjs` and `tools/audit-theory.mjs` iterate
  `VARIANT_STYLES`; no change.

### 3.3 Locale

`variants.Pedal` in six locales:

```json
"Pedal": {
  "label": "Pedal Bass",
  "tooltip": "Pedal variant: holds the first chord's bass note under every chord that contains it, so the upper voices move while the bass stays. Chords without that note take their nearest inversion above it."
}
```

### 3.4 Documentation

- `README.md`, "Five Intelligent Variants" becomes six, with a Pedal bullet;
  "up to five voicing variants" becomes "up to six" wherever it occurs
  (root README too).
- `../mpc-export-specification.md` §5.2: add `Pedal` to the treatment table.
  D5's reasoning is untouched.
- `CHANGELOG.md`: entry, including the pack growth.

## 4. Code changes

| File | Change |
|---|---|
| `modules/musicTheory.js` | `applyPedalVoicing()` exported |
| `modules/generation.js:1021` | sixth style; two `case` branches |
| `locales/*.json` | `variants.Pedal`, six files |
| `README.md`, `../../README.md` | counts and bullet |
| `docs/mpc-export-specification.md` | §5.2 table row |
| `CHANGELOG.md` | entry |
| `docs/catalogue-snapshot.txt` | unchanged by construction (it records Classic and Jazz names and Smooth notes); confirm |

## 5. Acceptance

1. `i—♭VI—IV—♭VI` (spec 08's Wandering Fifth) or, before it exists, the
   Metal `i—♭VI—♭VII—i`, key E, Pedal variant: every progression pad that
   contains E has E as its lowest note, the same MIDI note throughout
   (the pedal lies in 48-59, so 52; 40 or 64 would be wrong).
2. `I—V—vi—IV`, key C, Pedal: pads 1, 3 and 4 have C (48) in the bass; pad 2
   (G major, no C) is voiced above 48 and its lowest note is at least 48.
3. `node tools/audit-theory.mjs` check B passes for all Pedal variants
   (every pitch class present).
4. Pack rebuilt: `.progression` count grows by at most one file per template,
   184 today (fewer where
   Pedal fuses with another style); MIDI count by at most twelve per template,
   2 208 today. Record both
   and the number of fused `+Pedal` labels.
5. The pack's naming invariants hold (`build-pack.mjs` checks them).
6. The Ascending Line Cliché `i—i♯5—i6—i♯5`, key E, Pedal variant: E, MIDI 52,
   is the lowest note of all four progression pads. This is the held bass
   spec 09 §8 leaves to this spec.
7. Full verification protocol passes; the snapshot is unchanged.

## 6. Out of scope

- A user-selectable pedal note. The first chord's bass is the only choice
  that needs no interface.
- Pedal against foreign harmony (D4).
