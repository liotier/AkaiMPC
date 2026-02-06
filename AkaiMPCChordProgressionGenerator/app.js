// Import from modules
import {
    keys,
    modes,
    progressions,
    getKeyOffset,
    getScaleDegrees,
    getChordQualityForMode,
    buildChord,
    getChordName,
    getRomanNumeral,
    generateProgressionChords,
    spellChordNotes,
    applyVoicingStyle,
    optimizeVoiceLeading,
    optimizeSmoothVoiceLeading,
    getInversionNotation
} from './modules/musicTheory.js';

import {
    getGuitarChord
} from './modules/guitarChords.js';

import {
    saveToLocalStorage,
    loadFromLocalStorage,
    updateURL,
    loadFromURL,
    applyPreferences
} from './modules/storage.js';

import {
    generateKeyboardSVG,
    generateGuitarSVG,
    generateStaffSVG
} from './modules/rendering.js';

import {
    generateMIDIFile,
    downloadMIDIFile,
    downloadAllMIDIFiles
} from './modules/midiExport.js';

import {
    TIMING,
    MESSAGES,
    LIMITS,
    hasTouchCapability,
    hasHoverCapability,
    isLikelyTablet
} from './modules/constants.js';

import {
    initAudioContext,
    setMidiOutput,
    startChord,
    stopChord,
    playChord,
    playNotesSequentially,
    stopAllNotes,
    getSequentialDuration
} from './modules/audio.js';

import { i18n } from './modules/i18n.js';

// State variables
let selectedKey = 'C';
let selectedMode = 'Major';
let selectedProgression = 'I—V—vi—IV';
let progressionName = '';
let variants = [];
let chordRequirements = [];
let currentContext = 'mpc'; // Current view context: 'mpc', 'keyboard', 'guitar', or 'staff'
let isLeftHanded = false;
let hasGeneratedOnce = false; // Track if user has generated at least once
let generationMode = 'template'; // 'template' or 'scale'

// Device capability detection (cached at startup)
const hasTouch = hasTouchCapability();
const hasHover = hasHoverCapability();
const isTablet = isLikelyTablet();

// Tablet interaction state
let voiceLeadingLocked = null; // Track locked voice leading visualization on tablets
let activeTooltip = null; // Track active tooltip on tablets

// Show user notification (toast message)
function showNotification(message, type = 'info') {
    // Create or get notification element
    let notification = document.getElementById('appNotification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'appNotification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }

    // Set message and type
    notification.textContent = message;
    notification.className = `notification notification-${type} visible`;

    // Auto-hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('visible');
    }, 3000);
}

/**
 * Analyze voice leading between two chords
 * @param {Array} notes1 - First chord notes (MIDI numbers)
 * @param {Array} notes2 - Second chord notes (MIDI numbers)
 * @returns {Object} Voice leading analysis
 */
function analyzeVoiceLeading(notes1, notes2) {
    if (!notes1 || !notes2) return null;

    // Convert to pitch classes (0-11) for common tone analysis
    const pc1 = notes1.map(n => n % 12);
    const pc2 = notes2.map(n => n % 12);

    // Find common tones (pitch classes that appear in both chords)
    const commonTones = pc1.filter(pc => pc2.includes(pc));

    // Analyze voice movement
    const movements = [];
    for (let i = 0; i < Math.min(notes1.length, notes2.length); i++) {
        const interval = Math.abs(notes2[i] - notes1[i]);
        if (interval === 0) {
            movements.push('common tone');
        } else if (interval <= 2) {
            movements.push('step motion');
        } else if (interval <= 4) {
            movements.push('skip');
        } else {
            movements.push('leap');
        }
    }

    const stepMotion = movements.filter(m => m === 'step motion').length;
    const commonToneCount = commonTones.length;

    return {
        commonTones: commonToneCount,
        stepMotion: stepMotion,
        smoothness: commonToneCount + stepMotion // Higher = smoother voice leading
    };
}

/**
 * Detects the cadence type from a progression
 * @param {string} progression - The progression string (e.g., "I—V—vi—IV")
 * @returns {Object} Cadence analysis with i18n key and emoji
 */
function detectCadence(progression) {
    if (!progression) return null;

    // Split progression into chords
    const chords = progression.split('—').map(c => c.trim());
    if (chords.length < 2) return null;

    // Get last two chords for cadence detection
    const lastTwo = chords.slice(-2);
    const penultimate = lastTwo[0].replaceAll(/\d/g, '').toUpperCase();
    const final = lastTwo[1].replaceAll(/\d/g, '').toUpperCase();

    // Normalize chord symbols
    const normPenult = penultimate.replaceAll(/M7|7/g, '');
    const normFinal = final.replaceAll(/M7|7/g, '');

    let cadenceKey = null;
    let cadenceEmoji = '';

    // Authentic cadence: V → I
    if ((normPenult === 'V' || normPenult === 'V7') && (normFinal === 'I' || normFinal === 'IM7')) {
        cadenceKey = 'authentic';
        cadenceEmoji = '🎯';
    }
    // Perfect Authentic Cadence: V7 → I
    else if (normPenult.includes('V') && normFinal === 'I') {
        cadenceKey = 'authentic';
        cadenceEmoji = '🎯';
    }
    // Plagal cadence: IV → I
    else if ((normPenult === 'IV' || normPenult === 'IVM7') && (normFinal === 'I' || normFinal === 'IM7')) {
        cadenceKey = 'plagal';
        cadenceEmoji = '🙏';
    }
    // Deceptive cadence: V → vi
    else if ((normPenult === 'V' || normPenult === 'V7') && (normFinal === 'VI' || normFinal === 'vi')) {
        cadenceKey = 'deceptive';
        cadenceEmoji = '😮';
    }
    // Half cadence: ends on V
    else if (normFinal === 'V' || normFinal === 'V7') {
        cadenceKey = 'half';
        cadenceEmoji = '⏸️';
    }
    // Minor authentic: V → i
    else if ((normPenult === 'V' || normPenult === 'V7') && (normFinal === 'i' || normFinal === 'i7')) {
        cadenceKey = 'authenticMinor';
        cadenceEmoji = '🎯';
    }
    // Backdoor: ♭VII → I or iv → I
    else if ((normPenult.includes('♭VII') || normPenult === 'IV' && normPenult.toLowerCase() === 'iv') && normFinal === 'I') {
        cadenceKey = 'backdoor';
        cadenceEmoji = '🚪';
    }
    // Picardy third: ends on I in minor context (detected by lowercase previous chord)
    else if (penultimate.toLowerCase() === penultimate && normFinal === 'I') {
        cadenceKey = 'picardy';
        cadenceEmoji = '✨';
    }

    if (cadenceKey) {
        return {
            key: cadenceKey,
            emoji: cadenceEmoji
        };
    }

    return null;
}

// Trigger sparkle animation on Generate button
function triggerSparkle() {
    const btn = document.getElementById('generateBtn');
    if (btn) {
        btn.classList.add('sparkle');
        setTimeout(() => btn.classList.remove('sparkle'), TIMING.SPARKLE_DURATION);
    }
}

// Context switching
function switchContext(context) {
    currentContext = context;
    document.body.setAttribute('data-context', context);

    // Update active tab
    document.querySelectorAll('.context-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-context') === context) {
            tab.classList.add('active');
        }
    });

    // Update button label
    const downloadBtn = document.getElementById('downloadAllBtn');
    if (downloadBtn) {
        if (context === 'mpc') {
            downloadBtn.textContent = 'Download all .progression files';
        } else if (context === 'midi') {
            downloadBtn.textContent = 'Download all MIDI files';
        } else {
            downloadBtn.textContent = 'Print all progressions';
        }
    }

    // Show/hide left-handed toggle for guitar context
    const leftHandedToggle = document.getElementById('leftHandedToggle');
    if (leftHandedToggle) {
        if (context === 'guitar') {
            leftHandedToggle.style.display = 'flex';
        } else {
            leftHandedToggle.style.display = 'none';
        }
    }

    // Save context preference
    saveToLocalStorage(selectedKey, selectedMode, selectedProgression, isLeftHanded, context, generationMode);
}

// Generation mode switching (Progression Palette Mode vs Scale Mode)
function switchGenerationMode(mode, skipSave = false) {
    generationMode = mode;
    const modeSelect = document.getElementById('modeSelect');
    const progressionSelect = document.getElementById('progressionSelect');
    const progressionNameInput = document.getElementById('progressionName');
    const progressionNameLabel = document.getElementById('progressionNameLabel');
    const paletteModeContainer = document.getElementById('paletteModeContainer');
    const scaleModeContainer = document.getElementById('scaleModeContainer');

    if (mode === 'template') {
        // Progression Palette Mode: Progression is active, Mode is disabled
        progressionSelect.disabled = false;
        progressionSelect.style.cursor = '';
        progressionNameInput.disabled = false;

        modeSelect.disabled = true;
        modeSelect.style.cursor = 'not-allowed';

        // Toggle container active states
        paletteModeContainer.classList.add('active');
        scaleModeContainer.classList.remove('active');

        // Update label
        if (progressionNameLabel) {
            progressionNameLabel.textContent = 'Progression Name';
        }
    } else {
        // Scale Mode: Mode is active, Progression is disabled
        modeSelect.disabled = false;
        modeSelect.style.cursor = '';

        progressionSelect.disabled = true;
        progressionSelect.style.cursor = 'not-allowed';
        progressionNameInput.disabled = true;

        // Toggle container active states
        paletteModeContainer.classList.remove('active');
        scaleModeContainer.classList.add('active');

        // Update label
        if (progressionNameLabel) {
            progressionNameLabel.textContent = 'Output Name';
        }
    }

    // Update progression name to reflect new mode
    updateProgressionName();

    // Re-generate if user has generated at least once
    if (hasGeneratedOnce) {
        triggerSparkle();
        generateProgressions();
    }

    // Save generation mode preference (unless during initialization)
    if (!skipSave) {
        saveToLocalStorage(selectedKey, selectedMode, selectedProgression, isLeftHanded, currentContext, generationMode);
    }
}

// Print all progressions (for keyboard/guitar contexts)
function printAllProgressions() {
    globalThis.print();
}

// WebMIDI initialization (Firefox 108+, Chrome, Edge)
async function initMIDI() {
    try {
        // Check if WebMIDI.js loaded
        if (typeof WebMidi === 'undefined') {
            console.log('WebMIDI.js not loaded');
            return;
        }

        await WebMidi.enable();
        console.log('WebMIDI enabled successfully');

        const midiSelector = document.getElementById('midiSelector');
        const midiOutputSelect = document.getElementById('midiOutputSelect');

        // Show MIDI selector if outputs are available
        if (WebMidi.outputs.length > 0) {
            midiSelector.style.display = 'flex';

            // Populate MIDI output devices
            WebMidi.outputs.forEach(output => {
                const option = document.createElement('option');
                option.value = output.id;
                option.textContent = output.name;
                midiOutputSelect.appendChild(option);
            });

            console.log(`Found ${WebMidi.outputs.length} MIDI output(s)`);
            // Default remains "Browser beep" (MIDI output = null)
            console.log('Default audio output: Browser beep');
        } else {
            console.log('No MIDI outputs available');
        }

        // Handle device selection
        midiOutputSelect.addEventListener('change', function() {
            if (this.value === '') {
                setMidiOutput(null);
                console.log('Using browser beep');
            } else {
                const output = WebMidi.getOutputById(this.value);
                setMidiOutput(output);
                console.log('Selected MIDI output:', output.name);
            }
        });

    } catch (error) {
        console.log('WebMIDI not available:', error.message);
    }
}

// Chord Matcher Functions
function toggleChordMatcher() {
    const matcher = document.getElementById('chordMatcher');
    matcher.classList.toggle('expanded');
}

function addChordRequirement() {
    const noteSelect = document.getElementById('chordNote');
    const qualitySelect = document.getElementById('chordQuality');

    // Validate inputs
    if (!noteSelect || !qualitySelect) {
        console.error(MESSAGES.ERRORS.DOM_ELEMENT_NOT_FOUND);
        return;
    }

    if (!noteSelect.value || !qualitySelect.value) {
        showNotification('Please select both a note and chord quality', 'warning');
        return;
    }

    // Check maximum limit
    if (chordRequirements.length >= LIMITS.MAX_CHORD_REQUIREMENTS) {
        showNotification(`Maximum ${LIMITS.MAX_CHORD_REQUIREMENTS} chords allowed in matcher`, 'warning');
        return;
    }

    const chord = {
        note: noteSelect.value,
        quality: qualitySelect.value,
        display: noteSelect.value + (qualitySelect.value === 'major' ? '' :
                 qualitySelect.value === 'minor' ? 'm' :
                 qualitySelect.value === 'dim' ? '°' :
                 qualitySelect.value === 'aug' ? '+' :
                 qualitySelect.value === 'sus2' ? 'sus2' :
                 qualitySelect.value === 'sus4' ? 'sus4' :
                 qualitySelect.value === '7' ? '7' :
                 qualitySelect.value === 'maj7' ? 'maj7' :
                 qualitySelect.value === 'm7' ? 'm7' : '')
    };

    // Check if chord already exists
    if (chordRequirements.find(c => c.display === chord.display)) {
        showNotification(MESSAGES.WARNINGS.CHORD_ALREADY_EXISTS, 'warning');
        // Reset selectors even if duplicate
        noteSelect.value = '';
        qualitySelect.value = '';
        return;
    }

    // Add chord
    chordRequirements.push(chord);
    renderChordRequirements();
    analyzeCompatibleKeys();

    // Reset selectors
    noteSelect.value = '';
    qualitySelect.value = '';

    // Success feedback
    showNotification(`Added ${chord.display} to chord matcher`, 'info');
}

