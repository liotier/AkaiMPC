# 15 - Scale Mode grids without repeated sounds

| | |
|---|---|
| Status | implemented, with option B of §6 |
| Type | defect |
| Size | M (S for the filler alone; option B added a chord type) |
| Depends on | 05 (`pcSignature()`), 13 (implemented) |
| Blocks | - |
| Recommended model | Claude Sonnet 5.5 (`claude-sonnet-5-5`): one function rewritten, one chord type added through existing tables, one audit check, the effect visible in the snapshot |

## 1. Problem

Spec 05 removed duplicate-sounding pads from Progression Palette mode. Scale
Mode was outside its scope, and it has the same defect. Over the 34 scales in
C, 69 pads in 24 grids sound like another pad of the same grid:

| Cause | Pads | Example |
|---|---|---|
| The gap filler | 36 | Major pad 16 `C6` [I6] sounds like pad 14 `Am7` [vi7] |
| Degree chords of the symmetric scales (Whole Tone, Augmented, the two Diminished) | 17 | Whole Tone pad 3 `Eaug` [III+] sounds like pad 1 `Caug` [I+] |
| Degree chords of other scales | 16 | Neapolitan Major pad 5 `Gaug` [V+] sounds like pad 3 `Ebaug` [III+] |

This spec fixes the first cause. The other two are properties of the scales
and need a decision (§6).

`generateScaleExploration()` (`modules/generation.js:524`) puts one triad per
scale degree in pads 1-8 and one seventh chord per degree in pads 9-16. A
scale with fewer than eight degrees leaves gaps, which `fillGaps()` fills
with colours on the tonic (sus4, sus2, 6, add9 and so on). It has three
flaws:

1. **It compares names, not sounds.** A candidate is skipped when its roman
   numeral is already used, so `I6` is accepted although `C6` (C E G A)
   sounds as `Am7` (A C E G), the seventh chord on vi.
2. **It looks only at the tonic.** In a five-note scale the tonic's colours
   run out, and the other degrees are never tried.
3. **When the list is spent, it repeats the tonic.** `fallbackType` is the
   tonic triad or seventh, which pads 1 and 9 already hold: Hirajoshi's
   pads 14, 15 and 16 are all `CmMaj7`, a copy of pad 9.

## 2. Goal

The filler never adds a chord the grid already sounds, while any chord the
scale supports remains that would sound new.

