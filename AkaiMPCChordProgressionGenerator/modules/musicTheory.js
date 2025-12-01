// Music Theory Module
// Contains all music theory logic, constants, and chord generation functions

// ============================================================================
// Constants and Data
// ============================================================================

export const keys = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];

export const modes = {
    'Common Western Tonal': [
        'Major', 'Minor', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Locrian',
        'Harmonic Minor', 'Melodic Minor'
    ],
    'Compact/Popular': [
        'Pentatonic Major', 'Pentatonic Minor', 'Blues'
    ],
    'Symmetrical/Jazz': [
        'Whole Tone', 'Diminished (W-H)', 'Diminished (H-W)', 'Augmented'
    ],
    'Arabic Maqamat': [
        'Maqam Hijaz', 'Maqam Bayati', 'Maqam Rast', 'Maqam Saba', 'Maqam Kurd'
    ],
    'Indian Ragas': [
        'Bhairav', 'Kafi', 'Yaman', 'Bhairavi', 'Todi'
    ],
    'Exotic': [
        'Double Harmonic', 'Hungarian Minor', 'Neapolitan Major', 'Neapolitan Minor',
        'Enigmatic', 'Phrygian Dominant', 'Persian', 'Hirajoshi', 'Insen', 'Kumoi',
        'Egyptian Pentatonic'
    ]
};

