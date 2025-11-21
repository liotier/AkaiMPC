/**
 * Audio Module
 *
 * Handles all Web Audio API and MIDI playback functionality.
 * Eliminates code duplication and centralizes audio logic.
 */

import { AUDIO, MESSAGES } from './constants.js';

// Global audio context (initialized once)
let audioContext = null;

// Active oscillators for sustained playback (keyboard mode)
const activeOscillators = {};

// Selected MIDI output device (if any)
let selectedMidiOutput = null;

/**
 * Initialize the Web Audio API context
 * Should be called on first user interaction due to browser autoplay policies
 */
export function initAudioContext() {
    if (audioContext) return audioContext;

    try {
        audioContext = new (globalThis.AudioContext || globalThis.webkitAudioContext)();
        return audioContext;
    } catch (error) {
        console.warn(MESSAGES.ERRORS.NO_AUDIO_CONTEXT, error);
        return null;
    }
}

/**
 * Get the current audio context (read-only access)
 */
export function getAudioContext() {
    return audioContext;
}

/**
 * Set the selected MIDI output device
 * @param {Object} midiOutput - WebMidi output object
 */
export function setMidiOutput(midiOutput) {
    selectedMidiOutput = midiOutput;
    if (midiOutput) {
        console.log(MESSAGES.INFO.MIDI_SUCCESS, midiOutput.name);
    }
}

/**
 * Get the currently selected MIDI output
 */
export function getMidiOutput() {
    return selectedMidiOutput;
}

/**
 * Convert MIDI note number to frequency using equal temperament tuning
 * @param {number} midiNote - MIDI note number (0-127)
 * @returns {number} Frequency in Hz
 */
export function midiToFrequency(midiNote) {
    return AUDIO.A4_FREQUENCY * Math.pow(2, (midiNote - AUDIO.A4_MIDI_NOTE) / 12);
}

/**
 * Create and configure an oscillator with gain node
 * @param {number} frequency - Frequency in Hz
 * @param {AudioContext} context - Web Audio context
 * @returns {Object} Object with oscillator and gainNode properties
 */
function createOscillator(frequency, context) {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    oscillator.type = AUDIO.WAVEFORM;

    return { oscillator, gainNode };
}

/**
 * Send MIDI note-on messages for a chord
 * @param {number[]} notes - Array of MIDI note numbers
 * @param {number} duration - Note duration in ms (optional)
 * @returns {boolean} True if successful, false if failed
 */
function sendMidiNoteOn(notes, duration = AUDIO.MIDI_DURATION) {
    if (!selectedMidiOutput) return false;

    try {
        console.log('Sending MIDI notes:', notes, 'to', selectedMidiOutput.name);
        const channel = selectedMidiOutput.channels[1];

        notes.forEach(midiNote => {
            channel.playNote(midiNote, {
                duration,
                velocity: AUDIO.MIDI_VELOCITY
            });
        });

        return true;
    } catch (error) {
        console.error(MESSAGES.ERRORS.MIDI_FAILED, error);
        return false;
    }
}

/**
 * Send MIDI note-off messages for a chord
 * @param {number[]} notes - Array of MIDI note numbers
 * @returns {boolean} True if successful, false if failed
 */
function sendMidiNoteOff(notes) {
    if (!selectedMidiOutput) return false;

    try {
        console.log('Sending MIDI note-off:', notes, 'to', selectedMidiOutput.name);
        const channel = selectedMidiOutput.channels[1];

        notes.forEach(midiNote => {
            channel.stopNote(midiNote);
        });

        return true;
    } catch (error) {
        console.error('MIDI note-off failed:', error);
        return false;
    }
}

/**
 * Start playing a chord (sustained) - for keyboard press
 * Notes continue playing until stopChord() is called
 *
 * @param {number[]} notes - Array of MIDI note numbers
 */
export async function startChord(notes) {
    // Try MIDI first
    if (sendMidiNoteOn(notes)) {
        return; // MIDI successful
    }

    // Fallback to Web Audio
    if (!audioContext) {
        console.log(MESSAGES.INFO.NO_MIDI_DEVICE);
        return;
    }

    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    notes.forEach(midiNote => {
        // Stop any existing oscillator for this note
        if (activeOscillators[midiNote]) {
            const { oscillator, gainNode } = activeOscillators[midiNote];
            gainNode.gain.cancelScheduledValues(audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
                AUDIO.MIN_GAIN,
                audioContext.currentTime + AUDIO.QUICK_RELEASE
            );
            oscillator.stop(audioContext.currentTime + AUDIO.QUICK_RELEASE);
            delete activeOscillators[midiNote];
        }

        // Create new oscillator
        const frequency = midiToFrequency(midiNote);
        const { oscillator, gainNode } = createOscillator(frequency, audioContext);

        // Envelope: fade in from 0 to max gain
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(
            AUDIO.MAX_GAIN,
            audioContext.currentTime + AUDIO.ATTACK_TIME
        );

        oscillator.start(audioContext.currentTime);

        // Store for later stopping
        activeOscillators[midiNote] = { oscillator, gainNode };
    });
}

