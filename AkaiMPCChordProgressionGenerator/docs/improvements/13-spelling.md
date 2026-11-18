# 13 - Spelling that follows the key: chord names and note names

| | |
|---|---|
| Status | implemented |
| Type | defect |
| Size | L |
| Depends on | 00; reuses `parseRomanStem()` (spec 03) and the template tonality of spec 07 §3.1 |
| Blocks | nothing; recommended before 07, so 07's snapshot diff reads with correct names |
| Recommended model | Claude Opus 5.5 (`claude-opus-5-5`): touches generation, the theory module, the staff renderer, the pads and the audit at once, and the main acceptance test is an independent table that must not be derived from the code under test |

## 1. Problem

Two spelling defects, one cause: the generator spells notes by pitch class,
never by scale degree.

**Chord names in sharp keys use flats.** `getEnharmonicContext()`
(`modules/musicTheory.js:2559`) gives every root on a black key a flat
unless its numeral carries a sharp:

```js
if ([1, 3, 6, 8, 10].includes(rootPitchClass) && !romanNumeral?.includes('♯')) return 'flats';
```

So the diatonic chords of every sharp key come out wrong. Measured, Classic
variant, Pop/Rock `I—V—vi—IV` unless stated:

| Key | Printed | Correct |
|---|---|---|
| A | A E Gbm D | A E F♯m D |
| E | E B Dbm A | E B C♯m A |
| B | B Gb Abm E | B F♯ G♯m E |
| D, `I—V—vi—iii—IV` (Canon Progression) | D A Bm Gbm G | D A Bm F♯m G |

Minor templates in the two-named keys are worse, because their tonic itself
is misspelled: C♯ minor prints `Dbm`, D♯ minor `Ebm`, G♯ minor `Abm`. In Scale
Mode, even in C, the raised degrees come out flat: C Lydian's ♯iv° prints
`Gbdim`.

The names reach the pads, the chord names inside every `.progression` file
exported from the app (what Pad Perform shows), and the inversion notation.
The published `.progression` pack is spared: it is in C, and template mode in
C and F needs no sharps. MIDI files carry no chord names.

**Note names spell every chord as a stack of thirds.** `spellChordNotes()`
(`modules/musicTheory.js:2589`) gives the n-th note of a chord the letter two
steps above the previous one, whatever the interval. Measured on C chords:

| Chord | Printed | Correct |
|---|---|---|
| Csus4 | C E♯ G | C F G |
| Csus2 | C E𝄫 G | C D G |
| C7sus4 | C E♯ G B♭ | C F G B♭ |
| C6 | C E G B𝄫 | C E G A |
| Cm6 | C E♭ G B𝄫 | C E♭ G A |
| C6/9 | C E G B𝄫 D | C E G A D |
| C quartal | C E♯ A♯ | C F B♭ |
| C quartal4 | C E♯ A♯ D♯ | C F B♭ E♭ |

Ten chord types are affected, the two rootless type-B voicings included. The
diminished seventh's B𝄫 is correct and must stay. The staff view takes a single
sharps-or-flats flag for a whole chord, so it cannot draw a chord that needs
both, which every augmented sixth does: a German sixth on A♭ is A♭ C E♭ F♯.

Measured with a prototype of the rule of §3, over the catalogue in all twelve
keys:

| Surface | Pads | Spelled differently |
|---|---|---|
| Template mode, Classic and Jazz variants | 70 656 | 13 419 roots |
| Scale Mode, seven-note scales | 4 416 | 1 036 roots (re-measured on the implementation: 1 146, §8) |
| Template mode in C or F | | 0 |

The audit cannot see any of this: check C compares a name's suffix with the
table, and nothing compares a spelling with a key.