export const progressions = {
    'Pop/Rock': [
        {
            value: 'I—V—vi—IV',
            name: 'I—V—vi—IV',
            nickname: 'Axis of Awesome',
            description: 'The most popular progression in modern pop. Tonic to dominant creates forward motion, deceptive resolution to vi adds emotion, IV provides gentle return. Used in hundreds of hits from "Let It Be" to "Don\'t Stop Believin\'."'
        },
        {
            value: 'I—IV—V—I',
            name: 'I—IV—V—I',
            nickname: 'Classic Rock',
            description: 'The foundation of rock and roll. Moves from tonic through subdominant to dominant, creating satisfying tension and release. The backbone of blues, country, and early rock from Chuck Berry to The Beatles.'
        },
        {
            value: 'vi—IV—I—V',
            name: 'vi—IV—I—V',
            nickname: 'Pop Punk',
            description: 'Starts on the relative minor for immediate emotional impact, then cycles through subdominant, tonic, and dominant. Creates anthemic, singalong feel. Popularized by bands like Blink-182 and Green Day.'
        },
        {
            value: 'I—vi—IV—V',
            name: 'I—vi—IV—V',
            nickname: '50s Doo-Wop',
            description: 'The classic "doo-wop" changes from 1950s vocal groups. Tonic to relative minor creates gentle melancholy, subdominant and dominant complete the circle. Think "Stand By Me" or "Blue Moon."'
        },
        {
            value: 'I—V—vi—iii—IV',
            name: 'I—V—vi—iii—IV',
            nickname: 'Canon Progression',
            description: 'Pachelbel\'s Canon sequence extended. Descends through scale, creating inevitable forward momentum. Used in "Basket Case," "Hook," countless ballads. The iii chord adds romantic complexity.'
        },
        {
            value: 'IV—I—V—vi',
            name: 'IV—I—V—vi',
            nickname: 'Despacito',
            description: 'Starts with subdominant for immediate lift, resolves to tonic, then moves through dominant to relative minor. Creates circular, hypnotic feel perfect for Latin pop and reggaeton grooves.'
        },
        {
            value: 'vi—V—IV—V',
            name: 'vi—V—IV—V',
            nickname: 'Grenade',
            description: 'Minor tonic to dominant creates dramatic tension, subdominant offers brief respite before dominant builds again. Perfect for power ballads and emotional climaxes like Bruno Mars\' "Grenade."'
        },
        {
            value: 'I—III—IV—iv',
            name: 'I—III—IV—iv',
            nickname: 'Creep',
            description: 'Made famous by Radiohead. Major tonic to major III is unexpected, IV is familiar, then iv (borrowed from minor) adds haunting melancholy. The chromatic bass movement creates distinctive descending feeling.'
        },
        {
            value: 'I—V—♭VII—IV',
            name: 'I—V—♭VII—IV',
            nickname: 'Sweet Home',
            description: 'Mixolydian flavor from borrowed ♭VII creates bluesy, Southern rock sound. The major subdominant after flat seven provides satisfying lift. Iconic in "Sweet Home Alabama" and classic rock anthems.'
        },
        {
            value: 'I—♭VII—IV—I',
            name: 'I—♭VII—IV—I',
            nickname: 'Mixolydian Vamp',
            description: 'Circular Mixolydian progression. Borrowed ♭VII from parallel minor adds rock edge, IV to I provides traditional perfect cadence. Creates driving, modal rock feel without dominant V chord.'
        }
    ],
    'Blues/Soul': [
        {
            value: '12-bar-blues',
            name: 'I—I—I—I—IV—IV—I—I—V—IV—I—V',
            nickname: '12-Bar Blues',
            description: 'The foundation of blues, rock, and jazz. Four bars of tonic establish home, IV chord creates tension, return to I provides relief, V-IV creates "turnaround" back to I. The most important progression in American music.'
        },
        {
            value: 'I—vi—ii—V',
            name: 'I—vi—ii—V',
            nickname: 'Turnaround',
            description: 'Classic jazz turnaround. Descends from I through relative minor (vi), then ii-V creates strong pull back to I. Used at the end of 12-bar blues and in countless jazz standards to cycle smoothly back to the beginning.'
        },
        {
            value: 'ii—V—I—VI',
            name: 'ii—V—I—VI',
            nickname: 'Rhythm Changes A',
            description: 'From Gershwin\'s "I Got Rhythm," the most common chord changes in jazz after blues. The ii-V-I is the strongest resolution in functional harmony, VI creates chromatic movement and leads into the next cycle.'
        },
        {
            value: 'I—VI—ii—V',
            name: 'I—VI—ii—V',
            nickname: 'I Got Rhythm',
            description: 'Another variation of rhythm changes. I to VI (major chord on sixth scale degree) creates chromatic bass movement, then ii-V prepares return to I. The VI chord is often played as V7/ii, creating even stronger forward motion.'
        },
        {
            value: 'i—♭III—♭VII—IV',
            name: 'i—♭III—♭VII—IV',
            nickname: 'Dorian Vamp',
            description: 'Modal blues in Dorian mode. Minor tonic to major ♭III creates hopeful lift, ♭VII adds bluesy flavor, IV (major in Dorian) brings brightness. Creates sophisticated minor blues sound popularized by Miles Davis and modal jazz.'
        },
        {
            value: 'i—IV—i—V',
            name: 'i—IV—i—V',
            nickname: 'Minor Blues',
            description: 'The minor blues progression. Minor tonic to major IV creates dramatic shift, return to i establishes minor tonality, major V creates tension begging for resolution. More dramatic and melancholic than standard major blues.'
        }
    ],
    'Jazz/Functional': [
        {
            value: 'ii—V—I',
            name: 'ii—V—I',
            nickname: '2-5-1',
            description: 'The most fundamental progression in jazz. The ii (supertonic) prepares the V (dominant), which strongly resolves to I (tonic). This circle-of-fifths movement is the building block of functional harmony and appears in nearly every jazz standard.'
        },
        {
            value: 'ii—V—I—vi',
            name: 'ii—V—I—vi',
            nickname: 'Jazz Standard',
            description: 'Extended ii-V-I cadence with deceptive resolution. After the strong ii-V-I, the vi chord surprises the ear instead of staying on I, creating continued forward momentum. Perfect for looping in jazz improvisations and standards.'
        },
        {
            value: 'iii—vi—ii—V',
            name: 'iii—vi—ii—V',
            nickname: 'Circle Progression',
            description: 'Descending circle of fifths: iii to vi to ii to V. Each chord is a fifth below the previous, creating inevit able gravitational pull toward tonic. Demonstrates pure functional harmony in action - used extensively in bebop and hard bop.'
        },
        {
            value: 'IVM7—V7—iii7—vi',
            name: 'IVM7—V7—iii7—vi',
            nickname: 'Fly Me To The Moon',
            description: 'From Bart Howard\'s jazz standard. IV-V creates strong motion, iii-vi continues descending by thirds (plagal cascade). Rich maj7 and dom7 voicings create sophisticated, romantic jazz sound perfect for ballads.'
        },
        {
            value: 'IM7—ii7—iii7—IVM7',
            name: 'IM7—ii7—iii7—IVM7',
            nickname: 'Ascending Jazz',
            description: 'Stepwise ascending progression through diatonic 7th chords. Creates gentle, uplifting motion. Avoids strong functional resolutions, instead painting with color and texture. Common in modal jazz and contemporary jazz compositions.'
        },
        {
            value: 'vi—ii—V—I',
            name: 'vi—ii—V—I',
            nickname: 'Minor Turnaround',
            description: 'Begins on relative minor (vi) for darker emotional start, then cycles through ii-V-I to resolve to major tonic. The contrast between minor beginning and major resolution creates satisfying emotional arc common in jazz ballads.'
        },
        {
            value: 'I—vi—IV—♯iv°—V',
            name: 'I—vi—IV—♯iv°—V',
            nickname: 'Chromatic Turnaround',
            description: 'Classic turnaround with passing diminished chord. The ♯iv° (raised four diminished) creates chromatic bass line (I-vi-IV-♯iv°-V), adding harmonic sophistication. The diminished chord functions as dominant of dominant, strengthening resolution to V.'
        },
        {
            value: 'iv—♭VII—I',
            name: 'iv—♭VII—I',
            nickname: 'Backdoor',
            description: 'The "backdoor progression" - approaches tonic from ♭VII instead of V. Borrowed iv from parallel minor adds color, ♭VII creates whole-step resolution to I (plagal motion). Provides relief from constant ii-V-I, adds unexpected freshness to jazz harmony.'
        },
        {
            value: 'I—♯I°—ii—♯II°',
            name: 'I—♯I°—ii—♯II°',
            nickname: 'Chromatic Walk',
            description: 'Chromatically ascending bassline using passing diminished chords. Each diminished chord connects diatonic chords a whole step apart. Creates smooth voice leading and sophisticated sound used in jazz intros and interludes.'
        },
        {
            value: 'IM7—♭IIIM7—♭VIM7—♭II7',
            name: 'IM7—♭IIIM7—♭VIM7—♭II7',
            nickname: 'Giant Steps',
            description: 'John Coltrane\'s revolutionary "Giant Steps" changes. Moves through three tonal centers divided into major thirds (I, ♭III, ♭VI). The ♭II7 is tritone substitution. Creates maximum harmonic movement, defining moment in jazz evolution.'
        }
    ],
    'Classical/Modal': [
        {
            value: 'I—IV—vii°—iii—vi—ii—V—I',
            name: 'I—IV—vii°—iii—vi—ii—V—I',
            nickname: 'Circle of Fifths',
            description: 'Complete circle of fifths progression. Each chord root descends by perfect fifth (or ascends by perfect fourth), demonstrating the gravitational pull of functional harmony. Fundamental teaching progression showing how all diatonic chords relate.'
        },
        {
            value: 'I—V—vi—iii—IV—I—IV—V',
            name: 'I—V—vi—iii—IV—I—IV—V',
            nickname: 'Pachelbel Canon',
            description: 'Johann Pachelbel\'s famous Canon in D progression. Descending stepwise bassline creates elegant voice leading. The sequence became a cliché from overuse but remains pedagogically valuable for teaching baroque counterpoint and ground bass technique.'
        },
        {
            value: 'i—♭VII—♭VI—V',
            name: 'i—♭VII—♭VI—V',
            nickname: 'Andalusian',
            description: 'The "Andalusian cadence" from Phrygian mode. Descending tetrachord (four-note pattern) creates tragic, Spanish character. Minor tonic to borrowed ♭VII and ♭VI, ending on major V. Used in flamenco, classical, and film music for Mediterranean flavor.'
        },
        {
            value: 'i—♭VII—i—V',
            name: 'i—♭VII—i—V',
            nickname: 'Passamezzo Antico',
            description: 'Renaissance dance progression, "old passamezzo." Minor tonic to borrowed ♭VII creates modal ambiguity, return to i confirms minor, major V provides tension. Early example of i-V minor harmony predating common practice period.'
        },
        {
            value: 'I—V—I—IV',
            name: 'I—V—I—IV',
            nickname: 'Passamezzo Moderno',
            description: 'Renaissance "modern passamezzo" - the major version. Tonic-dominant assertion, return to tonic, then subdominant. Simple but effective major-mode dance progression. Shows evolution from modal to tonal thinking in early Baroque period.'
        },
        {
            value: 'iv—♭VII—♭III—♭VI',
            name: 'iv—♭VII—♭III—♭VI',
            nickname: 'Plagal Cascade',
            description: 'Descending plagal (subdominant) motion through borrowed chords. No dominant present - all "soft" resolutions. Creates dark, modal atmosphere avoiding functional V-I cadences. Popular in film scores and progressive rock for ambiguous, drifting quality.'
        },
        {
            value: 'i—iv—♭VII—♭III',
            name: 'i—iv—♭VII—♭III',
            nickname: 'Natural Minor',
            description: 'Pure natural minor (Aeolian mode) progression using diatonic chords. Minor tonic and subdominant establish minor feel, ♭VII and ♭III are characteristic of natural minor versus harmonic minor. Creates melancholic, modal atmosphere without leading tone resolution.'
        }
    ],
    'Electronic/Modern': [
        {
            value: 'i—♭VI—♭III—♭VII',
            name: 'i—♭VI—♭III—♭VII',
            nickname: 'EDM Drop',
            description: 'The "drop" progression in modern EDM. Minor tonic to borrowed ♭VI creates immediate lift, ♭III adds hopeful color, ♭VII provides driving Mixolydian energy. Avoids dominant V for hypnotic, non-functional loop. Perfect for build-ups and bass drops.'
        },
        {
            value: 'i—♭VII—♭VI—♭VII',
            name: 'i—♭VII—♭VI—♭VII',
            nickname: 'Dark House',
            description: 'Dark minor house progression. Borrowed ♭VII and ♭VI from parallel major create modal ambiguity, avoiding traditional minor harmony. The ♭VII oscillates, creating tension without resolution. Used in tech house and dark progressive house for brooding atmosphere.'
        },
        {
            value: 'vi—IV—I—V',
            name: 'vi—IV—I—V',
            nickname: 'Pop Loop',
            description: 'Optimized for electronic looping. Starts on relative minor for immediate emotion, cycles through familiar pop changes but ends on V instead of IV, creating stronger pull back to beginning. Perfect for seamless 4-bar loops in electronic pop and future bass.'
        },
        {
            value: 'I—V—vi—IV—I—V—iii—IV',
            name: 'I—V—vi—IV—I—V—iii—IV',
            nickname: 'Extended Pop',
            description: 'Eight-bar extended pop progression. First four bars are classic "Axis of Awesome" I-V-vi-IV, second four bars substitute iii for vi, creating variation while maintaining familiarity. Allows longer builds and more complex arrangements in electronic pop production.'
        },
        {
            value: 'i—♭III—♭VII—i',
            name: 'i—♭III—♭VII—i',
            nickname: 'Modal Interchange',
            description: 'Demonstrates modal interchange concept. All borrowed chords from parallel major (♭III, ♭VII) mixed with natural minor i. Creates modern, ambiguous tonality avoiding traditional V-i resolution. Cornerstone of contemporary electronic music harmony, from synthwave to future bass.'
        },
        {
            value: 'I—♭III—IV—♭VI',
            name: 'I—♭III—IV—♭VI',
            nickname: 'Chromatic Mediant',
            description: 'Explores chromatic mediant relationships. I to ♭III is dramatic shift (roots a major third apart, not in key), IV is familiar, ♭VI is another chromatic mediant. Creates cinematic, unexpected harmonic movement. Used in progressive house and melodic dubstep for emotional impact.'
        },
        {
            value: 'i—iv—v',
            name: 'i—iv—v',
            nickname: 'Techno Minimal',
            paletteFilter: ['minor', 'minor7', 'quartal'],
            description: 'Sparse, mechanical palette. Minor triads and quartal voicings for hypnotic loops.'
        },
        {
            value: 'I—IV—V',
            name: 'I—IV—V',
            nickname: 'Deep House',
            paletteFilter: ['major7', 'minor7', 'dom7', 'major'],
            description: 'Warm, jazzy palette. Rich 7th chords for soulful, groovy deep house vibes.'
        },
        {
            value: 'IM7—IVM7—VM7',
            name: 'IM7—IVM7—VM7',
            nickname: 'Ambient Wash',
            paletteFilter: ['major7', 'minor7', 'quartal'],
            description: 'Open, floating palette. Major/minor 7ths and quartal voicings for ethereal soundscapes.'
        }
    ],
    'R&B/Neo-Soul': [
        {
            value: 'ii—V—IM7—vi',
            name: 'ii—V—IM7—vi',
            nickname: 'Neo-Soul Standard',
            description: 'Jazz-influenced neo-soul changes. Opens with ii-V borrowed from jazz, resolves to IM7 (not plain I) for sophisticated color, deceptive vi chord adds melancholy. Rich 7th chord voicings essential. Defines the sound of D\'Angelo, Erykah Badu, and modern R&B.'
        },
        {
            value: 'IM7—iii7—vi7—ii7',
            name: 'IM7—iii7—vi7—ii7',
            nickname: 'Smooth R&B',
            description: 'Descending diatonic 7th chords create lush, sophisticated sound. All major and minor 7ths, no dominant tension - smooth, floating quality. Descends by thirds then fourths, creating gentle forward motion. Perfect for slow jams and contemporary R&B ballads.'
        },
        {
            value: 'I—IV—ii—V',
            name: 'I—IV—ii—V',
            nickname: 'Classic R&B',
            description: 'Combines pop simplicity with jazz sophistication. I-IV is familiar plagal motion, ii-V is classic jazz cadence. The ii chord transforms familiar I-IV-V into something more refined. Foundation of Motown, Stax, and classic soul from the 60s and 70s.'
        },
        {
            value: 'vi—ii—iii—IV',
            name: 'vi—ii—iii—IV',
            nickname: 'Emotional Ballad',
            description: 'Starts on relative minor for immediate vulnerability, ascends through ii and iii (increasing tension), resolves to IV (subdominant). Avoids obvious I and V chords, creating sophisticated emotional arc. Common in modern R&B and neo-soul ballads, allows melodic freedom.'
        },
        {
            value: 'IM7—V7/IV—IVM7—iv',
            name: 'IM7—V7/IV—IVM7—iv',
            nickname: 'Chromatic Soul',
            description: 'Advanced chromatic harmony. V7/IV is secondary dominant (dominant of IV), creating temporary tonicization. Major IV to minor iv is chromatic shift borrowed from parallel minor. Creates sophisticated voice leading and harmonic color characteristic of Stevie Wonder and modern neo-soul.'
        },
        {
            value: 'i—iv—♭VII—♭VI',
            name: 'i—iv—♭VII—♭VI',
            nickname: 'Minor Soul',
            description: 'Minor mode R&B progression. Natural minor i-iv establishes dark foundation, borrowed ♭VII and ♭VI from Dorian/Aeolian create modal ambiguity. Descending plagal motion avoids dominant resolution. Used in contemporary R&B for darker, moodier atmosphere.'
        },
        {
            value: 'I—♯iv°—ii—V',
            name: 'I—♯iv°—ii—V',
            nickname: 'Gospel Soul',
            description: 'Gospel-influenced chromatic passing chord. The ♯iv° (raised four diminished) creates smooth chromatic bass line connecting I to ii, then classic ii-V cadence. The diminished chord functions as dominant of dominant, adding harmonic sophistication borrowed from Black church tradition.'
        }
    ],
    'Gospel/Worship': [
        {
            value: 'I—V/ii—ii—V',
            name: 'I—V/ii—ii—V',
            nickname: 'Gospel Turnaround',
            description: 'Classic gospel turnaround with secondary dominant. V/ii (dominant of ii) creates chromatic approach to ii chord, then traditional ii-V cadence back to I. The secondary dominant adds harmonic sophistication and forward momentum characteristic of Black church music and traditional gospel.'
        },
        {
            value: 'IV—V—iii—vi',
            name: 'IV—V—iii—vi',
            nickname: 'Praise Progression',
            description: 'Uplifting praise and worship progression. Starts on IV (subdominant) for immediate lift rather than I, V adds energy, descends through iii to vi creating gentle resolution. Avoids arriving on I, keeping energy moving forward. Common in contemporary worship and praise choruses.'
        },
        {
            value: 'I—IV—V/vi—vi',
            name: 'I—IV—V/vi—vi',
            nickname: 'Contemporary Worship',
            description: 'Modern worship progression with secondary dominant. Familiar I-IV opening, V/vi (dominant of vi) chromatically approaches relative minor, creating smooth voice leading. The arrival on vi adds introspection and emotion. Defines contemporary Christian music from Hillsong to Bethel.'
        },
        {
            value: 'ii—V—I—IV',
            name: 'ii—V—I—IV',
            nickname: 'Church Cadence',
            description: 'Combines jazz and hymn harmony. Opens with strong ii-V-I cadence borrowed from jazz (common in gospel), adds plagal IV-I motion from traditional hymnody. The two cadence types create satisfying double resolution. Fundamental to gospel piano and Hammond organ playing.'
        },
        {
            value: 'I—V/V—V—vi—IV',
            name: 'I—V/V—V—vi—IV',
            nickname: 'Gospel Rock',
            description: 'Gospel-rock fusion progression. V/V (dominant of dominant) creates chromatic intensity approaching V, then deceptive vi adds emotion, IV completes plagal motion. Combines gospel chromaticism with rock energy. Used in contemporary Christian rock and gospel-influenced pop.'
        },
        {
            value: 'IV—I—V—vi—IV—♭VII',
            name: 'IV—I—V—vi—IV—♭VII',
            nickname: 'Extended Worship',
            description: 'Six-bar extended worship progression. Opens on subdominant for lift, cycles through familiar changes, adds borrowed ♭VII at end for modal color and Mixolydian flavor. The extension allows longer melodic and dynamic builds common in modern worship production and live settings.'
        }
    ],
    'Hip-Hop/Trap': [
        {
            value: 'i—♭VI—♭VII',
            name: 'i—♭VI—♭VII',
            nickname: 'Trap Minor',
            description: 'Essential modern trap progression. Minor tonic with borrowed ♭VI and ♭VII creates dark, modal atmosphere. Short three-chord loop perfect for 808 basslines and hi-hat rolls. Avoids traditional cadences for hypnotic, menacing trap sound from Metro Boomin to Southside.'
        },
        {
            value: 'i—♭III—♭VI—♭VII',
            name: 'i—♭III—♭VI—♭VII',
            nickname: 'Dark Trap',
            description: 'Extended dark trap progression. All borrowed chords from natural minor - ♭III adds hopeful moment before descending to ♭VI and ♭VII. Four-chord loop provides more harmonic movement while maintaining menacing atmosphere. Used in melodic trap and dark hip-hop production.'
        },
        {
            value: 'vi—IV—I',
            name: 'vi—IV—I',
            nickname: 'Sad Trap',
            description: 'Emotional "sad trap" progression. Starts on relative minor for melancholy, IV-I provides familiar resolution. Three-chord simplicity allows focus on melody and 808s. Defines emo-trap and melodic rap from Lil Peep to Juice WRLD, combining hip-hop production with emotional vulnerability.'
        },
        {
            value: 'i—♭VII—♭VI',
            name: 'i—♭VII—♭VI',
            nickname: 'Lofi Hip-Hop',
            description: 'Quintessential lofi hip-hop progression. Minor tonic descends through borrowed ♭VII to ♭VI, creating melancholic, nostalgic atmosphere. Modal ambiguity avoids functional resolution. Perfect for jazzy samples, vinyl crackle, and chill beats to study/relax to. Foundation of YouTube lofi aesthetic.'
        },
        {
            value: 'i—iv—i—♭VI',
            name: 'i—iv—i—♭VI',
            nickname: 'Boom Bap',
            description: 'Classic boom bap hip-hop progression. Minor i-iv establishes somber mood, return to i confirms tonality, borrowed ♭VI adds color before loop. Simple, cyclical changes support focus on drums and sampling. Defines golden age hip-hop from Premier to Pete Rock.'
        },
        {
            value: 'i—♭III—iv—♭VI',
            name: 'i—♭III—iv—♭VI',
            nickname: 'Emo Rap',
            description: 'Emo rap emotional progression. Minor tonic to ♭III creates hopeful lift, minor iv adds vulnerability, ♭VI provides melancholic color. Mix of borrowed chords and diatonic minor creates emotionally complex atmosphere. Used in modern emo rap and alternative hip-hop for introspective lyrics.'
        },
        {
            value: 'I—♭III—♭VII—IV',
            name: 'I—♭III—♭VII—IV',
            nickname: 'West Coast',
            description: 'West Coast G-funk progression. Major tonic with chromatic ♭III (major third below root), ♭VII adds funk flavor, IV is traditional subdominant. Mix of major tonality with modal borrowing creates laid-back, Parliament-influenced sound of Dr. Dre, Snoop Dogg, and G-funk era.'
        },
        {
            value: 'ii7—V7—IM7',
            name: 'ii7—V7—IM7',
            nickname: 'Lofi Jazz',
            paletteFilter: ['minor7', 'major7', 'dom7'],
            description: 'Jazzy, nostalgic palette. All 7th chords, no plain triads - warm, dusty, vinyl vibes.'
        },
        {
            value: 'i—♭VII—iv',
            name: 'i—♭VII—iv',
            nickname: 'Footwork Juke',
            paletteFilter: ['minor', 'minor7', 'major'],
            description: 'Frenetic Chicago palette. Simple harmony for complex 160bpm chopped rhythms.'
        }
    ],
    'Latin/Bossa': [
        {
            value: 'IM7—VI7—ii7—V7',
            name: 'IM7—VI7—ii7—V7',
            nickname: 'Bossa Nova',
            description: 'Classic bossa nova changes. IM7 establishes jazzy tonality, VI7 is chromatic secondary dominant (dominant of ii), then traditional ii7-V7. All 7th chords create sophisticated Brazilian sound. The VI7-ii7 creates smooth chromatic voice leading. Foundation of João Gilberto and Antonio Carlos Jobim.'
        },
        {
            value: 'i—iv—V—i',
            name: 'i—iv—V—i',
            nickname: 'Tango',
            description: 'Traditional Argentine tango progression. Minor i-iv establishes melancholic character, major V creates tension (harmonic minor flavor), resolves to i. The dramatic minor to major V resolution creates passionate, yearning quality essential to tango. Think Piazzolla and traditional milonga.'
        },
        {
            value: 'I—♭II—I—V',
            name: 'I—♭II—I—V',
            nickname: 'Flamenco',
            description: 'Flamenco Phrygian cadence. Major I to ♭II creates characteristic semitone clash (Phrygian mode), return to I, then V. The ♭II is most distinctive flamenco sound, creating Spanish/Moorish character. Used in rumba flamenca, bulerías, and Spanish guitar traditions.'
        },
        {
            value: 'i—V—i—VII',
            name: 'i—V—i—VII',
            nickname: 'Samba',
            description: 'Brazilian samba progression. Minor i-V-i establishes home, major VII (from natural minor, not harmonic) adds brightness and forward motion back to i. The natural VII instead of leading tone creates modal, less European sound characteristic of Brazilian popular music and pagode.'
        },
        {
            value: 'I—V/ii—ii—V/V—V',
            name: 'I—V/ii—ii—V/V—V',
            nickname: 'Latin Jazz',
            description: 'Advanced Latin jazz progression with double secondary dominants. V/ii approaches ii chromatically, V/V (dominant of dominant) intensifies approach to V. Creates maximum harmonic movement through chromatic voice leading. Used in Latin jazz, salsa, and Afro-Cuban jazz for sophisticated color.'
        },
        {
            value: 'i—♭VII—♭VI—V',
            name: 'i—♭VII—♭VI—V',
            nickname: 'Bolero',
            description: 'Romantic bolero progression. Minor i with borrowed ♭VII and ♭VI creates melancholic descent, then major V provides dramatic tension. The modal borrowed chords combined with harmonic minor V creates passionate character. Foundation of Mexican and Cuban bolero tradition from Trio Los Panchos to Luis Miguel.'
        }
    ],
    'Film/Cinematic': [
        {
            value: 'I—♭VI—♭III—♭VII',
            name: 'I—♭VI—♭III—♭VII',
            nickname: 'Epic Trailer',
            description: 'Modern epic trailer progression. Major tonic with all borrowed flat chords creates massive, cinematic sound. Chromatic mediants (♭VI, ♭III) provide dramatic harmonic shifts, ♭VII adds Mixolydian power. Defines Two Steps From Hell, Hans Zimmer trailers, and modern action film marketing.'
        },
        {
            value: 'i—♭VI—♭VII—i',
            name: 'i—♭VI—♭VII—i',
            nickname: 'Dark Cinematic',
            description: 'Dark, ominous film scoring progression. Minor tonic with borrowed ♭VI and ♭VII creates foreboding atmosphere, returns to i for cyclical tension. Modal ambiguity avoids resolution. Used in thriller, horror, and dark drama scoring for sustained psychological tension without traditional cadences.'
        },
        {
            value: 'I—V—vi—♭VI—IV',
            name: 'I—V—vi—♭VI—IV',
            nickname: 'Emotional Score',
            description: 'Emotional orchestral progression. Starts with familiar I-V-vi pop changes, then ♭VI (chromatic mediant) creates unexpected emotional shift before IV resolves. The ♭VI is the "twist" - dramatic moment in narrative. Common in emotional climaxes, character revelations, and romantic film scores.'
        },
        {
            value: 'i—♭III—♭VII—♭VI—V',
            name: 'i—♭III—♭VII—♭VI—V',
            nickname: 'Heroic Theme',
            description: 'Heroic rising action progression. Minor i to major ♭III creates hopeful lift, ♭VII and ♭VI add color, major V (harmonic minor) creates dramatic resolution. Mix of modal borrowing and functional V-i provides both epic scope and satisfying resolution. Used for hero themes and triumphant moments.'
        },
        {
            value: 'I—♭VII—♭VI—♭VII',
            name: 'I—♭VII—♭VI—♭VII',
            nickname: 'Adventure',
            description: 'Adventure and exploration progression. Major I with Mixolydian ♭VII creates optimistic, open sound. The ♭VI adds mysterious color, ♭VII oscillates creating forward motion. Avoids minor chords for pure adventurous feeling. Think Indiana Jones, adventure comedies, and expedition montages.'
        },
        {
            value: 'i—iv—♭VI—♭III',
            name: 'i—iv—♭VI—♭III',
            nickname: 'Suspense',
            description: 'Suspense and mystery progression. Minor i-iv establishes tension, ♭VI adds darkness, ♭III provides brief hope before looping. All borrowed/diatonic minor chords avoid resolution, maintaining constant unease. Perfect for detective work, stalking scenes, and psychological thriller underscore.'
        },
        {
            value: 'I—♭III—♭VI—♭II',
            name: 'I—♭III—♭VI—♭II',
            nickname: 'Chromatic Film',
            description: 'Extreme chromatic mediant progression. All roots are chromatic mediants (major or minor thirds apart). Creates maximum harmonic instability and surprise. The ♭II (Neapolitan) is particularly striking. Used for surreal scenes, dream sequences, psychological breaks, and avant-garde film scoring.'
        }
    ],
    'Folk/Singer-Songwriter': [
        {
            value: 'I—IV—I—V',
            name: 'I—IV—I—V',
            nickname: 'Folk Standard',
            description: 'Simple, timeless folk progression. I-IV establishes home, return to I confirms tonality, V creates tension for next cycle. Two-bar phrase structure perfect for verse-chorus songs. Foundation of American folk from Woody Guthrie to Bob Dylan, emphasizes lyrics over harmonic complexity.'
        },
        {
            value: 'vi—IV—V—I',
            name: 'vi—IV—V—I',
            nickname: 'Sad Folk',
            description: 'Melancholic singer-songwriter progression. Starts on relative minor for introspective opening, IV-V-I creates ascending emotional arc toward resolution. Common in confessional folk and indie. The arc from sadness (vi) to hope (I) mirrors narrative storytelling. Think Elliott Smith, Iron & Wine.'
        },
        {
            value: 'I—V—IV—I',
            name: 'I—V—IV—I',
            nickname: 'Country',
            description: 'Classic country progression. I-V creates tension, IV-I provides plagal "amen" cadence resolution. The IV-I (subdominant-tonic) is gentler than V-I, creating warm, familiar country feel. Foundation of traditional country, bluegrass, and honky-tonk from Hank Williams to modern Nashville.'
        },
        {
            value: 'I—iii—IV—V',
            name: 'I—iii—IV—V',
            nickname: 'Classic Folk',
            description: 'Ascending folk progression. I to iii creates gentle upward motion (mediant relationship), IV-V continues ascending toward I. All diatonic chords create pure, consonant sound. The iii chord adds sophistication beyond simple I-IV-V. Used in traditional folk ballads and singer-songwriter classics.'
        },
        {
            value: 'IV—V—I—vi',
            name: 'IV—V—I—vi',
            nickname: 'Americana',
            description: 'Americana roots progression. Starts on IV (subdominant) for open, yearning feel, V-I provides strong cadence, deceptive vi adds melancholy before loop. Mix of optimism (IV-V-I) and sadness (vi) captures bittersweet Americana character. Common in alt-country and Americana from Wilco to Jason Isbell.'
        },
        {
            value: 'I—V—vi—iii',
            name: 'I—V—vi—iii',
            nickname: 'Irish Folk',
            description: 'Celtic folk progression. Familiar I-V opening, descends to vi then iii. Avoids IV chord, creating different color than typical pop progressions. The descending thirds pattern (V-vi, vi-iii) creates flowing, melodic motion characteristic of Irish ballads and Celtic music traditions.'
        },
        {
            value: 'I—V—vi—IV',
            name: 'I—V—vi—IV',
            nickname: 'Post-Rock Build',
            paletteFilter: ['major', 'quartal', 'major7'],
            description: 'Open, evolving palette. Major chords, quartal voicings, maj7s for textural builds.'
        }
    ],
    'Metal/Rock': [
        {
            value: 'i—♭VI—♭VII—i',
            name: 'i—♭VI—♭VII—i',
            nickname: 'Power Metal',
            description: 'Classic power metal progression. Natural minor i with borrowed ♭VI and ♭VII, returns to i for cycling. All power chords (no thirds) create ambiguous major/minor quality. Driving, anthemic feel perfect for galloping rhythms. Foundation of Iron Maiden, Helloween, and European power metal.'
        },
        {
            value: 'i—♭III—♭VI—♭VII',
            name: 'i—♭III—♭VI—♭VII',
            nickname: 'Doom Metal',
            description: 'Doom metal descending progression. Minor i to major ♭III creates brief hope, descends through ♭VI to ♭VII, avoiding resolution. Slow, crushing tempo emphasizes modal darkness. All borrowed/natural minor chords create oppressive atmosphere. Characteristic of Black Sabbath and doom metal tradition.'
        },
        {
            value: 'i—v—♭VII—iv',
            name: 'i—v—♭VII—iv',
            nickname: 'Prog Metal',
            description: 'Progressive metal progression. Minor i and v (natural minor v, not major V) establish modal sound, ♭VII adds color, minor iv creates plagal motion. Avoids traditional V-i resolution for more sophisticated, modal harmony. Used in prog metal and djent for complex, ambiguous tonality.'
        },
        {
            value: 'i—♭II—i',
            name: 'i—♭II—i',
            nickname: 'Thrash',
            description: 'Aggressive thrash metal progression. Minor i to Neapolitan ♭II creates semitone clash and extreme tension, returns to i. Chromatic, dissonant character perfect for fast tempos and aggressive riffs. The ♭II provides maximum darkness. Characteristic of Slayer, Metallica, and thrash metal intensity.'
        },
        {
            value: 'i—♭VII—♭VI—V',
            name: 'i—♭VII—♭VI—V',
            nickname: 'Melodic Metal',
            description: 'Melodic metal progression with harmonic minor resolution. Descends through borrowed ♭VII and ♭VI, ends on major V (from harmonic minor) creating strong pull to i. Combines modal color with functional cadence. Used in melodic death metal and neoclassical metal for dramatic, European classical-influenced sound.'
        },
        {
            value: 'i—iv—v—i',
            name: 'i—iv—v—i',
            nickname: 'Minor Rock',
            description: 'Pure natural minor rock progression. Minor i-iv-v (all minor/diminished from natural minor scale) avoids harmonic minor\'s major V. Creates darker, more modal sound than classical minor. The natural minor v instead of V reduces tension, creating heavier, less resolved atmosphere for heavy rock and metal.'
        }
    ],
    'Trance/Psytrance/Goa': [
        {
            value: 'i—♭VII—i—♭VI',
            name: 'i—♭VII—i—♭VI',
            nickname: 'Classic Goa',
            description: 'Quintessential Goa trance progression. Minor i oscillates with borrowed ♭VII and ♭VI, creating hypnotic modal atmosphere. Avoids functional resolution, emphasizing cyclical, meditative quality. The borrowed chords from natural minor create psychedelic character. Foundation of early Goa trance from Goa Gil to Astral Projection.'
        },
        {
            value: 'i—♭II—♭VII—i',
            name: 'i—♭II—♭VII—i',
            nickname: 'Phrygian Dominant',
            description: 'Exotic Phrygian Dominant scale progression. Minor i to ♭II (Neapolitan) creates Middle Eastern/Indian character, ♭VII adds modal color, returns to i. The ♭II semitone clash creates mystical, spiritual atmosphere perfect for psychedelic trance. Used in psytrance for ethnic, transcendent sound.'
        },
        {
            value: 'i—V—♭VI—♭VII',
            name: 'i—V—♭VI—♭VII',
            nickname: 'Uplifting Trance',
            description: 'Uplifting trance emotional arc. Minor i to major V (harmonic minor) creates hope, then ♭VI and ♭VII add modal color before cycling. Mix of functional V and modal borrowing creates euphoric lift and release. Defines uplifting trance from Armin van Buuren to Above & Beyond for emotional peaks and breakdowns.'
        },
        {
            value: 'i—iv—VII—III',
            name: 'i—iv—VII—III',
            nickname: 'Harmonic Minor Psy',
            description: 'Pure harmonic minor psytrance progression. Uses harmonic minor scale exclusively - i, iv, major VII, major III. The raised 7th creates exotic augmented second interval. Dramatic, Eastern European character. The major VII and III create bright, ascending motion against dark minor tonic for psychedelic contrast.'
        },
        {
            value: 'i—♭VI—III—VII',
            name: 'i—♭VI—III—VII',
            nickname: 'Dark Psy',
            description: 'Dark psytrance progression mixing modes. Minor i and ♭VI from natural minor, major III and VII from harmonic minor. Creates maximum harmonic ambiguity and tension. Ascending from ♭VI through III to VII builds intensity. Used in dark psy and forest trance for ominous, alien atmosphere.'
        },
        {
            value: 'i—♭III—♭VI—V',
            name: 'i—♭III—♭VI—V',
            nickname: 'Progressive Psy',
            description: 'Progressive psytrance with functional resolution. Borrowed ♭III and ♭VI from natural minor create modal color, major V (harmonic minor) provides strong pull to i. Combines psychedelic modal sound with satisfying resolution. Used in progressive psytrance for structured builds and releases.'
        },
        {
            value: 'i—VII—VI—VII',
            name: 'i—VII—VI—VII',
            nickname: 'Full-On',
            description: 'Full-on psytrance with harmonic minor brightness. Minor i contrasts with major VII and VI (from harmonic minor), VII oscillates for driving energy. The major chords create uplifting, energetic character despite minor tonic. Characteristic of full-on psytrance\'s aggressive, euphoric sound at 140-148 BPM.'
        },
        {
            value: 'i—♭II—VII—V',
            name: 'i—♭II—VII—V',
            nickname: 'Goa Classic',
            description: 'Classic Goa trance with exotic scales. Minor i to ♭II (Phrygian color), major VII and V from harmonic minor. Mix of Phrygian and harmonic minor creates complex, Eastern-influenced sound. The chromatic and exotic intervals create spiritual, psychedelic character of original Goa trance scene.'
        },
        {
            value: 'i—iv—i—VII',
            name: 'i—iv—i—VII',
            nickname: 'Forest Psy',
            description: 'Organic forest psytrance progression. Simple i-iv establishes minor character, return to i, major VII (harmonic minor) adds brightness. Minimal chord changes focus attention on organic textures and complex rhythms. Creates earthy, natural atmosphere characteristic of forest psytrance and darker, minimal psy styles.'
        },
        {
            value: 'i—III—VII—IV',
            name: 'i—III—VII—IV',
            nickname: 'Morning Trance',
            description: 'Bright morning psytrance progression. Minor i contrasts with major III, VII, and IV (from harmonic minor/Dorian mix). The major chords create optimistic, sunrise energy. Ascending motion (i-III-VII) then resolution to IV creates uplifting arc. Used in morning psytrance sets for positive, energetic atmosphere as sun rises.'
        },
        {
            value: 'i—v—♭VII',
            name: 'i—v—♭VII',
            nickname: 'Minimal Trance',
            paletteFilter: ['minor', 'minor7', 'major', 'dom7'],
            description: 'Hypnotic, driving palette. Minor and major triads with 7ths for repetitive loops.'
        }
    ],
    'Jungle/Drum\'n\'Bass': [
        {
            value: 'i—♭VII—♭VI—V',
            name: 'i—♭VII—♭VI—V',
            nickname: 'Liquid DnB',
            description: 'Liquid drum and bass progression. Descends through borrowed ♭VII and ♭VI, resolves with major V (harmonic minor). Creates emotional, melodic atmosphere over fast breakbeats. The functional V-i resolution provides satisfying closure despite dark chords. Defines liquid funk and atmospheric DnB for soulful, jazzy character.'
        },
        {
            value: 'i—♭III—♭VII—iv',
            name: 'i—♭III—♭VII—iv',
            nickname: 'Neurofunk',
            description: 'Dark neurofunk progression. Minor i to ♭III creates chromatic shift, ♭VII and minor iv add modal darkness. Avoids major V for unresolved, mechanical atmosphere. Creates sci-fi, dystopian sound over complex reece basslines. Characteristic of neurofunk and tech step DnB from Noisia to Phace for aggressive, futuristic sound.'
        },
        {
            value: 'i—v—♭VII—iv',
            name: 'i—v—♭VII—iv',
            nickname: 'Jump-Up',
            description: 'Jump-up drum and bass progression. All minor/diminished chords from natural minor - i, v (not major V), ♭VII, iv. Creates bouncy, rolling bassline character. Avoids resolution for continuous energy. Simple, functional harmony supports focus on bass wobbles and ragga samples in jump-up and roller DnB styles.'
        },
        {
            value: 'ii7—V7—IM7—vi7',
            name: 'ii7—V7—IM7—vi7',
            nickname: 'Jazzstep',
            description: 'Jazz-influenced intelligent drum and bass. Classic ii7-V7-IM7 jazz progression with deceptive vi7. All 7th chords create sophisticated, atmospheric sound. Jazz harmony over fast breakbeats defines intelligent DnB and jazzstep. Used by LTJ Bukem, Calibre, and atmospheric jungle producers for refined, musical approach to 170+ BPM.'
        }
    ],
    'Italo-Disco/House': [
        {
            value: 'I—vi—IV—V',
            name: 'I—vi—IV—V',
            nickname: 'Classic Italo',
            description: '1950s doo-wop progression repurposed for Italo disco. I-vi creates gentle melancholy, IV-V completes circle. Simple, romantic changes perfect for synthesizer arpeggios and vocoders. Foundation of 1980s Italo disco from Gazebo to Baltimora, combining nostalgia with futuristic production.'
        },
        {
            value: 'I—iii—vi—IV',
            name: 'I—iii—vi—IV',
            nickname: 'Italo Romantic',
            description: 'Romantic Italo progression. Descends from I through iii to vi (all by thirds), then IV provides lift. Gentle, flowing motion creates dreamy European character. The iii chord adds sophistication beyond typical pop. Used in romantic Italo ballads and emotional house tracks for wistful, nostalgic atmosphere.'
        },
        {
            value: 'I—IV—V—iii',
            name: 'I—IV—V—iii',
            nickname: 'Italo House',
            description: 'Italo house progression. Classic I-IV-V with unexpected iii instead of returning to I. Creates surprise ending before loop, adding interest to four-on-the-floor grooves. The iii chord maintains energy while varying the expected I resolution. Bridge between 80s Italo and 90s Italian house production.'
        },
        {
            value: 'vi—IV—I—V',
            name: 'vi—IV—I—V',
            nickname: 'Italo Pop',
            description: 'Pop-influenced Italo progression. Starts on relative minor for emotion, familiar vi-IV-I sequence, ends on V for strong pull to beginning. Creates perfect loop for dance floor. This progression became ubiquitous in 2000s Europop and EDM, connecting Italo disco tradition to modern electronic pop.'
        },
        {
            value: 'I—V—vi—iii—IV—I',
            name: 'I—V—vi—iii—IV—I',
            nickname: 'Extended Italo',
            description: 'Six-bar extended Italo progression. Pachelbel-inspired descending sequence I-V-vi-iii, then IV-I provides closure. Longer form allows more elaborate melodic and rhythmic development. Used in extended Italo disco tracks and progressive house for building tension and release over longer periods.'
        },
        {
            value: 'IM7—vi7—IVM7—V7',
            name: 'IM7—vi7—IVM7—V7',
            nickname: 'Smooth Italo',
            description: 'Sophisticated Italo with jazz voicings. Classic I-vi-IV-V with all 7th chords creates lush, smooth sound. Major and minor 7ths add harmonic richness beyond simple triads. Represents evolution of Italo toward more refined production. Used in smooth house and nu-disco for sophisticated dancefloor appeal.'
        },
        {
            value: 'i—iv',
            name: 'i—iv',
            nickname: 'Minimal House',
            paletteFilter: ['minor', 'minor7', 'major7'],
            description: 'Hypnotic, stripped-back palette. Clean minor chords with subtle 7th extensions.'
        }
    ],
    'Synthwave/Retrowave': [
        {
            value: 'i—♭VII—♭VI—V',
            name: 'i—♭VII—♭VI—V',
            nickname: 'Outrun',
            description: 'Classic outrun synthwave progression. Descends through borrowed ♭VII and ♭VI from natural minor, resolves with major V from harmonic minor. Creates nostalgic 80s atmosphere with modern production. The V-i resolution provides satisfying cadence. Defines synthwave from Kavinsky to Mitch Murder for retro-futuristic sound.'
        },
        {
            value: 'i—♭III—♭VII—♭VI',
            name: 'i—♭III—♭VII—♭VI',
            nickname: 'Darkwave',
            description: 'Dark synthwave progression. Minor i with all borrowed chords from natural minor creates brooding atmosphere. ♭III provides brief hope before descending to ♭VII and ♭VI. Avoids major V for darker, unresolved character. Used in darksynth and horror synth for menacing, cyberpunk dystopian soundscapes.'
        },
        {
            value: 'I—V—vi—IV',
            name: 'I—V—vi—IV',
            nickname: 'Synthpop',
            description: 'Modern synthpop progression. The ubiquitous "Axis of Awesome" I-V-vi-IV reimagined with vintage synthesizers. Major tonality creates optimistic 80s nostalgia. Simple, catchy changes perfect for vocal hooks and synth melodies. Connects 80s new wave to modern synthpop revival and indie electronic.'
        },
        {
            value: 'i—v—♭VI—♭VII',
            name: 'i—v—♭VI—♭VII',
            nickname: 'Cyberpunk',
            description: 'Cyberpunk synthwave progression. Natural minor i-v (minor v, not major V) establishes dark modal foundation, borrowed ♭VI and ♭VII add dystopian color. Avoids functional resolution for mechanical, futuristic atmosphere. Perfect for sci-fi themes, neon-lit cityscapes, and blade runner-inspired productions.'
        },
        {
            value: 'I—♭VII—♭VI—I',
            name: 'I—♭VII—♭VI—I',
            nickname: 'Dreamwave',
            description: 'Dreamwave progression with Mixolydian flavor. Major I with borrowed ♭VII and ♭VI creates hazy, nostalgic atmosphere, returns to I. The major tonic with flat chords creates bittersweet character. Circular, meditative quality perfect for ambient synthwave and chillwave for dreamy, ethereal retro soundscapes.'
        },
        {
            value: 'vi—IV—I—V',
            name: 'vi—IV—I—V',
            nickname: 'Retrowave Pop',
            description: 'Pop-influenced retrowave progression. Starts on relative minor for emotional depth, cycles through familiar changes with 80s production. Accessible, singalong quality connects synthwave to mainstream pop. Used in radio-friendly retrowave and synthpop for commercial appeal while maintaining retro aesthetic.'
        },
        {
            value: 'i—♭VI—III—♭VII',
            name: 'i—♭VI—III—♭VII',
            nickname: 'Dark Synth',
            description: 'Aggressive dark synth progression. Minor i and borrowed ♭VI from natural minor, major III from harmonic minor creates dramatic lift, ♭VII adds power. Mix of modes creates complex, menacing character. Used in horror synth, dark electro, and aggressive cyberpunk productions for maximum intensity and darkness.'
        },
        {
            value: 'IM7—iii7—vi7—IVM7',
            name: 'IM7—iii7—vi7—IVM7',
            nickname: 'Vaporwave Dream',
            paletteFilter: ['major7', 'minor7', 'dom7'],
            description: 'Nostalgic, dreamy palette. All 7th chords for slowed-down smooth jazz aesthetic.'
        }
    ],
    'African Dance': [
        {
            value: 'I—IV—V—IV',
            name: 'I—IV—V—IV',
            nickname: 'Soukous Sebene',
            description: 'Soukous "sebene" (instrumental break) progression. Major I-IV-V with returning IV creates circular, driving energy. Simple three-chord funk perfect for intricate interlocking guitar lines. The oscillating V-IV creates perpetual motion for dancing. Foundation of Congolese rumba and soukous from Franco to Papa Wemba.'
        },
        {
            value: 'I—IV—I—V',
            name: 'I—IV—I—V',
            nickname: 'Soukous Classic',
            description: 'Classic soukous progression. I-IV establishes tonic-subdominant relationship, return to I confirms home, V creates tension for next cycle. Simple, repetitive changes allow focus on polyrhythmic percussion and guitar interplay. Fundamental to Congolese and East African dance music for hypnotic, celebratory groove.'
        },
        {
            value: 'I—♭VII—IV—I',
            name: 'I—♭VII—IV—I',
            nickname: 'Soukous Modern',
            description: 'Modern soukous with modal color. Major I to borrowed ♭VII creates Mixolydian flavor, IV to I completes plagal cadence. The ♭VII adds contemporary edge while maintaining dancefloor accessibility. Represents evolution of soukous toward Afrobeat and contemporary African pop with Western influences.'
        },
        {
            value: 'I—IV—♭VII—I',
            name: 'I—IV—♭VII—I',
            nickname: 'Makossa Funk',
            description: 'Cameroonian makossa funk progression. I-IV is traditional, borrowed ♭VII adds funk flavor before returning to I. Major tonality with modal ♭VII creates optimistic, danceable character. The plagal motion (IV and ♭VII to I) avoids dominant, creating smooth, grooving quality. Foundation of makossa from Manu Dibango to modern Afropop.'
        }
    ],
    'UK Bass': [
        {
            value: 'i—VII—♭VI',
            name: 'i—VII—♭VI',
            nickname: 'UK Garage',
            paletteFilter: ['minor', 'minor7', 'major'],
            description: 'Soulful, skippy palette. Minor and major chords for skippy 2-step grooves.'
        },
        {
            value: 'i—♭VI',
            name: 'i—♭VI',
            nickname: 'Dubstep Wobble',
            paletteFilter: ['minor', 'diminished', 'dom7'],
            description: 'Dark, aggressive palette. Minor, diminished, dom7 for maximum menace and bass.'
        },
        {
            value: 'i—♭VII—i',
            name: 'i—♭VII—i',
            nickname: 'Breakbeat',
            paletteFilter: ['minor', 'dom7', 'major'],
            description: 'Energetic Big Beat palette. Minor and dominant 7ths for sample-heavy breaks.'
        }
    ],
    'Reggae/Dub': [
        {
            value: 'I—IV—I—V',
            name: 'I—IV—I—V',
            nickname: 'Roots Dub',
            paletteFilter: ['major', 'dom7', 'minor'],
            description: 'Foundation roots palette. Major and dominant 7ths for heavy bassline workouts.'
        },
        {
            value: 'I—V—IV',
            name: 'I—V—IV',
            nickname: 'One Drop',
            paletteFilter: ['major', 'dom7'],
            description: 'Classic reggae foundation. Major triads and dom7s, no minor for authentic feel.'
        },
        {
            value: 'i—♭VII—♭VI',
            name: 'i—♭VII—♭VI',
            nickname: 'Steppers Dub',
            paletteFilter: ['minor', 'major', 'dom7'],
            description: 'Deep, meditative palette. Minor and major mix for steppers 4/4 dub sessions.'
        }
    ],
    'Acid/EBM': [
        {
            value: 'i—iv—♭VII—i',
            name: 'i—iv—♭VII—i',
            nickname: 'EBM Classic',
            paletteFilter: ['minor', 'minor7', 'dom7', 'diminished'],
            description: 'Dark, tense palette. Minor, diminished, dom7 for industrial body music.'
        },
        {
            value: 'i—♭VII—iv',
            name: 'i—♭VII—iv',
            nickname: 'Acid 303',
            paletteFilter: ['minor', 'minor7', 'dom7', 'quartal'],
            description: 'Classic acid palette. Minor 7ths and quartal voicings for TB-303 squelch.'
        },
        {
            value: 'i—♭VI—♭VII',
            name: 'i—♭VI—♭VII',
            nickname: 'Dark Minimal',
            paletteFilter: ['minor', 'diminished', 'dom7'],
            description: 'Harsh, industrial palette. Diminished and dom7s for aggressive minimal techno.'
        }
    ]
};

