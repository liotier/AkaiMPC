# Changelog

What changed, and why it's worth updating for.

## 2026-11-15

### Chord Progression Generator

**Twelve minor-key progressions now play what their names promise.** In A
minor, "Hotel California" used to open with A♭ and D♭ major where the Eagles
play G and C, and "House of the Rising Sun" played D♭ and G♭ where the Animals
play C and F. Eleven progressions were written counting the scale's own
degrees, and the generator counts against the parallel major, so a bare VII,
VI or III landed a semitone too high. They are corrected - Hotel California,
Samba, House of the Rising Sun, Power Cadence, Dark Psy, Full-On, Goa Classic,
Forest Psy, Morning Trance, Dark Synth and UK Garage - and their descriptions
rewritten, in all six languages, where they claimed chords "from harmonic
minor" that harmonic minor does not contain. Harmonic Minor Psy was redesigned
rather than corrected: it is now Am Dm E F, which really is all harmonic minor.
A new check in the audit makes the mistake unrepeatable.

One-time rename: the numerals are part of the exported name, so these twelve
progressions' `.progression` and MIDI files change name in the pack and in the
MPC menu. Files you saved under the old names are not touched; export them
again if you want the corrected chords.

**The top row now follows the genre.** Row 4, the "spice" row, used to ignore
what a progression's genre likes and avoids: a folk progression that avoids
dominant sevenths still got a G7, a D7 and a German sixth there, and the seven
Film/Cinematic and four Trance progressions that had no preferences declared got
the same dominant-heavy row as everything else. Row 4 now follows the same
preferred, allowed and avoided choices as the rest of the grid, the eleven
progressions have preferences of their own, and a progression that names a colour
only in its chord list, like Post-Rock Build's stacked fourths, now actually gets
it. Row 4's scoring also stopped calling a vi a dominant and an iii a
subdominant, which had steered it toward the wrong chords. Five progressions that
avoid nearly everything row 4 can offer (Modal Interchange ♭VI—iv—I, Electronic
i—iv—v, Hip-Hop i—♭III—♭VI—♭VII and i—♭VII—iv, Italo-Disco i—iv) still fall back
on chords they avoid; they wait for the minor-key work.

**No more twin pads, and quartal chords called what they are.** A grid could
spend two pads on one chord under two names: a German sixth beside the ♭VI7 it
equals, a tritone substitute beside the ♭II7, I7 beside V7/IV, Csus4 beside
Fsus2. Counted over the whole catalogue, in every key and style, there were 1,265
such pairs; a pad now keeps its place only if it sounds new, and there are none.
The Jazz style also stopped garbling the names of chords it leaves alone: i99,
Isus4sus4, Iadd9add9 and vii°ø7 are i9, Isus4, Iadd9 and viiø7 again. And the
stacked-fourths chords, C F B♭ and C F B♭ E♭, were exported as "Csus4" and
"Csus4(add11)", which name notes the pad does not play; they are now C7sus4(no5)
and Cm7(11) on the pad, in the numeral and in exported files, and a progression
that lists both a suspended and a quartal chord, Harmonic Minor Psy among them,
no longer loses the quartal one. Progressions that contained either chord export
under the new chord names.

**Ten new Film/Cinematic progressions.** The genre grows from seven to seventeen,
with the devices film and game scores lean on: chromatic mediants in pairs
(Major Third Mediants, Minor Third Mediants, Minor Mediants), the Hexatonic Pole,
two Lydian loops (Lydian Vamp, Lydian Float), Dorian Drift, Minor Lift, Wandering
Fifth and Hero Cadence. Each has a palette tuned to it that steers clear of
dominant chords, and descriptions in all six languages.

