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
- English serves as the fallback language when a translation key is missing, and
  is loaded in parallel with the selected language so the fallback always works

The language selector is populated dynamically from `i18n.getAvailableLanguages()`, which reads the available locales at runtime.

## Translation Coverage

All six languages are complete: every key present in `en.json` is present and
translated in every other file. English is loaded in parallel with the selected
language, so a key added to `en.json` but not yet translated falls back to
English rather than showing a raw key path.

### Checking

```sh
node tools/check-translations.mjs
```

Run from the generator directory. It exits non-zero on any problem, and
`.github/workflows/check-translations.yml` runs it on every push and pull
request that touches the app.

It checks seven things, because the two gaps this project has actually shipped
had different causes and only one of them was a key-count mismatch:

| Check | Catches |
| --- | --- |
| Key sets match `en.json` | A language falling behind |
| No extra keys | A key added to one language only |
| No blank values | An entry emptied while editing |
| Every scale and progression in `musicTheory.js` has locale entries | A new template or scale added with no text |
| No locale entries for scales or progressions that no longer exist | A renamed template leaving its old text behind |
| Every `i18n.t('...')` in the JS resolves | Code asking for a key nobody wrote |
| Every `data-i18n="..."` in the HTML resolves | A typo in a markup binding |

Nothing is hand-listed: the expected keys are derived from `musicTheory.js` and
from the source files themselves, so the check cannot go stale as scales and
progressions are added.

Keys that no literal lookup references are reported as a note rather than a
failure, since several families are reached only through computed paths
(`chordRoles` by roman numeral, `cadences` by type). The baseline is zero, so
the note means something when it appears.

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
3. Add the language to `getAvailableLanguages()` in `modules/i18n.js` with its code and native name
4. Run `node tools/check-translations.mjs` until it passes
5. Test the translation in the app
6. Submit a pull request

For questions or clarification, open an issue on GitHub.

## File Sizes

Each language file holds 759 keys and is roughly 95 KB uncompressed,
about a quarter of that gzipped.
