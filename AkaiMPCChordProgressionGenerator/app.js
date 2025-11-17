// Import from modules
import {
    keys,
    modes,
    progressions,
    getKeyOffset,
    getScaleDegrees,
    getChordQualityForMode,
    buildChord,
    buildChordRaw,
    getChordName,
    getRomanNumeral,
    generateProgressionChords,
    getEnharmonicContext,
    getNoteNameWithContext,
    spellChordNotes
} from './modules/musicTheory.js';

import {
    guitarChords,
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
    generateGuitarSVG
} from './modules/rendering.js';

// State variables
let selectedKey = 'C';
let selectedMode = 'Major';
let selectedProgression = 'I—V—vi—IV';
let progressionName = '';
let variants = [];
let audioContext = null;
let chordRequirements = [];
let currentContext = 'mpc'; // 'mpc', 'keyboard', or 'guitar'
let isLeftHanded = false;
let hasGeneratedOnce = false; // Track if user has generated at least once

// Trigger sparkle animation on Generate button
function triggerSparkle() {
    const btn = document.getElementById('generateBtn');
    if (btn) {
        btn.classList.add('sparkle');
        setTimeout(() => btn.classList.remove('sparkle'), 600);
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
    if (context === 'mpc') {
        downloadBtn.textContent = 'Download all .progression files';
    } else {
        downloadBtn.textContent = 'Print all progressions';
    }

    // Show/hide left-handed toggle for guitar context
    const leftHandedToggle = document.getElementById('leftHandedToggle');
    if (context === 'guitar') {
        leftHandedToggle.style.display = 'flex';
    } else {
        leftHandedToggle.style.display = 'none';
    }
}

// Print all progressions (for keyboard/guitar contexts)
function printAllProgressions() {
    window.print();
}

// Chord Matcher Functions
function toggleChordMatcher() {
    const matcher = document.getElementById('chordMatcher');
    matcher.classList.toggle('expanded');
}

function addChordRequirement() {
    const noteSelect = document.getElementById('chordNote');
    const qualitySelect = document.getElementById('chordQuality');

    if (!noteSelect.value || !qualitySelect.value) {
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
    if (!chordRequirements.find(c => c.display === chord.display)) {
        chordRequirements.push(chord);
        renderChordRequirements();
        analyzeCompatibleKeys();
    }

    // Reset selectors
    noteSelect.value = '';
    qualitySelect.value = '';
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
        Object.values(modes).flat().forEach(mode => {
            if (isKeyModeCompatible(key, mode)) {
                compatibleKeysAndModes.push({ key, mode });
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

    // V/V (secondary dominant of V)
    if (!analysis.hasSecondary && scaleDegrees.length > 1) {
        const secondaryDom = scaleDegrees[1 % scaleDegrees.length];
        candidates.push({
            root: secondaryDom,
            notes: buildChord(secondaryDom, 'major', keyOffset),
            chordType: 'major',
            chordName: getChordName(secondaryDom, 'major', keyOffset),
            romanNumeral: 'V/V',
            quality: 'Major',
            category: 'secondary',
            commonUsage: 0.6
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

    // Map of roman numerals to tooltip text
    const tooltipMap = {
'I': 'Tonic - the home chord, gives resolution and stability.',
'IMAJ7': 'Tonic - the home chord, gives resolution and stability.',
'II': 'Supertonic - predominant chord, often leading to V.',
'IIM7': 'Supertonic - predominant chord, often leading to V.',
'III': 'Mediant - weaker predominant or color chord, connects I and IV/vi.',
'IIIM7': 'Mediant - weaker predominant or color chord, connects I and IV/vi.',
'IV': 'Subdominant - predominant chord, prepares motion to V.',
'IVMAJ7': 'Subdominant - predominant chord, prepares motion to V.',
'V': 'Dominant - creates tension that resolves to I.',
'V7': 'Dominant - creates tension that resolves to I.',
'VI': 'Submediant - relative minor, often used for deceptive cadences.',
'VIM7': 'Submediant - relative minor, often used for deceptive cadences.',
'VII°': 'Leading-tone - diminished chord, pulls strongly to I.',
'VIIØ7': 'Leading-tone - diminished chord, pulls strongly to I.',

// Modal mixture / Borrowed chords
'♭III': 'Borrowed from parallel minor, adds dramatic color, substitutes I.',
'♭IV': 'Borrowed minor subdominant, softens motion to V.',
'♭VI': 'Borrowed from parallel minor, dramatic predominant, often moves to V.',
'♭VII': 'Borrowed from Mixolydian, gives rock/blues flavor, often moves to I or V.',
'♭II': 'Borrowed flat-II (Neapolitan), strong predominant, prepares V.',
'♭V': 'Rare borrowed chord, chromatic color.',
'♭IV°': 'Borrowed diminished passing chord, leads to V.',

// Secondary dominants
'V/II': 'Secondary dominant - tonicizes ii, creates motion to ii.',
'V/III': 'Secondary dominant - tonicizes iii, rarely used but colorful.',
'V/IV': 'Secondary dominant - tonicizes IV, brightens progression.',
'V/V': 'Secondary dominant - tonicizes V, very common to strengthen cadence.',
'V/VI': 'Secondary dominant - tonicizes vi, used for deceptive shifts.',

// Secondary leading-tones
'VII°/II': 'Leading-tone chord of ii, resolves strongly to ii.',
'VII°/III': 'Leading-tone chord of iii, resolves strongly to iii.',
'VII°/IV': 'Leading-tone chord of IV, resolves strongly to IV.',
'VII°/V': 'Leading-tone chord of V, resolves strongly to V.',
'VII°/VI': 'Leading-tone chord of vi, resolves strongly to vi.',

// Special chords
'SUBV7': 'Tritone substitution - jazz substitution for V7, creates chromatic voice leading.',
'♯I°': 'Passing diminished - chromatic connector between diatonic chords.',
'♯II°': 'Passing diminished - chromatic connector between diatonic chords.'
    };

    // Handle lowercase roman numerals (minor chords)
    const upperNormalized = normalized.replace(/^([IVX]+)/i, (match) => {
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

    // First try exact match
    if (tooltipMap[upperNormalized]) {
        return tooltipMap[upperNormalized];
    }

    // Try without quality indicators
    const withoutQuality = upperNormalized.replace(/M7|MAJ7|7|°|Ø7|DIM/g, '');
    if (tooltipMap[withoutQuality]) {
        return tooltipMap[withoutQuality];
    }

    // Handle chord types
    if (chordType) {
        if (chordType.includes('sus')) {
            return 'Suspended chord - replaces 3rd with 2nd/4th, creates suspension before resolution.';
        }
        if (chordType.includes('add9')) {
            return 'Adds brightness, dreamy color.';
        }
        if (chordType.includes('6')) {
            return 'Vintage color, softens the harmony.';
        }
        if (chordType.includes('9') || chordType.includes('11') || chordType.includes('13')) {
            return 'Extended harmony - jazz/pop color, adds depth.';
        }
    }

    // Default based on whether it's borrowed
    if (normalized.includes('♭') || normalized.includes('♯')) {
        return 'Borrowed chord - adds expressive color by borrowing from parallel mode.';
    }

    // Default for unrecognized chords
    return 'Harmonic color - adds variety and interest to the progression.';
}

function showTooltip(element, text) {
    const tooltip = document.getElementById('chordTooltip') || createTooltip();
    tooltip.textContent = text;

    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + rect.width / 2 + 'px';
    tooltip.style.top = (rect.top - 10) + 'px';
    tooltip.style.transform = 'translate(-50%, -100%)';

    setTimeout(() => tooltip.classList.add('visible'), 10);
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

function generateVariant(variantType) {
    const keyOffset = getKeyOffset(selectedKey);
    const scaleDegrees = getScaleDegrees(selectedMode);
    const pads = [];

    // Generate the actual progression chords - PASS selectedMode as 4th parameter (FIX!)
    const progressionChords = generateProgressionChords(selectedProgression, keyOffset, scaleDegrees, selectedMode);

    // Fill first 12 pads (rows 1-3)
    const rows1to3 = [];
    for (let i = 0; i < 12; i++) {
        let degree, chordType, notes, chordName, romanNumeral, quality;
        let isProgressionChord = false;

        // First, place the progression chords
        if (i < progressionChords.length) {
            const progChord = progressionChords[i];
            notes = progChord.notes;
            chordName = progChord.chordName;
            romanNumeral = progChord.romanNumeral;
            chordType = progChord.chordType;
            isProgressionChord = true;

            // Enhance chords based on variant type
            if (variantType === 'Jazz' && i >= 4) {
                // Add 7ths to some chords in Jazz variant
                const scaleDegree = scaleDegrees[progChord.degree % scaleDegrees.length];
                if (!chordType.includes('7')) {
                    chordType = chordType === 'minor' ? 'minor7' :
                               chordType === 'major' ? 'major7' : chordType;
                    notes = buildChord(scaleDegree, chordType, keyOffset);
                    chordName = getChordName(scaleDegree, chordType, keyOffset);
                }
            }

            quality = chordType === 'minor' ? 'Minor' :
                     chordType === 'major' ? 'Major' :
                     chordType === 'diminished' ? 'Diminished' :
                     chordType === 'major7' ? 'Major 7' :
                     chordType === 'minor7' ? 'Minor 7' :
                     chordType === 'dom7' ? 'Dominant 7' : 'Major';
        } else {
            // Fill with scale degree chords
                degree = (i % 7);
                const scaleDegree = scaleDegrees[degree % scaleDegrees.length];

                // Get proper chord quality based on mode
                chordType = getChordQualityForMode(degree, selectedMode);

                // Add variations based on variant type
                if (variantType === 'Jazz' && i >= 8) {
                    chordType = chordType === 'minor' ? 'minor7' :
                               chordType === 'major' ? 'major7' : chordType;
                }

                notes = buildChord(scaleDegree, chordType, keyOffset);
                chordName = getChordName(scaleDegree, chordType, keyOffset);
                romanNumeral = getRomanNumeral(degree, chordType.includes('minor'), chordType === 'diminished');

                quality = chordType === 'minor' ? 'Minor' :
                         chordType === 'major' ? 'Major' :
                         chordType === 'diminished' ? 'Diminished' :
                         chordType === 'major7' ? 'Major 7' :
                         chordType === 'minor7' ? 'Minor 7' : 'Major';
        }

        const pad = {
            id: i + 1,
            chordName,
            romanNumeral,
            notes,
            quality,
            row: Math.floor(i / 4) + 1,
            col: (i % 4) + 1,
            isProgressionChord
        };

        pads.push(pad);
        rows1to3.push(pad);
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
                isProgressionChord: false
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
                isProgressionChord: false
            });
        }
    }

    return {
        name: variantType,
        pads
    };
}

// Initialize audio context
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
        console.warn('Web Audio API not supported');
    }
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

    // Modes
    const modeSelect = document.getElementById('modeSelect');
    Object.entries(modes).forEach(([category, modeList]) => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = category;
        modeList.forEach(mode => {
            const option = document.createElement('option');
            option.value = mode;
            option.textContent = mode;
            optgroup.appendChild(option);
        });
        modeSelect.appendChild(optgroup);
    });

    // Progressions
    const progressionSelect = document.getElementById('progressionSelect');
    Object.entries(progressions).forEach(([category, progList]) => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = category;
        progList.forEach(prog => {
            const option = document.createElement('option');
            option.value = prog.value;
            option.textContent = prog.nickname ? `${prog.name} (${prog.nickname})` : prog.name;
            optgroup.appendChild(option);
        });
        progressionSelect.appendChild(optgroup);
    });
}

// Update progression name
function updateProgressionName() {
    const key = selectedKey.split('/')[0];
    const modeShort = selectedMode.slice(0, 3);
    const prog = selectedProgression.replace(/—/g, '-');
    progressionName = `${key}${modeShort}_${prog}`;
    document.getElementById('progressionName').value = progressionName;
}

function generateProgressions() {
    if (selectedMode === 'Locrian' && selectedProgression.includes('I—IV—V')) {
        console.warn('⚠️ Locrian\'s diminished tonic makes this progression unusual');
    }

    variants = [
        generateVariant('Classic'),
        generateVariant('Jazz'),
        generateVariant('Modal'),
        generateVariant('Experimental')
    ];

    renderProgressions();
    hasGeneratedOnce = true;
}

function downloadSingleProgression(variant, index) {
    const keyName = selectedKey.split('/')[0];
    const fileName = `${keyName}${selectedMode.slice(0,3)}_${selectedProgression.replace(/—/g, '-')}_${variant.name}-${index + 1}.progression`;

    const progressionData = {
        progression: {
            name: fileName.replace('.progression', ''),
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

        const gridHTML = rows.reverse().map(row =>
            row.map(pad => `
                <div class="chord-pad ${pad.isProgressionChord ? 'progression-chord' : ''}"
                    data-notes="${pad.notes.join(',')}" data-roman="${pad.romanNumeral}" data-quality="${pad.quality}">
                    <div class="chord-text-column">
                        <div class="chord-pad-content">
                            <div class="chord-info">
                                <div class="chord-name">${pad.chordName}</div>
                            </div>
                            <div class="pad-number">PAD ${pad.id}</div>
                        </div>
                        <div class="chord-quality">${pad.quality}</div>
                        <div class="chord-roman">${pad.romanNumeral}</div>
                        <div class="chord-notes">
                            ${(() => {
                                // Map quality to chord type for proper spelling
                                let chordType = 'major';
                                if (pad.quality === 'Minor') chordType = 'minor';
                                else if (pad.quality === 'Minor 7') chordType = 'minor7';
                                else if (pad.quality === 'Major 7') chordType = 'major7';
                                else if (pad.quality === 'Dominant 7') chordType = 'dom7';
                                else if (pad.quality === 'Diminished') chordType = 'diminished';

                                // Get properly spelled note names
                                const noteStrings = spellChordNotes(pad.notes[0], chordType, pad.romanNumeral);

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
                </div>
            `).join('')
        ).join('');

        card.innerHTML = `
            <div class="progression-header">
                <div class="progression-info">
                    <div class="progression-title">${progressionName}_${variant.name}</div>
                    <div class="progression-meta">
                        <span class="key">${selectedKey} ${selectedMode}</span>
                        <span class="pattern">${selectedProgression}</span>
                    </div>
                </div>
                <button class="download-btn" title="Download" data-variant-index="${index}">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                </button>
            </div>
            <div class="chord-grid">${gridHTML}</div>
        `;

        container.appendChild(card);
    });

    // Add hover handlers for tooltips
    container.querySelectorAll('.chord-pad').forEach(pad => {
        pad.addEventListener('mouseenter', function() {
            const roman = this.getAttribute('data-roman');
            const quality = this.getAttribute('data-quality');
            const tooltipText = getChordTooltip(roman, quality);
            showTooltip(this, tooltipText);
        });

        pad.addEventListener('mouseleave', function() {
            const tooltip = document.getElementById('chordTooltip');
            if (tooltip) tooltip.classList.remove('visible');
        });
    });

    // Add click handlers for playing chords
    container.querySelectorAll('.chord-pad').forEach(pad => {
        pad.addEventListener('click', function() {
            const notes = this.getAttribute('data-notes').split(',').map(Number);
            playChord(notes);
            this.classList.add('playing');
            setTimeout(() => this.classList.remove('playing'), 300);
        });
    });

    // Add click handlers for individual download buttons
    container.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const variantIndex = parseInt(this.getAttribute('data-variant-index'));
            downloadSingleProgression(variants[variantIndex], variantIndex);
        });
    });

    container.classList.remove('hidden');
    document.getElementById('downloadAllBtn').style.display = 'block';
}

