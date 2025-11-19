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
    // Staff lines (from bottom): E4(64)=15, G4(67)=13, B4(71)=11, D5(74)=9, F5(77)=7
    // Spaces (from bottom): F4(65)=14, A4(69)=12, C5(72)=10, E5(76)=8
    const noteToStaffPosition = (midi) => {
        // Using modulo 12 to get note within octave, then octave offset
        const noteInOctave = midi % 12; // 0=C, 1=C#, 2=D, etc.
        const octave = Math.floor(midi / 12);

        // Map each note in octave to its position offset within an octave
        // C=0, C#=0, D=1, D#=1, E=2, F=3, F#=3, G=4, G#=4, A=5, A#=5, B=6
        const noteOffsets = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
        const offsetInOctave = noteOffsets[noteInOctave];

        // C4 (MIDI 60) now at position 17 (one octave lower than before)
        // Each octave up decreases position by 7, down increases by 7
        const c4Position = 17; // Middle C position - moved down one octave
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

    // Draw treble clef (clé de sol) - always same size and position
    svg += `<text x="20" y="${staffY + 42}" font-family="serif" font-size="55" font-weight="bold">𝄞</text>`;

    // Draw each note as an eighth note
    sortedNotes.forEach((midiNote, index) => {
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
