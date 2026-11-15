# 01 - Template identity: category and value

| | |
|---|---|
| Status | proposed |
| Type | defect |
| Size | M |
| Depends on | 00 |
| Blocks | 02, 08 |
| Recommended model | Claude Opus 5.5 (`claude-opus-5-5`): touches persistence, the dropdown, the generation API and the pack builder, with a backward-compatibility requirement on URLs |

## 1. Problem

A template is identified everywhere by its `value` string alone:

- `app.js:831` sets `option.value = prog.value` for the dropdown, and the
  change handler at `app.js:1697` reads `this.value`;
- `modules/storage.js:14` validates the persisted `progression` against the
  set of values;
- `generateVariant()` (`modules/generation.js:505`) finds the template with
  the first `progressions[category].find(p => p.value === progression)` that
  matches, in object order, to read its `paletteFilter` and
  `palettePriorities`;
- `findProgressionCategory()` (`modules/musicTheory.js:1133`) returns the
  first category containing the value, and `app.js:924` uses it to build the
  MPC display name and the file name;
- `tools/build-pack.mjs:46` calls `generateVariant()` with the value only,
  even though its own loop knows the category.

Sixteen values are listed under more than one genre. Measured over the
catalogue, eighteen later-genre entries declare a `palettePriorities` or a
`paletteFilter` that can never be read:

| Value | Genres (`*` has priorities, `†` has a filter) |
|---|---|
| `I—V—vi—IV` | Pop/Rock* · Folk/Singer-Songwriter† · Synthwave/Retrowave* · Reggae/Dub* |
| `vi—IV—I—V` | Pop/Rock* · Electronic/Modern · Italo-Disco/House · Synthwave/Retrowave* |
| `I—vi—IV—V` | Pop/Rock · Italo-Disco/House · Reggae/Dub* |
| `I—♭VII—IV—I` | Pop/Rock · Modal Interchange* · African Dance |
| `i—IV—i—V` | Blues/Soul · Modal Interchange* |
| `I—♭III—♭VII—IV` | Modal Interchange* · Hip-Hop/Trap |
| `i—♭VII—♭VI—V` | Classical/Modal · Latin/Bossa · Metal/Rock* · Jungle/Drum'n'Bass · Synthwave/Retrowave* |
| `i—♭VI—♭VII` | Hip-Hop/Trap* · Acid/EBM* |
| `i—♭III—♭VI—♭VII` | Hip-Hop/Trap* · Metal/Rock* |
| `i—♭VII—♭VI` | Hip-Hop/Trap · Reggae/Dub* |
| `i—♭VII—iv` | Hip-Hop/Trap† · Acid/EBM* |
| `i—♭VI—♭VII—i` | Film/Cinematic · Metal/Rock* · Reggae/Dub* |
| `I—IV—I—V` | Folk/Singer-Songwriter* · African Dance · Reggae/Dub* |
| `i—v—♭VII—iv` | Metal/Rock* · Jungle/Drum'n'Bass |
| `i—V—♭VI—♭VII` | Metal/Rock* · Trance/Psytrance/Goa* |
| `i—♭II—♭VII—i` | Metal/Rock* · Trance/Psytrance/Goa* |

Consequences, each verified:

1. Selecting Synthwave/Retrowave "Synthpop" (`I—V—vi—IV`) generates with the
   Pop/Rock priorities (preferred `major7`) instead of its own (allowed
   `sus2`, `sus4`), and exports with the MPC heading
   `Pop/Rock-Axis of Awesome`. Reggae/Dub "Reggae Axis" (same value) avoids
   `major7` in its declaration and gets it preferred.
2. The published pack has the same defect in content: `build-pack.mjs` names
   the file after the right genre but fills it with the first genre's palette.
3. On reload, `applyPreferences()` sets `progressionSelect.value` to the
   stored value, which selects the *first* option carrying it. A user who
   chose the Synthwave entry sees the Pop/Rock entry after a refresh.

Duplicates across genres are not a mistake to remove. The same four chords
are a pop anthem, a reggae skank and a synthwave loop; what differs is the
palette each genre wants around them, which is exactly what the priorities
encode. The identity model must carry the genre.

## 2. Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | A template's identity is the pair **(category, value)**. | The value is the music, the category is its context. Both are needed to pick a palette and a name. |
| D2 | No new `id` field on templates. | 173 edits for nothing the pair does not already provide; locale keys are already nested `progressions.<category>.<value>`. |
| D3 | Dropdown options keep `value = prog.value` and gain `data-category`. Selection is **restored by scanning options** for the matching pair, never by `select.value = …`. | Keeps every piece of code that reads `option.value` working; the composite lives in the DOM where the duplicate actually is. |
| D4 | Persistence gains a `genre` field (localStorage key and URL parameter), **optional**; the `progression` field keeps the bare value. | Old URLs and stored preferences keep working. A missing or inconsistent `genre` falls back to today's behaviour: first category containing the value. |
| D5 | `generateVariant()` / `generateVariants()` accept an optional `category`; `findProgressionCategory(value, preferred)` returns `preferred` when that category contains the value. | One resolution rule, used by the app, the pack builder and the audit. |
| D6 | `tools/build-pack.mjs` passes the category. | It is the one producer of the pack; its content must match what the app generates for the same entry. |
| D7 | The URL parameter is named `genre`, not `category`. | The user-facing word in the dropdown headings is the genre; `category` is the code's word. |

