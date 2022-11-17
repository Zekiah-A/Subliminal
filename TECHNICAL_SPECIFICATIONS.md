# Technical specifications
This document will detail the inner workings of subliminal, and will hopefully break down many of the complex processes going on behind the simple facade of the site.

## Live Edit
tbc

## Poem Purgatory
tbc

## Accounts
tbc

## Poem signing format:
A poem signature is made up of only white and black pixels, this means that each pixel can be encoded as a single binary number (1 - black, 0 - white), to save space.

```
_________________________________
| x |   | x |   | x | x |   |   |
```

This means that we must split the image into bytes, each 8 pixels across is one byte horizontally = signCanvas.width / 8, vertically = signCanvas.height, as the bytes are 1D. We then assign the pixel to it's respective byte and bit in that byte. This can then all be combined into a buffer which can be compactly saved on the server.

**Limitations:**

Canvas has to be a multiple of 8 in width, else special byte operations would be necessary to wrap around the end of a row. We must convert back to unicode, as the server uses JSON, saving a pure bytearray as json has no advantage, as [ 128, 14, 26 ] as each character here will be a byte each. Therefore we should encode it to a base64 string, which is the most compact you can get with json.

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
 - 105..127 : Poem annotation region (22)
 
**Endmarkers:**

\0x80...\0x100
(128 - 255)

 - Same as start markers, but starts at 128, going upwards


Every string, we split into bytes, and check for markers. If the system is implemented correctly a poem should be able to be read from start to end by the engine, with no backwards scanning/treading needed to render the styles.

**Limitations:**

We can only utilise 32 bit colour, for colouring text within a poem. We can also only have a maxumum of 22 poem annotation regions. Unicode/UTF8 must be offset by 256 so that there is no overlap between the markers and actual unicode characters. If there is an overflow, we add a byte to the end. When converting back to normal unicode, if underflow, we remove the next byte.  We can only have 26 annotation regions, due to having very few bits in our style byte free.
