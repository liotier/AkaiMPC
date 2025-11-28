/**
 * Constants Module
 *
 * Centralized configuration for the Akai MPC Chord Progression Generator.
 * All magic numbers are extracted here for easy maintenance and documentation.
 */

// ============================================================================
// AUDIO CONSTANTS
// ============================================================================

/**
 * Web Audio API configuration
 * These values control the synthesizer's sound characteristics
 */
export const AUDIO = {
    // Reference pitch: A4 = 440 Hz (standard tuning)
    A4_FREQUENCY: 440,

    // MIDI note number for A4 (used in frequency calculation)
    A4_MIDI_NOTE: 69,

    // Volume/gain settings (0.0 to 1.0 range)
    MAX_GAIN: 0.2,              // Maximum volume to prevent distortion
    MIN_GAIN: 0.001,            // Minimum gain for exponential ramps (must be > 0)

    // Envelope timings (in seconds)
    ATTACK_TIME: 0.01,          // Time to reach max volume (10ms)
    RELEASE_TIME: 0.1,          // Time to fade out on note-off (100ms)
    CHORD_DURATION: 0.5,        // Duration for click-triggered chords (500ms)
    QUICK_RELEASE: 0.05,        // Fast fade for note replacement (50ms)

    // MIDI settings
    MIDI_DURATION: 500,         // MIDI note duration in milliseconds
    MIDI_VELOCITY: 0.7,         // MIDI note velocity (0.0 to 1.0)

    // Sequential playback (for staff notation)
    EIGHTH_NOTE_DURATION: 333,  // Duration of eighth note at 90 BPM (ms)
    NOTE_SUSTAIN: 300,          // Note sustain time, slightly less than duration (ms)

    // Oscillator type
    WAVEFORM: 'sine'            // Sine wave for smooth, pure tone
};

// ============================================================================
// UI TIMING CONSTANTS
// ============================================================================

/**
 * Animation and interaction timings
 */
export const TIMING = {
    SPARKLE_DURATION: 600,      // Duration of button sparkle animation (ms)
    TOOLTIP_DELAY: 10,          // Delay before showing tooltip (ms)
    PLAYING_FLASH: 300,         // Duration of "playing" visual feedback (ms)
    DEBOUNCE_DELAY: 150         // Debounce delay for rapid events (ms)
};

// ============================================================================
// LAYOUT DIMENSIONS
// ============================================================================

/**
 * Responsive breakpoints for media queries
 */
export const BREAKPOINTS = {
    MOBILE: 400,                // px - very small screens
    TABLET: 600,                // px - tablets and small laptops
    TABLET_MAX: 1024,           // px - maximum tablet width
    DESKTOP: 768                // px - desktop and larger
};

/**
 * Card and component dimensions
 */
export const DIMENSIONS = {
    // Chord pad minimum heights per context
    MPC_CARD_HEIGHT: 150,
    KEYBOARD_CARD_HEIGHT: 280,
    GUITAR_CARD_HEIGHT: 280,
    STAFF_CARD_HEIGHT: 130,

    // Staff notation (defined in rendering.js, documented here)
    STAFF_Y: 36,
    STAFF_LINE_SPACING: 14.4,
    STAFF_STEM_HEIGHT: 42,
    STAFF_NOTE_SPACING: 54,
    STAFF_LEFT_MARGIN: 60,
    STAFF_RIGHT_MARGIN: 20,
    STAFF_WIDTH: 242,
    STAFF_HEIGHT: 192
};

// ============================================================================
// MUSIC THEORY CONSTANTS
// ============================================================================

/**
 * Musical intervals and scales
 */
export const MUSIC = {
    SEMITONES_PER_OCTAVE: 12,
    NOTES_PER_CHROMATIC_SCALE: 12,

    // Interval names (in semitones)
    UNISON: 0,
    MINOR_SECOND: 1,
    MAJOR_SECOND: 2,
    MINOR_THIRD: 3,
    MAJOR_THIRD: 4,
    PERFECT_FOURTH: 5,
    TRITONE: 6,
    PERFECT_FIFTH: 7,
    MINOR_SIXTH: 8,
    MAJOR_SIXTH: 9,
    MINOR_SEVENTH: 10,
    MAJOR_SEVENTH: 11,
    OCTAVE: 12
};

