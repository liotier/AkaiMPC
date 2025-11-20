// Storage Module
// Handles localStorage and URL parameter persistence

const STORAGE_KEY = 'akaiMPCPreferences';

/**
 * Save user preferences to localStorage
 * @param {string} selectedKey - Selected musical key
 * @param {string} selectedMode - Selected mode/scale
 * @param {string} selectedProgression - Selected progression pattern
 * @param {boolean} isLeftHanded - Left-handed guitar mode
 * @param {string} context - Current view context (optional)
 * @returns {boolean} True if save successful, false otherwise
 */
export function saveToLocalStorage(selectedKey, selectedMode, selectedProgression, isLeftHanded, context = null) {
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
            return JSON.parse(stored);
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
 * @param {boolean} replaceState - Use replaceState instead of pushState
 */
export function updateURL(selectedKey, selectedMode, selectedProgression, isLeftHanded, replaceState = true) {
    try {
        const params = new URLSearchParams();
        params.set('key', selectedKey);
        params.set('mode', selectedMode);
        params.set('progression', selectedProgression);
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
        if (params.has('leftHanded')) urlPreferences.leftHanded = params.get('leftHanded') === 'true';

        return Object.keys(urlPreferences).length > 0 ? urlPreferences : null;
    } catch (error) {
        console.warn('Could not load from URL:', error);
        return null;
    }
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
            const progressionSelect = document.getElementById('progressionSelect');
            if (progressionSelect) progressionSelect.value = preferences.progression;
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

        return result;
    } catch (error) {
        console.warn('Error applying preferences:', error);
        return null;
    }
}
