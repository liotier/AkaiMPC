# 08 - Ten Film/Cinematic templates: mediants, Lydian, Dorian, hero cadence

| | |
|---|---|
| Status | implemented |
| Type | feature, data |
| Size | M |
| Depends on | 00, 01; 04 strongly recommended first so the new palettes are not handed dominants |
| Recommended model | Claude Sonnet 5.5 (`claude-sonnet-5-5`): values, nicknames, priorities and English descriptions are given verbatim; the work is data entry and translation into five locales |

## 1. Problem

Film/Cinematic has seven templates. Set against the devices the review
identified as the staples of film and game scoring, the catalogue has:

| Device | In the catalogue | Missing |
|---|---|---|
| Chromatic mediants, same quality, one common tone (I to ♭VI, III, ♭III, VI) | `I—♭VI—♭III—♭VII`, `I—♭III—♭VI—♭II`, Pop/Rock's `I—III—IV—iv` | nothing presents the relation as a pair; the upward major third is in one pop template only |
| Minor-key mediants (i to ♭vi, iii) | - | absent |
| Hexatonic pole (I to ♭vi) | - | absent |
| Lydian (major II in a major key) | - | zero Lydian templates; the Lydian `II` exists only as a Modal row-4 candidate that in practice never wins |
| Dorian loop without dominant (i, v, ♭VII, IV) | `i—♭III—♭VII—IV` | the `i—v—♭VII—IV` form, only `iv` versions exist |
| Minor lift to a major V (i, ♭III, V) | - | absent |
| Wandering fifth over a held bass (i, ♭VI, IV) | - | absent, though the Smooth voicer reproduces it unaided |
| Hero cadence (♭VI, ♭VII, I) | `♭VI—♭VII—I` under Modal Interchange | no loop form with the tonic first |

All ten values below parse with the current parser; measured in C they
produce exactly the chords listed. No engine change is needed.

