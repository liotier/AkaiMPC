// A minimal, deterministic ZIP writer, built on nothing but Node's own zlib.
//
// The project has no npm dependency anywhere - check-translations.mjs runs
// under bare `node`, no package.json, no install step in CI. JSZip is loaded
// in the browser from a CDN for the client-side export paths; pulling it (or
// any archiver) into the Node-side build would be the first dependency this
// project has ever needed, for a format simple enough not to justify one.
//
// "Deterministic" is not a nicety here: docs/mpc-export-specification.md §9
// requires two consecutive builds to be byte-identical, so every timestamp
// this writer would otherwise embed is pinned to a fixed constant instead.

import zlib from 'node:zlib';

// The classic "no real timestamp" DOS date/time pair (1980-01-01 00:00:00),
// used by other deterministic zip tools for the same reason: every entry
// gets it, so the archive's bytes depend only on its content.
const DOS_TIME = 0;
const DOS_DATE = (0 << 9) | (1 << 5) | 1; // year 1980, month 1, day 1

// Bit 11 of the general purpose flag: "name and comment fields are UTF-8".
// Many of this project's file names carry a flat or sharp sign - without
// this bit an extractor that does not guess UTF-8 on its own (older Windows
// tools especially) falls back to the system codepage and mangles them.
const GP_FLAG_UTF8 = 0x0800;

function crc32(buf) {
    if (typeof zlib.crc32 === 'function') return zlib.crc32(buf);
    // Fallback for a Node without zlib.crc32 (added as stable in Node 22.2):
    // the standard reflected CRC-32 (polynomial 0xEDB88320) table method.
    let table = crc32.table;
    if (!table) {
        table = crc32.table = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            table[n] = c >>> 0;
        }
    }
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Build a ZIP archive from a list of entries, deterministically: same
 * entries in the same order always produce the same bytes.
 *
 * @param {Array<{name: string, data: Buffer}>} entries - `name` uses '/' as
 *   the path separator regardless of host OS, per the ZIP spec.
 * @returns {Buffer} The complete .zip file
 */
export function buildZip(entries) {
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    for (const { name, data } of entries) {
        const nameBuf = Buffer.from(name, 'utf8');
        const compressed = zlib.deflateRawSync(data, { level: 9 });
        const crc = crc32(data);

        const local = Buffer.alloc(30);
        local.writeUInt32LE(0x04034b50, 0);
        local.writeUInt16LE(20, 4);           // version needed (2.0, for DEFLATE)
        local.writeUInt16LE(GP_FLAG_UTF8, 6);  // general purpose flag
        local.writeUInt16LE(8, 8);            // compression method: DEFLATE
        local.writeUInt16LE(DOS_TIME, 10);
        local.writeUInt16LE(DOS_DATE, 12);
        local.writeUInt32LE(crc, 14);
        local.writeUInt32LE(compressed.length, 18);
        local.writeUInt32LE(data.length, 22);
        local.writeUInt16LE(nameBuf.length, 26);
        local.writeUInt16LE(0, 28);           // extra field length

        localParts.push(local, nameBuf, compressed);

        const central = Buffer.alloc(46);
        central.writeUInt32LE(0x02014b50, 0);
        central.writeUInt16LE(20, 4);         // version made by
        central.writeUInt16LE(20, 6);         // version needed
        central.writeUInt16LE(GP_FLAG_UTF8, 8); // general purpose flag
        central.writeUInt16LE(8, 10);         // compression method
        central.writeUInt16LE(DOS_TIME, 12);
        central.writeUInt16LE(DOS_DATE, 14);
        central.writeUInt32LE(crc, 16);
        central.writeUInt32LE(compressed.length, 20);
        central.writeUInt32LE(data.length, 24);
        central.writeUInt16LE(nameBuf.length, 28);
        central.writeUInt16LE(0, 30);         // extra field length
        central.writeUInt16LE(0, 32);         // file comment length
        central.writeUInt16LE(0, 34);         // disk number start
        central.writeUInt16LE(0, 36);         // internal file attributes
        // external attrs: regular file, rw-r--r--. `<< 16` on a value this
        // size overflows a signed 32-bit int in JS; `>>> 0` brings it back
        // into the unsigned range writeUInt32LE requires.
        central.writeUInt32LE((0o100644 << 16) >>> 0, 38);
        central.writeUInt32LE(offset, 42);    // offset of local header

        centralParts.push(central, nameBuf);

        offset += local.length + nameBuf.length + compressed.length;
    }

    const centralDirectory = Buffer.concat(centralParts);
    const centralDirectoryOffset = offset;

    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(0, 4);               // disk number
    end.writeUInt16LE(0, 6);               // disk where central directory starts
    end.writeUInt16LE(entries.length, 8);  // records on this disk
    end.writeUInt16LE(entries.length, 10); // total records
    end.writeUInt32LE(centralDirectory.length, 12);
    end.writeUInt32LE(centralDirectoryOffset, 16);
    end.writeUInt16LE(0, 20);              // comment length

    return Buffer.concat([...localParts, centralDirectory, end]);
}
