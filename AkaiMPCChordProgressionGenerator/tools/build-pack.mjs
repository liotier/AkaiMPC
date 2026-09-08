#!/usr/bin/env node
/**
 * Build the published chord-progression pack.
 *
 * Run with:  node tools/build-pack.mjs
 * Writes pack/AkaiMPC-Chord-Progressions.zip, pack/AkaiMPC-Chord-MIDI.zip and
 * pack/README.txt, then exits non-zero if the result fails its own
 * consistency checks (duplicate names, a hyphen count other than one - see
 * docs/mpc-export-specification.md §5.8/§9).
 *
 * This is the one and only producer of the pack (D8 in the specification):
 * the in-app bulk-export links (index.html #bulkExport) are plain anchors
 * pointing straight at these two files, not a second implementation of this
 * logic. .github/workflows/deploy-main-production.yml runs this script
 * before publishing to GitHub Pages, so the zips are generated at deploy
 * time and never committed (D7).
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { progressions, keys, findProgressionCategory } from '../modules/musicTheory.js';
import { generateVariant, VARIANT_STYLES, getChordProgressionSignature, deduplicateVariants } from '../modules/generation.js';
import { buildMpcDisplayName, buildExportFileName } from '../modules/mpcNaming.js';
import { generateMIDIFile } from '../modules/midiExport.js';
import { buildZip } from './lib/zip.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PACK_DIR = join(ROOT, 'pack');
const PACK_KEY = 'C'; // .progression pack ships in C only - the device transposes (D3/D9)

const en = JSON.parse(readFileSync(join(ROOT, 'locales', 'en.json'), 'utf8'));

function englishNickname(category, value) {
    return en.progressions[category][value].nickname;
}

/**
 * Every surviving variant for one progression template in one key, with the
 * full set of styles that collapsed onto it (§5.2.1) attached as `.styles`.
 * Mirrors modules/generation.js's generateVariants(), but computed once here
 * so the fusion tracking and the MIDI-per-key loop can share the same pass.
 */
function variantsFor(key, progression) {
    const all = VARIANT_STYLES.map(style => generateVariant(style, { key, mode: 'Major', progression, chordRequirements: [] }));

    const stylesBySignature = new Map();
    all.forEach(variant => {
        const signature = getChordProgressionSignature(variant);
        if (!stylesBySignature.has(signature)) stylesBySignature.set(signature, []);
        stylesBySignature.get(signature).push(variant.name);
    });

    return deduplicateVariants(all).map(variant => ({
        ...variant,
        styles: stylesBySignature.get(getChordProgressionSignature(variant))
    }));
}

function progressionPayload(variant, { key, name }) {
    return {
        progression: {
            name,
            rootNote: key,
            scale: 'Major', // Progression Palette Mode always analyses against the parallel major
            recordingOctave: 2,
            chords: variant.pads.map((pad, idx) => ({
                name: pad.chordName,
                role: idx === 0 ? 'Root' : 'Normal',
                notes: pad.notes
            }))
        }
    };
}

function buildProgressionEntries() {
    const entries = [];
    for (const [category, list] of Object.entries(progressions)) {
        for (const template of list) {
            const nickname = englishNickname(category, template.value);
            for (const variant of variantsFor(PACK_KEY, template.value)) {
                const style = variant.styles.join('+');
                const namingParams = { generationMode: 'template', category, nickname, value: template.value, style };
                const fileName = buildExportFileName({ key: PACK_KEY, extension: 'progression', ...namingParams });
                const name = buildMpcDisplayName(namingParams);
                const payload = progressionPayload(variant, { key: PACK_KEY, name });

                entries.push({ name: fileName, data: Buffer.from(JSON.stringify(payload, null, 4)) });
            }
        }
    }
    return entries;
}

function buildMidiEntries() {
    const entries = [];
    for (const key of keys) {
        const keyName = key.split('/')[0];
        for (const [category, list] of Object.entries(progressions)) {
            for (const template of list) {
                const nickname = englishNickname(category, template.value);
                for (const variant of variantsFor(key, template.value)) {
                    const style = variant.styles.join('+');
                    const namingParams = { generationMode: 'template', category, nickname, value: template.value, style };
                    // buildExportFileName() appends '.mid'; generateMIDIFile() also
                    // uses the name as the embedded track name, so strip the
                    // extension back off before either use (matches app.js).
                    const fileName = buildExportFileName({ key, extension: 'mid', ...namingParams }).replace(/\.mid$/, '');

                    const chords = variant.pads.map(pad => ({ name: pad.chordName, notes: pad.notes }));
                    const progressionChordIndices = variant.pads
                        .map((pad, idx) => (pad.isProgressionChord ? idx : null))
                        .filter(idx => idx !== null);
                    const midiData = generateMIDIFile(chords, fileName, progressionChordIndices);

                    entries.push({ name: `${keyName}/${fileName}.mid`, data: Buffer.from(midiData) });
                }
            }
        }
    }
    return entries;
}

