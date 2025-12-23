/**
 * MIDI Export Module
 *
 * Generates Standard MIDI Files (.mid) from chord progressions.
 * Format: Progression + Palette Hybrid
 * - First section: Progression chords in sequence (from the template)
 * - Second section: Remaining palette chords for exploration
 */

/**
 * Convert a number to variable-length quantity (VLQ) used in MIDI
 * @param {number} value - The value to encode
 * @returns {number[]} Array of bytes in VLQ format
 */
function encodeVariableLength(value) {
    const bytes = [];
    bytes.push(value & 0x7F);
    value >>= 7;
    while (value > 0) {
        bytes.unshift((value & 0x7F) | 0x80);
        value >>= 7;
    }
    return bytes;
}

/**
 * Generate a Standard MIDI File (SMF) from a chord progression
 *
 * @param {Array} chords - Array of chord objects with {name, notes}
 * @param {string} progressionName - Name of the progression
 * @param {Array} progressionChordIndices - Indices of chords that are part of the core progression (optional)
 * @returns {Uint8Array} - Binary MIDI file data
 */
export function generateMIDIFile(chords, progressionName, progressionChordIndices = []) {
    const TICKS_PER_QUARTER = 480; // Standard resolution
    const WHOLE_NOTE_TICKS = TICKS_PER_QUARTER * 4; // 1920 ticks (note duration)
    const QUARTER_NOTE_TICKS = TICKS_PER_QUARTER; // 480 ticks (gap between chords)
    const TEMPO = 120; // BPM
    const VELOCITY = 100;

    // Separate progression chords from palette chords
    const progressionChords = progressionChordIndices.length > 0
        ? progressionChordIndices.map(idx => chords[idx]).filter(c => c)
        : [];
    const paletteChords = chords.filter((_, idx) => !progressionChordIndices.includes(idx));

    // Combine: progression first, then palette
    const orderedChords = [...progressionChords, ...paletteChords];

    // Build track events
    const trackEvents = [];

    // Track name meta event
    const trackNameBytes = Array.from(new TextEncoder().encode(progressionName));
    trackEvents.push(
        0x00, // Delta time = 0
        0xFF, 0x03, // Meta event: Track name
        trackNameBytes.length,
        ...trackNameBytes
    );

    // Tempo meta event (microseconds per quarter note)
    const microsecondsPerQuarter = Math.floor(60000000 / TEMPO);
    trackEvents.push(
        0x00, // Delta time = 0
        0xFF, 0x51, 0x03, // Meta event: Set tempo
        (microsecondsPerQuarter >> 16) & 0xFF,
        (microsecondsPerQuarter >> 8) & 0xFF,
        microsecondsPerQuarter & 0xFF
    );

    // Add chords sequentially
    let currentTick = 0;
    orderedChords.forEach((chord, chordIndex) => {
        if (!chord || !chord.notes || chord.notes.length === 0) return;

        // Note On events (all notes start simultaneously)
        chord.notes.forEach((midiNote, noteIndex) => {
            // First note of each new chord gets the gap delta, rest get 0 (simultaneous starts)
            const deltaTime = noteIndex === 0 && chordIndex > 0 ? QUARTER_NOTE_TICKS : 0;
            trackEvents.push(
                ...encodeVariableLength(deltaTime),
                0x90, // Note On, channel 1
                midiNote,
                VELOCITY
            );
        });

        // Note Off events (all notes end after whole note duration)
        chord.notes.forEach((midiNote, noteIndex) => {
            // First Note Off gets the duration delta, rest get 0 (simultaneous offs)
            const deltaTime = noteIndex === 0 ? WHOLE_NOTE_TICKS : 0;
            trackEvents.push(
                ...encodeVariableLength(deltaTime),
                0x80, // Note Off, channel 1
                midiNote,
                0x00
            );
        });
    });

    // End of track
    trackEvents.push(
        0x00, // Delta time = 0
        0xFF, 0x2F, 0x00 // Meta event: End of track
    );

    // Build MTrk chunk
    const trackChunk = new Uint8Array([
        0x4D, 0x54, 0x72, 0x6B, // "MTrk"
        (trackEvents.length >> 24) & 0xFF,
        (trackEvents.length >> 16) & 0xFF,
        (trackEvents.length >> 8) & 0xFF,
        trackEvents.length & 0xFF,
        ...trackEvents
    ]);

    // Build MThd chunk (header)
    const headerChunk = new Uint8Array([
        0x4D, 0x54, 0x68, 0x64, // "MThd"
        0x00, 0x00, 0x00, 0x06, // Header length = 6
        0x00, 0x00, // Format 0 (single track)
        0x00, 0x01, // Number of tracks = 1
        (TICKS_PER_QUARTER >> 8) & 0xFF,
        TICKS_PER_QUARTER & 0xFF
    ]);

    // Combine header and track
    const midiFile = new Uint8Array(headerChunk.length + trackChunk.length);
    midiFile.set(headerChunk, 0);
    midiFile.set(trackChunk, headerChunk.length);

    return midiFile;
}

/**
 * Download a MIDI file
 * @param {Uint8Array} midiData - Binary MIDI file data
 * @param {string} filename - Desired filename (without .mid extension)
 */
export function downloadMIDIFile(midiData, filename) {
    const blob = new Blob([midiData], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.mid`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Generate and download MIDI files for all progression variants
 * @param {Array} progressions - Array of progression objects
 * @param {string} baseFilename - Base filename for the ZIP
 */
export async function downloadAllMIDIFiles(progressions, baseFilename) {
    if (typeof JSZip === 'undefined') {
        throw new Error('JSZip library not loaded');
    }

    const zip = new JSZip();

    progressions.forEach((progression, index) => {
        const midiData = generateMIDIFile(
            progression.chords,
            progression.name,
            progression.progressionChordIndices || []
        );
        zip.file(`${progression.name}.mid`, midiData);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseFilename}_MIDI.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