function removeChordRequirement(index) {
    chordRequirements.splice(index, 1);
    renderChordRequirements();
    analyzeCompatibleKeys();
}

function clearChordRequirements() {
    chordRequirements = [];
    renderChordRequirements();
    analyzeCompatibleKeys();
}

// Expose functions to global scope for HTML onclick attributes
globalThis.toggleChordMatcher = toggleChordMatcher;
globalThis.addChordRequirement = addChordRequirement;
globalThis.removeChordRequirement = removeChordRequirement;
globalThis.clearChordRequirements = clearChordRequirements;

// Expose state variables for debugging (read-only via getters)
Object.defineProperty(globalThis, 'selectedKey', { get: () => selectedKey });
Object.defineProperty(globalThis, 'selectedMode', { get: () => selectedMode });
Object.defineProperty(globalThis, 'selectedProgression', { get: () => selectedProgression });

function renderChordRequirements() {
    const container = document.getElementById('selectedChords');

    if (chordRequirements.length === 0) {
        container.innerHTML = '<span style="color: var(--muted); font-size: 14px;">No chords selected</span>';
    } else {
        container.innerHTML = chordRequirements.map((chord, index) => `
            <div class="chord-tag">
                ${chord.display}
                <button onclick="removeChordRequirement(${index})">×</button>
            </div>
        `).join('');
    }
}

function analyzeCompatibleKeys() {
    if (chordRequirements.length === 0) {
        // Reset filters and hide suggestions
        document.getElementById('keyModeSuggestions').style.display = 'none';
        resetKeyModeFilters();
        return;
    }

    const compatibleKeysAndModes = [];

    // Check each key and mode combination
    keys.forEach(key => {
        Object.values(modes).flat().forEach(modeObj => {
            const modeName = typeof modeObj === 'string' ? modeObj : modeObj.value;
            if (isKeyModeCompatible(key, modeName)) {
                compatibleKeysAndModes.push({ key, mode: modeName });
            }
        });
    });

    // Update UI
    displayCompatibilityResults(compatibleKeysAndModes);
    filterKeyModeDropdowns(compatibleKeysAndModes);
}

function isKeyModeCompatible(key, mode) {
    const keyOffset = getKeyOffset(key);
    const scaleDegrees = getScaleDegrees(mode);

    // Get all triads in this key/mode
    const availableChords = [];
    for (let i = 0; i < scaleDegrees.length; i++) {
        const degree = scaleDegrees[i];

        // Determine chord quality based on scale degree
        let quality;
        if (mode === 'Major') {
            quality = [0, 3, 4].includes(i) ? 'major' : [1, 2, 5].includes(i) ? 'minor' : 'diminished';
        } else if (mode === 'Minor') {
            quality = [0, 3, 4].includes(i) ? 'minor' : [2, 5, 6].includes(i) ? 'major' : 'diminished';
        } else {
            // Simplified for other modes - would need full implementation
            quality = i === 0 ? 'major' : 'minor';
        }

        const noteName = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][(degree + keyOffset) % 12];
        availableChords.push({ note: noteName, quality });

        // Also add 7th chords if base triad exists
        if (quality === 'major') {
            availableChords.push({ note: noteName, quality: 'maj7' });
            availableChords.push({ note: noteName, quality: '7' });
        } else if (quality === 'minor') {
            availableChords.push({ note: noteName, quality: 'm7' });
        }
    }

    // Check if all required chords are available
    return chordRequirements.every(req =>
        availableChords.some(chord =>
            chord.note.replace('#', '').replace('♭', '') === req.note.replace('#', '').replace('♭', '') &&
            (chord.quality === req.quality ||
             (req.quality === '7' && chord.quality === 'major') ||
             (req.quality === 'm7' && chord.quality === 'minor') ||
             (req.quality === 'maj7' && chord.quality === 'major'))
        )
    );
}

function displayCompatibilityResults(compatibleList) {
    const suggestionsDiv = document.getElementById('keyModeSuggestions');
    const listDiv = document.getElementById('suggestionList');

    if (compatibleList.length === 0) {
        listDiv.innerHTML = '<div class="suggestion-item incompatible">No compatible keys found. Try fewer or different chords.</div>';
    } else {
        // Group by key
        const byKey = {};
        compatibleList.forEach(({ key, mode }) => {
            if (!byKey[key]) byKey[key] = [];
            byKey[key].push(mode);
        });

        let html = '';
        Object.entries(byKey).forEach(([key, modes]) => {
            if (modes.length > 0) {
                html += `<div class="suggestion-item compatible"><strong>${key}:</strong> ${modes.join(', ')}</div>`;
            }
        });
        listDiv.innerHTML = html;
    }

    suggestionsDiv.style.display = 'block';
}

function filterKeyModeDropdowns(compatibleList) {
    const keySelect = document.getElementById('keySelect');
    const modeSelect = document.getElementById('modeSelect');

    if (compatibleList.length === 0) {
        // Disable selects if no compatible options
        keySelect.disabled = true;
        modeSelect.disabled = true;
        return;
    }

    keySelect.disabled = false;
    modeSelect.disabled = false;

    // Store original selected values
    const originalKey = selectedKey;
    const originalMode = selectedMode;

    // Get unique keys and modes
    const compatibleKeys = [...new Set(compatibleList.map(item => item.key))];
    const compatibleModes = [...new Set(compatibleList.map(item => item.mode))];

    // Update key select options
    Array.from(keySelect.options).forEach(option => {
        if (option.value) {
            option.disabled = !compatibleKeys.includes(option.value);
            option.style.color = option.disabled ? 'var(--muted)' : '';
        }
    });

    // Update mode select options
    Array.from(modeSelect.options).forEach(option => {
        if (option.value) {
            option.disabled = !compatibleModes.includes(option.value);
            option.style.color = option.disabled ? 'var(--muted)' : '';
        }
    });

    // If current selection is incompatible, select first compatible option
    if (!compatibleKeys.includes(originalKey)) {
        keySelect.value = compatibleKeys[0];
        selectedKey = compatibleKeys[0];
    }

    if (!compatibleModes.includes(originalMode)) {
        modeSelect.value = compatibleModes[0];
        selectedMode = compatibleModes[0];
    }

    updateProgressionName();
}

function resetKeyModeFilters() {
    const keySelect = document.getElementById('keySelect');
    const modeSelect = document.getElementById('modeSelect');

    keySelect.disabled = false;
    modeSelect.disabled = false;

    Array.from(keySelect.options).forEach(option => {
        option.disabled = false;
        option.style.color = '';
    });

    Array.from(modeSelect.options).forEach(option => {
        option.disabled = false;
        option.style.color = '';
    });
}

// Dynamic Row 4 Analysis Functions
function analyzeExistingChords(chords) {
    const analysis = {
        hasDominant7: false,
        hasSubdominant: false,
        hasBorrowed: false,
        hasSecondary: false,
        hasPivot: false,
        functionsPresent: new Set(),
        roots: [],
        romanNumerals: []
    };

    chords.forEach(chord => {
        // Check for dominant 7
        if (chord.quality === 'Dominant 7' || chord.romanNumeral === 'V7') {
            analysis.hasDominant7 = true;
        }

        // Check for subdominant (IV or ii)
        if (chord.romanNumeral && (chord.romanNumeral.includes('IV') || chord.romanNumeral.includes('ii'))) {
            analysis.hasSubdominant = true;
        }

        // Check for borrowed chords
        if (chord.romanNumeral && (chord.romanNumeral.includes('♭') || chord.romanNumeral.includes('♯'))) {
            analysis.hasBorrowed = true;
        }

        // Check for secondary dominants
        if (chord.romanNumeral && chord.romanNumeral.includes('/')) {
            analysis.hasSecondary = true;
        }

        // Track roots and roman numerals
        if (chord.notes && chord.notes.length > 0) {
            analysis.roots.push(chord.notes[0] % 12);
        }
        analysis.romanNumerals.push(chord.romanNumeral);

        // Determine function
        const func = determineChordFunction(chord.romanNumeral);
        if (func) analysis.functionsPresent.add(func);
    });

    return analysis;
}

function determineChordFunction(romanNumeral) {
    if (!romanNumeral) return null;
    const upper = romanNumeral.toUpperCase();

    if (upper.includes('I') && !upper.includes('II') && !upper.includes('V')) return 'tonic';
    if (upper.includes('IV') || upper.includes('II')) return 'subdominant';
    if (upper.includes('V')) return 'dominant';
    if (upper.includes('VI') || upper.includes('III')) return 'mediant';
    return 'chromatic';
}

function analyzeProgression(pads) {
    const progressionPads = pads.filter(p => p.isProgressionChord);
    if (progressionPads.length === 0) return '';

    const hasBorrowed = progressionPads.some(p => p.romanNumeral && (p.romanNumeral.includes('♭') || p.romanNumeral.includes('♯')));
    const hasSecondary = progressionPads.some(p => p.romanNumeral && p.romanNumeral.includes('/'));
    const has7ths = progressionPads.some(p => p.quality && p.quality.includes('7'));
    const hasDiminished = progressionPads.some(p => p.quality === 'Diminished');

    const characteristics = [];
    if (hasBorrowed) characteristics.push('Modal Interchange');
    if (hasSecondary) characteristics.push('Secondary Dominants');
    if (has7ths) characteristics.push('Extended Harmony');
    if (hasDiminished) characteristics.push('Chromatic');

    if (characteristics.length === 0) {
        return 'Diatonic progression';
    }
    return characteristics.join(' • ');
}

