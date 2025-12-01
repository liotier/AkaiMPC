# Internationalization (i18n) Strategy

## Overview
Implement comprehensive internationalization for the Akai MPC Chord Progression Generator with French as the first target translation, establishing a scalable framework for future languages.

## Scope of Translation

### 1. **UI Text (HTML)** (~50 strings)
- Headers and titles
- Button labels
- Form labels
- Placeholder text
- Footer text
- Error messages
- Tab labels

### 2. **Pedagogical Content** (~170 descriptions)
- 133 progression palette descriptions
- 37 scale mode descriptions
- Chord matcher instructions
- Tooltips

### 3. **Dynamic Content (JavaScript)**
- Generated error messages
- Status messages
- Validation messages
- MIDI output labels

## Architecture

### **Option A: Lightweight Custom Solution** ✅ RECOMMENDED
**Pros:**
- No external dependencies
- Full control
- Minimal overhead (~20KB for French translations)
- Easy to maintain

**Cons:**
- Manual implementation
- No pluralization library (not needed for this app)

**Structure:**
```
/locales
  /en.json          # English (source)
  /fr.json          # French
  /de.json          # German (future)
  /es.json          # Spanish (future)
  /ja.json          # Japanese (future)
```

### **Option B: i18next Library**
**Pros:**
- Industry standard
- Built-in features (pluralization, interpolation)
- Good tooling

**Cons:**
- 70KB+ additional bundle size
- Over-engineered for this use case
- External dependency

**Decision: Choose Option A** - The app is small, content is static, and we don't need advanced features.

## Implementation Plan

### **Phase 1: Infrastructure** (1-2 hours)

#### 1.1 Create Translation Files
```json
// locales/en.json
{
  "app": {
    "title": "MPC Chord Progression Generator",
    "subtitle": "Create musically intelligent chord progressions...",
    "generate": "Generate Progressions"
  },
  "chordMatcher": {
    "title": "Chord Matcher",
    "description": "Found a sample with great chords?...",
    "addChord": "Add Chord",
    "clearAll": "Clear All"
  },
  "modes": {
    "Major": {
      "name": "Major",
      "description": "The foundational scale of Western music..."
    }
  },
  "progressions": {
    "Pop/Rock": {
      "I—V—vi—IV": {
        "name": "I—V—vi—IV",
        "nickname": "Axis of Awesome",
        "description": "The most popular progression in modern pop..."
      }
    }
  }
}
```

#### 1.2 Create i18n Module
```javascript
// modules/i18n.js
class I18n {
  constructor(defaultLang = 'en') {
    this.currentLang = this.getSavedLanguage() || defaultLang;
    this.translations = {};
    this.fallbackLang = 'en';
  }

  async loadLanguage(lang) {
    const response = await fetch(`./locales/${lang}.json`);
    this.translations[lang] = await response.json();
    this.currentLang = lang;
    this.saveLanguage(lang);
  }

  t(key, params = {}) {
    // Get translation with fallback
    const translation = this.getNestedValue(this.translations[this.currentLang], key)
                     || this.getNestedValue(this.translations[this.fallbackLang], key)
                     || key;

    // Replace parameters {{param}}
    return this.interpolate(translation, params);
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  interpolate(str, params) {
    return str.replace(/\{\{(\w+)\}\}/g, (_, key) => params[key] || '');
  }

  getSavedLanguage() {
    return localStorage.getItem('appLanguage');
  }

  saveLanguage(lang) {
    localStorage.setItem('appLanguage', lang);
    document.documentElement.lang = lang;
  }

  getCurrentLanguage() {
    return this.currentLang;
  }

  getAvailableLanguages() {
    return ['en', 'fr']; // Expand as we add languages
  }
}

export const i18n = new I18n();
```

#### 1.3 Language Switcher UI
Add to HTML header:
```html
<div class="language-switcher">
  <select id="languageSelect">
    <option value="en">English</option>
    <option value="fr">Français</option>
  </select>
</div>
```

### **Phase 2: Extract & Translate** (8-12 hours)

#### 2.1 Extract All Strings
Run through entire codebase and extract:
- HTML text content → `en.json`
- JavaScript string literals → `en.json`
- Progression descriptions → `en.json:progressions`
- Mode descriptions → `en.json:modes`

#### 2.2 Professional French Translation
Priority order:
1. **UI strings** (critical for usability)
2. **Common Western modes** (Major, Minor, Dorian, etc.)
3. **Popular progressions** (Pop/Rock, Blues, Jazz)
4. **Exotic modes & niche progressions**

**Translation considerations:**
- Musical terminology has standard French equivalents
- Maintain technical accuracy
- Preserve markdown formatting in descriptions
- Keep chord symbols unchanged (I—V—vi—IV)
- Adapt cultural references appropriately

### **Phase 3: Implementation** (4-6 hours)

#### 3.1 Update HTML
```html
<!-- Before -->
<h1>MPC Chord Progression Generator</h1>

<!-- After -->
<h1 data-i18n="app.title">MPC Chord Progression Generator</h1>
```

#### 3.2 Update JavaScript
```javascript
// Before
alert('Please select a key');

// After
alert(i18n.t('errors.selectKey'));
```

