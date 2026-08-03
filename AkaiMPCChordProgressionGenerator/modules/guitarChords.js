// Guitar Chords Module
// Contains guitar chord data and helper functions

export const guitarChords = {
    'C': {
        'major': {frets: 'x32010', fingers: 'x32010'},
        'minor': {frets: 'x35543', fingers: 'x13421', barre: {fret: 3, from: 1, to: 6}},
        'diminished': {frets: 'x3454x', fingers: 'x1243x'},
        'dom7': {frets: 'x32310', fingers: 'x32410'},
        'major7': {frets: 'x32000', fingers: 'x32000'},
        'minor7': {frets: 'x35343', fingers: 'x13141', barre: {fret: 3, from: 1, to: 6}},
        'sus2': {frets: 'x30013', fingers: 'x30014'},
        'sus4': {frets: 'x33011', fingers: 'x34011'}
    },
    'D': {
        'major': {frets: 'xx0232', fingers: 'xx0132'},
        'minor': {frets: 'xx0231', fingers: 'xx0231'},
        'diminished': {frets: 'xx0101', fingers: 'xx0102'},
        'dom7': {frets: 'xx0212', fingers: 'xx0213'},
        'major7': {frets: 'xx0222', fingers: 'xx0111'},
        'minor7': {frets: 'xx0211', fingers: 'xx0211'},
        'sus2': {frets: 'xx0230', fingers: 'xx0120'},
        'sus4': {frets: 'xx0233', fingers: 'xx0123'}
    },
    'E': {
        'major': {frets: '022100', fingers: '023100'},
        'minor': {frets: '022000', fingers: '023000'},
        'diminished': {frets: 'xx2323', fingers: 'xx1324'},
        'dom7': {frets: '020100', fingers: 'x20100'},
        'major7': {frets: '021100', fingers: '021100'},
        'minor7': {frets: '022030', fingers: '023040'},
        'sus2': {frets: '024400', fingers: '013400'},
        'sus4': {frets: '022200', fingers: '022300'}
    },
    'F': {
        'major': {frets: '133211', fingers: '134211', barre: {fret: 1, from: 1, to: 6}},
        'minor': {frets: '133111', fingers: '134111', barre: {fret: 1, from: 1, to: 6}},
        'diminished': {frets: '1x0101', fingers: '1x0203'},
        'dom7': {frets: '131211', fingers: '131211', barre: {fret: 1, from: 1, to: 6}},
        'major7': {frets: 'xx3210', fingers: 'xx3210'},
        'minor7': {frets: '131111', fingers: '131111', barre: {fret: 1, from: 1, to: 6}},
        'sus2': {frets: 'xx3011', fingers: 'xx3011'},
        'sus4': {frets: 'xx3311', fingers: 'xx3411'}
    },
    'G': {
        'major': {frets: '320003', fingers: '320004'},
        'minor': {frets: '355333', fingers: '134111', barre: {fret: 3, from: 1, to: 6}},
        'diminished': {frets: '3x2323', fingers: '3x1324'},
        'dom7': {frets: '320001', fingers: '320001'},
        'major7': {frets: '320002', fingers: '320002'},
        'minor7': {frets: '353333', fingers: '131111', barre: {fret: 3, from: 1, to: 6}},
        'sus2': {frets: '300033', fingers: '100034'},
        'sus4': {frets: '330013', fingers: '340014'}
    },
    'A': {
        'major': {frets: 'x02220', fingers: 'x01230'},
        'minor': {frets: 'x02210', fingers: 'x02310'},
        'diminished': {frets: '5x4545', fingers: '2x1314'},
        'dom7': {frets: 'x02020', fingers: 'x02030'},
        'major7': {frets: 'x02120', fingers: 'x02130'},
        'minor7': {frets: 'x02010', fingers: 'x02010'},
        'sus2': {frets: 'x02200', fingers: 'x01200'},
        'sus4': {frets: 'x02230', fingers: 'x01230'}
    },
    'B': {
        'major': {frets: 'x24442', fingers: 'x13331', barre: {fret: 2, from: 1, to: 5}},
        'minor': {frets: 'x24432', fingers: 'x13421', barre: {fret: 2, from: 1, to: 5}},
        'diminished': {frets: '7x6767', fingers: '2x1324'},
        'dom7': {frets: 'x21202', fingers: 'x21304'},
        'major7': {frets: 'x24342', fingers: 'x24342', barre: {fret: 2, from: 1, to: 5}},
        'minor7': {frets: 'x24232', fingers: 'x13121', barre: {fret: 2, from: 1, to: 5}},
        'sus2': {frets: 'x24422', fingers: 'x13411'},
        'sus4': {frets: 'x24452', fingers: 'x13441'}
    },
    'C♯/D♭': {
        'major': {frets: 'x46664', fingers: 'x13331', barre: {fret: 4, from: 1, to: 6}},
        'minor': {frets: 'x46654', fingers: 'x13421', barre: {fret: 4, from: 1, to: 6}},
        'diminished': {frets: 'x4565x', fingers: 'x1243x'},
        'dom7': {frets: 'x46464', fingers: 'x13141', barre: {fret: 4, from: 1, to: 6}},
        'major7': {frets: 'x46564', fingers: 'x13241', barre: {fret: 4, from: 1, to: 6}},
        'minor7': {frets: 'x46454', fingers: 'x13121', barre: {fret: 4, from: 1, to: 6}},
        'sus2': {frets: 'x46644', fingers: 'x13411'},
        'sus4': {frets: 'x46674', fingers: 'x13441'}
    },
    'D♯/E♭': {
        'major': {frets: 'x68886', fingers: 'x13331', barre: {fret: 6, from: 1, to: 6}},
        'minor': {frets: 'x68876', fingers: 'x13421', barre: {fret: 6, from: 1, to: 6}},
        'diminished': {frets: 'x6787x', fingers: 'x1243x'},
        'dom7': {frets: 'x68686', fingers: 'x13141', barre: {fret: 6, from: 1, to: 6}},
        'major7': {frets: 'x68786', fingers: 'x13241', barre: {fret: 6, from: 1, to: 6}},
        'minor7': {frets: 'x68676', fingers: 'x13121', barre: {fret: 6, from: 1, to: 6}},
        'sus2': {frets: 'x68866', fingers: 'x13411'},
        'sus4': {frets: 'x68896', fingers: 'x13441'}
    },
    'F♯/G♭': {
        'major': {frets: '244322', fingers: '134211', barre: {fret: 2, from: 1, to: 6}},
        'minor': {frets: '244222', fingers: '134111', barre: {fret: 2, from: 1, to: 6}},
        'diminished': {frets: '2x1212', fingers: '2x1314'},
        'dom7': {frets: '242322', fingers: '131211', barre: {fret: 2, from: 1, to: 6}},
        'major7': {frets: 'xx4321', fingers: 'xx4321'},
        'minor7': {frets: '242222', fingers: '131111', barre: {fret: 2, from: 1, to: 6}},
        'sus2': {frets: 'xx4122', fingers: 'xx4123'},
        'sus4': {frets: 'xx4422', fingers: 'xx3411'}
    },
    'G♯/A♭': {
        'major': {frets: '466544', fingers: '134211', barre: {fret: 4, from: 1, to: 6}},
        'minor': {frets: '466444', fingers: '134111', barre: {fret: 4, from: 1, to: 6}},
        'diminished': {frets: '4x3434', fingers: '2x1314'},
        'dom7': {frets: '464544', fingers: '131211', barre: {fret: 4, from: 1, to: 6}},
        'major7': {frets: '465544', fingers: '132411', barre: {fret: 4, from: 1, to: 6}},
        'minor7': {frets: '464444', fingers: '131111', barre: {fret: 4, from: 1, to: 6}},
        'sus2': {frets: 'xx6344', fingers: 'xx4123'},
        'sus4': {frets: '466644', fingers: '134411'}
    },
    'A♯/B♭': {
        'major': {frets: 'x13331', fingers: 'x13331', barre: {fret: 1, from: 1, to: 5}},
        'minor': {frets: 'x13321', fingers: 'x13421', barre: {fret: 1, from: 1, to: 5}},
        'diminished': {frets: '6x5656', fingers: '2x1314'},
        'dom7': {frets: 'x13131', fingers: 'x13141', barre: {fret: 1, from: 1, to: 5}},
        'major7': {frets: 'x13231', fingers: 'x13241', barre: {fret: 1, from: 1, to: 5}},
        'minor7': {frets: 'x13121', fingers: 'x13121', barre: {fret: 1, from: 1, to: 5}},
        'sus2': {frets: 'x13311', fingers: 'x13411'},
        'sus4': {frets: 'x13341', fingers: 'x13451'}
    }
};