function generateRow4Candidates(keyOffset, scaleDegrees, analysis, variantType) {
    const candidates = [];

    // Always consider these common non-diatonic chords
    // ♭VII (borrowed from mixolydian/minor)
    const flatSeven = (scaleDegrees[0] + 10) % 12;
    candidates.push({
        root: flatSeven,
        notes: buildChord(flatSeven, 'major', keyOffset),
        chordType: 'major',
        chordName: getChordName(flatSeven, 'major', keyOffset, '♭VII'),
        romanNumeral: '♭VII',
        quality: 'Major',
        category: 'borrowed',
        commonUsage: 0.9
    });

    // ♭VI (borrowed from minor)
    const flatSix = (scaleDegrees[0] + 8) % 12;
    candidates.push({
        root: flatSix,
        notes: buildChord(flatSix, 'major', keyOffset),
        chordType: 'major',
        chordName: getChordName(flatSix, 'major', keyOffset, '♭VI'),
        romanNumeral: '♭VI',
        quality: 'Major',
        category: 'borrowed',
        commonUsage: 0.8
    });

    // V7 (dominant seventh)
    if (!analysis.hasDominant7 && scaleDegrees.length > 4) {
        const fifth = scaleDegrees[4 % scaleDegrees.length];
        candidates.push({
            root: fifth,
            notes: buildChord(fifth, 'dom7', keyOffset),
            chordType: 'dom7',
            chordName: getChordName(fifth, 'dom7', keyOffset),
            romanNumeral: 'V7',
            quality: 'Dominant 7',
            category: 'dominant',
            commonUsage: 1.0
        });
    }

    // ii7 (subdominant seventh)
    if (!analysis.hasSubdominant && scaleDegrees.length > 1) {
        const second = scaleDegrees[1 % scaleDegrees.length];
        candidates.push({
            root: second,
            notes: buildChord(second, 'minor7', keyOffset),
            chordType: 'minor7',
            chordName: getChordName(second, 'minor7', keyOffset),
            romanNumeral: 'ii7',
            quality: 'Minor 7',
            category: 'subdominant',
            commonUsage: 0.85
        });
    }

    // iv (minor subdominant - borrowed from parallel minor)
    if (scaleDegrees.length > 3) {
        const fourth = scaleDegrees[3 % scaleDegrees.length];
        candidates.push({
            root: fourth,
            notes: buildChord(fourth, 'minor', keyOffset),
            chordType: 'minor',
            chordName: getChordName(fourth, 'minor', keyOffset),
            romanNumeral: 'iv',
            quality: 'Minor',
            category: 'borrowed',
            commonUsage: 0.85
        });
    }

    // VI (major sixth - raised submediant, common in pop/rock)
    if (scaleDegrees.length > 5) {
        const sixth = scaleDegrees[5 % scaleDegrees.length];
        // Raise it by a semitone to make it major VI instead of minor vi
        const majorSixth = (sixth + 1) % 12;
        candidates.push({
            root: majorSixth,
            notes: buildChord(majorSixth, 'major', keyOffset),
            chordType: 'major',
            chordName: getChordName(majorSixth, 'major', keyOffset),
            romanNumeral: 'VI',
            quality: 'Major',
            category: 'borrowed',
            commonUsage: 0.8
        });
    }

    // Secondary dominants (V7/x chords)
    // Always calculated from major scale degrees (P5 above target), not the
    // current mode's scale degrees, since secondary dominants are chromatic
    // and not derived from the diatonic scale.
    // In key of C: V/V=D7, V/ii=A7, V/vi=E7, V/IV=C7
    if (scaleDegrees.length > 1) {
        // V7/V: P5 above V (scale degree 7) = scale degree 2
        const vOfV = 2;  // Always D in key of C, regardless of mode
        candidates.push({
            root: vOfV,
            notes: buildChord(vOfV, 'dom7', keyOffset),
            chordType: 'dom7',
            chordName: getChordName(vOfV, 'dom7', keyOffset),
            romanNumeral: 'V7/V',
            quality: 'Dominant 7',
            category: 'secondary',
            commonUsage: 0.7
        });

        // V7/ii: P5 above ii (scale degree 2) = scale degree 9
        const vOfii = 9;  // Always A in key of C
        candidates.push({
            root: vOfii,
            notes: buildChord(vOfii, 'dom7', keyOffset),
            chordType: 'dom7',
            chordName: getChordName(vOfii, 'dom7', keyOffset),
            romanNumeral: 'V7/ii',
            quality: 'Dominant 7',
            category: 'secondary',
            commonUsage: 0.5
        });

        // V7/vi: P5 above vi (scale degree 9) = scale degree 4
        const vOfvi = 4;  // Always E in key of C
        candidates.push({
            root: vOfvi,
            notes: buildChord(vOfvi, 'dom7', keyOffset),
            chordType: 'dom7',
            chordName: getChordName(vOfvi, 'dom7', keyOffset),
            romanNumeral: 'V7/vi',
            quality: 'Dominant 7',
            category: 'secondary',
            commonUsage: 0.5
        });

        // V7/IV: P5 above IV (scale degree 5) = scale degree 0 (tonic as dom7)
        const vOfIV = 0;  // Always C7 in key of C (I7 functions as V7/IV)
        candidates.push({
            root: vOfIV,
            notes: buildChord(vOfIV, 'dom7', keyOffset),
            chordType: 'dom7',
            chordName: getChordName(vOfIV, 'dom7', keyOffset),
            romanNumeral: 'V7/IV',
            quality: 'Dominant 7',
            category: 'secondary',
            commonUsage: 0.4
        });
    }

    // Augmented 6th chords (classical approach to V)
    if (variantType === 'Classic' || variantType === 'Jazz') {
        const flatSix = (scaleDegrees[0] + 8) % 12;  // ♭6 scale degree

        // Italian 6th (It+6): ♭VI with raised 4th
        candidates.push({
            root: flatSix,
            notes: buildChord(flatSix, 'It6', keyOffset),
            chordType: 'It6',
            chordName: getChordName(flatSix, 'It6', keyOffset, 'It+6'),
            romanNumeral: 'It+6',
            quality: 'Italian 6th',
            category: 'augmented6th',
            commonUsage: 0.3
        });

        // German 6th (Ger+6): like It6 but with ♭3
        candidates.push({
            root: flatSix,
            notes: buildChord(flatSix, 'Ger6', keyOffset),
            chordType: 'Ger6',
            chordName: getChordName(flatSix, 'Ger6', keyOffset, 'Ger+6'),
            romanNumeral: 'Ger+6',
            quality: 'German 6th',
            category: 'augmented6th',
            commonUsage: 0.3
        });

        // French 6th (Fr+6): like It6 but with 2
        candidates.push({
            root: flatSix,
            notes: buildChord(flatSix, 'Fr6', keyOffset),
            chordType: 'Fr6',
            chordName: getChordName(flatSix, 'Fr6', keyOffset, 'Fr+6'),
            romanNumeral: 'Fr+6',
            quality: 'French 6th',
            category: 'augmented6th',
            commonUsage: 0.2
        });
    }

    // ♭III (borrowed from minor)
    const flatThree = (scaleDegrees[0] + 3) % 12;
    candidates.push({
        root: flatThree,
        notes: buildChord(flatThree, 'major', keyOffset),
        chordType: 'major',
        chordName: getChordName(flatThree, 'major', keyOffset, '♭III'),
        romanNumeral: '♭III',
        quality: 'Major',
        category: 'borrowed',
        commonUsage: 0.5
    });

    // ♭II (Neapolitan)
    const neapolitan = (scaleDegrees[0] + 1) % 12;
    candidates.push({
        root: neapolitan,
        notes: buildChord(neapolitan, 'major', keyOffset),
        chordType: 'major',
        chordName: getChordName(neapolitan, 'major', keyOffset, '♭II'),
        romanNumeral: '♭II',
        quality: 'Major',
        category: 'chromatic',
        commonUsage: 0.4
    });

    // Variant-specific additions
    if (variantType === 'Jazz') {
        // SubV7 (tritone substitution for V7)
        const tritone = (scaleDegrees[4] + 6) % 12;  // Tritone from V, not I
        candidates.push({
            root: tritone,
            notes: buildChord(tritone, 'dom7', keyOffset),
            chordType: 'dom7',
            chordName: getChordName(tritone, 'dom7', keyOffset, 'SubV7'),
            romanNumeral: 'SubV7',
            quality: 'Dominant 7',
            category: 'substitution',
            commonUsage: 0.5
        });
    }

    if (variantType === 'Modal') {
        // Lydian II
        const lydianTwo = (scaleDegrees[0] + 2) % 12;
        candidates.push({
            root: lydianTwo,
            notes: buildChord(lydianTwo, 'major', keyOffset),
            chordType: 'major',
            chordName: getChordName(lydianTwo, 'major', keyOffset),
            romanNumeral: 'II',
            quality: 'Major',
            category: 'modal',
            commonUsage: 0.3
        });
    }

    return candidates;
}

function scoreCandidate(candidate, analysis, existingRoots) {
    let score = 0;

    // 1. Fills functional gap (0 or 1)
    const candidateFunction = determineChordFunction(candidate.romanNumeral);
    if (candidateFunction && !analysis.functionsPresent.has(candidateFunction)) {
        score += 1;
    }

    // 2. Provides useful voice leading (0 or 1)
    const leadsWell = existingRoots.some(root => {
        const interval = Math.abs((candidate.root - root + 12) % 12);
        return interval === 1 || interval === 5 || interval === 7; // semitone, fourth, or fifth
    });
    if (leadsWell) score += 1;

    // 3. Common in modern music (0 or 1)
    if (candidate.commonUsage > 0.6) score += 1;

    // 4. Adds harmonic variety (0 or 1)
    if (!analysis.hasBorrowed && candidate.category === 'borrowed') score += 1;
    if (!analysis.hasSecondary && candidate.category === 'secondary') score += 1;
    if (!analysis.hasDominant7 && candidate.category === 'dominant') score += 1;

    return score;
}

function selectDynamicRow4Chords(existingChords, keyOffset, scaleDegrees, variantType) {
    const analysis = analyzeExistingChords(existingChords);
    const candidates = generateRow4Candidates(keyOffset, scaleDegrees, analysis, variantType);
    const existingRoots = existingChords.map(c => c.notes && c.notes[0] ? c.notes[0] % 12 : 0);

    // Score and sort candidates
    const scoredCandidates = candidates.map(candidate => ({
        ...candidate,
        score: scoreCandidate(candidate, analysis, existingRoots)
    }));

    // Sort by score (descending) and then by common usage as tiebreaker
    scoredCandidates.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.commonUsage - a.commonUsage;
    });

    // Take top 4, ensuring some diversity in categories
    const selected = [];
    const usedCategories = new Set();

    // First pass: get highest scoring from each unique category
    for (const chord of scoredCandidates) {
        if (selected.length >= 4) break;
        if (!usedCategories.has(chord.category) || selected.length < 2) {
            selected.push(chord);
            usedCategories.add(chord.category);
        }
    }

    // Fill remaining slots with highest scores
    for (const chord of scoredCandidates) {
        if (selected.length >= 4) break;
        if (!selected.includes(chord)) {
            selected.push(chord);
        }
    }

    return selected;
}

// Tooltip functions
function getChordTooltip(romanNumeral, chordType) {
    // Normalize roman numeral for matching
    const normalized = romanNumeral ? romanNumeral.toUpperCase() : '';

    // Handle lowercase roman numerals (minor chords)
    const upperNormalized = normalized.replaceAll(/^([IVX]+)/gi, (match) => {
        // Check if the original was lowercase
        if (romanNumeral && romanNumeral[0] === romanNumeral[0].toLowerCase() && romanNumeral[0] !== '♭' && romanNumeral[0] !== '♯') {
            // It's a minor chord
            const base = match.toUpperCase();
            switch(base) {
                case 'I': return 'I';
                case 'II': return 'II';
                case 'III': return 'III';
                case 'IV': return 'IV';
                case 'V': return 'V';
                case 'VI': return 'VI';
                case 'VII': return 'VII';
                default: return match;
            }
        }
        return match.toUpperCase();
    });

    // First try exact match from i18n
    let translation = i18n.t(`chordRoles.${upperNormalized}`);
    if (translation && translation !== `chordRoles.${upperNormalized}`) {
        return translation;
    }

    // Try without quality indicators
    const withoutQuality = upperNormalized.replaceAll(/M7|MAJ7|7|°|Ø7|DIM/g, '');
    translation = i18n.t(`chordRoles.${withoutQuality}`);
    if (translation && translation !== `chordRoles.${withoutQuality}`) {
        return translation;
    }

    // Handle chord types
    if (chordType) {
        if (chordType.includes('sus')) {
            return i18n.t('chordRoles.sus');
        }
        if (chordType.includes('add9')) {
            return i18n.t('chordRoles.add9');
        }
        if (chordType.includes('6')) {
            return i18n.t('chordRoles.6');
        }
        if (chordType.includes('9') || chordType.includes('11') || chordType.includes('13')) {
            return i18n.t('chordRoles.extended');
        }
    }

    // Default based on whether it's borrowed
    if (normalized.includes('♭') || normalized.includes('♯')) {
        return i18n.t('chordRoles.borrowed');
    }

    // Default for unrecognized chords
    return i18n.t('chordRoles.default');
}

function showTooltip(element, text) {
    const tooltip = document.getElementById('chordTooltip') || createTooltip();
    tooltip.textContent = text;

    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + rect.width / 2 + 'px';
    tooltip.style.top = (rect.top - 10) + 'px';
    tooltip.style.transform = 'translate(-50%, -100%)';

    setTimeout(() => tooltip.classList.add('visible'), TIMING.TOOLTIP_DELAY);
}

function createTooltip() {
    const existing = document.getElementById('chordTooltip');
    if (existing) return existing;

    const tooltip = document.createElement('div');
    tooltip.id = 'chordTooltip';
    tooltip.className = 'tooltip';
    tooltip.style.position = 'fixed';
    document.body.appendChild(tooltip);

    return tooltip;
}

