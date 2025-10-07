# Akai MPC Chord Progression Generator - generates smart .progression files for Pad Perform

Discover my mind-blowing free MIDI chord packs !

Just kidding: MIDI chord packs suck... Let's kill this market on the MPC !

Instead of trawling through thousands of inane progressions, generate musically intelligent custom chord progressions in 4×4 pad layouts for your specific needs, delivered as `.progression` files for Akai MPC Pad Perform.

## Try It Now

**[Access the complete MPC Chord Progression Generator](https://liotier.github.io/AkaiMPC/AkaiMPCChordProgressionGenerator/AkaiMPCChordProgressionGenerator.html)**

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

### Instant Inspiration
- **"I'm clueless but reasonable"** - Generates safe, proven progressions in common keys (think Billboard Top 100 ready)
- **"I'm feeling lucky"** - Explores exotic scales and advanced harmony (for when you want to sound like nobody else)
- Download individual variants or bulk export all four versions at once

## Musical Intelligence Under the Hood

### Dynamic Row 4: Your Secret Weapon
The fourth row isn't just filler—it's dynamically calculated based on sophisticated harmonic analysis:

- **Harmonic Function Analysis** - Identifies what your progression needs: missing tonic resolution? Need more tension? The algorithm knows.
- **Voice Leading Optimization** - Selects chords that create the smoothest transitions with minimal finger movement
- **Context-Aware Suggestions** - Adds borrowed chords, secondary dominants, and modal interchange based on your selected style
- **Genre Intelligence** - Hip-hop? Adds that ♭VII. Jazz? Throws in a ii-V. Neo-soul? Extended harmony all day.

### Four Intelligent Variants, Four Different Vibes

Each generation creates four musically distinct versions of your progression:

- **Classic** - Radio-ready progressions with just enough spice. Perfect for pop, rock, and R&B.
- **Jazz** - Extended chords (9ths, 11ths, 13ths), altered dominants, and smooth voice leading. Think Robert Glasper meets your MPC.
- **Modal** - Explores the unique colors of each mode. Dorian ♮6, Lydian #4, Mixolydian ♭7—all the flavors.
- **Experimental** - Unconventional voicings, quartal harmony, and unexpected substitutions. For producers who color outside the lines.

## Deep Music Theory, Simple Interface

### Comprehensive Scale Support
From the familiar to the exotic, we've got you covered:
- **Foundation**: Major, Natural/Harmonic/Melodic Minor, all seven Church Modes
- **Blues & Soul**: Pentatonic scales, Blues scale with proper ♭5
- **World Music**: Persian, Japanese, Hungarian Minor, Double Harmonic, and more
- **Jazz Extensions**: Bebop scales, Altered scale, Whole Tone

### Advanced Harmonic Concepts Made Easy
The generator seamlessly incorporates:
- **Borrowed Chords** - Automatic modal interchange (that ♭VII from Mixolydian, iv from minor)
- **Secondary Dominants** - V/V, V/ii, V/vi for that gospel/jazz movement
- **Neapolitan & Augmented Sixths** - Classical drama when you need it
- **Tritone Substitutions** - Jazz reharmonization at the click of a button

### Battle-Tested Progression Templates
Covering every genre and era:
- **Modern Pop**: I-V-vi-IV (the "four chord song"), vi-IV-I-V (pop-punk anthem)
- **Jazz Standards**: ii-V-I in all keys, Rhythm Changes, Giant Steps cycle
- **Blues Forms**: 12-bar blues, 8-bar blues, minor blues with proper substitutions
- **Classical**: Circle of Fifths, Andalusian Cadence, Pachelbel's Canon sequence
- **Electronic**: EDM build progressions, Future Bass sequences, Lo-fi hip-hop loops

## Production-Ready Features

### MPC Native Integration
- Generates authentic `.progression` files that load directly into:
  - MPC One, MPC Live, MPC X, MPC Key 61
  - MPC Software, MPC Beats
- Proper MIDI mapping with velocity sensitivity preserved
- Chord names follow Akai's exact naming conventions
- Optimized pad layouts for finger drumming

### Real-Time Production Tools
- **Instant Audio Preview** - Hear any chord instantly with a single click
- **Visual Feedback** - See the notes on a piano roll, understand the intervals
- **Roman Numeral Analysis** - Know the function of every chord in your progression
- **Batch Operations** - Generate and export multiple progressions for your entire project

### Zero Friction Workflow
- **No Installation** - Works in any modern browser
- **No Server Dependency** - Runs completely offline after first load
- **Mobile Ready** - Use on your phone or tablet right next to your MPC
- **Privacy First** - All processing happens in your browser, nothing leaves your device

## Quick Start Guide

1. **Choose Your Vibe**
   - Select a key that matches your sample or vocal range
   - Pick a mode for the mood (Major = happy, Minor = sad, Dorian = jazzy, etc.)
   - Choose a progression template or roll the dice

2. **Generate & Explore**
   - Hit generate to create four intelligent variants instantly
   - Click pads to preview how they sound
   - Check the Roman numerals to understand the harmonic movement

3. **Export to MPC**
   - Download individual progressions or all four as a ZIP
   - Drop the `.progression` files into your MPC
   - Select a progression in the Pad Perform page
   - Start making beats !

## Perfect Companion to the MPC Chord Progression Finder

**Use the Generator when:** Starting fresh, exploring new harmonic territories, or building around an existing sound  
**Use the [Finder](https://github.com/liotier/AkaiMPC/tree/main/AkaiMPCChordProgressionFinder) when:** Picking progressions from your library

Together, they provide the complete harmonic toolkit for modern MPC-based Pad Perform .progression management.

## Under the Hood

- Pure HTML5/CSS3/JavaScript - no frameworks, no bloat
- Web Audio API for low-latency chord playback
- Custom harmonic analysis engine with weighted scoring algorithms
- Responsive CSS Grid that mirrors the MPC's 4×4 pad layout
- JSZip for seamless multi-file exports

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs or suggest features via GitHub Issues
- Submit pull requests with improvements
- Share your `.progression` files for testing

Note about repository layout
---------------------------------
This project was originally distributed as a single self-contained HTML file for maximum deployment simplicity. It has since been split into three static files for better maintainability:

- `AkaiMPCChordProgressionGenerator.html` — the entry HTML (loads the CSS and JS)
- `styles.css` — extracted stylesheet
- `app.js` — main JavaScript logic

Deployment remains the same: host these files on any static file host (GitHub Pages, Netlify, etc.). Keeping them separate improves readability, caching, and makes incremental development and testing easier.

## 📝 License

This project is open source and available under the Unlicense.

## 🙏 Acknowledgments

- Built for the Akai MPC community
- Shout out to the amazing folks at [MPC Forums](https://www.mpc-forums.com/) - where the real MPC magic happens !

## Credits & Links

**Created by Jean-Marc Liotier**  
**Sister project: [MPC Chord Progression Finder](https://liotier.github.io/AkaiMPC/AkaiMPCChordProgressionFinder/Akai%20MPC%20Chord%20Progression%20Finder.html)**  
**GitHub: [Source Code](https://github.com/liotier/AkaiMPC/tree/main/AkaiMPCChordProgressionGenerator)**
