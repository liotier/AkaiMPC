// Storage Module
// Handles localStorage and URL parameter persistence

import { keys, modes, progressions } from './musicTheory.js';

const STORAGE_KEY = 'akaiMPCPreferences';

// Preferences arrive from the query string and from localStorage, i.e. from
// anyone who can hand the user a link. They end up in the rendered page and in
// exported file names, so only values the app actually offers are accepted -
// anything else is dropped and the default kept.
const VALID_KEYS = new Set(keys);
const VALID_MODES = new Set(Object.values(modes).flat());
const VALID_PROGRESSIONS = new Set(
    Object.values(progressions).flat().map(progression => progression.value)
);
const VALID_CONTEXTS = new Set(['mpc', 'keyboard', 'guitar', 'staff', 'midi']);
const VALID_GENERATION_MODES = new Set(['template', 'scale']);

/**
 * Keep only preference fields whose values the app recognises.
 *
 * @param {Object|null} preferences - Untrusted preferences
 * @returns {Object|null} Preferences containing only valid fields, or null if none survive
 */
function sanitizePreferences(preferences) {
    if (!preferences || typeof preferences !== 'object') return null;

    const clean = {};
    if (VALID_KEYS.has(preferences.key)) clean.key = preferences.key;
    if (VALID_MODES.has(preferences.mode)) clean.mode = preferences.mode;
    if (VALID_PROGRESSIONS.has(preferences.progression)) clean.progression = preferences.progression;
    // A genre is kept only alongside a progression that genre actually lists.
    // hasOwnProperty, not `in`: 'constructor' or '__proto__' must not pass.
    if (clean.progression && typeof preferences.genre === 'string' &&
        Object.prototype.hasOwnProperty.call(progressions, preferences.genre) &&
        progressions[preferences.genre].some(progression => progression.value === clean.progression)) {
        clean.genre = preferences.genre;
    }
    if (typeof preferences.leftHanded === 'boolean') clean.leftHanded = preferences.leftHanded;
    if (VALID_CONTEXTS.has(preferences.context)) clean.context = preferences.context;
    if (VALID_GENERATION_MODES.has(preferences.generationMode)) clean.generationMode = preferences.generationMode;

    return Object.keys(clean).length > 0 ? clean : null;
}

/**
 * Save user preferences to localStorage
 * @param {string} selectedKey - Selected musical key
 * @param {string} selectedMode - Selected mode/scale
 * @param {string} selectedProgression - Selected progression pattern
 * @param {boolean} isLeftHanded - Left-handed guitar mode
 * @param {string} context - Current view context (optional)
 * @param {string} generationMode - Generation mode ('template' or 'scale')
 * @param {string} genre - Genre the progression was chosen under (optional)
 * @returns {boolean} True if save successful, false otherwise
 */
export function saveToLocalStorage(selectedKey, selectedMode, selectedProgression, isLeftHanded, context = null, generationMode = null, genre = null) {
    const preferences = {
        key: selectedKey,
        mode: selectedMode,
        progression: selectedProgression,
        leftHanded: isLeftHanded
    };

    // Add context if provided
    if (context) {
        preferences.context = context;
    }

    // Add generation mode if provided
    if (generationMode) {
        preferences.generationMode = generationMode;
    }

    // The same progression can be listed under several genres; remember which
    if (genre) {
        preferences.genre = genre;
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
        return true;
    } catch (error) {
        // Handle quota exceeded or other localStorage errors
        if (error.name === 'QuotaExceededError') {
            console.error('localStorage quota exceeded');
        } else {
            console.warn('Could not save to localStorage:', error);
        }
        return false;
    }
}

/**
 * Load user preferences from localStorage
 * @returns {Object|null} Preferences object or null if not found/error
 */
export function loadFromLocalStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return sanitizePreferences(JSON.parse(stored));
        }
    } catch (error) {
        console.warn('Could not load from localStorage:', error);
    }
    return null;
}

/**
 * Update browser URL with current preferences
 * @param {string} selectedKey - Selected musical key
 * @param {string} selectedMode - Selected mode/scale
 * @param {string} selectedProgression - Selected progression pattern
 * @param {boolean} isLeftHanded - Left-handed guitar mode
 * @param {string} genre - Genre the progression was chosen under (optional)
 * @param {boolean} replaceState - Use replaceState instead of pushState
 */
