// Music Theory Module
// Contains all music theory logic, constants, and chord generation functions

// ============================================================================
// Constants and Data
// ============================================================================

export const keys = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];

export const modes = {
    'Common Western Tonal': [
        'Major',
        'Minor',
        'Dorian',
        'Phrygian',
        'Lydian',
        'Mixolydian',
        'Locrian',
        'Harmonic Minor',
        'Melodic Minor'
    ],
    'Compact/Popular': [
        'Pentatonic Major',
        'Pentatonic Minor',
        'Blues'
    ],
    'Symmetrical/Jazz': [
        'Whole Tone',
        'Diminished (W-H)',
        'Diminished (H-W)',
        'Augmented',
        'Altered',
        'Lydian Dominant',
        'Locrian #2',
        'Bebop Major',
        'Bebop Dominant',
        'Bebop Minor'
    ],
    'Arabic Maqamat': [
        'Maqam Hijaz',
        'Maqam Bayati',
        'Maqam Rast',
        'Maqam Saba',
        'Maqam Kurd'
    ],
    'Indian Ragas': [
        'Bhairav',
        'Kafi',
        'Yaman',
        'Bhairavi',
        'Todi'
    ],
    'Exotic': [
        'Double Harmonic',
        'Hungarian Minor',
        'Neapolitan Major',
        'Neapolitan Minor',
        'Enigmatic',
        'Phrygian Dominant',
        'Persian',
        'Hirajoshi',
        'Insen',
        'Kumoi',
        'Egyptian Pentatonic'
    ]
};

