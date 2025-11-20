# Akai MPC Chord Progression Generator

A powerful, educational web application for generating and visualizing chord progressions across multiple musical instruments and notation systems.

## Features

### Multi-View Support

Visualize chord progressions in four different contexts:

- **MPC View**: Akai MPC-style 4x4 pad layout with chord annotations
- **Keyboard View**: Piano keyboard diagrams showing which keys to press
- **Guitar View**: Guitar chord diagrams with fret positions and fingerings
- **Staff Notation**: Traditional music notation with treble clef

### Music Theory Tools

- **50+ Progression Templates**: Common progressions from jazz, pop, classical, and more
- **Multiple Modes**: Major, Minor (Natural/Harmonic/Melodic), Church Modes, Pentatonic, Blues, and more
- **Chord Matcher**: Find keys that contain specific chords you want to use
- **Scale Exploration Mode**: Generate all diatonic chords for any mode
- **Voice Leading Analysis & Visualization**: Real-time analysis with color-coded smoothness indicators (NEW)
  - **Green border**: Smooth transitions (common tones + step motion)
  - **Blue border**: Moderate movement (some smoothness)
  - **Amber border**: Dramatic leaps (large intervals for effect)
  - Hover for detailed analysis (e.g., "2 common tones, 1 step")
- **Genre-Specific Voice Leading**: Each variant optimizes differently (NEW)
  - **Classic**: Strict voice leading rules for classical style
  - **Jazz**: Smooth transitions with close voicings
  - **Modal**: Spacious open voicings
  - **Experimental**: Dramatic leaps for emotional impact
- **Chord Role Descriptions**: Educational tooltips explaining each chord's function

### Playback & Export

- **Web Audio Playback**: Click any chord to hear it
- **MIDI Support**: Connect external MIDI devices for authentic sound
- **Keyboard Control**: Use computer keyboard keys (cvbndfgherty3456) to trigger pads like an MPC
- **Sequential Playback**: Staff notation plays notes as eighth notes at 90 BPM
- **Export Options**:
  - Download .progression files for Akai MPC
  - Print-optimized layouts (landscape for keyboard/staff, portrait for guitar/MPC)

### User Experience

- **Context Persistence**: Your last used view (MPC/Keyboard/Guitar/Staff) is remembered (NEW)
- **Input Validation**: Helpful error messages prevent mistakes (NEW)
- **Toast Notifications**: Clear feedback for user actions (NEW)
- **Left-Handed Mode**: Guitar diagrams can be flipped for left-handed players
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **URL Sharing**: Share exact progressions via URL parameters

## Recent Improvements

### Code Quality & Performance

- **Modular Architecture**: Separated concerns into focused modules
  - `modules/constants.js`: Centralized configuration
  - `modules/audio.js`: All audio playback logic
  - `modules/musicTheory.js`: Music theory calculations
  - `modules/rendering.js`: SVG generation
  - `modules/storage.js`: Persistence and preferences
  - `modules/guitarChords.js`: Guitar chord database

- **Eliminated Code Duplication**:
  - Removed 200+ lines of duplicate audio code
  - Consolidated MIDI frequency calculations
  - Centralized magic numbers into named constants

- **Better Error Handling**:
  - Try-catch blocks throughout
  - LocalStorage quota handling
  - Null checks on DOM elements
  - Graceful degradation

- **Enhanced Documentation**:
  - JSDoc comments on all functions
  - Inline explanations of complex algorithms
  - Clear parameter and return types

### Music Theory Features

- **Voice Leading Visualization**: Visual color-coding shows voice movement quality
  - **Smooth (green)**: 4+ smoothness score - lots of common tones and step motion
  - **Moderate (blue)**: 2-3 smoothness - some smooth movement
  - **Dramatic (amber)**: 0-1 smoothness - large leaps for emotional effect
  - Hover tooltips show exact counts (e.g., "Smooth: 2 common tones, 1 step")
  - Only shown on progression chords for clarity

- **Genre-Optimized Voice Leading**:
  - **Classic variant**: Re-optimizes for classical voice leading principles
  - **Jazz variant**: Close voicings with smooth transitions (common tones + steps)
  - **Modal variant**: Open voicings for spacious sound
  - **Experimental variant**: Spread voicings create natural dramatic leaps
  - Different genres have different voice leading priorities!

- **Voice Leading Analysis Engine**: Analyzes transitions between chords
  - Identifies common tones (notes that stay the same)
  - Tracks step motion (1-2 semitone smooth movement)
  - Detects skips (3-4 semitones) and leaps (5+ semitones)
  - Calculates smoothness score for comparison
  - Pedagogically valuable for learning composition

- **Chord Role Visibility**: In keyboard view, chord roles (tonic, dominant, etc.) are always visible, not just in tooltips

## Technical Details

### Audio System

The app supports three audio playback methods (in priority order):