#### 3.3 Update Dynamic Content
```javascript
// Before
option.title = prog.description;

// After
option.title = i18n.t(`progressions.${category}.${prog.value}.description`);
```

#### 3.4 Add Translation Helper
```javascript
function updatePageLanguage() {
  // Update all [data-i18n] elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = i18n.t(key);
  });

  // Update all [data-i18n-placeholder] elements
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = i18n.t(key);
  });

  // Regenerate dropdowns with new translations
  populateDropdowns();
}
```

### **Phase 4: Testing** (2-3 hours)

#### 4.1 Test Coverage
- [ ] All UI text translates correctly
- [ ] Dropdowns show translated content
- [ ] Tooltips display in selected language
- [ ] Language persists across sessions
- [ ] Fallback works for missing translations
- [ ] Generated files still work correctly
- [ ] No layout breaking with longer French text

#### 4.2 Browser Testing
- Chrome, Firefox, Safari, Edge
- Mobile responsiveness with translated text
- Special characters render correctly (é, è, à, ç)

## Translation Guidelines

### Musical Terminology
```javascript
// English → French standard terms
"Major" → "Majeur"
"Minor" → "Mineur"
"Dominant" → "Dominante"
"Tonic" → "Tonique"
"Subdominant" → "Sous-dominante"
"Scale" → "Gamme"
"Mode" → "Mode"
"Progression" → "Progression"
"Chord" → "Accord"
"Cadence" → "Cadence"
"Resolution" → "Résolution"
```

### Chord Symbols (Keep in Roman Numerals)
- `I—V—vi—IV` stays as is
- `ii—V—I` stays as is
- Technical symbols are universal

### Cultural Adaptations
```javascript
// English
"Used in hundreds of hits from 'Let It Be' to 'Don't Stop Believin'."

// French
"Utilisé dans des centaines de succès, de « Let It Be » à « Don't Stop Believin' »."
// Note: French uses « » for quotes, song titles stay in original
```

## File Structure

```
AkaiMPCChordProgressionGenerator/
├── locales/
│   ├── en.json              # English (source, ~50KB)
│   ├── fr.json              # French (~50KB)
│   └── README.md            # Translation guide
├── modules/
│   ├── i18n.js              # i18n module (~3KB)
│   └── musicTheory.js       # Remove descriptions (moved to locales)
├── index.html               # Add data-i18n attributes
└── app.js                   # Integrate i18n calls
```

## Performance Considerations

### Bundle Size Impact
- **Current**: ~150KB total (HTML + JS + CSS)
- **With i18n infrastructure**: ~153KB (+3KB for i18n.js)
- **Per language**: +50KB (loaded on demand)
- **Total for bilingual user**: ~203KB

### Loading Strategy
1. Load default language on app init
2. Switch languages on demand (fetch new JSON)
3. Cache translations in memory
4. Use localStorage for language preference

### Optimization
- Minify JSON translation files
- Use gzip compression (reduces 50KB → ~15KB)
- Lazy load less common language translations

## Future Expansion

### Additional Languages (Priority Order)
1. ✅ **French** (First target - musical tradition)
2. **German** (Strong music education market)
3. **Spanish** (Large user base)
4. **Japanese** (Electronic music production)
5. **Portuguese** (Brazil - large music market)
6. **Italian** (Musical terminology origins)
7. **Russian** (Growing market)
8. **Arabic** (Maqam descriptions already in place)

### RTL Support (Future)
For Arabic, Hebrew:
- Add `dir="rtl"` handling
- Mirror UI layout
- Keep musical notation LTR

### Community Contributions
- Create translation template
- Setup GitHub workflow for PR reviews
- Translation validation script
- Contributor guidelines

## Implementation Timeline

| Phase | Task | Estimated Time |
|-------|------|----------------|
| 1 | Create i18n infrastructure | 2 hours |
| 2 | Extract all English strings | 3 hours |
| 3 | French translation of UI | 2 hours |
| 4 | French translation of modes (37) | 3 hours |
| 5 | French translation of progressions (133) | 6 hours |
| 6 | Integrate i18n into codebase | 4 hours |
| 7 | Testing and refinement | 3 hours |
| **Total** | | **23 hours** |

## Deliverables

1. ✅ `modules/i18n.js` - Translation module
2. ✅ `locales/en.json` - English source
3. ✅ `locales/fr.json` - French translation
4. ✅ Language switcher UI
5. ✅ Updated HTML with data-i18n attributes
6. ✅ Updated app.js with i18n integration
7. ✅ Translation guide for contributors
8. ✅ Test suite for i18n

## Success Metrics

- [ ] 100% of UI strings translatable
- [ ] Zero hardcoded strings in HTML/JS
- [ ] Language persists across sessions
- [ ] Sub-second language switching
- [ ] No layout breaks in French
- [ ] All tooltips working in both languages
- [ ] Professional quality translations

## Notes

- **Maintain musical accuracy**: Work with French-speaking musicians for review
- **Keep symbols universal**: Chord symbols, Roman numerals unchanged
- **Preserve formatting**: Markdown in descriptions must survive translation
- **Test with native speakers**: Ensure natural phrasing
- **Document conventions**: Create style guide for future translators