export const progressions = {
    'Pop/Rock': [
        {
            value: 'I—V—vi—IV',
            palettePriorities: {
                preferred: ['major', 'minor', 'major7'],     // Warm, accessible pop sound
                allowed: ['minor7', 'dom7'],                  // Add depth without edge
                avoided: ['diminished', 'augmented', 'quartal']  // Too tense for pop
            },
        },
        {
            value: 'I—IV—V—I',
            palettePriorities: {
                preferred: ['major', 'dom7'],                // Classic rock foundation
                allowed: ['minor', 'minor7'],                 // For variation
                avoided: ['major7', 'diminished', 'augmented', 'quartal']  // Too jazzy/experimental
            },
        },
        {
            value: 'vi—IV—I—V',
            palettePriorities: {
                preferred: ['major', 'minor'],               // Power chord energy
                allowed: ['dom7', 'minor7'],                  // Occasional depth
                avoided: ['major7', 'diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'I—vi—IV—V',
        },
        {
            value: 'I—V—vi—iii—IV',
        },
        {
            value: 'IV—I—V—vi',
        },
        {
            value: 'vi—V—IV—V',
        },
        {
            value: 'I—III—IV—iv',
        },
        {
            value: 'I—V—♭VII—IV',
        },
        {
            value: 'I—♭VII—IV—I',
        },
        {
            value: 'i—V—VII—IV—VI—III—iv—V',
        }
    ],
    'Blues/Soul': [
        {
            value: '12-bar-blues',
            palettePriorities: {
                preferred: ['dom7', 'major'],                // Blues is built on dom7 and major triads
                allowed: ['minor', 'minor7'],                 // For variety and minor blues
                avoided: ['major7', 'augmented', 'quartal', 'diminished']  // Too jazzy for traditional blues
            },
        },
        {
            value: 'I—vi—ii—V',
            palettePriorities: {
                preferred: ['dom7', 'minor7'],               // Classic jazz turnaround sound
                allowed: ['major', 'minor', 'major7'],        // Additional colors
                avoided: ['augmented', 'quartal', 'diminished']
            },
        },
        {
            value: 'ii—V—I—VI',
            palettePriorities: {
                preferred: ['dom7', 'minor7', 'major7'],     // Rich jazz harmony
                allowed: ['major', 'minor'],                  // Basic triads
                avoided: ['augmented', 'quartal']             // Too experimental for swing era
            },
        },
        {
            value: 'I—VI—ii—V',
            palettePriorities: {
                preferred: ['dom7', 'minor7', 'major7'],     // Rich jazz harmony
                allowed: ['major', 'minor'],
                avoided: ['augmented', 'quartal']
            },
        },
        {
            value: 'i—♭III—♭VII—IV',
            palettePriorities: {
                preferred: ['minor', 'major', 'minor7'],      // Modal jazz colors
                allowed: ['dom7', 'major7'],                   // Extended harmony
                avoided: ['diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'i—IV—i—V',
        }
    ],
    'Jazz/Functional': [
        {
            value: 'ii—V—I',
        },
        {
            value: 'ii—V—I—vi',
        },
        {
            value: 'iii—vi—ii—V',
        },
        {
            value: 'IVM7—V7—iii7—vi',
        },
        {
            value: 'IM7—ii7—iii7—IVM7',
        },
        {
            value: 'vi—ii—V—I',
        },
        {
            value: 'I—vi—IV—♯iv°—V',
        },
        {
            value: 'iv—♭VII—I',
        },
        {
            value: 'I—♯I°—ii—♯II°',
        },
        {
            value: 'IM7—♭IIIM7—♭VIM7—♭II7',
        },
        {
            value: 'III7—VI7—II7—V7',
            palettePriorities: {
                preferred: ['dom7', 'dom9', 'dom13'],
                allowed: ['major7', 'dom7b9'],
                avoided: ['minor', 'diminished']
            },
        },
        {
            value: 'V7/ii—ii—V7—I',
            palettePriorities: {
                preferred: ['dom7', 'minor7', 'major7'],
                allowed: ['dom9', 'minor9'],
                avoided: ['diminished', 'quartal']
            },
        },
        {
            value: '♭II7—I',
            palettePriorities: {
                preferred: ['dom7', 'dom9', 'major7'],
                allowed: ['dom7b5', 'dom13'],
                avoided: ['minor', 'diminished']
            },
        },
        {
            value: 'ii7—♭II7—IM7',
            palettePriorities: {
                preferred: ['minor7', 'dom7', 'major7'],
                allowed: ['dom9', 'minor9'],
                avoided: ['diminished', 'augmented']
            },
        },
        {
            value: 'ii—V—I—IV—vii°—III7—vi',
            palettePriorities: {
                preferred: ['minor7', 'dom7', 'major7'],
                allowed: ['minor9', 'dom9'],
                avoided: ['augmented', 'quartal']
            },
        },
        {
            value: 'i—i(maj7)—i7—i6',
            palettePriorities: {
                preferred: ['minor', 'minMaj7', 'minor7', 'minor6'],
                allowed: ['dim7'],
                avoided: ['major', 'augmented', 'quartal']
            },
        },
        {
            value: 'IM7—♭VII7—♭VIM7—V7',
            palettePriorities: {
                preferred: ['major7', 'dom7'],
                allowed: ['dom9', 'major9'],
                avoided: ['minor', 'diminished', 'quartal']
            },
        },
        {
            value: 'IM7—♭IIIM7—♭VIM7—♭II7—IM7',
            palettePriorities: {
                preferred: ['major7', 'dom7'],
                allowed: ['dom9', 'major9', 'dom7b5'],
                avoided: ['minor', 'diminished', 'quartal']
            },
        },
        {
            value: 'V7/ii—V7/V—V7—I',
            palettePriorities: {
                preferred: ['dom7', 'dom9', 'major7'],
                allowed: ['dom7b9', 'dom13'],
                avoided: ['minor', 'diminished', 'quartal']
            },
        },
        {
            value: 'I—V7/vi—vi—V7/V—V7—I',
            palettePriorities: {
                preferred: ['major7', 'dom7', 'minor7'],
                allowed: ['dom9', 'minor9'],
                avoided: ['diminished', 'quartal']
            },
        },
        {
            value: 'I—♯I°—ii—♯II°—iii',
            palettePriorities: {
                preferred: ['major7', 'dim7', 'minor7'],
                allowed: ['major', 'minor'],
                avoided: ['augmented', 'quartal']
            },
        },
        {
            value: 'I—I°—ii—♯II°—iii—III°—IV',
            palettePriorities: {
                preferred: ['major7', 'dim7', 'minor7'],
                allowed: ['major', 'minor'],
                avoided: ['augmented', 'quartal']
            },
        }
    ],
    'Modal Interchange': [
        {
            value: '♭VI—♭VII—I',
            palettePriorities: {
                preferred: ['major', 'major7'],
                allowed: ['dom7', 'sus4'],
                avoided: ['diminished', 'minor7']
            },
        },
        {
            value: 'I—♭VII—IV—I',
            palettePriorities: {
                preferred: ['major', 'dom7'],
                allowed: ['sus4', 'major7'],
                avoided: ['diminished', 'minor7']
            },
        },
        {
            value: 'I—♭III—♭VII—IV',
            palettePriorities: {
                preferred: ['major', 'dom7'],
                allowed: ['sus4', 'add9'],
                avoided: ['diminished', 'minor7']
            },
        },
        {
            value: 'i—IV—i—V',
            palettePriorities: {
                preferred: ['minor', 'major', 'dom7'],
                allowed: ['minor7', 'sus4'],
                avoided: ['diminished', 'augmented']
            },
        },
        {
            value: 'I—iv—I—V',
            palettePriorities: {
                preferred: ['major', 'minor', 'dom7'],
                allowed: ['major7', 'sus4'],
                avoided: ['diminished', 'augmented']
            },
        },
        {
            value: '♭VI—iv—I',
            palettePriorities: {
                preferred: ['major', 'minor'],
                allowed: ['major7', 'minor7'],
                avoided: ['dom7', 'diminished']
            },
        }
    ],
    'Classical/Modal': [
        {
            value: 'I—IV—vii°—iii—vi—ii—V—I',
        },
        {
            value: 'I—V—vi—iii—IV—I—IV—V',
        },
        {
            value: 'i—♭VII—♭VI—V',
        },
        {
            value: 'i—♭VII—i—V',
        },
        {
            value: 'I—V—I—IV',
        },
        {
            value: 'iv—♭VII—♭III—♭VI',
        },
        {
            value: 'i—iv—♭VII—♭III',
        }
    ],
    'Electronic/Modern': [
        {
            value: 'i—♭VI—♭III—♭VII',
        },
        {
            value: 'i—♭VII—♭VI—♭VII',
        },
        {
            value: 'vi—IV—I—V',
        },
        {
            value: 'I—V—vi—IV—I—V—iii—IV',
        },
        {
            value: 'i—♭III—♭VII—i',
        },
        {
            value: 'I—♭III—IV—♭VI',
        },
        {
            value: 'i—iv—v',
            palettePriorities: {
                preferred: ['minor', 'quartal'],       // Sparse, mechanical core
                allowed: ['minor7'],                    // Subtle depth
                avoided: ['major', 'major7', 'dom7', 'diminished', 'augmented']
            },
        },
        {
            value: 'I—IV—V',
            palettePriorities: {
                preferred: ['major7', 'minor7', 'dom7'],  // Rich 7ths are signature
                allowed: ['major', 'minor'],               // Basic triads for variety
                avoided: ['diminished', 'augmented']       // Too tense
            },
        },
        {
            value: 'IM7—IVM7—VM7',
            palettePriorities: {
                preferred: ['major7', 'minor7', 'quartal'],  // Floating, ethereal
                allowed: ['major', 'minor'],                  // Simpler textures
                avoided: ['dom7', 'diminished', 'augmented'] // Too tense/driving
            },
        }
    ],
    'R&B/Neo-Soul': [
        {
            value: 'ii—V—IM7—vi',
            palettePriorities: {
                preferred: ['major7', 'minor7', 'dom7'],      // Rich extended neo-soul harmony
                allowed: ['major', 'minor'],                   // Triads for contrast
                avoided: ['diminished', 'augmented', 'quartal']  // Too tense/experimental
            },
        },
        {
            value: 'IM7—iii7—vi7—ii7',
            palettePriorities: {
                preferred: ['major7', 'minor7'],               // All 7ths for smooth sound
                allowed: ['dom7', 'major', 'minor'],           // Additional colors
                avoided: ['diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'I—IV—ii—V',
            palettePriorities: {
                preferred: ['major', 'minor', 'dom7'],         // Classic soul harmony
                allowed: ['major7', 'minor7'],                  // Modern extensions
                avoided: ['diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'vi—ii—iii—IV',
            palettePriorities: {
                preferred: ['minor', 'minor7', 'major7'],      // Emotional, vulnerable
                allowed: ['major', 'dom7'],
                avoided: ['diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'IM7—V7/IV—IVM7—iv',
            palettePriorities: {
                preferred: ['major7', 'minor7', 'dom7'],       // Maximum sophistication
                allowed: ['major', 'minor'],
                avoided: ['diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'i—iv—♭VII—♭VI',
        },
        {
            value: 'I—♯iv°—ii—V',
        }
    ],
    'Funk/Groove': [
        {
            value: 'I7',
            palettePriorities: {
                preferred: ['dom9', 'dom7', 'dom13'],
                allowed: ['dom7sharp9', 'dom7b9'],
                avoided: ['major7', 'minor7', 'diminished', 'augmented']
            },
        },
        {
            value: 'i7',
            palettePriorities: {
                preferred: ['minor7', 'minor9', 'minor11'],
                allowed: ['minMaj7', 'minor6'],
                avoided: ['major7', 'diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'I7—IV7',
            palettePriorities: {
                preferred: ['dom9', 'dom7', 'dom13'],
                allowed: ['dom7sharp9'],
                avoided: ['major7', 'minor7', 'diminished']
            },
        },
        {
            value: 'i7—IV7',
            palettePriorities: {
                preferred: ['minor9', 'dom9', 'dom7'],
                allowed: ['minor7', 'dom7sharp9'],
                avoided: ['major7', 'diminished', 'augmented']
            },
        },
        {
            value: 'I7—♭VII7—I7',
            palettePriorities: {
                preferred: ['dom9', 'dom7'],
                allowed: ['dom13', 'dom7sharp9'],
                avoided: ['major7', 'minor7', 'diminished']
            },
        },
        {
            value: 'ii7—V7',
            palettePriorities: {
                preferred: ['minor9', 'dom9', 'dom7'],
                allowed: ['minor7', 'dom13'],
                avoided: ['diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'I7—ii7—iii7—IV7',
            palettePriorities: {
                preferred: ['dom9', 'minor9', 'dom7'],
                allowed: ['minor7', 'dom13'],
                avoided: ['major7', 'diminished', 'quartal']
            },
        },
        {
            value: 'I7—♯IV7—IV7—I7',
            palettePriorities: {
                preferred: ['dom9', 'dom7'],
                allowed: ['dom7sharp9', 'dom13'],
                avoided: ['major7', 'minor7', 'diminished']
            },
        }
    ],
    'Gospel/Worship': [
        {
            value: 'I—V/ii—ii—V',
            palettePriorities: {
                preferred: ['major7', 'dom7', 'minor7'],      // Rich, lush gospel harmony
                allowed: ['major', 'minor'],                   // Basic triads for support
                avoided: ['diminished', 'augmented', 'quartal']  // Too dissonant for worship
            },
        },
        {
            value: 'IV—V—iii—vi',
            palettePriorities: {
                preferred: ['major', 'major7', 'minor'],      // Uplifting, bright praise sound
                allowed: ['dom7', 'minor7'],                   // Extended harmony
                avoided: ['diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'I—IV—V/vi—vi',
            palettePriorities: {
                preferred: ['major7', 'minor', 'dom7'],       // Contemporary worship voicings
                allowed: ['major', 'minor7'],
                avoided: ['diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'ii—V—I—IV',
            palettePriorities: {
                preferred: ['dom7', 'minor7', 'major7'],      // Jazz-gospel fusion harmony
                allowed: ['major', 'minor'],
                avoided: ['diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'I—V/V—V—vi—IV',
        },
        {
            value: 'IV—I—V—vi—IV—♭VII',
        }
    ],
    'Hip-Hop/Trap': [
        {
            value: 'i—♭VI—♭VII',
            palettePriorities: {
                preferred: ['minor', 'minor7'],              // Dark, moody trap core
                allowed: ['major', 'dom7'],                   // For borrowed chords, tension
                avoided: ['major7', 'augmented', 'quartal', 'diminished']  // Too bright/jazzy
            },
        },
        {
            value: 'i—♭III—♭VI—♭VII',
            palettePriorities: {
                preferred: ['minor', 'minor7'],              // Maximum darkness
                allowed: ['major'],                           // Only for borrowed chords
                avoided: ['major7', 'dom7', 'augmented', 'quartal', 'diminished']
            },
        },
        {
            value: 'vi—IV—I',
        },
        {
            value: 'i—♭VII—♭VI',
        },
        {
            value: 'i—iv—i—♭VI',
        },
        {
            value: 'i—♭III—iv—♭VI',
        },
        {
            value: 'I—♭III—♭VII—IV',
        },
        {
            value: 'ii7—V7—IM7',
            paletteFilter: ['minor7', 'major7', 'dom7'],
        },
        {
            value: 'i—♭VII—iv',
            paletteFilter: ['minor', 'minor7', 'major'],
        }
    ],
    'Latin/Bossa': [
        {
            value: 'IM7—VI7—ii7—V7',
            palettePriorities: {
                preferred: ['major7', 'minor7', 'dom7'],      // All 7ths for sophisticated bossa sound
                allowed: ['major', 'minor'],                   // Basic triads for variety
                avoided: ['diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'i—iv—V—i',
            palettePriorities: {
                preferred: ['minor', 'major', 'dom7'],        // Traditional tango harmony
                allowed: ['minor7', 'major7'],                 // Modern tango extensions
                avoided: ['augmented', 'quartal', 'diminished']
            },
        },
        {
            value: 'I—♭II—I—V',
            palettePriorities: {
                preferred: ['major', 'minor'],                 // Modal flamenco uses triads
                allowed: ['dom7'],                             // Occasional dom7 for tension
                avoided: ['major7', 'minor7', 'augmented', 'quartal', 'diminished']  // Too jazzy
            },
        },
        {
            value: 'i—V—i—VII',
            palettePriorities: {
                preferred: ['minor', 'major', 'minor7'],      // Brazilian samba colors
                allowed: ['dom7', 'major7'],                   // Extended harmony
                avoided: ['diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'I—V/ii—ii—V/V—V',
            palettePriorities: {
                preferred: ['dom7', 'minor7', 'major7'],      // Maximum jazz extensions
                allowed: ['major', 'minor'],
                avoided: ['diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'i—♭VII—♭VI—V',
        }
    ],
    'Film/Cinematic': [
        {
            value: 'I—♭VI—♭III—♭VII',
        },
        {
            value: 'i—♭VI—♭VII—i',
        },
        {
            value: 'I—V—vi—♭VI—IV',
        },
        {
            value: 'i—♭III—♭VII—♭VI—V',
        },
        {
            value: 'I—♭VII—♭VI—♭VII',
        },
        {
            value: 'i—iv—♭VI—♭III',
        },
        {
            value: 'I—♭III—♭VI—♭II',
        }
    ],
    'Folk/Singer-Songwriter': [
        {
            value: 'I—IV—I—V',
            palettePriorities: {
                preferred: ['major', 'minor'],
                allowed: ['sus2', 'sus4'],
                avoided: ['major7', 'minor7', 'dom7', 'quartal', 'augmented', 'diminished']
            },
        },
        {
            value: 'vi—IV—V—I',
            palettePriorities: {
                preferred: ['major', 'minor'],
                allowed: ['sus2', 'sus4'],
                avoided: ['major7', 'minor7', 'dom7', 'quartal', 'augmented', 'diminished']
            },
        },
        {
            value: 'I—V—IV—I',
            palettePriorities: {
                preferred: ['major', 'minor'],
                allowed: ['dom7', 'sus2', 'sus4'],
                avoided: ['major7', 'minor7', 'quartal', 'augmented', 'diminished']
            },
        },
        {
            value: 'I—iii—IV—V',
            palettePriorities: {
                preferred: ['major', 'minor'],
                allowed: ['sus2', 'sus4'],
                avoided: ['major7', 'minor7', 'dom7', 'quartal', 'augmented', 'diminished']
            },
        },
        {
            value: 'IV—V—I—vi',
            palettePriorities: {
                preferred: ['major', 'minor'],
                allowed: ['sus2', 'sus4', 'dom7'],
                avoided: ['major7', 'minor7', 'quartal', 'augmented', 'diminished']
            },
        },
        {
            value: 'I—V—vi—iii',
            palettePriorities: {
                preferred: ['major', 'minor'],
                allowed: ['sus2', 'sus4'],
                avoided: ['major7', 'minor7', 'dom7', 'quartal', 'augmented', 'diminished']
            },
        },
        {
            value: 'i—III—IV—VI',
            palettePriorities: {
                preferred: ['minor', 'major'],
                allowed: ['minor7', 'dom7'],
                avoided: ['major7', 'diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'I—IV—I—IV—I—V—I',
            palettePriorities: {
                preferred: ['major', 'minor'],
                allowed: ['sus4', 'major7'],
                avoided: ['dom7', 'diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'I—V—vi—IV',
            paletteFilter: ['major', 'quartal', 'major7'],
        }
    ],
    'Metal/Rock': [
        {
            value: 'i—♭VI—♭VII—i',
            palettePriorities: {
                preferred: ['minor', 'major'],                 // Power chords (ambiguous triads)
                allowed: ['dom7'],                             // Occasional tension
                avoided: ['major7', 'minor7', 'augmented', 'quartal', 'diminished']  // Too jazzy/unstable
            },
        },
        {
            value: 'i—♭III—♭VI—♭VII',
            palettePriorities: {
                preferred: ['minor', 'major', 'diminished'],   // Dark, oppressive doom palette
                allowed: ['dom7'],
                avoided: ['major7', 'minor7', 'augmented', 'quartal']  // Too bright/jazzy
            },
        },
        {
            value: 'i—v—♭VII—iv',
            palettePriorities: {
                preferred: ['minor', 'major'],                 // Modal prog palette
                allowed: ['dom7', 'diminished'],               // For complexity
                avoided: ['major7', 'minor7', 'augmented', 'quartal']
            },
        },
        {
            value: 'i—♭II—i',
            palettePriorities: {
                preferred: ['minor', 'diminished'],            // Maximum aggression
                allowed: ['major', 'dom7'],
                avoided: ['major7', 'minor7', 'augmented', 'quartal']  // Too soft
            },
        },
        {
            value: 'i—♭VII—♭VI—V',
            palettePriorities: {
                preferred: ['minor', 'major', 'diminished'],   // Neoclassical palette
                allowed: ['dom7', 'minor7'],                   // Harmonic minor flavor
                avoided: ['major7', 'augmented', 'quartal']
            },
        },
        {
            value: 'i—iv—v—i',
        },
        {
            value: 'i—V—♭VI—♭VII',
            palettePriorities: {
                preferred: ['minor', 'major', 'dom7'],
                allowed: ['diminished'],
                avoided: ['major7', 'minor7', 'augmented', 'quartal']
            },
        },
        {
            value: 'i—iv—♭VII—♭III—♭VI—♭II—V',
            palettePriorities: {
                preferred: ['minor', 'major', 'dom7'],
                allowed: ['diminished', 'm7b5'],
                avoided: ['major7', 'augmented', 'quartal']
            },
        },
        {
            value: 'i—V/iv—iv—V',
            palettePriorities: {
                preferred: ['minor', 'dom7', 'major'],
                allowed: ['diminished'],
                avoided: ['major7', 'minor7', 'augmented', 'quartal']
            },
        },
        {
            value: 'i—♭II—♭VII—i',
            palettePriorities: {
                preferred: ['minor', 'major'],
                allowed: ['dom7', 'diminished'],
                avoided: ['major7', 'minor7', 'augmented', 'quartal']
            },
        },
        {
            value: 'i—iv—V—i—♭VI—♭III—♭VII—V',
            palettePriorities: {
                preferred: ['minor', 'major', 'dom7'],
                allowed: ['diminished'],
                avoided: ['major7', 'augmented', 'quartal']
            },
        },
        {
            value: 'VI—VII—i',
            palettePriorities: {
                preferred: ['major', 'minor'],
                allowed: ['dom7'],
                avoided: ['major7', 'minor7', 'diminished', 'augmented', 'quartal']
            },
        }
    ],
    'Trance/Psytrance/Goa': [
        {
            value: 'i—♭VII—i—♭VI',
            palettePriorities: {
                preferred: ['minor', 'major'],
                allowed: ['sus2', 'sus4', 'minor7'],
                avoided: ['major7', 'dom7', 'diminished', 'augmented']
            },
        },
        {
            value: 'i—♭II—♭VII—i',
            palettePriorities: {
                preferred: ['minor', 'major'],
                allowed: ['dom7', 'sus2', 'sus4'],
                avoided: ['major7', 'minor7', 'diminished', 'augmented']
            },
        },
        {
            value: 'i—V—♭VI—♭VII',
            palettePriorities: {
                preferred: ['minor', 'major'],
                allowed: ['minor7', 'major7', 'sus2', 'sus4'],
                avoided: ['diminished', 'augmented']
            },
        },
        {
            value: 'i—iv—VII—III',
            palettePriorities: {
                preferred: ['minor', 'major'],
                allowed: ['sus2', 'sus4', 'quartal'],
                avoided: ['major7', 'minor7', 'dom7', 'diminished', 'augmented']
            },
        },
        {
            value: 'i—♭VI—III—VII',
            palettePriorities: {
                preferred: ['minor', 'major'],
                allowed: ['minor7', 'quartal'],
                avoided: ['major7', 'dom7', 'diminished', 'augmented']
            },
        },
        {
            value: 'i—♭III—♭VI—V',
            palettePriorities: {
                preferred: ['minor', 'major'],
                allowed: ['minor7', 'quartal', 'sus2'],
                avoided: ['major7', 'dom7', 'diminished', 'augmented']
            },
        },
        {
            value: 'i—VII—VI—VII',
        },
        {
            value: 'i—♭II—VII—V',
        },
        {
            value: 'i—iv—i—VII',
        },
        {
            value: 'i—III—VII—IV',
        },
        {
            value: 'i—v—♭VII',
            paletteFilter: ['minor', 'minor7', 'major', 'dom7'],
        }
    ],
    'Jungle/Drum\'n\'Bass': [
        {
            value: 'i—♭VII—♭VI—V',
        },
        {
            value: 'i—♭III—♭VII—iv',
        },
        {
            value: 'i—v—♭VII—iv',
        },
        {
            value: 'ii7—V7—IM7—vi7',
        }
    ],
    'Italo-Disco/House': [
        {
            value: 'I—vi—IV—V',
        },
        {
            value: 'I—iii—vi—IV',
        },
        {
            value: 'I—IV—V—iii',
        },
        {
            value: 'vi—IV—I—V',
        },
        {
            value: 'I—V—vi—iii—IV—I',
        },
        {
            value: 'IM7—vi7—IVM7—V7',
        },
        {
            value: 'i—iv',
            paletteFilter: ['minor', 'minor7', 'major7'],
        }
    ],
    'Synthwave/Retrowave': [
        {
            value: 'i—♭VII—♭VI—V',
            palettePriorities: {
                preferred: ['major', 'minor'],
                allowed: ['major7', 'minor7', 'sus2', 'sus4'],
                avoided: ['diminished', 'augmented']
            },
        },
        {
            value: 'i—♭III—♭VII—♭VI',
            palettePriorities: {
                preferred: ['minor', 'major'],
                allowed: ['minor7', 'sus2', 'sus4'],
                avoided: ['major7', 'dom7', 'diminished', 'augmented']
            },
        },
        {
            value: 'I—V—vi—IV',
            palettePriorities: {
                preferred: ['major', 'minor'],
                allowed: ['major7', 'minor7', 'sus2', 'sus4'],
                avoided: ['diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'i—v—♭VI—♭VII',
            palettePriorities: {
                preferred: ['minor', 'major'],
                allowed: ['minor7', 'quartal', 'sus2'],
                avoided: ['major7', 'dom7', 'diminished', 'augmented']
            },
        },
        {
            value: 'I—♭VII—♭VI—I',
            palettePriorities: {
                preferred: ['major', 'major7'],
                allowed: ['minor', 'minor7', 'sus2', 'sus4'],
                avoided: ['dom7', 'diminished', 'augmented']
            },
        },
        {
            value: 'vi—IV—I—V',
            palettePriorities: {
                preferred: ['major', 'minor'],
                allowed: ['major7', 'minor7', 'sus2', 'sus4'],
                avoided: ['diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'i—♭VI—III—♭VII',
            palettePriorities: {
                preferred: ['minor', 'major'],
                allowed: ['minor7', 'quartal'],
                avoided: ['major7', 'dom7', 'diminished', 'augmented']
            },
        },
        {
            value: 'IM7—iii7—vi7—IVM7',
            paletteFilter: ['major7', 'minor7', 'dom7'],
        }
    ],
    'African Dance': [
        {
            value: 'I—IV—V—IV',
        },
        {
            value: 'I—IV—I—V',
        },
        {
            value: 'I—♭VII—IV—I',
        },
        {
            value: 'I—IV—♭VII—I',
        }
    ],
    'UK Bass': [
        {
            value: 'i—VII—♭VI',
            palettePriorities: {
                preferred: ['minor', 'minor7'],
                allowed: ['major', 'dom7'],
                avoided: ['major7', 'quartal', 'augmented', 'diminished']
            },
        },
        {
            value: 'i—♭VI',
            palettePriorities: {
                preferred: ['minor', 'diminished', 'dom7'],
                allowed: ['minor7'],
                avoided: ['major', 'major7', 'augmented', 'quartal']
            },
        },
        {
            value: 'i—♭VII—i',
            palettePriorities: {
                preferred: ['minor', 'dom7', 'major'],
                allowed: ['minor7'],
                avoided: ['major7', 'quartal', 'augmented', 'diminished']
            },
        }
    ],
    'Reggae/Dub': [
        {
            value: 'I—IV—I—V',
            palettePriorities: {
                preferred: ['major', 'dom7'],
                allowed: ['minor'],
                avoided: ['major7', 'minor7', 'quartal', 'augmented', 'diminished']
            },
        },
        {
            value: 'I—V—IV',
            palettePriorities: {
                preferred: ['major', 'dom7'],
                allowed: ['sus2', 'sus4'],
                avoided: ['minor', 'major7', 'minor7', 'quartal', 'augmented', 'diminished']
            },
        },
        {
            value: 'i—♭VII—♭VI',
            palettePriorities: {
                preferred: ['minor', 'major', 'dom7'],
                allowed: ['sus2', 'sus4'],
                avoided: ['major7', 'minor7', 'quartal', 'augmented', 'diminished']
            },
        },
        {
            value: 'I—IV',
            palettePriorities: {
                preferred: ['major', 'dom7'],
                allowed: ['sus2', 'sus4'],
                avoided: ['major7', 'minor7', 'diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'i—♭VI—♭VII—i',
            palettePriorities: {
                preferred: ['minor', 'major'],
                allowed: ['dom7', 'sus4'],
                avoided: ['major7', 'minor7', 'diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'I—vi—IV—V',
            palettePriorities: {
                preferred: ['major', 'minor'],
                allowed: ['dom7'],
                avoided: ['major7', 'minor7', 'diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'i—iv—i—V',
            palettePriorities: {
                preferred: ['minor', 'dom7'],
                allowed: ['major'],
                avoided: ['major7', 'minor7', 'diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'I—V—vi—IV',
            palettePriorities: {
                preferred: ['major', 'minor'],
                allowed: ['dom7', 'sus4'],
                avoided: ['major7', 'minor7', 'diminished', 'augmented', 'quartal']
            },
        }
    ],
    'Acid/EBM': [
        {
            value: 'i—iv—♭VII—i',
            palettePriorities: {
                preferred: ['minor', 'diminished', 'dom7'],  // Dark, aggressive core
                allowed: ['minor7'],                          // Additional tension
                avoided: ['major', 'major7', 'augmented']    // Too bright/unstable
            },
        },
        {
            value: 'i—♭VII—iv',
            palettePriorities: {
                preferred: ['minor7', 'quartal', 'dom7'],  // TB-303 squelch character
                allowed: ['minor'],                         // Basic minor OK
                avoided: ['major', 'major7', 'diminished', 'augmented']
            },
        },
        {
            value: 'i—♭VI—♭VII',
            palettePriorities: {
                preferred: ['minor', 'diminished', 'dom7'],  // Maximum menace
                allowed: [],                                  // Nothing else needed
                avoided: ['major', 'major7', 'minor7', 'quartal', 'augmented']
            },
        }
    ]
};

// ============================================================================
// Core Music Theory Functions
// ============================================================================

export function getKeyOffset(key) {
    const keyMap = {
        'C': 0, 'C♯/D♭': 1, 'D': 2, 'D♯/E♭': 3, 'E': 4, 'F': 5,
        'F♯/G♭': 6, 'G': 7, 'G♯/A♭': 8, 'A': 9, 'A♯/B♭': 10, 'B': 11
    };
    return keyMap[key] || 0;
}

export function getScaleDegrees(mode) {
    const scales = {
        'Major': [0, 2, 4, 5, 7, 9, 11],
        'Minor': [0, 2, 3, 5, 7, 8, 10],
        'Dorian': [0, 2, 3, 5, 7, 9, 10],
        'Phrygian': [0, 1, 3, 5, 7, 8, 10],
        'Lydian': [0, 2, 4, 6, 7, 9, 11],
        'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
        'Locrian': [0, 1, 3, 5, 6, 8, 10],
        'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11],
        'Melodic Minor': [0, 2, 3, 5, 7, 9, 11],
        'Pentatonic Major': [0, 2, 4, 7, 9],
        'Pentatonic Minor': [0, 3, 5, 7, 10],
        'Blues': [0, 3, 5, 6, 7, 10],
        // Symmetrical/Jazz scales
        'Whole Tone': [0, 2, 4, 6, 8, 10],  // 6 notes, all whole steps
        'Diminished (W-H)': [0, 2, 3, 5, 6, 8, 9, 11],  // Whole-Half octatonic
        'Diminished (H-W)': [0, 1, 3, 4, 6, 7, 9, 10],  // Half-Whole octatonic
        'Augmented': [0, 3, 4, 7, 8, 11],  // Hexatonic scale
        // Arabic Maqamat (12-TET approximations)
        'Maqam Hijaz': [0, 1, 4, 5, 7, 8, 11],  // Like Phrygian Dominant
        'Maqam Bayati': [0, 1.5, 3, 5, 7, 8, 10],  // Quarter tone approximated to [0, 2, 3, 5, 7, 8, 10]
        'Maqam Rast': [0, 2, 3.5, 5, 7, 9, 10.5],  // Quarter tone approximated to [0, 2, 4, 5, 7, 9, 11]
        'Maqam Saba': [0, 1.5, 3, 4, 6, 8, 10],  // Quarter tone approximated to [0, 1, 3, 4, 6, 8, 10]
        'Maqam Kurd': [0, 1, 3, 5, 7, 8, 10],  // Like Phrygian
        // Indian Ragas (12-TET approximations)
        'Bhairav': [0, 1, 4, 5, 7, 8, 11],  // Double Harmonic
        'Kafi': [0, 2, 3, 5, 7, 9, 10],  // Like Dorian
        'Yaman': [0, 2, 4, 6, 7, 9, 11],  // Like Lydian
        'Bhairavi': [0, 1, 3, 5, 7, 8, 10],  // Like Phrygian
        'Todi': [0, 1, 3, 6, 7, 8, 11],  // Unique raga scale
        // Exotic scales
        'Double Harmonic': [0, 1, 4, 5, 7, 8, 11],
        'Hungarian Minor': [0, 2, 3, 6, 7, 8, 11],
        'Neapolitan Major': [0, 1, 3, 5, 7, 9, 11],
        'Neapolitan Minor': [0, 1, 3, 5, 7, 8, 11],
        'Enigmatic': [0, 1, 4, 6, 8, 10, 11],
        'Phrygian Dominant': [0, 1, 4, 5, 7, 8, 10],
        'Persian': [0, 1, 4, 5, 6, 8, 11],
        'Hirajoshi': [0, 2, 3, 7, 8],
        'Insen': [0, 1, 5, 7, 10],
        'Kumoi': [0, 2, 3, 7, 9],
        'Egyptian Pentatonic': [0, 2, 5, 7, 10],
        // Melodic Minor Modes
        'Altered': [0, 1, 3, 4, 6, 8, 10],  // 7th mode of melodic minor (Super Locrian)
        'Lydian Dominant': [0, 2, 4, 6, 7, 9, 10],  // 4th mode of melodic minor (Lydian b7)
        'Locrian #2': [0, 2, 3, 5, 6, 8, 10],  // 6th mode of melodic minor
        // Bebop Scales (8 notes)
        'Bebop Major': [0, 2, 4, 5, 7, 8, 9, 11],  // Major with added b6
        'Bebop Dominant': [0, 2, 4, 5, 7, 9, 10, 11],  // Mixolydian with added natural 7
        'Bebop Minor': [0, 2, 3, 4, 5, 7, 9, 10]  // Dorian with added major 3
    };

    // Handle quarter tone approximations
    const scale = scales[mode] || scales['Major'];
    return scale.map(note => Math.round(note));  // Round any quarter tones to nearest semitone
}

// Get chord quality for a scale degree in a given mode
export function getChordQualityForMode(degree, mode) {
    // Define triads for each mode (0-indexed scale degrees)
    const modeChordQualities = {
        'Major': {
            0: 'major',   // I
            1: 'minor',   // ii
            2: 'minor',   // iii
            3: 'major',   // IV
            4: 'major',   // V
            5: 'minor',   // vi
            6: 'diminished'  // vii°
        },
        'Minor': {
            0: 'minor',   // i
            1: 'diminished',  // ii°
            2: 'major',   // III
            3: 'minor',   // iv
            4: 'minor',   // v
            5: 'major',   // VI
            6: 'major'    // VII
        },
        'Dorian': {
            0: 'minor',   // i
            1: 'minor',   // ii
            2: 'major',   // III
            3: 'major',   // IV
            4: 'minor',   // v
            5: 'diminished',  // vi°
            6: 'major'    // VII
        },
        'Phrygian': {
            0: 'minor',   // i
            1: 'major',   // II
            2: 'major',   // III
            3: 'minor',   // iv
            4: 'diminished',  // v°
            5: 'major',   // VI
            6: 'minor'    // vii
        },
        'Lydian': {
            0: 'major',   // I
            1: 'major',   // II
            2: 'minor',   // iii
            3: 'diminished',  // #iv°
            4: 'major',   // V
            5: 'minor',   // vi
            6: 'minor'    // vii
        },
        'Mixolydian': {
            0: 'major',   // I
            1: 'minor',   // ii
            2: 'diminished',  // iii°
            3: 'major',   // IV
            4: 'minor',   // v
            5: 'minor',   // vi
            6: 'major'    // VII
        },
        'Locrian': {
            0: 'diminished',  // i°
            1: 'major',   // II
            2: 'minor',   // iii
            3: 'minor',   // iv
            4: 'major',   // V
            5: 'major',   // VI
            6: 'minor'    // vii
        },
        'Harmonic Minor': {
            0: 'minor',   // i
            1: 'diminished',  // ii°
            2: 'augmented',   // III+ (augmented triad)
            3: 'minor',   // iv
            4: 'major',   // V
            5: 'major',   // VI
            6: 'diminished'  // vii°
        },
        'Melodic Minor': {
            0: 'minor',   // i
            1: 'minor',   // ii
            2: 'augmented',   // III+ (augmented triad)
            3: 'major',   // IV
            4: 'major',   // V
            5: 'diminished',  // vi°
            6: 'diminished'  // vii°
        },
        'Pentatonic Major': {
            0: 'major',   // I
            1: 'minor',   // ii
            2: 'minor',   // iii
            3: 'major',   // V
            4: 'minor'    // vi
        },
        'Pentatonic Minor': {
            0: 'minor',   // i
            1: 'major',   // III
            2: 'minor',   // iv
            3: 'minor',   // v
            4: 'major'    // VII
        },
        'Blues': {
            0: 'minor',   // i
            1: 'major',   // III
            2: 'minor',   // iv
            3: 'major',   // IV (with blue note)
            4: 'minor',   // v
            5: 'major'    // VII
        },
        'Double Harmonic': {
            0: 'major',   // I
            1: 'major',   // II (with b2)
            2: 'major',   // III
            3: 'minor',   // iv
            4: 'major',   // V
            5: 'major',   // VI (with b6)
            6: 'diminished'  // vii°
        },
        'Hungarian Minor': {
            0: 'minor',   // i
            1: 'diminished',  // ii°
            2: 'major',   // III+
            3: 'minor',   // #iv
            4: 'major',   // V
            5: 'major',   // VI
            6: 'diminished'  // vii°
        },
        'Neapolitan Major': {
            0: 'major',   // I
            1: 'major',   // II (with b2)
            2: 'minor',   // iii
            3: 'major',   // IV
            4: 'major',   // V
            5: 'minor',   // vi
            6: 'diminished'  // vii°
        },
        'Neapolitan Minor': {
            0: 'minor',   // i
            1: 'major',   // II (with b2)
            2: 'minor',   // iii
            3: 'minor',   // iv
            4: 'major',   // V
            5: 'major',   // VI
            6: 'diminished'  // vii°
        },
        'Enigmatic': {
            0: 'major',   // I
            1: 'major',   // II (with b2)
            2: 'major',   // III
            3: 'major',   // #IV
            4: 'major',   // #V
            5: 'major',   // #VI
            6: 'diminished'  // vii°
        },
        'Phrygian Dominant': {
            0: 'major',   // I
            1: 'major',   // II (with b2)
            2: 'diminished',  // iii°
            3: 'minor',   // iv
            4: 'minor',   // v
            5: 'major',   // VI (with b6)
            6: 'minor'    // vii
        },
        'Persian': {
            0: 'major',   // I
            1: 'major',   // II (with b2)
            2: 'major',   // III
            3: 'minor',   // iv
            4: 'diminished',  // v° (with b5)
            5: 'major',   // VI (with b6)
            6: 'diminished'  // vii°
        },
        'Hirajoshi': {
            0: 'minor',   // i
            1: 'major',   // II
            2: 'minor',   // iii (with b3)
            3: 'major',   // V
            4: 'major'    // VI (with b6)
        },
        'Insen': {
            0: 'minor',   // i
            1: 'major',   // II (with b2)
            2: 'minor',   // iv
            3: 'minor',   // v
            4: 'major'    // VII (with b7)
        },
        'Kumoi': {
            0: 'minor',   // i
            1: 'major',   // II
            2: 'minor',   // iii (with b3)
            3: 'major',   // V
            4: 'minor'    // vi
        },
        'Egyptian Pentatonic': {
            0: 'minor',   // i
            1: 'major',   // II
            2: 'minor',   // iv
            3: 'minor',   // v
            4: 'major'    // VII (with b7)
        },
        // Symmetrical/Jazz scales
        'Whole Tone': {
            0: 'major',   // I (augmented context)
            1: 'major',   // II
            2: 'major',   // III
            3: 'major',   // #IV
            4: 'major',   // #V
            5: 'major'    // #VI
        },
        'Diminished (W-H)': {
            0: 'diminished',  // i°
            1: 'minor',   // ii
            2: 'diminished',  // iii°
            3: 'major',   // IV
            4: 'diminished',  // v°
            5: 'minor',   // vi
            6: 'diminished',  // vii°
            7: 'major'    // I (octave)
        },
        'Diminished (H-W)': {
            0: 'minor',   // i
            1: 'diminished',  // ii°
            2: 'minor',   // iii
            3: 'diminished',  // iv°
            4: 'minor',   // v
            5: 'diminished',  // vi°
            6: 'minor',   // vii
            7: 'diminished'  // i° (octave)
        },
        'Augmented': {
            0: 'major',   // I (augmented context)
            1: 'minor',   // iii
            2: 'major',   // III
            3: 'major',   // V
            4: 'major',   // VI
            5: 'major'    // VII
        },
        // Arabic Maqamat
        'Maqam Hijaz': {
            0: 'major',   // I
            1: 'major',   // II (with b2)
            2: 'diminished',  // iii°
            3: 'minor',   // iv
            4: 'minor',   // v
            5: 'major',   // VI (with b6)
            6: 'minor'    // vii
        },
        'Maqam Bayati': {
            0: 'minor',   // i
            1: 'major',   // II
            2: 'minor',   // iii
            3: 'minor',   // iv
            4: 'minor',   // v
            5: 'major',   // VI
            6: 'major'    // VII
        },
        'Maqam Rast': {
            0: 'major',   // I
            1: 'major',   // II
            2: 'major',   // III
            3: 'major',   // IV
            4: 'major',   // V
            5: 'minor',   // vi
            6: 'major'    // VII
        },
        'Maqam Saba': {
            0: 'minor',   // i
            1: 'major',   // II (with b2)
            2: 'minor',   // iii
            3: 'diminished',  // iv°
            4: 'major',   // V (with b5)
            5: 'major',   // VI (with b6)
            6: 'major'    // VII
        },
        'Maqam Kurd': {
            0: 'minor',   // i
            1: 'major',   // II
            2: 'major',   // III
            3: 'minor',   // iv
            4: 'diminished',  // v°
            5: 'major',   // VI
            6: 'minor'    // vii
        },
        // Indian Ragas
        'Bhairav': {
            0: 'major',   // I
            1: 'major',   // II (with b2)
            2: 'major',   // III
            3: 'minor',   // iv
            4: 'major',   // V
            5: 'major',   // VI (with b6)
            6: 'diminished'  // vii°
        },
        'Kafi': {
            0: 'minor',   // i
            1: 'minor',   // ii
            2: 'major',   // III
            3: 'major',   // IV
            4: 'minor',   // v
            5: 'diminished',  // vi°
            6: 'major'    // VII
        },
        'Yaman': {
            0: 'major',   // I
            1: 'major',   // II
            2: 'minor',   // iii
            3: 'diminished',  // #iv°
            4: 'major',   // V
            5: 'minor',   // vi
            6: 'minor'    // vii
        },
        'Bhairavi': {
            0: 'minor',   // i
            1: 'major',   // II
            2: 'major',   // III
            3: 'minor',   // iv
            4: 'diminished',  // v°
            5: 'major',   // VI
            6: 'minor'    // vii
        },
        'Todi': {
            0: 'minor',   // i
            1: 'major',   // II (with b2)
            2: 'minor',   // iii
            3: 'diminished',  // #iv°
            4: 'major',   // V
            5: 'major',   // VI (with b6)
            6: 'diminished'  // vii°
        },
        // Melodic Minor Modes
        'Altered': {
            0: 'diminished',  // i° (altered tonic)
            1: 'minor',   // ii
            2: 'minor',   // iii
            3: 'minor',   // iv
            4: 'major',   // V (with b5)
            5: 'major',   // VI
            6: 'minor'    // vii
        },
        'Lydian Dominant': {
            0: 'major',   // I (dom7 context)
            1: 'major',   // II
            2: 'minor',   // iii
            3: 'diminished',  // #iv°
            4: 'major',   // V
            5: 'minor',   // vi
            6: 'minor'    // vii
        },
        'Locrian #2': {
            0: 'diminished',  // i° (m7b5 context)
            1: 'minor',   // ii
            2: 'minor',   // iii
            3: 'minor',   // iv
            4: 'major',   // V (with b5)
            5: 'major',   // VI
            6: 'minor'    // vii
        },
        // Bebop scales (8 notes - use first 7 for chord qualities)
        'Bebop Major': {
            0: 'major',   // I
            1: 'minor',   // ii
            2: 'minor',   // iii
            3: 'major',   // IV
            4: 'major',   // V
            5: 'diminished',  // vi° (passing)
            6: 'minor',   // vi
            7: 'diminished'  // vii°
        },
        'Bebop Dominant': {
            0: 'major',   // I (dom7 context)
            1: 'minor',   // ii
            2: 'minor',   // iii
            3: 'major',   // IV
            4: 'minor',   // v
            5: 'minor',   // vi
            6: 'diminished',  // vii°
            7: 'major'    // VII (passing)
        },
        'Bebop Minor': {
            0: 'minor',   // i
            1: 'minor',   // ii
            2: 'diminished',  // iii° (passing)
            3: 'major',   // III
            4: 'major',   // IV
            5: 'minor',   // v
            6: 'minor',   // vi
            7: 'major'    // VII
        }
    };

    const qualities = modeChordQualities[mode] || modeChordQualities['Major'];

    // For pentatonic and other scales with fewer than 7 degrees, use modulo of actual scale length
    const scaleLength = getScaleDegrees(mode).length;
    return qualities[degree % scaleLength] || 'major';
}

// ============================================================================
// Chord Building Functions
// ============================================================================

export function buildChordRaw(baseNote, chordType) {
    // Helper function that just returns MIDI notes without context
    switch (chordType) {
        // Triads
        case 'major':
            return [baseNote, baseNote + 4, baseNote + 7];
        case 'minor':
            return [baseNote, baseNote + 3, baseNote + 7];
        case 'diminished':
            return [baseNote, baseNote + 3, baseNote + 6];
        case 'augmented':
            return [baseNote, baseNote + 4, baseNote + 8];
        case 'sus2':
            return [baseNote, baseNote + 2, baseNote + 7];
        case 'sus4':
            return [baseNote, baseNote + 5, baseNote + 7];

        // Seventh chords
        case 'major7':
            return [baseNote, baseNote + 4, baseNote + 7, baseNote + 11];
        case 'minor7':
            return [baseNote, baseNote + 3, baseNote + 7, baseNote + 10];
        case 'dom7':
            return [baseNote, baseNote + 4, baseNote + 7, baseNote + 10];
        case 'dim7':
            return [baseNote, baseNote + 3, baseNote + 6, baseNote + 9];
        case 'm7b5': // Half-diminished
            return [baseNote, baseNote + 3, baseNote + 6, baseNote + 10];
        case 'minMaj7': // Minor-major 7th
            return [baseNote, baseNote + 3, baseNote + 7, baseNote + 11];
        case 'aug7': // Augmented 7th
            return [baseNote, baseNote + 4, baseNote + 8, baseNote + 10];
        case 'augMaj7': // Augmented major 7th
            return [baseNote, baseNote + 4, baseNote + 8, baseNote + 11];

        // Extended chords (9th, 11th, 13th)
        case 'major9':
            return [baseNote, baseNote + 4, baseNote + 7, baseNote + 11, baseNote + 14];
        case 'minor9':
            return [baseNote, baseNote + 3, baseNote + 7, baseNote + 10, baseNote + 14];
        case 'dom9':
            return [baseNote, baseNote + 4, baseNote + 7, baseNote + 10, baseNote + 14];
        case 'dom7b9': // Altered dominant
            return [baseNote, baseNote + 4, baseNote + 7, baseNote + 10, baseNote + 13];
        case 'dom7sharp9': // Hendrix chord
            return [baseNote, baseNote + 4, baseNote + 7, baseNote + 10, baseNote + 15];
        case 'major11':
            return [baseNote, baseNote + 4, baseNote + 7, baseNote + 11, baseNote + 14, baseNote + 17];
        case 'minor11':
            return [baseNote, baseNote + 3, baseNote + 7, baseNote + 10, baseNote + 14, baseNote + 17];
        case 'dom11':
            return [baseNote, baseNote + 4, baseNote + 7, baseNote + 10, baseNote + 14, baseNote + 17];
        case 'major13':
            return [baseNote, baseNote + 4, baseNote + 7, baseNote + 11, baseNote + 14, baseNote + 21];
        case 'minor13':
            return [baseNote, baseNote + 3, baseNote + 7, baseNote + 10, baseNote + 14, baseNote + 21];
        case 'dom13':
            return [baseNote, baseNote + 4, baseNote + 7, baseNote + 10, baseNote + 14, baseNote + 21];

        // Altered dominants
        case 'dom7alt': // 7#9#5 - fully altered
            return [baseNote, baseNote + 4, baseNote + 8, baseNote + 10, baseNote + 15];
        case 'dom7b5': // Tritone substitution ready
            return [baseNote, baseNote + 4, baseNote + 6, baseNote + 10];

        // Quartal/Modern voicings
        case 'quartal':
            return [baseNote, baseNote + 5, baseNote + 10];
        case 'quartal4':
            return [baseNote, baseNote + 5, baseNote + 10, baseNote + 15];

        // Add9/Add11 (no 7th)
        case 'add9':
            return [baseNote, baseNote + 4, baseNote + 7, baseNote + 14];
        case 'minAdd9':
            return [baseNote, baseNote + 3, baseNote + 7, baseNote + 14];
        case 'add11':
            return [baseNote, baseNote + 4, baseNote + 7, baseNote + 17];

        // 6th chords
        case 'major6':
            return [baseNote, baseNote + 4, baseNote + 7, baseNote + 9];
        case 'minor6':
            return [baseNote, baseNote + 3, baseNote + 7, baseNote + 9];
        case 'maj6/9':
            return [baseNote, baseNote + 4, baseNote + 7, baseNote + 9, baseNote + 14];

        // Shell voicings (jazz comping - root, 3rd, 7th only)
        case 'shell7':  // Major 7 shell
            return [baseNote, baseNote + 4, baseNote + 11];
        case 'shellm7':  // Minor 7 shell
            return [baseNote, baseNote + 3, baseNote + 10];
        case 'shelldom7':  // Dominant 7 shell
            return [baseNote, baseNote + 4, baseNote + 10];

        // Rootless voicings (jazz piano - 3rd, 7th, 9th or 7th, 3rd, 13th)
        case 'rootless7A':  // Type A: 3-5-7-9
            return [baseNote + 4, baseNote + 7, baseNote + 11, baseNote + 14];
        case 'rootlessm7A':  // Minor Type A: 3-5-7-9
            return [baseNote + 3, baseNote + 7, baseNote + 10, baseNote + 14];
        case 'rootlessdom7A':  // Dom7 Type A: 3-5-7-9
            return [baseNote + 4, baseNote + 7, baseNote + 10, baseNote + 14];
        case 'rootless7B':  // Type B: 7-9-3-5
            return [baseNote + 11, baseNote + 14, baseNote + 16, baseNote + 19];
        case 'rootlessm7B':  // Minor Type B: 7-9-3-5
            return [baseNote + 10, baseNote + 14, baseNote + 15, baseNote + 19];
        case 'rootlessdom7B':  // Dom7 Type B: 7-9-3-5
            return [baseNote + 10, baseNote + 14, baseNote + 16, baseNote + 19];

        // Augmented 6th chords (resolve to V)
        case 'It6':  // Italian 6th: ♭6, 1, ♯4 (♭6 in bass)
            return [baseNote, baseNote + 4, baseNote + 10];
        case 'Fr6':  // French 6th: ♭6, 1, 2, ♯4 (♭6 in bass)
            return [baseNote, baseNote + 4, baseNote + 6, baseNote + 10];
        case 'Ger6':  // German 6th: ♭6, 1, ♭3, ♯4 (♭6 in bass)
            return [baseNote, baseNote + 4, baseNote + 7, baseNote + 10];

        default:
            return [baseNote, baseNote + 4, baseNote + 7];
    }
}

export function buildChord(root, chordType, keyOffset) {
    const baseNote = 60 + keyOffset + root;
    // Delegate to buildChordRaw for consistency
    return buildChordRaw(baseNote, chordType);
}

// ============================================================================
// Voice Leading Optimization
// ============================================================================

/**
 * Hungarian Algorithm for optimal voice leading assignment
 * Finds the minimum cost assignment between voices of two chords
 * Time complexity: O(n³) where n = number of voices
 */
function hungarianAlgorithm(costMatrix) {
    const n = costMatrix.length;
    if (n === 0) return { cost: 0, assignment: [] };

    // Create working copy with row/column reduction
    const matrix = costMatrix.map(row => [...row]);

    // Step 1: Row reduction - subtract minimum from each row
    for (let i = 0; i < n; i++) {
        const rowMin = Math.min(...matrix[i]);
        for (let j = 0; j < n; j++) {
            matrix[i][j] -= rowMin;
        }
    }

    // Step 2: Column reduction - subtract minimum from each column
    for (let j = 0; j < n; j++) {
        let colMin = Infinity;
        for (let i = 0; i < n; i++) {
            colMin = Math.min(colMin, matrix[i][j]);
        }
        for (let i = 0; i < n; i++) {
            matrix[i][j] -= colMin;
        }
    }

    // Step 3: Find optimal assignment using augmenting paths
    const rowAssignment = new Array(n).fill(-1);
    const colAssignment = new Array(n).fill(-1);

    // Try to find initial assignment with zeros
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (matrix[i][j] === 0 && colAssignment[j] === -1) {
                rowAssignment[i] = j;
                colAssignment[j] = i;
                break;
            }
        }
    }

    // Augment assignment until optimal
    for (let iter = 0; iter < n * n; iter++) {
        // Find unassigned row
        let unassignedRow = -1;
        for (let i = 0; i < n; i++) {
            if (rowAssignment[i] === -1) {
                unassignedRow = i;
                break;
            }
        }

        if (unassignedRow === -1) break; // All rows assigned

        // BFS to find augmenting path
        const rowVisited = new Array(n).fill(false);
        const colVisited = new Array(n).fill(false);
        const parent = new Array(n).fill(-1);
        const queue = [unassignedRow];
        rowVisited[unassignedRow] = true;
        let foundAugmentingPath = false;
        let endCol = -1;

        while (queue.length > 0 && !foundAugmentingPath) {
            const row = queue.shift();

            for (let col = 0; col < n; col++) {
                if (!colVisited[col] && matrix[row][col] === 0) {
                    colVisited[col] = true;
                    parent[col] = row;

                    if (colAssignment[col] === -1) {
                        // Found augmenting path
                        foundAugmentingPath = true;
                        endCol = col;
                        break;
                    } else {
                        // Continue BFS
                        const nextRow = colAssignment[col];
                        if (!rowVisited[nextRow]) {
                            rowVisited[nextRow] = true;
                            queue.push(nextRow);
                        }
                    }
                }
            }
        }

        if (foundAugmentingPath) {
            // Augment along the path
            let col = endCol;
            while (col !== -1) {
                const row = parent[col];
                const prevCol = rowAssignment[row];
                rowAssignment[row] = col;
                colAssignment[col] = row;
                col = prevCol;
            }
        } else {
            // No augmenting path found, need to modify matrix
            // Find minimum uncovered element
            let minUncovered = Infinity;
            for (let i = 0; i < n; i++) {
                if (rowVisited[i]) {
                    for (let j = 0; j < n; j++) {
                        if (!colVisited[j]) {
                            minUncovered = Math.min(minUncovered, matrix[i][j]);
                        }
                    }
                }
            }

            if (minUncovered === Infinity) break;

            // Subtract from uncovered, add to double-covered
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    if (rowVisited[i] && !colVisited[j]) {
                        matrix[i][j] -= minUncovered;
                    } else if (!rowVisited[i] && colVisited[j]) {
                        matrix[i][j] += minUncovered;
                    }
                }
            }
        }
    }

    // Calculate total cost from original matrix
    let totalCost = 0;
    const assignment = [];
    for (let i = 0; i < n; i++) {
        const j = rowAssignment[i];
        if (j !== -1) {
            totalCost += costMatrix[i][j];
            assignment.push({ from: i, to: j, cost: costMatrix[i][j] });
        }
    }

    return { cost: totalCost, assignment };
}

// Calculate the total voice leading distance between two chords using Hungarian algorithm
export function calculateVoiceLeadingDistance(chord1Notes, chord2Notes) {
    // For chords with different numbers of notes, pad the shorter one
    const maxLength = Math.max(chord1Notes.length, chord2Notes.length);
    const notes1 = [...chord1Notes];
    const notes2 = [...chord2Notes];

    while (notes1.length < maxLength) notes1.push(notes1[notes1.length - 1] + 12);
    while (notes2.length < maxLength) notes2.push(notes2[notes2.length - 1] + 12);

    // Build cost matrix for Hungarian algorithm
    const costMatrix = [];
    for (let i = 0; i < maxLength; i++) {
        const row = [];
        for (let j = 0; j < maxLength; j++) {
            row.push(Math.abs(notes1[i] - notes2[j]));
        }
        costMatrix.push(row);
    }

    // Use Hungarian algorithm for optimal assignment
    const result = hungarianAlgorithm(costMatrix);
    return result.cost;
}

// Get detailed voice leading analysis using Hungarian algorithm
export function getOptimalVoiceAssignment(chord1Notes, chord2Notes) {
    const maxLength = Math.max(chord1Notes.length, chord2Notes.length);
    const notes1 = [...chord1Notes];
    const notes2 = [...chord2Notes];

    while (notes1.length < maxLength) notes1.push(notes1[notes1.length - 1] + 12);
    while (notes2.length < maxLength) notes2.push(notes2[notes2.length - 1] + 12);

    const costMatrix = [];
    for (let i = 0; i < maxLength; i++) {
        const row = [];
        for (let j = 0; j < maxLength; j++) {
            row.push(Math.abs(notes1[i] - notes2[j]));
        }
        costMatrix.push(row);
    }

    const result = hungarianAlgorithm(costMatrix);

    // Map back to actual notes
    return {
        totalDistance: result.cost,
        voiceMovements: result.assignment.map(a => ({
            fromNote: notes1[a.from],
            toNote: notes2[a.to],
            semitones: a.cost,
            direction: notes2[a.to] > notes1[a.from] ? 'up' :
                       notes2[a.to] < notes1[a.from] ? 'down' : 'static'
        }))
    };
}

// Generate all reasonable inversions of a chord within a comfortable range
export function generateInversions(chordNotes) {
    const inversions = [];
    const baseChord = [...chordNotes];

    // Root position
    inversions.push([...baseChord]);

    // First inversion (move root up an octave)
    if (baseChord.length >= 2) {
        const firstInv = [...baseChord];
        firstInv[0] += 12;
        inversions.push(firstInv.sort((a, b) => a - b));
    }

    // Second inversion (move root and third up an octave)
    if (baseChord.length >= 3) {
        const secondInv = [...baseChord];
        secondInv[0] += 12;
        secondInv[1] += 12;
        inversions.push(secondInv.sort((a, b) => a - b));
    }

    // Drop voicings (move top note down an octave)
    if (baseChord.length >= 3) {
        const drop2 = [...baseChord];
        drop2[drop2.length - 1] -= 12;
        inversions.push(drop2.sort((a, b) => a - b));
    }

    return inversions;
}

// Find the best inversion for smooth voice leading
export function findBestVoicing(targetChordNotes, previousChordNotes) {
    if (!previousChordNotes) {
        return targetChordNotes; // First chord, use root position
    }

    const inversions = generateInversions(targetChordNotes);
    let bestInversion = targetChordNotes;
    let minDistance = Infinity;

    inversions.forEach(inversion => {
        const distance = calculateVoiceLeadingDistance(previousChordNotes, inversion);
        if (distance < minDistance) {
            minDistance = distance;
            bestInversion = inversion;
        }
    });

    return bestInversion;
}

// Optimize voice leading for an entire progression
export function optimizeVoiceLeading(chordProgression) {
    if (chordProgression.length === 0) return chordProgression;

    const optimized = [];
    let previousNotes = null;

    chordProgression.forEach((chord, index) => {
        const optimizedNotes = findBestVoicing(chord.notes, previousNotes);

        optimized.push({
            ...chord,
            notes: optimizedNotes
        });

        previousNotes = optimizedNotes;
    });

    return optimized;
}

// Helper: Build a voicing from a given bass note and pitch classes
function buildVoicingFromBass(bassNote, uniquePCs) {
    const voicing = [bassNote];
    let currentNote = bassNote;

    for (let i = 1; i < uniquePCs.length; i++) {
        const targetPC = uniquePCs[i];
        // Find next occurrence of this pitch class
        let nextNote = currentNote + 1;
        while ((nextNote % 12) !== targetPC && nextNote < bassNote + 24) {
            nextNote++;
        }
        if (nextNote < bassNote + 24) { // Keep within 2 octaves
            voicing.push(nextNote);
            currentNote = nextNote;
        }
    }

    return voicing;
}

// Generate more comprehensive voicings for smooth voice leading
function generateSmoothVoicings(chordNotes) {
    const voicings = [];
    const sorted = [...chordNotes].sort((a, b) => a - b);
    const pitchClasses = sorted.map(n => n % 12);
    const uniquePCs = [...new Set(pitchClasses)];

    // Try different bass notes within a reasonable range (C3 to C5)
    for (let bassNote = 48; bassNote <= 72; bassNote++) {
        if (uniquePCs.includes(bassNote % 12)) {
            const voicing = buildVoicingFromBass(bassNote, uniquePCs);
            if (voicing.length === uniquePCs.length) {
                voicings.push(voicing);
            }
        }
    }

    return voicings;
}

// Analyze voice leading quality with comprehensive scoring
function scoreVoiceLeading(currentNotes, previousNotes) {
    if (!previousNotes || previousNotes.length === 0) {
        // First chord - score based on range comfort
        const lowest = Math.min(...currentNotes);
        const highest = Math.max(...currentNotes);
        const rangePenalty = (lowest < 48 || highest > 84) ? 20 : 0; // Prefer C3-C6 range
        return { score: rangePenalty, breakdown: { range: rangePenalty } };
    }

    let score = 0;
    const breakdown = {};

    // Pad arrays to same length
    const maxLen = Math.max(currentNotes.length, previousNotes.length);
    const curr = [...currentNotes].sort((a, b) => a - b);
    const prev = [...previousNotes].sort((a, b) => a - b);

    while (curr.length < maxLen) curr.push(curr.at(-1) + 12);
    while (prev.length < maxLen) prev.push(prev.at(-1) + 12);

    // Match voices using greedy algorithm (simpler than Hungarian)
    const movements = [];
    const used = new Set();

    prev.forEach(prevNote => {
        let minDist = Infinity;
        let bestIdx = -1;

        curr.forEach((currNote, idx) => {
            if (!used.has(idx)) {
                const dist = Math.abs(currNote - prevNote);
                if (dist < minDist) {
                    minDist = dist;
                    bestIdx = idx;
                }
            }
        });

        if (bestIdx >= 0) {
            movements.push({ from: prevNote, to: curr[bestIdx], distance: minDist });
            used.add(bestIdx);
        }
    });

    // 1. Total voice movement (weight: 1.0) - primary criterion
    const totalMovement = movements.reduce((sum, m) => sum + m.distance, 0);
    score += totalMovement;
    breakdown.totalMovement = totalMovement;

    // 2. Common tones bonus (weight: -5 per common tone)
    const commonTones = movements.filter(m => m.distance === 0).length;
    const commonToneBonus = commonTones * -5;
    score += commonToneBonus;
    breakdown.commonTones = commonToneBonus;

    // 3. Step-wise motion bonus (weight: -2 per step)
    const stepwiseMotions = movements.filter(m => m.distance > 0 && m.distance <= 2).length;
    const stepwiseBonus = stepwiseMotions * -2;
    score += stepwiseBonus;
    breakdown.stepwise = stepwiseBonus;

    // 4. Contrary motion bonus (weight: -3 per instance)
    let contraryMotionCount = 0;
    for (let i = 0; i < movements.length; i++) {
        for (let j = i + 1; j < movements.length; j++) {
            const dir1 = Math.sign(movements[i].to - movements[i].from);
            const dir2 = Math.sign(movements[j].to - movements[j].from);
            if (dir1 !== 0 && dir2 !== 0 && dir1 !== dir2) {
                contraryMotionCount++;
            }
        }
    }
    const contraryMotionBonus = contraryMotionCount * -3;
    score += contraryMotionBonus;
    breakdown.contraryMotion = contraryMotionBonus;

    // 5. Range penalty (weight: +10 per note outside C3-C6)
    const outOfRange = curr.filter(n => n < 48 || n > 84).length;
    const rangePenalty = outOfRange * 10;
    score += rangePenalty;
    breakdown.range = rangePenalty;

    // 6. Large leap penalty (weight: +2 per semitone beyond a major third)
    const leapPenalty = movements.reduce((sum, m) => {
        if (m.distance > 4) {
            return sum + (m.distance - 4) * 2;
        }
        return sum;
    }, 0);
    score += leapPenalty;
    breakdown.leaps = leapPenalty;

    return { score, breakdown };
}

// Find best voicing using comprehensive smooth voice leading scoring
function findBestSmoothVoicing(targetChordNotes, previousChordNotes) {
    if (!previousChordNotes) {
        // First chord - use comfortable mid-range root position
        const sorted = [...targetChordNotes].sort((a, b) => a - b);
        const bass = sorted[0];

        // Transpose to comfortable range (C4 = 60)
        const targetBass = 60;
        const offset = targetBass - bass;
        return sorted.map(n => n + offset);
    }

    const voicings = generateSmoothVoicings(targetChordNotes);
    let bestVoicing = targetChordNotes;
    let bestScore = Infinity;

    voicings.forEach(voicing => {
        const { score } = scoreVoiceLeading(voicing, previousChordNotes);
        if (score < bestScore) {
            bestScore = score;
            bestVoicing = voicing;
        }
    });

    return bestVoicing;
}

// Optimize voice leading with comprehensive smooth scoring
export function optimizeSmoothVoiceLeading(chordProgression) {
    if (chordProgression.length === 0) return chordProgression;

    const optimized = [];
    let previousNotes = null;

    chordProgression.forEach((chord, index) => {
        const optimizedNotes = findBestSmoothVoicing(chord.notes, previousNotes);

        optimized.push({
            ...chord,
            notes: optimizedNotes
        });

        previousNotes = optimizedNotes;
    });

    return optimized;
}

// Create close voicing (all notes within an octave or close together)
export function applyCloseVoicing(chordNotes) {
    if (chordNotes.length === 0) return chordNotes;

    const sorted = [...chordNotes].sort((a, b) => a - b);
    const bass = sorted[0];
    const pitchClasses = sorted.map(note => note % 12);

    // Build close voicing starting from bass note
    const closeVoiced = [bass];
    let currentNote = bass;

    for (let i = 1; i < pitchClasses.length; i++) {
        const targetPC = pitchClasses[i];
        // Find the next note above current that matches this pitch class
        let nextNote = currentNote + 1;
        while ((nextNote % 12) !== targetPC) {
            nextNote++;
        }
        closeVoiced.push(nextNote);
        currentNote = nextNote;
    }

    return closeVoiced;
}

// Create open voicing (spread notes across multiple octaves)
export function applyOpenVoicing(chordNotes) {
    if (chordNotes.length < 3) return chordNotes;

    const sorted = [...chordNotes].sort((a, b) => a - b);

    // Drop-2 voicing: move second-highest note down an octave
    const openVoiced = [...sorted];
    if (openVoiced.length >= 3) {
        openVoiced[openVoiced.length - 2] -= 12;
    }

    return openVoiced.sort((a, b) => a - b);
}

// Create spread voicing (maximum distance between voices)
export function applySpreadVoicing(chordNotes) {
    if (chordNotes.length < 3) return chordNotes;

    const sorted = [...chordNotes].sort((a, b) => a - b);
    const bass = sorted[0];
    const pitchClasses = sorted.map(note => note % 12);

    // Spread voices across wider range
    const spreadVoiced = [bass];
    let octaveOffset = 0;

    for (let i = 1; i < pitchClasses.length; i++) {
        const targetPC = pitchClasses[i];
        // Add notes in higher octaves
        octaveOffset += (i === 1) ? 7 : 5; // Skip larger intervals
        let nextNote = bass + octaveOffset;
        while ((nextNote % 12) !== targetPC) {
            nextNote++;
        }
        spreadVoiced.push(nextNote);
    }

    return spreadVoiced.sort((a, b) => a - b);
}

// Apply voicing style to a progression
export function applyVoicingStyle(chordProgression, voicingType = 'default') {
    if (voicingType === 'default') return chordProgression;

    return chordProgression.map(chord => {
        let voicedNotes = chord.notes;

        switch (voicingType) {
            case 'close':
                voicedNotes = applyCloseVoicing(chord.notes);
                break;
            case 'open':
                voicedNotes = applyOpenVoicing(chord.notes);
                break;
            case 'spread':
                voicedNotes = applySpreadVoicing(chord.notes);
                break;
        }

        return {
            ...chord,
            notes: voicedNotes
        };
    });
}

// ============================================================================
// Note Naming and Enharmonic Spelling
// ============================================================================

export function getEnharmonicContext(rootMidi, romanNumeral) {
    // Determine if we should use sharps or flats based on roman numeral
    const rootPitchClass = rootMidi % 12;

    // Borrowed chords with flats prefer flat spelling
    if (romanNumeral && (romanNumeral.includes('♭VII') || romanNumeral.includes('♭VI') ||
        romanNumeral.includes('♭III') || romanNumeral.includes('♭II') || romanNumeral === 'SubV7')) {
        return 'flats';
    }

    // Sharp alterations prefer sharp spelling
    if (romanNumeral && (romanNumeral.includes('♯') || romanNumeral === '#VI')) {
        return 'sharps';
    }

    // Use flats for Db, Eb, Gb, Ab, Bb pitch classes in most contexts
    if ([1, 3, 6, 8, 10].includes(rootPitchClass) && !romanNumeral?.includes('♯')) {
        return 'flats';
    }

    return 'sharps';
}

export function getNoteNameWithContext(midiNote, preferFlats = false) {
    const sharpNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const flatNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    const pitchClass = midiNote % 12;
    return preferFlats ? flatNames[pitchClass] : sharpNames[pitchClass];
}

export function spellChordNotes(rootMidiOrNotes, chordType, romanNumeral = '') {
    // If first parameter is an array, use actual voicing notes; otherwise rebuild chord
    let notes;
    let rootMidi;

    if (Array.isArray(rootMidiOrNotes)) {
        // Using actual voicing - find the root note (lowest pitch class that matches chord)
        notes = rootMidiOrNotes;

        // For proper spelling, we need the theoretical root (not necessarily the bass)
        // Build the chord in root position to identify pitch classes
        const sorted = [...notes].sort((a, b) => a - b);
        const bassPitchClass = sorted[0] % 12;

        // Try to identify root: for major/minor chords, root is usually present
        // Default to bass note as root
        rootMidi = sorted[0];

        // Try to find the actual chord root by checking pitch classes
        const pitchClasses = new Set(notes.map(n => n % 12));

        // For major chords, root + 4 + 7 semitones
        // For minor chords, root + 3 + 7 semitones
        const majorInterval = (bassPitchClass + 4) % 12;
        const minorInterval = (bassPitchClass + 3) % 12;
        const fifthInterval = (bassPitchClass + 7) % 12;

        // Check if bass is root (has third and fifth above it)
        const bassIsRoot = (chordType.includes('minor') && pitchClasses.has(minorInterval) && pitchClasses.has(fifthInterval)) ||
                          (chordType.includes('major') && pitchClasses.has(majorInterval) && pitchClasses.has(fifthInterval));

        if (!bassIsRoot) {
            // For inversions or complex voicings, find root by checking all notes
            for (const note of sorted) {
                const pc = note % 12;
                const thirdUp = (pc + (chordType.includes('minor') ? 3 : 4)) % 12;
                const fifthUp = (pc + 7) % 12;

                if (pitchClasses.has(thirdUp) && pitchClasses.has(fifthUp)) {
                    rootMidi = note;
                    break;
                }
            }
        }
    } else {
        // Legacy mode: rebuild chord from root
        rootMidi = rootMidiOrNotes;
        notes = buildChordRaw(rootMidi, chordType);
    }

    // Determine spelling preference
    const useFlats = getEnharmonicContext(rootMidi, romanNumeral) === 'flats';

    // Spell notes properly in thirds
    const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const rootName = getNoteNameWithContext(rootMidi, useFlats).replaceAll(/[#b]/g, '');
    const rootIndex = noteNames.indexOf(rootName);

    const spelled = notes.map((midi, i) => {
        // Calculate expected note letter (every other letter = third)
        const expectedIndex = (rootIndex + i * 2) % 7;
        const expectedLetter = noteNames[expectedIndex];

        // Get actual pitch class
        const pitchClass = midi % 12;
        const octave = Math.floor(midi / 12) - 2;

        // Find the spelling that matches the expected letter
        const sharpName = getNoteNameWithContext(midi, false);
        const flatName = getNoteNameWithContext(midi, true);

        let noteName;
        if (sharpName[0] === expectedLetter) {
            noteName = sharpName;
        } else if (flatName[0] === expectedLetter) {
            noteName = flatName;
        } else {
            // Need double sharp or double flat
            const letterPitches = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
            const expectedPitch = letterPitches[expectedLetter];
            const difference = (pitchClass - expectedPitch + 12) % 12;

            if (difference === 1) {
                noteName = expectedLetter + '#';
            } else if (difference === 2) {
                noteName = expectedLetter + '##';
            } else if (difference === 11) {
                noteName = expectedLetter + 'b';
            } else if (difference === 10) {
                noteName = expectedLetter + 'bb';
            } else {
                noteName = useFlats ? flatName : sharpName;
            }
        }

        return noteName + octave;
    });

    return spelled;
}

export function getChordName(degree, chordType, keyOffset, romanNumeral = '') {
    const midiNote = 60 + keyOffset + degree;
    const useFlats = getEnharmonicContext(midiNote, romanNumeral) === 'flats';
    const rootNote = getNoteNameWithContext(midiNote, useFlats);

    switch (chordType) {
        case 'minor':
        case 'minor7':
            return rootNote + 'm' + (chordType === 'minor7' ? '7' : '');
        case 'diminished':
            return rootNote + 'dim';
        case 'major7':
            return rootNote + 'maj7';
        case 'dom7':
            return rootNote + '7';
        case 'quartal':
            return rootNote + 'sus4';
        default:
            return rootNote;
    }
}

// Detect chord inversion and return slash notation if inverted
export function getInversionNotation(notes, chordType, chordName, romanNumeral = '') {
    if (!notes || notes.length < 3) return '';

    const sorted = [...notes].sort((a, b) => a - b);
    const bassPitchClass = sorted[0] % 12;

    // Build root position chord to identify expected intervals
    const pitchClasses = notes.map(n => n % 12);
    const pitchClassSet = new Set(pitchClasses);

    // Define interval structures for different chord types
    let thirdInterval, fifthInterval;

    if (chordType.includes('minor')) {
        thirdInterval = 3; // minor third
        fifthInterval = 7; // perfect fifth
    } else if (chordType.includes('diminished')) {
        thirdInterval = 3; // minor third
        fifthInterval = 6; // diminished fifth
    } else {
        // major or dominant
        thirdInterval = 4; // major third
        fifthInterval = 7; // perfect fifth
    }

    // Try to find the root by checking which note forms the expected intervals
    let rootPitchClass = null;

    for (const pc of pitchClassSet) {
        const third = (pc + thirdInterval) % 12;
        const fifth = (pc + fifthInterval) % 12;

        if (pitchClassSet.has(third) && pitchClassSet.has(fifth)) {
            rootPitchClass = pc;
            break;
        }
    }

    // If we couldn't find root by intervals, assume lowest note's pitch class
    if (rootPitchClass === null) {
        rootPitchClass = bassPitchClass;
    }

    // Check if bass is root position
    if (bassPitchClass === rootPitchClass) {
        return ''; // Root position, no inversion notation needed
    }

    // Get the bass note name with octave number for slash notation
    const bassNote = sorted[0];
    const useFlats = getEnharmonicContext(bassNote, romanNumeral) === 'flats';
    const bassNoteName = getNoteNameWithContext(bassNote, useFlats);
    const bassOctave = Math.floor(bassNote / 12) - 2; // Convert MIDI to octave number

    // Return slash notation with octave (e.g., /Eb3)
    return '/' + bassNoteName + bassOctave;
}

export function getRomanNumeral(degree, isMinor = false, isDim = false) {
    const numerals = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii'];
    let numeral = numerals[degree] || 'I';

    if (isDim) {
        numeral += '°';
    }

    return numeral;
}

// ============================================================================
// Progression Parsing and Generation
// ============================================================================

function parseProgression(progressionString) {
    const chords = progressionString.split('—');
    return chords.map(chord => {
        // Remove any quality indicators for parsing
        const cleanChord = chord.replaceAll(/M7|m7|7|°|dim|maj|min/g, '');

        // Parse roman numerals
        const romanToNumber = {
            'i': 0, 'I': 0,
            'ii': 1, 'II': 1, '♭II': 1,
            'iii': 2, 'III': 2, '♭III': 2,
            'iv': 3, 'IV': 3,
            'v': 4, 'V': 4,
            'vi': 5, 'VI': 5, '♭VI': 5,
            'vii': 6, 'VII': 6, '♭VII': 6,
            '♯I': 1, '♯II': 3, '♯iv': 4, '♭IIIM7': 2, '♭VIM7': 5
        };

        // Special cases
        if (cleanChord === '♯I°') return { degree: 1, quality: 'diminished', alteration: 'sharp' };
        if (cleanChord === '♯II°') return { degree: 3, quality: 'diminished', alteration: 'sharp' };
        if (cleanChord === '♯iv°') return { degree: 4, quality: 'diminished', alteration: 'sharp' };

        // Determine if flat or sharp
        let alteration = '';
        if (cleanChord.includes('♭')) alteration = 'flat';
        if (cleanChord.includes('♯')) alteration = 'sharp';

        // Get base numeral
        const baseChord = cleanChord.replaceAll(/♭|♯/g, '');
        const degree = romanToNumber[baseChord] !== undefined ? romanToNumber[baseChord] : 0;

        // Determine quality from original chord string
        let quality = 'major';
        if (chord.includes('°') || chord.includes('dim')) {
            quality = 'diminished';
        } else if (chord.includes('M7') || chord.includes('maj7')) {
            quality = 'major7';
        } else if (chord.includes('m7')) {
            quality = 'minor7';
        } else if (chord.match(/[IV]7/) && !chord.includes('M7')) {
            quality = 'dom7';
        } else if (baseChord === baseChord.toLowerCase() ||
                  (baseChord === 'ii' || baseChord === 'iii' || baseChord === 'vi' || baseChord === 'vii')) {
            quality = 'minor';
        }

        return { degree, quality, alteration };
    });
}

export function generateProgressionChords(progressionString, keyOffset, scaleDegrees, selectedMode) {
    let progression = [];

    // Special handling for 12-bar blues
    if (progressionString === '12-bar-blues') {
        // 12-bar blues pattern: I-I-I-I-IV-IV-I-I-V-IV-I-V
        const pattern = [0, 0, 0, 0, 3, 3, 0, 0, 4, 3, 0, 4];
        pattern.forEach(degree => {
            const scaleDegree = scaleDegrees[degree % scaleDegrees.length];
            const chordType = degree === 4 ? 'dom7' : 'major';
            progression.push({
                degree,
                notes: buildChord(scaleDegree, chordType, keyOffset),
                chordType,
                chordName: getChordName(scaleDegree, chordType, keyOffset),
                romanNumeral: getRomanNumeral(degree, false, false)
            });
        });
    } else {
        const parsedChords = parseProgression(progressionString);
        progression = parsedChords.map(({ degree, quality, alteration }) => {
            // OPTION A: Pure parallel major analysis (r/MusicTheory approved!)
            // ALL roman numerals reference the parallel major scale, regardless of mode.
            // The chord quality is determined ONLY by the roman numeral itself:
            //   - Uppercase (I, V, etc.) = major
            //   - Lowercase (i, vi, etc.) = minor
            //   - Symbols (°, 7, etc.) = diminished, dominant 7th, etc.
            // This is standard Roman numeral analysis convention.

            // Always use major scale as reference
            const majorScale = [0, 2, 4, 5, 7, 9, 11];
            let scaleDegree = majorScale[degree % majorScale.length];

            // Apply alterations (♭, ♯) relative to major scale
            if (alteration === 'flat') {
                scaleDegree = (scaleDegree - 1 + 12) % 12;
            } else if (alteration === 'sharp') {
                scaleDegree = (scaleDegree + 1) % 12;
            }

            // Quality is already determined by parseProgression() based on the numeral itself
            // No need to override it based on mode

            const notes = buildChord(scaleDegree, quality, keyOffset);
            const chordName = getChordName(scaleDegree, quality, keyOffset);

            // Create roman numeral with proper formatting
            const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
            let romanNumeral = numerals[degree] || 'I';

            if (quality === 'minor' || quality === 'minor7') {
                romanNumeral = romanNumeral.toLowerCase();
            }
            if (quality === 'diminished') {
                romanNumeral += '°';
            }
            if (quality === 'dom7' && degree === 4) {
                romanNumeral = 'V7';
            }
            if (alteration === 'flat') {
                romanNumeral = '♭' + romanNumeral;
            } else if (alteration === 'sharp') {
                romanNumeral = '♯' + romanNumeral;
            }

            return {
                degree,
                notes,
                chordType: quality,
                chordName,
                romanNumeral
            };
        });
    }

    // Apply voice leading optimization to the progression
    return optimizeVoiceLeading(progression);
}
