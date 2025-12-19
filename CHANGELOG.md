# MPC Chord Progression Generator - What's New

## 🎨 Major Update: Smarter Chord Palettes & Improved Workflow

### ✨ Genre-Specific Palette Intelligence (NEW!)

Your chord palettes now understand musical style! We've added intelligent palette priority weighting to **60+ progressions** across major genres:

**How It Works:**
- Each progression now knows which chord voicings sound most authentic for its genre
- **Preferred chords** appear first in your palette (highest priority)
- **Allowed chords** provide harmonic variety (medium priority)
- **Avoided chords** are filtered out when they clash with the genre's character (lowest priority)

**Genres with Smart Palettes:**
- **Blues/Soul** - Prefers dom7, major; avoids major7, experimental voicings
- **Gospel/Worship** - Loves major7, dom7; avoids diminished, quartal
- **Latin/Bossa** - Embraces minor7, major7, dom7 for that authentic sound
- **Metal/Rock** - Power chords (major, minor); avoids jazz extensions
- **Techno** - Prioritizes minimal harmony; avoids complex voicings
- **Folk/Singer-Songwriter** - Simple triads (major, minor); avoids jazz complexity
- **Reggae/Dub** - Major and dom7 for bassline-driven tracks
- **Synthwave/Retrowave** - 80s-style major/minor with selective 7th usage
- **Trance/Psytrance/Goa** - Modal simplicity with hypnotic character
- **UK Bass** - Genre-specific (UK Garage loves minor7, Dubstep prefers diminished/dom7)
- **R&B/Neo-Soul** - Extended harmony (major7, minor7, dom7)
- **Hip-Hop/Trap** - Minor, major; minimal complexity
- **And more!**

### 🎹 Chord Matcher Enhanced

The Chord Matcher now clearly shows it works with **both modes**:
- Input chords from your sample
- Get compatible keys and modes for **both** Progression Palette and Scale modes
- Filters are applied intelligently across your entire workflow

### 🎯 Clearer Mode Selection

We've restructured the interface to make the two workflows crystal clear:

**Progression Palette Mode:**
- Choose from 135+ progression palettes across 15 genres
- Get 4 voicing variants instantly with genre-appropriate chord priorities
- Perfect for quick inspiration and authentic-sounding progressions

**Scale Mode:**
- Pick from 36 scales/modes and explore all available chords
- Perfect for learning exotic scales or building progressions from scratch
- Great for modal exploration and music theory study

### 📐 Smarter Layout

**Responsive Horizontal Design:**
- Mode containers now sit side-by-side on desktop (stacks on mobile)
- Toggle + Key selector share a row
- Progression Name + Generate button on the same line
- Reclaims precious vertical space for a cleaner workflow
- Everything still stacks beautifully on smaller screens

**Better Visual Hierarchy:**
- Active/inactive mode containers with clear visual feedback
- Blue border highlights your active mode
- Grayed-out inactive mode reduces visual clutter
- Context-aware labeling: "Progression Name" in Palette Mode, "Output Name" in Scale Mode

### 🎼 Under the Hood

- Backward compatible with existing `paletteFilter` system
- New `palettePriorities` provides sophisticated 3-tier weighting (preferred=3, allowed=2, avoided=1)
- Progressions are sorted by priority first, then spice level for optimal palette organization
- Conservative approach to avoid "hallucinating" harmonic characteristics

### 📝 Terminology Refinement

"Progression Template" → "Progression Palette"
- Better metaphor: chords are colors you pick from a palette, not played sequentially
- More accurate representation of how the tool works
- Clearer distinction from Scale Mode

---

**Total Impact:** 60 progressions now have musically intelligent palette weighting across 12+ genres, with a cleaner, more responsive interface that makes the two workflows obvious at a glance.

**Try it now:** Generate a Blues progression and notice how dom7 chords appear at the top of your palette. Switch to Folk and see simple major/minor triads prioritized. The generator now speaks the language of each musical style!
