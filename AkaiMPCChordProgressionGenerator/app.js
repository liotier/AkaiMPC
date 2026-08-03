// Import from modules
import {
    keys,
    modes,
    progressions,
    getKeyOffset,
    getScaleDegrees,
    getChordQualityForMode,
    getScaleTriad,
    getScaleSeventh,
    getQualityLabel,
    getRomanNumeralForChord,
    getHarmonyPitchClasses,
    chordFitsScale,
    getChordSuffix,
    getRomanSuffix,
    getChordFamily,
    getChordComplexity,
    MATCHER_QUALITY_TYPES,
    buildChord,
    getChordName,
    generateProgressionChords,
    spellChordNotes,
    getEnharmonicContext,
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

/**
 * Escape text destined for an innerHTML template.
 * The progression name is a free-text field and the key/mode/progression can
 * arrive from a shared link, so nothing that reaches the card markup is trusted.
 *
 * @param {*} value - Value to escape
 * @returns {string} HTML- and attribute-safe text
 */
function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

/**
 * Make a string safe to use as a download file name. The progression name is
 * user-editable, so strip path separators and characters that break downloads
 * on Windows, macOS and Linux alike.
 *
 * @param {string} name - Proposed file name
 * @returns {string} Sanitised file name
 */
function sanitizeFileName(name) {
    const cleaned = String(name ?? '')
        .replaceAll(/[\\/:*?"<>|\u0000-\u001F]/g, '_')
        .replace(/^\.+/, '')
        .trim();
    return cleaned.slice(0, 120) || 'progression';
}

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

    // Update button label. Uses i18n keys - the previous hardcoded English
    // here silently overwrote the translated label on every context switch.
    const downloadBtn = document.getElementById('downloadAllBtn');
    if (downloadBtn) {
        const labelKey = context === 'mpc' ? 'buttons.downloadAllProgression'
                       : context === 'midi' ? 'buttons.downloadAllMidi'
                       : 'buttons.printAll';
        downloadBtn.textContent = i18n.t(labelKey);
        downloadBtn.removeAttribute('data-i18n');
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
            progressionNameLabel.textContent = i18n.t('controls.labels.name');
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
            progressionNameLabel.textContent = i18n.t('controls.labels.outputName');
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
        showNotification(i18n.t('messages.selectNoteAndQuality'), 'warning');
        return;
    }

    // Check maximum limit
    if (chordRequirements.length >= LIMITS.MAX_CHORD_REQUIREMENTS) {
        showNotification(i18n.t('messages.maxChords', { max: LIMITS.MAX_CHORD_REQUIREMENTS }), 'warning');
        return;
    }

    const chordType = MATCHER_QUALITY_TYPES[qualitySelect.value];
    if (!chordType) {
        showNotification(i18n.t('messages.selectNoteAndQuality'), 'warning');
        return;
    }

    const chord = {
        note: noteSelect.value,
        quality: qualitySelect.value,
        display: noteSelect.value + getChordSuffix(chordType)
    };

    // Check if chord already exists
    if (chordRequirements.find(c => c.display === chord.display)) {
        showNotification(i18n.t('messages.chordAlreadyAdded'), 'warning');
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
    showNotification(i18n.t('messages.chordAdded', { chord: chord.display }), 'info');
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
        container.innerHTML = `<span style="color: var(--muted); font-size: 14px;">${escapeHtml(i18n.t('chordMatcher.noChordsSelected'))}</span>`;
    } else {
        container.innerHTML = chordRequirements.map((chord, index) => `
            <div class="chord-tag">
                ${escapeHtml(chord.display)}
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

// Pitch class of each note name offered by the Chord Matcher
const NOTE_PITCH_CLASSES = { 'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11 };

/**
 * A key/mode is compatible when every requested chord can be played inside it:
 * its root must be a degree of the scale and all of its notes must be scale
 * tones. Tested on pitch classes so enharmonics resolve correctly, and driven
 * by the scale itself so it holds for all modes, not just major and minor.
 */
function isKeyModeCompatible(key, mode) {
    const keyOffset = getKeyOffset(key);
    const scaleDegrees = getScaleDegrees(mode);
    const harmonyPitchClasses = getHarmonyPitchClasses(mode);
    const rootsInKey = new Set(scaleDegrees.map(degree => (degree + keyOffset) % 12));

    return chordRequirements.every(req => {
        const requestedRoot = NOTE_PITCH_CLASSES[req.note];
        if (requestedRoot === undefined || !rootsInKey.has(requestedRoot)) return false;

        const chordType = MATCHER_QUALITY_TYPES[req.quality];
        if (!chordType) return false;

        // getHarmonyPitchClasses is relative to the tonic, so is the root
        const rootRelativeToTonic = ((requestedRoot - keyOffset) % 12 + 12) % 12;
        return chordFitsScale(rootRelativeToTonic, chordType, harmonyPitchClasses);
    });
}

function displayCompatibilityResults(compatibleList) {
    const suggestionsDiv = document.getElementById('keyModeSuggestions');
    const listDiv = document.getElementById('suggestionList');

    if (compatibleList.length === 0) {
        listDiv.innerHTML = `<div class="suggestion-item incompatible">${escapeHtml(i18n.t('messages.noCompatibleKeysFound'))}</div>`;
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
                html += `<div class="suggestion-item compatible"><strong>${escapeHtml(key)}:</strong> ${escapeHtml(modes.join(', '))}</div>`;
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
    if (hasBorrowed) characteristics.push(i18n.t('analysis.modalInterchange'));
    if (hasSecondary) characteristics.push(i18n.t('analysis.secondaryDominants'));
    if (has7ths) characteristics.push(i18n.t('analysis.extendedHarmony'));
    if (hasDiminished) characteristics.push(i18n.t('analysis.chromatic'));

    if (characteristics.length === 0) {
        return i18n.t('analysis.diatonic');
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
    const allCandidates = generateRow4Candidates(keyOffset, scaleDegrees, analysis, variantType);
    const existingRoots = existingChords.map(c => c.notes && c.notes[0] ? c.notes[0] % 12 : 0);

    // Rows 1-3 are already on the grid; a candidate that repeats one of them
    // wastes a pad. Fall back to the full list only if filtering leaves too few.
    const usedRomanNumerals = new Set(existingChords.map(c => c.romanNumeral));
    const fresh = allCandidates.filter(c => !usedRomanNumerals.has(c.romanNumeral));
    const candidates = fresh.length >= 4 ? fresh : allCandidates;

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
/**
 * Explain what a chord does in the progression.
 * Looks for the most specific description available: the exact roman numeral,
 * then the numeral without its quality markings, then the chord type itself.
 *
 * @param {string} romanNumeral - e.g. 'viiø7', '♭VII', 'V7/V'
 * @param {string} chordType - Chord type key, e.g. 'm7b5'
 * @returns {string} Description
 */
function getChordTooltip(romanNumeral, chordType) {
    // Roman numerals are keyed in upper case; case only encodes major/minor,
    // which the description does not depend on
    const normalized = romanNumeral ? romanNumeral.toUpperCase() : '';

    const candidates = [
        `chordRoles.${normalized}`,
        // Same numeral without its quality markings: 'VIIØ7' -> 'VII'
        `chordRoles.${normalized.replaceAll(/M7|MAJ7|\(MAJ7\)|7|°|Ø|\+|DIM|SUS[24]|ADD9|6|9|11|13/g, '')}`,
        // Chord-type specific descriptions ('chordRoles.types.m7b5')
        chordType ? `chordRoles.types.${chordType}` : null
    ].filter(Boolean);

    for (const candidate of candidates) {
        if (i18n.has(candidate)) return i18n.t(candidate);
    }

    // Generic descriptions by chord family
    if (chordType) {
        if (chordType.includes('sus') || chordType.startsWith('quartal')) return i18n.t('chordRoles.sus');
        if (chordType.includes('add9') || chordType === 'minAdd9') return i18n.t('chordRoles.add9');
        if (chordType === 'major6' || chordType === 'minor6' || chordType === 'maj6/9') return i18n.t('chordRoles.6');
        if (/9|11|13/.test(chordType)) return i18n.t('chordRoles.extended');
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

    const chordRoot = ((scaleDegree + keyOffset) % 12 + 12) % 12;

    return chordRequirements.some(req =>
        NOTE_PITCH_CLASSES[req.note] === chordRoot &&
        MATCHER_QUALITY_TYPES[req.quality] === chordType
    );
}

// Generate scale exploration (all chords from a scale/mode)
// Rows 1-2 hold the triad on every scale degree, rows 3-4 the seventh chord on
// every scale degree. Both are derived from the scale itself (see getScaleTriad
// / getScaleSeventh), so nothing on the grid contains a note the scale does not
// have - which is how half-diminished, diminished 7th, minor-major 7th and 6th
// chords turn up wherever the scale actually calls for them.
function generateScaleExploration() {
    const keyOffset = getKeyOffset(selectedKey);
    const scaleDegrees = getScaleDegrees(selectedMode);
    const scaleLength = scaleDegrees.length;
    const pads = [];

    const used = new Set();

    const addPad = (degree, chordType) => {
        const scaleDegree = scaleDegrees[degree % scaleLength];
        const romanNumeral = getRomanNumeralForChord(degree, chordType);
        used.add(romanNumeral);
        pads.push({
            id: pads.length + 1,
            chordName: getChordName(scaleDegree, chordType, keyOffset),
            romanNumeral,
            notes: buildChord(scaleDegree, chordType, keyOffset),
            chordType,
            quality: getQualityLabel(chordType),
            row: Math.floor(pads.length / 4) + 1,
            col: (pads.length % 4) + 1,
            isProgressionChord: false,
            isChordMatcherChord: matchesChordRequirement(scaleDegree, chordType, keyOffset)
        });
    };

    // Scales with fewer than 8 degrees leave gaps in each half of the grid.
    // Fill them with further colours the scale supports rather than repeating
    // the tonic, which wasted two of the sixteen pads on every 7-note scale.
    const harmonyPitchClasses = getHarmonyPitchClasses(selectedMode);
    const fillGaps = (limit, extras, fallbackType) => {
        const candidates = extras.filter(type =>
            chordFitsScale(((scaleDegrees[0] % 12) + 12) % 12, type, harmonyPitchClasses) &&
            !used.has(getRomanNumeralForChord(0, type))
        );
        while (pads.length < limit) {
            addPad(0, candidates.shift() || fallbackType);
        }
    };

    // Suspended colours first in the triad half, extensions first in the
    // seventh half; each list then falls through to the other's so short
    // scales still get distinct chords rather than a repeated tonic.
    const SUSPENDED_COLOURS = ['sus4', 'sus2', 'quartal'];
    const EXTENDED_COLOURS = ['major6', 'minor6', 'dom7sus4', 'add9', 'minAdd9', 'major9', 'minor9', 'dom9', 'quartal4'];

    // Triads, one per scale degree (pads 1-8)
    for (let i = 0; i < scaleLength && pads.length < 8; i++) {
        addPad(i, getScaleTriad(i, selectedMode));
    }
    fillGaps(8, [...SUSPENDED_COLOURS, ...EXTENDED_COLOURS], getScaleTriad(0, selectedMode));

    // Seventh chords, one per scale degree (pads 9-16)
    for (let i = 0; i < scaleLength && pads.length < 16; i++) {
        addPad(i, getScaleSeventh(i, selectedMode));
    }
    fillGaps(16, [...EXTENDED_COLOURS, ...SUSPENDED_COLOURS], getScaleSeventh(0, selectedMode));

    return {
        name: selectedMode,
        titleKey: 'scaleExploration',
        pads: pads
    };
}

function generateVariant(variantType) {
    const keyOffset = getKeyOffset(selectedKey);
    // Progression Palette Mode reads every roman numeral against the parallel
    // major scale (see generateProgressionChords), and the Mode/Scale selector
    // is disabled here. Build the palette on the same reference so a mode left
    // over from Scale Mode cannot silently transpose the palette away from the
    // progression it is supposed to extend.
    const scaleDegrees = getScaleDegrees('Major');
    const pads = [];

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

    // Build comprehensive palette with DIFFERENT extensions for each degree.
    // The progression chords are claimed up front: the palette is appended
    // after them, so without this the palette re-emitted the progression's own
    // chords as its cheapest entries and rows 1 and 2 came out identical.
    const palette = [];
    const usedRomanNumerals = new Set(progressionChords.map(chord => chord.romanNumeral));

    // Set false by the top-up pass below when the filter has starved the palette
    let filterActive = true;

    // Helper to add unique chord
    const addChord = (degree, type, romanBase, suffix, spice, isChordMatcher = false, rootOverride = null) => {
        // Apply palette filter if defined (hard filter - backward compatibility)
        if (filterActive && paletteFilter && !paletteFilter.includes(type)) {
            return; // Skip chord types not in the filter
        }

        const roman = romanBase + suffix;
        if (usedRomanNumerals.has(roman)) return; // Skip duplicates
        usedRomanNumerals.add(roman);

        const scaleDegree = rootOverride === null ? scaleDegrees[degree % scaleDegrees.length] : rootOverride;
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
            const reqNoteOffset = NOTE_PITCH_CLASSES[req.note];

            // Find which scale degree this chord corresponds to
            const matchedDegree = scaleDegrees.findIndex(
                degree => ((degree + keyOffset) % 12 + 12) % 12 === reqNoteOffset
            );

            if (matchedDegree === -1) {
                // Chord not in scale - skip it (shouldn't happen if Chord Matcher filtering works)
                console.warn(`Chord Matcher chord ${req.display} not found in ${selectedKey} ${selectedMode}`);
                return;
            }

            const chordType = MATCHER_QUALITY_TYPES[req.quality] || 'major';

            // Add to palette with Chord Matcher flag. The roman numeral already
            // carries the quality (viiø7, i(maj7)...), so no extra suffix.
            addChord(
                matchedDegree,
                chordType,
                getRomanNumeralForChord(matchedDegree, chordType),
                '',
                getSpiceLevelForDegree(matchedDegree),
                true
            );
        });
    }

    // Generate extensions for each unique degree
    uniqueDegrees.forEach(({ degree, original }) => {
        const romanBase = original.romanNumeral.replaceAll(/7|M7|m7|°/g, '');
        const baseType = original.chordType;
        const baseFamily = getChordFamily(baseType);

        if (baseFamily === 'major') {
            // Major/dominant chords: generate varied extensions
            addChord(degree, 'major', romanBase, '', degree === 0 ? 0 : 1);
            addChord(degree, 'dom7', romanBase, '7', 1);
            addChord(degree, 'major7', romanBase, 'M7', 2);
            if (variantType === 'Jazz' || variantType === 'Experimental') {
                addChord(degree, 'dom9', romanBase, '9', 2);
            }
        } else if (baseFamily === 'minor') {
            // Minor chords
            addChord(degree, 'minor', romanBase, '', 1);
            addChord(degree, 'minor7', romanBase, '7', 1);
            if (variantType === 'Jazz') {
                addChord(degree, 'minor9', romanBase, '9', 2);
            }
        } else {
            // Diminished, augmented, suspended
            addChord(degree, baseType, romanBase, '', 1);
        }

        // Offer the colours this genre actually asks for. Without this the
        // palette only ever emitted plain triads and 7ths, so the dom9 / sus4 /
        // quartal / m7b5 preferences declared by the progression templates had
        // no way to reach a pad. Only chords built on the same triad as the
        // degree are offered (plus suspensions, which fit either).
        const declaredTypes = [
            ...(palettePriorities?.preferred || []),
            ...(palettePriorities?.allowed || [])
        ];
        declaredTypes.forEach(type => {
            const family = getChordFamily(type);
            if (family !== baseFamily && family !== 'suspended') return;
            addChord(degree, type, romanBase, getRomanSuffix(type), getChordComplexity(type));
        });
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
    // Routed through addChord so they take part in the same de-duplication and
    // priority handling as everything else: pushing them straight onto the
    // palette meant a progression containing ♭VII got a second ♭VII pad, and
    // left them without a priority so the palette sort compared against
    // undefined.
    const diatonicPitchClasses = new Set(scaleDegrees.map(d => ((d % 12) + 12) % 12));

    // [semitones above tonic, degree, roman numeral, chord type, spice]
    const borrowedChords = [
        [10, 6, '♭VII', 'major', 2],  // colorful (Mixolydian/blues flavor)
        [8, 5, '♭VI', 'major', 3],    // borrowed from parallel minor
        [3, 2, '♭III', 'major', 3]    // borrowed from parallel minor
    ];
    borrowedChords.forEach(([semitones, degree, roman, type, spice]) => {
        if (diatonicPitchClasses.has(semitones)) return;
        addChord(degree, type, roman, '', spice, false, (scaleDegrees[0] + semitones) % 12);
    });

    // iv - borrowed from parallel minor - skip if IV is already minor in mode
    const fourthQuality = scaleDegrees.length > 3 ? getChordQualityForMode(3, 'Major') : null;
    if (scaleDegrees.length > 3 && fourthQuality !== 'minor') {
        addChord(3, 'minor', 'iv', '', 2);
    }

    // A narrow paletteFilter can leave fewer chords than the grid needs. The MPC
    // layout is always 4x4, and a short grid exports a .progression file with
    // fewer than 16 chords, so top up with diatonic chords ignoring the filter.
    // These land last: they are all priority 2 or lower and spicier than the
    // filtered chords that earned their place.
    const PADS_BEFORE_DYNAMIC_ROW = 12;
    if (originalProgressionLength + palette.length < PADS_BEFORE_DYNAMIC_ROW) {
        filterActive = false;
        const topUp = [
            [0, 'major'], [0, 'major7'], [1, 'minor'], [1, 'minor7'],
            [2, 'minor'], [2, 'minor7'], [3, 'major'], [3, 'major7'],
            [4, 'major'], [4, 'dom7'], [5, 'minor'], [5, 'minor7']
        ];
        for (const [degree, type] of topUp) {
            if (originalProgressionLength + palette.length >= PADS_BEFORE_DYNAMIC_ROW) break;
            if (degree >= scaleDegrees.length) continue;
            const romanBase = getRomanNumeralForChord(degree, type === 'major7' ? 'major' : type === 'minor7' ? 'minor' : type);
            addChord(degree, type, romanBase, getRomanSuffix(type), 3);
        }
        filterActive = true;
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

            const pad = {
                id: padIndex + 1,
                chordName,
                romanNumeral,
                notes,
                chordType,
                quality: getQualityLabel(chordType),
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
                chordType: chord.chordType,
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
                chordType: 'major',
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

// Populate select elements.
// Called again on every language change, so each list is emptied first and the
// current selection restored - otherwise switching language stacks a second
// copy of every key, mode and progression onto the dropdowns.
function populateSelects() {
    const keySelect = document.getElementById('keySelect');
    const modeSelect = document.getElementById('modeSelect');
    const progressionSelect = document.getElementById('progressionSelect');
    keySelect.replaceChildren();
    modeSelect.replaceChildren();
    progressionSelect.replaceChildren();

    // Keys
    keys.forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        keySelect.appendChild(option);
    });

    // Modes (now all strings - get display info from i18n)
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

    // Restore the current selection - repopulating cleared it
    keySelect.value = selectedKey;
    modeSelect.value = selectedMode;
    progressionSelect.value = selectedProgression;
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
        const chordSignature = getChordProgressionSignature(variant);

        // Keep the first variant with a given set of chords; later variants that
        // differ only in voicing are dropped
        if (!seenProgressions.has(chordSignature)) {
            seenProgressions.set(chordSignature, variant.name);
            unique.push(variant);
        }
    });

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

// The scale a generated set is actually built from. Scale Mode uses the chosen
// mode; Progression Palette Mode analyses everything against the parallel major
// and leaves the Mode/Scale selector disabled, so reporting a stale mode there
// would mislabel both the card and the exported files.
function getReferenceScaleName() {
    return generationMode === 'scale' ? selectedMode : 'Major';
}

// Base name shared by .progression, MIDI and ZIP exports
function getVariantFileName(variant) {
    const keyName = selectedKey.split('/')[0];
    return generationMode === 'scale'
        ? `${keyName}_${selectedMode.replaceAll(/[\s/]+/g, '-')}_Scale-Exploration`
        : `${keyName}_${selectedProgression.replaceAll(/—/g, '-')}_${variant.name}`;
}

function downloadSingleProgression(variant, index) {
    const keyName = selectedKey.split('/')[0];
    const fileName = sanitizeFileName(`${getVariantFileName(variant)}-${index + 1}`) + '.progression';

    const progressionData = {
        progression: {
            name: fileName.replaceAll('.progression', ''),
            rootNote: keyName,
            scale: getReferenceScaleName(),
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
    const fileName = sanitizeFileName(getVariantFileName(variant));

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
        showNotification(i18n.t('errors.midiExportFailed'), 'error');
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
    const hoverLegend = i18n.t('variants.voiceLeadingHoverLegend');
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
                const roleText = getChordTooltip(pad.romanNumeral, pad.chordType);

                // Calculate voice leading distance from tonic (default state)
                let voiceLeadingClass = '';
                const voiceLeadingLegend = i18n.t('variants.voiceLeadingLegend');

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

                // Get inversion notation for this chord
                const inversionNotation = getInversionNotation(pad.notes, pad.chordType || 'major', pad.chordName, pad.romanNumeral);
                const displayName = pad.chordName + inversionNotation;

                // Get progression edge attributes
                const edges = progressionPadEdges.get(pad.id);
                const edgeAttrs = edges ? `data-prog-edge-top="${edges.top}" data-prog-edge-bottom="${edges.bottom}" data-prog-edge-left="${edges.left}" data-prog-edge-right="${edges.right}"` : '';

                return `
                <div class="chord-pad ${pad.isProgressionChord ? 'progression-chord' : ''} ${pad.isChordMatcherChord ? 'chord-matcher-chord' : ''} ${voiceLeadingClass}"
                    data-notes="${pad.notes.join(',')}" data-roman="${escapeHtml(pad.romanNumeral)}" data-quality="${escapeHtml(pad.quality)}" data-chord-type="${escapeHtml(pad.chordType || '')}" data-role="${escapeHtml(roleText)}"
                    data-pad-id="${pad.id}" data-original-vl-class="${voiceLeadingClass}"
                    data-voice-leading="${escapeHtml(voiceLeadingLegend)}" ${edgeAttrs}>
                    <div class="chord-text-column">
                        <div class="chord-pad-content">
                            <div class="chord-info">
                                <div class="chord-name">${escapeHtml(displayName)}</div>
                            </div>
                            <div class="pad-number">${hasTouch ? pad.id : 'PAD ' + pad.id}</div>
                        </div>
                        <div class="chord-quality">${escapeHtml(pad.quality)}</div>
                        <div class="chord-roman">${escapeHtml(pad.romanNumeral)}</div>
                    </div>
                    <div class="chord-info-column">
                        <div class="chord-role">${escapeHtml(roleText)}</div>
                        <div class="chord-notes">
                            ${(() => {
                                // Get properly spelled note names (pass actual voicing)
                                const noteStrings = spellChordNotes(pad.notes, pad.chordType || 'major', pad.romanNumeral);

                                // Group notes in pairs for wrapping
                                const pairs = [];
                                for (let i = 0; i < noteStrings.length; i += 2) {
                                    const pair = noteStrings.slice(i, i + 2).join(' ');
                                    pairs.push(`<span class="note-pair">${escapeHtml(pair)}</span>`);
                                }
                                return pairs.join(' ');
                            })()}
                        </div>
                    </div>
                    <div class="chord-keyboard">${generateKeyboardSVG(pad.notes)}</div>
                    <div class="chord-guitar">${generateGuitarSVG(getGuitarChord(pad), pad, isLeftHanded)}</div>
                    <div class="chord-staff">${generateStaffSVG(pad.notes, getEnharmonicContext(pad.notes[0], pad.romanNumeral) === 'flats')}</div>
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

        const variantKey = variant.titleKey || variant.name;
        if (variantKey && i18n.has(`variants.${variantKey}.label`)) {
            voicingStyle = i18n.t(`variants.${variantKey}.label`);
            uniquenessTooltip = i18n.t(`variants.${variantKey}.tooltip`);
        }

        // Detect cadence type
        const cadence = detectCadence(selectedProgression);
        const cadenceDisplay = cadence ? `<span class="cadence" data-tooltip="${escapeHtml(i18n.t(`cadences.${cadence.key}.tooltip`))}">${cadence.emoji} ${escapeHtml(i18n.t(`cadences.${cadence.key}.name`))}</span>` : '';

        card.innerHTML = `
            <div class="progression-header">
                <div class="progression-info">
                    <div class="progression-title-row">
                        <div class="progression-title" data-tooltip="${escapeHtml(uniquenessTooltip)}">
                            <div class="title-line-1">${escapeHtml(generationMode === 'scale' ? progressionName : `${progressionName}_${variant.name}`)}</div>
                            ${voicingStyle ? `<div class="title-line-2">${escapeHtml(voicingStyle)}</div>` : ''}
                        </div>
                        <span class="progression-explainer">${escapeHtml(uniquenessTooltip)}</span>
                    </div>
                    <div class="progression-meta">
                        <span class="key">${escapeHtml(selectedKey)}</span>
                        <span class="pattern">${escapeHtml(generationMode === 'scale' ? selectedMode : selectedProgression)}</span>
                        ${cadenceDisplay}
                        ${progressionAnalysis ? `<span class="analysis">${escapeHtml(progressionAnalysis)}</span>` : ''}
                        <span class="voice-leading-hint">${escapeHtml(progressionClarification)}${escapeHtml(i18n.t('variants.chordDistanceHint'))}</span>
                    </div>
                </div>
                <button class="download-btn" data-variant-index="${index}">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                </button>
            </div>
            <div class="chord-grid">${gridHTML}</div>
            <div class="voice-leading-hint-bottom">${escapeHtml(progressionClarification)}${escapeHtml(i18n.t('variants.chordDistanceHint'))}</div>
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
                const chordType = this.getAttribute('data-chord-type');

                // Activate voice leading hover effect (only if not locked on another pad)
                if (!voiceLeadingLocked || voiceLeadingLocked === this) {
                    activateVoiceLeadingHover(this);
                }

                // Always show tooltip on hover (even if voice leading is locked elsewhere)
                // In keyboard context, no tooltip (chord function is visible on card)
                if (currentContext !== 'keyboard') {
                    const chordFunction = getChordTooltip(roman, chordType) || 'Chord';
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
                        const roleText = getChordTooltip(roman, currentPad.dataset.chordType);
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
                showTooltip(this, i18n.t('buttons.download'));
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
        showNotification(i18n.t('errors.generateFirst'), 'warning');
        return;
    }

    const zip = new JSZip();
    const keyName = selectedKey.split('/')[0];

    variants.forEach((variant, index) => {
        const fileName = sanitizeFileName(`${getVariantFileName(variant)}-${index + 1}`) + '.progression';

        const progressionData = {
            progression: {
                name: fileName.replaceAll('.progression', ''),
                rootNote: keyName,
                scale: getReferenceScaleName(),
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
        a.download = sanitizeFileName(`${progressionName}_All-Variants`) + '.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

async function exportAllMIDI() {
    if (variants.length === 0) {
        showNotification(i18n.t('errors.generateFirst'), 'warning');
        return;
    }

    // Prepare progression data for MIDI export
    const progressionsData = variants.map((variant, index) => {
        const fileName = sanitizeFileName(getVariantFileName(variant));

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
        showNotification(i18n.t('errors.midiExportFailed'), 'error');
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

            // These two labels are written from JS, so the data-i18n sweep
            // above cannot reach them
            switchContext(currentContext);
            switchGenerationMode(generationMode, true);

            // Re-render progressions if they've been generated
            if (hasGeneratedOnce && variants.length > 0) {
                renderProgressions();
            }
        });
    }

    // Load language before populating selects (with English kept in memory as
    // the fallback for any key the chosen language has not translated yet)
    await i18n.loadLanguageWithFallback(currentLang);

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
            showTooltip(this, i18n.t('tooltips.paletteMode'));
        });
        paletteModeLabel.addEventListener('pointerleave', function() {
            const tooltip = document.getElementById('chordTooltip');
            if (tooltip) tooltip.classList.remove('visible');
        });

        const scaleModeLabel = document.getElementById('scaleModeLabel');
        scaleModeLabel.addEventListener('pointerenter', function() {
            showTooltip(this, i18n.t('tooltips.scaleMode'));
        });
        scaleModeLabel.addEventListener('pointerleave', function() {
            const tooltip = document.getElementById('chordTooltip');
            if (tooltip) tooltip.classList.remove('visible');
        });

        // Custom tooltip for MIDI selector
        const midiSelector = document.getElementById('midiSelector');
        midiSelector.addEventListener('pointerenter', function() {
            showTooltip(this, i18n.t('tooltips.keyboardShortcuts'));
        });
        midiSelector.addEventListener('pointerleave', function() {
            const tooltip = document.getElementById('chordTooltip');
            if (tooltip) tooltip.classList.remove('visible');
        });

        // Custom tooltips for progressionSelect (dynamic based on state)
        const progressionSelect = document.getElementById('progressionSelect');
        progressionSelect.addEventListener('pointerenter', function() {
            if (this.disabled) {
                showTooltip(this, i18n.t('tooltips.progressionPaletteDisabled'));
            } else {
                showTooltip(this, i18n.t('tooltips.progressionPaletteEnabled'));
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
                showTooltip(this, i18n.t('tooltips.modeSelectDisabled'));
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
        setupTapTooltip(paletteModeLabel, () => i18n.t('tooltips.paletteMode'));

        const scaleModeLabel = document.getElementById('scaleModeLabel');
        setupTapTooltip(scaleModeLabel, () => i18n.t('tooltips.scaleMode'));

        // MIDI selector (informational only, keyboard doesn't work on tablets)
        const midiSelector = document.getElementById('midiSelector');
        setupTapTooltip(midiSelector, () => i18n.t('tooltips.keyboardShortcutsTouch'));

        // Progression select (dynamic tooltip)
        const progressionSelect = document.getElementById('progressionSelect');
        setupTapTooltip(progressionSelect, function() {
            return i18n.t(this.disabled ? 'tooltips.progressionPaletteDisabled' : 'tooltips.progressionPaletteEnabled');
        });

        // Mode select (dynamic tooltip)
        const modeSelect = document.getElementById('modeSelect');
        setupTapTooltip(modeSelect, function() {
            if (this.disabled) {
                return i18n.t('tooltips.modeSelectDisabled');
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

    // Release all notes when the page loses focus or is hidden. 'blur' alone is
    // unreliable on mobile and on tab switches, which left notes hanging on an
    // external MIDI instrument with no way to silence them from the page.
    const releaseAllNotes = () => {
        stopAllNotes();

        // Clear visual feedback
        pressedKeys.forEach(({ padElement }) => {
            if (padElement) {
                padElement.classList.remove('playing');
            }
        });
        pressedKeys.clear();
    };

    globalThis.addEventListener('blur', releaseAllNotes);
    globalThis.addEventListener('pagehide', releaseAllNotes);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') releaseAllNotes();
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

    registerServiceWorker();
});

/**
 * Register the service worker that makes the app work offline.
 * It shipped with the project but nothing ever registered it, so the offline
 * support the README promises was never actually switched on.
 */
function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    // file:// pages have an opaque origin and cannot host a service worker
    if (globalThis.location.protocol !== 'https:' && globalThis.location.hostname !== 'localhost' && globalThis.location.hostname !== '127.0.0.1') {
        return;
    }

    navigator.serviceWorker.register('./service-worker.js')
        .then(registration => console.log('Offline support ready:', registration.scope))
        .catch(error => console.warn('Service worker registration failed:', error));
}