// ============================================================================
// Core Music Theory Functions
// ============================================================================

export function getKeyOffset(key) {
    const keyMap = {
        'C': 0, 'C♯/D♭': 1, 'D': 2, 'D♯/E♭': 3, 'E': 4, 'F': 5,
        'F♯/G♭': 6, 'G': 7, 'G♯/A♭': 8, 'A': 9, 'A♯/B♭': 10, 'B': 11
    };
    return keyMap[key] || 0;
}

export function getScaleDegrees(mode) {
    const scales = {
        'Major': [0, 2, 4, 5, 7, 9, 11],
        'Minor': [0, 2, 3, 5, 7, 8, 10],
        'Dorian': [0, 2, 3, 5, 7, 9, 10],
        'Phrygian': [0, 1, 3, 5, 7, 8, 10],
        'Lydian': [0, 2, 4, 6, 7, 9, 11],
        'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
        'Locrian': [0, 1, 3, 5, 6, 8, 10],
        'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11],
        'Melodic Minor': [0, 2, 3, 5, 7, 9, 11],
        'Pentatonic Major': [0, 2, 4, 7, 9],
        'Pentatonic Minor': [0, 3, 5, 7, 10],
        'Blues': [0, 3, 5, 6, 7, 10],
        // Symmetrical/Jazz scales
        'Whole Tone': [0, 2, 4, 6, 8, 10],  // 6 notes, all whole steps
        'Diminished (W-H)': [0, 2, 3, 5, 6, 8, 9, 11],  // Whole-Half octatonic
        'Diminished (H-W)': [0, 1, 3, 4, 6, 7, 9, 10],  // Half-Whole octatonic
        'Augmented': [0, 3, 4, 7, 8, 11],  // Hexatonic scale
        // Arabic Maqamat (12-TET approximations)
        'Maqam Hijaz': [0, 1, 4, 5, 7, 8, 11],  // Like Phrygian Dominant
        'Maqam Bayati': [0, 1.5, 3, 5, 7, 8, 10],  // Quarter tone approximated to [0, 2, 3, 5, 7, 8, 10]
        'Maqam Rast': [0, 2, 3.5, 5, 7, 9, 10.5],  // Quarter tone approximated to [0, 2, 4, 5, 7, 9, 11]
        'Maqam Saba': [0, 1.5, 3, 4, 6, 8, 10],  // Quarter tone approximated to [0, 1, 3, 4, 6, 8, 10]
        'Maqam Kurd': [0, 1, 3, 5, 7, 8, 10],  // Like Phrygian
        // Indian Ragas (12-TET approximations)
        'Bhairav': [0, 1, 4, 5, 7, 8, 11],  // Double Harmonic
        'Kafi': [0, 2, 3, 5, 7, 9, 10],  // Like Dorian
        'Yaman': [0, 2, 4, 6, 7, 9, 11],  // Like Lydian
        'Bhairavi': [0, 1, 3, 5, 7, 8, 10],  // Like Phrygian
        'Todi': [0, 1, 3, 6, 7, 8, 11],  // Unique raga scale
        // Exotic scales
        'Double Harmonic': [0, 1, 4, 5, 7, 8, 11],
        'Hungarian Minor': [0, 2, 3, 6, 7, 8, 11],
        'Neapolitan Major': [0, 1, 3, 5, 7, 9, 11],
        'Neapolitan Minor': [0, 1, 3, 5, 7, 8, 11],
        'Enigmatic': [0, 1, 4, 6, 8, 10, 11],
        'Phrygian Dominant': [0, 1, 4, 5, 7, 8, 10],
        'Persian': [0, 1, 4, 5, 6, 8, 11],
        'Hirajoshi': [0, 2, 3, 7, 8],
        'Insen': [0, 1, 5, 7, 10],
        'Kumoi': [0, 2, 3, 7, 9],
        'Egyptian Pentatonic': [0, 2, 5, 7, 10]
    };

    // Handle quarter tone approximations
    const scale = scales[mode] || scales['Major'];
    return scale.map(note => Math.round(note));  // Round any quarter tones to nearest semitone
}

