# Changelog

What changed, and why it's worth updating for.

## 2026-11-18

### Chord Progression Generator

In short: 184 progressions instead of 173, eleven of them new film-score
devices; a sixth voicing style, Pedal; minor keys treated as minor keys; every
chord spelled in its key and described truthfully, with a plain-language phrase
on every pad; and a Scale Mode whose sixteen pads are sixteen different chords,
numbered like the palettes. The `.progression` pack grows from 839 to 1 094
files and the MIDI pack from 10 065 to 13 135. Some exported files change name:
the twelve corrected minor-key progressions, those holding stacked-fourths
chords, and a few minor-key variants; the entries below say why. A forum-ready
announcement of this release is in
[`AkaiMPCChordProgressionGenerator/docs/announcements/2026-11-18.md`](AkaiMPCChordProgressionGenerator/docs/announcements/2026-11-18.md).

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

**Progressions listed under several genres now keep their genre.** Sixteen
progressions appear under more than one genre, each with a palette tuned to it:
the four chords of Axis of Awesome are also Folk's Post-Rock Build, Synthwave's
Synthpop and Reggae's Reggae Axis. The generator only ever used the first genre's
entry, so picking Synthpop built Pop/Rock's palette, exported the file as
"Pop/Rock-Axis of Awesome", and a reload put the Pop/Rock entry back in the menu.
Each entry now builds its own palette, exports under its own genre, and stays
selected after a reload and in a shared link. Links saved earlier still open, on
the first genre as before. The pack's files for those entries change content.

**The top row now follows the genre.** Row 4, the "spice" row, used to ignore
what a progression's genre likes and avoids: a folk progression that avoids
dominant sevenths still got a G7, a D7 and a German sixth there, and the seven
Film/Cinematic and four Trance progressions that had no preferences declared got
the same dominant-heavy row as everything else. Row 4 now follows the same
preferred, allowed and avoided choices as the rest of the grid, the eleven
progressions have preferences of their own, and a progression that names a colour
only in its chord list, like Post-Rock Build's stacked fourths, now actually gets
it. Row 4's scoring also stopped calling a vi a dominant and an iii a
subdominant, which had steered it toward the wrong chords. A few progressions
whose own preferences leave row 4 almost nothing to offer fell back on chords
they avoid. The minor-key palettes and the film-score moves below fixed all but
two, Lofi Jazz and Vaporwave Dream, which accept only seventh chords and keep one
major triad in their top row.

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
semitones, E G B♯, then Em6, E G B C♯, and back. It is the harmonization of the
spy-theme riff, and it needed a chord the generator did not have, the minor chord
with a raised fifth, written m♯5 (Em#5 in exported files). The generator now
offers 184 progression palettes.

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

**Minor-key progressions get minor-key palettes.** The generator treated every
progression as if it were in a major key, so all 74 minor progressions were
offered the major key's chords around them: in A minor, B minor and F♯ minor,
labelled ii and vi as though they belonged, though F♯ minor belongs to no form of
A minor, and a top row of applied dominants aimed at those same foreign chords.
A minor progression now gets its own key's supertonic and dominant (Bm7b5, Bdim,
Em, Em7 in A minor), its ♭III, ♭VI, ♭VII and iv as plain diatonic chords rather
than "borrowed", and a top row of the devices minor keys use: the Dorian IV, the
Picardy major I, the leading-tone diminished seventh, and the applied dominants of
the key's own chords. Tooltips explain chords as the minor key hears them, where ♭VI
is the submediant rather than a borrowing, and the analysis line stops calling
nearly every minor progression "Modal Interchange" (63 of 74 before, 14 now).
Major progressions are unchanged. "Plagal Cascade", which has no tonic chord, is
now read as the minor progression it is. The pack's files for minor progressions
change content, and a few change name where two styles now coincide or no longer
do.

**Film/Cinematic gets the film-score moves in its top row.** The eighteen
Film/Cinematic progressions now fill row 4 with chromatic mediants, the chord a
third away that shares one note with the tonic (E, A or A♭ major around C), the
hexatonic pole that shares none (A♭ minor around C), and mode flips, a progression
chord with its third turned over (C minor for C major, A major for A minor),
instead of the secondary dominants and augmented sixths of classical harmony. Four
more progressions, whose own preferences had left their top row short of chords,
take the same moves: Borrowed Cadence, Techno Minimal, Footwork Juke and Minimal
House. Their top rows had offered chords they avoid, all four pads in Minimal
House's case. Every other progression is unchanged. Tooltips no longer
confuse a major VI or III with the relative minor vi or the mediant iii, and
describe the new chords.

**Chord descriptions and the progression summary say what the chords are.**
The summary under each variant called "I-iv-I-V", a Modal Interchange
progression, "Diatonic progression", because its borrowed iv carries no flat.
It called passing diminished chords and the tritone substitute "Modal
Interchange", and the diatonic circle of fifths "Chromatic" for its vii°. It
labelled the ascending line cliché diatonic although its B♯ is a raised fifth.
One rule now sorts every progression chord into diatonic, borrowed, applied
or chromatic, and 28 summaries change. Hovering a pad also tells more of the
truth: the minor iv in a major key is described as borrowed from the parallel
minor, not as the major subdominant. ♭II7 is the tritone substitute, not the
Neapolitan. The line cliché's raised-fifth chord, the leading-tone chord of
V and the 7♭5 chords no longer fall back to "Borrowed chord". These texts
are in all six languages.

**Scale Mode stops repeating itself.** A Scale Mode grid could hold one chord
twice under two names: the Major scale's last pad was C6, which sounds exactly
like the Am7 two pads before it, and Whole Tone offered eight different chords
on its sixteen pads. Every grid, in every key, now holds sixteen different
chords. Spare pads take the next colour that sounds new, on another degree when
the tonic has none left, and a degree chord that would repeat one already on
the grid gives way to another chord the scale supports. Whole Tone gains 7♭5
chords and a new chord type, the dominant ninth with a raised fifth (C E G♯ B♭
D, shown as Caug9); the Augmented scale now shows its own major and minor triads on C, E and G♯. Three
scales, Bhairav, Double Harmonic and Hungarian Minor, also lose a diminished
chord that held a note they do not have.

**Scale Mode speaks the same language as the palettes, and every chord says
what it is.** Scale Mode numbered chords by their position in the scale, so
Pentatonic Major's G was IV, two different chords of a diminished scale were
both I, and natural minor's E♭ was III where the palettes write ♭III. It now
uses the palettes' convention in every scale. Scale Mode's chord descriptions
were also borrowed from the palettes, and a third of them described another
chord: natural minor's E♭ was "a major chord a major third above the tonic".
Major and Minor keep the palettes' descriptions, which are true there; every
other scale describes each chord by what it is. Hovering any pad, in either
mode, now also spells the chord out first - "Major triad on the flattened
seventh degree" - in all six languages. And the half-whole diminished scale
shows the chords it is used for: four dominant sevenths a minor third apart,
C7, D♯7, F♯7 and A7 in C, where it showed only minor and diminished chords.

**Behind the scenes.** Every change to the catalogue now ships with a readable
record of every progression's and every scale's chords, checked on each commit
beside a much stricter theory audit. The audit plays all 184 progressions in
every key and style and all 34 scales in every key, 218 496 pads in all, and
checks that each chord holds the notes its name says, is spelled in its key,
sounds unlike every other pad on its grid, and carries a true numeral and a
true description. A typo in a progression's definition stops the build instead
of quietly playing the tonic. The specifications behind every change, with
their decisions and measurements, are in
`AkaiMPCChordProgressionGenerator/docs/improvements/`.

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