## 2. Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | **A root takes the letter of its scale degree**, never a letter chosen from its pitch class. In template mode the degree is the numeral's (`vi` is the sixth letter from the tonic; an applied `V/x` is four letters above its target's); in Scale Mode it is the scale degree. | That is what a roman numeral means. It is the one rule that spells F♯m as the vi of A, A♭ as the German sixth's root in C, and B♭7 as `V7/♭III`. |
| D2 | **The tonic of a two-named key** (C♯/D♭, D♯/E♭, F♯/G♭, G♯/A♭, A♯/B♭) is the name whose reference scale needs fewer accidentals; on a tie, the first name in the key selector. The reference scale is the major or natural minor scale of the template's tonality, or in Scale Mode the scale itself (its parent for an abridged scale). | Standard practice, made mechanical: D♭ major but C♯ minor, A♭ major but G♯ minor. The two exact ties (F♯ major against G♭, D♯ minor against E♭) go to the name the user picked first. Table in §3.2. |
| D3 | **A root is respelled to its plainest name only when the letter rule gives a double accidental, or gives E♯, B♯, C♭ or F♭ on a note outside the key's scale.** The plainest name is the natural when it is a white key, else the single accidental on the same side. | Letters that belong to the key stay: F♯ major's leading tone is E♯, and E♯dim is right there. Chromatic chords in remote keys stay readable: D♭ major's ♭VI would be B𝄫 and is written A, as every lead sheet writes it. The prototype respells 3 327 chromatic roots and no diatonic one. |
| D4 | **Chord tones are spelled from the root by a degree table per chord type**, never by semitones. | Semitones cannot decide: `dom7b5` and `Fr6` share `[0, 4, 6, 10]` and spell differently (C E G♭ B♭; A♭ C D F♯). Table in §3.4. |
| D5 | `minAug` is spelled **strictly from its symbol**: the raised fifth, E G B♯. | The pad shows its own name, `Em#5`, and its notes must agree with it. Every other chord is spelled from its symbol (C augmented is C E G♯, not C E A♭), so a minor sixth here would be the one exception the audit has to tolerate. Across the line cliché's pads the moving voice reads B, B♯, C♯, B♯, a legitimate spelling of a rising chromatic line. Lead sheets often write the same line B, C, C♯ in E minor, where C is the key's sixth degree; that habit was weighed and set aside by the maintainer on 2026-11-15. |
| D6 | Augmented sixths are spelled by function (A♭ C E♭ F♯) while their chord names stay `Ab7` and `Ab7b5`. | The name was made legible on purpose (`../mpc-export-specification.md` §7.10); the numeral (`Ger+6`) and the note names carry the function. |
| D7 | **Spelling is computed once, in generation, after voicing, and carried on the pad** as `pad.spelling`. The app reads it; nothing in the UI spells. | One producer, testable under Node like the rest of generation, and the same names in every view and every export. |
| D8 | Abridged scales use their parent's spelling (`SCALE_HARMONY_PARENT`), as they already use its chords. The symmetrical scales - whole tone, augmented, both diminished - have no letter per degree: their roots are spelled by pitch class on the tonic name's side (sharps for a natural tonic), their tones by the degree table. | An eight-note scale cannot give each note its own letter; a rule that pretends otherwise would produce nonsense such as two different Gs. |
| D9 | Out of scope: export file names and the key selector, which keep the key's first name; the Finder. | File names only have to be unique (`../mpc-export-specification.md` D1); the Finder spells from notes, on its own. |

## 3. Normative specification

### 3.1 Letters

A spelled note is a letter (C D E F G A B, index 0-6) and an accidental, from
-1 to +1 for a root after D3 and from -2 to +2 for every chord tone but four:
an augmented triad on B♯ has a triple-sharp fifth, F♯𝄪 (corrected at
implementation, §8). Its pitch class is the letter's natural pitch class plus the
accidental. Moving a letter by n steps is index arithmetic modulo 7. Data
keeps ASCII (`F#`, `Bb`, `F##`, `Bbb`), as chord names do today; display
converts where it wants glyphs.

Octave numbering is unchanged: the app prints MIDI 60 as C3. The octave
follows the letter, so B♯ is written in the octave of the B below the C it
sounds as, and C♭ in the octave of the C above, as `spellChordNotes()` already
does.

### 3.2 The tonic

