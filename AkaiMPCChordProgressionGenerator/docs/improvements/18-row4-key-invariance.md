# 18 - Row 4 the same in every key

| | |
|---|---|
| Status | implemented |
| Type | defect |
| Size | S |
| Depends on | 00 (the snapshot), 03 (whose root-motion test this corrects) |
| Blocks | the Cadenza fork's palette table, which stores each palette once, in C, and will move its submodule after this ([liotier/cadenza-CPG](https://github.com/liotier/cadenza-CPG), `docs/development/specs/04-palette-table.md`, §8.4) |
| Recommended model | Claude Sonnet 5.5 (`claude-sonnet-5-5`): a two-line logic change and one audit check, whose effect the snapshot makes visible; the explanations §6 asks for need the scoring read, not musical judgement |

## 1. Problem

A palette is a harmonic object: generated in E, it should be the palette generated in C, a major third up. It is not.
Measured at `c84a306`, over every template, every style and the eleven keys other than C (184 × 6 × 11 = 12 144
variants), comparing each pad's pitch classes, relative to the key, with the same pad's in C:

| Style | Variants that are not C's transposed | Templates concerned | Rows that differ |
|---|---|---|---|
| Smooth | 353 of 2 024 | 72 | 4 only |
| Classic | 122 of 2 024 | 20 | 4 only |
| Jazz | 114 of 2 024 | 17 | 4 only |
| Modal | 0 of 2 024 | 0 | |
| Experimental | 54 of 2 024 | 7 | 4 only |
| Pedal | 532 of 2 024 | 80 | 4 only |
| **All** | **1 175 of 12 144** | | |

Row 4 either holds other chords (`♭II` against `It+6`, `i` against `♭vi`) or the same chords in another order. Scale
Mode is not affected (0 of 99 grids, nine modes in eleven keys).

**Cause.** `scoreCandidate()` awards its voice-leading point (spec 03, D4) when a candidate's root lies 1, 5, 7 or 11
semitones above an existing root. The two sides are read in different ways
(`modules/generation.js`, `selectDynamicRow4Chords()`):

```js
const existingRoots = existingChords.map(c => c.notes && c.notes[0] ? c.notes[0] % 12 : 0);
```

- `candidate.root` is in the **tonic's frame**: `scaleDegrees[...]` and `(tonic + 1) % 12` in
  `generateRow4Candidates()`, `chord.root ?? chord.scaleDegree` for the unused palette chords. `existingRoots` is an
  **absolute** pitch class. The two frames agree only in C.
- `existingRoots` is the **lowest voiced note**, not the root. Rows 1 to 3 are voiced before row 4 is chosen, and the
  styles' voice leading inverts chords to keep a register, differently in each key. So even in C the point is awarded
  on basses that are no chord's root.

Spec 03's implementation notes saw the second half and left it alone: "`scoreCandidate()` and `analyzeExistingChords()`
take a chord's root from `notes[0]`, the lowest sounding note [...] so the voice-leading point is therefore
voicing-dependent." `analyzeExistingChords()` collects such roots into `analysis.roots`, which nothing reads.

**An example.** Film/Cinematic "Adventure", `I—♭VII—♭VI—♭VII`, Classic, in C. Rows 1 to 3 have the roots C, B♭, A♭,
D and A, and the basses C, D, E♭, F, E, G, A, B♭, A♭ (B♭ is voiced over D and over F, Cmaj7 over G). Row 4 ends with
`Cm [i]`, which earns the voice-leading point from the bass F or G, though no chord has its root there. Read from the
roots, C is two semitones or more from every one, and `B♭m [♭vii]`, a semitone above vi's A, takes the place.

**Consequences.** The MIDI pack, built in twelve keys, ships palettes whose row 4 depends on the key; the
`.progression` pack ships C only, which the device transposes, so the two packs disagree for the same template in E.
The Cadenza fork, which stores each palette once and transposes it, holds C's (its report counts the same 122 Classic
variants).

