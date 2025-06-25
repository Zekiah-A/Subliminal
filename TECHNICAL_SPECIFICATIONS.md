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

This means that we must split the image into bytes, each 8 pixels across is one byte horizontally = signCanvas.width / 8, vertically = signCanvas.height, as the bytes are 1D. We then assign the pixel to it's respective byte and bit in that byte. This can then all be combined into a buffer which can be converted into base64.