`spellTonic(key, referenceSteps)` returns the tonic of D2. The rule produces
exactly this table, which is normative and is the audit's independent
reference (§3.7):

| Key | Major tonic | Major scale | Minor tonic | Natural minor |
|---|---|---|---|---|
| C | C | C D E F G A B | C | C D E♭ F G A♭ B♭ |
| C♯/D♭ | D♭ | D♭ E♭ F G♭ A♭ B♭ C | C♯ | C♯ D♯ E F♯ G♯ A B |
| D | D | D E F♯ G A B C♯ | D | D E F G A B♭ C |
| D♯/E♭ | E♭ | E♭ F G A♭ B♭ C D | D♯ | D♯ E♯ F♯ G♯ A♯ B C♯ |
| E | E | E F♯ G♯ A B C♯ D♯ | E | E F♯ G A B C D |
| F | F | F G A B♭ C D E | F | F G A♭ B♭ C D♭ E♭ |
| F♯/G♭ | F♯ | F♯ G♯ A♯ B C♯ D♯ E♯ | F♯ | F♯ G♯ A B C♯ D E |
| G | G | G A B C D E F♯ | G | G A B♭ C D E♭ F |
| G♯/A♭ | A♭ | A♭ B♭ C D♭ E♭ F G | G♯ | G♯ A♯ B C♯ D♯ E F♯ |
| A | A | A B C♯ D E F♯ G♯ | A | A B C D E F G |
| A♯/B♭ | B♭ | B♭ C D E♭ F G A | B♭ | B♭ C D♭ E♭ F G♭ A♭ |
| B | B | B C♯ D♯ E F♯ G♯ A♯ | B | B C♯ D E F♯ G A |

Template tonality comes from `templateTonality()`, today in
`tools/lib/template-tonality.mjs`. Generation cannot import from `tools/`, so
whichever of this spec and spec 07 lands first moves it into
`modules/musicTheory.js` and leaves the tools importing it from there.

### 3.3 Roots

**Template mode.** For a pad's numeral:

1. Applied chord `V/x`, `V7/x`: the target's letter and pitch class come from
   step 2 applied to the target; the root is four letters and seven
   semitones above it.
2. Otherwise read the numeral with `parseRomanStem()`: letter = tonic letter
   + degree index; pitch class = tonic pitch class + major-scale step of that
   degree + the numeral's accidentals. Numerals are read against the major
   scale in either tonality, as the engine reads them.
3. `It+6`, `Fr+6`, `Ger+6` are read as `♭VI`; `SubV7` as `♭II`.
4. Apply D3: respell a double accidental, and an E♯, B♯, C♭ or F♭ whose pitch
   class is not in the tonality's scale (major, or natural minor).

**Scale Mode.** A seven-note scale spells its notes with consecutive letters
from the tonic, so degree i takes letter tonic + i, accidentals as the pitches
require; these are notes of the key by definition, so the second clause of D3
never applies to them. The first does: under D2's tonic, 15 degrees of seven-note
scales come out with a double accidental, F Altered's B𝄫 among them, and are
respelled (corrected at implementation, §8). Abridged and symmetrical scales
follow D8.

The prototype gives, and the implementation must give:

| Context | Numeral or degree | Root |
|---|---|---|
| A major | `vi` | F♯ |
| E major | `ii`, `vi` | F♯, C♯ |
| B major | `V` | F♯ |
| C♯/D♭, minor template `i—♭VII—♭VI—V` | all four | C♯ B A G♯ |
| C♯/D♭, major template `I—♭VI—♭VII—I` | `♭VI`, `♭VII` | A (not B𝄫), B (not C♭) |
| G♯/A♭, major template | `♭VI` | E (not F♭) |
| F♯/G♭, major template | `vii°` | E♯ (a note of F♯ major, kept) |
| D♯/E♭, minor template | `♭VI` | B |
| C | `V7/♭III` | B♭ |
| C | `Ger+6`, `SubV7` | A♭, D♭ |
| C Lydian, Scale Mode | degree 4 | F♯ |

### 3.4 Chord tones

