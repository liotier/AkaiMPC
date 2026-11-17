# 16 - Five exports nothing uses

| | |
|---|---|
| Status | specified |
| Type | cleanup |
| Size | S |
| Depends on | - |
| Blocks | - |
| Recommended model | Claude Haiku 5.5 (`claude-haiku-5-5`): five deletions with a byte-identity proof |

## 1. Problem

Five exported names are referenced nowhere: not by `app.js`, another module,
`service-worker.js`, the tools, the HTML pages or the Finder. Each appears
once in the repository, at its own definition:

| Name | File | Introduced | What it is |
|---|---|---|---|
| `getAudioContext()` | `modules/audio.js:38` | `54cb7d9`, 2025-11-28 | getter for the module's audio context; callers use `initAudioContext()` |
| `getMidiOutput()` | `modules/audio.js:56` | `54cb7d9`, 2025-11-28 | getter for the selected MIDI output; the module reads its own variable |
| `calculateInterval()` | `modules/constants.js:194` | `54cb7d9`, 2025-11-28 | interval between two MIDI notes, mod 12 |
| `STORAGE_KEYS` | `modules/constants.js:149` | `54cb7d9`, 2025-11-28 | key names for a per-field storage scheme |
| `getOptimalVoiceAssignment()` | `modules/musicTheory.js:2302` | `f4c914e`, 2025-12-25 | voice-by-voice movement from the Hungarian algorithm; the voicing code calls `calculateVoiceLeadingDistance()` instead |

`STORAGE_KEYS` also misleads: `modules/storage.js` keeps one JSON object
under its own `STORAGE_KEY`, and that object has a `genre` field (spec 01)
that the constant does not list. A reader who trusts the constant learns the
wrong scheme.

## 2. Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Delete the five, with their doc comments. | Dead code that is exported looks like an API; it costs reading time and invites wrong assumptions. |
| D2 | Keep `MUSIC` and `hungarianAlgorithm()`: `midiToFrequency()` uses `MUSIC`, and `calculateVoiceLeadingDistance()` uses the algorithm. | Only what becomes unreferenced goes. |
| D3 | Leave alone the twenty exports used only inside their own module (`spellRoot`, `SUFFIX_TABLE`, `generateRow4Candidates` and others). | They are used; exporting them is a style question, and several are exported so that a tool can import them later. |
| D4 | No guard is added. | An "every export is imported" check would need an allowlist of those twenty, which is more to maintain than the five lines it would catch. |

## 3. Acceptance

- Before deleting, `grep -rnw` over the repository for each name returns its
  definition only. After deleting, it returns nothing.
- `node tools/audit-theory.mjs`, `node tools/check-translations.mjs` and
  `node tools/catalogue-snapshot.mjs --check` pass; the snapshot is
  unchanged.
- The pack is byte-identical: record `sha256sum pack/*.zip` before and after.
- In a browser, the page loads with no console error, a pad plays a sound,
  and the MIDI output selector still lists outputs where Web MIDI is
  available.
- No `CHANGELOG.md` entry: nothing a user sees changes.
