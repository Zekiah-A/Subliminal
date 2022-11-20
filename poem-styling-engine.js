// Subliminal poem styling engine (c) Zekiah-A
// See TECHNICAL_SPECIFICATIONS.md for information on how this works.

const markerType = {
    // Absolute marker values
    BoldStart: 0,
    ItalicStart: 1,
    UnderlineStart: 2,
    MonospaceStart: 3,
    FantasyStart: 4,
    CursiveStart: 5,
    SerifStart: 6,

    // Ranges 7..39, 40..72, 73..105
    TextRedStart: 7,
    TextBlueStart: 40,
    TextGreenStart: 73,
    AnnotationRegionStart: 105,

    //Absolute marker values
    BoldEnd: 128,
    ItalicEnd: 129,
    UnderlineEnd: 130,
    MonospaceEnd: 131,
    FantasyEnd: 132,
    CursiveEnd: 133,
    SerifEnd: 134

    // Ranges
    //tbc.
}

const encoder = new TextEncoder()
const decoded = new TextDecoder("utf-8")

// Creates the data that should be appened to the current buffer,
// that contains the character shifted by one byte, with styles attached 
function createCharacterData(character, withStyles) {
    //Create character and shift by one byte
    let dataBuffer = new Uint8Array()
    let view = new DataView(dataBuffer)
    let shifted = encoder.encode(character)[0] + 256
    
    //Write the code (if marker is an end marker) of each style to dataview, then write the char itself finally
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