`CHORD_DEGREES`, beside `CHORD_INTERVALS` in `modules/musicTheory.js`, names
the degree of every interval of every chord type. A degree's letter offset is
its number minus one, modulo 7 (a 9th is a 2nd, an 11th a 4th, a 13th a 6th,
a 10th a 3rd); its accidental makes the pitch class come out right.

| Chord types | Degrees |
|---|---|
| `major`, `minor`, `diminished`, `augmented` | 1 3 5 / 1 ♭3 5 / 1 ♭3 ♭5 / 1 3 ♯5 |
| `minAug` | 1 ♭3 ♯5 (D5) |
| `sus2`, `sus4` | 1 2 5 / 1 4 5 |
| `major7`, `minor7`, `dom7`, `minMaj7` | 1 3 5 7 / 1 ♭3 5 ♭7 / 1 3 5 ♭7 / 1 ♭3 5 7 |
| `dim7`, `m7b5` | 1 ♭3 ♭5 𝄫7 / 1 ♭3 ♭5 ♭7 |
| `aug7`, `augMaj7` | 1 3 ♯5 ♭7 / 1 3 ♯5 7 |
| `dom7sus4` | 1 4 5 ♭7 |
| `major9`, `minor9`, `dom9` | 1 3 5 7 9 / 1 ♭3 5 ♭7 9 / 1 3 5 ♭7 9 |
| `dom7b9`, `dom7sharp9` | 1 3 5 ♭7 ♭9 / 1 3 5 ♭7 ♯9 |
| `major11`, `minor11`, `dom11` | the ninth chord plus 11 |
| `major13`, `minor13`, `dom13` | 1 3 5 7 9 13 / 1 ♭3 5 ♭7 9 13 / 1 3 5 ♭7 9 13 |
| `dom7alt` | 1 3 ♯5 ♭7 ♯9 |
| `dom7b5` | 1 3 ♭5 ♭7 |
| `quartal`, `quartal4` | 1 4 ♭7 / 1 4 ♭7 ♭10 |
| `add9`, `minAdd9`, `add11` | 1 3 5 9 / 1 ♭3 5 9 / 1 3 5 11 |
| `major6`, `minor6`, `maj6/9` | 1 3 5 6 / 1 ♭3 5 6 / 1 3 5 6 9 |
| `shell7`, `shellm7`, `shelldom7` | 1 3 7 / 1 ♭3 ♭7 / 1 3 ♭7 |
| `rootless7A`, `rootlessm7A`, `rootlessdom7A` | 3 5 7 9 / ♭3 5 ♭7 9 / 3 5 ♭7 9 |
| `rootless7B`, `rootlessm7B`, `rootlessdom7B` | 7 9 3 5 / ♭7 9 ♭3 5 / ♭7 9 3 5 (the 3 and 5 an octave up) |
| `It6`, `Fr6`, `Ger6` | 1 3 ♯6 / 1 3 ♯4 ♯6 / 1 3 5 ♯6 |

A spec that adds a chord type adds its row here; audit check S1 fails
otherwise.

Spelling a voiced chord: each MIDI note is matched to the degree whose pitch
class it has, the note takes that degree's letter and accidental from the
spelled root, and the octave follows §3.1. Notes come out in voicing order,
the bass first, so an inversion's bass is the first name.

### 3.5 What the pad carries

Every pad generated in either mode gains, computed after voicing and after the
Jazz upgrade, from its final notes:

```js
spelling: { root: 'F#', notes: ['C#4', 'F#4', 'A4'] }   // notes in voicing order
```

`chordName` becomes `spelling.root + CHORD_NAME_SUFFIX[chordType]`.
`getChordName()` takes what it needs to do this (a spelling context: key,
tonality or scale) and the call sites in `modules/generation.js` and
`generateProgressionChords()` pass it. Row-4 candidates are named after their
numeral like everything else, so their call sites stop passing bare pitch
offsets.

### 3.6 Consumers