// Get chord quality for a scale degree in a given mode
export function getChordQualityForMode(degree, mode) {
    // Define triads for each mode (0-indexed scale degrees)
    const modeChordQualities = {
        'Major': {
            0: 'major',   // I
            1: 'minor',   // ii
            2: 'minor',   // iii
            3: 'major',   // IV
            4: 'major',   // V
            5: 'minor',   // vi
            6: 'diminished'  // vii°
        },
        'Minor': {
            0: 'minor',   // i
            1: 'diminished',  // ii°
            2: 'major',   // III
            3: 'minor',   // iv
            4: 'minor',   // v
            5: 'major',   // VI
            6: 'major'    // VII
        },
        'Dorian': {
            0: 'minor',   // i
            1: 'minor',   // ii
            2: 'major',   // III
            3: 'major',   // IV
            4: 'minor',   // v
            5: 'diminished',  // vi°
            6: 'major'    // VII
        },
        'Phrygian': {
            0: 'minor',   // i
            1: 'major',   // II
            2: 'major',   // III
            3: 'minor',   // iv
            4: 'diminished',  // v°
            5: 'major',   // VI
            6: 'minor'    // vii
        },
        'Lydian': {
            0: 'major',   // I
            1: 'major',   // II
            2: 'minor',   // iii
            3: 'diminished',  // #iv°
            4: 'major',   // V
            5: 'minor',   // vi
            6: 'minor'    // vii
        },
        'Mixolydian': {
            0: 'major',   // I
            1: 'minor',   // ii
            2: 'diminished',  // iii°
            3: 'major',   // IV
            4: 'minor',   // v
            5: 'minor',   // vi
            6: 'major'    // VII
        },
        'Locrian': {
            0: 'diminished',  // i°
            1: 'major',   // II
            2: 'minor',   // iii
            3: 'minor',   // iv
            4: 'major',   // V
            5: 'major',   // VI
            6: 'minor'    // vii
        },
        'Harmonic Minor': {
            0: 'minor',   // i
            1: 'diminished',  // ii°
            2: 'major',   // III+ (augmented, but using major as fallback)
            3: 'minor',   // iv
            4: 'major',   // V
            5: 'major',   // VI
            6: 'diminished'  // vii°
        },
        'Melodic Minor': {
            0: 'minor',   // i
            1: 'minor',   // ii
            2: 'major',   // III+ (augmented, but using major as fallback)
            3: 'major',   // IV
            4: 'major',   // V
            5: 'diminished',  // vi°
            6: 'diminished'  // vii°
        },
        'Pentatonic Major': {
            0: 'major',   // I
            1: 'minor',   // ii
            2: 'minor',   // iii
            3: 'major',   // V
            4: 'minor'    // vi
        },
        'Pentatonic Minor': {
            0: 'minor',   // i
            1: 'major',   // III
            2: 'minor',   // iv
            3: 'minor',   // v
            4: 'major'    // VII
        },
        'Blues': {
            0: 'minor',   // i
            1: 'major',   // III
            2: 'minor',   // iv
            3: 'major',   // IV (with blue note)
            4: 'minor',   // v
            5: 'major'    // VII
        },
        'Double Harmonic': {
            0: 'major',   // I
            1: 'major',   // II (with b2)
            2: 'major',   // III
            3: 'minor',   // iv
            4: 'major',   // V
            5: 'major',   // VI (with b6)
            6: 'diminished'  // vii°
        },
        'Hungarian Minor': {
            0: 'minor',   // i
            1: 'diminished',  // ii°
            2: 'major',   // III+
            3: 'minor',   // #iv
            4: 'major',   // V
            5: 'major',   // VI
            6: 'diminished'  // vii°
        },
        'Neapolitan Major': {
            0: 'major',   // I
            1: 'major',   // II (with b2)
            2: 'minor',   // iii
            3: 'major',   // IV
            4: 'major',   // V
            5: 'minor',   // vi
            6: 'diminished'  // vii°
        },
        'Neapolitan Minor': {
            0: 'minor',   // i
            1: 'major',   // II (with b2)
            2: 'minor',   // iii
            3: 'minor',   // iv
            4: 'major',   // V
            5: 'major',   // VI
            6: 'diminished'  // vii°
        },
        'Enigmatic': {
            0: 'major',   // I
            1: 'major',   // II (with b2)
            2: 'major',   // III
            3: 'major',   // #IV
            4: 'major',   // #V
            5: 'major',   // #VI
            6: 'diminished'  // vii°
        },
        'Phrygian Dominant': {
            0: 'major',   // I
            1: 'major',   // II (with b2)
            2: 'diminished',  // iii°
            3: 'minor',   // iv
            4: 'minor',   // v
            5: 'major',   // VI (with b6)
            6: 'minor'    // vii
        },
        'Persian': {
            0: 'major',   // I
            1: 'major',   // II (with b2)
            2: 'major',   // III
            3: 'minor',   // iv
            4: 'diminished',  // v° (with b5)
            5: 'major',   // VI (with b6)
            6: 'diminished'  // vii°
        },
        'Hirajoshi': {
            0: 'minor',   // i
            1: 'major',   // II
            2: 'minor',   // iii (with b3)
            3: 'major',   // V
            4: 'major'    // VI (with b6)
        },
        'Insen': {
            0: 'minor',   // i
            1: 'major',   // II (with b2)
            2: 'minor',   // iv
            3: 'minor',   // v
            4: 'major'    // VII (with b7)
        },
        'Kumoi': {
            0: 'minor',   // i
            1: 'major',   // II
            2: 'minor',   // iii (with b3)
            3: 'major',   // V
            4: 'minor'    // vi
        },
        'Egyptian Pentatonic': {
            0: 'minor',   // i
            1: 'major',   // II
            2: 'minor',   // iv
            3: 'minor',   // v
            4: 'major'    // VII (with b7)
        },
        // Symmetrical/Jazz scales
        'Whole Tone': {
            0: 'major',   // I (augmented context)
            1: 'major',   // II
            2: 'major',   // III
            3: 'major',   // #IV
            4: 'major',   // #V
            5: 'major'    // #VI
        },
        'Diminished (W-H)': {
            0: 'diminished',  // i°
            1: 'minor',   // ii
            2: 'diminished',  // iii°
            3: 'major',   // IV
            4: 'diminished',  // v°
            5: 'minor',   // vi
            6: 'diminished',  // vii°
            7: 'major'    // I (octave)
        },
        'Diminished (H-W)': {
            0: 'minor',   // i
            1: 'diminished',  // ii°
            2: 'minor',   // iii
            3: 'diminished',  // iv°
            4: 'minor',   // v
            5: 'diminished',  // vi°
            6: 'minor',   // vii
            7: 'diminished'  // i° (octave)
        },
        'Augmented': {
            0: 'major',   // I (augmented context)
            1: 'minor',   // iii
            2: 'major',   // III
            3: 'major',   // V
            4: 'major',   // VI
            5: 'major'    // VII
        },
        // Arabic Maqamat
        'Maqam Hijaz': {
            0: 'major',   // I
            1: 'major',   // II (with b2)
            2: 'diminished',  // iii°
            3: 'minor',   // iv
            4: 'minor',   // v
            5: 'major',   // VI (with b6)
            6: 'minor'    // vii
        },
        'Maqam Bayati': {
            0: 'minor',   // i
            1: 'major',   // II
            2: 'minor',   // iii
            3: 'minor',   // iv
            4: 'minor',   // v
            5: 'major',   // VI
            6: 'major'    // VII
        },
        'Maqam Rast': {
            0: 'major',   // I
            1: 'major',   // II
            2: 'major',   // III
            3: 'major',   // IV
            4: 'major',   // V
            5: 'minor',   // vi
            6: 'major'    // VII
        },
        'Maqam Saba': {
            0: 'minor',   // i
            1: 'major',   // II (with b2)
            2: 'minor',   // iii
            3: 'diminished',  // iv°
            4: 'major',   // V (with b5)
            5: 'major',   // VI (with b6)
            6: 'major'    // VII
        },
        'Maqam Kurd': {
            0: 'minor',   // i
            1: 'major',   // II
            2: 'major',   // III
            3: 'minor',   // iv
            4: 'diminished',  // v°
            5: 'major',   // VI
            6: 'minor'    // vii
        },
        // Indian Ragas
        'Bhairav': {
            0: 'major',   // I
            1: 'major',   // II (with b2)
            2: 'major',   // III
            3: 'minor',   // iv
            4: 'major',   // V
            5: 'major',   // VI (with b6)
            6: 'diminished'  // vii°
        },
        'Kafi': {
            0: 'minor',   // i
            1: 'minor',   // ii
            2: 'major',   // III
            3: 'major',   // IV
            4: 'minor',   // v
            5: 'diminished',  // vi°
            6: 'major'    // VII
        },
        'Yaman': {
            0: 'major',   // I
            1: 'major',   // II
            2: 'minor',   // iii
            3: 'diminished',  // #iv°
            4: 'major',   // V
            5: 'minor',   // vi
            6: 'minor'    // vii
        },
        'Bhairavi': {
            0: 'minor',   // i
            1: 'major',   // II
            2: 'major',   // III
            3: 'minor',   // iv
            4: 'diminished',  // v°
            5: 'major',   // VI
            6: 'minor'    // vii
        },
        'Todi': {
            0: 'minor',   // i
            1: 'major',   // II (with b2)
            2: 'minor',   // iii
            3: 'diminished',  // #iv°
            4: 'major',   // V
            5: 'major',   // VI (with b6)
            6: 'diminished'  // vii°
        }
    };

    const qualities = modeChordQualities[mode] || modeChordQualities['Major'];

    // For pentatonic and other scales with fewer than 7 degrees, use modulo of actual scale length
    const scaleLength = getScaleDegrees(mode).length;
    return qualities[degree % scaleLength] || 'major';
}

