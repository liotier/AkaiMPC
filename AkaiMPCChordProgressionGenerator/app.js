// Import from modules
import {
    keys,
    modes,
    progressions,
    getKeyOffset,
    getScaleDegrees,
    getHarmonyPitchClasses,
    chordFitsScale,
    getChordSuffix,
    MATCHER_QUALITY_TYPES,
    spellChordNotes,
    getEnharmonicContext,
    getInversionNotation,
    findProgressionCategory,
    findModeCategory
} from './modules/musicTheory.js';

import {
    NOTE_PITCH_CLASSES,
    generateVariants,
    VARIANT_STYLES
} from './modules/generation.js';

import {
    buildMpcDisplayName,
    buildExportFileName
} from './modules/mpcNaming.js';

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

    // Show the bulk catalogue link matching the active tab - .progression
    // pack under MPC Pads, MIDI pack under MIDI, the whole section hidden
    // under Keyboard, Guitar and Staff. This is the only script this feature
    // needs: the links are static, pointing at the CI-built pack rather than
    // generating anything (see docs/mpc-export-specification.md D8).
    const bulkExport = document.getElementById('bulkExport');
    if (bulkExport) {
        bulkExport.classList.toggle('hidden', context !== 'mpc' && context !== 'midi');
        bulkExport.querySelectorAll('[data-context]').forEach(link => {
            link.classList.toggle('hidden', link.getAttribute('data-context') !== context);
        });
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

function generateProgressions() {
    if (generationMode === 'template' && selectedMode === 'Locrian' && selectedProgression.includes('I—IV—V')) {
        console.warn('⚠️ Locrian\'s diminished tonic makes this progression unusual');
    }

    variants = generateVariants({
        key: selectedKey,
        mode: selectedMode,
        progression: selectedProgression,
        generationMode,
        chordRequirements
    });

    if (generationMode === 'template' && variants.length < VARIANT_STYLES.length) {
        console.log(`Generated ${variants.length} unique variant(s) out of ${VARIANT_STYLES.length}`);
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

// The parameters modules/mpcNaming.js needs to name a variant - the single
// authority on both the MPC display name and the export file name, so every
// export path (single file, ZIP, MIDI) builds from the same values. Nickname
// is read straight from English regardless of interface language (D2).
function getNamingParams(variant) {
    if (generationMode === 'scale') {
        return {
            generationMode: 'scale',
            modeCategory: findModeCategory(selectedMode),
            mode: selectedMode
        };
    }

    const category = findProgressionCategory(selectedProgression);
    const nickname = i18n.tEnglish(`progressions.${category}.${selectedProgression}.nickname`);
    return {
        generationMode: 'template',
        category,
        nickname,
        value: selectedProgression,
        style: (variant.styles || [variant.name]).join('+')
    };
}

// The .progression JSON payload, shared by the single-file, ZIP and (via the
// pack builder) CI export paths so they can never diverge in shape.
function buildProgressionPayload(variant, { key, scale, name }) {
    return {
        progression: {
            name,
            rootNote: key,
            scale,
            recordingOctave: 2,
            chords: variant.pads.map((pad, idx) => ({
                name: pad.chordName,
                role: idx === 0 ? "Root" : "Normal",
                notes: pad.notes
            }))
        }
    };
}

function downloadSingleProgression(variant) {
    const keyName = selectedKey.split('/')[0];
    const namingParams = getNamingParams(variant);
    const fileName = buildExportFileName({ key: selectedKey, extension: 'progression', ...namingParams });
    const name = buildMpcDisplayName(namingParams);

    const progressionData = buildProgressionPayload(variant, { key: keyName, scale: getReferenceScaleName(), name });

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
    const namingParams = getNamingParams(variant);
    // downloadMIDIFile() appends '.mid' itself, and the bare name also becomes
    // the MIDI track name - strip the extension buildExportFileName() added.
    const fileName = buildExportFileName({ key: selectedKey, extension: 'mid', ...namingParams }).replace(/\.mid$/, '');

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
                downloadSingleProgression(variants[variantIndex]);
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
    const scale = getReferenceScaleName();

    variants.forEach(variant => {
        const namingParams = getNamingParams(variant);
        const fileName = buildExportFileName({ key: selectedKey, extension: 'progression', ...namingParams });
        const name = buildMpcDisplayName(namingParams);
        const progressionData = buildProgressionPayload(variant, { key: keyName, scale, name });

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
    const progressionsData = variants.map(variant => {
        const namingParams = getNamingParams(variant);
        // downloadAllMIDIFiles() appends '.mid' itself, and the bare name also
        // becomes the MIDI track name - strip the extension buildExportFileName() added.
        const fileName = buildExportFileName({ key: selectedKey, extension: 'mid', ...namingParams }).replace(/\.mid$/, '');

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