## 3. Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | A filler candidate is skipped when its pitch-class signature (`pcSignature()`, spec 05) is already on the grid. | Same rule as spec 05: two pads that sound alike make a fifteen-pad grid. |
| D2 | When the triad half is filled, the signatures of the degree sevenths still to come (pads 9 onward) count as taken. | Otherwise the triad half can take `F6`, and the seventh half then adds `Dm7`, the same four notes. |
| D3 | The tonic is tried first with the colour lists in their present order, then each other degree in scale order with the same lists. | The present choices are kept wherever they were not duplicates; only what must change changes. |
| D4 | `fallbackType` stays as the last resort. | In Whole Tone and Augmented no colour in the lists fits that is not already on the grid, so the fallback still runs there: 8 pads (§5). Whether those scales should get other chords is part of §6. |
| D5 | Degree chords are not touched. | Their repeats are the second and third causes of §1; §6. |
| D6 | New audit check **Q**: in every scale in C, no filler pad (a pad beyond the scale's degree count in its half of the grid) sounds like another pad, except in the scales listed in an explicit allowlist in the check. The allowlist starts as Whole Tone and Augmented, with a comment pointing at §6. | Guards the filler without pretending the open question is settled. |

## 4. Specification

Replace `fillGaps()` with this logic (a sketch: keep the existing names and
comments style):

```js
// The degree sevenths the seventh half will hold, so the triad half's filler
// does not take one of their sounds first (D2)
const degreeSevenths = scaleDegrees.slice(0, 8).map((root, degree) =>
    pcSignature(buildChord(root, getScaleSeventh(degree, mode), keyOffset)));

const fillGaps = (limit, extras, fallbackType, reserved = []) => {
    const taken = new Set([...pads.map(pad => pcSignature(pad.notes)), ...reserved]);
    // The tonic first, then every other degree in scale order (D3)
    for (let degree = 0; degree < scaleLength && pads.length < limit; degree++) {
        const rootPitchClass = ((scaleDegrees[degree] % 12) + 12) % 12;
        for (const type of extras) {
            if (pads.length >= limit) break;
            if (!chordFitsScale(rootPitchClass, type, harmonyPitchClasses)) continue;
            if (used.has(getRomanNumeralForChord(degree, type))) continue;
            const signature = pcSignature(buildChord(scaleDegrees[degree], type, keyOffset));
            if (taken.has(signature)) continue;   // sounds like a pad already there (D1)
            taken.add(signature);
            addPad(degree, type);
        }
    }
    // Nothing the scale supports sounds new: only Whole Tone and Augmented (D4)
    while (pads.length < limit) addPad(0, fallbackType);
};

fillGaps(8, [...SUSPENDED_COLOURS, ...EXTENDED_COLOURS], getScaleTriad(0, mode), degreeSevenths);
// ...degree sevenths...
fillGaps(16, [...EXTENDED_COLOURS, ...SUSPENDED_COLOURS], getScaleSeventh(0, mode));
```

`pcSignature` is already imported by `generation.js`; `buildChord` must be
added to the import list if it is not there. Update the comment above the
function: the filler now avoids sounds, not only names.

Records: a `CHANGELOG.md` entry ("Scale Mode no longer fills spare pads
with a chord already on the grid"), this spec's header and the index.

## 5. Acceptance

Measured with the sketch above, key of C:

| Quantity | Before | After |
|---|---|---|
| Grids with a duplicate-sounding pad | 24 | 11 |
| Duplicates caused by the filler | 36 | 8, all in Whole Tone and Augmented |
| Degree-chord duplicates (untouched) | 33 | 32 |
| Pads that change | - | 34, in 20 grids |

The degree-chord count falls by one with no degree chord changing: in
Pentatonic Major, pad 13 `Am7` was counted as the duplicate of filler pad 8
`C6`, which is no longer there.

The 34 changed pads:

| Scale | Pad | Before | After |
|---|---|---|---|
| Major | 16 | `C6` [I6] | `Cadd9` [Iadd9] |
| Dorian | 16 | `Cm6` [i6] | `C7sus4` [I7sus4] |
| Lydian | 16 | `C6` [I6] | `Cadd9` [Iadd9] |
| Mixolydian | 16 | `C6` [I6] | `C7sus4` [I7sus4] |
| Melodic Minor | 16 | `Cm6` [i6] | `Cmadd9` [iadd9] |
| Pentatonic Major | 8 | `C6` [I6] | `Cadd9` [Iadd9] |
| Pentatonic Major | 14 | `Cadd9` [Iadd9] | `Cmaj9` [IM9] |
| Pentatonic Major | 15 | `Cmaj9` [IM9] | `Dm6` [ii6] |
| Pentatonic Major | 16 | `Cmaj7` [IM7] | `D7sus4` [II7sus4] |
| Altered | 8 | `Cdim` [i°] | `Dbsus4` [IIsus4] |
| Altered | 16 | `Cm7b5` [iø7] | `Dbmadd9` [iiadd9] |
| Lydian Dominant | 16 | `C6` [I6] | `Cadd9` [Iadd9] |
| Bhairav | 8 | `Csus4` [Isus4] | `Em6` [iii6] |
| Bhairav | 16 | `Cmaj7` [IM7] | `Fmadd9` [ivadd9] |
| Kafi | 16 | `Cm6` [i6] | `C7sus4` [I7sus4] |
| Yaman | 16 | `C6` [I6] | `Cadd9` [Iadd9] |
| Todi | 8 | `Cm` [i] | `Dbsus2` [IIsus2] |
| Todi | 16 | `CmMaj7` [i(maj7)] | `Ebm7(11)` [iii7(11)] |
| Double Harmonic | 8 | `Csus4` [Isus4] | `Em6` [iii6] |
| Double Harmonic | 16 | `Cmaj7` [IM7] | `Fmadd9` [ivadd9] |
| Hungarian Minor | 8 | `Csus2` [Isus2] | `Cmadd9` [iadd9] |
| Hungarian Minor | 16 | `Cmadd9` [iadd9] | `Bm6` [vii6] |
| Neapolitan Major | 16 | `Cm6` [i6] | `Fadd9` [IVadd9] |
| Neapolitan Minor | 16 | `CmMaj7` [i(maj7)] | `Dbadd9` [IIadd9] |
| Persian | 8 | `Caug` [I+] | `Dbsus4` [IIsus4] |
| Persian | 16 | `CaugMaj7` [I+M7] | `Db7sus4` [II7sus4] |
| Hirajoshi | 14 | `CmMaj7` [i(maj7)] | `Dm7(11)` [ii7(11)] |
| Hirajoshi | 15 | `CmMaj7` [i(maj7)] | `Ab6` [V6] |
| Hirajoshi | 16 | `CmMaj7` [i(maj7)] | `Abm6` [v6] |
| Insen | 15 | `Cm7` [i7] | `Dbadd9` [IIadd9] |
| Insen | 16 | `Cm7` [i7] | `Dbmaj9` [IIM9] |
| Kumoi | 14 | `Cm6` [i6] | `C7sus4` [I7sus4] |
| Kumoi | 15 | `C7sus4` [I7sus4] | `Cmadd9` [iadd9] |
| Kumoi | 16 | `Cmadd9` [iadd9] | `Cm9` [i9] |

Scale Mode numerals name the degree by its position, as today (Hirajoshi's
fifth note, A♭, is `V`); this spec does not change that.

Protocol:

- The snapshot diff touches only `## Scale` blocks, and only the pads above.
- The pack is byte-identical: it holds no Scale Mode grid.
- Check Q passes, and fails if the signature test of D1 is removed.

## 6. Open question: the degree chords

After this spec, 40 pads in 11 grids still sound like another pad:

| Group | Pads | Where |
|---|---|---|
| Symmetric chords on several degrees of a symmetric scale | 17, plus the 8 filler pads of D4 | Whole Tone (only two augmented triads exist in it), Augmented, Diminished (W-H) and (H-W) (the diminished seventh on degrees 1, 3, 5, 7 is one chord) |
| The augmented triad on two degrees of a seven-note scale | 6 | Todi, Neapolitan Major, Neapolitan Minor, Persian |
| A degree with no seventh chord in the scale, whose seventh-half pad repeats its triad | 9 | Bhairav, Double Harmonic, Hungarian Minor, Todi, Persian, Neapolitan Minor |

Every scale supports at least 17 distinct sonorities across the chord types
the engine knows (Whole Tone 17, Augmented 20, the Diminished scales 48), so
a grid of 16 distinct chords is always possible. Whether it is desirable is
the maintainer's choice:

- **A. Keep them.** The repeats show the scale's symmetry, and the
  one-column-per-degree layout stays intact. Cost: Whole Tone offers 8
  distinct chords on 16 pads, Augmented 5.
- **B. Replace every repeat.** A degree chord that sounds like an earlier
  pad is replaced by another chord the scale supports on the same degree,
  or on another degree when none fits there (Whole Tone: `7♭5`, `9♯5`;
  Diminished: `7♭9`, `13♭9`). This applies spec 05's rule everywhere. Cost:
  a column no longer always holds the triad and the seventh of one degree.
- **C. Replace only exact repeats.** The 9 same-degree repeats and the 8
  filler fallbacks go; the symmetric coincidences between different degrees
  (`Caug` [I+] and `Eaug` [III+]) stay, as a picture of the symmetry.

The decision becomes a short follow-up spec, or a section appended here.

## 7. Decision: option B, and how it was implemented

The maintainer chose B. §3 to §5 describe the filler alone, as first
specified; this section supersedes them where they differ.

### 7.1 Correction to §6

§6 said every scale supports at least 17 distinct chords, Whole Tone 17. That
count included shell voicings and the augmented sixths, which no pad
displays as a chord type. With the displayable types, Whole Tone supports 11
distinct chords: 2 augmented triads, 6 augmented sevenths and 3 dominant
sevenths with a flattened fifth. Sixteen distinct pads therefore need one
more type.

### 7.2 Decisions

| # | Decision | Rationale |
|---|---|---|
| D7 | The grid is planned before any pad is added, in three passes. (1) Every degree chord, triads then sevenths, whose sound is not yet planned and which fits the scale. (2) Each degree chord that failed (1) gives way to another chord: on its own degree when one fits, otherwise on the first degree in scale order that has one. (3) The gaps of scales with fewer than eight degrees, by D3. | Degree chords keep priority over colours, as before: pass 1 places them all before any replacement or filler can take a sound they need, which also covers D2. |
| D8 | Candidates are tried list by list: the half's colour lists of §4 first, then a further list (`dom7b5`, `aug9`, `aug7`, `augMaj7`, `dom7b9`, `dom7sharp9`, `dom7alt`, `major7`, `dom7`, `minor7`, `minMaj7`, `m7b5`, `dim7`, the four triads, `maj6/9`, `add11`, `dom11`, `minor11`, `major13`, `dom13`, `minor13`). Each list is tried on every candidate degree before the next list is tried. | The further list is reached only where the usual colours are spent, so every grid that had no repeat keeps its chords. |
| D9 | A new chord type, `aug9` (`[0, 4, 8, 10, 14]`, the dominant ninth with a raised fifth), named `aug9` (Caug9), numeral suffix `+9` (I+9), label "Augmented 9", spelled 1 3 ♯5 ♭7 9, guitar shape falling back to `augmented`, with a description in the six locales. | It is the whole-tone scale's dominant and the only addition Whole Tone needs: each of its six roots gives a different five-note subset. The name follows `aug7`. No template uses it, and no code enumerates the types except the parser's suffix table and the audit, so template palettes cannot pick it up. |
| D10 | A degree chord that does not fit its scale fails pass 1 and is replaced like a repeat. | The builder's own comment promises that nothing on the grid holds a note the scale lacks. Six degree chords broke that promise: `Bdim` (B D F) in Bhairav and Double Harmonic, neither of which has D, and `F#dim` (F♯ A C) in Hungarian Minor, which has no A natural. Each was both a triad and its own seventh-half repeat. |
| D11 | Check Q forbids any repeated sound in any Scale Mode grid, in every key. There is no allowlist. | Option B leaves no exception. |

### 7.3 Result

Measured over the 34 scales in all 12 keys: no grid holds two pads that
sound alike, and every grid has 16 pads. In C, 79 pads change, in 24 grids:

| Scale | Pads | Scale | Pads | Scale | Pads |
|---|---|---|---|---|---|
| Augmented | 11 | Neapolitan Major | 4 | Lydian | 1 |
| Whole Tone | 8 | Pentatonic Major | 4 | Lydian Dominant | 1 |
| Bhairav | 5 | Persian | 4 | Major | 1 |
| Double Harmonic | 5 | Todi | 4 | Melodic Minor | 1 |
| Hungarian Minor | 5 | Diminished (H-W) | 3 | Mixolydian | 1 |
| Neapolitan Minor | 5 | Diminished (W-H) | 3 | Yaman | 1 |
| Altered | 2 | Hirajoshi | 3 | Dorian | 1 |
| Insen | 2 | Kumoi | 3 | Kafi | 1 |

The thirteen grids whose only repeats came from the filler change exactly as
§5 lists. In the seven where B also replaced degree chords (Bhairav, Double
Harmonic, Hungarian Minor, Neapolitan Major, Neapolitan Minor, Persian, Todi),
some filler pads differ from §5's table, because the replacements take
colours first. The four symmetric scales account for the other 25 pads.

The symmetric scales now read (key of C):

```
Whole Tone        Caug  Daug  E7b5  F#7b5  G#7b5  A#aug9  Caug9  Daug9
                  Caug7  Daug7  Eaug7  F#aug7  G#aug7  A#aug7  Eaug9  F#aug9
Augmented         Caug  D#aug  Emaj7  Cmaj7  G#maj7  CmMaj7  E  Em
                  CaugMaj7  C  EaugMaj7  Cm  G#augMaj7  EmMaj7  G#mMaj7  G#
Diminished (W-H)  Cdim  Dm  D#dim  F  F#dim  G#m  Adim  B
                  Cdim7  Dm7  D6  F7  Dm6  G#m7  Fm6  B7
Diminished (H-W)  Cm  C#dim  D#m  Edim  F#m  Gdim  Am  A#dim
                  Cm7  C#dim7  D#m7  Cm6  F#m7  D#m6  Am7  F#m6
```

Augmented now shows the hexatonic scale's own triads, major and minor on C,
E and G♯. In the diminished scales the repeated diminished sevenths give way
to sixth chords on other degrees. On those degrees the colour lists are
tried before the further list, so the replacements are 6ths, not the 7♭9
chords §6 gave as an example. Both are subsets of the scale; the 7♭9 would
need the further list to come first, which would also change the other
scales' replacements.

Protocol: the snapshot diff touches only the 34 `## Scale` blocks (43 lines);
the pack is byte-identical; check Q passes, and reports 528 repeats over the
12 keys when the sound test is removed from the planner. Audit,
translations and snapshot checks pass.

### 7.4 Seen, not changed

The two diminished scales have eight degrees, and their eighth pad's numeral
wraps to `I` (`B [I]`, `B7 [I7]` in W-H, `A#dim [i°]` in H-W). That is how
`getRomanNumeralForChord()` numbers an eighth degree, before and after this
spec.
