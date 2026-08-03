#!/usr/bin/env node
/**
 * Translation integrity check.
 *
 * Run with:  node tools/check-translations.mjs
 * Exits non-zero on any problem, so it can gate a commit or a CI job.
 *
 * Two different gaps have bitten this project, and they need two different
 * checks:
 *
 *  1. The locale files drifted apart - 79 keys existed in en.json and in no
 *     other language. A key-set comparison catches that.
 *
 *  2. musicTheory.js and the locale files disagreed about what exists. The
 *     12-bar blues template was renamed to '12-bar-blues' but its locale entry
 *     kept the old spelled-out key, and a whole progression category was added
 *     with no locale entries at all. Every language was equally wrong, so a
 *     key-set comparison saw nothing. Cross-checking the locale files against
 *     the actual data catches that.
 *
 * Everything below is derived, never hand-listed, so the check cannot go stale
 * as scales and progressions are added.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES_DIR = join(ROOT, 'locales');
const SOURCE_LANG = 'en';

const problems = [];
const notes = [];
const fail = (message) => problems.push(message);

// ---------------------------------------------------------------------------
// Load
// ---------------------------------------------------------------------------

const localeFiles = readdirSync(LOCALES_DIR)
    .filter(name => name.endsWith('.json'))
    .sort();

const locales = {};
for (const file of localeFiles) {
    const code = basename(file, '.json');
    try {
        locales[code] = JSON.parse(readFileSync(join(LOCALES_DIR, file), 'utf8'));
    } catch (error) {
        fail(`${file}: not valid JSON - ${error.message}`);
    }
}

if (!locales[SOURCE_LANG]) {
    console.error(`FATAL: locales/${SOURCE_LANG}.json is missing or unreadable.`);
    process.exit(1);
}

const { modes, progressions } = await import(pathToFileURL(join(ROOT, 'modules', 'musicTheory.js')));

/** Flatten nested objects to dotted paths -> leaf value. */
function flatten(value, prefix = '', out = {}) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        for (const [key, child] of Object.entries(value)) {
            flatten(child, prefix ? `${prefix}.${key}` : key, out);
        }
    } else {
        out[prefix] = value;
    }
    return out;
}

const flat = Object.fromEntries(
    Object.entries(locales).map(([code, data]) => [code, flatten(data)])
);
const sourceKeys = new Set(Object.keys(flat[SOURCE_LANG]));

/** Does a dotted path exist in the source language? */
const inSource = (key) => sourceKeys.has(key);

// ---------------------------------------------------------------------------
// 1. Every language carries exactly the source language's keys
// ---------------------------------------------------------------------------

for (const [code, keyed] of Object.entries(flat)) {
    if (code === SOURCE_LANG) continue;
    const keys = new Set(Object.keys(keyed));

    const missing = [...sourceKeys].filter(key => !keys.has(key)).sort();
    const extra = [...keys].filter(key => !sourceKeys.has(key)).sort();

    if (missing.length) {
        fail(`${code}.json is missing ${missing.length} key(s) present in ${SOURCE_LANG}.json:\n` +
             missing.map(key => `      ${key}`).join('\n'));
    }
    if (extra.length) {
        fail(`${code}.json has ${extra.length} key(s) that ${SOURCE_LANG}.json does not:\n` +
             extra.map(key => `      ${key}`).join('\n'));
    }
}

// ---------------------------------------------------------------------------
// 2. No blank values in any language
// ---------------------------------------------------------------------------

for (const [code, keyed] of Object.entries(flat)) {
    const blank = Object.entries(keyed)
        .filter(([, value]) => typeof value !== 'string' || value.trim() === '')
        .map(([key]) => key)
        .sort();
    if (blank.length) {
        fail(`${code}.json has ${blank.length} blank or non-string value(s):\n` +
             blank.map(key => `      ${key}`).join('\n'));
    }
}

// ---------------------------------------------------------------------------
// 3. Everything musicTheory.js offers has locale entries, and nothing else does
// ---------------------------------------------------------------------------

const expected = new Set();
const expectedPrefixes = [];

for (const category of Object.keys(modes)) {
    expected.add(`modeCategories.${category}`);
}
for (const mode of Object.values(modes).flat()) {
    expected.add(`modes.${mode}.name`);
    expected.add(`modes.${mode}.description`);
    expectedPrefixes.push(`modes.${mode}.`);
}
for (const [category, list] of Object.entries(progressions)) {
    expected.add(`progressionCategories.${category}`);
    for (const template of list) {
        for (const field of ['name', 'nickname', 'description']) {
            expected.add(`progressions.${category}.${template.value}.${field}`);
        }
        expectedPrefixes.push(`progressions.${category}.${template.value}.`);
    }
}

