/**
 * Lightweight i18n Module
 * Handles translation loading, switching, and interpolation
 */

class I18n {
    constructor(defaultLang = 'en') {
        this.currentLang = this.getSavedLanguage() || defaultLang;
        this.translations = {};
        this.fallbackLang = 'en';
        this.loadingPromises = {};
    }

    /**
     * Load a language file
     * @param {string} lang - Language code (e.g., 'en', 'fr')
     * @returns {Promise} - Resolves when language is loaded
     */
    async loadLanguage(lang) {
        // Return cached promise if already loading
        if (this.loadingPromises[lang]) {
            return this.loadingPromises[lang];
        }

        // Return immediately if already loaded
        if (this.translations[lang]) {
            this.currentLang = lang;
            this.saveLanguage(lang);
            return Promise.resolve();
        }

        // Load translation file
        this.loadingPromises[lang] = fetch(`./locales/${lang}.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load language: ${lang}`);
                }
                return response.json();
            })
            .then(data => {
                this.translations[lang] = data;
                this.currentLang = lang;
                this.saveLanguage(lang);
                delete this.loadingPromises[lang];
            })
            .catch(error => {
                console.error(`Error loading language ${lang}:`, error);
                delete this.loadingPromises[lang];
                throw error;
            });

        return this.loadingPromises[lang];
    }

    /**
     * Set language (load if needed and update current language)
     * @param {string} lang - Language code
     * @returns {Promise} - Resolves when language is loaded and set
     */
    async setLanguage(lang) {
        await this.loadLanguage(lang);
        this.currentLang = lang;
        this.saveLanguage(lang);
        return Promise.resolve();
    }

    /**
     * Translate a key
     * @param {string} key - Translation key (dot-notation, e.g., 'app.title')
     * @param {Object} params - Optional parameters for interpolation
     * @returns {string} - Translated string
     */
    t(key, params = {}) {
        // Try current language
        let translation = this.getNestedValue(this.translations[this.currentLang], key);

        // Fallback to default language
        if (translation === undefined && this.currentLang !== this.fallbackLang) {
            translation = this.getNestedValue(this.translations[this.fallbackLang], key);
        }

        // Return key if no translation found
        if (translation === undefined) {
            console.warn(`Translation missing for key: ${key}`);
            return key;
        }

        // Handle object returns (for structured data like mode/progression objects)
        if (typeof translation === 'object' && translation !== null) {
            return translation;
        }

        // Interpolate parameters
        return this.interpolate(translation, params);
    }

    /**
     * Get nested value from object using dot notation
     * @param {Object} obj - Object to search
     * @param {string} path - Dot-notation path
     * @returns {*} - Value at path or undefined
     */
    getNestedValue(obj, path) {
        if (!obj) return undefined;
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Replace {{param}} placeholders in string
     * @param {string} str - String with placeholders
     * @param {Object} params - Parameter values
     * @returns {string} - Interpolated string
     */
    interpolate(str, params) {
        if (typeof str !== 'string') return str;
        return str.replace(/\{\{(\w+)\}\}/g, (_, key) => params[key] ?? `{{${key}}}`);
    }

    /**
     * Get saved language from localStorage
     * @returns {string|null} - Saved language code or null
     */
    getSavedLanguage() {
        try {
            return localStorage.getItem('appLanguage');
        } catch (error) {
            console.warn('localStorage not available:', error);
            return null;
        }
    }

    /**
     * Save language to localStorage and update HTML lang attribute
     * @param {string} lang - Language code
     */
    saveLanguage(lang) {
        try {
            localStorage.setItem('appLanguage', lang);
        } catch (error) {
            console.warn('Could not save language preference:', error);
        }
        document.documentElement.lang = lang;
    }

    /**
     * Get current language
     * @returns {string} - Current language code
     */
    getCurrentLanguage() {
        return this.currentLang;
    }

    /**
     * Get list of available languages
     * @returns {Array<Object>} - Array of {code, name} objects
     */
    getAvailableLanguages() {
        return [
            { code: 'en', name: '🇬🇧 English' },
            { code: 'fr', name: '🇫🇷 Français' },
            { code: 'es', name: '🇪🇸 Español' },
            { code: 'de', name: '🇩🇪 Deutsch' },
            { code: 'pt', name: '🇧🇷 Português' },
            { code: 'it', name: '🇮🇹 Italiano' }
        ];
    }

    /**
     * Check if a language is loaded
     * @param {string} lang - Language code
     * @returns {boolean} - True if loaded
     */
    isLanguageLoaded(lang) {
        return !!this.translations[lang];
    }
}

// Create singleton instance
export const i18n = new I18n();

// Auto-detect and load browser language on first import
const browserLang = navigator.language?.split('-')[0] || 'en';
const savedLang = i18n.getSavedLanguage();
const initialLang = savedLang || (i18n.getAvailableLanguages().find(l => l.code === browserLang) ? browserLang : 'en');

// Load initial language (don't await - will load in background)
i18n.loadLanguage(initialLang).catch(error => {
    console.error('Failed to load initial language:', error);
    // Fallback to English if initial load fails
    if (initialLang !== 'en') {
        i18n.loadLanguage('en');
    }
});
