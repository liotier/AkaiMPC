// Rendering Module
// Contains SVG generation and UI rendering functions

export function generateKeyboardSVG(notes) {
    if (!notes || notes.length === 0) return '';

    // Determine octave range to display - start at the lowest note's octave
    const minNote = Math.min(...notes);
    const startOctave = Math.floor(minNote / 12);
    const startNote = startOctave * 12;

    // Create set of active notes (absolute, not modulo)
    const activeNotes = new Set(notes);

    // Two octaves = 14 white keys
    const whiteKeyPattern = [0, 2, 4, 5, 7, 9, 11];
    const blackKeyPattern = [1, 3, 6, 8, 10];

    let svg = '<svg viewBox="0 0 196 35" xmlns="http://www.w3.org/2000/svg">';

    // Draw two octaves of white keys
    for (let octave = 0; octave < 2; octave++) {
        whiteKeyPattern.forEach((note, i) => {
            const x = (octave * 7 + i) * 14;
            const absoluteNote = startNote + (octave * 12) + note;
            const active = activeNotes.has(absoluteNote);
            svg += `<rect x="${x}" y="0" width="13" height="35" fill="${active ? '#f59e0b' : 'white'}" stroke="#333" stroke-width="1"/>`;
        });
    }

    // Draw two octaves of black keys
    // Black keys come after white keys at indices: C#=0, D#=1, F#=3, G#=4, A#=5
    const whiteKeyIndices = [0, 1, 3, 4, 5];
    for (let octave = 0; octave < 2; octave++) {
        blackKeyPattern.forEach((note, i) => {
            // Center black key between white keys (each white key is 14px wide)
            // Black key is 10px wide, so offset by 8.5 from left edge of white key
            const x = (octave * 7 + whiteKeyIndices[i]) * 14 + 8.5;
            const absoluteNote = startNote + (octave * 12) + note;
            const active = activeNotes.has(absoluteNote);
            svg += `<rect x="${x}" y="0" width="10" height="21" fill="${active ? '#dc2626' : '#333'}" stroke="#000" stroke-width="1"/>`;
        });
    }

    svg += '</svg>';
    return svg;
}

export function generateGuitarSVG(guitarChord, pad, isLeftHanded) {
    const width = 150;
    const height = 140;
    const stringSpacing = 20;
    const fretSpacing = 28;
    const leftMargin = 25;
    const topMargin = 25;

    let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;

    // Parse frets and fingers
    const frets = guitarChord.frets.split('');
    const fingers = guitarChord.fingers ? guitarChord.fingers.split('') : frets;

    // Calculate minimum fret position (excluding open strings and muted strings)
    const fretNumbers = frets
        .filter(f => f !== 'x' && f !== '0')
        .map(f => parseInt(f));
    const minFret = fretNumbers.length > 0 ? Math.min(...fretNumbers) : 1;
    const startFret = minFret > 3 ? minFret : 1;
    const isOpenPosition = startFret === 1;

    // Flip for left-handed
    if (isLeftHanded) {
        frets.reverse();
        fingers.reverse();
    }

    // Add fret position indicator if not in open position
    if (!isOpenPosition) {
        svg += `<text x="${leftMargin - 12}" y="${topMargin + fretSpacing / 2 + 3}"
            text-anchor="middle" font-size="11" font-weight="bold">${startFret}fr</text>`;
    }

    // Draw frets (horizontal lines)
    for (let i = 0; i <= 4; i++) {
        const y = topMargin + i * fretSpacing;
        // First line is bold nut only in open position
        const strokeWidth = (i === 0 && isOpenPosition) ? 3 : 1;
        svg += `<line x1="${leftMargin}" y1="${y}" x2="${leftMargin + 5 * stringSpacing}" y2="${y}"
            stroke="black" stroke-width="${strokeWidth}"/>`;
    }

    // Draw strings (vertical lines)
    for (let i = 0; i < 6; i++) {
        const x = leftMargin + i * stringSpacing;
        const strokeWidth = isLeftHanded ? i + 1 : 6 - i;
        svg += `<line x1="${x}" y1="${topMargin}" x2="${x}" y2="${topMargin + 4 * fretSpacing}"
            stroke="black" stroke-width="${strokeWidth}"/>`;
    }

    // Draw fret positions
    frets.forEach((fret, stringIndex) => {
        const x = leftMargin + stringIndex * stringSpacing;

        if (fret === 'x') {
            // Muted string
            svg += `<text x="${x}" y="${topMargin - 8}" text-anchor="middle"
                font-size="16" font-weight="bold">×</text>`;
        } else if (fret === '0') {
            // Open string
            svg += `<circle cx="${x}" cy="${topMargin - 8}" r="6"
                fill="none" stroke="black" stroke-width="2"/>`;
        } else {
            // Fretted note
            const fretNum = parseInt(fret);
            // Adjust position based on starting fret (for positions above open position)
            const displayFret = fretNum - startFret + 1;
            const y = topMargin + (displayFret - 0.5) * fretSpacing;
            svg += `<circle cx="${x}" cy="${y}" r="8" fill="black"/>`;

            // Add finger number if available
            const fingerNum = fingers[stringIndex];
            if (fingerNum !== 'x' && fingerNum !== '0' && fingerNum !== fret) {
                svg += `<text x="${x}" y="${y + 3}" text-anchor="middle"
                    font-size="8" fill="white" font-weight="bold">${fingerNum}</text>`;
            }
        }
    });

    // Draw barre if present
    if (guitarChord.barre) {
        const displayBarreFret = guitarChord.barre.fret - startFret + 1;
        const y = topMargin + (displayBarreFret - 0.5) * fretSpacing;
        const fromX = leftMargin + (guitarChord.barre.from - 1) * stringSpacing;
        const toX = leftMargin + Math.min(5, guitarChord.barre.to - 1) * stringSpacing;
        svg += `<rect x="${fromX - 8}" y="${y - 8}" width="${toX - fromX + 16}" height="16"
            rx="8" fill="black" opacity="0.3"/>`;
    }

    svg += '</svg>';
    return svg;
}