For the theory, see
[Open Music Theory, Mediants](https://human.libretexts.org/Bookshelves/Music/Music_Theory/Open_Music_Theory_2e_(Gotham_et_al.)/05%3A_Chromaticism/5.15%3A_Mediants)
and [Wikipedia, Chromatic mediant](https://en.wikipedia.org/wiki/Chromatic_mediant).
For the repertoire, Frank Lehman, *Hollywood Harmony* (Oxford University
Press, 2018), and his
[Hollywood Cadences](https://www.mtosmt.org/issues/mto.13.19.4/mto.13.19.4.lehman.php)
(Music Theory Online 19.4, 2013).

## 2. Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Nicknames name the **device**, never a film, score or composer. | Honest and durable: "Hexatonic Pole" is what the chords are; a film title is a claim about someone's work. Descriptions may mention the kind of scene, not a title. |
| D2 | Mediant templates are written as **loops around the tonic** (`I—♭VI—I—III`), not as two-chord pairs. | A four-pad row 1 reads as a progression; two pads leave the row half palette. |
| D3 | Every new template carries **`palettePriorities`** and, once spec 07 exists, an explicit **`tonality`** where it has no tonic token (none of the ten needs it). | The genre's whole point is the palette around the loop. |
| D4 | Values that would duplicate an existing one are avoided; none of the ten does. | Keeps spec 01's duplicate count where it is. |
| D5 | The category stays **Film/Cinematic**, growing from 7 to 17. | That is where a user looking for these sounds will look. |

## 3. Normative specification

### 3.1 Templates

Append to `progressions['Film/Cinematic']` in this order.

| # | Value | Nickname | Tonality | In C |
|---|---|---|---|---|
| 1 | `I—♭VI—I—III` | Major Third Mediants | major | C A♭ C E |
| 2 | `I—♭III—I—VI` | Minor Third Mediants | major | C E♭ C A |
| 3 | `i—♭vi—i—iii` | Minor Mediants | minor | Cm A♭m Cm Em |
| 4 | `I—♭vi—♭VI—I` | Hexatonic Pole | major | C A♭m A♭ C |
| 5 | `I—II` | Lydian Vamp | major | C D |
| 6 | `I—II—iii—II` | Lydian Float | major | C D Em D |
| 7 | `i—v—♭VII—IV` | Dorian Drift | minor | Cm Gm B♭ F |
| 8 | `i—♭III—V—i` | Minor Lift | minor | Cm E♭ G Cm |
| 9 | `i—♭VI—IV—♭VI` | Wandering Fifth | minor | Cm A♭ F A♭ |
| 10 | `I—♭VI—♭VII—I` | Hero Cadence | major | C A♭ B♭ C |

Nicknames contain no hyphen, by the one-hyphen invariant of
`../mpc-export-specification.md` §5.1 ("Major Third Mediants", not
"Major-Third").

### 3.2 Palette priorities

```js
// 1, 2 - major mediants
{ preferred: ['major', 'major7', 'add9'], allowed: ['sus2', 'major9', 'minor'], avoided: ['dom7', 'dom9', 'diminished', 'augmented', 'quartal'] }
// 3 - minor mediants
{ preferred: ['minor', 'minor7', 'minAdd9'], allowed: ['sus2', 'minor9', 'major'], avoided: ['dom7', 'major7', 'diminished', 'augmented', 'quartal'] }
// 4 - hexatonic pole
{ preferred: ['major', 'minor', 'major7'], allowed: ['add9', 'sus2', 'minor7'], avoided: ['dom7', 'dom9', 'diminished', 'augmented', 'quartal'] }
// 5, 6 - Lydian
{ preferred: ['major', 'major7', 'add9', 'major6'], allowed: ['sus2', 'major9', 'minor', 'minor7'], avoided: ['dom7', 'dom9', 'diminished', 'augmented', 'quartal'] }
// 7 - Dorian drift
{ preferred: ['minor', 'major', 'minor7'], allowed: ['sus2', 'sus4', 'add9', 'minAdd9'], avoided: ['dom7', 'major7', 'diminished', 'augmented', 'quartal'] }
// 8 - minor lift
{ preferred: ['minor', 'major'], allowed: ['dom7', 'minor7', 'sus4'], avoided: ['major7', 'diminished', 'augmented', 'quartal'] }
// 9 - wandering fifth
{ preferred: ['minor', 'major'], allowed: ['sus4', 'sus2', 'minor7', 'add9'], avoided: ['dom7', 'major7', 'diminished', 'augmented', 'quartal'] }
// 10 - hero cadence
{ preferred: ['major', 'sus4', 'add9'], allowed: ['major7', 'sus2', 'minor'], avoided: ['dom7', 'dom9', 'diminished', 'augmented', 'quartal'] }
```

Every type named exists in `CHORD_INTERVALS`. The palette only offers a
declared type on degrees of the matching family (`getChordFamily`), so
`add9` lands on major degrees and `minAdd9` on minor ones.

### 3.3 English locale entries, verbatim

Under `progressions["Film/Cinematic"]` in `locales/en.json`, keyed by value,
each with `name` equal to the value, the nickname above, and:

**1 · Major Third Mediants**

> Chromatic mediants a major third either side of the tonic: C A♭ C E. Each
> pair shares one note and both chords are major, so the ear accepts the
> shift as colour rather than modulation. The drop to ♭VI is the classic spy
> and fantasy move, the lift to III its brighter mirror image.

**2 · Minor Third Mediants**

> Chromatic mediants a minor third either side of the tonic: C E♭ C A. Both
> are major and each shares one note with I. ♭III darkens without leaving
> major, VI brightens; alternating them around the tonic gives the floating,
> scene-change quality of adventure scoring.

**3 · Minor Mediants**

> The minor-key form of the mediant trick: Cm A♭m Cm Em. A minor tonic
> shifting to the minor chords a major third below and above, each sharing
> one note with it. Darker and more unsettled than the major form; the shift
> to ♭vi in particular is a horror and creature-theme staple.

**4 · Hexatonic Pole**

> C A♭m A♭ C. A major triad moving to the minor triad a major third below
> shares no note with it and flips quality, the most remote relation two
> triads can have while every voice moves by a semitone. The ♭VI major that
> follows explains the strange chord, and the return to I closes the loop.
> The signature uncanny change of fantasy and science-fiction scoring.

**5 · Lydian Vamp**

> Two chords, C D: a major tonic and the major chord a whole step above it.
> The II contains the raised fourth that defines the Lydian mode, so the
> vamp floats without pulling anywhere. The open, airborne sound of flight
> and wonder cues.

**6 · Lydian Float**

> C D Em D. A Lydian loop that never visits a dominant: the major II and the
> minor iii circle the tonic, and the raised fourth inside II keeps the
> progression open. Add the major seventh and the sixth the palette offers
> for the suspended, time-slowing character of modern space scoring.

**7 · Dorian Drift**

> Cm Gm B♭ F. Minor tonic, minor dominant, subtonic and the major IV that
> marks Dorian. Every chord is diatonic to C Dorian and none is a
> leading-tone dominant, so the loop returns to i by a plagal IV-i step
> instead of resolving. The endless-motion feel of slow-build electronic and
> film cues.

**8 · Minor Lift**

> Cm E♭ G Cm. Minor tonic up to the relative major ♭III, then to a major V
> from harmonic minor before returning home. The rising third followed by
> the dominant turns a dark loop hopeful without leaving the key: the brief
> lift before a resolution.

**9 · Wandering Fifth**

> Cm A♭ F A♭. Minor tonic, ♭VI and the Dorian major IV: the three chords
> that let a single inner voice climb by semitones over a held bass. With C
> kept under all three, the fifth G rises to A♭ and then to A. The Smooth
> variant finds that voicing; keep the first chord's bass for the swelling,
> heroic effect.

**10 · Hero Cadence**

> C A♭ B♭ C. The tonic, then the two major triads a whole step apart below
> it, ♭VI and ♭VII, climbing back home. A double plagal approach to I, the
> triumphant ending formula of adventure scores and victory themes, here as
> a loop so the tonic is both departure and arrival.

Translate into `fr`, `es`, `de`, `pt`, `it`, keeping chord names and
numerals.

### 3.4 Counts and documentation

- `README.md`: "173 progression palettes" becomes "183", in the three places
  it occurs (lines 61, 114, 176 at baseline); the Film/Cinematic bullet
  under "Battle-Tested Progression Palettes" gains "chromatic mediants,
  hexatonic pole, Lydian and Dorian loops"; "100+ progressions feature
  genre-specific palette intelligence" stays true.
- Root `README.md`: "173 genre templates" becomes "183".
- `CHANGELOG.md`: entry listing the ten by nickname.
- The pack grows by up to 50 `.progression` files and 600 MIDI files;
  re-measure.

## 4. Code changes

| File | Change |
|---|---|
| `modules/musicTheory.js:638-660` | ten template objects |
| `locales/*.json` | ten entries each, six files |
| `README.md`, `../../README.md` | counts |
| `CHANGELOG.md` | entry |
| `docs/catalogue-snapshot.txt` | regenerated, ten new blocks |

## 5. i18n

Ten × (`name`, `nickname`, `description`) × six locales.
`check-translations.mjs` enforces the cross-check against `musicTheory.js`.

## 6. Acceptance

1. In C, Classic variant, row 1 of each of the ten reads exactly the "In C"
   column of §3.1 (pads 1-2 for Lydian Vamp, then palette).
2. Wandering Fifth, key E, Smooth variant: pads 1-3 voice as E G B, E G C,
   E A C♯ (MIDI 64 67 71, 64 67 72, 64 69 73), the common-tone bass the
   nickname promises. This is measured today on the equivalent chords and
   must hold.
3. With spec 04 merged, none of the ten has a dominant-seventh chord in row
   4 except Minor Lift, whose priorities allow it.
4. Snapshot diff: exactly ten new blocks, no changed existing block.
5. The MPC display names of the ten are `Film/Cinematic-<Nickname> <Style> (<value with spaces>)`,
   each with exactly one hyphen; `build-pack.mjs` verifies this.
6. Full verification protocol passes.

## 7. Out of scope

- The ascending line cliché of the spy theme (spec 09, needs a chord type).
- Templates in other genres for the same devices. Jazz already has the
  descending line cliché; Pop/Rock has the upward mediant in a song context.

## 8. Implementation notes

Implemented as specified: ten template objects appended to `Film/Cinematic` in the
order of §3.1, each with the priorities of §3.2, and ten entries in each of six
locale files. Departures and findings:

- **Audit check H2 was narrowed to minor tonality.** `I—♭VI—I—III` and
  `I—♭III—I—VI` each hold a `♭` token and a bare `III` or `VI`, which H2 (spec 02,
  "either tonality, no whitelist") reported, and they were the only findings in the
  audit. In a major key those are two chromatic mediants read against the parallel
  major, which is the whole point of the pair. The maintainer's decision: H2 now
  applies to minor-tonality templates only, as spec 02's four baseline findings all
  were. Spec 02's text is amended and says so.
- **Nicknames are English in every locale.** Every existing nickname is, and the
  pack always uses the English one (`../mpc-export-specification.md` D2), so only
  the descriptions are translated. The English descriptions follow the spec
  verbatim, with "colour" spelt "color" as everywhere in `en.json`.
- **Counts.** "173" became "183" in the generator README's three places and the root
  README's two; the Film/Cinematic bullet names the new devices. The export
  specification's "All 173 progressions have one" (§5.3) read as a claim about the
  catalogue and now says "Every progression has one", so it cannot go stale again.
  Its audit figures in §7 are historical and untouched.
- **One English text left as written, and doubted.** Hero Cadence calls ♭VI-♭VII-I
  "a double plagal approach to I". The double plagal is ♭VII-IV-I; ♭VI-♭VII-I is the
  Aeolian cadence (spec 02's Power Cadence text calls it that). The harmony
  described is right and the name is not.

Measured against `a91f480`, the commit before spec 06 and the description fixes that
landed on the branch meanwhile; neither changes what the catalogue produces, and the
figures were re-measured on the rebased tree:

| Quantity | Before | After |
|---|---|---|
| Progression templates / Film/Cinematic templates | 173 / 7 | 183 / 17 |
| Variants audited, 12 keys and 5 styles | 10 380 | 10 980 |
| Snapshot blocks | 173 template, 34 scale | 183 template, 34 scale: ten new, none changed |
| `.progression` files in the pack | 855 | 904 |
| MIDI files in the pack | 10 267 | 10 855 |
| Pack names carrying two styles | 10 | 11 |

The pack grows by 49 `.progression` files, not 50, because Minor Mediants' Classic
and Jazz variants are identical and fuse into `Classic+Jazz`; the 588 MIDI files are
those 49 times twelve keys. The longest display name of the ten is 62 characters and
every one has exactly one hyphen, checked for all five style labels and the fused one.

Acceptance, all measured: item 1, row 1 of each in C is the "In C" column of §3.1,
as progression pads, with palette chords after them (after pad 2 for Lydian Vamp);
item 2, Wandering Fifth in E, Smooth, voices pads 1 to 3 as 64 67 71, 64 67 72 and
64 69 73; item 3, over the 600 variants of the ten in 12 keys and 5 styles, no
dominant-family chord reaches row 4 of any but Minor Lift, which allows it; item 4,
ten new blocks and no changed one; item 5, as above; item 6, the full protocol.
