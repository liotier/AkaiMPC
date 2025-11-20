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
        'sus2': {frets: 'x30010', fingers: 'x30010'},
        'sus4': {frets: 'x33010', fingers: 'x34010'}
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
        'sus2': {frets: 'xx4422', fingers: 'xx3411'},
        'sus4': {frets: 'xx4422', fingers: 'xx3411'}
    },
    'G♯/A♭': {
        'major': {frets: '466544', fingers: '134211', barre: {fret: 4, from: 1, to: 6}},
        'minor': {frets: '466444', fingers: '134111', barre: {fret: 4, from: 1, to: 6}},
        'diminished': {frets: '4x3434', fingers: '2x1314'},
        'dom7': {frets: '464544', fingers: '131211', barre: {fret: 4, from: 1, to: 6}},
        'major7': {frets: '465544', fingers: '132411', barre: {fret: 4, from: 1, to: 6}},
        'minor7': {frets: '464444', fingers: '131111', barre: {fret: 4, from: 1, to: 6}},
        'sus2': {frets: '466644', fingers: '134411'},
        'sus4': {frets: '466674', fingers: '134411'}
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

// Guitar chord helper functions
export function getGuitarChord(pad) {
    // Map pad quality to guitar chord type
    let chordType = 'major';
    if (pad.quality === 'Minor') chordType = 'minor';
    else if (pad.quality === 'Diminished') chordType = 'diminished';
    else if (pad.quality === 'Dominant 7') chordType = 'dom7';
    else if (pad.quality === 'Major 7') chordType = 'major7';
    else if (pad.quality === 'Minor 7') chordType = 'minor7';
    else if (pad.quality === 'sus2') chordType = 'sus2';
    else if (pad.quality === 'sus4') chordType = 'sus4';

    // Get root note name
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootNote = noteNames[pad.notes[0] % 12];

    // Look up chord in database
    let lookupKey = rootNote;
    // Handle enharmonic equivalents
    if (rootNote === 'C#') lookupKey = 'C♯/D♭';
    if (rootNote === 'D#') lookupKey = 'D♯/E♭';
    if (rootNote === 'F#') lookupKey = 'F♯/G♭';
    if (rootNote === 'G#') lookupKey = 'G♯/A♭';
    if (rootNote === 'A#') lookupKey = 'A♯/B♭';

    if (guitarChords[lookupKey] && guitarChords[lookupKey][chordType]) {
        return guitarChords[lookupKey][chordType];
    }

    // Fallback for missing chords - try simpler version
    const fallbacks = {
        'major7': 'major',
        'minor7': 'minor',
        'dom7': 'major',
        'diminished': 'minor'
    };

    const fallbackType = fallbacks[chordType] || 'major';
    if (guitarChords[lookupKey] && guitarChords[lookupKey][fallbackType]) {
        return {...guitarChords[lookupKey][fallbackType], simplified: true};
    }

    // Ultimate fallback - just mute all strings
    return {frets: 'xxxxxx', fingers: 'xxxxxx', simplified: true};
}
