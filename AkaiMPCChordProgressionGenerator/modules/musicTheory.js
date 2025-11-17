// Music Theory Module
// Contains all music theory logic, constants, and chord generation functions

// ============================================================================
// Constants and Data
// ============================================================================

export const keys = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];

export const modes = {
    'Common Western Tonal': [
        'Major', 'Minor', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Locrian',
        'Harmonic Minor', 'Melodic Minor'
    ],
    'Compact/Popular': [
        'Pentatonic Major', 'Pentatonic Minor', 'Blues'
    ],
    'Exotic': [
        'Double Harmonic', 'Hungarian Minor', 'Neapolitan Major', 'Neapolitan Minor',
        'Enigmatic', 'Phrygian Dominant', 'Persian', 'Hirajoshi', 'Insen', 'Kumoi',
        'Egyptian Pentatonic'
    ]
};

export const progressions = {
    'Pop/Rock': [
        { value: 'I—V—vi—IV', name: 'I—V—vi—IV', nickname: 'Axis of Awesome' },
        { value: 'I—IV—V—I', name: 'I—IV—V—I', nickname: 'Classic Rock' },
        { value: 'vi—IV—I—V', name: 'vi—IV—I—V', nickname: 'Pop Punk' },
        { value: 'I—vi—IV—V', name: 'I—vi—IV—V', nickname: '50s Doo-Wop' },
        { value: 'I—V—vi—iii—IV', name: 'I—V—vi—iii—IV', nickname: 'Canon Progression' },
        { value: 'IV—I—V—vi', name: 'IV—I—V—vi', nickname: 'Despacito' },
        { value: 'vi—V—IV—V', name: 'vi—V—IV—V', nickname: 'Grenade' },
        { value: 'I—III—IV—iv', name: 'I—III—IV—iv', nickname: 'Creep' },
        { value: 'I—V—♭VII—IV', name: 'I—V—♭VII—IV', nickname: 'Sweet Home' },
        { value: 'I—♭VII—IV—I', name: 'I—♭VII—IV—I', nickname: 'Mixolydian Vamp' }
    ],
    'Blues/Soul': [
        { value: '12-bar-blues', name: 'I—I—I—I—IV—IV—I—I—V—IV—I—V', nickname: '12-Bar Blues' },
        { value: 'I—vi—ii—V', name: 'I—vi—ii—V', nickname: 'Turnaround' },
        { value: 'ii—V—I—VI', name: 'ii—V—I—VI', nickname: 'Rhythm Changes A' },
        { value: 'I—VI—ii—V', name: 'I—VI—ii—V', nickname: 'I Got Rhythm' },
        { value: 'i—♭III—♭VII—IV', name: 'i—♭III—♭VII—IV', nickname: 'Dorian Vamp' },
        { value: 'i—IV—i—V', name: 'i—IV—i—V', nickname: 'Minor Blues' },
        { value: 'I—IV', name: 'I—IV', nickname: 'Two Chord Vamp' }
    ],
    'Jazz/Functional': [
        { value: 'ii—V—I', name: 'ii—V—I', nickname: '2-5-1' },
        { value: 'ii—V—I—vi', name: 'ii—V—I—vi', nickname: 'Jazz Standard' },
        { value: 'iii—vi—ii—V', name: 'iii—vi—ii—V', nickname: 'Circle Progression' },
        { value: 'IVM7—V7—iii7—vi', name: 'IVM7—V7—iii7—vi', nickname: 'Fly Me To The Moon' },
        { value: 'IM7—ii7—iii7—IVM7', name: 'IM7—ii7—iii7—IVM7', nickname: 'Ascending Jazz' },
        { value: 'vi—ii—V—I', name: 'vi—ii—V—I', nickname: 'Minor Turnaround' },
        { value: 'I—vi—IV—♯iv°—V', name: 'I—vi—IV—♯iv°—V', nickname: 'Chromatic Turnaround' },
        { value: 'iv—♭VII—I', name: 'iv—♭VII—I', nickname: 'Backdoor' },
        { value: 'I—♯I°—ii—♯II°', name: 'I—♯I°—ii—♯II°', nickname: 'Chromatic Walk' },
        { value: 'IM7—♭IIIM7—♭VIM7—♭II7', name: 'IM7—♭IIIM7—♭VIM7—♭II7', nickname: 'Giant Steps' }
    ],
    'Classical/Modal': [
        { value: 'I—IV—vii°—iii—vi—ii—V—I', name: 'I—IV—vii°—iii—vi—ii—V—I', nickname: 'Circle of Fifths' },
        { value: 'I—V—vi—iii—IV—I—IV—V', name: 'I—V—vi—iii—IV—I—IV—V', nickname: 'Pachelbel Canon' },
        { value: 'i—♭VII—♭VI—V', name: 'i—♭VII—♭VI—V', nickname: 'Andalusian' },
        { value: 'i—♭VII—i—V', name: 'i—♭VII—i—V', nickname: 'Passamezzo Antico' },
        { value: 'I—V—I—IV', name: 'I—V—I—IV', nickname: 'Passamezzo Moderno' },
        { value: 'iv—♭VII—♭III—♭VI', name: 'iv—♭VII—♭III—♭VI', nickname: 'Plagal Cascade' },
        { value: 'I—♭II', name: 'I—♭II', nickname: 'Neapolitan' },
        { value: 'i—iv—♭VII—♭III', name: 'i—iv—♭VII—♭III', nickname: 'Natural Minor' }
    ],
    'Electronic/Modern': [
        { value: 'i—♭VI—♭III—♭VII', name: 'i—♭VI—♭III—♭VII', nickname: 'EDM Drop' },
        { value: 'i—♭VII—♭VI—♭VII', name: 'i—♭VII—♭VI—♭VII', nickname: 'Dark House' },
        { value: 'vi—IV—I—V', name: 'vi—IV—I—V', nickname: 'Pop Loop' },
        { value: 'i—i—i—i', name: 'i—i—i—i', nickname: 'Techno' },
        { value: 'I—V—vi—IV—I—V—iii—IV', name: 'I—V—vi—IV—I—V—iii—IV', nickname: 'Extended Pop' },
        { value: 'i—♭III—♭VII—i', name: 'i—♭III—♭VII—i', nickname: 'Modal Interchange' },
        { value: 'I—♭III—IV—♭VI', name: 'I—♭III—IV—♭VI', nickname: 'Chromatic Mediant' }
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
        'Egyptian Pentatonic': [0, 2, 5, 7, 10]
    };
    return scales[mode] || scales['Major'];
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
            2: 'major',   // III+ (augmented, but using major as fallback)
            3: 'minor',   // iv
            4: 'major',   // V
            5: 'major',   // VI
            6: 'diminished'  // vii°
        },
        'Melodic Minor': {
            0: 'minor',   // i
            1: 'minor',   // ii
            2: 'major',   // III+ (augmented, but using major as fallback)
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
        case 'major':
            return [baseNote, baseNote + 4, baseNote + 7];
        case 'minor':
            return [baseNote, baseNote + 3, baseNote + 7];
        case 'diminished':
            return [baseNote, baseNote + 3, baseNote + 6];
        case 'major7':
            return [baseNote, baseNote + 4, baseNote + 7, baseNote + 11];
        case 'minor7':
            return [baseNote, baseNote + 3, baseNote + 7, baseNote + 10];
        case 'dom7':
            return [baseNote, baseNote + 4, baseNote + 7, baseNote + 10];
        case 'quartal':
            return [baseNote, baseNote + 5, baseNote + 10];
        default:
            return [baseNote, baseNote + 4, baseNote + 7];
    }
}