// Helper to check if a chord matches Chord Matcher requirements
function matchesChordRequirement(scaleDegree, chordType, keyOffset) {
    if (chordRequirements.length === 0) return false;

    const noteMap = { 'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11 };
    const chordRoot = (scaleDegree + keyOffset) % 12;

    const typeToQuality = {
        'major': 'major',
        'minor': 'minor',
        'diminished': 'dim',
        'augmented': 'aug',
        'dom7': '7',
        'major7': 'maj7',
        'minor7': 'm7'
    };
    const quality = typeToQuality[chordType];

    return chordRequirements.some(req =>
        noteMap[req.note] === chordRoot && req.quality === quality
    );
}

// Generate scale exploration (all chords from a scale/mode)
function generateScaleExploration() {
    const keyOffset = getKeyOffset(selectedKey);
    const scaleDegrees = getScaleDegrees(selectedMode);
    const pads = [];

    const scaleLength = scaleDegrees.length;

    // Generate triads for each scale degree
    for (let i = 0; i < scaleLength && i < 8; i++) {
        const degree = i;
        const scaleDegree = scaleDegrees[degree % scaleLength];
        const chordType = getChordQualityForMode(degree, selectedMode);
        const notes = buildChord(scaleDegree, chordType, keyOffset);
        const chordName = getChordName(scaleDegree, chordType, keyOffset);
        const romanNumeral = getRomanNumeral(degree, chordType.includes('minor'), chordType === 'diminished');

        const quality = chordType === 'minor' ? 'Minor' :
                       chordType === 'major' ? 'Major' :
                       chordType === 'diminished' ? 'Diminished' : 'Major';

        pads.push({
            id: i + 1,
            chordName,
            romanNumeral,
            notes,
            quality,
            row: Math.floor(i / 4) + 1,
            col: (i % 4) + 1,
            isProgressionChord: false,
            isChordMatcherChord: matchesChordRequirement(scaleDegree, chordType, keyOffset)
        });
    }

    // Fill remaining spots in first two rows with tonic chord if needed
    while (pads.length < 8) {
        const scaleDegree = scaleDegrees[0];
        const chordType = getChordQualityForMode(0, selectedMode);
        const notes = buildChord(scaleDegree, chordType, keyOffset);
        const chordName = getChordName(scaleDegree, chordType, keyOffset);
        const romanNumeral = getRomanNumeral(0, chordType.includes('minor'), false);
        const quality = chordType === 'minor' ? 'Minor' : 'Major';

        pads.push({
            id: pads.length + 1,
            chordName,
            romanNumeral,
            notes,
            quality,
            row: Math.floor(pads.length / 4) + 1,
            col: (pads.length % 4) + 1,
            isProgressionChord: false,
            isChordMatcherChord: matchesChordRequirement(scaleDegree, chordType, keyOffset)
        });
    }

    // Generate 7th chords for each scale degree (pads 9-16)
    for (let i = 0; i < scaleLength && pads.length < 16; i++) {
        const degree = i;
        const scaleDegree = scaleDegrees[degree % scaleLength];
        let chordType = getChordQualityForMode(degree, selectedMode);

        // Convert to 7th chord
        if (chordType === 'minor') {
            chordType = 'minor7';
        } else if (chordType === 'major') {
            chordType = 'major7';
        } else if (chordType === 'diminished') {
            chordType = 'diminished'; // Keep diminished as is
        }

        // Special case: V chord becomes dominant 7th
        if (degree === 4 && scaleLength === 7) {
            chordType = 'dom7';
        }

        const notes = buildChord(scaleDegree, chordType, keyOffset);
        const chordName = getChordName(scaleDegree, chordType, keyOffset);
        let romanNumeral = getRomanNumeral(degree, chordType.includes('minor'), chordType === 'diminished');

        // Add 7 to roman numeral
        if (chordType.includes('7')) {
            if (!romanNumeral.includes('7')) {
                romanNumeral = chordType === 'major7' ? romanNumeral + 'M7' : romanNumeral + '7';
            }
        }

        const quality = chordType === 'minor7' ? 'Minor 7' :
                       chordType === 'major7' ? 'Major 7' :
                       chordType === 'dom7' ? 'Dominant 7' :
                       chordType === 'diminished' ? 'Diminished' : 'Major';

        pads.push({
            id: pads.length + 1,
            chordName,
            romanNumeral,
            notes,
            quality,
            row: Math.floor(pads.length / 4) + 1,
            col: (pads.length % 4) + 1,
            isProgressionChord: false,
            isChordMatcherChord: matchesChordRequirement(scaleDegree, chordType, keyOffset)
        });
    }

    // Fill any remaining pads with tonic 7th chord
    while (pads.length < 16) {
        const scaleDegree = scaleDegrees[0];
        const chordType = getChordQualityForMode(0, selectedMode) === 'minor' ? 'minor7' : 'major7';
        const notes = buildChord(scaleDegree, chordType, keyOffset);
        const chordName = getChordName(scaleDegree, chordType, keyOffset);
        const romanNumeral = getRomanNumeral(0, chordType.includes('minor'), false) + (chordType === 'major7' ? 'M7' : '7');
        const quality = chordType === 'minor7' ? 'Minor 7' : 'Major 7';

        pads.push({
            id: pads.length + 1,
            chordName,
            romanNumeral,
            notes,
            quality,
            row: Math.floor(pads.length / 4) + 1,
            col: (pads.length % 4) + 1,
            isProgressionChord: false,
            isChordMatcherChord: matchesChordRequirement(scaleDegree, chordType, keyOffset)
        });
    }

    return {
        name: `${selectedKey} ${selectedMode} - Scale Exploration`,
        pads: pads
    };
}

function generateVariant(variantType) {
    const keyOffset = getKeyOffset(selectedKey);
    const scaleDegrees = getScaleDegrees(selectedMode);
    const pads = [];

    // Generate the actual progression chords - PASS selectedMode as 4th parameter (FIX!)
    let progressionChords = generateProgressionChords(selectedProgression, keyOffset, scaleDegrees, selectedMode);

    // Store the ORIGINAL progression chords before building palette
    const originalProgression = [...progressionChords];
    const originalProgressionLength = progressionChords.length;

    // Look up the full progression template object to get palette preferences
    let paletteFilter = null;
    let palettePriorities = null;
    for (const category in progressions) {
        const template = progressions[category].find(p => p.value === selectedProgression);
        if (template) {
            if (template.paletteFilter) {
                paletteFilter = template.paletteFilter;
            }
            if (template.palettePriorities) {
                palettePriorities = template.palettePriorities;
            }
            break;
        }
    }

    // Helper to get chord priority (1=avoided, 2=allowed, 3=preferred)
    const getChordPriority = (chordType) => {
        if (!palettePriorities) return 2; // Default: allowed

        if (palettePriorities.preferred && palettePriorities.preferred.includes(chordType)) {
            return 3; // Preferred - highest priority
        }
        if (palettePriorities.avoided && palettePriorities.avoided.includes(chordType)) {
            return 1; // Avoided - lowest priority
        }
        // Default to allowed (or explicitly in allowed list)
        return 2;
    };

    // Convert progression sequence to palette ensuring ALL 16 PADS ARE UNIQUE
    // Harmonic gradient: Row 1 (pads 1-4, bottom visual row) = foundation with tonic
    //                    Row 4 (pads 13-16, top visual row) = spicy adventurous chords

    // Extract unique chord degrees
    const uniqueDegrees = [];
    const seenDegrees = new Set();
    progressionChords.forEach(chord => {
        if (!seenDegrees.has(chord.degree)) {
            seenDegrees.add(chord.degree);
            uniqueDegrees.push({ degree: chord.degree, original: chord });
        }
    });

    // Build comprehensive palette with DIFFERENT extensions for each degree
    const palette = [];
    const usedRomanNumerals = new Set();

    // Helper to add unique chord
    const addChord = (degree, type, romanBase, suffix, spice, isChordMatcher = false) => {
        // Apply palette filter if defined (hard filter - backward compatibility)
        if (paletteFilter && !paletteFilter.includes(type)) {
            return; // Skip chord types not in the filter
        }

        const roman = romanBase + suffix;
        if (usedRomanNumerals.has(roman)) return; // Skip duplicates
        usedRomanNumerals.add(roman);

        const scaleDegree = scaleDegrees[degree % scaleDegrees.length];
        const priority = getChordPriority(type);

        palette.push({
            degree,
            notes: buildChord(scaleDegree, type, keyOffset),
            chordType: type,
            chordName: getChordName(scaleDegree, type, keyOffset, romanBase),
            romanNumeral: roman,
            spiceLevel: spice, // 0=foundation, 1=standard, 2=colorful, 3=spicy
            priority: priority, // 1=avoided, 2=allowed, 3=preferred
            isChordMatcherChord: isChordMatcher
        });
    };

    // Helper to determine spice level based on harmonic function
    const getSpiceLevelForDegree = (degree) => {
        // Tonic (I or i) = foundation (0)
        if (degree === 0) return 0;
        // Subdominant/Dominant (IV, V) = standard (1)
        if (degree === 3 || degree === 4) return 1;
        // Supertonic, Submediant (ii, vi) = standard (1)
        if (degree === 1 || degree === 5) return 1;
        // Mediant (iii) = colorful (2)
        if (degree === 2) return 2;
        // Leading tone/Subtonic (vii°, ♭VII) = spicy (3)
        if (degree === 6) return 3;
        // Default
        return 1;
    };

    // Inject Chord Matcher requirements into palette
    if (chordRequirements.length > 0) {
        chordRequirements.forEach(req => {
            // Convert chord requirement note to MIDI offset
            const noteMap = { 'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11 };
            const reqNoteOffset = noteMap[req.note];

            // Find which scale degree this chord corresponds to
            let matchedDegree = -1;
            for (let i = 0; i < scaleDegrees.length; i++) {
                const scaleDegreeNote = (scaleDegrees[i] + keyOffset) % 12;
                if (scaleDegreeNote === reqNoteOffset) {
                    matchedDegree = i;
                    break;
                }
            }

            if (matchedDegree === -1) {
                // Chord not in scale - skip it (shouldn't happen if Chord Matcher filtering works)
                console.warn(`Chord Matcher chord ${req.display} not found in ${selectedKey} ${selectedMode}`);
                return;
            }

            // Map quality to chord type
            const qualityToType = {
                'major': 'major',
                'minor': 'minor',
                'dim': 'diminished',
                'aug': 'augmented',
                '7': 'dom7',
                'maj7': 'major7',
                'm7': 'minor7'
            };
            const chordType = qualityToType[req.quality] || 'major';

            // Determine roman numeral base
            const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
            let romanBase = romanNumerals[matchedDegree];
            if (chordType.includes('minor') || chordType.includes('diminished')) {
                romanBase = romanBase.toLowerCase();
            }
            if (chordType === 'diminished') {
                romanBase = romanBase + '°';
            }

            // Determine suffix
            let suffix = '';
            if (chordType === 'dom7' || chordType === 'minor7') {
                suffix = '7';
            } else if (chordType === 'major7') {
                suffix = 'M7';
            }

            // Determine spice level
            const spiceLevel = getSpiceLevelForDegree(matchedDegree);

            // Add to palette with Chord Matcher flag
            addChord(matchedDegree, chordType, romanBase.replace('°', ''), suffix, spiceLevel, true);
        });
    }

    // Generate extensions for each unique degree
    uniqueDegrees.forEach(({ degree, original }) => {
        const romanBase = original.romanNumeral.replaceAll(/7|M7|m7|°/g, '');
        const baseType = original.chordType;

        if (baseType.includes('major') || baseType === 'dom7') {
            // Major/dominant chords: generate varied extensions
            addChord(degree, 'major', romanBase, '', degree === 0 ? 0 : 1);
            addChord(degree, 'dom7', romanBase, '7', 1);
            addChord(degree, 'major7', romanBase, 'M7', 2);
            if (variantType === 'Jazz' || variantType === 'Experimental') {
                // Add 9th implied (use dom7 as placeholder)
                addChord(degree, 'dom7', romanBase, '9', 2);
            }
        } else if (baseType.includes('minor')) {
            // Minor chords
            addChord(degree, 'minor', romanBase, '', 1);
            addChord(degree, 'minor7', romanBase, '7', 1);
            if (variantType === 'Jazz') {
                addChord(degree, 'minor7', romanBase, '9', 2);
            }
        } else {
            // Diminished, etc.
            addChord(degree, baseType, romanBase, '', 1);
        }
    });

    // Add complementary chords (foundation and spicy)
    // ii7 - foundation (if not already present)
    if (scaleDegrees.length > 1) {
        addChord(1, 'minor7', 'ii', '7', 0);
        addChord(1, 'minor', 'ii', '', 1);
    }

    // vi - foundation/standard
    if (scaleDegrees.length > 5) {
        addChord(5, 'minor', 'vi', '', 1);
        addChord(5, 'minor7', 'vi', '7', 1);
    }

    // Add borrowed/modal interchange chords only if they are NOT already
    // diatonic to the current mode. In minor keys, ♭VII, ♭VI, ♭III are
    // native - labeling them "borrowed" is incorrect.
    const diatonicPitchClasses = new Set(scaleDegrees.map(d => d % 12));

    // ♭VII - colorful (Mixolydian/blues flavor) - skip if already diatonic
    const flatSevenPC = 10; // 10 semitones = minor 7th
    if ((!paletteFilter || paletteFilter.includes('major')) && !diatonicPitchClasses.has(flatSevenPC)) {
        const flatSeven = (scaleDegrees[0] + flatSevenPC) % 12;
        palette.push({
            degree: 6,
            notes: buildChord(flatSeven, 'major', keyOffset),
            chordType: 'major',
            chordName: getChordName(flatSeven, 'major', keyOffset, '♭VII'),
            romanNumeral: '♭VII',
            spiceLevel: 2
        });
    }

    // ♭VI - borrowed from parallel minor - skip if already diatonic
    const flatSixPC = 8; // 8 semitones = minor 6th
    if ((!paletteFilter || paletteFilter.includes('major')) && !diatonicPitchClasses.has(flatSixPC)) {
        const flatSix = (scaleDegrees[0] + flatSixPC) % 12;
        palette.push({
            degree: 5,
            notes: buildChord(flatSix, 'major', keyOffset),
            chordType: 'major',
            chordName: getChordName(flatSix, 'major', keyOffset, '♭VI'),
            romanNumeral: '♭VI',
            spiceLevel: 3
        });
    }

    // ♭III - borrowed - skip if already diatonic
    const flatThreePC = 3; // 3 semitones = minor 3rd
    if ((!paletteFilter || paletteFilter.includes('major')) && !diatonicPitchClasses.has(flatThreePC)) {
        const flatThree = (scaleDegrees[0] + flatThreePC) % 12;
        palette.push({
            degree: 2,
            notes: buildChord(flatThree, 'major', keyOffset),
            chordType: 'major',
            chordName: getChordName(flatThree, 'major', keyOffset, '♭III'),
            romanNumeral: '♭III',
            spiceLevel: 3
        });
    }

    // iv - borrowed from parallel minor - skip if IV is already minor in mode
    const fourthQuality = scaleDegrees.length > 3 ? getChordQualityForMode(3, selectedMode) : null;
    if (scaleDegrees.length > 3 && fourthQuality !== 'minor' && (!paletteFilter || paletteFilter.includes('minor'))) {
        const fourth = scaleDegrees[3];
        palette.push({
            degree: 3,
            notes: buildChord(fourth, 'minor', keyOffset),
            chordType: 'minor',
            chordName: getChordName(fourth, 'minor', keyOffset),
            romanNumeral: 'iv',
            spiceLevel: 2
        });
    }

    // Sort by spice level (foundation first, spicy last)
    // Sort palette by priority (preferred first), then by spice level within same priority
    // Priority: 3=preferred, 2=allowed, 1=avoided
    // Spice: 0=foundation, 1=standard, 2=colorful, 3=spicy
    palette.sort((a, b) => {
        // Higher priority first (3 > 2 > 1)
        if (b.priority !== a.priority) {
            return b.priority - a.priority;
        }
        // Within same priority, lower spice first (foundation before spicy)
        return a.spiceLevel - b.spiceLevel;
    });

    // Apply variant-specific voicing styles to ORIGINAL PROGRESSION
    let voicedProgression = [...originalProgression];
    switch (variantType) {
        case 'Smooth':
            voicedProgression = optimizeSmoothVoiceLeading(voicedProgression);
            break;
        case 'Classic':
            voicedProgression = optimizeVoiceLeading(voicedProgression);
            break;
        case 'Jazz':
            voicedProgression = applyVoicingStyle(voicedProgression, 'close');
            voicedProgression = optimizeVoiceLeading(voicedProgression);
            break;
        case 'Modal':
            voicedProgression = applyVoicingStyle(voicedProgression, 'open');
            break;
        case 'Experimental':
            voicedProgression = applyVoicingStyle(voicedProgression, 'spread');
            break;
    }

    // Apply same voicing to palette (for pads beyond progression)
    let voicedPalette = palette;
    switch (variantType) {
        case 'Smooth':
            voicedPalette = optimizeSmoothVoiceLeading(voicedPalette);
            break;
        case 'Classic':
            voicedPalette = optimizeVoiceLeading(voicedPalette);
            break;
        case 'Jazz':
            voicedPalette = applyVoicingStyle(voicedPalette, 'close');
            voicedPalette = optimizeVoiceLeading(voicedPalette);
            break;
        case 'Modal':
            voicedPalette = applyVoicingStyle(voicedPalette, 'open');
            break;
        case 'Experimental':
            voicedPalette = applyVoicingStyle(voicedPalette, 'spread');
            break;
    }

    // Build complete chord queue: progression + palette
    const allChords = [...voicedProgression, ...voicedPalette];
    let chordQueueIndex = 0;

    // Helper: Get next chord from queue
    const getNextChord = () => {
        if (chordQueueIndex < allChords.length) {
            return allChords[chordQueueIndex++];
        }
        return null;
    };

    // Fill first 12 pads (rows 1-3) and collapse contiguous duplicates per row
    const rows1to3 = [];
    const initialPads = []; // Temporary storage before deduplication

    // First pass: fill all 12 slots
    for (let i = 0; i < 12; i++) {
        const sourceChord = getNextChord();
        if (!sourceChord) break;

        initialPads.push({
            sourceChord,
            isProgressionChord: i < originalProgressionLength
        });
    }

    // Second pass: collapse contiguous duplicates per row and refill
    for (let row = 0; row < 3; row++) {
        const rowStart = row * 4;
        const rowEnd = rowStart + 4;
        const rowPads = [];

        // Collapse duplicates in this row
        for (let i = rowStart; i < rowEnd && i < initialPads.length; i++) {
            const current = initialPads[i];
            const previous = rowPads.length > 0 ? rowPads[rowPads.length - 1] : null;

            // Skip if same chord as previous in this row
            if (previous && previous.sourceChord.romanNumeral === current.sourceChord.romanNumeral) {
                continue; // Skip duplicate
            }

            rowPads.push(current);
        }

        // Refill row to 4 pads with next available chords
        while (rowPads.length < 4) {
            const nextChord = getNextChord();
            if (!nextChord) break;

            rowPads.push({
                sourceChord: nextChord,
                isProgressionChord: false // Refilled slots are not progression chords
            });
        }

        // Convert to final pad format
        rowPads.forEach((padData, colIndex) => {
            const paletteChord = padData.sourceChord;
            let notes = paletteChord.notes;
            let chordName = paletteChord.chordName;
            let romanNumeral = paletteChord.romanNumeral;
            let chordType = paletteChord.chordType;
            const isProgressionChord = padData.isProgressionChord;
            const isChordMatcherChord = paletteChord.isChordMatcherChord || false;

            const padIndex = rowStart + colIndex;

            // Enhance chords based on variant type
            if (variantType === 'Jazz' && padIndex >= 4 && !chordType.includes('7') && !chordType.includes('m7b5')) {
                // Add 7ths to chords in Jazz variant: triads become 7th chords
                const scaleDegree = scaleDegrees[paletteChord.degree % scaleDegrees.length];
                chordType = chordType === 'minor' ? 'minor7' :
                           chordType === 'major' ? 'major7' :
                           chordType === 'diminished' ? 'm7b5' :
                           chordType === 'augmented' ? 'aug7' : chordType;
                notes = buildChord(scaleDegree, chordType, keyOffset);
                chordName = getChordName(scaleDegree, chordType, keyOffset);
            }

            // Map chord type to quality label
            let quality;
            if (chordType === 'major7') {
                quality = 'Major 7';
            } else if (chordType === 'minor7') {
                quality = 'Minor 7';
            } else if (chordType === 'minor' || chordType === 'minMaj7' || chordType === 'minor6') {
                quality = 'Minor';
            } else if (chordType === 'major') {
                quality = 'Major';
            } else if (chordType === 'diminished' || chordType === 'dim7' || chordType === 'm7b5') {
                quality = 'Diminished';
            } else if (chordType === 'augmented') {
                quality = 'Augmented';
            } else if (chordType === 'dom7' || chordType === 'dom9' || chordType === 'dom13') {
                quality = 'Dominant 7';
            } else if (chordType === 'sus2' || chordType === 'sus4' || chordType === 'quartal') {
                quality = 'Suspended';
            } else {
                quality = 'Major';
            }

            const pad = {
                id: padIndex + 1,
                chordName,
                romanNumeral,
                notes,
                quality,
                row: row + 1,
                col: colIndex + 1,
                isProgressionChord,
                isChordMatcherChord
            };

            pads.push(pad);
            rows1to3.push(pad);
        });
    }

    // Dynamically generate row 4 based on analysis of rows 1-3
    const row4Chords = selectDynamicRow4Chords(rows1to3, keyOffset, scaleDegrees, variantType);

    // Add Row 4 chords to pads
    for (let i = 0; i < 4; i++) {
        if (i < row4Chords.length) {
            const chord = row4Chords[i];
            pads.push({
                id: 13 + i,
                chordName: chord.chordName,
                romanNumeral: chord.romanNumeral,
                notes: chord.notes,
                quality: chord.quality,
                row: 4,
                col: i + 1,
                isProgressionChord: false,
                isChordMatcherChord: false
            });
        } else {
            // Fallback if not enough candidates (shouldn't happen)
            const degree = scaleDegrees[0];
            const notes = buildChord(degree, 'major', keyOffset);
            pads.push({
                id: 13 + i,
                chordName: getChordName(degree, 'major', keyOffset),
                romanNumeral: 'I',
                notes: notes,
                quality: 'Major',
                row: 4,
                col: i + 1,
                isProgressionChord: false,
                isChordMatcherChord: false
            });
        }
    }

    return {
        name: variantType,
        pads
    };
}

// Populate select elements
function populateSelects() {
    // Keys
    const keySelect = document.getElementById('keySelect');
    keys.forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        keySelect.appendChild(option);
    });

    // Modes (now all strings - get display info from i18n)
    const modeSelect = document.getElementById('modeSelect');
    Object.entries(modes).forEach(([category, modeList]) => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = i18n.t(`modeCategories.${category}`);
        modeList.forEach(modeValue => {
            const option = document.createElement('option');
            option.value = modeValue;

            // Get translated name (fallback to mode value)
            const translatedName = i18n.t(`modes.${modeValue}.name`);
            option.textContent = (translatedName && translatedName !== `modes.${modeValue}.name`)
                ? translatedName
                : modeValue;

            // Get translated description for tooltip
            const translatedDescription = i18n.t(`modes.${modeValue}.description`);
            if (translatedDescription && translatedDescription !== `modes.${modeValue}.description`) {
                option.title = translatedDescription;
            }

            optgroup.appendChild(option);
        });
        modeSelect.appendChild(optgroup);
    });

    // Progressions (get display info from i18n)
    const progressionSelect = document.getElementById('progressionSelect');
    Object.entries(progressions).forEach(([category, progList]) => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = i18n.t(`progressionCategories.${category}`);
        progList.forEach(prog => {
            const option = document.createElement('option');
            option.value = prog.value;
            const progKey = `progressions.${category}.${prog.value}`;

            // Get translated name (fallback to progression value)
            const translatedName = i18n.t(`${progKey}.name`);
            const displayName = (translatedName && translatedName !== `${progKey}.name`)
                ? translatedName
                : prog.value;

            // Get translated nickname
            const translatedNickname = i18n.t(`${progKey}.nickname`);
            const displayNickname = (translatedNickname && translatedNickname !== `${progKey}.nickname`)
                ? translatedNickname
                : '';

            option.textContent = displayNickname ? `${displayName} (${displayNickname})` : displayName;

            // Get translated description for tooltip
            const translatedDescription = i18n.t(`${progKey}.description`);
            if (translatedDescription && translatedDescription !== `${progKey}.description`) {
                option.title = translatedDescription;
            }

            optgroup.appendChild(option);
        });
        progressionSelect.appendChild(optgroup);
    });
}