export function generateStaffSVG(notes) {
    if (!notes || notes.length === 0) return '';

    // Sort notes from low to high
    const sortedNotes = [...notes].sort((a, b) => a - b);

    // Intelligently transpose notes to fit optimally on staff
    // Target: center notes around B4 (MIDI 71), the middle staff line
    const median = sortedNotes[Math.floor(sortedNotes.length / 2)];
    const targetMedian = 71; // B4 - middle line of treble staff

    // Calculate octave shift (in multiples of 12 semitones)
    const rawShift = targetMedian - median;
    const octaveShift = Math.round(rawShift / 12) * 12;

    // Transpose all notes by the calculated octave shift
    const transposedNotes = sortedNotes.map(note => note + octaveShift);

    // FIXED staff dimensions for visual consistency - no scaling
    const staffY = 30;
    const lineSpacing = 12;
    const stemHeight = 35;
    const baseNoteSpacing = 45;
    const leftMargin = 80;
    const rightMargin = 20;

    // Hardcode width for maximum 4 notes (typical chord voicings)
    const maxNotes = 4;
    const fixedWidth = leftMargin + (maxNotes - 1) * baseNoteSpacing + rightMargin; // 235px
    const fixedHeight = 160; // Constant height

    const startX = leftMargin;

    // MIDI note to staff position mapping - based on treble clef
    // Staff lines (from bottom): E4(64)=8, G4(67)=6, B4(71)=4, D5(74)=2, F5(77)=0
    // Spaces (from bottom): F4(65)=7, A4(69)=5, C5(72)=3, E5(76)=1
    const noteToStaffPosition = (midi) => {
        // Using modulo 12 to get note within octave, then octave offset
        const noteInOctave = midi % 12; // 0=C, 1=C#, 2=D, etc.
        const octave = Math.floor(midi / 12);

        // Map each note in octave to its position offset within an octave
        // C=0, C#=0, D=1, D#=1, E=2, F=3, F#=3, G=4, G#=4, A=5, A#=5, B=6
        const noteOffsets = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
        const offsetInOctave = noteOffsets[noteInOctave];

        // C4 (MIDI 60) is at position 10 (ledger line below staff)
        // Each octave up decreases position by 7, down increases by 7
        const c4Position = 10; // Middle C position
        const c4Octave = 5; // floor(60/12) = 5
        const octaveDifference = octave - c4Octave;

        return c4Position - (octaveDifference * 7) - offsetInOctave;
    };

    let svg = `<svg viewBox="0 0 ${fixedWidth} ${fixedHeight}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">`;

    // Draw the 5 staff lines - always same position
    for (let i = 0; i < 5; i++) {
        const y = staffY + i * lineSpacing;
        svg += `<line x1="15" y1="${y}" x2="${fixedWidth - 10}" y2="${y}" stroke="black" stroke-width="1.2"/>`;
    }

    // Draw treble clef (G clef) as SVG path for reliable rendering in print
    const clefX = 25;
    const clefY = staffY + 24; // Position on G line (second line from bottom)
    svg += `<g transform="translate(${clefX}, ${clefY}) scale(0.13)">
        <path d="M 132.57812,246.44141 C 124.91406,259.90625 115.30469,267.1875 99.300781,267.1875 73.652344,267.1875 53.730469,247.64844 53.730469,222.76172 53.730469,198.25781 73.652344,178.71875 99.300781,178.71875 c 16.00391,0 25.61328,7.28125 33.27731,20.74609 z M 161.46094,46.261719 c 0,16.003906 -9.60938,25.230469 -25.23047,25.230469 -15.62109,0 -25.23047,-9.226563 -25.23047,-25.230469 0,-16.003907 9.60938,-25.230469 25.23047,-25.230469 15.62109,0 25.23047,9.226562 25.23047,25.230469 z M 85.929688,316.75781 C 71.925781,332.76172 56.304688,341.98828 36.765625,341.98828 16.84375,341.98828 0,324.80469 0,304.5 0,284.19531 16.84375,267.01172 36.765625,267.01172 c 19.539062,0 35.160156,9.22656 49.164063,25.23047 z m 56.308592,-97.03125 c 0,-35.92969 15.23828,-65.42969 45.73828,-65.42969 30.88281,0 46.50391,29.5 46.50391,65.42969 0,35.92969 -15.62109,65.42969 -46.50391,65.42969 -30.5,0 -45.73828,-29.5 -45.73828,-65.42969 z M 261.59766,27.914062 c 0,46.121094 -15.62109,85.878908 -40.50782,119.921878 v 17.62109 c 0,106.25781 -18.57812,191.75 -55.542966,246.05469 -22.496094,33.66016 -52.996094,52.23828 -89.578125,52.23828 C 32.191406,463.75 0,431.17578 0,388.52344 0,345.10547 33.042969,313.29688 75.695312,313.29688 c 42.652348,0 75.695318,31.80859 75.695318,75.22656 0,30.5 -15.23828,55.00391 -42.26953,68.85156 27.79688,-13.46484 51.53125,-39.11328 68.46875,-72.39062 30.49609,-59.625 40.10547,-131.14453 40.10547,-204.17969 v -21.47656 C 173.89844,110.66797 137.31641,45.253906 137.31641,0 c 0,-27.03125 15.23828,-42.652344 37.73437,-42.652344 22.49609,0 37.73438,15.621094 37.73438,42.652344 0,27.414062 -14.85547,46.121094 -32.04297,67.96875 33.27735,-16.003906 62.39453,-32.00781 62.39453,-67.96875 0,-27.03125 15.23828,-42.652344 37.73437,-42.652344 22.49609,0 37.73437,15.621094 37.73437,42.652344 0,42.269531 -34.80469,82.027344 -83.64062,109.05859 24.88672,-7.28125 47.38281,-11.375 67.30468,-11.375 46.50391,0 61.74219,26.648438 61.74219,62.578125 0,35.92969 -15.23828,62.96094 -61.74219,62.96094 -19.92187,0 -42.41796,-4.47656 -67.30468,-11.75781 48.83593,27.03125 83.64062,66.78906 83.64062,109.44140 0,46.88672 -30.49609,78.31641 -72.76563,78.31641 -42.65234,0 -72.76562,-31.42969 -72.76562,-78.31641 0,-46.12109 30.11328,-82.80859 72.76562,-82.80859 11.375,0 21.36719,2.19531 31.35938,5.85938 C 222.98828,182.57422 210.44922,129.19531 210.44922,73.273438 231.09766,60.191406 261.59766,46.34375 261.59766,27.914062 Z"
        fill="black" stroke="none"/>
    </g>`;

    // Draw each note as an eighth note
    transposedNotes.forEach((midiNote, index) => {
        const x = startX + index * baseNoteSpacing;
        const staffPosition = noteToStaffPosition(midiNote);
        const y = staffY + staffPosition * (lineSpacing / 2);

        // Draw ledger lines if needed
        if (staffPosition >= 10) {
            // Below staff (middle C and below)
            for (let line = 10; line <= staffPosition; line += 2) {
                const ledgerY = staffY + line * (lineSpacing / 2);
                svg += `<line x1="${x - 10}" y1="${ledgerY}" x2="${x + 10}" y2="${ledgerY}" stroke="black" stroke-width="1.2"/>`;
            }
        } else if (staffPosition <= -2) {
            // Above staff
            for (let line = -2; line >= staffPosition; line -= 2) {
                const ledgerY = staffY + line * (lineSpacing / 2);
                svg += `<line x1="${x - 10}" y1="${ledgerY}" x2="${x + 10}" y2="${ledgerY}" stroke="black" stroke-width="1.2"/>`;
            }
        }

        // Draw note head (filled oval for eighth notes)
        svg += `<ellipse cx="${x}" cy="${y}" rx="6" ry="4.5" fill="black" transform="rotate(-20 ${x} ${y})"/>`;

        // Draw stem (upward for all notes)
        svg += `<line x1="${x + 5}" y1="${y}" x2="${x + 5}" y2="${y - stemHeight}" stroke="black" stroke-width="1.8"/>`;

        // Draw flag for eighth note
        svg += `<path d="M ${x + 5} ${y - stemHeight} Q ${x + 16} ${y - stemHeight + 6} ${x + 16} ${y - stemHeight + 14} Q ${x + 16} ${y - stemHeight + 9} ${x + 5} ${y - stemHeight + 6}" fill="black"/>`;
    });

    svg += '</svg>';
    return svg;
}
