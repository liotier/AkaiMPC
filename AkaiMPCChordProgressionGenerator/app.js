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
    applyVoicingStyle
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
let generationMode = 'template'; // 'template' or 'scale'
let selectedMidiOutput = null; // Selected MIDI output device

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

// Generation mode switching (Template vs Scale Exploration)
function switchGenerationMode(mode) {
    generationMode = mode;
    const modeSelect = document.getElementById('modeSelect');
    const progressionSelect = document.getElementById('progressionSelect');
    const progressionNameInput = document.getElementById('progressionName');

    if (mode === 'template') {
        // Template Mode: Progression is active, Mode is disabled
        progressionSelect.disabled = false;
        progressionSelect.title = '';
        progressionSelect.style.cursor = '';
        progressionNameInput.disabled = false;

        modeSelect.disabled = true;
        modeSelect.title = 'Mode/Scale selector is not used in Template mode. The progression defines its own harmonic structure.';
        modeSelect.style.cursor = 'not-allowed';
    } else {
        // Scale Exploration Mode: Mode is active, Progression is disabled
        modeSelect.disabled = false;
        modeSelect.title = '';
        modeSelect.style.cursor = '';

        progressionSelect.disabled = true;
        progressionSelect.title = 'Progression templates are not used in Scale Exploration mode. All chords from the selected scale will be generated.';
        progressionSelect.style.cursor = 'not-allowed';
        progressionNameInput.disabled = true;
    }

    // Update progression name to reflect new mode
    updateProgressionName();

    // Re-generate if user has generated at least once
    if (hasGeneratedOnce) {
        triggerSparkle();
        generateProgressions();
    }
}

