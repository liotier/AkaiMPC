# Akai MPC Tools

Professional-grade chord progression tools and MIDI resources for Akai MPC users.

**[Browse All Tools →](https://liotier.github.io/AkaiMPC/)**

This repository contains two complementary web applications for working with chord progressions on the Akai MPC, plus MIDI program files for Roland hardware.

## Projects

### 🎹 [Chord Progression Generator](https://liotier.github.io/AkaiMPC/AkaiMPCChordProgressionGenerator/)
Generate musically intelligent custom chord progressions in 4×4 pad layouts for Akai MPC Pad Perform.

**Key Features:**
- 135 progression templates across 15 genres
- 36 scales and modes from common to exotic
- Four intelligent voicing variants (Classic, Jazz, Modal, Experimental)
- Voice leading optimization for smooth transitions
- Chord Matcher for finding keys from specific chords
- Multi-view support: MPC pads, keyboard, guitar, and staff notation
- Export to .progression files for MPC hardware

[View Documentation →](AkaiMPCChordProgressionGenerator/README.md)

### 🔍 [Chord Progression Finder](https://liotier.github.io/AkaiMPC/AkaiMPCChordProgressionFinder/)
Analyze and explore chord progressions from MPC .progression files.

**Key Features:**
- Pure interval-based chord analysis
- Automatic key and scale detection
- Roman numeral analysis
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

## Features

Both chord progression tools share these capabilities:

### Multi-View Visualization
- **MPC View**: 4x4 pad layout matching Akai MPC hardware
- **Keyboard View**: Piano diagrams showing which keys to press
- **Guitar View**: Chord diagrams with fret positions
- **Staff Notation**: Traditional treble clef notation

### Audio & Export
- **Web Audio Playback**: Browser-based chord playback
- **MIDI Support**: Connect external MIDI devices
- **Keyboard Control**: Trigger pads with computer keyboard
- **Export Options**: Download .progression files or print diagrams

### Built for Musicians
- Zero installation required - runs entirely in browser
- Works offline after first load
- Privacy-first - all processing happens locally
- Mobile responsive design

## Quick Start

1. Visit the [landing page](https://liotier.github.io/AkaiMPC/)
2. Choose Generator (create new progressions) or Finder (analyze existing ones)
3. Start creating or analyzing chord progressions
4. Export to your MPC or print for reference

## Technology

- Pure vanilla JavaScript (ES6 modules)
- Web Audio API for synthesis
- WebMIDI API for external devices
- SVG rendering for notation
- No frameworks, no dependencies

## Contributing

Contributions welcome! Areas for enhancement:

- Additional progression templates and scales
- More instrument visualization options
- Enhanced MIDI functionality
- Mobile app versions
- Additional hardware integrations

Please submit issues and pull requests on GitHub.

## License

MIT License - See [LICENSE](LICENSE) file for details.

## Credits

**Created by Jean-Marc Liotier**

- Built for the Akai MPC community
- Shout out to [MPC Forums](https://www.mpc-forums.com/)
- Treble clef SVG from [Openclipart](https://openclipart.org/)
- Inspired by the [J-6 Chord Finder](https://j6chordfinder.github.io/)

---

**Made with ♪ for musicians, by musicians**
