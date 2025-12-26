// Event Listeners Module
// Contains all event listener setup and keyboard/touch handling

import { initAudioContext, startChord, stopChord, stopAllNotes, playNotesSequentially, getSequentialDuration } from './audio.js';
import { saveToLocalStorage, loadFromLocalStorage, updateURL, loadFromURL, applyPreferences } from './storage.js';
import { i18n } from './i18n.js';

import {
    getSelectedKey,
    getSelectedMode,
    getSelectedProgression,
    getVariants,
    getCurrentContext,
    getIsLeftHanded,
    getHasGeneratedOnce,
    getHasTouch,
    getHasHover,
    getIsTablet,
    getVoiceLeadingLocked,
    getActiveTooltip,
    setSelectedKey,
    setSelectedMode,
    setSelectedProgression,
    setIsLeftHanded,
    setVoiceLeadingLocked,
    setActiveTooltip,
    setCurrentContext,
    exposeDebugState
} from './stateManager.js';

import {
    triggerSparkle,
    switchContext,
    switchGenerationMode,
    showTooltip,
    activateVoiceLeadingHover,
    deactivateVoiceLeadingHover,
    updateProgressionName,
    updatePageTranslations,
    renderChordRequirements,
    exposeGlobalFunctions,
    setGenerateProgressions,
    setRenderProgressions
} from './uiHandlers.js';

// These will be injected from the main app
let generateProgressionsFn = null;
let renderProgressionsFn = null;
let exportProgressionsFn = null;
let exportAllMIDIFn = null;
let printAllProgressionsFn = null;
let initMIDIFn = null;

export function setGenerateFunctions(generateFn, renderFn) {
    generateProgressionsFn = generateFn;
    renderProgressionsFn = renderFn;
    setGenerateProgressions(generateFn);
    setRenderProgressions(renderFn);
}

export function setExportFunctions(exportProgFn, exportMIDIFn, printFn) {
    exportProgressionsFn = exportProgFn;
    exportAllMIDIFn = exportMIDIFn;
    printAllProgressionsFn = printFn;
}

export function setInitMIDI(fn) {
    initMIDIFn = fn;
}

// ============================================================================
// Main Event Listener Setup
// ============================================================================