function verifyProgressionEntries(entries) {
    const problems = [];
    const names = new Map();
    const files = new Map();

    for (const { name: fileName, data } of entries) {
        const payload = JSON.parse(data.toString('utf8'));
        const displayName = payload.progression.name;

        names.set(displayName, (names.get(displayName) || 0) + 1);
        files.set(fileName, (files.get(fileName) || 0) + 1);

        const hyphenCount = (displayName.match(/-/g) || []).length;
        if (hyphenCount !== 1) problems.push(`display name has ${hyphenCount} hyphens, not 1: ${JSON.stringify(displayName)}`);
    }

    for (const [name, count] of names) if (count > 1) problems.push(`duplicate display name (${count}x): ${JSON.stringify(name)}`);
    for (const [name, count] of files) if (count > 1) problems.push(`duplicate file name (${count}x): ${JSON.stringify(name)}`);

    return problems;
}

function writeReadme(progressionCount, midiCount) {
    const text = `AkaiMPC Chord Progression Pack
===============================

Every progression this generator can build, pre-exported so you don't have
to click through them one at a time.

AkaiMPC-Chord-Progressions.zip
  ${progressionCount} .progression files, key of C, flat (no subfolders - the
  MPC reads a flat Progressions folder). Copy the contents into a folder
  named "Progressions" at the root of your MPC's storage.

  Changing the progression's key in Pad Perform > Progressions transposes
  the whole custom progression while preserving its chord intervals and
  voicings - the same as the MPC's own factory progressions - which is why
  this pack ships C only rather than twelve near-identical copies.

AkaiMPC-Chord-MIDI.zip
  ${midiCount} .mid files, one folder per key (a DAW does not transpose on
  import the way the MPC does, so all twelve keys are included here).

A note on the menu names: the MPC splits each progression's name on its
first hyphen, using the part before it as the main menu heading and the
rest as the submenu entry. Every name in this pack is built to that rule -
see the naming specification in this project's repository
(docs/mpc-export-specification.md) for the full grammar, and for what is
still unverified on hardware other than the MPC XL this was designed
against. If several hundred files slow your MPC's boot, prune the
Progressions folder down to the genres you actually use - the file names
are grouped by genre, so this is a matter of deleting by pattern.

The naming scheme this pack follows is Elektrobolt's, arrived at
empirically on the MPC-Forums "Thoughts on the MPC XL" thread by
relabelling several hundred files by hand until the MPC's menu made sense.
Thank you.

Generated by AkaiMPC Chord Progression Generator
https://liotier.github.io/AkaiMPC/AkaiMPCChordProgressionGenerator/
`;
    writeFileSync(join(PACK_DIR, 'README.txt'), text);
}

function main() {
    mkdirSync(PACK_DIR, { recursive: true });

    console.log('Generating .progression entries (key of C)...');
    const progressionEntries = buildProgressionEntries();

    console.log('Checking naming invariants...');
    const problems = verifyProgressionEntries(progressionEntries);
    if (problems.length > 0) {
        console.error(`${problems.length} problem(s) found:`);
        problems.slice(0, 20).forEach(p => console.error('  ' + p));
        process.exit(1);
    }

    console.log('Generating MIDI entries (all twelve keys)...');
    const midiEntries = buildMidiEntries();

    console.log(`Writing AkaiMPC-Chord-Progressions.zip (${progressionEntries.length} files)...`);
    writeFileSync(join(PACK_DIR, 'AkaiMPC-Chord-Progressions.zip'), buildZip(progressionEntries));

    console.log(`Writing AkaiMPC-Chord-MIDI.zip (${midiEntries.length} files)...`);
    writeFileSync(join(PACK_DIR, 'AkaiMPC-Chord-MIDI.zip'), buildZip(midiEntries));

    writeReadme(progressionEntries.length, midiEntries.length);

    console.log(`Done: ${progressionEntries.length} .progression files, ${midiEntries.length} MIDI files.`);
}

main();