export function updateURL(selectedKey, selectedMode, selectedProgression, isLeftHanded, genre = null, replaceState = true) {
    try {
        const params = new URLSearchParams();
        params.set('key', selectedKey);
        params.set('mode', selectedMode);
        params.set('progression', selectedProgression);
        if (genre) {
            params.set('genre', genre);
        }
        if (isLeftHanded) {
            params.set('leftHanded', 'true');
        }

        const newURL = globalThis.location.pathname + '?' + params.toString();
        if (replaceState) {
            globalThis.history.replaceState({}, '', newURL);
        } else {
            globalThis.history.pushState({}, '', newURL);
        }
    } catch (error) {
        console.warn('Could not update URL:', error);
    }
}

/**
 * Load preferences from URL parameters
 * @returns {Object|null} Preferences object or null if no params
 */
export function loadFromURL() {
    try {
        const params = new URLSearchParams(globalThis.location.search);
        const urlPreferences = {};

        if (params.has('key')) urlPreferences.key = params.get('key');
        if (params.has('mode')) urlPreferences.mode = params.get('mode');
        if (params.has('progression')) urlPreferences.progression = params.get('progression');
        if (params.has('genre')) urlPreferences.genre = params.get('genre');
        if (params.has('leftHanded')) urlPreferences.leftHanded = params.get('leftHanded') === 'true';

        return sanitizePreferences(urlPreferences);
    } catch (error) {
        console.warn('Could not load from URL:', error);
        return null;
    }
}

/**
 * Select the dropdown entry for a progression chosen under a genre.
 *
 * The same value can be listed under several genres, so assigning
 * `select.value` always lands on the first genre's entry. Prefer the option
 * whose data-category matches; fall back to the first option with the value,
 * which is what an old URL or stored preference without a genre always got
 * (docs/improvements/01-template-identity.md, D3).
 *
 * @param {HTMLSelectElement} select - The progression dropdown
 * @param {string} value - Progression value
 * @param {string|null} genre - Genre the progression was chosen under
 * @returns {string|null} Genre of the option now selected, or null if none matched
 */
export function selectProgressionOption(select, value, genre = null) {
    const options = Array.from(select.options);
    const match = options.find(option => option.value === value && option.dataset.category === genre)
        || options.find(option => option.value === value);
    if (!match) return null;
    select.selectedIndex = options.indexOf(match);
    return match.dataset.category || null;
}

/**
 * Apply preferences to UI elements
 * @param {Object} preferences - Preferences object
 * @returns {Object|null} Applied preferences or null
 */
export function applyPreferences(preferences) {
    if (!preferences) return null;

    const result = {};

    try {
        if (preferences.key) {
            result.key = preferences.key;
            const keySelect = document.getElementById('keySelect');
            if (keySelect) keySelect.value = preferences.key;
        }

        if (preferences.mode) {
            result.mode = preferences.mode;
            const modeSelect = document.getElementById('modeSelect');
            if (modeSelect) modeSelect.value = preferences.mode;
        }

        if (preferences.progression) {
            result.progression = preferences.progression;
            if (preferences.genre) result.genre = preferences.genre;
            const progressionSelect = document.getElementById('progressionSelect');
            if (progressionSelect) selectProgressionOption(progressionSelect, preferences.progression, preferences.genre);
        }

        if (preferences.leftHanded !== undefined) {
            result.leftHanded = preferences.leftHanded;
            const leftHandedCheckbox = document.getElementById('leftHandedCheckbox');
            if (leftHandedCheckbox) leftHandedCheckbox.checked = preferences.leftHanded;
        }

        // Context is handled separately in app.js via switchContext()
        if (preferences.context) {
            result.context = preferences.context;
        }

        // Generation mode is handled separately via switchGenerationMode()
        if (preferences.generationMode) {
            result.generationMode = preferences.generationMode;
        }

        return result;
    } catch (error) {
        console.warn('Error applying preferences:', error);
        return null;
    }
}
