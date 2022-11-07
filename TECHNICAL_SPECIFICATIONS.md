# Technical specifications
This document will detail the inner workings of subliminal, and will hopefully break down many of the complex processes going on behind the simple facade of the site.

## Live Edit
tbc

## Poem Purgatory
tbc

## Accounts
tbc

## The poem styling protocol
This engine is responsible for providing a cross platform solution for rendering poems on subliminal with rich text features. It's function is to be as easy to integrate both into a poem rich text editor, with little intense string manipulation or calculation in order to display the correct styles, to be small, or easily compressable, to make poem loading and server storage quick, and to be easily decodable, into HTML or another alike markup language, by a poem styling engine implementation.

### Intended function:
In *uncompressed* mode, the protocol consists of a marker, which identifies the style that the unicode character proceeding it should inherit, multiple markers may be placed before a character to allow it to inherit multiple styles, such as bold and italic, the marker type used when only referencing the next character, and no more (one char) is an end marker, to tell the engine that it does not need to seek for any closes to that style after.

In *compressed* mode, these markers perform much more like HTML elements, with the markers consisting of a start and end range (using start and end markers), where everything between the start and end marker (with the character proceeding the end marker included) inheriting that style.


**Markers:**

\0x00..\0x80
(0 - 128)

Marker codes (done in HEX in real world):
 - 0 : Bold start
 - 1 : Italic start
 - 2 : Underline start
 - 3 : Monospace start (font)
 - 4 : Fantasy start (font)
 - 5 : Cursive start (font)
 - 6 : Serif start (font)
 - 7..39 : Text red start (32)
 - 40..72 : Text green start (32)
 - 73..105 : Text blue start (32)

**Endmarkers:**

\0x80...\0x100
(128 - 256)

 - Same as start markers, but starts at 128, going upwards


Every string, we split into bytes, and check for markers. If the system is implemented correctly a poem should be able to be read from start to end by the engine, with no backwards scanning/treading needed to render the styles.