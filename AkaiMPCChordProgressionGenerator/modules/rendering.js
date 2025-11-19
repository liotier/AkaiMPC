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

    // Draw treble clef (G clef) as SVG path
    svg += `<g transform="translate(18, ${staffY - 10}) scale(0.065)">
        <path d="M45.117,246.969c-7.324,13.625-16.699,21-32.363,21c-25.176,0-44.863-19.375-44.863-44.063
            c0-24.688,19.688-44.063,44.863-44.063c15.664,0,25.039,7.375,32.363,21L45.117,246.969z M73.535,47.969
            c0,16.25-9.375,25.625-24.688,25.625S24.16,64.219,24.16,47.969s9.375-25.625,24.688-25.625S73.535,31.719,73.535,47.969z
            M0.594,318.156c-13.973,16.25-29.285,25.625-48.523,25.625c-19.688,0-36.211-16.969-36.211-37.109s16.523-37.109,36.211-37.109
            c19.238,0,34.551,9.375,48.523,25.625L0.594,318.156z M55.781,219.656c0-36.5,14.859-66.438,44.797-66.438
            c30.25,0,45.594,29.938,45.594,66.438s-15.344,66.438-45.594,66.438C70.641,286.094,55.781,256.156,55.781,219.656z
            M171.344,29.141c0,46.797-15.313,87.125-39.688,121.688v17.875c0,107.875-18.188,194.625-54.344,249.75
            c-22.031,34.156-51.969,53-87.672,53c-43.438,0-75.156-33.063-75.156-76.188c0-44.063,32.363-76.188,74.609-76.188
            c41.703,0,73.516,32.125,73.516,76.188c0,30.25-14.859,55.438-41.156,69.406c27.156-13.813,50.375-39.5,66.984-73.656
            c29.938-60.5,39.313-133.094,39.313-207.156v-21.813C84.047,112.266,48.07,47.422,48.07,1.719
            c0-27.313,14.859-43.172,37.164-43.172c22.031,0,36.891,15.859,36.891,43.172c0,27.859-14.586,46.797-31.383,69.102
            c32.637-16.25,61.117-32.5,61.117-69.102c0-27.313,14.859-43.172,36.891-43.172c22.031,0,36.891,15.859,36.891,43.172
            c0,42.891-34.063,83.219-81.859,110.656c24.414-7.375,46.445-11.563,65.953-11.563c45.594,0,60.453,27.031,60.453,63.531
            s-14.859,63.813-60.453,63.813c-19.508,0-41.539-4.469-65.953-11.844c47.789,27.031,81.859,67.641,81.859,110.797
            c0,47.516-29.938,79.375-71.367,79.375c-41.703,0-71.367-31.859-71.367-79.375c0-46.797,29.664-84.016,71.367-84.016
            c11.289,0,20.938,2.188,30.859,5.922C135.508,184.578,123.148,131.422,123.148,75.531C143.438,62.266,171.344,48.453,171.344,29.141z"
        fill="black"/>
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