// Update progression name
function updateProgressionName() {
    const key = selectedKey.split('/')[0];

    if (generationMode === 'template') {
        // Progression Palette Mode: Key + Progression
        const prog = selectedProgression.replaceAll(/—/g, '-');
        progressionName = `${key}_${prog}`;
    } else {
        // Scale Mode: Key + Mode
        const modeShort = selectedMode.slice(0, 3);
        progressionName = `${key}_${modeShort}_Scale-Exploration`;
    }

    document.getElementById('progressionName').value = progressionName;
}

// Helper to create a signature for a variant for duplicate detection
function getVariantSignature(variant) {
    return variant.pads.map(pad =>
        `${pad.chordName}|${pad.notes.join(',')}`
    ).join('||');
}

// Helper to create a chord-based signature (ignoring voicing)
function getChordProgressionSignature(variant) {
    return variant.pads.map(pad =>
        `${pad.chordName}|${pad.romanNumeral}`
    ).join('||');
}

// Remove duplicate variants
function deduplicateVariants(variantList) {
    const seenProgressions = new Map();
    const unique = [];

    variantList.forEach(variant => {
        const exactSignature = getVariantSignature(variant);
        const chordSignature = getChordProgressionSignature(variant);

        console.log(`Variant ${variant.name}:`);
        console.log(`  Chord progression: ${chordSignature.substring(0, 80)}...`);
        console.log(`  Exact voicing: ${exactSignature.substring(0, 80)}...`);

        // Check if we've seen this chord progression before (ignoring voicing)
        if (!seenProgressions.has(chordSignature)) {
            // First time seeing this chord progression - keep it
            seenProgressions.set(chordSignature, variant.name);
            unique.push(variant);
            console.log(`  ✓ Kept ${variant.name} (new chord progression)`);
        } else {
            // We've seen this chord progression before
            const firstVariant = seenProgressions.get(chordSignature);
            console.log(`  ✗ Dropped ${variant.name} (duplicate of ${firstVariant} - same chords, different voicing)`);
        }
    });

    console.log(`Deduplication: ${variantList.length} variants → ${unique.length} unique`);
    return unique;
}

function generateProgressions() {
    if (generationMode === 'template') {
        // Progression Palette Mode: Generate up to 5 variants based on progression
        if (selectedMode === 'Locrian' && selectedProgression.includes('I—IV—V')) {
            console.warn('⚠️ Locrian\'s diminished tonic makes this progression unusual');
        }

        const allVariants = [
            generateVariant('Smooth'),
            generateVariant('Classic'),
            generateVariant('Jazz'),
            generateVariant('Modal'),
            generateVariant('Experimental')
        ];

        // Remove duplicates - keep only unique variants
        variants = deduplicateVariants(allVariants);

        if (variants.length < allVariants.length) {
            console.log(`Generated ${variants.length} unique variant(s) out of ${allVariants.length}`);
        }
    } else {
        // Scale Mode: Generate single variant showing all scale chords
        variants = [
            generateScaleExploration()
        ];
    }

    renderProgressions();
    hasGeneratedOnce = true;
}