// ============================================================================
// Chord Building Functions
// ============================================================================

export function buildChordRaw(baseNote, chordType) {
    // Helper function that just returns MIDI notes without context
    switch (chordType) {
        case 'major':
            return [baseNote, baseNote + 4, baseNote + 7];
        case 'minor':
            return [baseNote, baseNote + 3, baseNote + 7];
        case 'diminished':
            return [baseNote, baseNote + 3, baseNote + 6];
        case 'major7':
            return [baseNote, baseNote + 4, baseNote + 7, baseNote + 11];
        case 'minor7':
            return [baseNote, baseNote + 3, baseNote + 7, baseNote + 10];
        case 'dom7':
            return [baseNote, baseNote + 4, baseNote + 7, baseNote + 10];
        case 'quartal':
            return [baseNote, baseNote + 5, baseNote + 10];
        default:
            return [baseNote, baseNote + 4, baseNote + 7];
    }
}

export function buildChord(root, chordType, keyOffset) {
    const baseNote = 60 + keyOffset + root;

    switch (chordType) {
        case 'major':
            return [baseNote, baseNote + 4, baseNote + 7];
        case 'minor':
            return [baseNote, baseNote + 3, baseNote + 7];
        case 'diminished':
            return [baseNote, baseNote + 3, baseNote + 6];
        case 'major7':
            return [baseNote, baseNote + 4, baseNote + 7, baseNote + 11];
        case 'minor7':
            return [baseNote, baseNote + 3, baseNote + 7, baseNote + 10];
        case 'dom7':
            return [baseNote, baseNote + 4, baseNote + 7, baseNote + 10];
        case 'quartal':
            return [baseNote, baseNote + 5, baseNote + 10];
        default:
            return [baseNote, baseNote + 4, baseNote + 7];
    }
}

