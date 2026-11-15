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