function downloadSingleProgression(variant, index) {
    const keyName = selectedKey.split('/')[0];
    const fileName = `${keyName}${selectedMode.slice(0,3)}_${selectedProgression.replaceAll(/—/g, '-')}_${variant.name}-${index + 1}.progression`;

    const progressionData = {
        progression: {
            name: fileName.replaceAll('.progression', ''),
            rootNote: keyName,
            scale: selectedMode,
            recordingOctave: 2,
            chords: variant.pads.map((pad, idx) => ({
                name: pad.chordName,
                role: idx === 0 ? "Root" : "Normal",
                notes: pad.notes
            }))
        }
    };

    const blob = new Blob([JSON.stringify(progressionData, null, 4)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadSingleMIDI(variant) {
    const keyName = selectedKey.split('/')[0];
    const fileName = `${keyName}${selectedMode.slice(0,3)}_${selectedProgression.replaceAll(/—/g, '-')}_${variant.name}`;

    // Get chord data from pads
    const chords = variant.pads.map(pad => ({
        name: pad.chordName,
        notes: pad.notes
    }));

    // Get indices of progression chords (chords that are part of the core progression)
    const progressionChordIndices = variant.pads
        .map((pad, idx) => pad.isProgressionChord ? idx : null)
        .filter(idx => idx !== null);

    try {
        const midiData = generateMIDIFile(chords, fileName, progressionChordIndices);
        downloadMIDIFile(midiData, fileName);
    } catch (error) {
        console.error('Failed to export MIDI file:', error);
        alert('Failed to export MIDI file. Please try again.');
    }
}

// Helper: Activate voice leading hover effect for a pad
function activateVoiceLeadingHover(pad) {
    const referenceNotesStr = pad.getAttribute('data-notes');
    if (!referenceNotesStr) return;

    const referenceNotes = referenceNotesStr.split(',').map(Number);
    const card = pad.closest('.progression-card');
    if (!card) return;

    const allPads = card.querySelectorAll('.chord-pad');

    // Add hover-reference class to this pad
    pad.classList.add('vl-hover-reference');

    // Recalculate colors for all other pads
    const hoverLegend = 'Distance from hovered chord:\n🟢 Smooth  🟡 Moderate  🟠 Dramatic';
    allPads.forEach(otherPad => {
        if (otherPad === pad) return; // Skip self

        const otherNotesStr = otherPad.getAttribute('data-notes');
        if (!otherNotesStr) return;

        const otherNotes = otherNotesStr.split(',').map(Number);
        const vlAnalysis = analyzeVoiceLeading(referenceNotes, otherNotes);

        // Remove existing voice leading classes
        otherPad.classList.remove('vl-smooth', 'vl-moderate', 'vl-leap');

        if (vlAnalysis && vlAnalysis.smoothness !== undefined) {
            let newClass;
            if (vlAnalysis.smoothness >= 4) {
                newClass = 'vl-smooth';
            } else if (vlAnalysis.smoothness >= 2) {
                newClass = 'vl-moderate';
            } else {
                newClass = 'vl-leap';
            }
            otherPad.classList.add(newClass);
            otherPad.setAttribute('data-hover-voice-leading', hoverLegend);
        }
    });
}

// Helper: Deactivate voice leading hover effect
function deactivateVoiceLeadingHover(pad) {
    pad.classList.remove('vl-hover-reference');
    const card = pad.closest('.progression-card');
    if (!card) return;

    const allPads = card.querySelectorAll('.chord-pad');

    allPads.forEach(otherPad => {
        // Restore original classes
        otherPad.classList.remove('vl-smooth', 'vl-moderate', 'vl-leap');
        const originalClass = otherPad.getAttribute('data-original-vl-class');
        if (originalClass) {
            otherPad.classList.add(originalClass);
        }
        // Remove hover tooltip
        otherPad.removeAttribute('data-hover-voice-leading');
    });
}

function renderProgressions() {
    const container = document.getElementById('progressionsContainer');
    container.innerHTML = '';

    variants.forEach((variant, index) => {
        const card = document.createElement('div');
        card.className = 'progression-card';

        // Create grid HTML for pads (reverse rows for MPC layout)
        const rows = [[], [], [], []];
        variant.pads.forEach(pad => {
            rows[pad.row - 1].push(pad);
        });

        // Calculate progression perimeter edges
        const progressionChordCount = variant.pads.filter(p => p.isProgressionChord).length;
        const progressionPadEdges = new Map();

        if (progressionChordCount > 0) {
            // Progression pads fill sequentially: rows from bottom to top (after reversal), left to right
            // Determine grid boundaries of progression pads
            const lastRow = Math.ceil(progressionChordCount / 4);
            const padsInLastRow = progressionChordCount % 4 || 4;

            variant.pads.forEach(pad => {
                if (pad.isProgressionChord) {
                    const edges = {
                        top: pad.id <= 4,  // First 4 pads
                        bottom: Math.ceil(pad.id / 4) === lastRow,  // Last row of progression
                        left: (pad.id - 1) % 4 === 0,  // Column 1
                        right: pad.id % 4 === 0 || (Math.ceil(pad.id / 4) === lastRow && (pad.id - 1) % 4 === padsInLastRow - 1)  // Column 4 or last in incomplete row
                    };
                    progressionPadEdges.set(pad.id, edges);
                }
            });
        }

        const gridHTML = rows.reverse().map((row, rowIndex) =>
            row.map((pad, padIndexInRow) => {
                const roleText = getChordTooltip(pad.romanNumeral, pad.quality);

                // Calculate voice leading distance from tonic (default state)
                let voiceLeadingClass = '';
                let voiceLeadingLegend = 'Relative smoothness:\n🟢 Smooth  🟡 Moderate  🟠 Dramatic';

                // Find the tonic chord (first chord or roman numeral I/i)
                const allPads = variant.pads.sort((a, b) => a.id - b.id);
                const tonicPad = allPads.find(p => p.romanNumeral && p.romanNumeral.toUpperCase().startsWith('I') && !p.romanNumeral.includes('V')) || allPads[0];

                if (tonicPad && pad.id !== tonicPad.id) {
                    const vlAnalysis = analyzeVoiceLeading(tonicPad.notes, pad.notes);

                    if (vlAnalysis) {
                        // Color code based on distance from tonic
                        if (vlAnalysis.smoothness >= 4) {
                            voiceLeadingClass = 'vl-smooth';  // Close to tonic
                        } else if (vlAnalysis.smoothness >= 2) {
                            voiceLeadingClass = 'vl-moderate';  // Moderate distance
                        } else {
                            voiceLeadingClass = 'vl-leap';  // Far from tonic
                        }
                    }
                }

                // Map quality to chord type for inversion detection
                let chordTypeForInversion = 'major';
                if (pad.quality === 'Minor') chordTypeForInversion = 'minor';
                else if (pad.quality === 'Minor 7') chordTypeForInversion = 'minor7';
                else if (pad.quality === 'Major 7') chordTypeForInversion = 'major7';
                else if (pad.quality === 'Dominant 7') chordTypeForInversion = 'dom7';
                else if (pad.quality === 'Diminished') chordTypeForInversion = 'diminished';

                // Get inversion notation for this chord
                const inversionNotation = getInversionNotation(pad.notes, chordTypeForInversion, pad.chordName, pad.romanNumeral);
                const displayName = pad.chordName + inversionNotation;

                // Get progression edge attributes
                const edges = progressionPadEdges.get(pad.id);
                const edgeAttrs = edges ? `data-prog-edge-top="${edges.top}" data-prog-edge-bottom="${edges.bottom}" data-prog-edge-left="${edges.left}" data-prog-edge-right="${edges.right}"` : '';

                return `
                <div class="chord-pad ${pad.isProgressionChord ? 'progression-chord' : ''} ${pad.isChordMatcherChord ? 'chord-matcher-chord' : ''} ${voiceLeadingClass}"
                    data-notes="${pad.notes.join(',')}" data-roman="${pad.romanNumeral}" data-quality="${pad.quality}" data-role="${roleText.replaceAll(/"/g, '&quot;')}"
                    data-pad-id="${pad.id}" data-original-vl-class="${voiceLeadingClass}"
                    data-voice-leading="${voiceLeadingLegend}" ${edgeAttrs}>
                    <div class="chord-text-column">
                        <div class="chord-pad-content">
                            <div class="chord-info">
                                <div class="chord-name">${displayName}</div>
                            </div>
                            <div class="pad-number">${hasTouch ? pad.id : 'PAD ' + pad.id}</div>
                        </div>
                        <div class="chord-quality">${pad.quality}</div>
                        <div class="chord-roman">${pad.romanNumeral}</div>
                    </div>
                    <div class="chord-info-column">
                        <div class="chord-role">${roleText}</div>
                        <div class="chord-notes">
                            ${(() => {
                                // Map quality to chord type for proper spelling
                                let chordType = 'major';
                                if (pad.quality === 'Minor') chordType = 'minor';
                                else if (pad.quality === 'Minor 7') chordType = 'minor7';
                                else if (pad.quality === 'Major 7') chordType = 'major7';
                                else if (pad.quality === 'Dominant 7') chordType = 'dom7';
                                else if (pad.quality === 'Diminished') chordType = 'diminished';

                                // Get properly spelled note names (pass actual voicing)
                                const noteStrings = spellChordNotes(pad.notes, chordType, pad.romanNumeral);

                                // Group notes in pairs for wrapping
                                const pairs = [];
                                for (let i = 0; i < noteStrings.length; i += 2) {
                                    const pair = noteStrings.slice(i, i + 2).join(' ');
                                    pairs.push(`<span class="note-pair">${pair}</span>`);
                                }
                                return pairs.join(' ');
                            })()}
                        </div>
                    </div>
                    <div class="chord-keyboard">${generateKeyboardSVG(pad.notes)}</div>
                    <div class="chord-guitar">${generateGuitarSVG(getGuitarChord(pad), pad, isLeftHanded)}</div>
                    <div class="chord-staff">${generateStaffSVG(pad.notes)}</div>
                </div>
            `;
            }).join('')
        ).join('');

        const progressionAnalysis = analyzeProgression(variant.pads);

        // Calculate progression length for clarification text (already declared above for edge calculation)
        const progressionClarification = progressionChordCount > 0
            ? i18n.t('variants.progressionClarification', { count: progressionChordCount, next: progressionChordCount + 1 })
            : '';

        // Add voicing style annotation
        let voicingStyle = '';
        let uniquenessTooltip = '';

        if (variant.name && i18n.t(`variants.${variant.name}.label`)) {
            voicingStyle = i18n.t(`variants.${variant.name}.label`);
            uniquenessTooltip = i18n.t(`variants.${variant.name}.tooltip`);
        }

        // Detect cadence type
        const cadence = detectCadence(selectedProgression);
        const cadenceDisplay = cadence ? `<span class="cadence" data-tooltip="${i18n.t(`cadences.${cadence.key}.tooltip`)}">${cadence.emoji} ${i18n.t(`cadences.${cadence.key}.name`)}</span>` : '';

        card.innerHTML = `
            <div class="progression-header">
                <div class="progression-info">
                    <div class="progression-title-row">
                        <div class="progression-title" data-tooltip="${uniquenessTooltip}">
                            <div class="title-line-1">${progressionName}_${variant.name}</div>
                            ${voicingStyle ? `<div class="title-line-2">${voicingStyle}</div>` : ''}
                        </div>
                        <span class="progression-explainer">${uniquenessTooltip}</span>
                    </div>
                    <div class="progression-meta">
                        <span class="key">${selectedKey} ${selectedMode}</span>
                        <span class="pattern">${selectedProgression}</span>
                        ${cadenceDisplay}
                        ${progressionAnalysis ? `<span class="analysis">${progressionAnalysis}</span>` : ''}
                        <span class="voice-leading-hint">${progressionClarification}${i18n.t('variants.chordDistanceHint')}</span>
                    </div>
                </div>
                <button class="download-btn" data-variant-index="${index}">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                </button>
            </div>
            <div class="chord-grid">${gridHTML}</div>
            <div class="voice-leading-hint-bottom">${progressionClarification}${i18n.t('variants.chordDistanceHint')}</div>
        `;

        container.appendChild(card);
    });

    // Tablet: Setup tap-to-show tooltip for progression titles
    if (hasTouch && !hasHover) {
        container.querySelectorAll('.progression-title').forEach(title => {
            const tooltipText = title.dataset.tooltip;
            if (tooltipText) {
                title.addEventListener('click', function(e) {
                    const currentElement = e.currentTarget;
                    e.stopPropagation();

                    const tooltip = document.getElementById('chordTooltip');
                    if (tooltip && tooltip.classList.contains('visible') && activeTooltip === currentElement) {
                        // Already showing this tooltip, hide it
                        tooltip.classList.remove('visible');
                        activeTooltip = null;
                    } else {
                        // Show tooltip
                        showTooltip(currentElement, tooltipText);
                        activeTooltip = currentElement;

                        // Auto-hide after 5 seconds
                        setTimeout(() => {
                            if (activeTooltip === currentElement) {
                                const tooltip = document.getElementById('chordTooltip');
                                if (tooltip) tooltip.classList.remove('visible');
                                activeTooltip = null;
                            }
                        }, 5000);
                    }
                });
            }
        });

        // Also handle cadence tooltips on touch devices
        container.querySelectorAll('.cadence').forEach(cadence => {
            const tooltipText = cadence.dataset.tooltip;
            if (tooltipText) {
                cadence.addEventListener('click', function(e) {
                    const currentElement = e.currentTarget;
                    e.stopPropagation();

                    const tooltip = document.getElementById('chordTooltip');
                    if (tooltip && tooltip.classList.contains('visible') && activeTooltip === currentElement) {
                        tooltip.classList.remove('visible');
                        activeTooltip = null;
                    } else {
                        showTooltip(currentElement, tooltipText);
                        activeTooltip = currentElement;

                        setTimeout(() => {
                            if (activeTooltip === currentElement) {
                                const tooltip = document.getElementById('chordTooltip');
                                if (tooltip) tooltip.classList.remove('visible');
                                activeTooltip = null;
                            }
                        }, 5000);
                    }
                });
            }
        });
    }

    // Add hover handlers for cadence tooltips (desktop)
    if (hasHover) {
        container.querySelectorAll('.cadence').forEach(cadence => {
            const tooltipText = cadence.dataset.tooltip;
            if (tooltipText) {
                cadence.addEventListener('pointerenter', function() {
                    showTooltip(this, tooltipText);
                });
                cadence.addEventListener('pointerleave', function() {
                    const tooltip = document.getElementById('chordTooltip');
                    if (tooltip) tooltip.classList.remove('visible');
                });
            }
        });
    }

    // Add hover handlers for tooltips and interactive voice leading
    // Using pointer events (supports both mouse and touch)
    container.querySelectorAll('.chord-pad').forEach(pad => {
        // Desktop: Hover + Click-to-lock voice leading
        if (hasHover) {
            pad.addEventListener('pointerenter', function() {
                const roman = this.getAttribute('data-roman');
                const quality = this.getAttribute('data-quality');

                // Activate voice leading hover effect (only if not locked on another pad)
                if (!voiceLeadingLocked || voiceLeadingLocked === this) {
                    activateVoiceLeadingHover(this);
                }

                // Always show tooltip on hover (even if voice leading is locked elsewhere)
                // In keyboard context, no tooltip (chord function is visible on card)
                if (currentContext !== 'keyboard') {
                    const chordFunction = getChordTooltip(roman, quality) || 'Chord';
                    showTooltip(this, chordFunction);
                }
            });

            pad.addEventListener('pointerleave', function() {
                // Don't clear locked voice leading on leave
                if (voiceLeadingLocked !== this) {
                    deactivateVoiceLeadingHover(this);
                }

                // Always hide tooltip on leave
                const tooltip = document.getElementById('chordTooltip');
                if (tooltip) tooltip.classList.remove('visible');
            });

            // Click to lock/unlock voice leading (desktop)
            pad.addEventListener('click', function(e) {
                // Don't interfere with card click if Shift/Ctrl/Alt pressed
                if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
                    return;
                }

                const currentPad = e.currentTarget;

                // Clear any previous lock on a DIFFERENT pad
                if (voiceLeadingLocked && voiceLeadingLocked !== currentPad) {
                    deactivateVoiceLeadingHover(voiceLeadingLocked);
                }

                // Lock voice leading to this pad (even if already locked)
                // This allows playing the same note twice without losing chord distance hints
                activateVoiceLeadingHover(currentPad);
                voiceLeadingLocked = currentPad;

                // Don't stop propagation - allow chord to play
            }, { capture: true }); // Use capture to run before the play handler
        }

        // Touch device: Long-press for voice leading lock AND tooltip
        if (hasTouch && !hasHover) {
            let longPressTimer = null;

            pad.addEventListener('pointerdown', function(e) {
                const currentPad = e.currentTarget;

                longPressTimer = setTimeout(() => {
                    // Long press: toggle voice leading visualization (ALL contexts)
                    if (voiceLeadingLocked === currentPad) {
                        // Already locked on this pad, unlock it
                        deactivateVoiceLeadingHover(currentPad);
                        voiceLeadingLocked = null;
                    } else {
                        // Clear any previous lock
                        if (voiceLeadingLocked) {
                            deactivateVoiceLeadingHover(voiceLeadingLocked);
                        }
                        // Lock voice leading to this pad
                        activateVoiceLeadingHover(currentPad);
                        voiceLeadingLocked = currentPad;
                    }

                    // Also show tooltip with chord function (except keyboard context where it's visible inline)
                    if (currentContext !== 'keyboard') {
                        const roman = currentPad.dataset.roman;
                        const quality = currentPad.dataset.quality;
                        const roleText = getChordTooltip(roman, quality);
                        if (roleText) {
                            showTooltip(currentPad, roleText);
                            activeTooltip = currentPad;
                            // Auto-hide after 3 seconds
                            setTimeout(() => {
                                if (activeTooltip === currentPad) {
                                    const tooltip = document.getElementById('chordTooltip');
                                    if (tooltip) tooltip.classList.remove('visible');
                                    activeTooltip = null;
                                }
                            }, 3000);
                        }
                    }

                    // Haptic feedback if available
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                }, 500); // 500ms for long press
            });

            pad.addEventListener('pointerup', function(e) {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                }
            });

            pad.addEventListener('pointercancel', function(e) {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                }
            });
        }
    });

    // Add click handlers for playing chords
    container.querySelectorAll('.chord-pad').forEach(pad => {
        pad.addEventListener('click', function() {
            const notes = this.getAttribute('data-notes').split(',').map(Number);

            // In staff context, play notes sequentially as eighth notes at 90 BPM
            if (currentContext === 'staff') {
                playNotesSequentially(notes);
                this.classList.add('playing');
                // Remove playing class after all notes have played
                const totalDuration = getSequentialDuration(notes.length);
                setTimeout(() => this.classList.remove('playing'), totalDuration);
            } else {
                // In other contexts, play as a chord
                playChord(notes);
                this.classList.add('playing');
                setTimeout(() => this.classList.remove('playing'), TIMING.PLAYING_FLASH);
            }
        });
    });

    // Ensure tooltip is hidden when pointer leaves the progression area (desktop)
    if (hasHover) {
        container.addEventListener('pointerleave', function() {
            const tooltip = document.getElementById('chordTooltip');
            if (tooltip) tooltip.classList.remove('visible');
        });
    }

    // Click outside any chord pad to reset voice leading colors (both desktop and tablet)
    container.addEventListener('click', function(e) {
        // Check if click was on a chord pad or inside one
        const clickedPad = e.target.closest('.chord-pad');
        if (!clickedPad && voiceLeadingLocked) {
            // Clicked outside all pads, reset voice leading
            deactivateVoiceLeadingHover(voiceLeadingLocked);
            voiceLeadingLocked = null;
        }
    });

    // Add click handlers for individual download buttons
    container.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const variantIndex = parseInt(this.getAttribute('data-variant-index'));
            if (currentContext === 'midi') {
                downloadSingleMIDI(variants[variantIndex]);
            } else {
                downloadSingleProgression(variants[variantIndex], variantIndex);
            }
        });
    });

    // Add custom tooltips for download buttons (desktop only)
    if (hasHover) {
        container.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('pointerenter', function() {
                showTooltip(this, 'Download');
            });
            btn.addEventListener('pointerleave', function() {
                const tooltip = document.getElementById('chordTooltip');
                if (tooltip) tooltip.classList.remove('visible');
            });
        });
    }

    container.classList.remove('hidden');
    document.getElementById('downloadAllBtn').style.display = 'block';
}