export function buildChord(root, chordType, keyOffset) {
    const baseNote = 60 + keyOffset + root;

    switch (chordType) {
        case 'major':
            return [baseNote, baseNote + 4, baseNote + 7];
        case 'minor':
            return [baseNote, baseNote + 3, baseNote + 7];
        case 'diminished':
            return [baseNote, baseNote + 3, baseNote + 6];
        case 'major7':
            return [baseNote, baseNote + 4, baseNote + 7, baseNote + 11];
        case 'minor7':
            return [baseNote, baseNote + 3, baseNote + 7, baseNote + 10];
        case 'dom7':
            return [baseNote, baseNote + 4, baseNote + 7, baseNote + 10];
        case 'quartal':
            return [baseNote, baseNote + 5, baseNote + 10];
        default:
            return [baseNote, baseNote + 4, baseNote + 7];
    }
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

export function spellChordNotes(rootMidi, chordType, romanNumeral = '') {
    // Get the MIDI notes for the chord
    const notes = buildChordRaw(rootMidi, chordType);

    // Determine spelling preference
    const useFlats = getEnharmonicContext(rootMidi, romanNumeral) === 'flats';

    // Spell notes properly in thirds
    const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const rootName = getNoteNameWithContext(rootMidi, useFlats).replace(/[#b]/g, '');
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
        const cleanChord = chord.replace(/M7|m7|7|°|dim|maj|min/g, '');

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
        const baseChord = cleanChord.replace(/♭|♯/g, '');
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
    // Special handling for 12-bar blues
    if (progressionString === '12-bar-blues') {
        const progression = [];
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
        return progression;
    }

    const parsedChords = parseProgression(progressionString);
    return parsedChords.map(({ degree, quality, alteration }) => {
        let scaleDegree = scaleDegrees[degree % scaleDegrees.length];

        // Handle alterations
        if (alteration === 'flat') {
            scaleDegree = (scaleDegree - 1 + 12) % 12;
        } else if (alteration === 'sharp') {
            scaleDegree = (scaleDegree + 1) % 12;
        }

        // FIX FOR MINOR CHORD ISSUE:
        // For the tonic (degree 0) without alterations, use the mode's chord quality
        // This ensures that in Minor mode, the tonic is always minor
        if (degree === 0 && !alteration) {
            quality = getChordQualityForMode(0, selectedMode);
        }

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