## 2. Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | **A grid is the same in every key, transposed**: every style, every row, every pad, the order included; Scale Mode too. | A palette is a set of harmonic functions around a tonic; the key only transposes it. Nothing in the generator intends otherwise. |
| D2 | **The scoring reads roots in the tonic's frame, from each pad's `degree`** (`rootDegree()`'s `{ step, alteration }`, which every pad of rows 1 to 3 carries), through a new export, `degreeSemitones(degree)`, the inverse of `rootDegree()`. | It is the chord's root, whatever the voicing, and already in the frame of `candidate.root`. Not the notes (the voicing's bass); not the chord name (in the key's frame, and parsed again). |
| D3 | **`analysis.roots` goes**: the field and its `push`. | Nothing reads it, and it is filled the wrong way; a reader would trust it. |
| D4 | **Spec 03's rule stands**: 1, 5, 7 or 11 semitones above an existing root. Only its inputs change. A candidate on an existing root still earns no point. | The rule is right; its inputs were not. |
| D5 | **Audit check U asserts D1** for every template, style and key, and every Scale Mode grid: each pad's pitch classes relative to the key equal the same pad's in C. | The audit already generates every variant in every key; one comparison per pad makes the invariant permanent. Pitch classes, not names: spelling legitimately differs by key. |
| D6 | **The change is meant to change output, in C too.** In C the frames agree, but the bass is still not the root: 108 (template, style) variants change in C. | Measured: Smooth 27, Classic 11, Jazz 13, Modal 8, Experimental 5, Pedal 44 of 184 each. |

## 3. Normative specification

### 3.1 `modules/musicTheory.js`

Beside `MAJOR_STEPS`, exported:

```js
/**
 * A degree's semitones above the tonic, the inverse of rootDegree(): { step: 7,
 * alteration: -1 } (♭VII) is 10.
 *
 * @param {{step: number, alteration: number}} degree - From rootDegree()
 * @returns {number} 0-11
 */
export function degreeSemitones(degree) {
    return mod12(MAJOR_STEPS[degree.step - 1] + degree.alteration);
}
```

### 3.2 `modules/generation.js`

- Import `degreeSemitones`.
- `selectDynamicRow4Chords()`:
  `const existingRoots = existingChords.map(c => degreeSemitones(c.degree));`
  Every pad of rows 1 to 3 is built through `spelled()`, which sets `degree`. A chord without one is a programming
  error: throw, naming the chord, rather than fall back to 0 as the old line did.
- `analyzeExistingChords()`: remove `roots: []` and the `if (chord.notes && chord.notes.length > 0)` block whose only
  statement is `analysis.roots.push(chord.notes[0] % 12)`; its comment becomes "Track the roman numerals" (D3). Measured:
  the audit and the snapshot are unchanged by this removal alone. `selectDynamicRow4Chords()` has one caller,
  `generateVariant()`, so the throw of the line above can only meet a chord `spelled()` built.

### 3.3 `tools/audit-theory.mjs`: check U

For each template, style and key other than C, the variant's pads against the C variant's, pad by pad: the set of
pitch classes of `notes`, each less the key's offset, modulo 12, must be equal. The same for `generateScaleExploration()`
in every mode. A finding names the template (genre and value), the style, the key and the pads that differ. Reuse the
variants the audit already generates; do not generate them a second time. The header's "lettered A to T" becomes "A to U".

## 4. Code changes

| File | Change |
|---|---|
| `modules/musicTheory.js` | export `degreeSemitones()` |
| `modules/generation.js` | the import; `existingRoots` from `degree`; `analysis.roots` removed |
| `tools/audit-theory.mjs` | check U |
| `docs/catalogue-snapshot.txt` | regenerated |
| `docs/improvements/README.md` | this spec in the table, the order and the counts |

## 5. i18n

None.

## 6. Acceptance

1. **Check U** passes. Run against the parent commit's `generation.js`, it reports the 1 175 variants of §1 (re-measure;
   the count moves if other specs land first).
