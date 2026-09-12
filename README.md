# Akai MPC Tools

Professional-grade chord progression tools and MIDI resources for Akai MPC users.

**[Browse All Tools →](https://liotier.github.io/AkaiMPC/)**

This repository contains two complementary web applications for working with chord progressions on the Akai MPC, plus MIDI program files for Roland hardware.

## Projects

### 🎹 [Chord Progression Generator](https://liotier.github.io/AkaiMPC/AkaiMPCChordProgressionGenerator/)
Creates new chord progressions from music theory - 173 genre templates or 34 scales/modes, up to five voicing variants each, viewable as MPC pads, piano keyboard, guitar fretboard, or staff notation.

**Key Features:**
- 173 progression templates across 22 genres, or Scale Mode to explore any of 34 scales chord-by-chord
- Five intelligent voicing variants (Smooth, Classic, Jazz, Modal, Experimental)
- Voice leading optimization for smooth transitions
- Chord Matcher for finding keys from specific chords
- Multi-view support: MPC pads, keyboard, guitar, and staff notation, plus MIDI export
- Export to `.progression` files for MPC hardware, or grab the entire catalogue pre-built as a bulk download

[View Documentation →](AkaiMPCChordProgressionGenerator/README.md)

### 🔍 [Chord Progression Finder](https://liotier.github.io/AkaiMPC/AkaiMPCChordProgressionFinder/)
Analyzes chord progressions from existing MPC `.progression` files - the opposite direction from the Generator: instead of creating new progressions, it identifies what you've already got.

**Key Features:**
- Pure interval-based chord analysis, including inversions - works from the actual notes, not the (possibly wrong) file name
- Automatic key and scale detection, with Roman numeral analysis
- Playable progressions detection (ii-V-I, I-V-vi-IV, etc.)
- Real-time filtering and export capabilities
- Interactive 4×4 MPC pad layout with audio playback

[View Documentation →](AkaiMPCChordProgressionFinder/README.md)

### 🎛️ [MIDI Programs](https://github.com/liotier/AkaiMPC/tree/main/MIDI%20programs)
Pre-configured MIDI program files for Roland hardware:
- **MX-1**: Performance mixer MIDI mapping
- **TR-8**: Drum machine controller setup
- **VT-4**: Voice transformer effects mapping

Download .xpm files directly from the [MIDI programs directory](https://github.com/liotier/AkaiMPC/tree/main/MIDI%20programs).

## What They Share

The Generator and the Finder are separate tools built for opposite directions (create vs. identify), each with its own feature set detailed above and in its own README. What they do share:

- **Zero installation** - runs entirely in the browser, no sign-up
- **Privacy-first** - all processing happens locally, nothing you load or generate leaves your device
- **MPC pad view with audio playback** - both render the familiar 4×4 layout and let you click a pad to hear it
- **Free and open source** - Unlicense, no strings attached

Everything else - keyboard/guitar/staff views, WebMIDI hardware output, offline caching, MIDI export, bulk downloads - is Generator-specific; see its README for the full list.

## Quick Start

1. Visit the [landing page](https://liotier.github.io/AkaiMPC/)
2. Choose Generator (create new progressions) or Finder (analyze existing ones)
3. Start creating or analyzing chord progressions
4. Export to your MPC or print for reference

## Technology

- Pure vanilla JavaScript (ES6 modules) - no framework in either tool
- Web Audio API for synthesis (both tools)
- WebMIDI API for external hardware output (Generator only)
- SVG rendering for notation (Generator only)
- The few third-party libraries used (JSZip for bulk exports, WebMidi.js for hardware MIDI) are vendored into the repo rather than loaded from a CDN, so a blocked or unreachable CDN never breaks a first-time visit

## Contributing

Contributions welcome! Areas for enhancement:

- Additional progression templates and scales
- More instrument visualization options
- Enhanced MIDI functionality
- Mobile app versions
- Additional hardware integrations

Please submit issues and pull requests on GitHub.

## License

This project is released under the Unlicense - See [LICENSE](LICENSE) file for details.

## Credits

**Created by Jean-Marc Liotier**

- Built for the Akai MPC community
- Shout out to [MPC Forums](https://www.mpc-forums.com/)
- Treble clef SVG from [Openclipart](https://openclipart.org/)
- Inspired by the [J-6 Chord Finder](https://j6chordfinder.github.io/)

---

**Made with ♪ for musicians, by musicians**
