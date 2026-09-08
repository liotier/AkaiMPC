# MPC probe files

Five `.progression` files that between them settle every hardware question left
open in `../mpc-export-specification.md` §4. Drop the folder's contents into your
MPC's `Progressions` folder, reboot, open Pad Perform > Progressions, and look
for the `ZZProbe` heading - the `ZZ` prefix sorts it to the end of the list so it
is easy to find and easy to delete afterwards.

One boot answers all five.

| File | `name` field | What to look at |
|---|---|---|
| `ZZProbe_1_hyphen` | `ZZProbe-Doo-Wop Smooth (I vi IV V)` | Under the `ZZProbe` heading, does the entry read `Doo-Wop Smooth (I vi IV V)` with its hyphen intact, or has the second hyphen also been eaten ? |
| `ZZProbe_2_flat` | `ZZProbe-Flat Sign ♭VII ♭VI ♭III Smooth (...)` | Do the ♭ signs render, or do they show as boxes or garbage ? And is extra space inserted before the capital letters that follow them ? |
| `ZZProbe_3_truncation` | `ZZProbe-Truncate ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghij (I V vi IV)` | If the label is cut short, which character does it stop at ? The alphabet then digits make the cut point countable without measuring. |
| `ZZProbe_4_slash` | `ZZProbe-Slash V7/ii and Genre/Subgenre Smooth (...)` | Does the solidus display normally, or does the MPC treat it as a separator the way it treats the hyphen ? |
| `ZZProbe_5_scalefield` | `ZZProbe-Exotic Scale Field Hirajoshi` | Its JSON `scale` field says `Hirajoshi`, which is not a scale the MPC ships. Does the file load at all, and does anything odd appear where the scale is shown ? |

A sixth question needs the full pack rather than these probes: whether several
hundred `.progression` files slow the boot noticeably or hit a limit. That one
can wait until the pack exists.

Each file contains a real 16-pad palette, so they are playable, not stubs.