2. **Snapshot diff** (rule 2 of the protocol): only lines `Classic 13-16` and `Jazz 13-16` change. Measured at `c84a306`:
   29 lines in 18 template blocks, listed in the appendix; no scale block, no other row. The snapshot records Classic
   and Jazz in full and four Smooth pads (spec 00, D2), so it understates the pack's change. The PR lists three templates
   whose row 4 changed and explains each in one sentence, as §1 explains "Adventure".
3. **Pack** (rule 3): the file counts stay 1 094 `.progression` and 13 135 MIDI, no name changes; measured at `c84a306`,
   105 `.progression` files and 1 361 MIDI files change content. Re-measure and write the figures in the PR.
4. The full protocol (README §5) passes.

## 7. Out of scope

- Whether row 4 chooses well otherwise: the scores, the diversity pass and the tie-break are as spec 03 and later
  specs left them. Once the inputs are in the tonic's frame they are key-independent; that is all this spec asks.
- `modules/guitarChords.js` already reads roots from chord names (its own comment says why), and is not part of the
  palette.

## 8. Implementation notes

Written by the Cadenza fork project ([liotier/cadenza-CPG](https://github.com/liotier/cadenza-CPG),
`docs/development/upstream/cpg-18-row4-key-invariance.md`) and implemented as specified, on `c84a306`.

- **Code.** §3.1 and §3.2 as written. `existingRoots` throws for a chord without a `degree`; nothing in the catalogue
  reaches it, since every pad of rows 1 to 3 passes through `spelled()`. No other code read `analysis.roots`.
- **Check U, before the fix:** run against the parent commit's `generation.js`, it reports 1 175 variants, exactly §1's
  table: Smooth 353 (72 templates), Classic 122 (20), Jazz 114 (17), Modal 0, Experimental 54 (7), Pedal 532 (80), all
  in row 4. No Scale Mode grid differs: 0 of 374, the 34 scales in the eleven keys other than C (the audit covers all 34,
  §1 measured nine).
- **Check U, after:** all 12 144 template variants and 374 Scale Mode grids equal their C grid, transposed. Each finding
  names the genre, value, style, key and the pads that differ; the C grids are stored as the audit's own loops generate
  them, so nothing is generated twice.
- **In C:** 108 variants change, Smooth 27, Classic 11, Jazz 13, Modal 8, Experimental 5, Pedal 44, as D6 measured.
- **Snapshot:** 29 lines in 18 template blocks, all `Classic 13-16` or `Jazz 13-16`; every one equals the appendix's
  "After" line, and its "Before" the line replaced. No scale block, no other row.
- **Pack:** still 1 094 `.progression` and 13 135 MIDI files, with the same names; 105 `.progression` and 1 361 MIDI
  files change content, as measured at `c84a306`. Two consecutive builds are byte-identical.
- **Three changes explained** (§6.2), each read from the roots of rows 1 to 3 against the old basses:
  - Film/Cinematic "Epic Trailer", `I—♭VI—♭III—♭VII`, Classic, in C: `Cm [i]` owed its voice-leading point to the bass
    G, a fifth below it, though no chord on rows 1 to 3 is rooted on G; read from the roots it has none, and
    `Abm [♭vi]`, a fourth above E♭ and a semitone below A, takes its place.
  - Jazz/Functional "Minor Turnaround", `vi—ii—V—I`, Classic, in C: `A [VI]` gains the point no voiced bass gave it, a
    fifth above ii's D and a semitone below B♭, and takes the place of `E7 [V7/vi]`.
  - Electronic/Modern "Techno Minimal", `i—iv—v`, Jazz, in A: `Cm [♭iii]` earned its point from the bass B, a semitone
    below it, which only the voicing put in the bass; against the roots A, D and E it has none, and it moves from the
    first pad of the row to the last, the same four chords reordered.
- **Protocol:** audit (checks A to U), translations and snapshot pass.

## Appendix: the snapshot lines that change, measured at `c84a306`

Each template's block is in its own key (C or A), as the snapshot writes it.

| Template | Style | Before | After |
|---|---|---|---|
| Jazz/Functional "Circle Progression", `iii—vi—ii—V` | Jazz | `A [VI]  D7 [V7/V]  Ab7 [It+6]  Db7 [SubV7]` | `A [VI]  D7 [V7/V]  Db7 [SubV7]  Db [♭II]` |
| Jazz/Functional "Minor Turnaround", `vi—ii—V—I` | Classic | `D7 [V7/V]  E7 [V7/vi]  Ab [♭VI]  Db [♭II]` | `D7 [V7/V]  A [VI]  Db [♭II]  Ab7 [It+6]` |
| | Jazz | `D7 [V7/V]  Bb [♭VII]  Db7 [SubV7]  Db [♭II]` | `A [VI]  D7 [V7/V]  Db7 [SubV7]  Db [♭II]` |
| Electronic/Modern "Techno Minimal", `i—iv—v` (A) | Jazz | `Cm [♭iii]  Fm [♭vi]  G#dim7 [vii°7]  C#m [iii]` | `Fm [♭vi]  C#m [iii]  G#dim7 [vii°7]  Cm [♭iii]` |
| R&B/Neo-Soul "Emotional Ballad", `vi—ii—iii—IV` | Jazz | `D7 [V7/V]  Bb [♭VII]  Db7 [SubV7]  Ab7 [It+6]` | `Fm [iv]  A [VI]  D7 [V7/V]  Db7 [SubV7]` |
| Funk/Groove "Two-Chord Funk", `I7—IV7` | Classic | `D7 [V7/V]  A7 [V7/ii]  A [VI]  Db [♭II]` | `D7 [V7/V]  A7 [V7/ii]  A [VI]  Ab7 [It+6]` |
| Film/Cinematic "Epic Trailer", `I—♭VI—♭III—♭VII` | Classic | `Fm [iv]  A [VI]  Cm [i]  Db [♭II]` | `Fm [iv]  A [VI]  Abm [♭vi]  Db [♭II]` |
| | Jazz | `Fm [iv]  A [VI]  Cm [i]  Db [♭II]` | `Fm [iv]  A [VI]  Abm [♭vi]  Db [♭II]` |
| Film/Cinematic "Adventure", `I—♭VII—♭VI—♭VII` | Classic | `A [VI]  E [III]  Fm [iv]  Cm [i]` | `A [VI]  E [III]  Fm [iv]  Bbm [♭vii]` |
| | Jazz | `A [VI]  E [III]  Fm [iv]  Cm [i]` | `A [VI]  E [III]  Fm [iv]  Bbm [♭vii]` |
| Film/Cinematic "Chromatic Film", `I—♭III—♭VI—♭II` | Classic | `Fm [iv]  A [VI]  Cm [i]  Ebm [♭iii]` | `Bb [♭VII]  Fm [iv]  A [VI]  Cm [i]` |
| | Jazz | `Fm [iv]  A [VI]  Cm [i]  Ebm [♭iii]` | `Bb [♭VII]  Fm [iv]  A [VI]  Cm [i]` |
| Film/Cinematic "Major Third Mediants", `I—♭VI—I—III` | Classic | `A [VI]  Fm [iv]  Cm [i]  Db [♭II]` | `A [VI]  Fm [iv]  Abm [♭vi]  Db [♭II]` |
| | Jazz | `Bb [♭VII]  A [VI]  Cm [i]  Db [♭II]` | `Bb [♭VII]  A [VI]  Abm [♭vi]  Db [♭II]` |
| Film/Cinematic "Minor Third Mediants", `I—♭III—I—VI` | Classic | `E [III]  Fm [iv]  Cm [i]  Db [♭II]` | `E [III]  Fm [iv]  Ebm [♭iii]  Db [♭II]` |
| | Jazz | `Ab [♭VI]  Bb [♭VII]  Cm [i]  Db [♭II]` | `Ab [♭VI]  Bb [♭VII]  Ebm [♭iii]  Db [♭II]` |
| Film/Cinematic "Lydian Vamp", `I—II` | Classic | `A [VI]  E [III]  Fm [iv]  Cm [i]` | `A [VI]  E [III]  Fm [iv]  Dm [ii]` |
| | Jazz | `Ab [♭VI]  Bb [♭VII]  Cm [i]  Db [♭II]` | `Ab [♭VI]  Bb [♭VII]  Dm [ii]  Db [♭II]` |
| Film/Cinematic "Lydian Float", `I—II—iii—II` | Classic | `A [VI]  E [III]  Fm [iv]  Cm [i]` | `A [VI]  Eb [♭III]  Fm [iv]  Db [♭II]` |
| | Jazz | `Ab [♭VI]  A [VI]  Bb [♭VII]  Cm [i]` | `A [VI]  Eb [♭III]  Bb [♭VII]  Db [♭II]` |
| Film/Cinematic "Hero Cadence", `I—♭VI—♭VII—I` | Classic | `A [VI]  E [III]  Fm [iv]  Cm [i]` | `A [VI]  E [III]  Fm [iv]  Abm [♭vi]` |
| | Jazz | `A [VI]  E [III]  Fm [iv]  Cm [i]` | `A [VI]  E [III]  Fm [iv]  Abm [♭vi]` |
| Metal/Rock "Power Cadence", `♭VI—♭VII—i` (A) | Classic | `D [IV]  B7 [V7/V]  G#dim7 [vii°7]  Bb [♭II]` | `D [IV]  B7 [V7/V]  Bb [♭II]  G#dim7 [vii°7]` |
| Trance/Psytrance/Goa "Goa Classic", `i—♭II—♭VII—V` (A) | Classic | `D [IV]  B7 [V7/V]  E7 [V7]  F7 [It+6]` | `E7 [V7]  D [IV]  B7 [V7/V]  F7 [It+6]` |
| Trance/Psytrance/Goa "Morning Trance", `i—♭III—♭VII—IV` (A) | Classic | `G#dim7 [vii°7]  A [I]  Csus4 [♭IIIsus4]  Bb [♭II]` | `G#dim7 [vii°7]  A [I]  Bb [♭II]  Csus4 [♭IIIsus4]` |
| Jungle/Drum'n'Bass "Neurofunk", `i—♭III—♭VII—iv` (A) | Classic | `B7 [V7/V]  D [IV]  G#dim7 [vii°7]  F7 [It+6]` | `B7 [V7/V]  D [IV]  G#dim7 [vii°7]  Bb [♭II]` |
| | Jazz | `B7 [V7/V]  D [IV]  G#dim7 [vii°7]  F7 [It+6]` | `B7 [V7/V]  D [IV]  G#dim7 [vii°7]  Bb7 [SubV7]` |
| Italo-Disco/House "Smooth Italo", `IM7—vi7—IVM7—V7` | Classic | `A [VI]  Bb [♭VII]  D7 [V7/V]  Db [♭II]` | `A [VI]  D7 [V7/V]  Db [♭II]  Ab7 [It+6]` |
| | Jazz | `A [VI]  Bb [♭VII]  D7 [V7/V]  Db7 [SubV7]` | `A [VI]  D7 [V7/V]  Db7 [SubV7]  Db [♭II]` |

How these were measured: a copy of the generator at `c84a306` with §3.1 and §3.2 applied (the `analysis.roots` removal
does not change output), `node tools/catalogue-snapshot.mjs --write` and a line diff; `node tools/build-pack.mjs` in both
copies and a file-by-file comparison of the unpacked archives; the key invariance by generating every variant in every
key. `audit-theory.mjs` and `check-translations.mjs` pass on the modified copy.
