// UI Handlers Module
// Contains all UI manipulation, rendering, and display functions

import {
    keys,
    modes,
    progressions,
    getKeyOffset,
    getScaleDegrees
} from './musicTheory.js';

import { saveToLocalStorage } from './storage.js';
import { TIMING, LIMITS, MESSAGES } from './constants.js';
import { i18n } from './i18n.js';

import {
    getSelectedKey,
    getSelectedMode,
    getSelectedProgression,
    getChordRequirements,
    getIsLeftHanded,
    getHasGeneratedOnce,
    getGenerationMode,
    setSelectedKey,
    setSelectedMode,
    setProgressionName,
    setCurrentContext,
    setGenerationMode,
    addChordRequirement,
    removeChordRequirementAt,
    clearAllChordRequirements
} from './stateManager.js';

// ============================================================================
// Notification System
// ============================================================================

export function showNotification(message, type = 'info') {
    let notification = document.getElementById('appNotification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'appNotification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }

    notification.textContent = message;
    notification.className = `notification notification-${type} visible`;

    setTimeout(() => {
        notification.classList.remove('visible');
    }, 3000);
}

// ============================================================================
// Animation Effects
// ============================================================================

export function triggerSparkle() {
    const btn = document.getElementById('generateBtn');
    if (btn) {
        btn.classList.add('sparkle');
        setTimeout(() => btn.classList.remove('sparkle'), TIMING.SPARKLE_DURATION);
    }
}

// ============================================================================
// Context Switching
// ============================================================================

export function switchContext(context) {
    setCurrentContext(context);
    document.body.setAttribute('data-context', context);

    document.querySelectorAll('.context-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-context') === context) {
            tab.classList.add('active');
        }
    });

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

    const leftHandedToggle = document.getElementById('leftHandedToggle');
    if (leftHandedToggle) {
        leftHandedToggle.style.display = context === 'guitar' ? 'flex' : 'none';
    }

    saveToLocalStorage(getSelectedKey(), getSelectedMode(), getSelectedProgression(), getIsLeftHanded(), context);
}

// ============================================================================
// Generation Mode Switching
// ============================================================================

export function switchGenerationMode(mode) {
    setGenerationMode(mode);
    const modeSelect = document.getElementById('modeSelect');
    const progressionSelect = document.getElementById('progressionSelect');
    const progressionNameInput = document.getElementById('progressionName');
    const progressionNameLabel = document.getElementById('progressionNameLabel');
    const paletteModeContainer = document.getElementById('paletteModeContainer');
    const scaleModeContainer = document.getElementById('scaleModeContainer');

    if (mode === 'template') {
        progressionSelect.disabled = false;
        progressionSelect.style.cursor = '';
        progressionNameInput.disabled = false;
        modeSelect.disabled = true;
        modeSelect.style.cursor = 'not-allowed';
        paletteModeContainer.classList.add('active');
        scaleModeContainer.classList.remove('active');
        if (progressionNameLabel) {
            progressionNameLabel.textContent = 'Progression Name';
        }
    } else {
        modeSelect.disabled = false;
        modeSelect.style.cursor = '';
        progressionSelect.disabled = true;
        progressionSelect.style.cursor = 'not-allowed';
        progressionNameInput.disabled = true;
        paletteModeContainer.classList.remove('active');
        scaleModeContainer.classList.add('active');
        if (progressionNameLabel) {
            progressionNameLabel.textContent = 'Output Name';
        }
    }

    updateProgressionName();

    if (getHasGeneratedOnce()) {
        triggerSparkle();
        generateProgressions();
    }
}

// ============================================================================
// Tooltip System
// ============================================================================

export function showTooltip(element, text) {
    const tooltip = document.getElementById('chordTooltip') || createTooltip();
    tooltip.textContent = text;

    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + rect.width / 2 + 'px';
    tooltip.style.top = (rect.top - 10) + 'px';
    tooltip.style.transform = 'translate(-50%, -100%)';

    setTimeout(() => tooltip.classList.add('visible'), TIMING.TOOLTIP_DELAY);
}

export function createTooltip() {
    const existing = document.getElementById('chordTooltip');
    if (existing) return existing;

    const tooltip = document.createElement('div');
    tooltip.id = 'chordTooltip';
    tooltip.className = 'tooltip';
    tooltip.style.position = 'fixed';
    document.body.appendChild(tooltip);

    return tooltip;
}

