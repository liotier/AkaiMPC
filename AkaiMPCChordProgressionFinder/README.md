# MPC Chord Progression Finder

A web-based tool for analyzing and exploring chord progressions from Akai MPC `.progression` files. Find the perfect chord set for any song style, discover which famous progressions you can play, and visualize your chords in the familiar MPC 4x4 pad layout.

![MPC One](https://liotier.github.io/AkaiMPC/AkaiMPCChordProgressionFinder/20250821%20MPC%20One%20on%20chair%20-%20web%20sized.jpg)

## 🎹 Features

### Core Functionality
- **Pure Interval-Based Analysis**: Analyzes chords from actual MIDI note data, not relying on potentially incorrect chord names
- **Smart Key Detection**: Automatically detects the root note and scale/mode of each progression
- **Roman Numeral Analysis**: Shows chord functions within the detected key using simplified notation (I, ii, iii, IV, etc.)
- **Playable Progressions Detection**: Instantly see which famous progressions (ii-V-I, I-V-vi-IV, etc.) you can play with each chord set

### User Interface
- **4x4 MPC Pad Layout**: Visualizes chords exactly as they appear on your MPC hardware
- **Interactive Playback**: Click any pad to hear the chord, or play the entire progression
- **Drag & Drop Loading**: Simply drop your `.progression` files onto the page
- **Real-time Filtering**: Filter by key, scale, playable progressions, or specific chords

### Musical Coverage
- **Jazz Standards**: ii-V-I, I-vi-ii-V, Rhythm Changes, and more
- **Pop/Rock**: I-V-vi-IV, 50s progression, and other popular patterns  
- **Blues**: 12-bar blues, minor blues, and variations
- **Classical/Folk**: Authentic and plagal cadences

## 🚀 Quick Start

### Online Version
Visit the live tool at: [https://liotier.github.io/AkaiMPC/AkaiMPCChordProgressionFinder/](https://liotier.github.io/AkaiMPC/AkaiMPCChordProgressionFinder/)

### Local Usage
1. Download the HTML file
2. Open it in any modern web browser (Chrome, Firefox, Safari, Edge)
3. Drop your `.progression` files onto the page
4. Start exploring your chord sets!

## 📁 File Format

The tool reads Akai MPC `.progression` files (JSON format) with the following structure:

```json
{
  "progression": {
    "name": "Jazz Standards C Major",
    "chords": [
      {
        "name": "Cmaj7",
        "notes": [60, 64, 67, 71]
      },
      {
        "name": "Dm7",
        "notes": [62, 65, 69, 72]
      }
    ]
  }
}
```

**Note**: The tool analyzes the actual MIDI note numbers, not the chord names, ensuring accurate analysis even if chords are mislabeled.

## 🎯 Use Cases

### For Producers
- Quickly find chord sets that work for specific genres
- Verify that your chord progressions contain all necessary chords for standard songs
- Explore harmonic possibilities within a key

### For Live Performers  
- Preview how chord sets will map to your MPC pads
- Find versatile chord sets that can play multiple progressions
- Practice with the built-in playback before loading on hardware

### For Music Educators
- Demonstrate chord progressions and harmonic analysis
- Show the relationship between chords in different keys
- Teach Roman numeral analysis with interactive examples

## 🔧 Technical Details

### Chord Analysis
- Identifies chord qualities through interval analysis
- Handles inversions and slash chords
- Recognizes extended chords (7ths, 9ths, 11ths, 13ths)
- Detects suspended, diminished, and augmented chords

### Scale Detection
The tool can identify progressions in:
- Major and Natural/Harmonic/Melodic Minor
- Modal scales (Dorian, Phrygian, Lydian, Mixolydian, Locrian)
- Pentatonic and Blues scales

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🎨 Features in Detail

### Filtering System
- **Root Note**: Filter by the tonic of the progression
- **Scale/Mode**: Show only progressions in specific scales
- **Can Play Progression**: Find chord sets containing all chords for famous progressions
- **Chord Contains**: Filter for sets containing specific chords
- **Text Search**: Search progression names

### Display Options
- **Group by Key**: Organize progressions by their detected key
- **Show Intervals**: Display interval relationships within chords
- **Playable Progressions**: See which standard progressions each set can play

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs or suggest features via GitHub Issues
- Submit pull requests with improvements
- Share your `.progression` files for testing

## 📝 License

This project is open source and available under the Unlicense.

## 🙏 Acknowledgments

- Built for the Akai MPC community
- Shout out to the amazing folks at [MPC Forums](https://www.mpc-forums.com/) - where the real MPC magic happens!
- Inspired by the [J-6 Chord Finder](https://j6chordfinder.github.io/) and the need for better chord progression tools in hardware-based music production

## 📞 Contact

- GitHub: [liotier/AkaiMPC](https://github.com/liotier/AkaiMPC)
- Issues: [GitHub Issues](https://github.com/liotier/AkaiMPC/issues)