export async function setupEventListeners() {
    const hasTouch = getHasTouch();
    const hasHover = getHasHover();
    const isTablet = getIsTablet();

    // Initialize i18n with current language
    const currentLang = i18n.getCurrentLanguage();
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = currentLang;

        languageSelect.addEventListener('change', async function() {
            const newLang = this.value;
            await i18n.setLanguage(newLang);
            updatePageTranslations();

            if (getHasGeneratedOnce() && getVariants().length > 0) {
                renderProgressionsFn();
            }
        });
    }

    // Load language before populating selects
    await i18n.loadLanguage(currentLang);

    initAudioContext();
    if (initMIDIFn) initMIDIFn();

    // Expose debug state and global functions
    exposeDebugState();
    exposeGlobalFunctions();

    // Update translations and populate selects
    updatePageTranslations();

    // Load preferences: URL params take priority over localStorage
    const urlPrefs = loadFromURL();
    const storedPrefs = loadFromLocalStorage();
    const prefsToApply = urlPrefs || storedPrefs;

    if (prefsToApply) {
        const applied = applyPreferences(prefsToApply);
        if (applied) {
            if (applied.key) setSelectedKey(applied.key);
            if (applied.mode) setSelectedMode(applied.mode);
            if (applied.progression) setSelectedProgression(applied.progression);
            if (applied.leftHanded !== undefined) setIsLeftHanded(applied.leftHanded);
            if (applied.context) setCurrentContext(applied.context);
        }
    }

    updateProgressionName();
    renderChordRequirements();

    // Initialize generation mode (default to progression palette mode)
    switchGenerationMode('template');

    // Generation mode toggle
    document.getElementById('paletteModeRadio').addEventListener('change', function() {
        if (this.checked) switchGenerationMode('template');
    });
    document.getElementById('scaleModeRadio').addEventListener('change', function() {
        if (this.checked) switchGenerationMode('scale');
    });

    // Key/Mode/Progression select handlers
    document.getElementById('keySelect').addEventListener('change', function() {
        setSelectedKey(this.value);
        updateProgressionName();
        saveToLocalStorage(getSelectedKey(), getSelectedMode(), getSelectedProgression(), getIsLeftHanded(), getCurrentContext());
        updateURL(getSelectedKey(), getSelectedMode(), getSelectedProgression(), getIsLeftHanded());
        if (getHasGeneratedOnce()) {
            triggerSparkle();
            generateProgressionsFn();
        }
    });

    document.getElementById('modeSelect').addEventListener('change', function() {
        setSelectedMode(this.value);
        updateProgressionName();
        saveToLocalStorage(getSelectedKey(), getSelectedMode(), getSelectedProgression(), getIsLeftHanded(), getCurrentContext());
        updateURL(getSelectedKey(), getSelectedMode(), getSelectedProgression(), getIsLeftHanded());
        if (getHasGeneratedOnce()) {
            triggerSparkle();
            generateProgressionsFn();
        }
    });

    document.getElementById('progressionSelect').addEventListener('change', function() {
        setSelectedProgression(this.value);
        updateProgressionName();
        saveToLocalStorage(getSelectedKey(), getSelectedMode(), getSelectedProgression(), getIsLeftHanded(), getCurrentContext());
        updateURL(getSelectedKey(), getSelectedMode(), getSelectedProgression(), getIsLeftHanded());
        if (getHasGeneratedOnce()) {
            triggerSparkle();
            generateProgressionsFn();
        }
    });

    document.getElementById('progressionName').addEventListener('input', function() {
        // Update progression name directly via import
        const { setProgressionName } = await import('./stateManager.js');
        setProgressionName(this.value);
    });

    document.getElementById('generateBtn').addEventListener('click', generateProgressionsFn);

    // Download/Print button
    document.getElementById('downloadAllBtn').addEventListener('click', () => {
        const context = getCurrentContext();
        if (context === 'mpc') {
            exportProgressionsFn();
        } else if (context === 'midi') {
            exportAllMIDIFn();
        } else {
            printAllProgressionsFn();
        }
    });

    // Context tab switching
    document.querySelectorAll('.context-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchContext(tab.dataset.context);
        });
    });

    // Desktop tooltips
    if (hasHover) {
        setupDesktopTooltips();
    }

    // Tablet/Touch tooltips
    if (hasTouch && !hasHover) {
        setupTouchTooltips();
    }

    // Left-handed toggle
    document.getElementById('leftHandedCheckbox').addEventListener('change', function() {
        setIsLeftHanded(this.checked);
        saveToLocalStorage(getSelectedKey(), getSelectedMode(), getSelectedProgression(), getIsLeftHanded(), getCurrentContext());
        updateURL(getSelectedKey(), getSelectedMode(), getSelectedProgression(), getIsLeftHanded());
        const progressionsContainer = document.getElementById('progressionsContainer');
        if (!progressionsContainer.classList.contains('hidden')) {
            generateProgressionsFn();
        }
    });

    // Print orientation handling
    setupPrintHandlers();

    // Keyboard controls
    setupKeyboardControls(hasTouch);

    // Window blur handler
    globalThis.addEventListener('blur', () => {
        stopAllNotes();
        pressedKeys.forEach(({ padElement }) => {
            if (padElement) {
                padElement.classList.remove('playing');
            }
        });
        pressedKeys.clear();
    });

    // Tablet orientation handling
    if (hasTouch && isTablet) {
        setupTabletOrientationHandlers();
    }

    // Initialize context
    switchContext(getCurrentContext());
}

// ============================================================================
// Desktop Tooltip Setup
// ============================================================================