/**
 * Stop playing a chord - for keyboard release
 *
 * @param {number[]} notes - Array of MIDI note numbers
 */
export function stopChord(notes) {
    // Try MIDI first
    if (sendMidiNoteOff(notes)) {
        return; // MIDI successful
    }

    // Fallback to Web Audio
    if (!audioContext) return;

    notes.forEach(midiNote => {
        if (activeOscillators[midiNote]) {
            const { oscillator, gainNode } = activeOscillators[midiNote];

            // Fade out
            gainNode.gain.cancelScheduledValues(audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
                AUDIO.MIN_GAIN,
                audioContext.currentTime + AUDIO.RELEASE_TIME
            );
            oscillator.stop(audioContext.currentTime + AUDIO.RELEASE_TIME);

            delete activeOscillators[midiNote];
        }
    });
}

/**
 * Play a chord with automatic release - for mouse clicks
 *
 * @param {number[]} notes - Array of MIDI note numbers
 */
export async function playChord(notes) {
    // Try MIDI first
    if (sendMidiNoteOn(notes, AUDIO.MIDI_DURATION)) {
        return; // MIDI successful
    }

    // Fallback to Web Audio
    if (!audioContext) {
        console.log(MESSAGES.INFO.NO_MIDI_DEVICE);
        return;
    }

    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    notes.forEach(midiNote => {
        const frequency = midiToFrequency(midiNote);
        const { oscillator, gainNode } = createOscillator(frequency, audioContext);

        // Envelope: attack, sustain, release
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(
            AUDIO.MAX_GAIN,
            audioContext.currentTime + AUDIO.ATTACK_TIME
        );
        gainNode.gain.exponentialRampToValueAtTime(
            AUDIO.MIN_GAIN,
            audioContext.currentTime + AUDIO.CHORD_DURATION
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + AUDIO.CHORD_DURATION);
    });
}

/**
 * Play notes sequentially as eighth notes at 90 BPM
 * Used for staff notation playback
 *
 * @param {number[]} notes - Array of MIDI note numbers
 */
export async function playNotesSequentially(notes) {
    // Try MIDI first
    if (selectedMidiOutput) {
        try {
            console.log('Sending MIDI notes sequentially:', notes, 'to', selectedMidiOutput.name);
            const channel = selectedMidiOutput.channels[1];

            for (let i = 0; i < notes.length; i++) {
                channel.playNote(notes[i], {
                    duration: AUDIO.NOTE_SUSTAIN,
                    velocity: AUDIO.MIDI_VELOCITY
                });

                // Wait before next note
                if (i < notes.length - 1) {
                    await new Promise(resolve =>
                        setTimeout(resolve, AUDIO.EIGHTH_NOTE_DURATION)
                    );
                }
            }
            return; // MIDI successful
        } catch (error) {
            console.error('MIDI sequential playback failed, falling back to beep:', error);
        }
    }

    // Fallback to Web Audio
    if (!audioContext) {
        console.log(MESSAGES.INFO.NO_MIDI_DEVICE);
        return;
    }

    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    for (let i = 0; i < notes.length; i++) {
        const midiNote = notes[i];
        const frequency = midiToFrequency(midiNote);
        const { oscillator, gainNode } = createOscillator(frequency, audioContext);

        // Envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(
            AUDIO.MAX_GAIN,
            audioContext.currentTime + AUDIO.ATTACK_TIME
        );
        gainNode.gain.exponentialRampToValueAtTime(
            AUDIO.MIN_GAIN,
            audioContext.currentTime + (AUDIO.NOTE_SUSTAIN / 1000)
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + (AUDIO.NOTE_SUSTAIN / 1000));

        // Wait before next note
        if (i < notes.length - 1) {
            await new Promise(resolve =>
                setTimeout(resolve, AUDIO.EIGHTH_NOTE_DURATION)
            );
        }
    }
}

/**
 * Stop all currently playing oscillators
 * Useful for panic/reset or when window loses focus
 */
export function stopAllNotes() {
    if (!audioContext) return;

    Object.keys(activeOscillators).forEach(midiNote => {
        const { oscillator, gainNode } = activeOscillators[midiNote];
        try {
            gainNode.gain.cancelScheduledValues(audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
                AUDIO.MIN_GAIN,
                audioContext.currentTime + AUDIO.QUICK_RELEASE
            );
            oscillator.stop(audioContext.currentTime + AUDIO.QUICK_RELEASE);
        } catch (error) {
            // Oscillator may already be stopped
            console.debug('Error stopping oscillator:', error);
        }
        delete activeOscillators[midiNote];
    });
}

/**
 * Get total duration for sequential playback
 * @param {number} noteCount - Number of notes to play
 * @returns {number} Total duration in milliseconds
 */
export function getSequentialDuration(noteCount) {
    return AUDIO.EIGHTH_NOTE_DURATION * noteCount;
}