async function playChord(notes) {
    if (!audioContext) return;

    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    notes.forEach(midiNote => {
        const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    });
}

function generateRandom(safe = false) {
    if (safe) {
        const safeKeys = ['C', 'G', 'D', 'A', 'F', 'A♯/B♭', 'D♯/E♭'];
        const safeModes = ['Major', 'Minor', 'Dorian', 'Mixolydian'];
        const safeProgressions = [
            'I—V—vi—IV', 'I—IV—V—I', 'vi—IV—I—V', 'I—vi—IV—V',
            'ii—V—I', 'I—vi—ii—V', '12-bar-blues'
        ];

        selectedKey = safeKeys[Math.floor(Math.random() * safeKeys.length)];
        selectedMode = safeModes[Math.floor(Math.random() * safeModes.length)];
        selectedProgression = safeProgressions[Math.floor(Math.random() * safeProgressions.length)];
    } else {
        selectedKey = keys[Math.floor(Math.random() * keys.length)];

        const allModes = Object.values(modes).flat();
        selectedMode = allModes[Math.floor(Math.random() * allModes.length)];

        const allProgressions = Object.values(progressions).flat();
        const randomProg = allProgressions[Math.floor(Math.random() * allProgressions.length)];
        selectedProgression = randomProg.value;
    }

    document.getElementById('keySelect').value = selectedKey;
    document.getElementById('modeSelect').value = selectedMode;
    document.getElementById('progressionSelect').value = selectedProgression;
    updateProgressionName();
}

