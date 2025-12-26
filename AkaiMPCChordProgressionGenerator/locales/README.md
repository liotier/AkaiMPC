# Translation Files

This directory contains translation files for the MPC Chord Progression Generator.

## Available Languages

- `en.json` - English (source/fallback language)
- `fr.json` - French (Français)
- `es.json` - Spanish (Español)
- `de.json` - German (Deutsch)
- `pt.json` - Portuguese (Português)
- `it.json` - Italian (Italiano)

## Architecture

The application uses a fully i18n-orthodox approach:
- All user-visible text comes from locale files
- `musicTheory.js` contains only structural data (chord formulas, scale intervals, etc.)
- English serves as the fallback language when a translation key is missing

The language selector is populated dynamically from `i18n.getAvailableLanguages()`, which reads the available locales at runtime.

## Translation Guidelines

### Musical Terminology

Use standard musical terms in the target language. Examples for French:
```json
"Major" → "Majeur"
"Minor" → "Mineur"
"Dominant" → "Dominante"
"Tonic" → "Tonique"
"Subdominant" → "Sous-dominante"
"Scale" → "Gamme"
"Mode" → "Mode"
"Chord" → "Accord"
"Progression" → "Progression"
"Cadence" → "Cadence"
```

### What NOT to Translate

1. **Chord Symbols**: Keep Roman numerals unchanged
   - `I—V—vi—IV` stays as is
   - `ii—V—I` stays as is

2. **Mode Names**: Most are international
   - `Dorian`, `Phrygian`, `Lydian` stay unchanged
   - `Major` → `Majeur`, `Minor` → `Mineur`

3. **Musical Examples**: Keep song titles in original language
   - "Let It Be" stays "Let It Be"
   - Use proper quotation marks for target language (« » for French)

4. **Composer/Artist Names**: Always keep original
   - "Miles Davis" stays "Miles Davis"

### File Structure

Each JSON file has the following structure:

```json
{
  "app": {
    "title": "Application title",
    "subtitle": "Subtitle text"
  },
  "controls": {
    "labels": { ... },
    "generationMode": { ... }
  },
  "modes": {
    "Major": {
      "name": "Display name",
      "description": "Pedagogical description..."
    }
  },
  "progressions": {
    "Pop/Rock": {
      "I—V—vi—IV": {
        "name": "Roman numeral progression",
        "nickname": "Common name",
        "description": "Pedagogical description..."
      }
    }
  }
}
```

### Quality Standards

1. **Accuracy**: Maintain musical theory accuracy
2. **Naturalness**: Use natural, fluent language
3. **Consistency**: Use consistent terminology throughout
4. **Formatting**: Preserve markdown formatting in descriptions
5. **Length**: Keep translations reasonably similar in length to avoid UI breaking

### Contributing Translations

To add a new language:

1. Copy `en.json` to `{language-code}.json`
2. Translate all values (not keys)
3. Add the language to `i18n.js` in the `languages` array with its code and native name
4. Test the translation in the app
5. Submit a pull request

For questions or clarification, open an issue on GitHub.

## File Sizes

Each language file is approximately:
- Uncompressed: ~55KB
- Gzipped: ~15KB