function setupDesktopTooltips() {
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
        showTooltip(this, 'Explore a scale/mode by generating all available chords. Perfect for learning exotic scales like Whole Tone, Phrygian Dominant, or Maqam Hijaz.');
    });
    scaleModeLabel.addEventListener('pointerleave', function() {
        const tooltip = document.getElementById('chordTooltip');
        if (tooltip) tooltip.classList.remove('visible');
    });

    const midiSelector = document.getElementById('midiSelector');
    midiSelector.addEventListener('pointerenter', function() {
        showTooltip(this, 'Play with computer keys: cvbn (pads 1-4), dfgh (5-8), erty (9-12), 3456 (13-16)');
    });
    midiSelector.addEventListener('pointerleave', function() {
        const tooltip = document.getElementById('chordTooltip');
        if (tooltip) tooltip.classList.remove('visible');
    });

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

    const modeSelect = document.getElementById('modeSelect');
    modeSelect.addEventListener('pointerenter', function() {
        if (this.disabled) {
            showTooltip(this, 'Mode/Scale selector is not used in Progression Palette Mode. The progression defines its own harmonic structure.');
        }
    });
    modeSelect.addEventListener('pointerleave', function() {
        const tooltip = document.getElementById('chordTooltip');
        if (tooltip) tooltip.classList.remove('visible');
    });
}

// ============================================================================
// Touch Tooltip Setup
// ============================================================================

function setupTouchTooltips() {
    function setupTapTooltip(element, tooltipTextOrCallback) {
        element.addEventListener('click', function(e) {
            const currentElement = e.currentTarget;

            if (element.tagName !== 'LABEL') {
                e.stopPropagation();
            }

            const tooltipText = typeof tooltipTextOrCallback === 'function'
                ? tooltipTextOrCallback.call(currentElement)
                : tooltipTextOrCallback;

            if (tooltipText) {
                const tooltip = document.getElementById('chordTooltip');
                const activeTooltip = getActiveTooltip();

                if (tooltip && tooltip.classList.contains('visible') && activeTooltip === currentElement) {
                    tooltip.classList.remove('visible');
                    setActiveTooltip(null);
                } else {
                    showTooltip(currentElement, tooltipText);
                    setActiveTooltip(currentElement);

                    setTimeout(() => {
                        if (getActiveTooltip() === currentElement) {
                            const tooltip = document.getElementById('chordTooltip');
                            if (tooltip) tooltip.classList.remove('visible');
                            setActiveTooltip(null);
                        }
                    }, 5000);
                }
            }
        });
    }

    document.addEventListener('click', function(e) {
        const tooltip = document.getElementById('chordTooltip');
        const activeTooltip = getActiveTooltip();
        if (tooltip && activeTooltip && !activeTooltip.contains(e.target)) {
            tooltip.classList.remove('visible');
            setActiveTooltip(null);
        }
    });

    const paletteModeLabel = document.getElementById('paletteModeLabel');
    setupTapTooltip(paletteModeLabel, 'Generate 16-pad chord palettes from curated progressions across 15 genres. Creates 5 voicing variants (Smooth, Classic, Jazz, Modal, Experimental). Genre-specific filters tailor the extended harmony.');

    const scaleModeLabel = document.getElementById('scaleModeLabel');
    setupTapTooltip(scaleModeLabel, 'Explore a scale/mode by generating all available chords. Perfect for learning exotic scales like Whole Tone, Phrygian Dominant, or Maqam Hijaz.');

    const midiSelector = document.getElementById('midiSelector');
    setupTapTooltip(midiSelector, 'Keyboard shortcuts are for desktop. On tablets, tap chord pads to play them.');

    const progressionSelect = document.getElementById('progressionSelect');
    setupTapTooltip(progressionSelect, function() {
        if (this.disabled) {
            return 'Progression palettes are not used in Scale Mode. All chords from the selected scale will be generated.';
        } else {
            return 'Each palette provides 16 unique chords: first N from the progression, remaining pads from extended harmony. Genre-specific filters ensure appropriate chord colors.';
        }
    });

    const modeSelect = document.getElementById('modeSelect');
    setupTapTooltip(modeSelect, function() {
        if (this.disabled) {
            return 'Mode/Scale selector is not used in Progression Palette Mode. The progression defines its own harmonic structure.';
        }
        return null;
    });
}

// ============================================================================
// Print Handlers
// ============================================================================

let printStyleElement = null;