// Print all progressions (for keyboard/guitar contexts)
function printAllProgressions() {
    window.print();
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

            // Auto-select first MIDI device
            if (WebMidi.outputs.length > 0) {
                selectedMidiOutput = WebMidi.outputs[0];
                midiOutputSelect.value = selectedMidiOutput.id;
                console.log(`Auto-selected MIDI output: ${selectedMidiOutput.name}`);
            }

            console.log(`Found ${WebMidi.outputs.length} MIDI output(s)`);
        } else {
            console.log('No MIDI outputs available');
        }

        // Handle device selection
        midiOutputSelect.addEventListener('change', function() {
            if (this.value === '') {
                selectedMidiOutput = null;
                console.log('Using browser beep');
            } else {
                selectedMidiOutput = WebMidi.getOutputById(this.value);
                console.log('Selected MIDI output:', selectedMidiOutput.name);
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

// Expose functions to global scope for HTML onclick attributes
window.toggleChordMatcher = toggleChordMatcher;
window.addChordRequirement = addChordRequirement;
window.removeChordRequirement = removeChordRequirement;
window.clearChordRequirements = clearChordRequirements;

// Expose state variables for debugging (read-only via getters)
Object.defineProperty(window, 'selectedKey', { get: () => selectedKey });
Object.defineProperty(window, 'selectedMode', { get: () => selectedMode });
Object.defineProperty(window, 'selectedProgression', { get: () => selectedProgression });

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
            isProgressionChord: false
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
            isProgressionChord: false
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
                romanNumeral = chordType === 'major7' ? romanNumeral + 'M7' :
                              chordType === 'dom7' ? romanNumeral + '7' :
                              romanNumeral + '7';
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
            isProgressionChord: false
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
            isProgressionChord: false
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
    const addChord = (degree, type, romanBase, suffix, spice) => {
        const roman = romanBase + suffix;
        if (usedRomanNumerals.has(roman)) return; // Skip duplicates
        usedRomanNumerals.add(roman);

        const scaleDegree = scaleDegrees[degree % scaleDegrees.length];
        palette.push({
            degree,
            notes: buildChord(scaleDegree, type, keyOffset),
            chordType: type,
            chordName: getChordName(scaleDegree, type, keyOffset, romanBase),
            romanNumeral: roman,
            spiceLevel: spice // 0=foundation, 1=standard, 2=colorful, 3=spicy
        });
    };

    // Generate extensions for each unique degree
    uniqueDegrees.forEach(({ degree, original }) => {
        const romanBase = original.romanNumeral.replace(/7|M7|m7|°/g, '');
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

    // ♭VII - colorful (Mixolydian/blues flavor)
    const flatSeven = (scaleDegrees[0] + 10) % 12;
    palette.push({
        degree: 6,
        notes: buildChord(flatSeven, 'major', keyOffset),
        chordType: 'major',
        chordName: getChordName(flatSeven, 'major', keyOffset, '♭VII'),
        romanNumeral: '♭VII',
        spiceLevel: 2
    });

    // ♭VI - spicy! (borrowed from minor)
    const flatSix = (scaleDegrees[0] + 8) % 12;
    palette.push({
        degree: 5,
        notes: buildChord(flatSix, 'major', keyOffset),
        chordType: 'major',
        chordName: getChordName(flatSix, 'major', keyOffset, '♭VI'),
        romanNumeral: '♭VI',
        spiceLevel: 3
    });

    // ♭III - spicy!
    const flatThree = (scaleDegrees[0] + 3) % 12;
    palette.push({
        degree: 2,
        notes: buildChord(flatThree, 'major', keyOffset),
        chordType: 'major',
        chordName: getChordName(flatThree, 'major', keyOffset, '♭III'),
        romanNumeral: '♭III',
        spiceLevel: 3
    });

    // iv - colorful (borrowed from parallel minor)
    if (scaleDegrees.length > 3) {
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
    palette.sort((a, b) => a.spiceLevel - b.spiceLevel);

    progressionChords = palette;

    // Apply variant-specific voicing styles for more diversity
    switch (variantType) {
        case 'Classic':
            // Classic uses default voice leading (already optimized)
            break;
        case 'Jazz':
            // Jazz uses close voicings for that tight, sophisticated sound
            progressionChords = applyVoicingStyle(progressionChords, 'close');
            break;
        case 'Modal':
            // Modal uses open voicings for a more spacious sound
            progressionChords = applyVoicingStyle(progressionChords, 'open');
            break;
        case 'Experimental':
            // Experimental uses spread voicings for maximum variation
            progressionChords = applyVoicingStyle(progressionChords, 'spread');
            break;
    }

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

    if (generationMode === 'template') {
        // Template Mode: Key + Progression
        const prog = selectedProgression.replace(/—/g, '-');
        progressionName = `${key}_${prog}`;
    } else {
        // Scale Exploration Mode: Key + Mode
        const modeShort = selectedMode.slice(0, 3);
        progressionName = `${key}_${modeShort}_Scale-Exploration`;
    }

    document.getElementById('progressionName').value = progressionName;
}

function generateProgressions() {
    if (generationMode === 'template') {
        // Template Mode: Generate 4 variants based on progression
        if (selectedMode === 'Locrian' && selectedProgression.includes('I—IV—V')) {
            console.warn('⚠️ Locrian\'s diminished tonic makes this progression unusual');
        }

        variants = [
            generateVariant('Classic'),
            generateVariant('Jazz'),
            generateVariant('Modal'),
            generateVariant('Experimental')
        ];
    } else {
        // Scale Exploration Mode: Generate single variant showing all scale chords
        variants = [
            generateScaleExploration()
        ];
    }

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
                    <div class="chord-staff">${generateStaffSVG(pad.notes)}</div>
                </div>
            `).join('')
        ).join('');

        const progressionAnalysis = analyzeProgression(variant.pads);

        card.innerHTML = `
            <div class="progression-header">
                <div class="progression-info">
                    <div class="progression-title">${progressionName}_${variant.name}</div>
                    <div class="progression-meta">
                        <span class="key">${selectedKey} ${selectedMode}</span>
                        <span class="pattern">${selectedProgression}</span>
                        ${progressionAnalysis ? `<span class="analysis">${progressionAnalysis}</span>` : ''}
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

            // In staff context, play notes sequentially as eighth notes at 90 BPM
            if (currentContext === 'staff') {
                playNotesSequentially(notes);
                this.classList.add('playing');
                // Remove playing class after all notes have played
                const totalDuration = notes.length * 333;
                setTimeout(() => this.classList.remove('playing'), totalDuration);
            } else {
                // In other contexts, play as a chord
                playChord(notes);
                this.classList.add('playing');
                setTimeout(() => this.classList.remove('playing'), 300);
            }
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

// Start playing chord (note-on) - for keyboard sustain
let activeOscillators = {}; // Track active Web Audio oscillators by MIDI note

async function startChord(notes) {
    // Try MIDI output first if a device is selected
    if (selectedMidiOutput) {
        try {
            console.log('Sending MIDI note-on:', notes, 'to', selectedMidiOutput.name);
            const channel = selectedMidiOutput.channels[1];
            notes.forEach(midiNote => {
                channel.playNote(midiNote, {
                    duration: Infinity, // Sustain until note-off
                    velocity: 0.7
                });
            });
            return; // MIDI successful, skip beep
        } catch (error) {
            console.error('MIDI playback failed, falling back to beep:', error);
            console.error('Error details:', error.message, error.stack);
        }
    }

    // Fallback to Web Audio beep with sustain
    if (!audioContext) return;

    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    notes.forEach(midiNote => {
        // Stop any existing oscillator for this note
        if (activeOscillators[midiNote]) {
            activeOscillators[midiNote].gainNode.gain.cancelScheduledValues(audioContext.currentTime);
            activeOscillators[midiNote].gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
            activeOscillators[midiNote].oscillator.stop(audioContext.currentTime + 0.05);
            delete activeOscillators[midiNote];
        }

        const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);

        oscillator.start(audioContext.currentTime);

        // Store the oscillator for later stopping
        activeOscillators[midiNote] = { oscillator, gainNode };
    });
}

// Stop playing chord (note-off) - for keyboard release
function stopChord(notes) {
    // Try MIDI output first if a device is selected
    if (selectedMidiOutput) {
        try {
            console.log('Sending MIDI note-off:', notes, 'to', selectedMidiOutput.name);
            const channel = selectedMidiOutput.channels[1];
            notes.forEach(midiNote => {
                channel.stopNote(midiNote);
            });
            return; // MIDI successful, skip beep
        } catch (error) {
            console.error('MIDI note-off failed:', error);
        }
    }

    // Fallback to Web Audio beep
    if (!audioContext) return;

    notes.forEach(midiNote => {
        if (activeOscillators[midiNote]) {
            const { oscillator, gainNode } = activeOscillators[midiNote];
            gainNode.gain.cancelScheduledValues(audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
            oscillator.stop(audioContext.currentTime + 0.1);
            delete activeOscillators[midiNote];
        }
    });
}

// Play chord with fixed duration (for mouse clicks)
async function playChord(notes) {
    // Try MIDI output first if a device is selected
    if (selectedMidiOutput) {
        try {
            console.log('Sending MIDI notes:', notes, 'to', selectedMidiOutput.name);
            // Play all notes as a chord using channels() to get channel 1
            const channel = selectedMidiOutput.channels[1];
            notes.forEach(midiNote => {
                channel.playNote(midiNote, {
                    duration: 500,
                    velocity: 0.7
                });
            });
            return; // MIDI successful, skip beep
        } catch (error) {
            console.error('MIDI playback failed, falling back to beep:', error);
            console.error('Error details:', error.message, error.stack);
        }
    } else {
        console.log('No MIDI device selected, using browser beep');
    }

    // Fallback to Web Audio beep
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

// Play notes sequentially as eighth notes at 90 BPM (for staff context)
async function playNotesSequentially(notes) {
    // At 90 BPM: 1 beat = 667ms, 1 eighth note = 333ms
    const eighthNoteDuration = 333; // milliseconds
    const noteSustain = 300; // slightly shorter than duration for clarity

    // Try MIDI output first if a device is selected
    if (selectedMidiOutput) {
        try {
            console.log('Sending MIDI notes sequentially:', notes, 'to', selectedMidiOutput.name);
            const channel = selectedMidiOutput.channels[1];

            for (let i = 0; i < notes.length; i++) {
                channel.playNote(notes[i], {
                    duration: noteSustain,
                    velocity: 0.7
                });
                // Wait for the eighth note duration before playing next note
                if (i < notes.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, eighthNoteDuration));
                }
            }
            return; // MIDI successful, skip beep
        } catch (error) {
            console.error('MIDI sequential playback failed, falling back to beep:', error);
            console.error('Error details:', error.message, error.stack);
        }
    } else {
        console.log('No MIDI device selected, using browser beep');
    }

    // Fallback to Web Audio beep
    if (!audioContext) return;

    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    for (let i = 0; i < notes.length; i++) {
        const midiNote = notes[i];
        const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine';

        const startTime = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + noteSustain / 1000);

        oscillator.start(startTime);
        oscillator.stop(startTime + noteSustain / 1000);

        // Wait for the eighth note duration before playing next note
        if (i < notes.length - 1) {
            await new Promise(resolve => setTimeout(resolve, eighthNoteDuration));
        }
    }
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
    initMIDI();
    populateSelects();

    // Load preferences: URL params take priority over localStorage
    const urlPrefs = loadFromURL();
    const storedPrefs = loadFromLocalStorage();
    const prefsToApply = urlPrefs || storedPrefs;

    if (prefsToApply) {
        const applied = applyPreferences(prefsToApply);
        // CRITICAL: Update state variables from applied preferences
        if (applied) {
            if (applied.key) selectedKey = applied.key;
            if (applied.mode) selectedMode = applied.mode;
            if (applied.progression) selectedProgression = applied.progression;
            if (applied.leftHanded !== undefined) isLeftHanded = applied.leftHanded;
        }
    }

    updateProgressionName();
    renderChordRequirements(); // Initialize chord requirements display

    // Initialize generation mode (default to template mode)
    switchGenerationMode('template');

    // Add event listeners for generation mode toggle
    document.getElementById('templateModeRadio').addEventListener('change', function() {
        if (this.checked) switchGenerationMode('template');
    });
    document.getElementById('scaleModeRadio').addEventListener('change', function() {
        if (this.checked) switchGenerationMode('scale');
    });

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
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

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
                    if (padText && padText.textContent === `PAD ${padNumber}`) {
                        const notes = pad.getAttribute('data-notes').split(',').map(Number);

                        // In staff context, play sequentially (click behavior)
                        if (currentContext === 'staff') {
                            playNotesSequentially(notes);
                            pad.classList.add('playing');
                            const totalDuration = notes.length * 333;
                            setTimeout(() => pad.classList.remove('playing'), totalDuration);
                        } else {
                            // Start sustained chord for keyboard
                            startChord(notes);
                            pad.classList.add('playing');

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
            }

            // Remove from pressed keys
            pressedKeys.delete(key);
        }
    });

    // Release all notes when window loses focus (prevent stuck notes)
    window.addEventListener('blur', () => {
        pressedKeys.forEach(({ notes, padElement }) => {
            stopChord(notes);
            if (padElement) {
                padElement.classList.remove('playing');
            }
        });
        pressedKeys.clear();
    });

    // Initialize context
    switchContext('mpc');
});