function exportProgressions() {
    if (variants.length === 0) {
        alert('Please generate progressions first!');
        return;
    }

    const zip = new JSZip();
    const keyName = selectedKey.split('/')[0];

    variants.forEach((variant, index) => {
        const fileName = `${keyName}${selectedMode.slice(0,3)}_${selectedProgression.replace(/—/g, '-')}_${variant.name}-${index + 1}.progression`;

        const progressionData = {
            progression: {
                name: fileName.replace('.progression', ''),
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

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    initAudio();
    populateSelects();

    // Load preferences: URL params take priority over localStorage
    const urlPrefs = loadFromURL();
    const storedPrefs = loadFromLocalStorage();
    const prefsToApply = urlPrefs || storedPrefs;

    if (prefsToApply) {
        applyPreferences(prefsToApply);
    }

    updateProgressionName();
    renderChordRequirements(); // Initialize chord requirements display

    document.getElementById('keySelect').addEventListener('change', function() {
        selectedKey = this.value;
        updateProgressionName();
        saveToLocalStorage(selectedKey, selectedMode, selectedProgression, isLeftHanded);
        updateURL(selectedKey, selectedMode, selectedProgression, isLeftHanded);
        if (hasGeneratedOnce) {
            triggerSparkle();
            generateProgressions();
        }
    });

    document.getElementById('modeSelect').addEventListener('change', function() {
        selectedMode = this.value;
        updateProgressionName();
        saveToLocalStorage(selectedKey, selectedMode, selectedProgression, isLeftHanded);
        updateURL(selectedKey, selectedMode, selectedProgression, isLeftHanded);
        if (hasGeneratedOnce) {
            triggerSparkle();
            generateProgressions();
        }
    });

    document.getElementById('progressionSelect').addEventListener('change', function() {
        selectedProgression = this.value;
        updateProgressionName();
        saveToLocalStorage(selectedKey, selectedMode, selectedProgression, isLeftHanded);
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
    document.getElementById('cluelessBtn').addEventListener('click', () => {
        generateRandom(true);
        generateProgressions();
    });
    document.getElementById('luckyBtn').addEventListener('click', () => {
        generateRandom(false);
        generateProgressions();
    });

    // Handle Download/Print button based on context
    document.getElementById('downloadAllBtn').addEventListener('click', () => {
        if (currentContext === 'mpc') {
            exportProgressions();
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

    // Left-handed toggle for guitar
    document.getElementById('leftHandedCheckbox').addEventListener('change', function() {
        isLeftHanded = this.checked;
        saveToLocalStorage(selectedKey, selectedMode, selectedProgression, isLeftHanded);
        updateURL(selectedKey, selectedMode, selectedProgression, isLeftHanded);
        // Regenerate progressions to reflect the change
        const progressionsContainer = document.getElementById('progressionsContainer');
        if (!progressionsContainer.classList.contains('hidden')) {
            generateProgressions();
        }
    });

    // Handle print orientation based on context
    let printStyleElement = null;

    window.addEventListener('beforeprint', () => {
        // Remove any existing print style
        if (printStyleElement) {
            printStyleElement.remove();
        }

        // Create dynamic @page rule based on current context
        printStyleElement = document.createElement('style');
        if (currentContext === 'keyboard') {
            // Keyboard diagrams are wide - use landscape
            printStyleElement.textContent = '@page { size: landscape; margin: 1cm; }';
        } else {
            // Guitar and MPC use portrait (guitar diagrams are tall)
            printStyleElement.textContent = '@page { size: portrait; margin: 1cm; }';
        }
        document.head.appendChild(printStyleElement);
    });

    window.addEventListener('afterprint', () => {
        // Clean up after printing
        if (printStyleElement) {
            printStyleElement.remove();
            printStyleElement = null;
        }
    });

    // Initialize context
    switchContext('mpc');
});
