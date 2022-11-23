// Subliminal poem styling engine (c) Zekiah-A
// See TECHNICAL_SPECIFICATIONS.md for information on how this works.

const markerType = {
    // Specials
    EndChar: 0,
    StartChar: 255,

    // Absolute marker values
    BoldStart: 1,
    ItalicStart: 2,
    UnderlineStart: 3,
    MonospaceStart: 4,
    FantasyStart: 5,
    CursiveStart: 6,
    SerifStart: 7,

    // Ranges 7..39, 40..72, 73..105
    TextRedStart: 8,
    TextBlueStart: 41,
    TextGreenStart: 74,

    //Absolute marker values
    BoldEnd: 107,
    ItalicEnd: 108,
    UnderlineEnd: 109,
    MonospaceEnd: 110,
    FantasyEnd: 111,
    CursiveEnd: 112,
    SerifEnd: 113,

    // Ranges
    TextRedEnd: 114,
    TextBlueEnd: 147,
    TextGreenEnd: 180,
}

const encoder = new TextEncoder()
const decoded = new TextDecoder()

// Creates the data that should be appened to the current buffer,
// that contains the character shifted by one byte, with styles attached 
function createCharacterData(character, withStyles = []) {
    // Create character, data = char(2) + endcharMarker (1) + withStyles(length)
    let data = new Uint8Array(4 + withStyles.length)
    let view = new DataView(data.buffer)
    let char = encoder.encode(character)[0]
    
    let i = 0
    while (i < withStyles.length) {
        if (withStyles[i] <= markerType.BoldEnd || withStyles[i] >= markerType.TextGreenEnd) continue
        view.setUint8(i, withStyles[i])
        i++
    }
    
    // UFT8-16, we assume char code will never be 0 or 255 because that is stupid
    console.log(i)
    view.setUint8(i, markerType.StartChar)
    view.setUint16(i++, char)
    view.setUint8(i+=2, markerType.EndChar)
    
    return view.buffer
}

// Iterate through each character, and appply the appropiate styles to each.
function applyStyle(style, startIndex, endindex = null) {

}

function removeStyle(style, startIndex, endIndex = null) {

}

function decompressToPlaintext(input) {
    return input
}

//Working style is used in poem editor
function decompressToWorkingStyle(input) {
    return input
}

//Poem style is used in actual poems (much more compact)
function compressToPoemStyle(input) {
    return input
}
