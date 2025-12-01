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

    // FIXED staff dimensions for visual consistency - scaled up 20%
    const staffY = 36;
    const lineSpacing = 14.4;
    const stemHeight = 42;
    const baseNoteSpacing = 54;
    const leftMargin = 60;
    const rightMargin = 20;

    // Hardcode width for maximum 4 notes (typical chord voicings)
    const maxNotes = 4;
    const fixedWidth = leftMargin + (maxNotes - 1) * baseNoteSpacing + rightMargin; // 242px
    const fixedHeight = 120; // Reduced from 192 to minimize whitespace

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

    // Draw treble clef (G clef) as SVG path - scaled up 20%
    svg += `<g transform="translate(12, ${staffY - 10}) scale(0.456)">
        <path d="m51.688 5.25c-5.427-0.1409-11.774 12.818-11.563 24.375 0.049 3.52 1.16 10.659 2.781 19.625-10.223 10.581-22.094 21.44-22.094 35.688-0.163 13.057 7.817 29.692 26.75 29.532 2.906-0.02 5.521-0.38 7.844-1 1.731 9.49 2.882 16.98 2.875 20.44 0.061 13.64-17.86 14.99-18.719 7.15 3.777-0.13 6.782-3.13 6.782-6.84 0-3.79-3.138-6.88-7.032-6.88-2.141 0-4.049 0.94-5.343 2.41-0.03 0.03-0.065 0.06-0.094 0.09-0.292 0.31-0.538 0.68-0.781 1.1-0.798 1.35-1.316 3.29-1.344 6.06 0 11.42 28.875 18.77 28.875-3.75 0.045-3.03-1.258-10.72-3.156-20.41 20.603-7.45 15.427-38.04-3.531-38.184-1.47 0.015-2.887 0.186-4.25 0.532-1.08-5.197-2.122-10.241-3.032-14.876 7.199-7.071 13.485-16.224 13.344-33.093 0.022-12.114-4.014-21.828-8.312-21.969zm1.281 11.719c2.456-0.237 4.406 2.043 4.406 7.062 0.199 8.62-5.84 16.148-13.031 23.719-0.688-4.147-1.139-7.507-1.188-9.5 0.204-13.466 5.719-20.886 9.813-21.281zm-7.719 44.687c0.877 4.515 1.824 9.272 2.781 14.063-12.548 4.464-18.57 21.954-0.781 29.781-10.843-9.231-5.506-20.158 2.312-22.062 1.966 9.816 3.886 19.502 5.438 27.872-2.107 0.74-4.566 1.17-7.438 1.19-7.181 0-21.531-4.57-21.531-21.875 0-14.494 10.047-20.384 19.219-28.969zm6.094 21.469c0.313-0.019 0.652-0.011 0.968 0 13.063 0 17.99 20.745 4.688 27.375-1.655-8.32-3.662-17.86-5.656-27.375z"
        fill="black" stroke="black" stroke-width="0.5"/>
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
