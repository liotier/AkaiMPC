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
        'Locrian #2'
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
            tonality: 'major',
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
            value: 'i—V—♭VII—IV—♭VI—♭III—iv—V',
        }
    ],
    'Blues/Soul': [
        {
            value: '12-bar-blues',
            tonality: 'major',
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
            tonality: 'major',
        },
        {
            value: 'IVM7—V7—iii7—vi',
            tonality: 'major',
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
            tonality: 'major',
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
            row4: { prefer: ['mediant', 'modeFlip'] },  // opted in: its own settings left row 4 short (spec 04 §6 item 8)
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
            tonality: 'minor',  // no tonic token: declared, not derived (docs/improvements/07-minor-key-awareness.md §3.1)
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
            row4: { prefer: ['mediant', 'modeFlip'] },  // opted in: its own settings left row 4 short (spec 04 §6 item 8)
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
            tonality: 'major',
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
            tonality: 'major',
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
            tonality: 'major',
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
            row4: { prefer: ['mediant', 'modeFlip'] },  // opted in: its own settings left row 4 short (spec 04 §6 item 8)
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
            value: 'i—V—i—♭VII',
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
            row4: { prefer: ['mediant', 'modeFlip'], avoid: ['secondary', 'augmented6th'] },  // spec 10 D4
            palettePriorities: {
                preferred: ['major', 'minor', 'major7', 'add9'],   // Warm triads and open colour; the loop is the point
                allowed: ['minor7', 'sus2', 'sus4', 'major9', 'minAdd9'],
                avoided: ['dom7', 'dom9', 'diminished', 'augmented', 'quartal']   // No dominant pull: these loops never resolve
            },
        },
        {
            value: 'i—♭VI—♭VII—i',
            row4: { prefer: ['mediant', 'modeFlip'], avoid: ['secondary', 'augmented6th'] },  // spec 10 D4
            palettePriorities: {
                preferred: ['major', 'minor', 'major7', 'add9'],   // Warm triads and open colour; the loop is the point
                allowed: ['minor7', 'sus2', 'sus4', 'major9', 'minAdd9'],
                avoided: ['dom7', 'dom9', 'diminished', 'augmented', 'quartal']   // No dominant pull: these loops never resolve
            },
        },
        {
            value: 'I—V—vi—♭VI—IV',
            row4: { prefer: ['mediant', 'modeFlip'], avoid: ['secondary', 'augmented6th'] },  // spec 10 D4
            palettePriorities: {
                preferred: ['major', 'minor', 'major7', 'add9'],   // Warm triads and open colour; the loop is the point
                allowed: ['minor7', 'sus2', 'sus4', 'major9', 'minAdd9'],
                avoided: ['dom7', 'dom9', 'diminished', 'augmented', 'quartal']   // No dominant pull: these loops never resolve
            },
        },
        {
            value: 'i—♭III—♭VII—♭VI—V',
            row4: { prefer: ['mediant', 'modeFlip'], avoid: ['secondary', 'augmented6th'] },  // spec 10 D4
            palettePriorities: {
                preferred: ['major', 'minor', 'dom7'],            // The V of the Heroic Theme may keep its seventh
                allowed: ['major7', 'minor7', 'sus4', 'add9'],
                avoided: ['diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'I—♭VII—♭VI—♭VII',
            row4: { prefer: ['mediant', 'modeFlip'], avoid: ['secondary', 'augmented6th'] },  // spec 10 D4
            palettePriorities: {
                preferred: ['major', 'minor', 'major7', 'add9'],   // Warm triads and open colour; the loop is the point
                allowed: ['minor7', 'sus2', 'sus4', 'major9', 'minAdd9'],
                avoided: ['dom7', 'dom9', 'diminished', 'augmented', 'quartal']   // No dominant pull: these loops never resolve
            },
        },
        {
            value: 'i—iv—♭VI—♭III',
            row4: { prefer: ['mediant', 'modeFlip'], avoid: ['secondary', 'augmented6th'] },  // spec 10 D4
            palettePriorities: {
                preferred: ['major', 'minor', 'major7', 'add9'],   // Warm triads and open colour; the loop is the point
                allowed: ['minor7', 'sus2', 'sus4', 'major9', 'minAdd9'],
                avoided: ['dom7', 'dom9', 'diminished', 'augmented', 'quartal']   // No dominant pull: these loops never resolve
            },
        },
        {
            value: 'I—♭III—♭VI—♭II',
            row4: { prefer: ['mediant', 'modeFlip'], avoid: ['secondary', 'augmented6th'] },  // spec 10 D4
            palettePriorities: {
                preferred: ['major', 'minor', 'major7', 'add9'],   // Warm triads and open colour; the loop is the point
                allowed: ['minor7', 'sus2', 'sus4', 'major9', 'minAdd9'],
                avoided: ['dom7', 'dom9', 'diminished', 'augmented', 'quartal']   // No dominant pull: these loops never resolve
            },
        },
        {
            value: 'I—♭VI—I—III',
            row4: { prefer: ['mediant', 'modeFlip'], avoid: ['secondary', 'augmented6th'] },  // spec 10 D4
            palettePriorities: {
                preferred: ['major', 'major7', 'add9'],   // Chromatic mediants: major triads a major third either side of I
                allowed: ['sus2', 'major9', 'minor'],
                avoided: ['dom7', 'dom9', 'diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'I—♭III—I—VI',
            row4: { prefer: ['mediant', 'modeFlip'], avoid: ['secondary', 'augmented6th'] },  // spec 10 D4
            palettePriorities: {
                preferred: ['major', 'major7', 'add9'],   // Chromatic mediants: major triads a minor third either side of I
                allowed: ['sus2', 'major9', 'minor'],
                avoided: ['dom7', 'dom9', 'diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'i—♭vi—i—iii',
            row4: { prefer: ['mediant', 'modeFlip'], avoid: ['secondary', 'augmented6th'] },  // spec 10 D4
            palettePriorities: {
                preferred: ['minor', 'minor7', 'minAdd9'],   // Minor mediants: the minor chords a major third either side of i
                allowed: ['sus2', 'minor9', 'major'],
                avoided: ['dom7', 'major7', 'diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'I—♭vi—♭VI—I',
            row4: { prefer: ['mediant', 'modeFlip'], avoid: ['secondary', 'augmented6th'] },  // spec 10 D4
            palettePriorities: {
                preferred: ['major', 'minor', 'major7'],   // Hexatonic pole: I to the minor triad a major third below
                allowed: ['add9', 'sus2', 'minor7'],
                avoided: ['dom7', 'dom9', 'diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'I—II',
            row4: { prefer: ['mediant', 'modeFlip'], avoid: ['secondary', 'augmented6th'] },  // spec 10 D4
            palettePriorities: {
                preferred: ['major', 'major7', 'add9', 'major6'],   // Lydian: the major II holds the raised fourth
                allowed: ['sus2', 'major9', 'minor', 'minor7'],
                avoided: ['dom7', 'dom9', 'diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'I—II—iii—II',
            row4: { prefer: ['mediant', 'modeFlip'], avoid: ['secondary', 'augmented6th'] },  // spec 10 D4
            palettePriorities: {
                preferred: ['major', 'major7', 'add9', 'major6'],   // Lydian again, circling the tonic without a dominant
                allowed: ['sus2', 'major9', 'minor', 'minor7'],
                avoided: ['dom7', 'dom9', 'diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'i—v—♭VII—IV',
            row4: { prefer: ['mediant', 'modeFlip'], avoid: ['secondary', 'augmented6th'] },  // spec 10 D4
            palettePriorities: {
                preferred: ['minor', 'major', 'minor7'],   // Dorian: minor v and the major IV, no leading-tone dominant
                allowed: ['sus2', 'sus4', 'add9', 'minAdd9'],
                avoided: ['dom7', 'major7', 'diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'i—♭III—V—i',
            row4: { prefer: ['mediant', 'modeFlip'], avoid: ['secondary', 'augmented6th'] },  // spec 10 D4
            palettePriorities: {
                preferred: ['minor', 'major'],   // The major V may carry its seventh
                allowed: ['dom7', 'minor7', 'sus4'],
                avoided: ['major7', 'diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'i—♭VI—IV—♭VI',
            row4: { prefer: ['mediant', 'modeFlip'], avoid: ['secondary', 'augmented6th'] },  // spec 10 D4
            palettePriorities: {
                preferred: ['minor', 'major'],   // Wandering fifth: G climbs to A♭ and A over a held bass
                allowed: ['sus4', 'sus2', 'minor7', 'add9'],
                avoided: ['dom7', 'major7', 'diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'I—♭VI—♭VII—I',
            row4: { prefer: ['mediant', 'modeFlip'], avoid: ['secondary', 'augmented6th'] },  // spec 10 D4
            palettePriorities: {
                preferred: ['major', 'sus4', 'add9'],   // Hero cadence: ♭VI and ♭VII climbing back to I
                allowed: ['major7', 'sus2', 'minor'],
                avoided: ['dom7', 'dom9', 'diminished', 'augmented', 'quartal']
            },
        },
        {
            value: 'i—i♯5—i6—i♯5',
            row4: { prefer: ['mediant', 'modeFlip'], avoid: ['secondary', 'augmented6th'] },  // spec 10 D4
            palettePriorities: {
                preferred: ['minor', 'minAug', 'minor6'],   // The fifth climbs: 5, ♯5, 6, ♯5 over a held root and third
                // A minor key's ♭VI, ♭VII and V7 are what follows a line cliché;
                // avoiding major and dom7 left row 4 nothing it did not avoid
                allowed: ['minor7', 'minMaj7', 'major', 'dom7', 'sus4'],
                avoided: ['major7', 'diminished', 'quartal']
            },
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
            value: 'i—♭III—IV—♭VI',
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
            value: '♭VI—♭VII—i',
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
            value: 'i—iv—V—♭VI',
            palettePriorities: {
                preferred: ['minor', 'major'],
                allowed: ['sus2', 'sus4', 'quartal'],
                avoided: ['major7', 'minor7', 'dom7', 'diminished', 'augmented']
            },
        },
        {
            value: 'i—♭VI—♭III—♭VII',
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
            value: 'i—♭VII—♭VI—♭VII',
            palettePriorities: {
                preferred: ['minor', 'major'],
                allowed: ['minor7', 'sus2', 'sus4', 'quartal'],
                avoided: ['major7', 'dom7', 'diminished', 'augmented']
            },
        },
        {
            value: 'i—♭II—♭VII—V',
            palettePriorities: {
                preferred: ['minor', 'major'],
                allowed: ['minor7', 'sus2', 'sus4', 'quartal', 'dom7'],   // The major V may carry its seventh
                avoided: ['major7', 'diminished', 'augmented']
            },
        },
        {
            value: 'i—iv—i—♭VII',
            palettePriorities: {
                preferred: ['minor', 'major'],
                allowed: ['minor7', 'sus2', 'sus4', 'quartal'],
                avoided: ['major7', 'dom7', 'diminished', 'augmented']
            },
        },
        {
            value: 'i—♭III—♭VII—IV',
            palettePriorities: {
                preferred: ['minor', 'major'],
                allowed: ['minor7', 'sus2', 'sus4', 'quartal'],
                avoided: ['major7', 'dom7', 'diminished', 'augmented']
            },
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
            row4: { prefer: ['mediant', 'modeFlip'] },  // opted in: its own settings left row 4 short (spec 04 §6 item 8)
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
            value: 'i—♭VI—♭III—♭VII',
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
            value: 'i—♭VII—♭VI',
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

/**
 * The template entry for a progression, and the genre it is read under.
 *
 * A template's identity is the pair (category, value), not the value alone:
 * sixteen values are listed under more than one genre, each entry with its own
 * palette priorities and its own MPC menu heading. Looking a template up by
 * value returned the first genre's entry for all of them, so the later genres'
 * priorities were never read and their exports were filed under the first
 * genre (docs/improvements/01-template-identity.md).
 *
 * When `category` names a genre that lists the value, that genre's entry is
 * returned. Otherwise - no category, an unknown one, or one that does not list
 * the value - the first genre listing it, which is how a bare value (an old
 * URL, a preference stored before genres were remembered) was always read.
 *
 * @param {string} value - A progression template value, e.g. 'I—V—vi—IV'
 * @param {string|null} [category=null] - The genre the value was chosen under
 * @returns {{category: string, template: Object}|null} null if no genre lists the value
 */
export function resolveTemplate(value, category = null) {
    if (category !== null && Object.prototype.hasOwnProperty.call(progressions, category)) {
        const template = progressions[category].find(p => p.value === value);
        if (template) return { category, template };
    }
    for (const [name, list] of Object.entries(progressions)) {
        const template = list.find(p => p.value === value);
        if (template) return { category: name, template };
    }
    return null;
}

/**
 * The genre category a progression template is read under, e.g.
 * 'Jungle/Drum\'n\'Bass' for 'i—♭VII—♭VI—V' when nothing says otherwise. Used by
 * modules/mpcNaming.js callers (the category is half of the MPC display name)
 * and by the app to restore a selection. Same rule as resolveTemplate().
 *
 * @param {string} value - A progression template value
 * @param {string|null} [preferred=null] - The genre the value was chosen under
 * @returns {string|null} The category key, or null if value matches nothing
 */
export function findProgressionCategory(value, preferred = null) {
    return resolveTemplate(value, preferred)?.category ?? null;
}

/**
 * Whether a progression template is in a major or a minor key.
 *
 * One rule, shared by generation (which spells a template's chords in the
 * scale of its tonality, docs/improvements/13-spelling.md),
 * tools/catalogue-snapshot.mjs (which renders major templates in C and minor
 * ones in A) and tools/audit-theory.mjs (check H, which only polices
 * minor-tonality templates). It lived in tools/lib/template-tonality.mjs until
 * generation needed it; generation cannot import from tools/. Specified in
 * docs/improvements/00-catalogue-snapshot.md §3.2.
 *
 * An explicit `tonality` on the template wins; until templates carry one, the
 * first token whose stem is a bare I or i decides, by its case. Tokens with a
 * slash are applied chords (V7/ii), and a token with an accidental or a longer
 * stem (♭III, IV, ii) is not the tonic. A template with no tonic token at all
 * is major.
 *
 * @param {Object} template - A progressions[category] entry
 * @returns {'major'|'minor'}
 */
export function templateTonality(template) {
    if (template.tonality !== undefined) {
        if (template.tonality !== 'major' && template.tonality !== 'minor') {
            throw new Error(`Template ${template.value}: tonality must be 'major' or 'minor', got ${JSON.stringify(template.tonality)}`);
        }
        return template.tonality;
    }

    for (const token of template.value.split(TEMPLATE_SEPARATOR)) {
        if (token.includes('/')) continue;
        const tonic = token.match(/^([iI])(?![ivIV])/);
        if (tonic) return tonic[1] === 'i' ? 'minor' : 'major';
    }
    return 'major';
}

/**
 * The category a mode/scale belongs to in the `modes` object, e.g. 'Exotic'
 * for 'Hirajoshi'. Scale Mode has no genre, so modules/mpcNaming.js uses this
 * as the MPC display name's heading instead (see docs/mpc-export-specification.md §5.5).
 *
 * @param {string} mode - A mode/scale name
 * @returns {string|null} The category key, or null if mode matches nothing
 */
export function findModeCategory(mode) {
    for (const category in modes) {
        if (modes[category].includes(mode)) return category;
    }
    return null;
}

// ============================================================================
// Core Music Theory Functions
// ============================================================================

export function getKeyOffset(key) {
    const keyMap = {
        'C': 0, 'C♯/D♭': 1, 'D': 2, 'D♯/E♭': 3, 'E': 4, 'F': 5,
        'F♯/G♭': 6, 'G': 7, 'G♯/A♭': 8, 'A': 9, 'A♯/B♭': 10, 'B': 11
    };
    // Not `|| 0`: an unrecognised key used to fall back to C silently, which
    // fabricates plausible output instead of failing. An audit that passed
    // ASCII 'C#/Db' instead of 'C♯/D♭' measured C five times over before this
    // was noticed.
    if (!(key in keyMap)) {
        console.warn(`getKeyOffset: unknown key ${JSON.stringify(key)}, falling back to C`);
        return 0;
    }
    return keyMap[key];
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
        // Arabic Maqamat removed: quarter-tone intervals (Bayati, Rast, Saba)
        // cannot be meaningfully represented in 12-TET. Use Phrygian Dominant
        // for Hijaz-like sound, Phrygian for Kurd-like sound.
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
        // Enigmatic scale removed: its interval structure does not produce
        // recognizable tertian triads on most degrees, making chord generation
        // meaningless for 5 of 7 scale positions.
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
        // Bebop scales removed: 8-note scales with chromatic passing tones
        // are melodic devices, not harmonic ones. Building chords on passing
        // tones produces musically meaningless results. Use Major, Mixolydian,
        // or Dorian for the harmonic foundation of bebop.
    };

    // Handle quarter tone approximations
    const scale = scales[mode] || scales['Major'];
    return scale.map(note => Math.round(note));  // Round any quarter tones to nearest semitone
}

// The intended triad colour of each degree, as authored. Consumed through
// getScaleTriad(), which discards any entry that would step outside the scale.
function getDeclaredChordQuality(degree, mode) {
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
            2: 'major',   // ♭III
            3: 'minor',   // iv
            4: 'minor',   // v
            5: 'major',   // ♭VI
            6: 'major'    // ♭VII
        },
        'Dorian': {
            0: 'minor',   // i
            1: 'minor',   // ii
            2: 'major',   // ♭III
            3: 'major',   // IV
            4: 'minor',   // v
            5: 'diminished',  // vi°
            6: 'major'    // ♭VII
        },
        'Phrygian': {
            0: 'minor',   // i
            1: 'major',   // ♭II
            2: 'major',   // ♭III
            3: 'minor',   // iv
            4: 'diminished',  // v°
            5: 'major',   // ♭VI
            6: 'minor'    // ♭vii
        },
        'Lydian': {
            0: 'major',   // I
            1: 'major',   // II
            2: 'minor',   // iii
            3: 'diminished',  // ♯iv°
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
            6: 'major'    // ♭VII
        },
        'Locrian': {
            0: 'diminished',  // i°
            1: 'major',   // ♭II
            2: 'minor',   // ♭iii
            3: 'minor',   // iv
            4: 'major',   // ♭V
            5: 'major',   // ♭VI
            6: 'minor'    // ♭vii
        },
        'Harmonic Minor': {
            0: 'minor',   // i
            1: 'diminished',  // ii°
            2: 'augmented',   // ♭III+ (augmented triad)
            3: 'minor',   // iv
            4: 'major',   // V
            5: 'major',   // ♭VI
            6: 'diminished'  // vii°
        },
        'Melodic Minor': {
            0: 'minor',   // i
            1: 'minor',   // ii
            2: 'augmented',   // ♭III+ (augmented triad)
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
            1: 'major',   // ♭III
            2: 'minor',   // iv
            3: 'minor',   // v
            4: 'major'    // ♭VII
        },
        'Blues': {
            0: 'minor',   // i
            1: 'major',   // ♭III
            2: 'minor',   // iv
            3: 'major',   // ♯IV (with blue note)
            4: 'minor',   // v
            5: 'major'    // ♭VII
        },
        'Double Harmonic': {
            0: 'major',   // I
            1: 'major',   // ♭II
            2: 'major',   // III
            3: 'minor',   // iv
            4: 'major',   // V
            5: 'major',   // ♭VI
            6: 'diminished'  // vii°
        },
        'Hungarian Minor': {
            0: 'minor',   // i
            1: 'diminished',  // ii°
            2: 'major',   // ♭III
            3: 'minor',   // ♯iv
            4: 'major',   // V
            5: 'major',   // ♭VI
            6: 'diminished'  // vii°
        },
        'Neapolitan Major': {
            0: 'major',   // I
            1: 'major',   // ♭II
            2: 'minor',   // ♭iii
            3: 'major',   // IV
            4: 'major',   // V
            5: 'minor',   // vi
            6: 'diminished'  // vii°
        },
        'Neapolitan Minor': {
            0: 'minor',   // i
            1: 'major',   // ♭II
            2: 'augmented',  // ♭III+ (Eb-G-B = augmented triad)
            3: 'minor',   // iv
            4: 'major',   // V
            5: 'major',   // ♭VI
            6: 'diminished'  // vii°
        },
        // Enigmatic scale chord qualities removed (scale removed)
        'Phrygian Dominant': {
            0: 'major',   // I
            1: 'major',   // ♭II
            2: 'diminished',  // iii°
            3: 'minor',   // iv
            4: 'minor',   // v
            5: 'major',   // ♭VI
            6: 'minor'    // ♭vii
        },
        'Persian': {
            0: 'major',   // I
            1: 'major',   // ♭II
            2: 'major',   // III
            3: 'minor',   // iv
            4: 'diminished',  // ♭v°
            5: 'major',   // ♭VI
            6: 'diminished'  // vii°
        },
        'Hirajoshi': {
            0: 'minor',   // i
            1: 'major',   // II
            2: 'minor',   // ♭iii
            3: 'major',   // V
            4: 'major'    // ♭VI
        },
        'Insen': {
            0: 'minor',   // i
            1: 'major',   // ♭II
            2: 'minor',   // iv
            3: 'minor',   // v
            4: 'major'    // ♭VII
        },
        'Kumoi': {
            0: 'minor',   // i
            1: 'major',   // II
            2: 'minor',   // ♭iii
            3: 'major',   // V
            4: 'minor'    // vi
        },
        'Egyptian Pentatonic': {
            0: 'minor',   // i
            1: 'major',   // II
            2: 'minor',   // iv
            3: 'minor',   // v
            4: 'major'    // ♭VII
        },
        // Symmetrical/Jazz scales
        'Whole Tone': {
            0: 'augmented',  // I+ (all triads are augmented in whole tone)
            1: 'augmented',  // II+
            2: 'augmented',  // III+
            3: 'augmented',  // ♯IV+
            4: 'augmented',  // ♯V+
            5: 'augmented'   // ♯VI+
        },
        'Diminished (W-H)': {
            0: 'diminished',  // i°
            1: 'minor',   // ii
            2: 'diminished',  // ♯ii°
            3: 'major',   // IV
            4: 'diminished',  // ♯iv°
            5: 'minor',   // ♯v
            6: 'diminished',  // vi°
            7: 'major'    // VII
        },
        'Diminished (H-W)': {
            // Major on 1, 3, 5, 7: the triads the half-whole scale is used for,
            // whose sevenths are four dominants a minor third apart
            // (docs/improvements/17-scale-mode-numerals-and-descriptions.md D9)
            0: 'major',   // I
            1: 'diminished',  // ♯i°
            2: 'major',   // ♯II
            3: 'diminished',  // iii°
            4: 'major',   // ♯IV
            5: 'diminished',  // v°
            6: 'major',   // VI
            7: 'diminished'  // ♯vi°
        },
        'Augmented': {
            0: 'augmented',  // I+ (all triads in augmented hexatonic are augmented)
            1: 'augmented',  // ♯II+
            2: 'augmented',  // III+
            3: 'augmented',  // V+
            4: 'augmented',  // ♯V+
            5: 'augmented'   // VII+
        },
        // Arabic Maqamat chord qualities removed (scales removed)
        // Indian Ragas
        'Bhairav': {
            0: 'major',   // I
            1: 'major',   // ♭II
            2: 'major',   // III
            3: 'minor',   // iv
            4: 'major',   // V
            5: 'major',   // ♭VI
            6: 'diminished'  // vii°
        },
        'Kafi': {
            0: 'minor',   // i
            1: 'minor',   // ii
            2: 'major',   // ♭III
            3: 'major',   // IV
            4: 'minor',   // v
            5: 'diminished',  // vi°
            6: 'major'    // ♭VII
        },
        'Yaman': {
            0: 'major',   // I
            1: 'major',   // II
            2: 'minor',   // iii
            3: 'diminished',  // ♯iv°
            4: 'major',   // V
            5: 'minor',   // vi
            6: 'minor'    // vii
        },
        'Bhairavi': {
            0: 'minor',   // i
            1: 'major',   // ♭II
            2: 'major',   // ♭III
            3: 'minor',   // iv
            4: 'diminished',  // v°
            5: 'major',   // ♭VI
            6: 'minor'    // ♭vii
        },
        'Todi': {
            0: 'minor',   // i
            1: 'major',   // ♭II
            2: 'minor',   // ♭iii
            3: 'diminished',  // ♯iv°
            4: 'major',   // V
            5: 'major',   // ♭VI
            6: 'diminished'  // vii°
        },
        // Melodic Minor Modes
        'Altered': {
            0: 'diminished',  // i° (altered tonic)
            1: 'minor',   // ♭ii
            2: 'minor',   // ♭iii
            3: 'minor',   // ♭iv
            4: 'major',   // ♭V
            5: 'major',   // ♭VI
            6: 'minor'    // ♭vii
        },
        'Lydian Dominant': {
            0: 'major',   // I (dom7 context)
            1: 'major',   // II
            2: 'minor',   // iii
            3: 'diminished',  // ♯iv°
            4: 'major',   // V
            5: 'minor',   // vi
            6: 'minor'    // ♭vii
        },
        'Locrian #2': {
            0: 'diminished',  // i° (m7b5 context)
            1: 'minor',   // ii
            2: 'minor',   // ♭iii
            3: 'minor',   // iv
            4: 'major',   // ♭V
            5: 'major',   // ♭VI
            6: 'minor'    // ♭vii
        },
        // Bebop scale chord qualities removed (scales removed)
    };

    const qualities = modeChordQualities[mode] || modeChordQualities['Major'];

    // For pentatonic and other scales with fewer than 7 degrees, use modulo of actual scale length
    const scaleLength = getScaleDegrees(mode).length;
    return qualities[degree % scaleLength] || 'major';
}

// ============================================================================
// Chord Building Functions
// ============================================================================

/**
 * Interval recipes (in semitones above the root) for every chord type the
 * generator can build. Single source of truth: chord construction, scale-fit
 * analysis and chord naming all read from here, so adding a chord quality is
 * a one-line change instead of four scattered ones.
 */
export const CHORD_INTERVALS = {
    // Triads
    major: [0, 4, 7],
    minor: [0, 3, 7],
    diminished: [0, 3, 6],
    augmented: [0, 4, 8],
    minAug: [0, 3, 8],     // Minor ♯5: minor third, augmented fifth (the ascending line cliché)
    sus2: [0, 2, 7],
    sus4: [0, 5, 7],

    // Seventh chords
    major7: [0, 4, 7, 11],
    minor7: [0, 3, 7, 10],
    dom7: [0, 4, 7, 10],
    dim7: [0, 3, 6, 9],
    m7b5: [0, 3, 6, 10],          // Half-diminished (ø7)
    minMaj7: [0, 3, 7, 11],       // Minor-major 7th
    aug7: [0, 4, 8, 10],          // Augmented 7th (7♯5)
    augMaj7: [0, 4, 8, 11],       // Augmented major 7th
    aug9: [0, 4, 8, 10, 14],      // Augmented 9th (9♯5): five of the whole-tone scale's six notes
    dom7sus4: [0, 5, 7, 10],      // 7sus4

    // Extended chords (9th, 11th, 13th)
    major9: [0, 4, 7, 11, 14],
    minor9: [0, 3, 7, 10, 14],
    dom9: [0, 4, 7, 10, 14],
    dom7b9: [0, 4, 7, 10, 13],    // Altered dominant
    dom7sharp9: [0, 4, 7, 10, 15],// Hendrix chord
    major11: [0, 4, 7, 11, 14, 17],
    minor11: [0, 3, 7, 10, 14, 17],
    dom11: [0, 4, 7, 10, 14, 17],
    major13: [0, 4, 7, 11, 14, 21],
    minor13: [0, 3, 7, 10, 14, 21],
    dom13: [0, 4, 7, 10, 14, 21],

    // Altered dominants
    dom7alt: [0, 4, 8, 10, 15],   // 7♯9♯5 - fully altered
    dom7b5: [0, 4, 6, 10],        // Tritone substitution ready

    // Quartal/Modern voicings
    quartal: [0, 5, 10],
    quartal4: [0, 5, 10, 15],

    // Add9/Add11 (no 7th)
    add9: [0, 4, 7, 14],
    minAdd9: [0, 3, 7, 14],
    add11: [0, 4, 7, 17],

    // 6th chords
    major6: [0, 4, 7, 9],
    minor6: [0, 3, 7, 9],
    'maj6/9': [0, 4, 7, 9, 14],

    // Shell voicings (jazz comping - root, 3rd, 7th only)
    shell7: [0, 4, 11],
    shellm7: [0, 3, 10],
    shelldom7: [0, 4, 10],

    // Rootless voicings (jazz piano)
    rootless7A: [4, 7, 11, 14],       // Type A: 3-5-7-9
    rootlessm7A: [3, 7, 10, 14],
    rootlessdom7A: [4, 7, 10, 14],
    rootless7B: [11, 14, 16, 19],     // Type B: 7-9-3-5
    rootlessm7B: [10, 14, 15, 19],
    rootlessdom7B: [10, 14, 16, 19],

    // Augmented 6th chords (resolve to V), spelled from ♭6 in the bass
    It6: [0, 4, 10],   // Italian 6th:  ♭6, 1, ♯4
    Fr6: [0, 4, 6, 10],// French 6th:   ♭6, 1, 2, ♯4
    Ger6: [0, 4, 7, 10]// German 6th:   ♭6, 1, ♭3, ♯4
};

/**
 * The degree each interval of CHORD_INTERVALS is, in the same order: what
 * decides a chord tone's letter. Semitones cannot: dom7b5 and Fr6 share
 * [0, 4, 6, 10] and are spelled C E G♭ B♭ and A♭ C D F♯. A degree's letter is
 * its number minus one steps above the root's (a 9th is a 2nd, a 10th a 3rd,
 * an 11th a 4th, a 12th a 5th, a 13th a 6th); its accidental, ASCII like chord
 * names, makes the semitones come out right. The upper notes of the rootless
 * type-B voicings, a 3rd and a 5th an octave up, are written 10 and 12 so
 * that every degree's semitones equal its interval, which audit check S1
 * asserts. A new chord type needs its row here
 * (docs/improvements/13-spelling.md §3.4).
 */
export const CHORD_DEGREES = {
    major: ['1', '3', '5'],
    minor: ['1', 'b3', '5'],
    diminished: ['1', 'b3', 'b5'],
    augmented: ['1', '3', '#5'],
    // Spelled from its symbol, m#5: E G B#, not E G C (spec 13 D5)
    minAug: ['1', 'b3', '#5'],
    sus2: ['1', '2', '5'],
    sus4: ['1', '4', '5'],

    major7: ['1', '3', '5', '7'],
    minor7: ['1', 'b3', '5', 'b7'],
    dom7: ['1', '3', '5', 'b7'],
    dim7: ['1', 'b3', 'b5', 'bb7'],
    m7b5: ['1', 'b3', 'b5', 'b7'],
    minMaj7: ['1', 'b3', '5', '7'],
    aug7: ['1', '3', '#5', 'b7'],
    augMaj7: ['1', '3', '#5', '7'],
    aug9: ['1', '3', '#5', 'b7', '9'],
    dom7sus4: ['1', '4', '5', 'b7'],

    major9: ['1', '3', '5', '7', '9'],
    minor9: ['1', 'b3', '5', 'b7', '9'],
    dom9: ['1', '3', '5', 'b7', '9'],
    dom7b9: ['1', '3', '5', 'b7', 'b9'],
    dom7sharp9: ['1', '3', '5', 'b7', '#9'],
    major11: ['1', '3', '5', '7', '9', '11'],
    minor11: ['1', 'b3', '5', 'b7', '9', '11'],
    dom11: ['1', '3', '5', 'b7', '9', '11'],
    major13: ['1', '3', '5', '7', '9', '13'],
    minor13: ['1', 'b3', '5', 'b7', '9', '13'],
    dom13: ['1', '3', '5', 'b7', '9', '13'],

    dom7alt: ['1', '3', '#5', 'b7', '#9'],
    dom7b5: ['1', '3', 'b5', 'b7'],

    quartal: ['1', '4', 'b7'],
    quartal4: ['1', '4', 'b7', 'b10'],

    add9: ['1', '3', '5', '9'],
    minAdd9: ['1', 'b3', '5', '9'],
    add11: ['1', '3', '5', '11'],

    major6: ['1', '3', '5', '6'],
    minor6: ['1', 'b3', '5', '6'],
    'maj6/9': ['1', '3', '5', '6', '9'],

    shell7: ['1', '3', '7'],
    shellm7: ['1', 'b3', 'b7'],
    shelldom7: ['1', '3', 'b7'],

    rootless7A: ['3', '5', '7', '9'],
    rootlessm7A: ['b3', '5', 'b7', '9'],
    rootlessdom7A: ['3', '5', 'b7', '9'],
    rootless7B: ['7', '9', '10', '12'],
    rootlessm7B: ['b7', '9', 'b10', '12'],
    rootlessdom7B: ['b7', '9', '10', '12'],

    // Spelled by function from the ♭6 (spec 13 D6): A♭ C F♯, A♭ C D F♯, A♭ C E♭ F♯
    It6: ['1', '3', '#6'],
    Fr6: ['1', '3', '#4', '#6'],
    Ger6: ['1', '3', '5', '#6']
};

/**
 * The pitch classes a chord sounds, as a string that is equal for two chords
 * exactly when they hold the same pitch-class set, whatever the octave or the
 * voicing: [60, 64, 67] and [52, 67, 72] are both '0,4,7'. The identity of a
 * pad for the purpose of "does the grid already hold this chord"
 * (docs/improvements/04-row4-palette-priorities.md, 05-duplicate-sounding-pads.md).
 *
 * @param {number[]} notes - MIDI note numbers
 * @returns {string} Sorted, comma-joined pitch classes
 */
export const pcSignature = notes => [...new Set(notes.map(n => ((n % 12) + 12) % 12))].sort((a, b) => a - b).join(',');

export function buildChordRaw(baseNote, chordType) {
    // Helper function that just returns MIDI notes without context
    const intervals = CHORD_INTERVALS[chordType] || CHORD_INTERVALS.major;
    return intervals.map(interval => baseNote + interval);
}

export function buildChord(root, chordType, keyOffset) {
    const baseNote = 60 + keyOffset + root;
    // Delegate to buildChordRaw for consistency
    return buildChordRaw(baseNote, chordType);
}

// ============================================================================
// Scale-derived Harmony
// ============================================================================

/**
 * Abridged scales (fewer than 7 notes) do not contain enough pitches to build
 * tertian harmony on every degree. Convention for these is to take the chords
 * from the seven-note scale they are carved out of, which is what players
 * actually do: a pentatonic-major vamp is harmonised with major-scale chords.
 * Each parent listed here is a strict superset of its child scale.
 */
const SCALE_HARMONY_PARENT = {
    'Pentatonic Major': 'Major',
    'Pentatonic Minor': 'Minor',
    'Blues': 'Dorian',                // gives the blues its IV7 without leaving the scale
    'Hirajoshi': 'Harmonic Minor',
    'Insen': 'Phrygian',
    'Kumoi': 'Dorian',
    'Egyptian Pentatonic': 'Dorian'
};

/**
 * Triad qualities tried when the declared quality would introduce notes that
 * are not in the scale. Ordered by how idiomatic they are as a chord: tertian
 * triads first, then symmetrical ones, then suspended/quartal sonorities.
 */
const TRIAD_CANDIDATES = ['major', 'minor', 'diminished', 'augmented', 'sus4', 'sus2', 'quartal'];

/**
 * Seventh chords that can be layered on top of each triad quality, best first.
 * The first one that stays inside the scale wins, which is how the textbook
 * seventh of a degree falls out: I→maj7 in Ionian but I→7 in Mixolydian,
 * vii°→ø7 in major but vii°→°7 in harmonic minor.
 */
const SEVENTH_CANDIDATES = {
    major: ['major7', 'dom7', 'major6'],
    minor: ['minor7', 'minMaj7', 'minor6'],
    diminished: ['m7b5', 'dim7'],
    augmented: ['augMaj7', 'aug7'],
    sus4: ['dom7sus4'],
    sus2: [],
    quartal: ['quartal4']
};

/**
 * Pitch classes available for building chords in a mode. For abridged scales
 * this is the parent scale (see SCALE_HARMONY_PARENT); otherwise the scale itself.
 *
 * @param {string} mode - Mode/scale name
 * @returns {Set<number>} Set of pitch classes (0-11)
 */
export function getHarmonyPitchClasses(mode) {
    const pitchClasses = new Set(getScaleDegrees(mode).map(degree => ((degree % 12) + 12) % 12));
    const parent = SCALE_HARMONY_PARENT[mode];
    if (parent) {
        getScaleDegrees(parent).forEach(degree => pitchClasses.add(((degree % 12) + 12) % 12));
    }
    return pitchClasses;
}

/**
 * Check whether every note of a chord built on a root is available in a scale.
 *
 * @param {number} rootPitchClass - Root pitch class (0-11)
 * @param {string} chordType - Chord type key from CHORD_INTERVALS
 * @param {Set<number>} pitchClasses - Available pitch classes
 * @returns {boolean} True if the chord uses only scale tones
 */
export function chordFitsScale(rootPitchClass, chordType, pitchClasses) {
    return countForeignTones(rootPitchClass, chordType, pitchClasses) === 0;
}

/**
 * How many notes of a chord fall outside a scale.
 *
 * @param {number} rootPitchClass - Root pitch class (0-11)
 * @param {string} chordType - Chord type key from CHORD_INTERVALS
 * @param {Set<number>} pitchClasses - Available pitch classes
 * @returns {number} Count of chord tones not in the scale (Infinity if unknown type)
 */
function countForeignTones(rootPitchClass, chordType, pitchClasses) {
    const intervals = CHORD_INTERVALS[chordType];
    if (!intervals) return Infinity;
    return intervals.filter(interval => !pitchClasses.has((rootPitchClass + interval) % 12)).length;
}

/**
 * Best triad for a scale degree.
 *
 * The hand-written table in getDeclaredChordQuality() records the intended colour
 * of each degree and is kept whenever it stays inside the scale. When it does
 * not - which was the case for most of the exotic scales - the triad is derived
 * from the scale instead, so Scale Mode never shows a chord containing a note
 * that is not in the scale the user asked for.
 *
 * @param {number} degree - Scale degree index (0-based)
 * @param {string} mode - Mode/scale name
 * @returns {string} Chord type key
 */
export function getScaleTriad(degree, mode) {
    const scale = getScaleDegrees(mode);
    const rootPitchClass = ((scale[degree % scale.length] % 12) + 12) % 12;
    const pitchClasses = getHarmonyPitchClasses(mode);
    const declared = getDeclaredChordQuality(degree, mode);

    if (chordFitsScale(rootPitchClass, declared, pitchClasses)) {
        return declared;
    }

    const derived = TRIAD_CANDIDATES.find(type => chordFitsScale(rootPitchClass, type, pitchClasses));
    if (derived) return derived;

    // A few degrees of the most lopsided scales support no triad at all - the
    // ♭5 of the blues scale, the leading tone of Double Harmonic, the ♯4 of
    // Hungarian Minor. Take whichever triad borrows the fewest foreign notes,
    // keeping the declared colour when nothing beats it.
    let best = declared;
    let bestForeign = countForeignTones(rootPitchClass, declared, pitchClasses);
    for (const type of TRIAD_CANDIDATES) {
        const foreign = countForeignTones(rootPitchClass, type, pitchClasses);
        if (foreign < bestForeign) {
            best = type;
            bestForeign = foreign;
        }
    }
    return best;
}

/**
 * Best seventh chord for a scale degree, built on top of that degree's triad.
 * Falls back to the plain triad when the scale offers no usable seventh.
 *
 * @param {number} degree - Scale degree index (0-based)
 * @param {string} mode - Mode/scale name
 * @returns {string} Chord type key
 */
export function getScaleSeventh(degree, mode) {
    const scale = getScaleDegrees(mode);
    const rootPitchClass = ((scale[degree % scale.length] % 12) + 12) % 12;
    const pitchClasses = getHarmonyPitchClasses(mode);
    const triad = getScaleTriad(degree, mode);

    const candidates = SEVENTH_CANDIDATES[triad] || [];
    const seventh = candidates.find(type => chordFitsScale(rootPitchClass, type, pitchClasses));
    return seventh || triad;
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
    const bassPC = ((bassNote % 12) + 12) % 12;
    const bassIndex = uniquePCs.indexOf(bassPC);
    if (bassIndex === -1) return [];
    const remaining = [...uniquePCs.slice(bassIndex + 1), ...uniquePCs.slice(0, bassIndex)];

    const voicing = [bassNote];
    let currentNote = bassNote;

    for (let i = 0; i < remaining.length; i++) {
        const targetPC = remaining[i];
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
            if (new Set(voicing.map(n => ((n % 12) + 12) % 12)).size === uniquePCs.length) {
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

        // Move into a comfortable range (C4 = 60) by whole octaves. Offsetting
        // by an arbitrary number of semitones transposed the chord itself: an
        // Am first chord came out as Cm.
        const targetBass = 60;
        const offset = Math.round((targetBass - bass) / 12) * 12;
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

/**
 * The pitch classes of a voiced chord in the order of its root-position chord,
 * root first, so a ninth chord reads 1 3 5 7 9 whatever its inversion. The
 * root is the pitch class on which the type's intervals give the chord's
 * pitch classes; for a symmetrical chord several qualify, and any of them gives
 * the same cyclic order.
 */
function rootPositionPitchClasses(notes, chordType) {
    const pitchClasses = new Set(notes.map(note => ((note % 12) + 12) % 12));
    const intervals = CHORD_INTERVALS[chordType];
    if (intervals) {
        for (let root = 0; root < 12; root++) {
            const ordered = [...new Set(intervals.map(interval => (root + interval) % 12))];
            if (ordered.length === pitchClasses.size && ordered.every(pc => pitchClasses.has(pc))) return ordered;
        }
    }
    return [...pitchClasses];
}

/**
 * The Pedal style (docs/improvements/11-pedal-voicing-style.md): the first
 * chord's bass, placed in C3-B3 (MIDI 48-59), is held under every chord that
 * contains it, the chord's other notes stacked closely above it in
 * root-position order. A chord without that note takes its nearest inversion
 * to the previous chord, raised by octaves until nothing sounds below the
 * pedal: Pad Perform plays one pad at a time, so a pedal cannot sound under a
 * chord that omits it.
 *
 * @param {Array<Object>} chords - Chords with notes and chordType
 * @param {number} [pedalPitchClass] - The pedal's pitch class; by default the
 *   lowest note of the first chord's. The palette passes the progression's.
 * @returns {Array<Object>} The chords, re-voiced
 */
export function applyPedalVoicing(chords, pedalPitchClass = chords.length ? ((Math.min(...chords[0].notes) % 12) + 12) % 12 : 0) {
    if (chords.length === 0) return chords;
    const pedal = 48 + pedalPitchClass;

    let previous = null;
    return chords.map(chord => {
        const pitchClasses = rootPositionPitchClasses(chord.notes, chord.chordType);
        let voicing = null;
        const pedalIndex = pitchClasses.indexOf(pedalPitchClass);
        if (pedalIndex !== -1) {
            const rotated = [...pitchClasses.slice(pedalIndex), ...pitchClasses.slice(0, pedalIndex)];
            const built = buildVoicingFromBass(pedal, rotated);
            // Within two octaves of the pedal every pitch class should fit; if
            // one ever does not, the chord is voiced as if it lacked the pedal
            if (new Set(built.map(note => note % 12)).size === pitchClasses.length) voicing = built;
        }
        if (voicing === null) {
            voicing = findBestVoicing(chord.notes, previous ?? chord.notes);
            while (Math.min(...voicing) < pedal) voicing = voicing.map(note => note + 12);
        }
        previous = voicing;
        return { ...chord, notes: voicing };
    });
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
        const dropped = openVoiced[openVoiced.length - 2] - 12;
        // Clamp to musically useful range (C2=36 minimum)
        openVoiced[openVoiced.length - 2] = dropped < 36 ? dropped + 12 : dropped;
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
// Spelling: letters for roots and chord tones
// ============================================================================
//
// A note is spelled by its scale degree, never by its pitch class: the vi of A
// major is F♯, not G♭, and the fourth of Csus4 is F, not E♯. The rules are
// docs/improvements/13-spelling.md: a root takes the letter of its degree (D1),
// the tonic of a two-named key is the name whose scale needs fewer accidentals
// (D2), a root is respelled only when that gives a double accidental or an E♯,
// B♯, C♭ or F♭ the key does not have (D3), and chord tones take their letters
// from CHORD_DEGREES (D4).
//
// A spelled note is { letter, accidental }: a letter index (C=0 ... B=6) and an
// accidental in semitones (-2 is a double flat). Names are ASCII ('F#', 'Bb',
// 'F##', 'Bbb'), as chord names are; a display converts where it wants glyphs.

const LETTERS = 'CDEFGAB';
const LETTER_PITCH_CLASSES = [0, 2, 4, 5, 7, 9, 11];
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];
const NATURAL_MINOR_STEPS = [0, 2, 3, 5, 7, 8, 10];
const SPELLING_NUMERALS = { I: 0, II: 1, III: 2, IV: 3, V: 4, VI: 5, VII: 6 };
const mod12 = n => ((n % 12) + 12) % 12;

/**
 * A degree's semitones above the tonic, the inverse of rootDegree(): { step: 7,
 * alteration: -1 } (♭VII) is 10.
 *
 * @param {{step: number, alteration: number}} degree - From rootDegree()
 * @returns {number} 0-11
 */
export function degreeSemitones(degree) {
    return mod12(MAJOR_STEPS[degree.step - 1] + degree.alteration);
}

// The augmented sixths stand on ♭VI and the tritone substitute on ♭II; their
// numerals are fixed strings, not degrees (spec 13 §3.3 step 3).
const NUMERAL_ALIASES = { 'It+6': '♭VI', 'Fr+6': '♭VI', 'Ger+6': '♭VI', SubV7: '♭II' };

/** The note with this letter that sounds this pitch class, by the smaller accidental. */
function letterNote(letter, pitchClass) {
    const index = ((letter % 7) + 7) % 7;
    return { letter: index, accidental: mod12(pitchClass - LETTER_PITCH_CLASSES[index] + 6) - 6 };
}

const notePitchClass = note => mod12(LETTER_PITCH_CLASSES[note.letter] + note.accidental);

const accidentalText = accidental => (accidental > 0 ? '#' : 'b').repeat(Math.abs(accidental));

/** 'F#', 'Bb', 'C', 'F##': the ASCII name of a spelled note. */
function noteName(note) {
    return LETTERS[note.letter] + accidentalText(note.accidental);
}

/** A key selector name ('C♯', 'D♭', 'G') as a spelled note. Glyphs or ASCII. */
function parseNoteName(name) {
    const match = /^([A-G])([♯#]*|[♭b]*)$/.exec(name);
    if (!match) throw new Error(`Not a note name: ${JSON.stringify(name)}`);
    const sign = /[♭b]/.test(match[2]) ? -1 : 1;
    return { letter: LETTERS.indexOf(match[1]), accidental: sign * [...match[2]].length };
}

/**
 * The plainest name of a pitch class: the natural when it is a white key, else
 * one accidental on the side given (D3), sharp for a positive side.
 */
function plainestNote(pitchClass, side) {
    const natural = LETTER_PITCH_CLASSES.indexOf(pitchClass);
    if (natural !== -1) return { letter: natural, accidental: 0 };
    return side < 0
        ? letterNote(LETTER_PITCH_CLASSES.indexOf(mod12(pitchClass + 1)), pitchClass)
        : letterNote(LETTER_PITCH_CLASSES.indexOf(mod12(pitchClass - 1)), pitchClass);
}

/** A seven-note scale spelled on consecutive letters from its tonic. */
function spellScale(tonic, steps) {
    const tonicPitchClass = notePitchClass(tonic);
    return steps.map((step, index) => letterNote(tonic.letter + index, tonicPitchClass + step));
}

const accidentalCount = notes => notes.reduce((sum, note) => sum + Math.abs(note.accidental), 0);

/**
 * The tonic of a key (D2): of the key's names ('C♯/D♭' has two), the one whose
 * reference scale needs fewer accidentals; on a tie, the first. The reference
 * scale is seven steps in semitones: major or natural minor in template mode,
 * the scale itself (or its parent) in Scale Mode. Gives the table of spec 13
 * §3.2: D♭ major but C♯ minor, A♭ major but G♯ minor, F♯ major and D♯ minor
 * by the tie rule.
 *
 * @param {string} key - A key selector name, e.g. 'C♯/D♭'
 * @param {number[]} referenceSteps - Seven scale steps in semitones
 * @returns {{letter: number, accidental: number}} The spelled tonic
 */
export function spellTonic(key, referenceSteps) {
    let best = null;
    let bestCount = Infinity;
    for (const tonic of key.split('/').map(parseNoteName)) {
        const count = accidentalCount(spellScale(tonic, referenceSteps));
        if (count < bestCount) {
            best = tonic;
            bestCount = count;
        }
    }
    return best;
}

/**
 * The spelling context of Progression Palette Mode: a key and a template
 * tonality. Numerals are read against the major scale in either tonality, as
 * the engine reads them; the tonality picks the tonic (C♯ minor, D♭ major) and
 * the scale whose notes D3 never respells.
 *
 * @param {string} key - A key selector name
 * @param {'major'|'minor'} [tonality='major'] - From templateTonality()
 * @returns {Object} A context for getChordName(), spellRoot() and spellChord()
 */
export function templateSpelling(key, tonality = 'major') {
    const steps = tonality === 'minor' ? NATURAL_MINOR_STEPS : MAJOR_STEPS;
    const scale = spellScale(spellTonic(key, steps), steps);
    return { kind: 'template', tonic: scale[0], scale, pitchClasses: new Set(scale.map(notePitchClass)) };
}

/**
 * The spelling context of Scale Mode. A seven-note scale gives each degree the
 * next letter; an abridged scale uses its parent's letters (D8), as it uses
 * its parent's chords. The symmetrical scales - whole tone, augmented, both
 * diminished - have no letter per degree, so their roots are spelled by pitch
 * class on the tonic's side, sharps for a natural tonic, and their tonic is
 * the key's first name.
 *
 * @param {string} key - A key selector name
 * @param {string} mode - A scale name
 * @returns {Object} A context for getChordName(), spellRoot() and spellChord()
 */
export function scaleSpelling(key, mode) {
    const own = getScaleDegrees(mode);
    const parent = SCALE_HARMONY_PARENT[mode];
    const steps = own.length === 7 ? own : parent ? getScaleDegrees(parent) : null;
    if (steps) {
        const scale = spellScale(spellTonic(key, steps), steps);
        return { kind: 'scale', tonic: scale[0], scale, pitchClasses: new Set(scale.map(notePitchClass)) };
    }
    const tonic = parseNoteName(key.split('/')[0]);
    const tonicPitchClass = notePitchClass(tonic);
    return { kind: 'scale', tonic, scale: null, pitchClasses: new Set(own.map(step => mod12(tonicPitchClass + step))) };
}

/**
 * The note a numeral names above a reference note, read against the major
 * scale: the letter is the reference's plus the degree, the pitch class the
 * reference's plus the major-scale step plus the numeral's accidentals.
 */
function numeralNote(reference, numeral) {
    const parsed = parseRomanStem(numeral);
    if (!parsed || parsed.degree === null) return null;
    const index = SPELLING_NUMERALS[parsed.degree];
    let shift = 0;
    for (const symbol of parsed.accidentals) shift += symbol === '♭' || symbol === 'b' ? -1 : 1;
    return letterNote(reference.letter + index, notePitchClass(reference) + MAJOR_STEPS[index] + shift);
}

/**
 * The root of a chord, spelled (D1, D3). In template mode it is read from the
 * numeral: an applied chord V/x stands on the degree its numerator names above
 * its target, so a fifth and four letters up; It+6, Fr+6 and Ger+6 stand on
 * ♭VI and SubV7 on ♭II. In Scale Mode it is the scale's note at that many
 * semitones above the tonic. Then D3: a double accidental, or an E♯, B♯, C♭ or
 * F♭ the key's scale does not have, becomes its plainest name.
 *
 * @param {Object} spelling - From templateSpelling() or scaleSpelling()
 * @param {{romanNumeral?: string, semitones?: number}} position - The numeral
 *   (template mode) or the root's semitones above the tonic (Scale Mode)
 * @returns {{letter: number, accidental: number}} The spelled root
 */
export function spellRoot(spelling, position = {}) {
    const note = functionalRoot(spelling, position);
    const pitchClass = notePitchClass(note);
    const awkward = (note.accidental === 1 && (note.letter === 2 || note.letter === 6)) // E♯, B♯
        || (note.accidental === -1 && (note.letter === 0 || note.letter === 3));        // C♭, F♭
    if (Math.abs(note.accidental) >= 2 || (awkward && !spelling.pitchClasses.has(pitchClass))) {
        return plainestNote(pitchClass, Math.sign(note.accidental));
    }
    return note;
}

/**
 * The root as its function names it, before spellRoot() respells an awkward
 * name: in C♯ major the ♯iv° stands on F𝄪, which the pad shows as G. A degree
 * is read from this note, so that it agrees with the numeral.
 */
function functionalRoot(spelling, { romanNumeral = '', semitones = null } = {}) {
    let note;
    if (spelling.kind === 'template') {
        const numeral = NUMERAL_ALIASES[romanNumeral] || romanNumeral;
        const slash = numeral.indexOf('/');
        if (slash === -1) {
            note = numeralNote(spelling.tonic, numeral);
        } else {
            const target = numeralNote(spelling.tonic, numeral.slice(slash + 1));
            note = target && numeralNote(target, numeral.slice(0, slash));
        }
        if (!note) throw new Error(`Cannot spell the root of the numeral ${JSON.stringify(romanNumeral)}`);
    } else {
        const pitchClass = mod12(notePitchClass(spelling.tonic) + semitones);
        note = spelling.scale?.find(scaleNote => notePitchClass(scaleNote) === pitchClass)
            // A symmetrical scale, or the one note an abridged scale has and its
            // parent lacks (the blues scale's ♭5): the tonic's side
            ?? plainestNote(pitchClass, spelling.tonic.accidental < 0 ? -1 : 1);
    }
    return note;
}

/**
 * A pad's degree: its root's letter counted from the tonic's, and how far the
 * root lies from that degree of the tonic's major scale
 * (docs/improvements/17-scale-mode-numerals-and-descriptions.md D8). V7/V in C
 * is { step: 2, alteration: 0 }, ♭VII { step: 7, alteration: -1 }.
 *
 * @param {Object} spelling - From templateSpelling() or scaleSpelling()
 * @param {{romanNumeral?: string, semitones?: number}} position - As for spellRoot()
 * @returns {{step: number, alteration: number}} step 1-7
 */
export function rootDegree(spelling, position) {
    const note = functionalRoot(spelling, position);
    const step = ((note.letter - spelling.tonic.letter) % 7 + 7) % 7;
    const expected = mod12(notePitchClass(spelling.tonic) + MAJOR_STEPS[step]);
    let alteration = mod12(notePitchClass(note) - expected);
    if (alteration > 6) alteration -= 12;
    return { step: step + 1, alteration };
}

// '#5' -> { number: 5, semitones: 8 }. A 9th to a 13th is the 2nd to the 6th
// an octave up.
function parseDegree(degree) {
    const [, accidental, digits] = /^(bb|b|#)?(\d+)$/.exec(degree);
    const number = Number(digits);
    const simple = ((number - 1) % 7) + 1;
    const shift = accidental === 'bb' ? -2 : accidental === 'b' ? -1 : accidental === '#' ? 1 : 0;
    return { number, semitones: MAJOR_STEPS[simple - 1] + (number > 7 ? 12 : 0) + shift };
}

/**
 * Spell a voiced chord (D4): the root by spellRoot(), each note by the degree
 * of CHORD_DEGREES whose pitch class it has, the letter that degree's number
 * minus one above the root's. Notes come out in voicing order, the bass first,
 * and the octave follows the letter, so B♯ is written in the octave of the B
 * below the C it sounds as and C♭ in the octave of the C above; MIDI 60 is C3,
 * as everywhere in the app.
 *
 * @param {Object} spelling - From templateSpelling() or scaleSpelling()
 * @param {{romanNumeral?: string, semitones?: number}} position - As for spellRoot()
 * @param {string} chordType - Chord type key
 * @param {number[]} notes - The voiced MIDI notes
 * @returns {{root: string, notes: string[]}} e.g. { root: 'F#', notes: ['C#4', 'F#4', 'A4'] }
 */
export function spellChord(spelling, position, chordType, notes) {
    const root = spellRoot(spelling, position);
    const rootPitchClass = notePitchClass(root);
    const letterByPitchClass = new Map();
    for (const degree of CHORD_DEGREES[chordType] || CHORD_DEGREES.major) {
        const { number, semitones } = parseDegree(degree);
        letterByPitchClass.set(mod12(rootPitchClass + semitones), root.letter + number - 1);
    }
    return {
        root: noteName(root),
        notes: notes.map(midi => {
            const letter = letterByPitchClass.get(mod12(midi));
            // A note the chord type does not have cannot happen (audit check B);
            // if it did, audit check S3 would report the letter this gives it
            const note = letter === undefined ? plainestNote(mod12(midi), root.accidental < 0 ? -1 : 1) : letterNote(letter, mod12(midi));
            return noteName(note) + (Math.floor((midi - note.accidental) / 12) - 2);
        })
    };
}

/**
 * Chord Matcher dropdown value -> chord type. Single source of truth shared by
 * the dropdown, the compatibility analysis, the pad highlighting and the
 * palette injection, so adding a quality to the dropdown is enough to make it
 * work everywhere.
 */
export const MATCHER_QUALITY_TYPES = {
    'major': 'major',
    'minor': 'minor',
    'dim': 'diminished',
    'aug': 'augmented',
    'sus2': 'sus2',
    'sus4': 'sus4',
    '7': 'dom7',
    'maj7': 'major7',
    'm7': 'minor7',
    'm7b5': 'm7b5',
    'dim7': 'dim7',
    'mMaj7': 'minMaj7',
    '6': 'major6',
    'm6': 'minor6'
};

/**
 * Suffix appended to a root note to name a chord (e.g. 'minor7' -> 'm7').
 * Kept ASCII so exported .progression chord names stay safe on MPC hardware.
 */
export const CHORD_NAME_SUFFIX = {
    'major': '',
    'minor': 'm',
    'diminished': 'dim',
    'augmented': 'aug',
    'minAug': 'm#5',
    'sus2': 'sus2',
    'sus4': 'sus4',
    'major7': 'maj7',
    'minor7': 'm7',
    'dom7': '7',
    'dim7': 'dim7',
    'dom7sus4': '7sus4',
    'm7b5': 'm7b5',
    'minMaj7': 'mMaj7',
    'aug7': 'aug7',
    'augMaj7': 'augMaj7',
    'aug9': 'aug9',
    'major9': 'maj9',
    'minor9': 'm9',
    'dom9': '9',
    'dom7b9': '7b9',
    'dom7sharp9': '7#9',
    'major11': 'maj11',
    'minor11': 'm11',
    'dom11': '11',
    'major13': 'maj13',
    'minor13': 'm13',
    'dom13': '13',
    'dom7alt': '7alt',
    'dom7b5': '7b5',
    // Stacked fourths, named as the seventh chords they are. C F B♭ is how a
    // jazz player voices a 7sus4 with the fifth left out; four stacked fourths,
    // C F B♭ E♭, read as a minor eleventh, as the So What chord does. 'sus4' and
    // 'sus4(add11)' named a root, a fourth and a fifth the pad does not sound.
    // '(no5)' keeps quartal distinct from dom7sus4, which owns '7sus4'.
    'quartal': '7sus4(no5)',
    'quartal4': 'm7(11)',
    'add9': 'add9',
    'minAdd9': 'madd9',
    'add11': 'add11',
    'major6': '6',
    'minor6': 'm6',
    'maj6/9': '6/9',
    // An augmented sixth is heard and played as a dominant-family sonority -
    // It6 [0,4,10] and Ger6 [0,4,7,10] are literally a dom7 (Ger6 complete,
    // It6 without the 5th), Fr6 [0,4,6,10] a dom7b5. 'AbGer+6' is not a chord
    // symbol any musician reads; the augmented-sixth function is already
    // carried by the roman numeral (It+6/Fr+6/Ger+6 in CHORD_TYPE_DISPLAY,
    // below), which this suffix does not touch.
    'It6': '7',
    'Fr6': '7b5',
    'Ger6': '7'
};

/**
 * Naming suffix for a chord type (e.g. 'm7b5').
 *
 * @param {string} chordType - Chord type key
 * @returns {string} Suffix appended to the root note name
 */
export function getChordSuffix(chordType) {
    return CHORD_NAME_SUFFIX[chordType] || '';
}

/**
 * A chord's name: its spelled root and its suffix, 'F#m' for the vi of A major.
 * The one producer of chord names, in both modes; generation passes the
 * spelling context of the key it is in (docs/improvements/13-spelling.md §3.5).
 *
 * @param {Object} spelling - From templateSpelling() or scaleSpelling()
 * @param {{romanNumeral?: string, semitones?: number}} position - The numeral
 *   (template mode) or the root's semitones above the tonic (Scale Mode)
 * @param {string} chordType - Chord type key
 * @returns {string} e.g. 'F#m', 'Bb7', 'Ab7' for a German sixth in C
 */
export function getChordName(spelling, position, chordType) {
    return noteName(spellRoot(spelling, position)) + getChordSuffix(chordType);
}

/**
 * Slash notation for an inverted chord: '/E3' when the bass, the first of the
 * spelled notes, is not the root; '' in root position. Read from pad.spelling,
 * so the bass is spelled as the chord spells it.
 *
 * @param {{root: string, notes: string[]}} spelling - A pad's spelling
 * @returns {string} '' or '/' followed by the bass with its octave
 */
export function getInversionNotation(spelling) {
    const bass = spelling?.notes?.[0];
    if (!bass) return '';
    return bass.replace(/-?\d+$/, '') === spelling.root ? '' : '/' + bass;
}

/**
 * How each chord type is displayed and analysed.
 *   label     - user-facing quality shown on the pad
 *   lowercase - roman numeral is written in lower case (minor-family chords)
 *   suffix    - appended to the roman numeral
 * Anything absent falls back to a plain major reading. Exported for audit
 * check M, which forbids two types sharing a suffix; nothing else reads it directly.
 */
export const CHORD_TYPE_DISPLAY = {
    major: { label: 'Major', suffix: '' },
    minor: { label: 'Minor', lowercase: true, suffix: '' },
    diminished: { label: 'Diminished', lowercase: true, suffix: '°' },
    augmented: { label: 'Augmented', suffix: '+' },
    minAug: { label: 'Minor ♯5', lowercase: true, suffix: '♯5' },
    sus2: { label: 'Suspended', suffix: 'sus2' },
    sus4: { label: 'Suspended', suffix: 'sus4' },
    quartal: { label: 'Quartal', suffix: '7sus4(no5)' },
    quartal4: { label: 'Quartal', lowercase: true, suffix: '7(11)' },
    major7: { label: 'Major 7', suffix: 'M7' },
    minor7: { label: 'Minor 7', lowercase: true, suffix: '7' },
    dom7: { label: 'Dominant 7', suffix: '7' },
    dom7sus4: { label: 'Suspended', suffix: '7sus4' },
    dim7: { label: 'Diminished 7', lowercase: true, suffix: '°7' },
    m7b5: { label: 'Half-Diminished', lowercase: true, suffix: 'ø7' },
    minMaj7: { label: 'Minor-Major 7', lowercase: true, suffix: '(maj7)' },
    aug7: { label: 'Augmented 7', suffix: '+7' },
    augMaj7: { label: 'Augmented Major 7', suffix: '+M7' },
    aug9: { label: 'Augmented 9', suffix: '+9' },
    major6: { label: 'Major 6', suffix: '6' },
    minor6: { label: 'Minor 6', lowercase: true, suffix: '6' },
    'maj6/9': { label: 'Major 6/9', suffix: '6/9' },
    major9: { label: 'Major 9', suffix: 'M9' },
    minor9: { label: 'Minor 9', lowercase: true, suffix: '9' },
    dom9: { label: 'Dominant 9', suffix: '9' },
    dom7b9: { label: 'Dominant 7♭9', suffix: '7♭9' },
    dom7sharp9: { label: 'Dominant 7♯9', suffix: '7♯9' },
    dom7b5: { label: 'Dominant 7♭5', suffix: '7♭5' },
    dom7alt: { label: 'Altered Dominant', suffix: '7alt' },
    major11: { label: 'Major 11', suffix: 'M11' },
    minor11: { label: 'Minor 11', lowercase: true, suffix: '11' },
    dom11: { label: 'Dominant 11', suffix: '11' },
    major13: { label: 'Major 13', suffix: 'M13' },
    minor13: { label: 'Minor 13', lowercase: true, suffix: '13' },
    dom13: { label: 'Dominant 13', suffix: '13' },
    add9: { label: 'Add 9', suffix: 'add9' },
    minAdd9: { label: 'Minor Add 9', lowercase: true, suffix: 'add9' },
    add11: { label: 'Add 11', suffix: 'add11' },
    It6: { label: 'Italian 6th', suffix: '' },
    Fr6: { label: 'French 6th', suffix: '' },
    Ger6: { label: 'German 6th', suffix: '' }
};

const DEFAULT_CHORD_DISPLAY = { label: 'Major', suffix: '' };

/**
 * User-facing quality label for a chord type (e.g. 'm7b5' -> 'Half-Diminished').
 *
 * @param {string} chordType - Chord type key
 * @returns {string} Display label
 */
export function getQualityLabel(chordType) {
    return (CHORD_TYPE_DISPLAY[chordType] || DEFAULT_CHORD_DISPLAY).label;
}

/**
 * Roman numeral for a scale degree, cased and suffixed to match the chord type.
 * e.g. (6, 'm7b5') -> 'viiø7', (0, 'minMaj7') -> 'i(maj7)'.
 *
 * @param {number} degree - Scale degree index (0-based)
 * @param {string} chordType - Chord type key
 * @returns {string} Roman numeral
 */
export function getRomanNumeralForChord(degree, chordType) {
    const display = CHORD_TYPE_DISPLAY[chordType] || DEFAULT_CHORD_DISPLAY;
    const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    const base = numerals[degree % numerals.length] || 'I';
    return (display.lowercase ? base.toLowerCase() : base) + display.suffix;
}

/**
 * A Scale Mode numeral (spec 17 D1-D3): the parallel-major convention templates
 * use, read from the pad's degree, so Dorian's E♭ is ♭III and Pentatonic Major's
 * G is V. The case follows the chord type; a suspended chord, which has no
 * third, takes the case its degree's triad would have.
 *
 * @param {{step: number, alteration: number}} degree - From rootDegree()
 * @param {string} chordType - Chord type key
 * @param {boolean} [lowerCase] - The case of a suspended chord's degree
 * @returns {string} e.g. '♭III', 'iiø7', '♯IV7♭5', 'isus4'
 */
export function scaleModeNumeral(degree, chordType, lowerCase) {
    const display = CHORD_TYPE_DISPLAY[chordType] || DEFAULT_CHORD_DISPLAY;
    const stem = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][degree.step - 1];
    const accidental = degree.alteration > 0 ? '♯'.repeat(degree.alteration) : '♭'.repeat(-degree.alteration);
    const lower = getChordFamily(chordType) === 'suspended' ? !!lowerCase : !!display.lowercase;
    return accidental + (lower ? stem.toLowerCase() : stem) + display.suffix;
}

/**
 * Roman numeral suffix for a chord type (e.g. 'm7b5' -> 'ø7'). Used when the
 * numeral stem already exists, such as a borrowed '♭VII'.
 *
 * @param {string} chordType - Chord type key
 * @returns {string} Suffix
 */
export function getRomanSuffix(chordType) {
    return (CHORD_TYPE_DISPLAY[chordType] || DEFAULT_CHORD_DISPLAY).suffix;
}

/**
 * Splits a roman numeral into the parts a caller usually wants: its leading
 * accidentals, its stem of i, v, I and V, whether the stem is lower case, and
 * the degree it names. Everything after the stem (7, M7, °, ø7, (maj7), sus4)
 * and everything after a slash is ignored; a caller that needs them reads the
 * numeral itself. The one parser for numerals, shared by the row-4 classifier in
 * generation.js and by tools/audit-theory.mjs (docs/improvements/03-row4-function-scoring.md).
 *
 * The augmented sixths ('It+6', 'Fr+6', 'Ger+6') and 'SubV7' are not degree
 * numerals; their stems would parse as a tonic or a dominant, so a caller must
 * recognise them first.
 *
 * @param {string} numeral - e.g. '♭VII7', 'vii°', 'iii7', 'V7/ii'
 * @returns {{accidentals: string, stem: string, lower: boolean, degree: string|null}|null}
 *   null when the numeral has no stem. `degree` is the upper-cased stem when it
 *   is one of I to VII, otherwise null. `accidentals` is a run of ♭ ♯ b #.
 */
export function parseRomanStem(numeral) {
    const match = /^([♭♯#b]*)([ivIV]+)/.exec(numeral || '');
    if (!match) return null;
    const stem = match[2];
    const degree = stem.toUpperCase();
    return {
        accidentals: match[1],
        stem,
        lower: stem === stem.toLowerCase(),
        degree: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'].includes(degree) ? degree : null
    };
}

/**
 * Which triad a chord type is built on, so extensions can be offered only on
 * degrees where they make sense: a dom13 belongs on a major degree, a minor11
 * on a minor one, and suspended sonorities fit either.
 *
 * @param {string} chordType - Chord type key
 * @returns {string} 'major' | 'minor' | 'diminished' | 'augmented' | 'suspended'
 */
export function getChordFamily(chordType) {
    const intervals = CHORD_INTERVALS[chordType];
    if (!intervals) return 'major';

    const degrees = new Set(intervals.map(interval => interval % 12));
    if (degrees.has(3) && degrees.has(6)) return 'diminished';
    if (degrees.has(4) && degrees.has(8) && !degrees.has(7)) return 'augmented';
    if (degrees.has(3) && degrees.has(7)) return 'minor';
    if (degrees.has(4) && degrees.has(7)) return 'major';
    if (degrees.has(4)) return 'major';
    if (degrees.has(3)) return 'minor';
    return 'suspended';
}

// ============================================================================
// WHAT A PROGRESSION CHORD IS, AND HOW A PAD DESCRIBES ITSELF
// docs/improvements/14-pad-descriptions-and-analysis.md
// ============================================================================

const pitchClassSet = list => new Set(list);

// Pitch classes above the tonic (spec 14 D2)
const DIATONIC_PITCH_CLASSES = {
    major: pitchClassSet([0, 2, 4, 5, 7, 9, 11]),
    minor: pitchClassSet([0, 2, 3, 5, 7, 8, 10, 11])      // natural minor and its raised seventh
};
const PARALLEL_SOURCES = {
    // A major key borrows from Aeolian, Dorian, Phrygian and harmonic minor.
    // Lydian is left out, or ♯iv° would read as a borrowing.
    major: [[0, 2, 3, 5, 7, 8, 10], [0, 2, 3, 5, 7, 9, 10], [0, 1, 3, 5, 7, 8, 10], [0, 2, 3, 5, 7, 8, 11]].map(pitchClassSet),
    // A minor key borrows from Ionian, Dorian and Phrygian (the Neapolitan)
    minor: [[0, 2, 4, 5, 7, 9, 11], [0, 2, 3, 5, 7, 9, 10], [0, 1, 3, 5, 7, 8, 10]].map(pitchClassSet)
};
const AUGMENTED_SIXTHS = new Set(['It+6', 'Fr+6', 'Ger+6']);

// A major third and a minor seventh: the dominant family, whatever is added
function isDominantType(chordType) {
    const intervals = new Set((CHORD_INTERVALS[chordType] || []).map(interval => interval % 12));
    return intervals.has(4) && intervals.has(10);
}

// A dominant on ♭II, or SubV7: the tritone substitute of V7 (spec 14 D3, D12)
function isTritoneSubstitute(romanNumeral, chordType) {
    if (/^SubV/.test(romanNumeral)) return true;
    if (romanNumeral.includes('/')) return false;
    const parsed = parseRomanStem(romanNumeral);
    return !!parsed && /[♭b]/.test(parsed.accidentals) && parsed.degree === 'II' && isDominantType(chordType);
}

/**
 * What a progression chord is in its key, for the analysis line under each
 * variant: 'diatonic', 'borrowed' (modal interchange), 'applied' (a secondary
 * chord) or 'chromatic'. The first rule that matches decides; the table and its
 * reasons are in docs/improvements/14-pad-descriptions-and-analysis.md §4.1.
 *
 * @param {{romanNumeral: string, chordType: string, notes: number[]}} pad
 * @param {'major'|'minor'} tonality - The template's, from templateTonality()
 * @param {number} tonicPitchClass - The key's tonic, 0-11
 * @returns {'diatonic'|'borrowed'|'applied'|'chromatic'}
 */
export function classifyProgressionChord(pad, tonality, tonicPitchClass) {
    const numeral = pad.romanNumeral || '';
    const chordType = pad.chordType;
    const parsed = parseRomanStem(numeral.split('/')[0]);
    const accidental = parsed ? parsed.accidentals : '';
    const degree = parsed ? parsed.degree : null;
    const flat = /[♭b]/.test(accidental);
    const family = getChordFamily(chordType);
    const dominant = isDominantType(chordType);
    const major = tonality !== 'minor';

    // 1. An applied chord written as one
    if (numeral.includes('/')) return 'applied';
    // 2. Augmented sixths, the augmented family and the line cliché's minor ♯5:
    //    i♯5 sounds E G C in E minor but is spelled E G B♯ (spec 13 D5)
    if (AUGMENTED_SIXTHS.has(numeral) || family === 'augmented' || chordType === 'minAug') return 'chromatic';
    // 3. The tritone substitute
    if (isTritoneSubstitute(numeral, chordType)) return 'chromatic';
    // 4. A dominant seventh on II, III, VI or VII in a major key is a secondary
    //    dominant; a plain major triad there is not decided here (D6)
    if (major && !accidental && ['II', 'III', 'VI', 'VII'].includes(degree) && dominant) return 'applied';
    // 5. A minor chord on a flattened degree: double mixture. Its C♭ shares a
    //    pitch class with the leading tone B, so pitch classes cannot tell (D8)
    if (flat && parsed.lower && family === 'minor') return 'chromatic';
    // 6. A diminished chord off the key's own degrees: passing or leading-tone
    if (family === 'diminished' && !(!accidental && (degree === 'VII' || degree === 'II'))) return 'chromatic';
    // 7. The blues I7 and IV7 (D5)
    if (major && !accidental && (degree === 'I' || degree === 'IV') && dominant) return 'diatonic';

    const pitchClasses = (pad.notes || []).map(note => ((note - tonicPitchClass) % 12 + 12) % 12);
    // 8. Every note in the key
    if (pitchClasses.every(pc => DIATONIC_PITCH_CLASSES[major ? 'major' : 'minor'].has(pc))) return 'diatonic';
    // 9. Every note in one parallel mode
    if (PARALLEL_SOURCES[major ? 'major' : 'minor'].some(source => pitchClasses.every(pc => source.has(pc)))) return 'borrowed';
    // 10. Anything else
    return 'chromatic';
}

// Quality markings that do not change what a numeral does: 'VIIØ7' -> 'VII',
// 'I7SUS4(NO5)' -> 'I', 'II7(11)' -> 'II'
const QUALITY_MARKINGS = /M7|MAJ7|\(MAJ7\)|\(NO5\)|\(11\)|7|°|Ø|\+|DIM|SUS[24]|ADD9|6|9|11|13/g;
// The same markings in a numeral whose case is kept: 'vi7' -> 'vi', 'IM7' -> 'I'
const QUALITY_MARKINGS_CASE_KEPT = /M7|\(maj7\)|\(no5\)|\(11\)|7|°|ø|\+|sus[24]|add9|6|9|11|13/g;

/**
 * The i18n key of a pad's description (spec 14 §4.2). In order: the tritone
 * substitute; then, in a template, the table of its tonality - chordRolesMinor
 * or chordRolesMajor - where a numeral reads as written, then as its diminished
 * triad if it has one ('iiø7' and 'ii°' read 'II°', 'vii°7' reads 'VII°'), then
 * without quality markings with its case kept ('iv7' reads 'iv'), then upper-cased
 * without them ('V7/iv' reads 'V/IV'); then chordRoles, where case matters first
 * (vi, the relative minor, is not VI, a chromatic mediant) and then does not;
 * then the chord type, the chord family, and the generic texts. Scale Mode passes
 * no tonality: a Scale Mode i is its scale's tonic, not a borrowing.
 *
 * @param {string} romanNumeral - e.g. 'viiø7', '♭VII', 'V7/V'
 * @param {string} chordType - Chord type key, e.g. 'm7b5'
 * @param {string} [tonality] - The template's, 'major' or 'minor'
 * @param {(key: string) => boolean} has - Whether an i18n key exists
 * @returns {string} An i18n key
 */
export function chordRoleKey(romanNumeral, chordType, tonality, has) {
    const numeral = romanNumeral || '';
    // Scale Mode outside Major and Minor: the scale is no key, so no numeral
    // text, written for keys, applies (spec 17 D4)
    if (!tonality) return chordTypeRoleKey(chordType, has);
    if (isTritoneSubstitute(numeral, chordType)) return 'chordRoles.SUBV7';

    const table = { minor: 'chordRolesMinor', major: 'chordRolesMajor' }[tonality];
    if (table && numeral) {
        const candidates = [numeral];
        if (/[°ø]/.test(numeral)) candidates.push(numeral.toUpperCase().replace('Ø', '°').replace(/°7$/, '°'));
        candidates.push(numeral.replaceAll(QUALITY_MARKINGS_CASE_KEPT, ''), numeral.toUpperCase().replaceAll(QUALITY_MARKINGS, ''));
        for (const candidate of candidates) {
            if (has(`${table}.${candidate}`)) return `${table}.${candidate}`;
        }
    }

    const upper = numeral.toUpperCase();
    const candidates = [
        `chordRoles.${numeral}`,
        `chordRoles.${upper}`,
        `chordRoles.${numeral.replaceAll(QUALITY_MARKINGS_CASE_KEPT, '')}`,
        `chordRoles.${upper.replaceAll(QUALITY_MARKINGS, '')}`,
        chordType ? `chordRoles.types.${chordType}` : null
    ].filter(Boolean);
    for (const candidate of candidates) {
        if (has(candidate)) return candidate;
    }

    const family = chordFamilyRoleKey(chordType);
    if (family) return family;
    if (upper.includes('♭') || upper.includes('♯')) return 'chordRoles.borrowed';
    return 'chordRoles.default';
}

// Generic descriptions by chord family
function chordFamilyRoleKey(chordType) {
    if (!chordType) return null;
    if (chordType.includes('sus') || chordType.startsWith('quartal')) return 'chordRoles.sus';
    if (chordType.includes('add9') || chordType === 'minAdd9') return 'chordRoles.add9';
    if (chordType === 'major6' || chordType === 'minor6' || chordType === 'maj6/9') return 'chordRoles.6';
    if (/9|11|13/.test(chordType)) return 'chordRoles.extended';
    return null;
}

// What a chord is, without what it does: its type's text, else its family's
function chordTypeRoleKey(chordType, has) {
    if (chordType && has(`chordRoles.types.${chordType}`)) return `chordRoles.types.${chordType}`;
    return chordFamilyRoleKey(chordType) || 'chordRoles.default';
}

/**
 * The i18n keys of a pad's plain-language phrase, "Major triad on the flattened
 * seventh degree" (spec 17 D6): its chord type's name and its degree's phrase.
 *
 * @param {{chordType: string, degree?: {step: number, alteration: number}}} pad
 * @returns {{name: string, degree: string}|null} null for a pad without a degree
 */
export function chordPhraseKeys(pad) {
    if (!pad || !pad.degree) return null;
    return { name: `chordTypeNames.${pad.chordType}`, degree: `degreePhrases.${degreePhraseKey(pad.degree)}` };
}

/** '1', 'b7', '#4': a degree as its phrase key, and as the pad's data-degree. */
export function degreePhraseKey(degree) {
    const sign = degree.alteration < 0 ? 'b' : degree.alteration > 0 ? '#' : '';
    return sign + degree.step;
}

/**
 * Rough "how much colour does this chord add" score, used to order the palette
 * from foundation chords to spicy ones. Triads are plain, sevenths add colour,
 * anything larger is an extension.
 *
 * @param {string} chordType - Chord type key
 * @returns {number} 1 (triad) to 3 (extended)
 */
export function getChordComplexity(chordType) {
    const size = (CHORD_INTERVALS[chordType] || []).length;
    if (size <= 3) return 1;
    if (size === 4) return 2;
    return 3;
}

// ============================================================================
// Progression Parsing and Generation
// ============================================================================

// A template is chord tokens joined by an em dash: 'I—V—vi—IV'. Exported for
// the audit, which splits templates into tokens itself.
export const TEMPLATE_SEPARATOR = '—';
const MAJOR_SCALE_SEMITONES = [0, 2, 4, 5, 7, 9, 11];
const STEM_DEGREE = { I: 0, II: 1, III: 2, IV: 3, V: 4, VI: 5, VII: 6 };

// The augmented sixths are never read from a template: their numerals are the
// fixed strings It+6, Fr+6 and Ger+6, built by the row-4 candidates.
const UNPARSED_CHORD_TYPES = new Set(['It6', 'Fr6', 'Ger6']);

/**
 * Numeral suffix -> chord type, keyed by the case of the stem: 'lower|7' is
 * minor7, 'upper|7' is dom7. Derived from CHORD_TYPE_DISPLAY, so reading a
 * numeral is the inverse of writing one and a new chord type becomes readable
 * in a template by being added to that table, nowhere else
 * (docs/improvements/06-template-parser.md).
 */
export const SUFFIX_TABLE = (() => {
    const table = new Map();
    for (const [type, display] of Object.entries(CHORD_TYPE_DISPLAY)) {
        if (UNPARSED_CHORD_TYPES.has(type)) continue;
        const key = `${display.lowercase ? 'lower' : 'upper'}|${display.suffix}`;
        // Audit check M forbids this too; failing here keeps the parser from
        // silently reading one of two chord types
        if (table.has(key)) throw new Error(`CHORD_TYPE_DISPLAY: ${table.get(key)} and ${type} share the numeral suffix ${key}`);
        table.set(key, type);
    }
    return table;
})();

// The chord type a suffix denotes after a stem of the given case. The case of
// a stem says whether the third is minor or major, so where it is what tells
// two chords apart it must match: lower-case '7' is a minor seventh, upper-case
// '7' a dominant one, and 'iM7' is an error rather than a major seventh. A
// suffix that fixes the third by itself - diminished, augmented, suspended -
// reads the same after either case, which is how the catalogue writes its
// chromatic passing chords: 'I°', '♯II°'.
function suffixChordType(stemIsLower, suffix) {
    const own = SUFFIX_TABLE.get(`${stemIsLower ? 'lower' : 'upper'}|${suffix}`);
    if (own) return own;
    const other = SUFFIX_TABLE.get(`${stemIsLower ? 'upper' : 'lower'}|${suffix}`);
    if (other && getChordFamily(other) !== 'major' && getChordFamily(other) !== 'minor') return other;
    return null;
}

// Applied dominants, 'V/ii' and 'V7/♭III': the root is a perfect fifth above
// the target, read against the major scale like every other numeral.
const APPLIED_CHORD = /^V(7?)\/([♭♯]?)(VII|VI|V|IV|III|II|I|vii|vi|v|iv|iii|ii|i)$/;

// Accidental, stem, suffix. The stems are tried longest first so 'IV' is not
// read as 'I' followed by a 'V' suffix, nor 'iii' as 'i' followed by 'ii'.
const PLAIN_CHORD = /^([♭♯]?)(VII|VI|V|IV|III|II|I|vii|vi|v|iv|iii|ii|i)(.*)$/;

function parseChordToken(token, template) {
    const fail = reason => {
        throw new Error(`Unparseable chord token "${token}" in template "${template}"${reason ? `: ${reason}` : ''}`);
    };

    const applied = token.match(APPLIED_CHORD);
    if (applied) {
        const [, seventh, targetAccidental, targetStem] = applied;
        const accidentalShift = targetAccidental === '♭' ? -1 : targetAccidental === '♯' ? 1 : 0;
        const targetSemitone = MAJOR_SCALE_SEMITONES[STEM_DEGREE[targetStem.toUpperCase()]] + accidentalShift;
        const rootSemitone = ((targetSemitone + 7) % 12 + 12) % 12;

        // Spell the root as a degree of the major scale. One the scale lacks
        // takes the target's accidental, so V7/♭III is ♭VII7 (B♭7 in C), and is
        // raised for a natural target, as a dominant leading up to it: V/vii is
        // ♯IV (F♯ in C).
        let degree = MAJOR_SCALE_SEMITONES.indexOf(rootSemitone);
        let alteration = '';
        if (degree === -1 && targetAccidental === '♭') {
            degree = MAJOR_SCALE_SEMITONES.indexOf((rootSemitone + 1) % 12);
            alteration = 'flat';
        } else if (degree === -1) {
            degree = MAJOR_SCALE_SEMITONES.indexOf((rootSemitone + 11) % 12);
            alteration = 'sharp';
        }

        return {
            degree,
            quality: seventh ? 'dom7' : 'major',
            alteration,
            isSecondary: true,
            secondaryTarget: targetStem,
            originalChord: token
        };
    }
    if (token.includes('/')) {
        fail(token.startsWith('vii')
            ? 'secondary leading-tone chords are reserved in the grammar but not supported yet'
            : 'the only applied chords are V/x and V7/x');
    }

    const plain = token.match(PLAIN_CHORD);
    if (!plain) fail();
    const [, accidental, stem, suffix] = plain;
    const quality = suffixChordType(stem === stem.toLowerCase(), suffix);
    if (!quality) fail(`no chord type has the suffix "${suffix}" after ${stem === stem.toLowerCase() ? 'a lower' : 'an upper'}-case numeral`);

    return {
        degree: STEM_DEGREE[stem.toUpperCase()],
        quality,
        alteration: accidental === '♭' ? 'flat' : accidental === '♯' ? 'sharp' : ''
    };
}

/**
 * Read a template value into one { degree, quality, alteration } per chord,
 * degrees counted on the major scale, plus isSecondary, secondaryTarget and
 * originalChord for an applied dominant.
 *
 * Strict: an unknown token throws, naming it. The parser this replaces stripped
 * known characters and looked up what was left, so an unknown token became the
 * tonic - 'II6' played C major - and a typo in a template was indistinguishable
 * from intent. Every template is generated by the audit, the snapshot and the
 * pack build in CI, so a throw can never reach a user through the catalogue.
 *
 * @param {string} progressionString - A template value, e.g. 'ii7—V7—IM7'
 * @returns {Array<Object>} One parsed chord per token
 */
export function parseProgression(progressionString) {
    return progressionString.split(TEMPLATE_SEPARATOR).map(token => parseChordToken(token, progressionString));
}

/**
 * The chords of a template in a key, root position, then voiced by
 * optimizeVoiceLeading().
 *
 * @param {string} progressionString - A template value, or '12-bar-blues'
 * @param {number} keyOffset - The key's pitch class
 * @param {number[]} scaleDegrees - The major scale (numerals read against it)
 * @param {string} selectedMode - Unused
 * @param {Object} [spelling] - From templateSpelling(): the key and the
 *   template's tonality, which name the chords. Defaults to the key's major.
 * @returns {Array<Object>} One chord per token
 */
export function generateProgressionChords(progressionString, keyOffset, scaleDegrees, selectedMode, spelling = templateSpelling(keys[keyOffset])) {
    let progression = [];

    // Special handling for 12-bar blues
    if (progressionString === '12-bar-blues') {
        // 12-bar blues pattern: I7-I7-I7-I7-IV7-IV7-I7-I7-V7-IV7-I7-V7
        // All three primary chords (I, IV, V) are dominant 7ths - the defining
        // characteristic of blues harmony
        const pattern = [0, 0, 0, 0, 3, 3, 0, 0, 4, 3, 0, 4];
        pattern.forEach(degree => {
            const scaleDegree = scaleDegrees[degree % scaleDegrees.length];
            const chordType = 'dom7';
            const romanNumeral = getRomanNumeralForChord(degree, chordType);
            progression.push({
                degree,
                scaleDegree,
                notes: buildChord(scaleDegree, chordType, keyOffset),
                chordType,
                chordName: getChordName(spelling, { romanNumeral, semitones: scaleDegree }, chordType),
                romanNumeral
            });
        });
    } else {
        const parsedChords = parseProgression(progressionString);
        progression = parsedChords.map((parsed) => {
            const { degree, quality, alteration } = parsed;

            // Pure parallel major analysis: ALL roman numerals reference the
            // parallel major scale, regardless of mode. Chord quality is
            // determined ONLY by the roman numeral notation itself.
            const majorScale = [0, 2, 4, 5, 7, 9, 11];

            // Secondary dominants have their root already computed by the parser
            // as a semitone offset; use the degree + alteration to reconstruct it
            let scaleDegree = majorScale[degree % majorScale.length];

            // Apply alterations (♭, ♯) relative to major scale
            if (alteration === 'flat') {
                scaleDegree = (scaleDegree - 1 + 12) % 12;
            } else if (alteration === 'sharp') {
                scaleDegree = (scaleDegree + 1) % 12;
            }

            const notes = buildChord(scaleDegree, quality, keyOffset);

            // For secondary dominants, preserve the original slash notation
            let romanNumeral;
            if (parsed.isSecondary && parsed.originalChord) {
                romanNumeral = parsed.originalChord;
            } else {
                // Case and suffix both come from CHORD_TYPE_DISPLAY. The
                // hand-rolled version this replaces dropped the seventh, so a
                // iii7 in the template was labelled iii and the palette then
                // re-added the identical chord under the correct numeral.
                romanNumeral = getRomanNumeralForChord(degree, quality);

                if (alteration === 'flat') {
                    romanNumeral = '♭' + romanNumeral;
                } else if (alteration === 'sharp') {
                    romanNumeral = '♯' + romanNumeral;
                }
            }

            return {
                degree,
                scaleDegree,
                notes,
                chordType: quality,
                // Named after the numeral, which is what spells its root: the vi
                // of A is F#m, an applied V7/♭III in C is Bb7
                chordName: getChordName(spelling, { romanNumeral, semitones: scaleDegree }, quality),
                romanNumeral
            };
        });
    }

    // Apply voice leading optimization to the progression
    return optimizeVoiceLeading(progression);
}
