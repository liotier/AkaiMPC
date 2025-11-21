# Akai MPC Chord Progression Generator - generates smart .progression files for Pad Perform

Discover my mind-blowing free MIDI chord packs !

Just kidding: MIDI chord packs suck... Let's kill this market on the MPC !

Instead of trawling through thousands of inane progressions, generate musically intelligent custom chord progressions in 4×4 pad layouts for your specific needs, delivered as `.progression` files for Akai MPC Pad Perform.

## Try It Now

**[Access the complete MPC Chord Progression Generator](https://liotier.github.io/AkaiMPC/AkaiMPCChordProgressionGenerator/)**

This is the full product, freely available online. No installation, no sign-up, no limitations. Works directly in your browser and runs completely offline once loaded.

![screenshot](MPC%20Chord%20Progression%20Generator%20-%20Screenshot.png)

## Two Approaches, One Ecosystem

While the [MPC Chord Progression Finder](https://github.com/liotier/AkaiMPC/blob/main/AkaiMPCChordProgressionFinder/README.md) helps you identify and recreate chord progressions from existing music, this Generator takes the opposite approach: **it creates new progressions from scratch based on music theory principles**.

## For Crate Diggers and Beat Makers

### Chord Matcher: Bridge Your Samples to Theory
Found a sample with killer chords but don't know the key? The Chord Matcher lets you:
- Input the chords you've identified from your sample
- Get instant suggestions for compatible keys and modes
- Generate complementary progressions that work with your source material
- Bridge the gap between sample-based and theory-based production

### Two Workflows for Every Creative Process
- **Template Mode** - Choose from 135 progression templates across 15 genres (Pop/Rock, Jazz, Blues, Gospel, Hip-Hop/Trap, Latin, Trance, Jungle/DnB, and more). Generate four voicing variants instantly.
- **Scale Exploration Mode** - Pick from 36 scales/modes and explore all available chords. Perfect for learning exotic scales like Whole Tone, Maqam Hijaz, or Phrygian Dominant.
- Download individual variants or bulk export all four versions at once

## Musical Intelligence Under the Hood

### Four Intelligent Variants, Four Different Vibes

Each generation creates four musically distinct versions of your progression with optimized voice leading:

- **Classic** - Default voice leading optimization for smooth transitions with minimal finger movement.
- **Jazz** - Close voicings for that tight, sophisticated sound. Extended chords (7ths, 9ths) where appropriate.
- **Modal** - Open voicings (drop-2) for a more spacious, airy sound. Perfect for atmospheric pads.
- **Experimental** - Spread voicings for maximum variation. For producers who color outside the lines.

### Chord Palette Approach: Your Musical Color Wheel

Rather than repeating chords sequentially, each progression provides a **palette of 16 unique chords** - like a painter's color palette for harmonic exploration:

- **All 16 pads are unique** - No duplicate chord types, maximizing your harmonic options
- **Harmonic gradient from foundation to spice** - Bottom row (pads 1-4) provides bread-and-butter chords with the tonic anchoring pad 1. Top row (pads 13-16) offers adventurous, colorful extensions for when you want to take risks.
- **Intelligent extensions** - For each chord degree, generates different variations (triads, 7ths, major 7ths, 9ths) plus complementary chords (ii7, vi, ♭VII, ♭VI, ♭III, iv)
- **Your sequence, your choice** - The generator gives you the colors; you paint the progression

## Deep Music Theory, Simple Interface

### Comprehensive Scale Support
36 scales organized into 6 categories - from the familiar to the exotic:
- **Common Western Tonal**: Major, Minor, Dorian, Phrygian, Lydian, Mixolydian, Locrian, Harmonic Minor, Melodic Minor
- **Compact/Popular**: Pentatonic Major/Minor, Blues scale
- **Symmetrical/Jazz**: Whole Tone, Diminished scales, Augmented
- **Arabic Maqamat**: Hijaz, Bayati, Rast, Saba, Kurd
- **Indian Ragas**: Bhairav, Kafi, Yaman, Bhairavi, Todi
- **Exotic**: Double Harmonic, Hungarian Minor, Neapolitan Major/Minor, Enigmatic, Phrygian Dominant, Persian, Hirajoshi, Insen, Kumoi, Egyptian Pentatonic

### Advanced Harmonic Concepts Made Easy
The generator seamlessly incorporates:
- **Borrowed Chords** - Automatic modal interchange (that ♭VII from Mixolydian, iv from minor)
- **Secondary Dominants** - V/V, V/ii, V/vi for that gospel/jazz movement
- **Neapolitan & Augmented Sixths** - Classical drama when you need it
- **Tritone Substitutions** - Jazz reharmonization at the click of a button

### Battle-Tested Progression Templates
135 progressions across 15 genres covering every style:
- **Pop/Rock**: I-V-vi-IV (the "four chord song"), vi-IV-I-V (pop-punk anthem), classic rock patterns
- **Blues/Soul**: 12-bar blues, turnarounds, Dorian vamps, minor blues with substitutions
- **Jazz/Functional**: ii-V-I, Rhythm Changes, Giant Steps cycle, circle progressions
- **Classical/Modal**: Circle of Fifths, Andalusian Cadence, Pachelbel's Canon, Passamezzo patterns
- **Electronic/Modern**: EDM drops, dark house, modal interchange, chromatic mediant
- **R&B/Neo-Soul**: Extended harmony, chromatic soul, emotional ballads
- **Gospel/Worship**: Gospel turnarounds, praise progressions, secondary dominants
- **Hip-Hop/Trap**: Trap minor, dark trap, lofi hip-hop, boom bap, emo rap
- **Latin/Bossa**: Bossa nova, tango, samba, flamenco, bolero
- **Film/Cinematic**: Epic trailer progressions, dark cinematic, heroic themes
- **Folk/Singer-Songwriter**: Folk standards, country, Americana, Irish folk
- **Metal/Rock**: Power metal, doom metal, prog metal, melodic metal
- **Trance/Psytrance/Goa**: Classic Goa, dark psy, uplifting trance, phrygian trance
- **Jungle/Drum'n'Bass**: Dark jungle, liquid DnB, neurofunk, jazzstep
- **Italo-Disco/House, Synthwave/Retrowave, African Dance, Acid/EBM**: Genre-specific progressions for electronic producers

### Dynamic Row 4: Your Secret Weapon
The fourth row isn't just filler—it's dynamically calculated based on sophisticated harmonic analysis:

- **Harmonic Function Analysis** - Identifies what your progression needs: missing tonic resolution? Need more tension? The algorithm knows.
- **Voice Leading Optimization** - Selects chords that create the smoothest transitions with minimal finger movement
- **Context-Aware Suggestions** - Adds borrowed chords, secondary dominants, and modal interchange based on your selected style
- **Genre Intelligence** - Hip-hop? Adds that ♭VII. Jazz? Throws in a ii-V. Neo-soul? Extended harmony all day.

## Production-Ready Features

### MPC Native Integration
- Generates authentic `.progression` files that load directly into:
  - MPC One, MPC Live, MPC X, MPC Key 61
  - MPC Software, MPC Beats
- Proper MIDI mapping with velocity sensitivity preserved
- Chord names follow Akai's exact naming conventions
- Optimized pad layouts for finger drumming

### Real-Time Production Tools
- **WebMIDI Output Support** - Send chords directly to softsynths or hardware via MIDI (Firefox 108+, Chrome, Edge). Auto-detects available devices with graceful fallback to browser beep.
- **Computer Keyboard Control** - Trigger pads 1-16 with keys `cvbn` (pads 1-4), `dfgh` (5-8), `erty` (9-12), `3456` (13-16). Layout mirrors the MPC grid. Works with CAPS LOCK on, compatible with AZERTY/QWERTY keyboards. Automatically targets the progression variant most visible in your viewport.
- **Instant Audio Preview** - Hear any chord with real instrument sounds or browser beep
- **Visual Feedback** - See the notes on a piano roll, understand the intervals
- **Roman Numeral Analysis** - Know the function of every chord in your progression
- **Batch Operations** - Generate and export multiple progressions for your entire project

### Beyond the MPC: Multi-Instrument Visualization
- **Switch between four views** - MPC pads, piano keyboard, guitar fretboard, or staff notation
- **Staff notation with intelligent octave placement** - Treble clef with automatic transposition for optimal readability
- **Sequential playback in staff view** - Notes play as eighth notes at 90 BPM for melodic exploration
- **Print chord diagrams** - Generate progressions, switch to any view, and print
- **Jam with friends** - Hand out printed chord sheets for your custom progressions
- **Left-handed guitar support** - Mirror fretboard diagrams for left-handed players

### Zero Friction Workflow
- **No Installation** - Works in any modern browser
- **No Server Dependency** - Runs completely offline after first load
- **Mobile Ready** - Use on your phone or tablet right next to your MPC
- **Privacy First** - All processing happens in your browser, nothing leaves your device

## Quick Start Guide

1. **Choose Your Workflow**
   - **Template Mode** - Select a key and browse 135 progression templates organized by genre. Generate 4 voicing variants instantly.
   - **Scale Exploration Mode** - Select a key + mode/scale to see all available chords from that scale. Perfect for learning exotic scales.

2. **Export to MPC**
   - Download individual progressions or all variants as a ZIP
   - Drop the `.progression` files into your MPC
   - Select a progression in the Pad Perform page
   - Start making beats !

## Perfect Companion to the MPC Chord Progression Finder

**Use the Generator when:** Starting fresh, exploring new harmonic territories, or building around an existing sound  
**Use the [Finder](https://github.com/liotier/AkaiMPC/tree/main/AkaiMPCChordProgressionFinder) when:** Picking progressions from your library

Together, they provide the complete harmonic toolkit for modern MPC-based Pad Perform .progression management.

## Under the Hood

- Pure HTML5/CSS3/JavaScript ES6 modules - no frameworks, no bloat
- WebMIDI API (via webmidi.js) for cross-browser MIDI output support
- Web Audio API for low-latency chord playback fallback
- Voice leading optimization with greedy algorithm for smooth transitions
- Custom harmonic analysis engine with parallel major Roman numeral analysis
- Responsive CSS Grid that mirrors the MPC's 4×4 pad layout
- SVG-based staff notation rendering with intelligent octave transposition
- Viewport-aware keyboard event handling for seamless multi-progression browsing
- JSZip for seamless multi-file exports

## Contributing

Contributions are welcome! Feel free to:
- Report bugs or suggest features via GitHub Issues
- Submit pull requests with improvements
- Share your `.progression` files for testing

Note about repository layout
---------------------------------
This project was originally distributed as a single self-contained HTML file for maximum deployment simplicity. It has since been split into modular ES6 files for better maintainability:

- `index.html` (was AkaiMPCChordProgressionGenerator.html) — the entry HTML
- `styles.css` — extracted stylesheet
- `app.js` — main application logic
- `modules/musicTheory.js` — core music theory engine
- `modules/guitarChords.js` — guitar chord library
- `modules/storage.js` — localStorage and URL handling
- `modules/rendering.js` — SVG generation for keyboard, guitar, and staff notation diagrams

Deployment remains the same: host these files on any static file host (GitHub Pages, Netlify, etc.). Modular structure improves readability, caching, and makes incremental development and testing easier.

## 📝 License

This project is open source and available under the Unlicense.

## 🙏 Acknowledgments

- Built for the Akai MPC community
- Shout out to the amazing folks at [MPC Forums](https://www.mpc-forums.com/) - where the real MPC magic happens !

## Credits & Links

**Created by Jean-Marc Liotier**
**Sister project: [MPC Chord Progression Finder](https://liotier.github.io/AkaiMPC/AkaiMPCChordProgressionFinder/)**
**GitHub: [Source Code](https://github.com/liotier/AkaiMPC/tree/main/AkaiMPCChordProgressionGenerator)**