function exportProgressions() {
    if (variants.length === 0) {
        alert('Please generate progressions first!');
        return;
    }

    const zip = new JSZip();
    const keyName = selectedKey.split('/')[0];

    variants.forEach((variant, index) => {
        const fileName = `${keyName}${selectedMode.slice(0,3)}_${selectedProgression.replaceAll(/—/g, '-')}_${variant.name}-${index + 1}.progression`;

        const progressionData = {
            progression: {
                name: fileName.replaceAll('.progression', ''),
                rootNote: keyName,
                scale: selectedMode,
                recordingOctave: 2,
                chords: variant.pads.map((pad, idx) => ({
                    name: pad.chordName,
                    role: idx === 0 ? "Root" : "Normal",
                    notes: pad.notes
                }))
            }
        };

        zip.file(fileName, JSON.stringify(progressionData, null, 4));
    });

    zip.generateAsync({ type: 'blob' }).then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${progressionName}_All-Variants.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

async function exportAllMIDI() {
    if (variants.length === 0) {
        alert('Please generate progressions first!');
        return;
    }

    // Prepare progression data for MIDI export
    const progressionsData = variants.map((variant, index) => {
        const keyName = selectedKey.split('/')[0];
        const fileName = `${keyName}${selectedMode.slice(0,3)}_${selectedProgression.replaceAll(/—/g, '-')}_${variant.name}`;

        // Get chord data from pads
        const chords = variant.pads.map(pad => ({
            name: pad.chordName,
            notes: pad.notes
        }));

        // Get indices of progression chords (chords that are part of the core progression)
        const progressionChordIndices = variant.pads
            .map((pad, idx) => pad.isProgressionChord ? idx : null)
            .filter(idx => idx !== null);

        return {
            name: fileName,
            chords: chords,
            progressionChordIndices: progressionChordIndices
        };
    });

    try {
        await downloadAllMIDIFiles(progressionsData, progressionName);
    } catch (error) {
        console.error('Failed to export MIDI files:', error);
        alert('Failed to export MIDI files. Please try again.');
    }
}

// Update all translatable elements in the page
function updatePageTranslations() {
    // Update all elements with data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = i18n.t(key);

        // Update text content, preserving any child elements
        if (element.children.length === 0) {
            element.textContent = translation;
        } else {
            // For elements with children, only update text nodes
            Array.from(element.childNodes).forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    node.textContent = translation;
                }
            });
        }
    });

    // Repopulate dropdowns with translated text
    populateSelects();
}