// ============================================================================
// Voice Leading Optimization
// ============================================================================

// Calculate the total voice leading distance between two chords
export function calculateVoiceLeadingDistance(chord1Notes, chord2Notes) {
    // For chords with different numbers of notes, pad the shorter one
    const maxLength = Math.max(chord1Notes.length, chord2Notes.length);
    const notes1 = [...chord1Notes];
    const notes2 = [...chord2Notes];

    while (notes1.length < maxLength) notes1.push(notes1[notes1.length - 1] + 12);
    while (notes2.length < maxLength) notes2.push(notes2[notes2.length - 1] + 12);

    // Calculate minimum total distance using Hungarian algorithm approximation
    // For simplicity, we'll use a greedy approach
    let totalDistance = 0;
    const used = new Set();

    notes1.forEach(note1 => {
        let minDist = Infinity;
        let closestIndex = -1;

        notes2.forEach((note2, idx) => {
            if (!used.has(idx)) {
                const dist = Math.abs(note1 - note2);
                if (dist < minDist) {
                    minDist = dist;
                    closestIndex = idx;
                }
            }
        });

        if (closestIndex >= 0) {
            totalDistance += minDist;
            used.add(closestIndex);
        }
    });

    return totalDistance;
}

// Generate all reasonable inversions of a chord within a comfortable range
export function generateInversions(chordNotes) {
    const inversions = [];
    const baseChord = [...chordNotes];

    // Root position
    inversions.push([...baseChord]);

    // First inversion (move root up an octave)
    if (baseChord.length >= 2) {
        const firstInv = [...baseChord];
        firstInv[0] += 12;
        inversions.push(firstInv.sort((a, b) => a - b));
    }

    // Second inversion (move root and third up an octave)
    if (baseChord.length >= 3) {
        const secondInv = [...baseChord];
        secondInv[0] += 12;
        secondInv[1] += 12;
        inversions.push(secondInv.sort((a, b) => a - b));
    }

    // Drop voicings (move top note down an octave)
    if (baseChord.length >= 3) {
        const drop2 = [...baseChord];
        drop2[drop2.length - 1] -= 12;
        inversions.push(drop2.sort((a, b) => a - b));
    }

    return inversions;
}

