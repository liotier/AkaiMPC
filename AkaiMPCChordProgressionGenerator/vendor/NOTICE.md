# Vendored third-party scripts

Both files here were previously loaded from a CDN with a pinned version and a
Subresource Integrity hash. Vendoring closes the one gap SRI and the service
worker's opportunistic caching (`service-worker.js`) could not: a user's
*first* visit still needed to reach that specific CDN, and if that path was
blocked - a corporate proxy, a network filter, an ad-blocker's allowlist gap -
export never worked at all, with nothing to retry. These are the same bytes,
not a substitute: each one's SHA-384 was verified against the `integrity`
hash the CDN `<script>` tag carried before it was replaced.

To update either file: download the new version, verify it however you trust
(the project's own release, its own published hash), replace the file here,
and update the version noted below. Each file keeps its own upstream license
header - do not strip it.

## jszip.min.js

- Version: 3.10.1
- Upstream: https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
- License: dual MIT / GPLv3 - https://github.com/Stuk/jszip/blob/main/LICENSE.markdown
- Used for: building the ZIP archives in every bulk-export path (`app.js`
  `exportProgressions()`, `exportAllMIDI()`; `modules/midiExport.js`
  `downloadAllMIDIFiles()`).

## webmidi.iife.js

- Version: 3.1.16
- Upstream: https://cdn.jsdelivr.net/npm/webmidi@3.1.16/dist/iife/webmidi.iife.js
- License: Apache 2.0 - https://github.com/djipco/webmidi/blob/main/LICENSE
- Used for: enumerating and sending generated chords to a hardware or software
  MIDI output (`app.js`, the `WebMidi.*` calls around MIDI device selection;
  `modules/audio.js` takes the resolved output as a parameter). The app runs
  without it - falls back to the browser's own audio for playback - so this
  one is lower-stakes than JSZip, but the same first-visit gap applied.