// Event listeners
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize i18n with current language
    const currentLang = i18n.getCurrentLanguage();
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        // Populate language selector dynamically from i18n
        const availableLanguages = i18n.getAvailableLanguages();
        languageSelect.innerHTML = '';
        availableLanguages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.code;
            option.textContent = lang.name;
            languageSelect.appendChild(option);
        });
        languageSelect.value = currentLang;

        // Add language change event listener
        languageSelect.addEventListener('change', async function() {
            const newLang = this.value;
            await i18n.setLanguage(newLang);
            updatePageTranslations();

            // Re-render progressions if they've been generated
            if (hasGeneratedOnce && variants.length > 0) {
                renderProgressions();
            }
        });
    }

    // Load language before populating selects
    await i18n.loadLanguage(currentLang);

    initAudioContext();
    initMIDI();

    // Update translations and populate selects
    updatePageTranslations();

    // Load preferences: URL params take priority over localStorage
    const urlPrefs = loadFromURL();
    const storedPrefs = loadFromLocalStorage();
    const prefsToApply = urlPrefs || storedPrefs;

    let savedGenerationMode = 'template'; // Default to template mode
    if (prefsToApply) {
        const applied = applyPreferences(prefsToApply);
        // CRITICAL: Update state variables from applied preferences
        if (applied) {
            if (applied.key) selectedKey = applied.key;
            if (applied.mode) selectedMode = applied.mode;
            if (applied.progression) selectedProgression = applied.progression;
            if (applied.leftHanded !== undefined) isLeftHanded = applied.leftHanded;
            // Restore saved context (will be applied after event listeners are set up)
            if (applied.context) {
                // Don't call switchContext yet, just store it for later
                currentContext = applied.context;
            }
            // Restore saved generation mode
            if (applied.generationMode) {
                savedGenerationMode = applied.generationMode;
            }
        }
    }

    updateProgressionName();
    renderChordRequirements(); // Initialize chord requirements display

    // Initialize generation mode (restore saved mode or default to template)
    switchGenerationMode(savedGenerationMode, true); // skipSave=true during initialization
    // Update radio button to match restored mode
    if (savedGenerationMode === 'scale') {
        document.getElementById('scaleModeRadio').checked = true;
    } else {
        document.getElementById('paletteModeRadio').checked = true;
    }

    // Add event listeners for generation mode toggle
    document.getElementById('paletteModeRadio').addEventListener('change', function() {
        if (this.checked) switchGenerationMode('template');
    });
    document.getElementById('scaleModeRadio').addEventListener('change', function() {
        if (this.checked) switchGenerationMode('scale');
    });

    document.getElementById('keySelect').addEventListener('change', function() {
        selectedKey = this.value;
        updateProgressionName();
        saveToLocalStorage(selectedKey, selectedMode, selectedProgression, isLeftHanded, currentContext, generationMode);
        updateURL(selectedKey, selectedMode, selectedProgression, isLeftHanded);
        if (hasGeneratedOnce) {
            triggerSparkle();
            generateProgressions();
        }
    });

    document.getElementById('modeSelect').addEventListener('change', function() {
        selectedMode = this.value;
        updateProgressionName();
        saveToLocalStorage(selectedKey, selectedMode, selectedProgression, isLeftHanded, currentContext, generationMode);
        updateURL(selectedKey, selectedMode, selectedProgression, isLeftHanded);
        if (hasGeneratedOnce) {
            triggerSparkle();
            generateProgressions();
        }
    });

    document.getElementById('progressionSelect').addEventListener('change', function() {
        selectedProgression = this.value;
        updateProgressionName();
        saveToLocalStorage(selectedKey, selectedMode, selectedProgression, isLeftHanded, currentContext, generationMode);
        updateURL(selectedKey, selectedMode, selectedProgression, isLeftHanded);
        if (hasGeneratedOnce) {
            triggerSparkle();
            generateProgressions();
        }
    });

    document.getElementById('progressionName').addEventListener('input', function() {
        progressionName = this.value;
    });

    document.getElementById('generateBtn').addEventListener('click', generateProgressions);

    // Handle Download/Print button based on context
    document.getElementById('downloadAllBtn').addEventListener('click', () => {
        if (currentContext === 'mpc') {
            exportProgressions();
        } else if (currentContext === 'midi') {
            exportAllMIDI();
        } else {
            printAllProgressions();
        }
    });

    // Context tab switching
    document.querySelectorAll('.context-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const context = tab.getAttribute('data-context');
            switchContext(context);
        });
    });

    // Custom tooltips for mode option labels (desktop only)
    if (hasHover) {
        const paletteModeLabel = document.getElementById('paletteModeLabel');
        paletteModeLabel.addEventListener('pointerenter', function() {
            showTooltip(this, 'Generate 16-pad chord palettes from curated progressions across 15 genres. Creates 5 voicing variants (Smooth, Classic, Jazz, Modal, Experimental). Genre-specific filters tailor the extended harmony.');
        });
        paletteModeLabel.addEventListener('pointerleave', function() {
            const tooltip = document.getElementById('chordTooltip');
            if (tooltip) tooltip.classList.remove('visible');
        });

        const scaleModeLabel = document.getElementById('scaleModeLabel');
        scaleModeLabel.addEventListener('pointerenter', function() {
            showTooltip(this, 'Explore a scale/mode by generating all available chords. Perfect for learning exotic scales like Whole Tone, Phrygian Dominant, or Hungarian Minor.');
        });
        scaleModeLabel.addEventListener('pointerleave', function() {
            const tooltip = document.getElementById('chordTooltip');
            if (tooltip) tooltip.classList.remove('visible');
        });

        // Custom tooltip for MIDI selector
        const midiSelector = document.getElementById('midiSelector');
        midiSelector.addEventListener('pointerenter', function() {
            showTooltip(this, 'Play with computer keys: cvbn (pads 1-4), dfgh (5-8), erty (9-12), 3456 (13-16)');
        });
        midiSelector.addEventListener('pointerleave', function() {
            const tooltip = document.getElementById('chordTooltip');
            if (tooltip) tooltip.classList.remove('visible');
        });

        // Custom tooltips for progressionSelect (dynamic based on state)
        const progressionSelect = document.getElementById('progressionSelect');
        progressionSelect.addEventListener('pointerenter', function() {
            if (this.disabled) {
                showTooltip(this, 'Progression palettes are not used in Scale Mode. All chords from the selected scale will be generated.');
            } else {
                showTooltip(this, 'Each palette provides 16 unique chords: first N from the progression, remaining pads from extended harmony. Genre-specific filters ensure appropriate chord colors.');
            }
        });
        progressionSelect.addEventListener('pointerleave', function() {
            const tooltip = document.getElementById('chordTooltip');
            if (tooltip) tooltip.classList.remove('visible');
        });

        // Custom tooltips for modeSelect (dynamic based on state)
        const modeSelect = document.getElementById('modeSelect');
        modeSelect.addEventListener('pointerenter', function() {
            if (this.disabled) {
                showTooltip(this, 'Mode/Scale selector is not used in Progression Palette Mode. The progression defines its own harmonic structure.');
            }
            // No tooltip when enabled (empty state)
        });
        modeSelect.addEventListener('pointerleave', function() {
            const tooltip = document.getElementById('chordTooltip');
            if (tooltip) tooltip.classList.remove('visible');
        });
    }

    // Tablet/Touch: Tap to show tooltips (with auto-hide)
    if (hasTouch && !hasHover) {
        // Helper to toggle tooltip on tap
        function setupTapTooltip(element, tooltipTextOrCallback) {
            element.addEventListener('click', function(e) {
                const currentElement = e.currentTarget;

                // If element is a label, allow the click to propagate (for radio/checkbox)
                if (element.tagName === 'LABEL') {
                    // Don't prevent default, let the label work normally
                } else {
                    e.stopPropagation();
                }

                // Get tooltip text (can be string or function)
                const tooltipText = typeof tooltipTextOrCallback === 'function'
                    ? tooltipTextOrCallback.call(currentElement)
                    : tooltipTextOrCallback;

                if (tooltipText) {
                    const tooltip = document.getElementById('chordTooltip');
                    if (tooltip && tooltip.classList.contains('visible') && activeTooltip === currentElement) {
                        // Already showing this tooltip, hide it
                        tooltip.classList.remove('visible');
                        activeTooltip = null;
                    } else {
                        // Show tooltip
                        showTooltip(currentElement, tooltipText);
                        activeTooltip = currentElement;

                        // Auto-hide after 5 seconds
                        setTimeout(() => {
                            if (activeTooltip === currentElement) {
                                const tooltip = document.getElementById('chordTooltip');
                                if (tooltip) tooltip.classList.remove('visible');
                                activeTooltip = null;
                            }
                        }, 5000);
                    }
                }
            });
        }

        // Hide tooltip when tapping outside
        document.addEventListener('click', function(e) {
            const tooltip = document.getElementById('chordTooltip');
            if (tooltip && activeTooltip && !activeTooltip.contains(e.target)) {
                tooltip.classList.remove('visible');
                activeTooltip = null;
            }
        });

        // Setup tap tooltips for labels
        const paletteModeLabel = document.getElementById('paletteModeLabel');
        setupTapTooltip(paletteModeLabel, 'Generate 16-pad chord palettes from curated progressions across 15 genres. Creates 5 voicing variants (Smooth, Classic, Jazz, Modal, Experimental). Genre-specific filters tailor the extended harmony.');

        const scaleModeLabel = document.getElementById('scaleModeLabel');
        setupTapTooltip(scaleModeLabel, 'Explore a scale/mode by generating all available chords. Perfect for learning exotic scales like Whole Tone, Phrygian Dominant, or Hungarian Minor.');

        // MIDI selector (informational only, keyboard doesn't work on tablets)
        const midiSelector = document.getElementById('midiSelector');
        setupTapTooltip(midiSelector, 'Keyboard shortcuts are for desktop. On tablets, tap chord pads to play them.');

        // Progression select (dynamic tooltip)
        const progressionSelect = document.getElementById('progressionSelect');
        setupTapTooltip(progressionSelect, function() {
            if (this.disabled) {
                return 'Progression palettes are not used in Scale Mode. All chords from the selected scale will be generated.';
            } else {
                return 'Each palette provides 16 unique chords: first N from the progression, remaining pads from extended harmony. Genre-specific filters ensure appropriate chord colors.';
            }
        });

        // Mode select (dynamic tooltip)
        const modeSelect = document.getElementById('modeSelect');
        setupTapTooltip(modeSelect, function() {
            if (this.disabled) {
                return 'Mode/Scale selector is not used in Progression Palette Mode. The progression defines its own harmonic structure.';
            }
            return null; // No tooltip when enabled
        });
    }

    // Left-handed toggle for guitar
    document.getElementById('leftHandedCheckbox').addEventListener('change', function() {
        isLeftHanded = this.checked;
        saveToLocalStorage(selectedKey, selectedMode, selectedProgression, isLeftHanded, currentContext, generationMode);
        updateURL(selectedKey, selectedMode, selectedProgression, isLeftHanded);
        // Regenerate progressions to reflect the change
        const progressionsContainer = document.getElementById('progressionsContainer');
        if (!progressionsContainer.classList.contains('hidden')) {
            generateProgressions();
        }
    });

    // Handle print orientation based on context
    let printStyleElement = null;

    globalThis.addEventListener('beforeprint', () => {
        // Remove any existing print style
        if (printStyleElement) {
            printStyleElement.remove();
        }

        // Create dynamic @page rule based on current context
        printStyleElement = document.createElement('style');
        if (currentContext === 'keyboard' || currentContext === 'staff') {
            // Keyboard and staff diagrams are wide - use landscape
            printStyleElement.textContent = '@page { size: landscape; margin: 1cm; }';
        } else {
            // Guitar and MPC use portrait (guitar diagrams are tall)
            printStyleElement.textContent = '@page { size: portrait; margin: 1cm; }';
        }
        document.head.appendChild(printStyleElement);
    });

    globalThis.addEventListener('afterprint', () => {
        // Clean up after printing
        if (printStyleElement) {
            printStyleElement.remove();
            printStyleElement = null;
        }
    });

    // Keyboard controls for triggering pads 1-16
    // Keys cvbndfgherty3456 map to pads, works with CAPS LOCK on
    const keyToPad = {
        'c': 1, 'v': 2, 'b': 3, 'n': 4,     // Bottom visual row (Row 1)
        'd': 5, 'f': 6, 'g': 7, 'h': 8,     // Row 2
        'e': 9, 'r': 10, 't': 11, 'y': 12,  // Row 3
        '3': 13, '4': 14, '5': 15, '6': 16  // Top visual row (Row 4)
    };

    // Track pressed keys to avoid key-repeat and for note-off
    const pressedKeys = new Map(); // key -> { notes, padElement }

    // Calculate visible area of element in viewport
    function getVisibleArea(element) {
        const rect = element.getBoundingClientRect();
        const viewportHeight = globalThis.innerHeight || document.documentElement.clientHeight;
        const viewportWidth = globalThis.innerWidth || document.documentElement.clientWidth;

        // Calculate intersection rectangle
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(viewportHeight, rect.bottom);
        const visibleLeft = Math.max(0, rect.left);
        const visibleRight = Math.min(viewportWidth, rect.right);

        // Calculate visible area
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const visibleWidth = Math.max(0, visibleRight - visibleLeft);

        return visibleHeight * visibleWidth;
    }

    // Keydown: start playing chord
    document.addEventListener('keydown', (event) => {
        // Ignore if typing in an input field
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        // Ignore if any modifier keys are pressed (allow browser shortcuts like Ctrl-R, Ctrl-T, etc.)
        if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
            return;
        }

        // Get key in lowercase to support CAPS LOCK
        const key = event.key.toLowerCase();
        const padNumber = keyToPad[key];

        if (padNumber) {
            // Ignore key-repeat
            if (pressedKeys.has(key)) {
                return;
            }

            // Prevent default browser behavior
            event.preventDefault();

            // Find the progression card with the most visible area in viewport
            const container = document.getElementById('progressionsContainer');
            const allCards = container.querySelectorAll('.progression-card');

            let mostVisibleCard = null;
            let maxVisibleArea = 0;

            allCards.forEach(card => {
                const visibleArea = getVisibleArea(card);
                if (visibleArea > maxVisibleArea) {
                    maxVisibleArea = visibleArea;
                    mostVisibleCard = card;
                }
            });

            // Find and play the pad in the most visible card
            if (mostVisibleCard) {
                const pads = mostVisibleCard.querySelectorAll('.chord-pad');
                pads.forEach(pad => {
                    const padText = pad.querySelector('.pad-number');
                    const expectedText = hasTouch ? `${padNumber}` : `PAD ${padNumber}`;
                    if (padText?.textContent === expectedText) {
                        const notes = pad.dataset.notes.split(',').map(Number);

                        // In staff context, play sequentially (click behavior)
                        if (currentContext === 'staff') {
                            playNotesSequentially(notes);
                            pad.classList.add('playing');
                            const totalDuration = getSequentialDuration(notes.length);
                            setTimeout(() => pad.classList.remove('playing'), totalDuration);
                        } else {
                            // Start sustained chord for keyboard
                            startChord(notes);
                            pad.classList.add('playing');

                            // Activate voice leading hover effect
                            activateVoiceLeadingHover(pad);

                            // Store for keyup event
                            pressedKeys.set(key, { notes, padElement: pad });
                        }
                    }
                });
            }
        }
    });

    // Keyup: stop playing chord
    document.addEventListener('keyup', (event) => {
        // Ignore if typing in an input field
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        // Ignore if any modifier keys are pressed
        if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
            return;
        }

        // Get key in lowercase to support CAPS LOCK
        const key = event.key.toLowerCase();

        if (pressedKeys.has(key)) {
            const { notes, padElement } = pressedKeys.get(key);

            // Stop the chord
            stopChord(notes);

            // Remove visual feedback
            if (padElement) {
                padElement.classList.remove('playing');
                // Deactivate voice leading hover effect
                deactivateVoiceLeadingHover(padElement);
            }

            // Remove from pressed keys
            pressedKeys.delete(key);
        }
    });

    // Release all notes when window loses focus (prevent stuck notes)
    globalThis.addEventListener('blur', () => {
        // Stop all audio
        stopAllNotes();

        // Clear visual feedback
        pressedKeys.forEach(({ padElement }) => {
            if (padElement) {
                padElement.classList.remove('playing');
            }
        });
        pressedKeys.clear();
    });

    // Tablet: Handle orientation changes smoothly
    if (hasTouch && isTablet) {
        let currentOrientation = globalThis.matchMedia("(orientation: portrait)").matches ? 'portrait' : 'landscape';

        // Listen for orientation changes
        const orientationQuery = globalThis.matchMedia("(orientation: portrait)");
        orientationQuery.addEventListener('change', (e) => {
            const newOrientation = e.matches ? 'portrait' : 'landscape';

            if (newOrientation !== currentOrientation) {
                currentOrientation = newOrientation;

                // Clear any locked voice leading visualization
                if (voiceLeadingLocked) {
                    deactivateVoiceLeadingHover(voiceLeadingLocked);
                    voiceLeadingLocked = null;
                }

                // Hide any active tooltips
                if (activeTooltip) {
                    const tooltip = document.getElementById('chordTooltip');
                    if (tooltip) tooltip.classList.remove('visible');
                    activeTooltip = null;
                }

                // If progressions have been generated, trigger a small delay to let CSS settle
                // This helps with rendering issues during orientation change
                if (hasGeneratedOnce) {
                    setTimeout(() => {
                        // Force a reflow to ensure CSS media queries take effect
                        void document.body.offsetHeight;
                    }, 100);
                }
            }
        });
    }

    // Initialize context (use saved context or default to 'mpc')
    switchContext(currentContext);
});
