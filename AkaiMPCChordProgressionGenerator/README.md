# Chord Progression Generator - piano, guitar tabs, Akai MPC

**Create musically intelligent chord progressions and view them as piano keyboard, guitar tabs, or staff notation.**

Instead of trawling through chord books or generic MIDI packs, generate custom progressions tailored to your needs. Print chord sheets to jam with your band, export MIDI files for your DAW, or export `.progression` files for Akai MPC Pad Perform.

## Try It Now

**[Access the Chord Progression Generator](https://liotier.github.io/AkaiMPC/AkaiMPCChordProgressionGenerator/)**

Free, browser-based tool. No installation, no sign-up, no limitations. Works completely offline once loaded. Available in **6 languages**: English, Français, Español, Deutsch, Português, Italiano.

![screenshot](MPC%20Chord%20Progression%20Generator%20-%20Screenshot.png)

## For Musicians, Producers & Jammers

### Five Views, One Progression
**Switch between instrument views instantly:**
- **Piano keyboard** - Visualize progressions for keys/synths, see intervals clearly
- **Guitar fretboard** - Get chord diagrams with left-handed support
- **Staff notation** - Classical view with intelligent octave placement
- **MPC pads** - 4×4 grid layout optimized for finger drumming
- **MIDI export** - Download Standard MIDI Files (.mid) for any DAW

### Print and Jam
Generate a progression, switch to piano or guitar view, and **print chord sheets** for your band. Everyone gets on the same page - literally. Perfect for:
- **Worship teams** coordinating progressions across keyboards, guitar, and bass
- **Singer-songwriters** sharing charts with backing musicians
- **Music teachers** creating lesson materials
- **Jam sessions** - pick a progression, print charts, start playing

### Export to Your Workflow
- **DAW Producers**: Export Standard MIDI Files (.mid) ready to drop into any DAW—progression chords followed by palette chords for exploration
- **MPC Users**: Download `.progression` files for Pad Perform (MPC One, Live, X, Key 61, Software, Beats)
- **MIDI Hardware**: Send chords directly via WebMIDI to synths or drum machines
- **Live Performance**: Use keyboard shortcuts to audition chords while programming

## Two Approaches, One Ecosystem

While the [MPC Chord Progression Finder](https://github.com/liotier/AkaiMPC/blob/main/AkaiMPCChordProgressionFinder/README.md) helps you identify and recreate chord progressions from existing music, this Generator takes the opposite approach: **it creates new progressions from scratch based on music theory principles**.

## Prefer a Pre-Built Library?

Generating on demand is the point of this tool, but not everyone wants to click through it hundreds of times to build a collection. The entire catalogue - every progression this generator can produce, across every genre, scale, and voicing variant - is built by CI and sitting there as a straight download, no interaction required:

- **`.progression` pack** - every progression, every style variant, as ready-to-load MPC files (key of C - Pad Perform transposes to any key on import)
- **MIDI pack** - the same catalogue as Standard MIDI Files, already rendered in all twelve keys

Grab either from the download links under the generator.

## For Crate Diggers and Beat Makers

### Chord Matcher: Bridge Your Samples to Theory
Found a sample with killer chords but don't know the key? The Chord Matcher lets you:
- Input the chords you've identified from your sample - 14 qualities including half-diminished (m7♭5), diminished 7th, minor-major 7th, 6th and minor 6th
- Get instant suggestions for compatible keys and modes for **both** Progression Palette and Scale modes
- Generate complementary progressions that work with your source material
- Bridge the gap between sample-based and theory-based production

### Two Workflows for Every Creative Process
- **Progression Palette Mode** - Choose from 173 progression palettes across 22 genres (Pop/Rock, Jazz, Blues, Gospel, Hip-Hop/Trap, Latin, Trance, Jungle/DnB, and more). 100+ progressions feature **genre-specific palette intelligence** that prioritizes authentic chord voicings for each style. Generate up to five voicing variants instantly.
- **Scale Mode** - Pick from 34 scales/modes and explore all available chords: the triad on each degree in the first two rows, the seventh chord on each degree in the last two. Every chord is derived from the scale itself, so half-diminished (m7♭5), diminished 7th, minor-major 7th, augmented major 7th and 6th chords appear wherever the scale actually calls for them - and nothing on the grid uses a note the scale does not contain. Perfect for learning exotic scales like Whole Tone, Phrygian Dominant, or Hungarian Minor.
- Download individual variants or bulk export every version at once

## Musical Intelligence Under the Hood

### Five Intelligent Variants, Five Different Vibes

Each generation creates up to five musically distinct versions of your progression with optimized voice leading (variants that come out identical are dropped, so you only ever see genuinely different options):

- **Smooth** - Comprehensive voice-leading search maximising common tones, step-wise motion and contrary motion.
- **Classic** - Default voice leading optimization for smooth transitions with minimal finger movement.
- **Jazz** - Close voicings for that tight, sophisticated sound. Extended chords (7ths, 9ths) where appropriate.
- **Modal** - Open voicings (drop-2) for a more spacious, airy sound. Perfect for atmospheric pads.
- **Experimental** - Spread voicings for maximum variation. For producers who color outside the lines.

### Chord Palette Approach: Your Musical Color Wheel

Rather than repeating chords sequentially, each progression provides a **palette of 16 unique chords** - like a painter's color palette for harmonic exploration:

- **All 16 pads are unique** - No duplicate chord types, maximizing your harmonic options
- **Genre-specific palette intelligence** - 100+ progressions carry priority weighting, and the palette actually builds the chord types they ask for: preferred voicings appear first and in the right colours (Blues loves dom7 and dom9, Folk prefers simple triads and sus chords, Gospel embraces major7). Chords are sorted by musical authenticity for each style.
- **Harmonic gradient from foundation to spice** - Bottom row (pads 1-4) provides bread-and-butter chords with the tonic anchoring pad 1. Top row (pads 13-16) offers adventurous, colorful extensions for when you want to take risks.
- **Intelligent extensions** - For each chord degree, generates different variations (triads, 7ths, major 7ths, 9ths, 6ths, sus and quartal voicings, half-diminished) plus complementary chords (ii7, vi, ♭VII, ♭VI, ♭III, iv)
- **Your sequence, your choice** - The generator gives you the colors; you paint the progression

## Deep Music Theory, Simple Interface

### Comprehensive Scale Support
34 scales organized into 5 categories - from the familiar to the exotic:
- **Common Western Tonal**: Major, Minor, Dorian, Phrygian, Lydian, Mixolydian, Locrian, Harmonic Minor, Melodic Minor
- **Compact/Popular**: Pentatonic Major/Minor, Blues scale
- **Symmetrical/Jazz**: Whole Tone, Diminished scales, Augmented, Altered, Lydian Dominant, Locrian #2
- **Indian Ragas**: Bhairav, Kafi, Yaman, Bhairavi, Todi
- **Exotic**: Double Harmonic, Hungarian Minor, Neapolitan Major/Minor, Phrygian Dominant, Persian, Hirajoshi, Insen, Kumoi, Egyptian Pentatonic

The ragas and the exotic scales are 12-tone-equal-temperament approximations,
offered as colour for Western production rather than as faithful renderings of
the traditions they borrow their names from - those rely on tunings, ornaments
and melodic rules a 4x4 pad grid cannot express. Treat them as flavour, not as
authority. Scales whose quarter tones could not be approximated honestly
(the Arabic maqamat) were removed rather than misrepresented.

### Advanced Harmonic Concepts Made Easy
The generator seamlessly incorporates:
- **Borrowed Chords** - Automatic modal interchange (that ♭VII from Mixolydian, iv from minor)
- **Secondary Dominants** - V/V, V/ii, V/vi for that gospel/jazz movement
- **Neapolitan & Augmented Sixths** - Classical drama when you need it
- **Tritone Substitutions** - Jazz reharmonization at the click of a button

Every one of these is checked against the full generated catalogue, not just spot-checked: secondary-dominant numerals, augmented-sixth spellings, and borrowed-chord roots are audited in CI so a plausible-looking chord that resolves to the wrong notes gets caught before it ships.

### Battle-Tested Progression Palettes
173 progression palettes across 22 genres covering every style. **100+ progressions feature genre-specific palette intelligence** that prioritizes musically authentic chord voicings:
- **Pop/Rock**: I-V-vi-IV (the "four chord song"), vi-IV-I-V (pop-punk anthem), classic rock patterns
- **Blues/Soul**: 12-bar blues, turnarounds, Dorian vamps, minor blues (smart palettes prefer dom7, major; avoid experimental voicings)
- **Jazz/Functional**: ii-V-I, Rhythm Changes, Giant Steps cycle, circle progressions
- **Classical/Modal**: Circle of Fifths, Andalusian Cadence, Pachelbel's Canon, Passamezzo patterns
- **Electronic/Modern**: EDM drops, dark house, modal interchange, chromatic mediant (Techno prefers minimal harmony)
- **R&B/Neo-Soul**: Extended harmony, chromatic soul, emotional ballads (smart palettes embrace major7, minor7, dom7)
- **Gospel/Worship**: Gospel turnarounds, praise progressions, secondary dominants (loves major7, dom7)
- **Hip-Hop/Trap**: Trap minor, dark trap, lofi hip-hop, boom bap, emo rap (prefers simple minor/major, minimal complexity)
- **Latin/Bossa**: Bossa nova, tango, samba, flamenco, bolero (embraces minor7, major7, dom7)
- **Film/Cinematic**: Epic trailer progressions, dark cinematic, heroic themes
- **Folk/Singer-Songwriter**: Folk standards, country, Americana, Irish folk (simple triads preferred; avoids jazz complexity)
- **Metal/Rock**: Power metal, doom metal, prog metal, melodic metal (power chords preferred; avoids jazz extensions)
- **Trance/Psytrance/Goa**: Classic Goa, dark psy, uplifting trance, phrygian trance (modal simplicity with hypnotic character)
- **Jungle/Drum'n'Bass**: Dark jungle, liquid DnB, neurofunk, jazzstep
- **Synthwave/Retrowave**: Outrun, darkwave, cyberpunk (80s-style major/minor with selective 7th usage)
- **Reggae/Dub, UK Bass, Italo-Disco/House, African Dance, Acid/EBM**: Genre-specific progressions with smart palette priorities

### Dynamic Row 4: Your Secret Weapon
The fourth row isn't just filler—it's dynamically calculated based on sophisticated harmonic analysis:

- **Harmonic Function Analysis** - Identifies what your progression needs: missing tonic resolution? Need more tension? The algorithm knows.
- **Voice Leading Optimization** - Selects chords that create the smoothest transitions with minimal finger movement
- **Context-Aware Suggestions** - Adds borrowed chords, secondary dominants, and modal interchange based on your selected style
- **Genre Intelligence with Palette Priorities** - 100+ progressions use a sophisticated 3-tier weighting system (preferred, allowed, avoided) to prioritize genre-authentic chord voicings. Blues gets dom7, Folk gets simple triads, Gospel gets extended harmony—automatically.

## Production-Ready Features

### MPC Native Integration
- Generates authentic `.progression` files that load directly into:
  - MPC One, MPC Live, MPC X, MPC Key 61
  - MPC Software, MPC Beats
- Proper MIDI mapping with velocity sensitivity preserved
- Names built specifically for Pad Perform's menu system - a clean category heading and a clean entry every time, regardless of how exotic the progression or scale name gets
- Optimized pad layouts for finger drumming

### Multi-Instrument Visualization & Export
- **Switch between five views** - Piano keyboard, guitar fretboard, staff notation, MPC pads, or MIDI export
- **Print chord sheets for jamming** - Generate progressions, switch to any view, and print. Get your whole band on the same page.
- **MIDI export** - Download Standard MIDI Files (.mid) with progression + palette hybrid format (core progression chords first, then palette chords)
- **Staff notation with intelligent octave placement** - Treble clef with automatic transposition for optimal readability
- **Sequential playback in staff view** - Notes play as eighth notes at 90 BPM for melodic exploration
- **Guitar fretboard diagrams** - With left-handed support (mirror option)
- **Piano keyboard view** - See intervals clearly, understand voicings visually
- **Roman Numeral Analysis** - Know the function of every chord in your progression

### Real-Time Production Tools
- **WebMIDI Output Support** - Send chords directly to softsynths or hardware via MIDI (Firefox 108+, Chrome, Edge). Auto-detects available devices with graceful fallback to browser beep.
- **Computer Keyboard Control** - Trigger pads 1-16 with keys `cvbn` (pads 1-4), `dfgh` (5-8), `erty` (9-12), `3456` (13-16). Compatible with AZERTY/QWERTY keyboards. Automatically targets the progression variant most visible in your viewport.
- **Instant Audio Preview** - Hear any chord with real instrument sounds or browser beep
- **Batch Operations** - Generate and export multiple progressions for your entire project

### Zero Friction Workflow
- **No Installation** - Works in any modern browser
- **No Server Dependency** - Runs completely offline after first load
- **Reliable Exports** - JSZip and WebMIDI are bundled with the app rather than loaded from a CDN, so exporting works from your very first visit even behind a restrictive network
- **Mobile Ready** - Use on your phone or tablet at rehearsal, on stage, or in the studio
- **Privacy First** - All processing happens in your browser, nothing leaves your device

## Quick Start Guide

1. **Choose Your Workflow**
   - **Progression Palette Mode** - Select a key and browse 173 progression palettes organized by genre. 100+ progressions feature smart palette priorities for genre-authentic voicings. Generates up to five voicing variants instantly.
   - **Scale Mode** - Select a key + mode/scale to explore all available chords from that scale. Perfect for learning exotic scales and modal exploration.
   - **Chord Matcher** (optional) - Input chords from your sample to filter compatible keys and modes for both workflows.

2. **View & Export**
   - **Switch views** - Toggle between piano, guitar, staff notation, MPC pads, or MIDI export
   - **Print for jamming** - Print chord sheets to share with your band or students
   - **Export MIDI** - Download Standard MIDI Files (.mid) for any DAW—progression chords first, then palette chords
   - **Export to MPC** - Download `.progression` files for Akai MPC Pad Perform
   - **Play via MIDI** - Send chords to hardware synths or use keyboard shortcuts for auditioning

## Sister Tool: MPC Chord Progression Finder

**Use the Generator when:** Creating new progressions from scratch, learning music theory, or jamming with chord sheets
**Use the [Finder](https://github.com/liotier/AkaiMPC/tree/main/AkaiMPCChordProgressionFinder) when:** Identifying progressions from existing songs in your library

Together, they provide a complete harmonic toolkit for musicians and producers.

## Under the Hood

- Pure HTML5/CSS3/JavaScript ES6 modules - no framework
- WebMIDI API (via vendored webmidi.js) for cross-browser MIDI output support
- Web Audio API for low-latency chord playback fallback
- Voice leading optimization using Hungarian algorithm for optimal note assignment
- Custom harmonic analysis engine with parallel major Roman numeral analysis
- Responsive CSS Grid that mirrors the MPC's 4×4 pad layout
- SVG-based staff notation rendering with intelligent octave transposition
- Viewport-aware keyboard event handling for seamless multi-progression browsing
- JSZip (vendored) for seamless multi-file exports, both libraries bundled with the app rather than loaded from a CDN
- The full `.progression` and MIDI packs are generated by CI (`tools/build-pack.mjs`), not committed to the repo or built in the browser - the download links just point at the static output

## Contributing

Contributions are welcome! Feel free to:
- Report bugs or suggest features via GitHub Issues
- Submit pull requests with improvements
- Share your `.progression` files for testing

Note about repository layout
---------------------------------
This project was originally distributed as a single self-contained HTML file for maximum deployment simplicity. It has since been split into modular ES6 files for better maintainability:

- `index.html` — the entry HTML
- `styles.css` — extracted stylesheet
- `app.js` — main application orchestration
- `modules/musicTheory.js` — core music theory engine (scales, chords, voice leading)
- `modules/generation.js` — variant generation, shared by the app and `tools/build-pack.mjs` so both produce identical output
- `modules/mpcNaming.js` — the naming scheme that keeps Pad Perform's menu display correct
- `modules/audio.js` — Web Audio synthesis and WebMIDI output
- `modules/constants.js` — tuning, timing, layout and validation constants
- `modules/guitarChords.js` — guitar chord library
- `modules/midiExport.js` — Standard MIDI File generation
- `modules/storage.js` — localStorage and URL handling (with input validation)
- `modules/rendering.js` — SVG generation for keyboard, guitar, and staff notation
- `modules/i18n.js` — internationalization system
- `locales/*.json` — translation files (en, fr, es, de, pt, it)
- `service-worker.js` — offline caching
- `vendor/` — JSZip and WebMidi.js, vendored rather than CDN-loaded (see `vendor/NOTICE.md`)
- `tools/build-pack.mjs` — builds the bulk-download `.progression`/MIDI packs; runs in CI on every deploy, not committed to the repo
- `tools/audit-theory.mjs` — the CI theory audit described above

Deployment remains the same: host these files on any static file host (GitHub Pages, Netlify, etc.). Modular structure improves readability, caching, and makes incremental development and testing easier.

## 📝 License

This project is open source and available under the Unlicense.

## 🙏 Acknowledgments

- Built for musicians, producers, and music educators
- Special thanks to the Akai MPC community and [MPC Forums](https://www.mpc-forums.com/)

## Credits & Links

**Created by Jean-Marc Liotier**
**Sister project: [Chord Progression Finder](https://liotier.github.io/AkaiMPC/AkaiMPCChordProgressionFinder/)**
**GitHub: [Source Code](https://github.com/liotier/AkaiMPC/tree/main/AkaiMPCChordProgressionGenerator)**