// Pitch class of every note name that can start a chord name, including
// the flat spellings getChordName produces for borrowed chords.
const ROOT_PITCH_CLASSES = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'Fb': 4,
    'E#': 5, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8,
    'A': 9, 'A#': 10, 'Bb': 10, 'B': 11, 'Cb': 11
};

// Database keys, indexed by pitch class
const LOOKUP_KEYS = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];

// Nearest shape when the exact quality has no entry. Every fallback keeps the
// root and the third, so the diagram is still recognisably the same chord.
const SHAPE_FALLBACKS = {
    'major7': 'major',
    'dom7': 'major',
    'major6': 'major',
    'add9': 'major',
    'augmented': 'major',
    'sus2': 'major',
    'sus4': 'major',
    'quartal': 'sus4',
    'minor7': 'minor',
    'minMaj7': 'minor',
    'minor6': 'minor',
    'm7b5': 'diminished',
    'dim7': 'diminished',
    'diminished': 'minor'
};

/**
 * Find the guitar shape for a pad.
 *
 * The root comes from the chord name rather than the lowest note: voice leading
 * inverts chords, so notes[0] is the bass, and reading the root off it drew an
 * E major diagram for a C major chord in first inversion.
 *
 * @param {Object} pad - Pad with chordName, and optionally chordType/notes
 * @returns {Object} Shape with frets/fingers, marked `simplified` when approximate
 */