| Where | Today | After |
|---|---|---|
| Pad note names (`app.js:1163`) | `spellChordNotes()` | `pad.spelling.notes` |
| Inversion notation (`getInversionNotation()`, `app.js:1136`) | bass from pitch class and a flats flag | the first of `pad.spelling.notes` when it is not the root |
| Staff (`generateStaffSVG()`, `app.js:1177`) | one sharps-or-flats flag for the chord | spelled notes: each head sits on its letter's line or space, each altered note gets its own accidental: ♯, ♭, `×` for a double sharp and ♭♭ for a double flat, glyphs every serif font has |
| Guitar (`getGuitarChord()`) | root pitch class read from the chord name | unchanged, but `ROOT_PITCH_CLASSES` gains `B#`, which a diatonic root can now be |
| Audit (`NOTE_PITCH_CLASSES`) | lacks `B#` | gains it |

`getEnharmonicContext()`, `getNoteNameWithContext()` and the stacked-thirds
`spellChordNotes()` are removed once nothing calls them. The Finder has its
own code and is not touched.

### 3.7 Audit check S

- **S1** `CHORD_DEGREES` has a row for every type in `CHORD_INTERVALS`, of the
  same length, and every degree's semitones equal the interval (degree
  semitones: 1=0, ♭2=1, 2=2, ♯2=3, ♭3=3, 3=4, 4=5, ♯4=6, ♭5=6, 5=7, ♯5=8,
  ♭6=8, 6=9, 𝄫7=9, ♯6=10, ♭7=10, 7=11, plus 12 for 9 to 13).
- **S2** Over every key, every template and the Classic and Jazz variants:
  a pad whose root pitch class is in the template's scale has exactly the root
  that scale has in the literal table of §3.2. The table is written into the
  audit as text, not computed, so the check cannot share a bug with the code.
- **S3** Over every pad of every variant and of Scale Mode in every key: the
  spelled notes have the pad's pitch classes; their letters are the root
  letter plus the degree offsets of `CHORD_DEGREES`; no root carries a double
  accidental; no root outside the key's scale is E♯, B♯, C♭ or F♭.
- **S4** The examples of §3.3 and the corrected column of §1's second table,
  plus `Cdim7` C E♭ G♭ B𝄫, `C7#9` C E G B♭ D♯, `C7b5` C E G♭ B♭, `Caug` C E G♯,
  `Fr+6` in C A♭ C D F♯, `Ger+6` in C A♭ C E♭ F♯, `Em#5` E G B♯.

Tested the usual way: restore the flat rule of `getEnharmonicContext()` and S2
must fail on A major's vi; restore stacked-thirds tone spelling and S3 must
fail on `Csus4`.

## 4. Code changes

| File | Change |
|---|---|
| `modules/musicTheory.js` | `CHORD_DEGREES`; tonic choice, root and tone spelling; `getChordName()` on a spelling context; `templateTonality()` moved in unless spec 07 did it; old helpers removed |
| `modules/generation.js` | spelling context in `generateVariant()` and `generateScaleExploration()`; `pad.spelling` on every pad; row-4 candidates named through the context |
| `modules/rendering.js` | `generateStaffSVG()` takes spelled notes |
| `modules/guitarChords.js` | `B#` in `ROOT_PITCH_CLASSES` |
| `app.js` | note names, inversion notation and staff from `pad.spelling` |
| `tools/audit-theory.mjs` | check S; `B#` |
| `tools/lib/template-tonality.mjs` | re-exports from the module, or is removed with its importers updated |
| `docs/catalogue-snapshot.txt` | regenerated |
| `CHANGELOG.md` | entry: sharp keys spelled with sharps, and sus, sixth and quartal chords spelled with their own notes |

## 5. i18n

None.

## 6. Acceptance

1. Audit check S reports 0, and fails as §3.7 says when either old rule is
   restored.
2. The pack is byte-identical: template mode in C is untouched, and MIDI files
   carry no chord names. A hash change is a regression to explain.