const missingForData = [...expected].filter(key => !inSource(key)).sort();
if (missingForData.length) {
    fail(`${SOURCE_LANG}.json has no entry for ${missingForData.length} item(s) that musicTheory.js offers:\n` +
         missingForData.map(key => `      ${key}`).join('\n'));
}

// Locale entries for scales or progressions that no longer exist. This is how
// a renamed template leaves its old text behind while the new name shows a raw
// value in the dropdown.
const stale = [...sourceKeys]
    .filter(key => key.startsWith('modes.') || key.startsWith('progressions.'))
    .filter(key => !expected.has(key) && !expectedPrefixes.some(prefix => key.startsWith(prefix)))
    .sort();
if (stale.length) {
    fail(`${SOURCE_LANG}.json describes ${stale.length} scale(s)/progression(s) that musicTheory.js no longer offers:\n` +
         stale.map(key => `      ${key}`).join('\n'));
}

const staleCategories = [...sourceKeys]
    .filter(key => key.startsWith('modeCategories.') || key.startsWith('progressionCategories.'))
    .filter(key => !expected.has(key))
    .sort();
if (staleCategories.length) {
    fail(`${SOURCE_LANG}.json names ${staleCategories.length} category/categories that musicTheory.js no longer offers:\n` +
         staleCategories.map(key => `      ${key}`).join('\n'));
}

// ---------------------------------------------------------------------------
// 4. Keys the code asks for by name exist
// ---------------------------------------------------------------------------

function collectSources(dir) {
    const found = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
        const full = join(dir, entry.name);
        if (entry.isDirectory()) found.push(...collectSources(full));
        else if (/\.(js|mjs|html)$/.test(entry.name)) found.push(full);
    }
    return found;
}

// Keys assembled from template literals are validated by check 3 instead,
// since their shape comes from musicTheory.js.
const LITERAL_CALL = /\bi18n\.(?:t|has)\(\s*(['"])([^'"`$]+)\1/g;
const DATA_I18N = /data-i18n\s*=\s*"([^"]+)"/g;
// A key can also reach i18n.t() through a variable, so treat any quoted string
// that exactly matches a known key as a reference
const ANY_LITERAL = /(['"`])([A-Za-z][\w/#♭♯-]*(?:\.[\w/#♭♯ -]+)+)\1/g;

const referenced = new Map(); // key -> Set of files

for (const file of collectSources(ROOT)) {
    if (file.startsWith(join(ROOT, 'tools'))) continue;
    const text = readFileSync(file, 'utf8');
    const label = file.slice(ROOT.length + 1);
    const record = (key) => {
        if (!referenced.has(key)) referenced.set(key, new Set());
        referenced.get(key).add(label);
    };

    for (const [pattern, group] of [[LITERAL_CALL, 2], [DATA_I18N, 1]]) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(text)) !== null) record(match[group]);
    }

    ANY_LITERAL.lastIndex = 0;
    let match;
    while ((match = ANY_LITERAL.exec(text)) !== null) {
        if (inSource(match[2])) record(match[2]);
    }
}

const unresolved = [...referenced.entries()]
    .filter(([key]) => !inSource(key))
    .sort(([a], [b]) => a.localeCompare(b));
if (unresolved.length) {
    fail(`The code asks for ${unresolved.length} key(s) that ${SOURCE_LANG}.json does not define:\n` +
         unresolved.map(([key, files]) => `      ${key}   (${[...files].join(', ')})`).join('\n'));
}

// Unused keys are reported but do not fail: several families are reached only
// through computed paths (chordRoles by roman numeral, cadences by type).
const DYNAMIC_PREFIXES = ['modes.', 'modeCategories.', 'progressions.', 'progressionCategories.',
                          'chordRoles.', 'cadences.', 'variants.', 'chordMatcher.qualities.'];
const unused = [...sourceKeys]
    .filter(key => !referenced.has(key))
    .filter(key => !DYNAMIC_PREFIXES.some(prefix => key.startsWith(prefix)))
    .sort();
if (unused.length) {
    notes.push(`${unused.length} key(s) in ${SOURCE_LANG}.json are not referenced by any literal lookup:\n` +
               unused.map(key => `      ${key}`).join('\n'));
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const languages = Object.keys(locales).sort();
console.log(`Checked ${languages.length} language(s) [${languages.join(', ')}], ` +
            `${sourceKeys.size} keys each, against ` +
            `${Object.values(modes).flat().length} scales and ` +
            `${Object.values(progressions).flat().length} progressions.`);

for (const note of notes) {
    console.log(`\nnote: ${note}`);
}

if (problems.length === 0) {
    console.log('\nTranslations are complete and consistent.');
    process.exit(0);
}

console.error(`\n${problems.length} problem(s) found:\n`);
for (const problem of problems) {
    console.error(`  - ${problem}`);
}
process.exit(1);