// Find the best inversion for smooth voice leading
export function findBestVoicing(targetChordNotes, previousChordNotes) {
    if (!previousChordNotes) {
        return targetChordNotes; // First chord, use root position
    }

    const inversions = generateInversions(targetChordNotes);
    let bestInversion = targetChordNotes;
    let minDistance = Infinity;

    inversions.forEach(inversion => {
        const distance = calculateVoiceLeadingDistance(previousChordNotes, inversion);
        if (distance < minDistance) {
            minDistance = distance;
            bestInversion = inversion;
        }
    });

    return bestInversion;
}

// Optimize voice leading for an entire progression
export function optimizeVoiceLeading(chordProgression) {
    if (chordProgression.length === 0) return chordProgression;

    const optimized = [];
    let previousNotes = null;

    chordProgression.forEach((chord, index) => {
        const optimizedNotes = findBestVoicing(chord.notes, previousNotes);

        optimized.push({
            ...chord,
            notes: optimizedNotes
        });

        previousNotes = optimizedNotes;
    });

    return optimized;
}

// Helper: Build a voicing from a given bass note and pitch classes
function buildVoicingFromBass(bassNote, uniquePCs) {
    const voicing = [bassNote];
    let currentNote = bassNote;

    for (let i = 1; i < uniquePCs.length; i++) {
        const targetPC = uniquePCs[i];
        // Find next occurrence of this pitch class
        let nextNote = currentNote + 1;
        while ((nextNote % 12) !== targetPC && nextNote < bassNote + 24) {
            nextNote++;
        }
        if (nextNote < bassNote + 24) { // Keep within 2 octaves
            voicing.push(nextNote);
            currentNote = nextNote;
        }
    }

    return voicing;
}

// Generate more comprehensive voicings for smooth voice leading
function generateSmoothVoicings(chordNotes) {
    const voicings = [];
    const sorted = [...chordNotes].sort((a, b) => a - b);
    const pitchClasses = sorted.map(n => n % 12);
    const uniquePCs = [...new Set(pitchClasses)];

    // Try different bass notes within a reasonable range (C3 to C5)
    for (let bassNote = 48; bassNote <= 72; bassNote++) {
        if (uniquePCs.includes(bassNote % 12)) {
            const voicing = buildVoicingFromBass(bassNote, uniquePCs);
            if (voicing.length === uniquePCs.length) {
                voicings.push(voicing);
            }
        }
    }

    return voicings;
}

// Analyze voice leading quality with comprehensive scoring
function scoreVoiceLeading(currentNotes, previousNotes) {
    if (!previousNotes || previousNotes.length === 0) {
        // First chord - score based on range comfort
        const lowest = Math.min(...currentNotes);
        const highest = Math.max(...currentNotes);
        const rangePenalty = (lowest < 48 || highest > 84) ? 20 : 0; // Prefer C3-C6 range
        return { score: rangePenalty, breakdown: { range: rangePenalty } };
    }

    let score = 0;
    const breakdown = {};

    // Pad arrays to same length
    const maxLen = Math.max(currentNotes.length, previousNotes.length);
    const curr = [...currentNotes].sort((a, b) => a - b);
    const prev = [...previousNotes].sort((a, b) => a - b);

    while (curr.length < maxLen) curr.push(curr.at(-1) + 12);
    while (prev.length < maxLen) prev.push(prev.at(-1) + 12);

    // Match voices using greedy algorithm (simpler than Hungarian)
    const movements = [];
    const used = new Set();

    prev.forEach(prevNote => {
        let minDist = Infinity;
        let bestIdx = -1;

        curr.forEach((currNote, idx) => {
            if (!used.has(idx)) {
                const dist = Math.abs(currNote - prevNote);
                if (dist < minDist) {
                    minDist = dist;
                    bestIdx = idx;
                }
            }
        });

        if (bestIdx >= 0) {
            movements.push({ from: prevNote, to: curr[bestIdx], distance: minDist });
            used.add(bestIdx);
        }
    });

    // 1. Total voice movement (weight: 1.0) - primary criterion
    const totalMovement = movements.reduce((sum, m) => sum + m.distance, 0);
    score += totalMovement;
    breakdown.totalMovement = totalMovement;

    // 2. Common tones bonus (weight: -5 per common tone)
    const commonTones = movements.filter(m => m.distance === 0).length;
    const commonToneBonus = commonTones * -5;
    score += commonToneBonus;
    breakdown.commonTones = commonToneBonus;

    // 3. Step-wise motion bonus (weight: -2 per step)
    const stepwiseMotions = movements.filter(m => m.distance > 0 && m.distance <= 2).length;
    const stepwiseBonus = stepwiseMotions * -2;
    score += stepwiseBonus;
    breakdown.stepwise = stepwiseBonus;

    // 4. Contrary motion bonus (weight: -3 per instance)
    let contraryMotionCount = 0;
    for (let i = 0; i < movements.length; i++) {
        for (let j = i + 1; j < movements.length; j++) {
            const dir1 = Math.sign(movements[i].to - movements[i].from);
            const dir2 = Math.sign(movements[j].to - movements[j].from);
            if (dir1 !== 0 && dir2 !== 0 && dir1 !== dir2) {
                contraryMotionCount++;
            }
        }
    }
    const contraryMotionBonus = contraryMotionCount * -3;
    score += contraryMotionBonus;
    breakdown.contraryMotion = contraryMotionBonus;

    // 5. Range penalty (weight: +10 per note outside C3-C6)
    const outOfRange = curr.filter(n => n < 48 || n > 84).length;
    const rangePenalty = outOfRange * 10;
    score += rangePenalty;
    breakdown.range = rangePenalty;

    // 6. Large leap penalty (weight: +2 per semitone beyond a major third)
    const leapPenalty = movements.reduce((sum, m) => {
        if (m.distance > 4) {
            return sum + (m.distance - 4) * 2;
        }
        return sum;
    }, 0);
    score += leapPenalty;
    breakdown.leaps = leapPenalty;

    return { score, breakdown };
}

// Find best voicing using comprehensive smooth voice leading scoring
function findBestSmoothVoicing(targetChordNotes, previousChordNotes) {
    if (!previousChordNotes) {
        // First chord - use comfortable mid-range root position
        const sorted = [...targetChordNotes].sort((a, b) => a - b);
        const bass = sorted[0];

        // Transpose to comfortable range (C4 = 60)
        const targetBass = 60;
        const offset = targetBass - bass;
        return sorted.map(n => n + offset);
    }

    const voicings = generateSmoothVoicings(targetChordNotes);
    let bestVoicing = targetChordNotes;
    let bestScore = Infinity;

    voicings.forEach(voicing => {
        const { score } = scoreVoiceLeading(voicing, previousChordNotes);
        if (score < bestScore) {
            bestScore = score;
            bestVoicing = voicing;
        }
    });

    return bestVoicing;
}

// Optimize voice leading with comprehensive smooth scoring
export function optimizeSmoothVoiceLeading(chordProgression) {
    if (chordProgression.length === 0) return chordProgression;

    const optimized = [];
    let previousNotes = null;

    chordProgression.forEach((chord, index) => {
        const optimizedNotes = findBestSmoothVoicing(chord.notes, previousNotes);

        optimized.push({
            ...chord,
            notes: optimizedNotes
        });

        previousNotes = optimizedNotes;
    });

    return optimized;
}

// Create close voicing (all notes within an octave or close together)
export function applyCloseVoicing(chordNotes) {
    if (chordNotes.length === 0) return chordNotes;

    const sorted = [...chordNotes].sort((a, b) => a - b);
    const bass = sorted[0];
    const pitchClasses = sorted.map(note => note % 12);

    // Build close voicing starting from bass note
    const closeVoiced = [bass];
    let currentNote = bass;

    for (let i = 1; i < pitchClasses.length; i++) {
        const targetPC = pitchClasses[i];
        // Find the next note above current that matches this pitch class
        let nextNote = currentNote + 1;
        while ((nextNote % 12) !== targetPC) {
            nextNote++;
        }
        closeVoiced.push(nextNote);
        currentNote = nextNote;
    }

    return closeVoiced;
}

// Create open voicing (spread notes across multiple octaves)
export function applyOpenVoicing(chordNotes) {
    if (chordNotes.length < 3) return chordNotes;

    const sorted = [...chordNotes].sort((a, b) => a - b);

    // Drop-2 voicing: move second-highest note down an octave
    const openVoiced = [...sorted];
    if (openVoiced.length >= 3) {
        openVoiced[openVoiced.length - 2] -= 12;
    }

    return openVoiced.sort((a, b) => a - b);
}

// Create spread voicing (maximum distance between voices)
export function applySpreadVoicing(chordNotes) {
    if (chordNotes.length < 3) return chordNotes;

    const sorted = [...chordNotes].sort((a, b) => a - b);
    const bass = sorted[0];
    const pitchClasses = sorted.map(note => note % 12);

    // Spread voices across wider range
    const spreadVoiced = [bass];
    let octaveOffset = 0;

    for (let i = 1; i < pitchClasses.length; i++) {
        const targetPC = pitchClasses[i];
        // Add notes in higher octaves
        octaveOffset += (i === 1) ? 7 : 5; // Skip larger intervals
        let nextNote = bass + octaveOffset;
        while ((nextNote % 12) !== targetPC) {
            nextNote++;
        }
        spreadVoiced.push(nextNote);
    }

    return spreadVoiced.sort((a, b) => a - b);
}

// Apply voicing style to a progression
export function applyVoicingStyle(chordProgression, voicingType = 'default') {
    if (voicingType === 'default') return chordProgression;

    return chordProgression.map(chord => {
        let voicedNotes = chord.notes;

        switch (voicingType) {
            case 'close':
                voicedNotes = applyCloseVoicing(chord.notes);
                break;
            case 'open':
                voicedNotes = applyOpenVoicing(chord.notes);
                break;
            case 'spread':
                voicedNotes = applySpreadVoicing(chord.notes);
                break;
        }

        return {
            ...chord,
            notes: voicedNotes
        };
    });
}

// ============================================================================
// Note Naming and Enharmonic Spelling
// ============================================================================

export function getEnharmonicContext(rootMidi, romanNumeral) {
    // Determine if we should use sharps or flats based on roman numeral
    const rootPitchClass = rootMidi % 12;

    // Borrowed chords with flats prefer flat spelling
    if (romanNumeral && (romanNumeral.includes('♭VII') || romanNumeral.includes('♭VI') ||
        romanNumeral.includes('♭III') || romanNumeral.includes('♭II') || romanNumeral === 'SubV7')) {
        return 'flats';
    }

    // Sharp alterations prefer sharp spelling
    if (romanNumeral && (romanNumeral.includes('♯') || romanNumeral === '#VI')) {
        return 'sharps';
    }

    // Use flats for Db, Eb, Gb, Ab, Bb pitch classes in most contexts
    if ([1, 3, 6, 8, 10].includes(rootPitchClass) && !romanNumeral?.includes('♯')) {
        return 'flats';
    }

    return 'sharps';
}