3. Snapshot diff: chord names only, in the minor-tonality blocks (rendered in
   A, where F♯, C♯, G♯ and D♯ roots stop printing as flats) and in Scale Mode
   blocks (C Lydian's `F#dim`, and the like). No MIDI number in any Smooth line
   changes.
4. In the running app, key A, Pop/Rock "Axis of Awesome": the pads read
   `A E F#m D`; keyboard view, a `Csus4` pad's notes read C F G; staff view, a
   German sixth in C draws F♯ on the F line or space with a sharp, and A♭ and E♭
   with flats. (No pad has been a German sixth since spec 03; the staff was
   checked on the Italian sixth pad and on a German sixth rendered by the app's
   own modules in the page, §8.)
5. Full verification protocol passes.

## 7. Out of scope

- Export file names and the key selector labels (D9).
- Respelling the key-of-C pack, which needs nothing.
- The Finder's spelling.
- The `minAug` symbol itself. It stays `m#5`, and D5 spells its notes to match.

## 8. Implementation notes

Implemented as specified. Where the code lives:

- **Spelling.** `modules/musicTheory.js` holds `CHORD_DEGREES` beside
  `CHORD_INTERVALS`, and the rules: `spellTonic()` is D2; `templateSpelling(key,
  tonality)` and `scaleSpelling(key, mode)` build a spelling context;
  `spellRoot()` is §3.3 with D3; `spellChord()` is §3.4 and returns the
  `{ root, notes }` a pad carries. `getChordName(spelling, position, chordType)`
  names a chord from that context, `position` being `{ romanNumeral }` in
  template mode and `{ semitones }` above the tonic in Scale Mode.
  `getInversionNotation(spelling)` reads the first spelled note.
  `getEnharmonicContext()`, `getNoteNameWithContext()` and `spellChordNotes()`
  are gone.
- **Tonality.** `templateTonality()` moved from `tools/lib/template-tonality.mjs`,
  now deleted, into the module; the snapshot tool and the audit import it from
  there, with `TEMPLATE_SEPARATOR`. That is the move spec 07 §3.1 asks for; its
  check H3 remains 07's.
- **Generation.** `generateVariant()` builds the context from the template's
  tonality before anything is named, and passes it to
  `generateProgressionChords()`, the palette, the Jazz upgrade and
  `selectDynamicRow4Chords()`, which passes it on to `generateRow4Candidates()`;
  both take it as a new last parameter, defaulting to the key's major. Every row-4
  candidate is named after its numeral. Each pad gets `spelling` from its final
  notes; `generateScaleExploration()` does the same with `scaleSpelling()`.
- **Display.** `app.js` reads `pad.spelling` for the note names, the slash
  notation and the staff. `generateStaffSVG(spelledNotes)` puts each head on its
  letter with its own accidental: ♯, ♭, `×`, ♭♭, and `♯×` for the triple sharp
  below. `B#` is in the guitar roots and the audit's note table.
- **Audit check S** is S1 to S4 of §3.7, with `KEY_SCALES` a verbatim copy of
  §3.2. S3 also asserts that a pad's chord name is its spelled root and suffix,
  and that its notes ascend, which is what lets the inversion notation take the
  first spelled note as the bass.

Gaps in the text, filled as follows:

- **The tonic of a symmetrical scale.** D2's reference scale does not exist for
  whole tone, augmented or the diminished scales, so the key's first name is
  taken, which is D2's tie rule: C♯ whole tone, spelled with sharps.
- **The blues scale's ♭5** is not in its parent, Dorian, though
  `SCALE_HARMONY_PARENT` calls every parent a strict superset. That one note is
  spelled as D8 spells the symmetrical scales, by pitch class on the tonic's
  side: C blues has F#dim, which agrees with its numeral iv°.
- **Rootless type-B voicings** write their upper third and fifth as degrees 10
  and 12, so that S1's "semitones equal the interval" holds without an octave
  exception.

Corrections, now written into the text above:

1. **§3.3, Scale Mode: D3 does apply.** The text said D3's respelling never
   applies to a seven-note scale's notes. Its second clause never does; its first
   does. With the tonic D2 picks, 15 degrees in 13 key and scale pairs come out
   with a double accidental: F Altered's B𝄫, and F𝄪 or C𝄪 in C♯ Todi and
   Hungarian Minor, D♯ Neapolitan Minor, Phrygian Dominant and Persian, and G♯
   Harmonic Minor, Bhairav, Todi, Double Harmonic, Neapolitan Major, Neapolitan
   Minor and Persian. D3 and S3 both forbid a double-accidental root, so they are
   respelled, F𝄪 as G, C𝄪 as D, B𝄫 as A: 30 pads. G♯ harmonic minor's leading-tone
   chord therefore reads Gdim, as C♯ minor's vii° reads Cdim in template mode,
   where D3 respells B♯ outside the natural minor. Both are what D3 says; both
   are worth a look if the maintainer finds them too plain.
2. **§3.1: one accidental range is wrong.** Roots stay within one accidental, but
   D4 gives an augmented triad on B♯ the fifth F♯𝄪, a triple sharp. The
   Neapolitan Major and Minor on C♯ have that chord on their seventh degree: 4
   tones on 3 Scale Mode pads (`B#aug`, `B#aug7`), none in template mode. D4 is
   the decision, so they are kept, written `F###` in data and ♯× on the staff.
   D2 picks C♯ over D♭ for those two scales by 5 accidentals to 7; respelling
   tones is not in any decision.
3. **§6 item 4: no pad is a German sixth.** None has been, in any key or style,
   since spec 03 (`700ffd6`): over the catalogue the only augmented sixth on a
   pad is the Italian, 1 814 times in twelve keys. The criterion was checked on
   what exists: the Italian sixth pad of Pop/Rock "Classic Rock" in C draws A♭
   with a flat on the A space and F♯ with a sharp on the F line, and a German
   sixth spelled and rendered by the app's own modules inside the page draws A♭
   and E♭ with flats and F♯ with a sharp, on their own letters.
4. **§1, Scale Mode count.** 1 146 roots are spelled differently, not 1 036: 1 176
   by the letters of D1 and D2, less the 30 pads of correction 1. No other
   reading tried gives 1 036: the major scale as reference, a reference by the
   scale's third, the key's first name, pads 1-8 only, the gap-filling pads left
   out. The template-mode counts are reproduced exactly, D3's 3 327 included.

Measured against `07a4b61`:

| Quantity | Result |
|---|---|
| Template mode, Classic and Jazz, twelve keys | 70 656 pads, 13 419 roots respelled; 0 in C and F |
| D3 respellings in template mode | 3 327, none of a note of the key's scale |
| Scale Mode, seven-note scales, twelve keys | 4 416 pads, 1 146 roots respelled |
| Snapshot | 84 blocks change: 73 minor-tonality blocks in A and 11 Scale blocks; 386 chord names, 0 numerals, 0 Smooth lines |
| Pack hashes, before and after | identical: 909 `.progression` files, 10 915 MIDI files |
| Audit | no findings over 176 640 template pads and 6 528 Scale Mode pads |
| Flat rule of `getEnharmonicContext()` restored | S2 reports 11 286, among them `A I—V—vi—IV Classic pad3 Gbm`; S4 reports 10 |
| Stacked-thirds tone spelling restored | S3 reports 257 016, among them `Csus4 [Isus4] E#3 as the 4 of C`; S4 reports 10 |
| Running app, headless Chromium | 17 checks pass, no page errors |

D5 is implemented as decided, with no disagreement to record: the chord is
named `m#5`, and a spelling that contradicted its own name would be the one
exception check S3 had to tolerate. In E the line cliché's pads read E G B,
E G B♯, E G B C♯, E G B♯.

The snapshot's Scale Mode changes are D1 and D8 at work: C Lydian's fourth
degree is `F#dim`, the whole-tone and diminished scales on C read with sharps,
Todi reads `F#sus4`, and the fourth degree of the C Altered scale (C D♭ E♭ F♭ G♭
A♭ B♭) reads `Fbaug`, a note of that scale, which D3 keeps.

The browser script and the mutation copies are not committed, since the
repository has no browser-test setup; the mutation tests are reproducible by
the two one-line changes §3.7 names.
