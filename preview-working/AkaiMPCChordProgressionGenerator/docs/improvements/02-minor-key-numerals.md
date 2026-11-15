# 02 - Minor-key templates written in the wrong numeral convention

| | |
|---|---|
| Status | implemented |
| Type | defect, data |
| Size | M |
| Depends on | 00 (snapshot), 01 (six corrected values duplicate values in other genres) |
| Recommended model | Claude Sonnet 5.5 (`claude-sonnet-5-5`): the new values, the English descriptions and the lint rule are given verbatim; the work is careful substitution, translation into five locales and one small audit check |

## 1. Problem

Two conventions exist for numbering chords in a minor key. Scale-relative
numbering counts the minor scale's own degrees, so Am G F in A minor is
"i VII VI"; most pop, film and guitar pedagogy writes it that way, and so does
the Finder. Parallel-major numbering counts against A major and marks the
lowered degrees, so the same chords are "i ♭VII ♭VI". The engine uses the
second, consistently and by design:

> Pure parallel major analysis: ALL roman numerals reference the parallel
> major scale, regardless of mode. Chord quality is determined ONLY by the
> roman numeral notation itself. - `generateProgressionChords()`,
> `modules/musicTheory.js:2920`

Twelve templates were written in the first convention and are executed in
the second. A bare `VII` therefore builds a major triad on the raised seventh
(G♯ major in A minor), and bare `III` and `VI` build major triads a semitone
above where the nickname wants them.

| Genre | Template | Nickname | Plays, in A | Nickname denotes |
|---|---|---|---|---|
| Pop/Rock | `i—V—VII—IV—VI—III—iv—V` | Hotel California | Am E A♭ D G♭ D♭ Dm E | Am E G D F C Dm E |
| Latin/Bossa | `i—V—i—VII` | Samba | Am E Am A♭ | Am E Am G |
| Folk/Singer-Songwriter | `i—III—IV—VI` | House of the Rising Sun | Am D♭ D G♭ | Am C D F |
| Metal/Rock | `VI—VII—i` | Power Cadence | G♭ A♭ Am | F G Am |
| Trance/Psytrance/Goa | `i—iv—VII—III` | Harmonic Minor Psy | Am Dm A♭ D♭ | see D3 |
| Trance/Psytrance/Goa | `i—♭VI—III—VII` | Dark Psy | Am F D♭ A♭ | Am F C G |
| Trance/Psytrance/Goa | `i—VII—VI—VII` | Full-On | Am A♭ G♭ A♭ | Am G F G |
| Trance/Psytrance/Goa | `i—♭II—VII—V` | Goa Classic | Am B♭ A♭ E | Am B♭ G E |
| Trance/Psytrance/Goa | `i—iv—i—VII` | Forest Psy | Am Dm Am A♭ | Am Dm Am G |
| Trance/Psytrance/Goa | `i—III—VII—IV` | Morning Trance | Am D♭ A♭ D | Am C G D |
| Synthwave/Retrowave | `i—♭VI—III—♭VII` | Dark Synth | Am F D♭ G | Am F C G |
| UK Bass | `i—VII—♭VI` | UK Garage | Am A♭ F | Am G F |

Evidence that the second column of chords is what was meant:

