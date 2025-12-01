# Translation Files

This directory contains translation files for the MPC Chord Progression Generator.

## Available Languages

- `en.json` - English (source language)
- `fr.json` - French (Français)

## Translation Guidelines

### Musical Terminology

Use standard musical terms in the target language:

**French:**
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
  "ui": {
    "buttons": {
      "generate": "Button text"
    }
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
3. Test the translation in the app
4. Submit a pull request

For questions or clarification, open an issue on GitHub.

## File Sizes

- English: ~50KB
- French: ~50KB (estimated)
- Gzipped: ~15KB per language
