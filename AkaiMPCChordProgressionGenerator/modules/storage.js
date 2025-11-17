// Storage Module
// Handles localStorage and URL parameter persistence

const STORAGE_KEY = 'akaiMPCPreferences';

export function saveToLocalStorage(selectedKey, selectedMode, selectedProgression, isLeftHanded) {
    const preferences = {
        key: selectedKey,
        mode: selectedMode,
        progression: selectedProgression,
        leftHanded: isLeftHanded
    };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
        console.warn('Could not save to localStorage:', error);
    }
}

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

export function updateURL(selectedKey, selectedMode, selectedProgression, isLeftHanded, replaceState = true) {
    const params = new URLSearchParams();
    params.set('key', selectedKey);
    params.set('mode', selectedMode);
    params.set('progression', selectedProgression);
    if (isLeftHanded) {
        params.set('leftHanded', 'true');
    }

    const newURL = window.location.pathname + '?' + params.toString();
    if (replaceState) {
        window.history.replaceState({}, '', newURL);
    } else {
        window.history.pushState({}, '', newURL);
    }
}

export function loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    const urlPreferences = {};

    if (params.has('key')) urlPreferences.key = params.get('key');
    if (params.has('mode')) urlPreferences.mode = params.get('mode');
    if (params.has('progression')) urlPreferences.progression = params.get('progression');
    if (params.has('leftHanded')) urlPreferences.leftHanded = params.get('leftHanded') === 'true';

    return Object.keys(urlPreferences).length > 0 ? urlPreferences : null;
}

export function applyPreferences(preferences) {
    if (!preferences) return null;

    const result = {};

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

    return result;
}