**The ascending line cliché.** Film/Cinematic gets an eighteenth progression,
Ascending Line Cliché: Em, then the same chord with its fifth climbing by
semitones, E G C and E G C♯, and back. It is the harmonization of the spy-theme
riff, and it needed a chord the generator did not have, the minor chord with a
raised fifth, written m♯5 (Em#5 in exported files). The generator now offers 184
progression palettes.

**Sharp keys are spelled with sharps, and every chord with its own notes.** In A
major the vi chord was printed Gbm where every musician writes F♯m; E major's ii
and vi read Gbm and Dbm, B major's V read Gb, and C♯ minor itself came out as
D♭ minor. Every chord is now named after its scale degree, so a key's chords
carry the key's own sharps or flats: A E F#m D, C#m B A G#. Keys with two names
follow common practice, D♭ major but C♯ minor, A♭ major but G♯ minor, and Scale
Mode spells each scale on its own letters, so C Lydian's raised fourth is F#dim,
not Gbdim. The note names under each pad were spelled as a stack of thirds
whatever the chord: Csus4 read C E♯ G, C6 C E G B𝄫, a quartal chord C E♯ A♯. They
now read C F G, C E G A and C F B♭, Em#5 reads E G B♯ to match its name, and the
staff draws every note on its own line with its own accidental, so a chord that
needs a flat and a sharp, like the Italian sixth A♭ C F♯, shows both. Inverted
chords name their bass the same way. This reaches the pads and the chord names
inside `.progression` files exported from the app in sharp keys; the published
pack, in C, and the MIDI files, which carry no chord names, are unchanged.

**A sixth voicing style: Pedal.** The first chord's bass note is held under every
chord that contains it, so the upper voices move while the bass stays: the heroic
Em, C, A over a held E, or the line cliché's Em, Em#5, Em6 over the same E. A chord
without that note takes its nearest inversion above it, since an MPC pad cannot
sound a note its chord lacks. The whole grid follows, the top row included. Every
progression gets a Pedal card, and the pack grows by one `.progression` file per
progression and one MIDI file per progression and key, 184 and 2,208 files: no
Pedal grid coincides with another style's anywhere in the catalogue. No existing
file changes.

## 2026-09-08

### Chord Progression Generator

**Your exported files finally show up right on the MPC.** Progressions
exported from here used to break Pad Perform's menu - a name like
"Blues - 12 Bar" made the MPC misread where the heading ended and the entry
began, scrambling navigation. Every export now follows a naming scheme
built on what a community member had already worked out by hand-fixing
over 300 files (thank you, Elektrobolt): clean menu headings, clean
submenu entries, every time.

**The whole catalogue, pre-built.** Prefer a file library over generating
on demand? Fair enough - grab the entire catalogue as ready-made files:
every progression this generator can produce, as `.progression` files
(key of C - Pad Perform transposes to any key on import) or as MIDI files
in all twelve keys already. No more clicking through the generator by
hand, hundreds of times.

**Eleven music-theory bugs fixed**, caught by auditing the full generated
catalogue instead of spot-checking it: mislabeled secondary dominants,
wrong intervals on augmented sixth chords, a handful of borrowed and
chromatic chords resolving to the wrong notes. If a progression ever
sounded subtly off, this is likely why.

**Works even where CDNs don't.** The export libraries used to load from a
CDN on first visit; if that connection was blocked - corporate proxy,
ad-blocker, restrictive network - export silently never worked, with
nothing to retry. They now ship with the app, so export works from the
very first load.

### Chord Progression Finder

**Chord names are right again, including inversions.** Drop a
`.progression` file in for analysis, and any chord voiced with something
other than its root in the bass had a good chance of coming back
mislabeled entirely - a first-inversion Cmaj7 read as "Em". Every
inversion of every chord now resolves to its real name.

**Borrowed chords display correctly.** Roman-numeral analysis now cases
and marks borrowed and chromatic chords the same way it already did
diatonic ones, instead of always showing them uppercase regardless of
quality.

**Hardened against malicious files.** A dropped file's progression name
is untrusted the moment it enters the browser; it's now escaped before
display instead of trusted outright.

**Snappier with large collections.** The name filter no longer re-renders
your whole list on every keystroke.