1. **External MIDI** (if device selected): Full velocity and duration control
2. **Web Audio API**: Browser-based synthesis with custom envelopes
3. **Fallback**: Graceful degradation if audio unavailable

**Audio Parameters** (configurable in `constants.js`):
- Attack: 10ms
- Release: 100ms
- Max gain: 0.2 (prevents distortion)
- Waveform: Sine wave

### Storage

Preferences are persisted in two ways:

1. **LocalStorage**: Survives browser restarts
2. **URL Parameters**: Enables sharing exact states

Stored preferences:
- Selected key, mode, and progression
- Left-handed mode setting
- Last used context (MPC/Keyboard/Guitar/Staff)

### Browser Support

- **Modern browsers**: Chrome, Firefox, Edge, Safari (latest versions)
- **WebMIDI**: Chrome, Edge (Firefox support limited)
- **Web Audio API**: All modern browsers
- **LocalStorage**: All modern browsers

## Usage

### Basic Workflow

1. **Select Key**: Choose your musical key (C, D, E, etc.)
2. **Select Mode**: Pick a scale (Major, Minor, Dorian, etc.)
3. **Select Progression**: Choose a progression template or use Scale Exploration
4. **Generate**: Click "Generate Progressions" to see multiple voicing variations
5. **Switch View**: Use tabs to see keyboard, guitar, staff, or MPC layout
6. **Play**: Click pads/chords to hear them
7. **Export**: Download .progression files or print

### Advanced: Chord Matcher

The Chord Matcher helps you find keys that contain specific chords:

1. Click "Open Chord Matcher"
2. Select chords you want (e.g., Cmaj, Am, F, G)
3. View compatible keys that contain all selected chords
4. Click a key to automatically select it

### Keyboard Controls

Map computer keys to MPC pads (works with CAPS LOCK on):

```
Row 4 (Pads 13-16):  3  4  5  6
Row 3 (Pads  9-12):  e  r  t  y
Row 2 (Pads  5-8):   d  f  g  h
Row 1 (Pads  1-4):   c  v  b  n
```

Hold keys to sustain chords (like MPC pad hold).

## Configuration

All configuration constants are in `modules/constants.js`:

```javascript
export const AUDIO = {
    A4_FREQUENCY: 440,
    MAX_GAIN: 0.2,
    ATTACK_TIME: 0.01,
    RELEASE_TIME: 0.1,
    // ... more audio settings
};

export const LIMITS = {
    MAX_CHORD_REQUIREMENTS: 16,
    MIN_CHORD_NOTES: 1,
    MAX_CHORD_NOTES: 8
};
```

Modify these to customize the app behavior.

## Development

### File Structure

```
AkaiMPCChordProgressionGenerator/
├── index.html              # Main HTML
├── app.js                  # Main application logic
├── styles.css              # All styles
├── modules/
│   ├── constants.js        # Configuration & constants
│   ├── audio.js           # Audio playback
│   ├── musicTheory.js     # Music theory engine
│   ├── rendering.js       # SVG generation
│   ├── storage.js         # Persistence
│   └── guitarChords.js    # Guitar chord database
```

### Key Concepts

**Music Theory Engine**:
- Modes defined by interval patterns
- Chords built from scale degrees
- Roman numeral analysis
- Multiple voicing algorithms

**SVG Rendering**:
- Piano keyboard (2-octave range)
- Guitar fretboard (auto-positioned)
- Staff notation with ledger lines
- Dynamic sizing and positioning

**Audio System**:
- MIDI note to frequency conversion: `f = 440 * 2^((n-69)/12)`
- Web Audio envelope (ADSR)
- Oscillator pooling for efficiency

## Contributing

Contributions welcome! Areas for improvement:

- Additional progression templates
- More guitar chord voicings
- Bass clef support for staff notation
- Drum pattern integration
- MIDI file export
- Additional modes/scales
- UI for displaying voice leading analysis

## License

MIT License - See LICENSE file for details

## Credits

- Treble clef SVG from [Openclipart](https://openclipart.org/)
- Built with vanilla JavaScript (no frameworks)
- Web Audio API
- WebMIDI API (chrome/edge)

## Version History

### Latest (2025-01-XX)
- **Voice leading visualization**: Color-coded borders show smoothness
- **Genre-specific voice leading**: Jazz/Classic optimize for smoothness, Experimental for drama
- **Context persistence**: Your last view is remembered across sessions
- **Improved error handling**: Better validation and user feedback
- **Modular architecture**: Separated into focused, well-documented modules
- **Consolidated audio code**: Eliminated 200+ lines of duplication
- **Constants extraction**: All magic numbers now named and documented
- **Notification system**: Toast messages for clear user feedback
- **Voice leading analysis**: Foundation for pedagogical insights
- **Code quality improvements**: JSDoc, error handling, null checks throughout

### Previous
- Added staff notation view
- Improved print layouts
- Added chord role display in keyboard view
- Multiple bug fixes and optimizations

---

**Made with ♪ for musicians, by musicians**