- The Eagles' recording is Bm F♯ A E G D Em F♯, three pairs each rising a
  fifth and a iv-V, in B minor
  ([guitaralliance](https://guitaralliance.net/hotel-california-verse-chord-progression/)).
  Transposed to A minor that is the right-hand column, not the generator's.
- The Animals' recording is Am C D F, Am C E
  ([JustinGuitar](https://justinguitar.com/songs/the-animals-house-of-the-rising-sun-chords-tabs-guitar-lesson-bs-610),
  [Ultimate Guitar](https://tabs.ultimate-guitar.com/tab/the-animals/house-of-the-rising-sun-chords-18688)).
  It contains neither D♭ major nor G♭ major.
- The Samba description says "major VII (from natural minor, not harmonic)".
  The natural minor's seventh chord is the subtonic, G in A minor.
- The Power Cadence description says "stepwise ascent" and "parallel fifths
  in metal". F G Am is two whole steps; G♭ A♭ Am is a whole step and a half.
- Four templates mix both conventions inside one string (`i—♭VI—III—VII`,
  `i—♭II—VII—V`, `i—♭VI—III—♭VII`, `i—VII—♭VI`). Nobody intends a ♭VI and a
  natural VII in the same four-chord loop.

Six descriptions compound the error with a false claim. They justify the bare
`VII`, `III` or `VI` as "from harmonic minor". Harmonic minor has no major
triad on either degree: its third-degree triad is augmented and its
seventh-degree triad is diminished
([musictheory.net](https://musictheory.net/lessons/50),
[A harmonic minor chord table](https://www.guitarcomposerstoolbox.com/guitar-harmonizer/a-harmonic-minor/)).
The texts ask for chords the named scale does not contain, and the engine
plays chords that neither that scale nor the natural minor contains.

The error reaches the user. The G♭ major pad in A minor carries the tooltip
"Submediant - relative minor"; the D♭ major pad is called "Mediant".

Why the audit passed: checks D and E assert that a pad agrees with its label.
Under the engine's convention `VII` and a G♯ major triad agree perfectly. The
audit measures internal consistency; it has no notion of intent. Spec 00's
snapshot is the instrument that would have shown `Am Ab Gb Ab` to a reader.

## 2. Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | **The engine's convention stays.** The data is corrected to it. | 161 other templates, every exported pack name and the README assume parallel-major reading. The Finder's convention is a separate question (spec 12). |
| D2 | Eleven templates are **transliterated**: every bare `III`, `VI`, `VII` in a minor-tonality template becomes `♭III`, `♭VI`, `♭VII`. | That is what each nickname and description demonstrably intends. |
| D3 | `i—iv—VII—III` "Harmonic Minor Psy" is **redesigned**, not transliterated, to `i—iv—V—♭VI`. | Its description promises "pure harmonic minor" and bright major chords on the raised degrees, which is self-contradictory. Transliteration gives `i—iv—♭VII—♭III`, a natural-minor loop duplicating Classical/Modal's and betraying the nickname. `i—iv—V—♭VI` (Am Dm E F) is genuinely all in A harmonic minor, keeps the nickname true and keeps the deceptive, non-resolving character. Alternative if the maintainer prefers fidelity to the old chord count over the nickname: `i—iv—♭VII—♭III` with the nickname changed. |
| D4 | The six "harmonic minor" claims and the Hotel California "descending chromatic bass line" claim are **rewritten**; all twelve English descriptions are replaced with the texts in §3.3. | A description that teaches wrong theory is worse than none. The bass of Hotel California is not chromatic; it is three pairs each rising a fifth, whose first chords descend by step. |
| D5 | Nicknames **do not change**. | They were never the problem; only the values and descriptions were. |
| D6 | A **lint** in `tools/audit-theory.mjs` makes the mistake unrepeatable: a minor-tonality template containing a bare `III`, `VI` or `VII` fails unless whitelisted on the template with a reason. | Same philosophy as the rest of that tool. |
| D7 | The six duplicates this creates across genres are **accepted**. | Spec 01 made (category, value) the identity. The psytrance repertoire really is the same handful of Aeolian loops as dark electronic; what differs is the palette. |

## 3. Normative specification

### 3.1 New values

| Genre | Old value | New value |
|---|---|---|
| Pop/Rock | `i—V—VII—IV—VI—III—iv—V` | `i—V—♭VII—IV—♭VI—♭III—iv—V` |
| Latin/Bossa | `i—V—i—VII` | `i—V—i—♭VII` |
| Folk/Singer-Songwriter | `i—III—IV—VI` | `i—♭III—IV—♭VI` |
| Metal/Rock | `VI—VII—i` | `♭VI—♭VII—i` |
| Trance/Psytrance/Goa | `i—iv—VII—III` | `i—iv—V—♭VI` (D3) |
| Trance/Psytrance/Goa | `i—♭VI—III—VII` | `i—♭VI—♭III—♭VII` |
| Trance/Psytrance/Goa | `i—VII—VI—VII` | `i—♭VII—♭VI—♭VII` |
| Trance/Psytrance/Goa | `i—♭II—VII—V` | `i—♭II—♭VII—V` |
| Trance/Psytrance/Goa | `i—iv—i—VII` | `i—iv—i—♭VII` |
| Trance/Psytrance/Goa | `i—III—VII—IV` | `i—♭III—♭VII—IV` |
| Synthwave/Retrowave | `i—♭VI—III—♭VII` | `i—♭VI—♭III—♭VII` |
| UK Bass | `i—VII—♭VI` | `i—♭VII—♭VI` |

Duplicates created (all tolerated under D7): `i—♭VI—♭III—♭VII` now appears
under Electronic/Modern, Trance and Synthwave; `i—♭VII—♭VI—♭VII` under
Electronic/Modern and Trance; `i—♭III—♭VII—IV` under Blues/Soul and Trance;
`i—♭VII—♭VI` under Hip-Hop/Trap, Reggae/Dub and UK Bass. Each keeps its own
`palettePriorities`; the Trance and Synthwave entries that had none should
receive the ones given in spec 04 §3.4 if that spec has landed, otherwise
stay without.

The `palettePriorities` of each template are unchanged by this spec.

### 3.2 Locale key renames

In all six `locales/*.json`, under `progressions.<genre>`, the object keyed by
the old value is re-keyed by the new value, and its `name` field is set to
the new value. `check-translations.mjs` cross-checks locale keys against
`musicTheory.js`, so a missed rename fails CI.

### 3.3 English descriptions, verbatim

Replace the `description` of each entry in `locales/en.json` with the text
below. Translate into `fr`, `es`, `de`, `pt`, `it`, keeping the chord names
and numerals as they are.

**Pop/Rock · Hotel California · `i—V—♭VII—IV—♭VI—♭III—iv—V`**

> The Eagles' progression, Bm F♯ A E G D Em F♯ on the record. Three pairs,
> each rising a fifth, whose first chords step down from the tonic, i-V,
> ♭VII-IV, ♭VI-♭III, then a iv-V cadence back to the top. The major V comes
> from harmonic minor and the major IV from Dorian; the rest is natural
> minor. One of rock's most analysed progressions.

**Latin/Bossa · Samba · `i—V—i—♭VII`**

> Brazilian samba progression. Minor i-V-i establishes home, then the
> subtonic ♭VII, the natural minor's seventh chord, a major triad a whole
> step below the tonic, adds brightness and leads back to i. Choosing the
> subtonic over the leading tone gives the modal, less European sound of
> samba and pagode.

**Folk/Singer-Songwriter · House of the Rising Sun · `i—♭III—IV—♭VI`**

> The Animals' progression: Am C D F, then Am C E. Minor tonic to the
> relative major ♭III lifts immediately, the major IV borrowed from Dorian
> keeps rising, and ♭VI colours the turn before the return. The arpeggiated
> guitar over these changes defined 1960s folk-rock.

**Metal/Rock · Power Cadence · `♭VI—♭VII—i`**

> Ascending approach to the minor tonic through ♭VI and ♭VII, two whole steps
> up to i: F G Am in A minor. Often played as parallel power chords in metal.
> The Aeolian cadence, the minor-key twin of the ♭VI-♭VII-I ending in major.

**Trance/Psytrance/Goa · Harmonic Minor Psy · `i—iv—V—♭VI`**

> Pure harmonic minor: Am Dm E F in A minor. The major V carries the raised
> seventh that gives harmonic minor its augmented-second colour, and the
> deceptive step from V up to ♭VI keeps the loop from resolving. Dramatic,
> Eastern-European character for psytrance leads built on the harmonic minor
> scale.

**Trance/Psytrance/Goa · Dark Psy · `i—♭VI—♭III—♭VII`**

> Dark psytrance progression in natural minor: Am F C G. Rising from ♭VI
> through the relative major ♭III to the subtonic ♭VII builds intensity
> without ever touching a leading tone, so the loop never resolves. Used in
> dark psy and forest trance for an ominous, suspended atmosphere.

**Trance/Psytrance/Goa · Full-On · `i—♭VII—♭VI—♭VII`**

> Full-on psytrance loop in natural minor: Am G F G. The subtonic ♭VII
> oscillates against ♭VI for driving, pendular energy, and the two major
> triads brighten the minor tonic without resolving it. Characteristic of
> full-on psytrance's euphoric sound at 140-148 BPM.

**Trance/Psytrance/Goa · Goa Classic · `i—♭II—♭VII—V`**

> Classic Goa trance mixing modes: Am B♭ G E. The ♭II is Phrygian colour,
> ♭VII is the natural minor's subtonic, and the major V with its raised
> seventh comes from harmonic minor. Three scales in four chords produce the
> exotic, Eastern-leaning sound of the original Goa scene.

**Trance/Psytrance/Goa · Forest Psy · `i—iv—i—♭VII`**

> Organic forest psytrance progression: Am Dm Am G. Simple i-iv establishes
> the minor character, the return to i grounds it, and the subtonic ♭VII adds
> a brighter exit before the loop restarts. Minimal harmonic motion leaves
> room for the organic textures and complex rhythms of forest and minimal
> psy.

**Trance/Psytrance/Goa · Morning Trance · `i—♭III—♭VII—IV`**

> Bright morning psytrance progression in Dorian: Am C G D. The relative
> major ♭III and the subtonic ♭VII lift the minor tonic, and the major IV,
> Dorian's signature chord, lands with sunrise optimism. The same degrees as
> the Dorian vamp of film and game scores, at psytrance tempo.

**Synthwave/Retrowave · Dark Synth · `i—♭VI—♭III—♭VII`**

> Aggressive dark synth progression in natural minor: Am F C G. ♭VI darkens,
> the relative major ♭III lifts, and the subtonic ♭VII powers the return.
> Played with saw-wave stabs and side-chained pads, the most common minor
> loop in synthwave turns menacing rather than nostalgic.

**UK Bass · UK Garage · `i—♭VII—♭VI`**

> Soulful, skippy palette: Am G F. Minor tonic stepping down through the
> subtonic ♭VII to ♭VI, two of the natural minor's three major chords, for
> skippy 2-step grooves.

### 3.4 Lint: check H, template convention

Add to `tools/audit-theory.mjs`, before the per-variant loop:

- For every template, derive tonality as spec 00 §3.2 does (or read
  `template.tonality` once spec 07 lands).
- Tokenise the value on U+2014. Skip tokens containing `/`.
- **H1**: tonality `minor` and a token whose stem is bare `III`, `VI` or
  `VII` (regex `^(III|VI|VII)(?![a-zA-Z°ø♭♯])`) is a finding, unless the
  template object carries `allowRaisedDegrees: ['VII']` (listing the stems)
  together with a comment explaining the musical reason.
- **H2**: a minor-tonality template with at least one `♭`-prefixed token and
  at least one bare `III`/`VI`/`VII` token is a finding, no whitelist. Mixed
  conventions in one minor-key string are always a typo. (As first written the
  rule applied to either tonality; spec 08 narrowed it, see §7.)

Report through the existing `report()` with ids `H1 minor template uses a
raised-degree numeral` and `H2 minor template mixes numeral conventions`. At
baseline these would report 12 and 4; after §3.1 they report 0. The
whitelist mechanism exists for a future template that genuinely wants a
leading-tone major triad; none does today.

### 3.5 Snapshot

Regenerate. The diff must touch exactly the twelve blocks named in §3.1 and
nothing else. Each block's row 1 must read as the right-hand column of §1,
transposed to A (minor tonality renders in A).

## 4. Code changes

| File | Change |
|---|---|
| `modules/musicTheory.js:58-1130` | twelve `value` strings |
| `locales/en.json`, `fr.json`, `es.json`, `de.json`, `pt.json`, `it.json` | twelve re-keyed entries each; `name` and `description` updated |
| `tools/audit-theory.mjs` | check H |
| `docs/catalogue-snapshot.txt` | regenerated |
| `README.md` | nothing; counts unchanged |
| `CHANGELOG.md` | entry: twelve minor-key progressions corrected, naming Hotel California and House of the Rising Sun as examples a reader can verify |

## 5. Acceptance

1. `node tools/audit-theory.mjs`: zero findings, including H1 and H2.
2. Temporarily revert one value (say Samba) and run the audit: H1 reports
   exactly one finding naming that template. Restore.
3. `node tools/check-translations.mjs` passes in all six locales.
4. Snapshot diff: twelve blocks, no others. Row 1 of each matches §1's
   right-hand column in A, with the D3 template reading `Am Dm E F`.
5. Pack rebuilt; re-measure and record the `.progression` count and the
   fused-style count (26 at baseline, `../mpc-export-specification.md`
   §5.2.1).
6. App, manual: key A, Pop/Rock "Hotel California", any variant: pads 1-8
   read Am E G D F C Dm E. Key A, Metal/Rock "Power Cadence": F G Am.
7. The MPC display names of the twelve files change (the numerals are part of
   the name). Note it in the CHANGELOG as a one-time rename.

## 6. Out of scope

- Changing the Finder's convention (spec 12, since dropped).
- Adding palette priorities to the four Trance templates that lack them
  (spec 04 §3.4).
- Any other description's prose. Several other descriptions could be
  sharper; only the twelve above are wrong.

## 7. Implementation notes

Implemented as specified, with the departures and the findings below.

- **One tonality rule.** Check H needs the tonality of a template, which the
  snapshot tool already derived (spec 00 §3.2). The derivation moved to
  `tools/lib/template-tonality.mjs`, which both tools import, so the audit and the
  snapshot cannot disagree about which templates are minor. The snapshot is
  byte-identical across the move.
- **H1 reads the stem, not the regex.** §3.4's pattern
  `^(III|VI|VII)(?![a-zA-Z°ø♭♯])` would let `VIM7`, `VIsus4` or `IIIM7` through,
  because a letter after the stem fails its lookahead. Check H1 takes the leading
  accidentals and the leading run of `[ivIV]` and flags an unaccidented upper-case
  `III`, `VI` or `VII` whatever suffix follows. On the whole catalogue it reports
  exactly what the regex would, at baseline and after. `allowRaisedDegrees` lists
  stems, as specified; no template uses it, and a scratch template carrying
  `['VII']` was seen to silence H1.
- **Spelling.** `en.json` spells "color" 36 times and "colour" never, and "analyzed";
  the descriptions of §3.3 were entered in that spelling.
- **French typography.** `fr.json` puts a plain space before a colon and a semicolon
  (60 colons in the file), so the new French descriptions do the same.
- **Key order.** Each entry is re-keyed where it stood, so the diff of a locale
  file is twelve entries and not a reshuffle. The locale files round-trip
  byte-for-byte through a JSON parser that keeps insertion order, which
  `JSON.parse` in JavaScript does not (it moves integer-like keys such as `"6"`
  to the front).
- **H2 was narrowed to minor tonality** when spec 08 added Film/Cinematic's Major
  Third Mediants, `I—♭VI—I—III`, and Minor Third Mediants, `I—♭III—I—VI`. In a major
  key a bare `III` or `VI` beside a `♭` token is two chromatic mediants read against
  the parallel major, not a typo. The four baseline findings were all minor-key
  templates and the catalogue's H2 count is unchanged by the narrowing.

Disagreements with the English texts of §3.3, left as written because the
decision is the maintainer's, and recorded in the commit message. All three
were right, and were corrected afterwards in §3.3 above and in all six
locales:

1. **Hotel California, "three falling-fifth pairs".** B to F♯, A to E and G to D
   each rise a fifth, equivalently fall a fourth; the pairs are rising-fifth. A
   falling fifth would be B to E.
2. **Hotel California, "everything else is natural minor".** The IV in the
   description's own "♭VII-IV" is E major in B minor, which is Dorian's chord;
   natural minor has a minor iv and a minor v. The House of the Rising Sun text
   attributes its IV to Dorian correctly.
3. **UK Garage, "the natural minor's two major chords".** Natural minor has three
   major triads, ♭III, ♭VI and ♭VII; G and F are two of them.

Measured against the parent commit (`f939906`):

| Quantity | Before | After |
|---|---|---|
| H1 / H2 findings (check run on the unchanged data) | 12 / 4 | 0 / 0 |
| H1 findings with Samba temporarily reverted | | 1, naming it |
| Snapshot blocks changed | | 12, each in place; the block order and the other 195 blocks are untouched |
| Snapshot size | 2 110 lines, 114 079 bytes | 2 110 lines, 114 268 bytes |
| Unique template values / values under more than one genre | 146 / 16 | 141 / 19 |
| `.progression` files in the pack | 838 | 839 |
| MIDI files in the pack | 10 054 | 10 066 |
| Pack files with an unchanged name and new content | | 0 |
| Pack names carrying two styles (`Classic+Jazz`) | 27 | 26 |

The pack changes in exactly the twelve templates: 60 `.progression` files are
renamed (twelve templates times five styles) and 59 names disappear, because
Morning Trance's Classic and Jazz variants were identical on the old chords and
shared one file, `Classic+Jazz`, and now differ. That is the one extra file, and
the one fewer fused name. The 26 of the spec's baseline became 27 with spec 01 and
are 26 again by coincidence of that one template, not because the two counts are
the same set.

Acceptance item 6 was run in headless Chromium against a local server, key A: the
Hotel California variant's pads 1-8 read Am E G D F C Dm E (the first variant
shown, which voices some of them as inversions), Power Cadence's progression pads read
F G Am and Harmonic Minor Psy's Am Dm E F, and the ♭VI pad's tooltip reads
"Borrowed from parallel minor, dramatic predominant, often moves to V" where the
G♭ pad it replaces read "Submediant - relative minor". The script is not
committed.

Still wrong in the same templates and outside this spec: their palettes are not
minor-key aware (Hotel California's palette carries a major VI, G♭ in A, beside
the Am), which is spec 07.