export function getNoteNameWithContext(midiNote, preferFlats = false) {
    const sharpNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const flatNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    const pitchClass = midiNote % 12;
    return preferFlats ? flatNames[pitchClass] : sharpNames[pitchClass];
}

export function spellChordNotes(rootMidiOrNotes, chordType, romanNumeral = '') {
    // If first parameter is an array, use actual voicing notes; otherwise rebuild chord
    let notes;
    let rootMidi;

    if (Array.isArray(rootMidiOrNotes)) {
        // Using actual voicing - find the root note (lowest pitch class that matches chord)
        notes = rootMidiOrNotes;

        // For proper spelling, we need the theoretical root (not necessarily the bass)
        // Build the chord in root position to identify pitch classes
        const sorted = [...notes].sort((a, b) => a - b);
        const bassPitchClass = sorted[0] % 12;

        // Try to identify root: for major/minor chords, root is usually present
        // Default to bass note as root
        rootMidi = sorted[0];

        // Try to find the actual chord root by checking pitch classes
        const pitchClasses = new Set(notes.map(n => n % 12));

        // For major chords, root + 4 + 7 semitones
        // For minor chords, root + 3 + 7 semitones
        const majorInterval = (bassPitchClass + 4) % 12;
        const minorInterval = (bassPitchClass + 3) % 12;
        const fifthInterval = (bassPitchClass + 7) % 12;

        // Check if bass is root (has third and fifth above it)
        const bassIsRoot = (chordType.includes('minor') && pitchClasses.has(minorInterval) && pitchClasses.has(fifthInterval)) ||
                          (chordType.includes('major') && pitchClasses.has(majorInterval) && pitchClasses.has(fifthInterval));

        if (!bassIsRoot) {
            // For inversions or complex voicings, find root by checking all notes
            for (const note of sorted) {
                const pc = note % 12;
                const thirdUp = (pc + (chordType.includes('minor') ? 3 : 4)) % 12;
                const fifthUp = (pc + 7) % 12;

                if (pitchClasses.has(thirdUp) && pitchClasses.has(fifthUp)) {
                    rootMidi = note;
                    break;
                }
            }
        }
    } else {
        // Legacy mode: rebuild chord from root
        rootMidi = rootMidiOrNotes;
        notes = buildChordRaw(rootMidi, chordType);
    }

    // Determine spelling preference
    const useFlats = getEnharmonicContext(rootMidi, romanNumeral) === 'flats';

    // Spell notes properly in thirds
    const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const rootName = getNoteNameWithContext(rootMidi, useFlats).replace(/[#b]/g, '');
    const rootIndex = noteNames.indexOf(rootName);

    const spelled = notes.map((midi, i) => {
        // Calculate expected note letter (every other letter = third)
        const expectedIndex = (rootIndex + i * 2) % 7;
        const expectedLetter = noteNames[expectedIndex];

        // Get actual pitch class
        const pitchClass = midi % 12;
        const octave = Math.floor(midi / 12) - 2;

        // Find the spelling that matches the expected letter
        const sharpName = getNoteNameWithContext(midi, false);
        const flatName = getNoteNameWithContext(midi, true);

        let noteName;
        if (sharpName[0] === expectedLetter) {
            noteName = sharpName;
        } else if (flatName[0] === expectedLetter) {
            noteName = flatName;
        } else {
            // Need double sharp or double flat
            const letterPitches = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
            const expectedPitch = letterPitches[expectedLetter];
            const difference = (pitchClass - expectedPitch + 12) % 12;

            if (difference === 1) {
                noteName = expectedLetter + '#';
            } else if (difference === 2) {
                noteName = expectedLetter + '##';
            } else if (difference === 11) {
                noteName = expectedLetter + 'b';
            } else if (difference === 10) {
                noteName = expectedLetter + 'bb';
            } else {
                noteName = useFlats ? flatName : sharpName;
            }
        }

        return noteName + octave;
    });

    return spelled;
}

export function getChordName(degree, chordType, keyOffset, romanNumeral = '') {
    const midiNote = 60 + keyOffset + degree;
    const useFlats = getEnharmonicContext(midiNote, romanNumeral) === 'flats';
    const rootNote = getNoteNameWithContext(midiNote, useFlats);

    switch (chordType) {
        case 'minor':
        case 'minor7':
            return rootNote + 'm' + (chordType === 'minor7' ? '7' : '');
        case 'diminished':
            return rootNote + 'dim';
        case 'major7':
            return rootNote + 'maj7';
        case 'dom7':
            return rootNote + '7';
        case 'quartal':
            return rootNote + 'sus4';
        default:
            return rootNote;
    }
}

// Detect chord inversion and return slash notation if inverted
export function getInversionNotation(notes, chordType, chordName, romanNumeral = '') {
    if (!notes || notes.length < 3) return '';

    const sorted = [...notes].sort((a, b) => a - b);
    const bassPitchClass = sorted[0] % 12;

    // Build root position chord to identify expected intervals
    const pitchClasses = notes.map(n => n % 12);
    const pitchClassSet = new Set(pitchClasses);

    // Define interval structures for different chord types
    let thirdInterval, fifthInterval;

    if (chordType.includes('minor')) {
        thirdInterval = 3; // minor third
        fifthInterval = 7; // perfect fifth
    } else if (chordType.includes('diminished')) {
        thirdInterval = 3; // minor third
        fifthInterval = 6; // diminished fifth
    } else {
        // major or dominant
        thirdInterval = 4; // major third
        fifthInterval = 7; // perfect fifth
    }

    // Try to find the root by checking which note forms the expected intervals
    let rootPitchClass = null;

    for (const pc of pitchClassSet) {
        const third = (pc + thirdInterval) % 12;
        const fifth = (pc + fifthInterval) % 12;

        if (pitchClassSet.has(third) && pitchClassSet.has(fifth)) {
            rootPitchClass = pc;
            break;
        }
    }

    // If we couldn't find root by intervals, assume lowest note's pitch class
    if (rootPitchClass === null) {
        rootPitchClass = bassPitchClass;
    }

    // Check if bass is root position
    if (bassPitchClass === rootPitchClass) {
        return ''; // Root position, no inversion notation needed
    }

    // Get the bass note name with octave number for slash notation
    const bassNote = sorted[0];
    const useFlats = getEnharmonicContext(bassNote, romanNumeral) === 'flats';
    const bassNoteName = getNoteNameWithContext(bassNote, useFlats);
    const bassOctave = Math.floor(bassNote / 12) - 2; // Convert MIDI to octave number

    // Return slash notation with octave (e.g., /Eb3)
    return '/' + bassNoteName + bassOctave;
}

export function getRomanNumeral(degree, isMinor = false, isDim = false) {
    const numerals = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii'];
    let numeral = numerals[degree] || 'I';

    if (isDim) {
        numeral += '°';
    }

    return numeral;
}

// ============================================================================
// Progression Parsing and Generation
// ============================================================================

function parseProgression(progressionString) {
    const chords = progressionString.split('—');
    return chords.map(chord => {
        // Remove any quality indicators for parsing
        const cleanChord = chord.replace(/M7|m7|7|°|dim|maj|min/g, '');

        // Parse roman numerals
        const romanToNumber = {
            'i': 0, 'I': 0,
            'ii': 1, 'II': 1, '♭II': 1,
            'iii': 2, 'III': 2, '♭III': 2,
            'iv': 3, 'IV': 3,
            'v': 4, 'V': 4,
            'vi': 5, 'VI': 5, '♭VI': 5,
            'vii': 6, 'VII': 6, '♭VII': 6,
            '♯I': 1, '♯II': 3, '♯iv': 4, '♭IIIM7': 2, '♭VIM7': 5
        };

        // Special cases
        if (cleanChord === '♯I°') return { degree: 1, quality: 'diminished', alteration: 'sharp' };
        if (cleanChord === '♯II°') return { degree: 3, quality: 'diminished', alteration: 'sharp' };
        if (cleanChord === '♯iv°') return { degree: 4, quality: 'diminished', alteration: 'sharp' };

        // Determine if flat or sharp
        let alteration = '';
        if (cleanChord.includes('♭')) alteration = 'flat';
        if (cleanChord.includes('♯')) alteration = 'sharp';

        // Get base numeral
        const baseChord = cleanChord.replace(/♭|♯/g, '');
        const degree = romanToNumber[baseChord] !== undefined ? romanToNumber[baseChord] : 0;

        // Determine quality from original chord string
        let quality = 'major';
        if (chord.includes('°') || chord.includes('dim')) {
            quality = 'diminished';
        } else if (chord.includes('M7') || chord.includes('maj7')) {
            quality = 'major7';
        } else if (chord.includes('m7')) {
            quality = 'minor7';
        } else if (chord.match(/[IV]7/) && !chord.includes('M7')) {
            quality = 'dom7';
        } else if (baseChord === baseChord.toLowerCase() ||
                  (baseChord === 'ii' || baseChord === 'iii' || baseChord === 'vi' || baseChord === 'vii')) {
            quality = 'minor';
        }

        return { degree, quality, alteration };
    });
}

export function generateProgressionChords(progressionString, keyOffset, scaleDegrees, selectedMode) {
    let progression = [];

    // Special handling for 12-bar blues
    if (progressionString === '12-bar-blues') {
        // 12-bar blues pattern: I-I-I-I-IV-IV-I-I-V-IV-I-V
        const pattern = [0, 0, 0, 0, 3, 3, 0, 0, 4, 3, 0, 4];
        pattern.forEach(degree => {
            const scaleDegree = scaleDegrees[degree % scaleDegrees.length];
            const chordType = degree === 4 ? 'dom7' : 'major';
            progression.push({
                degree,
                notes: buildChord(scaleDegree, chordType, keyOffset),
                chordType,
                chordName: getChordName(scaleDegree, chordType, keyOffset),
                romanNumeral: getRomanNumeral(degree, false, false)
            });
        });
    } else {
        const parsedChords = parseProgression(progressionString);
        progression = parsedChords.map(({ degree, quality, alteration }) => {
            // OPTION A: Pure parallel major analysis (r/MusicTheory approved!)
            // ALL roman numerals reference the parallel major scale, regardless of mode.
            // The chord quality is determined ONLY by the roman numeral itself:
            //   - Uppercase (I, V, etc.) = major
            //   - Lowercase (i, vi, etc.) = minor
            //   - Symbols (°, 7, etc.) = diminished, dominant 7th, etc.
            // This is standard Roman numeral analysis convention.

            // Always use major scale as reference
            const majorScale = [0, 2, 4, 5, 7, 9, 11];
            let scaleDegree = majorScale[degree % majorScale.length];

            // Apply alterations (♭, ♯) relative to major scale
            if (alteration === 'flat') {
                scaleDegree = (scaleDegree - 1 + 12) % 12;
            } else if (alteration === 'sharp') {
                scaleDegree = (scaleDegree + 1) % 12;
            }

            // Quality is already determined by parseProgression() based on the numeral itself
            // No need to override it based on mode

            const notes = buildChord(scaleDegree, quality, keyOffset);
            const chordName = getChordName(scaleDegree, quality, keyOffset);

            // Create roman numeral with proper formatting
            const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
            let romanNumeral = numerals[degree] || 'I';

            if (quality === 'minor' || quality === 'minor7') {
                romanNumeral = romanNumeral.toLowerCase();
            }
            if (quality === 'diminished') {
                romanNumeral += '°';
            }
            if (quality === 'dom7' && degree === 4) {
                romanNumeral = 'V7';
            }
            if (alteration === 'flat') {
                romanNumeral = '♭' + romanNumeral;
            } else if (alteration === 'sharp') {
                romanNumeral = '♯' + romanNumeral;
            }

            return {
                degree,
                notes,
                chordType: quality,
                chordName,
                romanNumeral
            };
        });
    }

    // Apply voice leading optimization to the progression
    return optimizeVoiceLeading(progression);
}
