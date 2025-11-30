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
    'Symmetrical/Jazz': [
        'Whole Tone', 'Diminished (W-H)', 'Diminished (H-W)', 'Augmented'
    ],
    'Arabic Maqamat': [
        'Maqam Hijaz', 'Maqam Bayati', 'Maqam Rast', 'Maqam Saba', 'Maqam Kurd'
    ],
    'Indian Ragas': [
        'Bhairav', 'Kafi', 'Yaman', 'Bhairavi', 'Todi'
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
    ],
    'R&B/Neo-Soul': [
        { value: 'ii—V—IM7—vi', name: 'ii—V—IM7—vi', nickname: 'Neo-Soul Standard' },
        { value: 'IM7—iii7—vi7—ii7', name: 'IM7—iii7—vi7—ii7', nickname: 'Smooth R&B' },
        { value: 'I—IV—ii—V', name: 'I—IV—ii—V', nickname: 'Classic R&B' },
        { value: 'vi—ii—iii—IV', name: 'vi—ii—iii—IV', nickname: 'Emotional Ballad' },
        { value: 'IM7—V7/IV—IVM7—iv', name: 'IM7—V7/IV—IVM7—iv', nickname: 'Chromatic Soul' },
        { value: 'i—iv—♭VII—♭VI', name: 'i—iv—♭VII—♭VI', nickname: 'Minor Soul' },
        { value: 'I—♯iv°—ii—V', name: 'I—♯iv°—ii—V', nickname: 'Gospel Soul' }
    ],
    'Gospel/Worship': [
        { value: 'I—V/ii—ii—V', name: 'I—V/ii—ii—V', nickname: 'Gospel Turnaround' },
        { value: 'IV—V—iii—vi', name: 'IV—V—iii—vi', nickname: 'Praise Progression' },
        { value: 'I—IV—V/vi—vi', name: 'I—IV—V/vi—vi', nickname: 'Contemporary Worship' },
        { value: 'ii—V—I—IV', name: 'ii—V—I—IV', nickname: 'Church Cadence' },
        { value: 'I—V/V—V—vi—IV', name: 'I—V/V—V—vi—IV', nickname: 'Gospel Rock' },
        { value: 'IV—I—V—vi—IV—♭VII', name: 'IV—I—V—vi—IV—♭VII', nickname: 'Extended Worship' }
    ],
    'Hip-Hop/Trap': [
        { value: 'i—♭VI—♭VII', name: 'i—♭VI—♭VII', nickname: 'Trap Minor' },
        { value: 'i—♭III—♭VI—♭VII', name: 'i—♭III—♭VI—♭VII', nickname: 'Dark Trap' },
        { value: 'vi—IV—I', name: 'vi—IV—I', nickname: 'Sad Trap' },
        { value: 'i—♭VII—♭VI', name: 'i—♭VII—♭VI', nickname: 'Lofi Hip-Hop' },
        { value: 'i—iv—i—♭VI', name: 'i—iv—i—♭VI', nickname: 'Boom Bap' },
        { value: 'i—♭III—iv—♭VI', name: 'i—♭III—iv—♭VI', nickname: 'Emo Rap' },
        { value: 'I—♭III—♭VII—IV', name: 'I—♭III—♭VII—IV', nickname: 'West Coast' }
    ],
    'Latin/Bossa': [
        { value: 'IM7—VI7—ii7—V7', name: 'IM7—VI7—ii7—V7', nickname: 'Bossa Nova' },
        { value: 'i—iv—V—i', name: 'i—iv—V—i', nickname: 'Tango' },
        { value: 'I—♭II—I—V', name: 'I—♭II—I—V', nickname: 'Flamenco' },
        { value: 'i—V—i—VII', name: 'i—V—i—VII', nickname: 'Samba' },
        { value: 'I—V/ii—ii—V/V—V', name: 'I—V/ii—ii—V/V—V', nickname: 'Latin Jazz' },
        { value: 'i—♭VII—♭VI—V', name: 'i—♭VII—♭VI—V', nickname: 'Bolero' }
    ],
    'Film/Cinematic': [
        { value: 'I—♭VI—♭III—♭VII', name: 'I—♭VI—♭III—♭VII', nickname: 'Epic Trailer' },
        { value: 'i—♭VI—♭VII—i', name: 'i—♭VI—♭VII—i', nickname: 'Dark Cinematic' },
        { value: 'I—V—vi—♭VI—IV', name: 'I—V—vi—♭VI—IV', nickname: 'Emotional Score' },
        { value: 'i—♭III—♭VII—♭VI—V', name: 'i—♭III—♭VII—♭VI—V', nickname: 'Heroic Theme' },
        { value: 'I—♭VII—♭VI—♭VII', name: 'I—♭VII—♭VI—♭VII', nickname: 'Adventure' },
        { value: 'i—iv—♭VI—♭III', name: 'i—iv—♭VI—♭III', nickname: 'Suspense' },
        { value: 'I—♭III—♭VI—♭II', name: 'I—♭III—♭VI—♭II', nickname: 'Chromatic Film' }
    ],
    'Folk/Singer-Songwriter': [
        { value: 'I—IV—I—V', name: 'I—IV—I—V', nickname: 'Folk Standard' },
        { value: 'vi—IV—V—I', name: 'vi—IV—V—I', nickname: 'Sad Folk' },
        { value: 'I—V—IV—I', name: 'I—V—IV—I', nickname: 'Country' },
        { value: 'I—iii—IV—V', name: 'I—iii—IV—V', nickname: 'Classic Folk' },
        { value: 'IV—V—I—vi', name: 'IV—V—I—vi', nickname: 'Americana' },
        { value: 'I—V—vi—iii', name: 'I—V—vi—iii', nickname: 'Irish Folk' }
    ],
    'Metal/Rock': [
        { value: 'i—♭VI—♭VII—i', name: 'i—♭VI—♭VII—i', nickname: 'Power Metal' },
        { value: 'i—♭III—♭VI—♭VII', name: 'i—♭III—♭VI—♭VII', nickname: 'Doom Metal' },
        { value: 'i—v—♭VII—iv', name: 'i—v—♭VII—iv', nickname: 'Prog Metal' },
        { value: 'i—♭II—i', name: 'i—♭II—i', nickname: 'Thrash' },
        { value: 'i—♭VII—♭VI—V', name: 'i—♭VII—♭VI—V', nickname: 'Melodic Metal' },
        { value: 'i—iv—v—i', name: 'i—iv—v—i', nickname: 'Minor Rock' }
    ],
    'Trance/Psytrance/Goa': [
        { value: 'i—v', name: 'i—v', nickname: 'Minimal Trance' },
        { value: 'i—VII', name: 'i—VII', nickname: 'Phrygian Trance' },
        { value: 'i—♭VII—i—♭VI', name: 'i—♭VII—i—♭VI', nickname: 'Classic Goa' },
        { value: 'i—♭II—♭VII—i', name: 'i—♭II—♭VII—i', nickname: 'Phrygian Dominant' },
        { value: 'i—V—♭VI—♭VII', name: 'i—V—♭VI—♭VII', nickname: 'Uplifting Trance' },
        { value: 'i—iv—VII—III', name: 'i—iv—VII—III', nickname: 'Harmonic Minor Psy' },
        { value: 'i—♭VI—III—VII', name: 'i—♭VI—III—VII', nickname: 'Dark Psy' },
        { value: 'i—♭III—♭VI—V', name: 'i—♭III—♭VI—V', nickname: 'Progressive Psy' },
        { value: 'i—VII—VI—VII', name: 'i—VII—VI—VII', nickname: 'Full-On' },
        { value: 'i—♭II—VII—V', name: 'i—♭II—VII—V', nickname: 'Goa Classic' },
        { value: 'i—iv—i—VII', name: 'i—iv—i—VII', nickname: 'Forest Psy' },
        { value: 'i—III—VII—IV', name: 'i—III—VII—IV', nickname: 'Morning Trance' }
    ],
    'Jungle/Drum\'n\'Bass': [
        { value: 'i—v', name: 'i—v', nickname: 'Minimal Jungle' },
        { value: 'i—♭VII', name: 'i—♭VII', nickname: 'Dark Jungle' },
        { value: 'i—IV', name: 'i—IV', nickname: 'Dub Jungle' },
        { value: 'i—♭VII—♭VI—V', name: 'i—♭VII—♭VI—V', nickname: 'Liquid DnB' },
        { value: 'i—♭III—♭VII—iv', name: 'i—♭III—♭VII—iv', nickname: 'Neurofunk' },
        { value: 'i—v—♭VII—iv', name: 'i—v—♭VII—iv', nickname: 'Jump-Up' },
        { value: 'ii7—V7—IM7—vi7', name: 'ii7—V7—IM7—vi7', nickname: 'Jazzstep' }
    ],
    'Italo-Disco/House': [
        { value: 'I—vi—IV—V', name: 'I—vi—IV—V', nickname: 'Classic Italo' },
        { value: 'I—iii—vi—IV', name: 'I—iii—vi—IV', nickname: 'Italo Romantic' },
        { value: 'I—IV—V—iii', name: 'I—IV—V—iii', nickname: 'Italo House' },
        { value: 'vi—IV—I—V', name: 'vi—IV—I—V', nickname: 'Italo Pop' },
        { value: 'I—V—vi—iii—IV—I', name: 'I—V—vi—iii—IV—I', nickname: 'Extended Italo' },
        { value: 'IM7—vi7—IVM7—V7', name: 'IM7—vi7—IVM7—V7', nickname: 'Smooth Italo' }
    ],
    'Synthwave/Retrowave': [
        { value: 'i—♭VII—♭VI—V', name: 'i—♭VII—♭VI—V', nickname: 'Outrun' },
        { value: 'i—♭III—♭VII—♭VI', name: 'i—♭III—♭VII—♭VI', nickname: 'Darkwave' },
        { value: 'I—V—vi—IV', name: 'I—V—vi—IV', nickname: 'Synthpop' },
        { value: 'i—v—♭VI—♭VII', name: 'i—v—♭VI—♭VII', nickname: 'Cyberpunk' },
        { value: 'I—♭VII—♭VI—I', name: 'I—♭VII—♭VI—I', nickname: 'Dreamwave' },
        { value: 'vi—IV—I—V', name: 'vi—IV—I—V', nickname: 'Retrowave Pop' },
        { value: 'i—♭VI—III—♭VII', name: 'i—♭VI—III—♭VII', nickname: 'Dark Synth' }
    ],
    'African Dance': [
        { value: 'I—IV—V—IV', name: 'I—IV—V—IV', nickname: 'Soukous Sebene' },
        { value: 'I—IV—I—V', name: 'I—IV—I—V', nickname: 'Soukous Classic' },
        { value: 'I—♭VII—IV—I', name: 'I—♭VII—IV—I', nickname: 'Soukous Modern' },
        { value: 'I—IV', name: 'I—IV', nickname: 'Makossa Groove' },
        { value: 'I—IV—♭VII—I', name: 'I—IV—♭VII—I', nickname: 'Makossa Funk' },
        { value: 'i—iv', name: 'i—iv', nickname: 'Kwaito Minimal' },
        { value: 'I—V', name: 'I—V', nickname: 'Kwaito House' },
        { value: 'i—♭VII—i', name: 'i—♭VII—i', nickname: 'Kwaito Deep' }
    ],
    'Acid/EBM': [
        { value: 'i—i', name: 'i—i', nickname: 'Acid 303' },
        { value: 'i—iv', name: 'i—iv', nickname: 'Acid Minimal' },
        { value: 'i—♭VII—i', name: 'i—♭VII—i', nickname: 'Acid House' },
        { value: 'i—♭VI', name: 'i—♭VI', nickname: 'EBM Dark' },
        { value: 'i—v', name: 'i—v', nickname: 'EBM Industrial' },
        { value: 'i—iv—♭VII—i', name: 'i—iv—♭VII—i', nickname: 'EBM Classic' },
        { value: 'i—♭III—i', name: 'i—♭III—i', nickname: 'Body Music' }
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
        'Egyptian Pentatonic': [0, 2, 5, 7, 10]
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
// Voice Leading Optimization
// ============================================================================

// Calculate the total voice leading distance between two chords
export function calculateVoiceLeadingDistance(chord1Notes, chord2Notes) {
    // For chords with different numbers of notes, pad the shorter one
    const maxLength = Math.max(chord1Notes.length, chord2Notes.length);
    const notes1 = [...chord1Notes];
    const notes2 = [...chord2Notes];

    while (notes1.length < maxLength) notes1.push(notes1[notes1.length - 1] + 12);
    while (notes2.length < maxLength) notes2.push(notes2[notes2.length - 1] + 12);

    // Calculate minimum total distance using Hungarian algorithm approximation
    // For simplicity, we'll use a greedy approach
    let totalDistance = 0;
    const used = new Set();

    notes1.forEach(note1 => {
        let minDist = Infinity;
        let closestIndex = -1;

        notes2.forEach((note2, idx) => {
            if (!used.has(idx)) {
                const dist = Math.abs(note1 - note2);
                if (dist < minDist) {
                    minDist = dist;
                    closestIndex = idx;
                }
            }
        });

        if (closestIndex >= 0) {
            totalDistance += minDist;
            used.add(closestIndex);
        }
    });

    return totalDistance;
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

// Generate more comprehensive voicings for smooth voice leading
function generateSmoothVoicings(chordNotes) {
    const voicings = [];
    const sorted = [...chordNotes].sort((a, b) => a - b);
    const pitchClasses = sorted.map(n => n % 12);
    const uniquePCs = [...new Set(pitchClasses)];

    // Try different bass notes within a reasonable range (C3 to C5)
    for (let bassNote = 48; bassNote <= 72; bassNote++) {
        if (uniquePCs.includes(bassNote % 12)) {
            // Build voicing from this bass note
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

    while (curr.length < maxLen) curr.push(curr[curr.length - 1] + 12);
    while (prev.length < maxLen) prev.push(prev[prev.length - 1] + 12);

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
    let bestBreakdown = null;

    voicings.forEach(voicing => {
        const { score, breakdown } = scoreVoiceLeading(voicing, previousChordNotes);
        if (score < bestScore) {
            bestScore = score;
            bestVoicing = voicing;
            bestBreakdown = breakdown;
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