export function getChordTooltip(romanNumeral, chordType) {
    const normalized = romanNumeral ? romanNumeral.toUpperCase() : '';

    const upperNormalized = normalized.replace(/^([IVX]+)/i, (match) => {
        if (romanNumeral && romanNumeral[0] === romanNumeral[0].toLowerCase() && romanNumeral[0] !== '♭' && romanNumeral[0] !== '♯') {
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

    let translation = i18n.t(`chordRoles.${upperNormalized}`);
    if (translation && translation !== `chordRoles.${upperNormalized}`) {
        return translation;
    }

    const withoutQuality = upperNormalized.replace(/M7|MAJ7|7|°|Ø7|DIM/g, '');
    translation = i18n.t(`chordRoles.${withoutQuality}`);
    if (translation && translation !== `chordRoles.${withoutQuality}`) {
        return translation;
    }

    if (chordType) {
        if (chordType.includes('sus')) return i18n.t('chordRoles.sus');
        if (chordType.includes('add9')) return i18n.t('chordRoles.add9');
        if (chordType.includes('6')) return i18n.t('chordRoles.6');
        if (chordType.includes('9') || chordType.includes('11') || chordType.includes('13')) {
            return i18n.t('chordRoles.extended');
        }
    }

    if (normalized.includes('♭') || normalized.includes('♯')) {
        return i18n.t('chordRoles.borrowed');
    }

    return i18n.t('chordRoles.default');
}

// ============================================================================
// Voice Leading Analysis
// ============================================================================

export function analyzeVoiceLeading(notes1, notes2) {
    if (!notes1 || !notes2) return null;

    const pc1 = notes1.map(n => n % 12);
    const pc2 = notes2.map(n => n % 12);
    const commonTones = pc1.filter(pc => pc2.includes(pc));

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
        smoothness: commonToneCount + stepMotion
    };
}

export function activateVoiceLeadingHover(pad) {
    const referenceNotesStr = pad.getAttribute('data-notes');
    if (!referenceNotesStr) return;

    const referenceNotes = referenceNotesStr.split(',').map(Number);
    const card = pad.closest('.progression-card');
    if (!card) return;

    const allPads = card.querySelectorAll('.chord-pad');
    pad.classList.add('vl-hover-reference');

    const hoverLegend = 'Distance from hovered chord:\n🟢 Smooth  🟡 Moderate  🟠 Dramatic';
    allPads.forEach(otherPad => {
        if (otherPad === pad) return;

        const otherNotesStr = otherPad.getAttribute('data-notes');
        if (!otherNotesStr) return;

        const otherNotes = otherNotesStr.split(',').map(Number);
        const vlAnalysis = analyzeVoiceLeading(referenceNotes, otherNotes);

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

export function deactivateVoiceLeadingHover(pad) {
    pad.classList.remove('vl-hover-reference');
    const card = pad.closest('.progression-card');
    if (!card) return;

    const allPads = card.querySelectorAll('.chord-pad');

    allPads.forEach(otherPad => {
        otherPad.classList.remove('vl-smooth', 'vl-moderate', 'vl-leap');
        const originalClass = otherPad.getAttribute('data-original-vl-class');
        if (originalClass) {
            otherPad.classList.add(originalClass);
        }
        otherPad.removeAttribute('data-hover-voice-leading');
    });
}

// ============================================================================
// Chord Matcher Functions
// ============================================================================

export function toggleChordMatcher() {
    const matcher = document.getElementById('chordMatcher');
    matcher.classList.toggle('expanded');
}

export function handleAddChordRequirement() {
    const noteSelect = document.getElementById('chordNote');
    const qualitySelect = document.getElementById('chordQuality');

    if (!noteSelect || !qualitySelect) {
        console.error(MESSAGES.ERRORS.DOM_ELEMENT_NOT_FOUND);
        return;
    }

    if (!noteSelect.value || !qualitySelect.value) {
        showNotification('Please select both a note and chord quality', 'warning');
        return;
    }

    if (getChordRequirements().length >= LIMITS.MAX_CHORD_REQUIREMENTS) {
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

    if (getChordRequirements().find(c => c.display === chord.display)) {
        showNotification(MESSAGES.WARNINGS.CHORD_ALREADY_EXISTS, 'warning');
        noteSelect.value = '';
        qualitySelect.value = '';
        return;
    }

    addChordRequirement(chord);
    renderChordRequirements();
    analyzeCompatibleKeys();

    noteSelect.value = '';
    qualitySelect.value = '';
    showNotification(`Added ${chord.display} to chord matcher`, 'info');
}

export function handleRemoveChordRequirement(index) {
    removeChordRequirementAt(index);
    renderChordRequirements();
    analyzeCompatibleKeys();
}

export function handleClearChordRequirements() {
    clearAllChordRequirements();
    renderChordRequirements();
    analyzeCompatibleKeys();
}

export function renderChordRequirements() {
    const container = document.getElementById('selectedChords');
    const requirements = getChordRequirements();

    if (requirements.length === 0) {
        container.innerHTML = '<span style="color: var(--muted); font-size: 14px;">No chords selected</span>';
    } else {
        container.innerHTML = requirements.map((chord, index) => `
            <div class="chord-tag">
                ${chord.display}
                <button onclick="removeChordRequirement(${index})">×</button>
            </div>
        `).join('');
    }
}

// ============================================================================
// Compatibility Analysis
// ============================================================================

function isKeyModeCompatible(key, mode) {
    const keyOffset = getKeyOffset(key);
    const scaleDegrees = getScaleDegrees(mode);
    const requirements = getChordRequirements();

    const availableChords = [];
    for (let i = 0; i < scaleDegrees.length; i++) {
        const degree = scaleDegrees[i];
        let quality;
        if (mode === 'Major') {
            quality = [0, 3, 4].includes(i) ? 'major' : [1, 2, 5].includes(i) ? 'minor' : 'diminished';
        } else if (mode === 'Minor') {
            quality = [0, 3, 4].includes(i) ? 'minor' : [2, 5, 6].includes(i) ? 'major' : 'diminished';
        } else {
            quality = i === 0 ? 'major' : 'minor';
        }

        const noteName = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][(degree + keyOffset) % 12];
        availableChords.push({ note: noteName, quality });

        if (quality === 'major') {
            availableChords.push({ note: noteName, quality: 'maj7' });
            availableChords.push({ note: noteName, quality: '7' });
        } else if (quality === 'minor') {
            availableChords.push({ note: noteName, quality: 'm7' });
        }
    }

    return requirements.every(req =>
        availableChords.some(chord =>
            chord.note.replace('#', '').replace('♭', '') === req.note.replace('#', '').replace('♭', '') &&
            (chord.quality === req.quality ||
             (req.quality === '7' && chord.quality === 'major') ||
             (req.quality === 'm7' && chord.quality === 'minor') ||
             (req.quality === 'maj7' && chord.quality === 'major'))
        )
    );
}

export function analyzeCompatibleKeys() {
    const requirements = getChordRequirements();

    if (requirements.length === 0) {
        document.getElementById('keyModeSuggestions').style.display = 'none';
        resetKeyModeFilters();
        return;
    }

    const compatibleKeysAndModes = [];

    keys.forEach(key => {
        Object.values(modes).flat().forEach(modeObj => {
            const modeName = typeof modeObj === 'string' ? modeObj : modeObj.value;
            if (isKeyModeCompatible(key, modeName)) {
                compatibleKeysAndModes.push({ key, mode: modeName });
            }
        });
    });

    displayCompatibilityResults(compatibleKeysAndModes);
    filterKeyModeDropdowns(compatibleKeysAndModes);
}

function displayCompatibilityResults(compatibleList) {
    const suggestionsDiv = document.getElementById('keyModeSuggestions');
    const listDiv = document.getElementById('suggestionList');

    if (compatibleList.length === 0) {
        listDiv.innerHTML = '<div class="suggestion-item incompatible">No compatible keys found. Try fewer or different chords.</div>';
    } else {
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
        keySelect.disabled = true;
        modeSelect.disabled = true;
        return;
    }

    keySelect.disabled = false;
    modeSelect.disabled = false;

    const originalKey = getSelectedKey();
    const originalMode = getSelectedMode();

    const compatibleKeys = [...new Set(compatibleList.map(item => item.key))];
    const compatibleModes = [...new Set(compatibleList.map(item => item.mode))];

    Array.from(keySelect.options).forEach(option => {
        if (option.value) {
            option.disabled = !compatibleKeys.includes(option.value);
            option.style.color = option.disabled ? 'var(--muted)' : '';
        }
    });

    Array.from(modeSelect.options).forEach(option => {
        if (option.value) {
            option.disabled = !compatibleModes.includes(option.value);
            option.style.color = option.disabled ? 'var(--muted)' : '';
        }
    });

    if (!compatibleKeys.includes(originalKey)) {
        keySelect.value = compatibleKeys[0];
        setSelectedKey(compatibleKeys[0]);
    }

    if (!compatibleModes.includes(originalMode)) {
        modeSelect.value = compatibleModes[0];
        setSelectedMode(compatibleModes[0]);
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

// ============================================================================
// Populate Select Elements
// ============================================================================

export function populateSelects() {
    const keySelect = document.getElementById('keySelect');
    const modeSelect = document.getElementById('modeSelect');
    const progressionSelect = document.getElementById('progressionSelect');

    // Clear existing options (keep first placeholder if exists)
    while (keySelect.options.length > 0) keySelect.remove(0);
    while (modeSelect.options.length > 0) modeSelect.remove(0);
    while (progressionSelect.options.length > 0) progressionSelect.remove(0);

    // Keys
    keys.forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        keySelect.appendChild(option);
    });

    // Modes
    Object.entries(modes).forEach(([category, modeList]) => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = i18n.t(`modeCategories.${category}`);
        modeList.forEach(modeObj => {
            const option = document.createElement('option');
            if (typeof modeObj === 'string') {
                option.value = modeObj;
                option.textContent = modeObj;
            } else {
                option.value = modeObj.value;
                option.textContent = modeObj.name;
                const modeTranslation = i18n.t(`modes.${modeObj.value}.description`);
                if (modeTranslation && modeTranslation !== `modes.${modeObj.value}.description`) {
                    option.title = modeTranslation;
                } else if (modeObj.description) {
                    option.title = modeObj.description;
                }
            }
            optgroup.appendChild(option);
        });
        modeSelect.appendChild(optgroup);
    });

    // Progressions
    Object.entries(progressions).forEach(([category, progList]) => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = i18n.t(`progressionCategories.${category}`);
        progList.forEach(prog => {
            const option = document.createElement('option');
            option.value = prog.value;
            const progKey = `progressions.${category}.${prog.value}`;
            const translatedName = i18n.t(`${progKey}.name`);
            const translatedNickname = i18n.t(`${progKey}.nickname`);

            const displayName = (translatedName && translatedName !== `${progKey}.name`)
                ? translatedName
                : prog.name;
            const displayNickname = (translatedNickname && translatedNickname !== `${progKey}.nickname`)
                ? translatedNickname
                : prog.nickname;

            option.textContent = displayNickname ? `${displayName} (${displayNickname})` : displayName;

            const translatedDescription = i18n.t(`${progKey}.description`);
            if (translatedDescription && translatedDescription !== `${progKey}.description`) {
                option.title = translatedDescription;
            } else if (prog.description) {
                option.title = prog.description;
            }
            optgroup.appendChild(option);
        });
        progressionSelect.appendChild(optgroup);
    });
}

// ============================================================================
// Progression Name Management
// ============================================================================

export function updateProgressionName() {
    const key = getSelectedKey().split('/')[0];
    let name;

    if (getGenerationMode() === 'template') {
        const prog = getSelectedProgression().replace(/—/g, '-');
        name = `${key}_${prog}`;
    } else {
        const modeShort = getSelectedMode().slice(0, 3);
        name = `${key}_${modeShort}_Scale-Exploration`;
    }

    setProgressionName(name);
    document.getElementById('progressionName').value = name;
}

// ============================================================================
// Page Translation
// ============================================================================

export function updatePageTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = i18n.t(key);

        if (element.children.length === 0) {
            element.textContent = translation;
        } else {
            Array.from(element.childNodes).forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    node.textContent = translation;
                }
            });
        }
    });

    populateSelects();
}

// ============================================================================
// Print Function
// ============================================================================

export function printAllProgressions() {
    globalThis.print();
}

// ============================================================================
// Export functions to global scope for HTML onclick attributes
// ============================================================================

export function exposeGlobalFunctions() {
    globalThis.toggleChordMatcher = toggleChordMatcher;
    globalThis.addChordRequirement = handleAddChordRequirement;
    globalThis.removeChordRequirement = handleRemoveChordRequirement;
    globalThis.clearChordRequirements = handleClearChordRequirements;
}

// ============================================================================
// Forward declarations for functions defined in progressionGenerator.js
// These will be set by the main app after all modules are loaded
// ============================================================================

let _generateProgressions = null;
let _renderProgressions = null;

export function setGenerateProgressions(fn) {
    _generateProgressions = fn;
}

export function setRenderProgressions(fn) {
    _renderProgressions = fn;
}

export function generateProgressions() {
    if (_generateProgressions) {
        _generateProgressions();
    }
}

export function renderProgressions() {
    if (_renderProgressions) {
        _renderProgressions();
    }
}