export function getGuitarChord(pad) {
    const chordType = pad.chordType || 'major';

    // Leading note letter plus any accidental, e.g. 'Bb' from 'Bbm7b5'
    const rootMatch = (pad.chordName || '').match(/^[A-G][#b]?/);
    let rootPitchClass = rootMatch ? ROOT_PITCH_CLASSES[rootMatch[0]] : undefined;
    if (rootPitchClass === undefined) {
        // No usable name: fall back to the lowest sounding note
        rootPitchClass = pad.notes && pad.notes.length ? ((pad.notes[0] % 12) + 12) % 12 : 0;
    }

    const lookupKey = LOOKUP_KEYS[rootPitchClass];
    const shapes = guitarChords[lookupKey];
    if (!shapes) return { frets: 'xxxxxx', fingers: 'xxxxxx', simplified: true };

    if (shapes[chordType]) {
        return shapes[chordType];
    }

    // Walk the fallback chain (e.g. dim7 -> diminished -> minor)
    let fallbackType = SHAPE_FALLBACKS[chordType];
    for (let hops = 0; fallbackType && hops < 4; hops++) {
        if (shapes[fallbackType]) {
            return { ...shapes[fallbackType], simplified: true };
        }
        fallbackType = SHAPE_FALLBACKS[fallbackType];
    }

    if (shapes.major) {
        return { ...shapes.major, simplified: true };
    }

    // Ultimate fallback - just mute all strings
    return { frets: 'xxxxxx', fingers: 'xxxxxx', simplified: true };
}