// ============================================================================
// ERROR MESSAGES
// ============================================================================

/**
 * User-facing error and info messages
 */
export const MESSAGES = {
    ERRORS: {
        NO_AUDIO_CONTEXT: 'Web Audio API not supported in this browser',
        MIDI_FAILED: 'MIDI playback failed',
        STORAGE_QUOTA: 'Unable to save preferences: browser storage is full',
        INVALID_INPUT: 'Invalid input provided',
        DOM_ELEMENT_NOT_FOUND: 'Required page element not found'
    },

    INFO: {
        NO_MIDI_DEVICE: 'No MIDI device selected, using browser audio',
        MIDI_SUCCESS: 'MIDI device connected successfully',
        PREFERENCES_SAVED: 'Preferences saved',
        PREFERENCES_LOADED: 'Preferences loaded from previous session'
    },

    WARNINGS: {
        CHORD_ALREADY_EXISTS: 'This chord is already in the matcher',
        NO_COMPATIBLE_KEYS: 'No keys contain all selected chords',
        DUPLICATE_SELECTION: 'This option is already selected'
    }
};

// ============================================================================
// STORAGE KEYS
// ============================================================================

/**
 * LocalStorage and URL parameter keys
 */
export const STORAGE_KEYS = {
    KEY: 'key',
    MODE: 'mode',
    PROGRESSION: 'progression',
    LEFT_HANDED: 'leftHanded',
    CONTEXT: 'context',              // New: remember last used context
    CHORD_REQUIREMENTS: 'chordRequirements'
};

// ============================================================================
// VALIDATION LIMITS
// ============================================================================

/**
 * Input validation constraints
 */
export const LIMITS = {
    MAX_CHORD_REQUIREMENTS: 16,      // Maximum chords in matcher
    MIN_CHORD_NOTES: 1,              // Minimum notes for a valid chord
    MAX_CHORD_NOTES: 8,              // Maximum notes in a chord
    MAX_TOOLTIP_WIDTH: 200           // Maximum tooltip width in pixels
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert MIDI note number to frequency in Hz
 * Formula: f = 440 * 2^((n - 69) / 12)
 *
 * @param {number} midiNote - MIDI note number (0-127)
 * @returns {number} Frequency in Hz
 */
export function midiToFrequency(midiNote) {
    return AUDIO.A4_FREQUENCY * Math.pow(2, (midiNote - AUDIO.A4_MIDI_NOTE) / MUSIC.SEMITONES_PER_OCTAVE);
}

/**
 * Calculate interval between two MIDI notes in semitones
 *
 * @param {number} note1 - First MIDI note
 * @param {number} note2 - Second MIDI note
 * @returns {number} Interval in semitones (always positive)
 */
export function calculateInterval(note1, note2) {
    return Math.abs(note2 - note1) % MUSIC.SEMITONES_PER_OCTAVE;
}

// ============================================================================
// DEVICE CAPABILITY DETECTION
// ============================================================================

/**
 * Detect device capabilities for adaptive UI
 * These functions use feature detection (not user-agent sniffing)
 */

/**
 * Check if device has touch capability
 * @returns {boolean} True if touch is supported
 */
export function hasTouchCapability() {
    return ('ontouchstart' in globalThis) || (navigator.maxTouchPoints > 0);
}

/**
 * Check if device has hover capability (desktop with mouse)
 * @returns {boolean} True if hover is supported
 */
export function hasHoverCapability() {
    return globalThis.matchMedia('(hover: hover)').matches;
}

/**
 * Check if device is likely a tablet (touch + medium screen)
 * @returns {boolean} True if appears to be a tablet
 */
export function isLikelyTablet() {
    const width = globalThis.innerWidth;
    return hasTouchCapability() &&
           width >= BREAKPOINTS.TABLET &&
           width <= BREAKPOINTS.TABLET_MAX;
}
