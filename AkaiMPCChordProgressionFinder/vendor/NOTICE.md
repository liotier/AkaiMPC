# Vendored third-party script

Previously loaded from `https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js`
with no integrity check, so a user's first visit depended on reaching that
specific CDN with nothing to fall back on, and a compromised or altered
response would have been used without any way to detect it. Vendoring
closes both gaps at once - see the cousin project's
`AkaiMPCChordProgressionGenerator/vendor/NOTICE.md` for the fuller
reasoning, which applies here identically.

To update: download the new version, verify it however you trust, replace
the file here, and update the version noted below. Keep the file's own
license header intact.

## jszip.min.js

- Version: 3.10.1
- Upstream: https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
- License: dual MIT / GPLv3 - https://github.com/Stuk/jszip/blob/main/LICENSE.markdown
- Used for: the bulk-export ZIP building in `index.html` (search `new JSZip()`).
- Verified: SHA-256 `acc7e41455a80765b5fd9c7ee1b8078a6d160bbbca455aeae854de65c947d59e`,
  byte-identical to the copy vendored the same day into
  `AkaiMPCChordProgressionGenerator/vendor/jszip.min.js`, itself checked
  against that CDN copy's Subresource Integrity hash before it was replaced.