function setupPrintHandlers() {
    globalThis.addEventListener('beforeprint', () => {
        if (printStyleElement) {
            printStyleElement.remove();
        }

        printStyleElement = document.createElement('style');
        const context = getCurrentContext();
        if (context === 'keyboard' || context === 'staff') {
            printStyleElement.textContent = '@page { size: landscape; margin: 1cm; }';
        } else {
            printStyleElement.textContent = '@page { size: portrait; margin: 1cm; }';
        }
        document.head.appendChild(printStyleElement);
    });

    globalThis.addEventListener('afterprint', () => {
        if (printStyleElement) {
            printStyleElement.remove();
            printStyleElement = null;
        }
    });
}

// ============================================================================
// Keyboard Controls
// ============================================================================

const keyToPad = {
    'c': 1, 'v': 2, 'b': 3, 'n': 4,
    'd': 5, 'f': 6, 'g': 7, 'h': 8,
    'e': 9, 'r': 10, 't': 11, 'y': 12,
    '3': 13, '4': 14, '5': 15, '6': 16
};

const pressedKeys = new Map();

function getVisibleArea(element) {
    const rect = element.getBoundingClientRect();
    const viewportHeight = globalThis.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = globalThis.innerWidth || document.documentElement.clientWidth;

    const visibleTop = Math.max(0, rect.top);
    const visibleBottom = Math.min(viewportHeight, rect.bottom);
    const visibleLeft = Math.max(0, rect.left);
    const visibleRight = Math.min(viewportWidth, rect.right);

    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const visibleWidth = Math.max(0, visibleRight - visibleLeft);

    return visibleHeight * visibleWidth;
}

function setupKeyboardControls(hasTouch) {
    document.addEventListener('keydown', (event) => {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
            return;
        }

        const key = event.key.toLowerCase();
        const padNumber = keyToPad[key];

        if (padNumber) {
            if (pressedKeys.has(key)) {
                return;
            }

            event.preventDefault();

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

            if (mostVisibleCard) {
                const pads = mostVisibleCard.querySelectorAll('.chord-pad');
                pads.forEach(pad => {
                    const padText = pad.querySelector('.pad-number');
                    const expectedText = hasTouch ? `${padNumber}` : `PAD ${padNumber}`;
                    if (padText?.textContent === expectedText) {
                        const notes = pad.dataset.notes.split(',').map(Number);

                        if (getCurrentContext() === 'staff') {
                            playNotesSequentially(notes);
                            pad.classList.add('playing');
                            const totalDuration = getSequentialDuration(notes.length);
                            setTimeout(() => pad.classList.remove('playing'), totalDuration);
                        } else {
                            startChord(notes);
                            pad.classList.add('playing');
                            activateVoiceLeadingHover(pad);
                            pressedKeys.set(key, { notes, padElement: pad });
                        }
                    }
                });
            }
        }
    });

    document.addEventListener('keyup', (event) => {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
            return;
        }

        const key = event.key.toLowerCase();

        if (pressedKeys.has(key)) {
            const { notes, padElement } = pressedKeys.get(key);

            stopChord(notes);

            if (padElement) {
                padElement.classList.remove('playing');
                deactivateVoiceLeadingHover(padElement);
            }

            pressedKeys.delete(key);
        }
    });
}

// ============================================================================
// Tablet Orientation Handlers
// ============================================================================

function setupTabletOrientationHandlers() {
    let currentOrientation = globalThis.matchMedia("(orientation: portrait)").matches ? 'portrait' : 'landscape';

    const orientationQuery = globalThis.matchMedia("(orientation: portrait)");
    orientationQuery.addEventListener('change', (e) => {
        const newOrientation = e.matches ? 'portrait' : 'landscape';

        if (newOrientation !== currentOrientation) {
            currentOrientation = newOrientation;

            const voiceLeadingLocked = getVoiceLeadingLocked();
            if (voiceLeadingLocked) {
                deactivateVoiceLeadingHover(voiceLeadingLocked);
                setVoiceLeadingLocked(null);
            }

            const activeTooltip = getActiveTooltip();
            if (activeTooltip) {
                const tooltip = document.getElementById('chordTooltip');
                if (tooltip) tooltip.classList.remove('visible');
                setActiveTooltip(null);
            }

            // Force layout recalculation after orientation change
            if (getHasGeneratedOnce()) {
                setTimeout(() => {
                    document.body.offsetHeight; // Force reflow
                }, 100);
            }
        }
    });
}
