# Changelog

What changed, and why it's worth updating for.

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
