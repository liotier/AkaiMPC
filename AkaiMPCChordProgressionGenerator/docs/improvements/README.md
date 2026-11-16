# Improvement specifications - Chord Progression Generator

Fourteen specifications, one per improvement, each written to be handed to an
implementing session on its own. This index fixes the order, the dependencies,
the shared verification protocol and the recommended model for each.

Status is recorded in each spec's header. Specs 00 to 09, 11 and 13 are
implemented; spec 12 is dropped; the rest are **proposed**.

## 1. Provenance

The specs come from a review of the generator against a video on cinematic
chord tricks (related thirds, modal interchange, modal keys, plagal "endless
motion", the wandering fifth, the hero cadence, borrowing from pop) and against
textbook harmony. The video itself is not the subject and its own errors are
left alone; what matters is what it revealed about the generator.

Method: every claim below was measured by running the real generation
functions - `generateVariant()`, `generateProgressionChords()`,
`determineChordFunction()` - over the catalogue, not by reading the code and
inferring. Baseline commit: `0593d6d`. Numbers in the specs are measured unless
marked as estimates.

Baseline measurements, all at `0593d6d`:

| Quantity | Value |
|---|---|
| Template entries / unique values | 173 / 146 |
| Values listed under more than one genre | 16 |
| Later-genre entries whose own priorities or filter are shadowed by the first match | 18 |
| Minor-tonic / major-tonic / tonic-less templates | 68 / 96 / 9 |
| Minor-key templates executed in the wrong numeral convention | 12 |
| Descriptions claiming "from harmonic minor" for a chord harmonic minor does not contain | 6 |
| Variants over 12 keys × 5 styles | 10 380 |
| Pad pairs within one variant that sound the identical chord | 1 265 (1 085 with the later pad in row 4, 180 inside rows 1-3) |
| Film/Cinematic templates carrying palette priorities | 0 of 7 |
| Templates carrying priorities or a filter, all genres | 105 of 173 |

The CI audit (`tools/audit-theory.mjs`) passes on all of this. It asserts that
every pad agrees with its own label; it does not assert that a template means
what its nickname and description say, nor that two pads differ, nor that the
palette respects a template's declared priorities. Spec 00 adds the missing
instrument, and the later specs rely on it.

## 2. Conventions used in these specs

- **Roman numerals are read against the parallel major**, as the engine does
  and as the comment in `generateProgressionChords()` states. In a minor key
  the natural-minor mediant, submediant and subtonic are therefore ♭III, ♭VI
  and ♭VII, never III, VI, VII. Spec 02 is about templates that broke this.
- **Template values are quoted verbatim**, with their U+2014 em dash separator
  (`I—V—vi—IV`). That character is data, not punctuation.
- **Rows** follow the data model: row 1 is pads 1-4 and holds the progression,
  row 4 is pads 13-16 and is computed. On screen row 1 is the bottom row.
- **Chord names** in exports stay ASCII (`Ab7`, `Em#5`); roman numerals may
  carry ♭ and ♯ (U+266D, U+266F). This follows `CHORD_NAME_SUFFIX` and D4 of
  `../mpc-export-specification.md`.
- Each spec has a **Decisions** table. Those are settled by this review; an
  implementer who disagrees should say so in the PR rather than deviate
  silently.
- "**Snapshot**" means the file introduced by spec 00. "**Pack**" means the
  output of `tools/build-pack.mjs`.

## 3. The specifications

| # | Spec | Type | Size | Depends on | Recommended model |
|---|---|---|---|---|---|
| 00 | [Catalogue snapshot](00-catalogue-snapshot.md) | tooling | S | - | Haiku 5.5 |
| 01 | [Template identity: category and value](01-template-identity.md) | defect | M | 00 | Opus 5.5 |
| 02 | [Minor-key templates in the wrong numeral convention](02-minor-key-numerals.md) | defect, data | M | 00, 01 | Sonnet 5.5 |
| 03 | [Row-4 scoring: function classifier and root motion](03-row4-function-scoring.md) | defect | S | 00 | Haiku 5.5 |
| 04 | [Row 4 honours palette priorities](04-row4-palette-priorities.md) | defect | M | 00, 03 | Sonnet 5.5 |
| 05 | [Pads that duplicate a chord or misname it](05-duplicate-sounding-pads.md) | defect | M | 00 | Sonnet 5.5 |
| 06 | [A strict template parser](06-template-parser.md) | refactor | M | 00 | Opus 5.5 |
| 07 | [Key-mode awareness for palette and row 4](07-minor-key-awareness.md) | defect, design | L | 00, 02, 03, 04, 05 | Opus 5.5, checkpoint reviewed |
| 08 | [Ten Film/Cinematic templates](08-cinematic-templates.md) | feature, data | M | 00, 01; 04 recommended | Sonnet 5.5 |
| 09 | [The ascending line cliché: a minor ♯5 chord type](09-ascending-line-cliche.md) | feature | S | 00, 06 | Sonnet 5.5 |
| 10 | [Row 4: chromatic mediants and mode flips](10-row4-mediants.md) | feature | M | 03, 04, 05, 07 | Opus 5.5 |
| 11 | [A Pedal voicing style](11-pedal-voicing-style.md) | feature | M | 00 | Opus 5.5 |
| 12 | [Dropped: align the Finder's minor-key numerals](12-finder-numeral-convention.md) | consistency, dropped | S | - | - |
| 13 | [Spelling that follows the key](13-spelling.md) | defect | L | 00 | Opus 5.5 |

Sizes: S is under a day of a session's work with review, M one to two, L a
multi-step job that should be reviewed at a checkpoint before it touches the
catalogue.

## 4. Order and dependencies

```
00 snapshot
 ├── 01 identity ──► 02 numerals ──┐
 │                                 │
 ├── 03 function scoring ──► 04 priorities ──┤
 │                                           ├──► 07 minor-key awareness ──► 10 mediants
 ├── 05 duplicate pads ──────────────────────┘
 │
 ├── 06 parser ──► 09 line cliché
 │
 ├── 08 cinematic templates   (after 01 and 04; independent of 07)
 │
 ├── 13 spelling              (independent; recommended before 07)
 │
 └── 11 pedal voicing         (independent)

12 finder convention          (dropped)
```

Why this order:

- **00 first.** Every later spec changes what the catalogue produces, and the
  only honest way to review such a change is a readable diff of chord names.
  Without it, the specs' acceptance sections cannot be checked.
- **01 before 02 and 08.** Six of the twelve corrected values in 02 collide
  with values already listed under another genre, and 08 adds templates whose
  genre must drive their palette. Both need genre to be part of a template's
  identity, which today it is not.
- **03, 04, 05 before 07 and 10.** They repair the row-4 machinery that 07
  and 10 then extend. Doing the extension first would build on scoring that
  classifies vi as a dominant.
- **06 before 09.** The ♯5 suffix needs a parser that reads suffixes instead
  of stripping them.
- **13 before 07, recommended.** 07 changes the chords of 68 minor-key
  palettes, and its snapshot diff is easier to review once those chords are
  spelled in their key rather than as flats.
- **07 before 10.** Mediant candidates differ by key mode; 10 needs the
  tonality field that 07 introduces.

Three specs are mutually independent and can run in parallel sessions: 03,
05 and 06. So can 08 and 11, once their dependencies are merged.

## 5. Verification protocol

Every implementing session runs all of this before opening a PR, from
`AkaiMPCChordProgressionGenerator/`:

```bash
node tools/audit-theory.mjs
```

```bash
node tools/check-translations.mjs
```

```bash
node tools/build-pack.mjs
```

```bash
node tools/catalogue-snapshot.mjs --check
```

The fourth exists once spec 00 is merged. Rules:

1. A spec that is **not meant to change output** (06, and 01 for the 155
   entries it does not affect) proves it with the pack: record
   `sha256sum pack/*.zip` before and after, and the snapshot check must pass
   unchanged. Builds are deterministic (`../mpc-export-specification.md` §9),
   so a differing hash is a regression.
2. A spec that **is meant to change output** regenerates the snapshot with
   `--write`, commits it in the same PR, and the PR description points at
   the snapshot diff as the review artefact. The diff must touch only the
   templates the spec names; anything else is a side effect to explain or fix.
3. Counts quoted in the acceptance sections (pack file counts, duplicate pad
   pairs, lint findings) are re-measured and written into the PR, not copied
   from the spec.
4. New or changed user-visible strings go into all six locale files
   (`en`, `fr`, `es`, `de`, `pt`, `it`); `check-translations.mjs` fails
   otherwise, and it also fails if a template value changes without its locale
   key following.
5. No spec in this directory calls for a pull request to be merged by the
   implementer or for the pack to be published; those remain the maintainer's.

## 6. Model recommendations

Recommendations are by task shape - how much musical judgement the work needs,
how wide the blast radius is, and how much of the verification can be
mechanical - not by any benchmark. Where a cheaper model will do if the spec's
decisions are followed to the letter, the table says so.

| Model | Identifier | Use it for | Specs |
|---|---|---|---|
| Claude Haiku 5.5 | `claude-haiku-5-5` | Mechanical changes with a complete specification and a mechanical acceptance test: a new tool whose output format is fully given, a classifier replaced by a table | 00, 03 |
| Claude Sonnet 5.5 | `claude-sonnet-5-5` | Bounded data and logic changes where the English text is supplied and the theory decisions are already made; translation into the five other locales; small algorithmic changes whose effect the snapshot makes visible | 02, 04, 05, 08, 09 |
| Claude Opus 5.5 | `claude-opus-5-5` | Cross-cutting refactors with a byte-identity requirement, changes to persistence and identity, voicing algorithms, and anything that must weigh several interacting scoring rules | 01, 06, 07, 10, 11, 13 |
| Claude Fable 5.2 | `claude-fable-5-2` | Not required by any spec. It was first recommended for 07; that was revised once the other specs proved implementable from their tables, with judgement calls brought back for review | - |

Notes:

- 02 and 08 ask for descriptions in six languages about harmony. The English
  text is given verbatim in the specs so that the implementer translates
  rather than authors. If a maintainer later wants the implementer to author
  new descriptions, move those two to Opus 5.5.
- 06 is a refactor whose correctness is fully mechanical to check (pack hash
  and snapshot unchanged, 173 templates parse identically), which is why Opus
  5.5 is enough despite the risk. What the model must bring is the discipline
  to reproduce three dead-code quirks exactly, listed in the spec.
- 07 was first recommended for Fable 5.2, because every candidate chord it
  adds or removes is a theory decision. Those decisions are in its tables, and
  its checkpoint stops the work for review before tooltips and analysis. Opus
  5.5 with that review is the recommendation now.
- Whatever the model, the session is given the spec path and this README, and
  is told that the Decisions tables are settled.

A ready-made prompt for any spec:

> Implement `AkaiMPCChordProgressionGenerator/docs/improvements/NN-name.md`.
> Read `docs/improvements/README.md` first for conventions and the verification
> protocol. The spec's Decisions table is settled; raise disagreement in the PR
> description, do not deviate. Run the full verification protocol and put the
> re-measured numbers in the PR.

## 7. Minor findings folded into the specs

Not worth a spec of their own; each is handled inside the spec named.

| Finding | Folded into |
|---|---|
| `scoreCandidate()` counts a root a semitone above an existing root as good voice leading but not a semitone below (intervals 1, 5, 7, never 11) | 03 |
| The Jazz seventh-upgrade appends a suffix to numerals that already carry one: 168 pads in the key of C (`i99`, `V99/V`, `Isus4sus4`, `vii°ø7`), found by the snapshot of spec 00 | 05 |
| A template whose only setting is a `paletteFilter` never receives the extended types the filter names: Folk "Post-Rock Build" lists `quartal` and gets none, because declared colours are read from `palettePriorities` only | 04 |
| Quartal chords (`quartal` C F B♭, `quartal4` C F B♭ E♭) are named `sus4` and `sus4(add11)`, though a sus4 chord has a fifth and no seventh: 70 pads in 7 templates in the key of C, plus 12 in Scale Mode, exported to the MPC under the wrong name. The audit cannot see it because it compares a name's suffix with the table, not with the notes. Decided: seventh-chord symbols, `7sus4(no5)` and `m7(11)` | 05 |
| The note names printed on each pad spell every chord as a stack of thirds: Csus4 reads C E♯ G, Csus2 C E♭♭ G, C6 C E G B♭♭, a quartal chord C E♯ A♯. Ten chord types are affected, among them sus2, sus4, 7sus4, 6, m6 and 6/9; the diminished seventh's B♭♭ is correct. Found while specifying the quartal fix. Specified | 13 |
| Chord names in sharp keys are spelled with flats: `getEnharmonicContext()` gives every root on a black key a flat whatever the key, so A major's vi reads `Gbm` for F♯m, E major's ii and vi read `Gbm` and `Dbm`, and B major's V reads `Gb`. It reaches the app's displays in G, D, A, E and B, and every `.progression` file exported from the app in those keys, whose chord names Pad Perform shows on the pads. The published `.progression` pack, in C, and the MIDI files, which carry no chord names, are spared. Found while reviewing spec 09. Specified | 13 |
| `analyzeExistingChords()` treats `iii` and `vii°` as subdominant because the string contains `ii` | 03 |
| README "Dynamic Row 4" section claims genre weighting that does not exist | 04 |
| `tools/audit-theory.mjs` whitelists 1 227 "functional twins" that are plain duplicate pads; the measured figure today is 1 265 | 05 |
| Three special cases in `parseProgression()` (`♯I°`, `♯II°`, `♯iv°`) and two map entries (`♭IIIM7`, `♭VIM7`) are unreachable dead code | 06 |
| The "do not label diatonic minor chords as borrowed" guard in `generateVariant()` is dead because template mode fixes the scale to Major | 07 |
| `analyzeProgression()` in `app.js` reports "Modal interchange" for every minor-key template because ♭VII contains ♭ | 07 |
| `getChordTooltip()` upper-cases the numeral, so a major VI pad is described as "relative minor" | 10 |
| `tools/build-pack.mjs` passes no genre to `generateVariant()`, so the pack carries the first genre's palette under the later genre's name | 01 |
| Counts in `../mpc-export-specification.md` §9 (839 files, 1 227 twins) are historical and will drift; they are not to be "corrected" there | - |

## 8. Non-goals

- Changing the engine's numeral convention. 161 templates, the exported pack
  names and the published documentation all assume parallel-major reading.
- Making the Finder and the Generator share code, or agree. Spec 12, which
  would have aligned their minor-key numerals, was dropped.
- Any change to the MPC naming scheme or the pack structure beyond the file
  count growing with new templates and styles.
- Re-tuning the Smooth voice-leading scorer. It behaves correctly in every
  case measured here, including reproducing the wandering fifth unaided.