## 3. Normative specification

### 3.1 Resolution rule

```
resolveTemplate(value, category?):
  if category is a key of progressions and progressions[category] has value -> that entry, that category
  else -> first category in object order that has value, its entry        (today's behaviour)
  else -> null
```

`findProgressionCategory(value, preferred = null)` implements the category
half of this and keeps its current single-argument behaviour.

### 3.2 Generation API

`generateVariant(variantType, { key, mode, progression, category, chordRequirements })`
and `generateVariants({ …, category })` read `palettePriorities` and
`paletteFilter` from `resolveTemplate(progression, category)`. Nothing else
in generation depends on the category; the chords are the same.

### 3.3 Application state

`app.js` gains `let selectedCategory = 'Pop/Rock'` beside
`selectedProgression`. Set on dropdown change from
`this.selectedOptions[0].dataset.category`; set on restore from the
sanitised preferences, falling back to `findProgressionCategory(value)`.

Everything that today calls `findProgressionCategory(selectedProgression)`
(`app.js:924`) uses `selectedCategory` instead, so the MPC display name and
file name follow the chosen genre.

Restoring the dropdown: iterate `progressionSelect.options`, pick the first
whose `value` and `dataset.category` both match, set `selectedIndex`. When no
option matches the pair, match on value alone.

Any code that disables or filters progression options (the Chord Matcher's
compatibility pass, if it touches progressions) addresses options by the pair
or by option element, never by `select.value`.

### 3.4 Persistence

`modules/storage.js`:

- `saveToLocalStorage(...)` and `updateURL(...)` take and write `genre`.
- `sanitizePreferences()` accepts `genre` only if it is a key of
  `progressions` **and** `progressions[genre]` contains the accepted
  `progression`; otherwise the field is dropped and `progression` stands
  alone. Untrusted input, same posture as the existing comment describes.
- `loadFromURL()` reads `genre`; `applyPreferences()` returns it and performs
  the option scan of §3.3 instead of assigning `select.value`.

URL example: `?key=C&mode=Major&progression=I%E2%80%94V%E2%80%94vi%E2%80%94IV&genre=Synthwave%2FRetrowave`.

### 3.5 Pack builder

`tools/build-pack.mjs:46` passes `category` into `generateVariant()`. No
change to naming; it already had the category.

### 3.6 Audit

`tools/audit-theory.mjs` iterates categories already; pass the category into
`generateVariant()` so the audit exercises the same resolution as the app.

## 4. Code changes

| File | Change |
|---|---|
| `modules/musicTheory.js:1133` | `findProgressionCategory(value, preferred = null)` |
| `modules/generation.js:505-540` | `category` option; template lookup through the resolution rule |
| `modules/generation.js:1026` | `generateVariants` passes `category` through |
| `modules/storage.js` | `genre` in save, URL, load, sanitise, apply; option scan |
| `app.js` | `selectedCategory`; dropdown `data-category`; change handler; restore; naming call sites at 924 and wherever `namingParams` is built |
| `tools/build-pack.mjs:46` | pass `category` |
| `tools/audit-theory.mjs` | pass `category` |
| `README.md` | no claim to change; optional one line under "Progression Palette Mode" that the same progression may appear under several genres with a palette tuned to each |

## 5. i18n

None. No new user-visible string.

## 6. Acceptance

1. **Identity test** (new, in the audit or a tiny script): for every
   `(category, template)` pair in `progressions`, the template object
   returned by the resolution rule is that entry, by reference.
2. **Snapshot diff** touches exactly the eighteen shadowed entries (the
   later-genre rows of the table in §1 marked `*` or `†`), and within them
   only the pad order and chord types that the entry's own priorities
   explain. The snapshot renders each `(category, value)` block separately,
   so the diff localises by genre.
3. **Pack**: the display name of every file is unchanged; the content of the
   eighteen entries' files changes; re-measure and record the `.progression`
   count (839 at baseline, it may move as styles fuse differently).
4. **App, manual**: select Synthwave/Retrowave "Synthpop", generate, export one
   variant; the JSON `name` begins `Synthwave/Retrowave-Synthpop`. Reload the
   page; the Synthwave entry is still selected. Open an old-style URL without
   `genre`; the Pop/Rock entry is selected, as today.
5. **Sanitiser**: a URL with `genre=Reggae/Dub&progression=ii—V—I` (a value
   that genre does not contain) resolves to Jazz/Functional `ii—V—I`, and the
   stored preferences do not keep the bogus genre.
6. Full verification protocol passes.

## 7. Out of scope

- Removing the cross-genre duplicates. See §1, last paragraph.
- Changing the dropdown's grouping or labels.
