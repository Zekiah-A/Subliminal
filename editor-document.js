// Code that handles logic for complex poem editor interactions
// We make use of private use areas in uncode for the data in our format
// http://www.alanwood.net/unicode/private_use_area.html, '\uE002' == ""
//  = 57344 = \uE000 = start style
//  = 57345 = \uE001 = new line (break)
//  = 57346 = \uE002 = end style

"use strict";
const styleCodes = {
    colour: '\uE003', // code,  uint32
    bold: '\uE004',
    italic: '\uE005',
    monospace: '\uE006',
    superscript: '\uE007',
    subscript: '\uE008',
}

const positionMovements = {
    up: 0,
    down: 1,
    left: 2,
    right: 3,
    none: 4
}

const textPositioning = {
    left: 0,
    right: 1,
    center: 2
}

class EditorDocument {
    // Data, text data that canvas will be initialised with, Scale, oversample factor of canvas
    constructor(data = null, scale = 1, fontSize = 18) {
        this.data = data || ""
        this.position = this.data.length // Raw position
        this.selection = { position: 0, end: 0, shiftKeyPivot: 0 } // Raw position
        this.workingStyles = []
        this.encoder = new TextEncoder()
        this.scale = scale
        this.fontSize = fontSize * scale
        this.textPositioning = textPositioning.left
    }

    formatToHtml() {
        let encoded = this.encoder.encode(this.data)
        let buffer = new ArrayBuffer(encoded.length)
        for (let i = 0; i < encoded.length; i++) {
            buffer[i] = encoded[i]
        }
        let view = new DataView(buffer)

        let inStyle = false
        let html = []

        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i] == '\uE000') {
                inStyle = !inStyle
            }
            else if (this.data[i] == '\uE001') {
                html.push("<br>")
                continue
            }
            else if (this.data[i] == '\uE002') {
                html.push("</span>")
                continue
            }

            if (inStyle) {
                switch (this.data[i]) {
                    case styleCodes.colour:
                        html.push(`<span style="colour: #${view.getUint32(this.data[i + 1])}";>`)
                        i += 4
                        break
                    case styleCodes.bold:
                        html.push(`<span style="font-weight: bold;">`)
                        break
                    case styleCodes.italic:
                        html.push(`<span style="font-style: italic;">`)
                        break
                    case styleCodes.monospace:
                        html.push(`<span style="font-family: font-family: monospace;">"`)
                        break
                    case styleCodes.superscript:
                        html.push(`<span style="vertical-align: sup; font-size: smaller;">`)
                        break
                    case styleCodes.subscript:
                        html.push(`<span style="vertical-align: sub; font-size: smaller;">`)
                        break
                }
            }
            else {
                html.push(this.data[i])
            }
        }

        return html.join("")
    }

    renderCanvasData(canvas, cursor = true) {
        const context = canvas.getContext("2d")
        const encoded = this.encoder.encode(this.data)
        const buffer = new ArrayBuffer(encoded.length)
        for (let i = 0; i < encoded.length; i++) {
            buffer[i] = encoded[i]
        }
        const view = new DataView(buffer)

        let existingSelection = this.existingSelection()
        let defaultTextColour = getComputedStyle(document.documentElement).getPropertyValue("--text-colour")
        let inStyle = false
        let stylesStack = [] // Every style on this stack gets applied to a char
        let colourStack = [] // Only the top style on this stack should be applied
        let lines = []
        let currentLine = ""

        // We precalculate how many lines the canvas will be 
        let preCalcHeight = Math.max(360, EditorDocument.getLines(this.data).length * (this.fontSize / this.scale) + this.fontSize)
        canvas.style.height = preCalcHeight + "px"
        canvas.height = preCalcHeight * this.scale
        context.clearRect(0, 0, canvas.width, canvas.height)

        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i] == '\uE000') {
                inStyle = !inStyle
                continue
            }
            else if (this.data[i] == '\uE001') {
                lines.push(currentLine)
                currentLine = ""
                continue
            }
            else if (this.data[i] == '\uE002') {
                if (stylesStack.pop() == styleCodes.colour) {
                    colourStack.pop()
                }
                continue
            }

            if (inStyle) {
                stylesStack.push(this.data[i])

                if (this.data[i] == styleCodes.colour) {
                    colourStack.push(view.getUint32(this.data[i + 1]))
                    i += 4
                }
            }
            else {
                // We draw characters one by one, instead of line by line so that we can make
                // sure to apply the correct style onto each. This abomination does that.
                context.fillStyle = (colourStack.length == 0 ? defaultTextColour : colourStack[colourStack.length - 1].toString(16))
                context.font = (stylesStack.includes(styleCodes.bold) ? "bold " : "")
                    + (stylesStack.includes(styleCodes.italic) ? "italic " : "")
                    + this.fontSize
                    + (stylesStack.includes(styleCodes.monospace) ? "px monospace" : "px Arial, Helvetica, sans-serif")

                let measure = context.measureText(currentLine)

                // Draw selection char by char to make life easier
                if (existingSelection && i >= this.selection.position && i < this.selection.end) {
                    context.save()
                    let thisCharMeasure = context.measureText(this.data[i])
                    context.fillStyle = "#4791FF63"// "#c1e8fb63"
                    context.beginPath()
                    context.roundRect(
                        measure.width,
                        (lines.length) * this.fontSize,
                        thisCharMeasure.width,
                        this.fontSize,
                        (i == this.selection.position ? [4, 0, 0, 4] : i == this.selection.end - 1 ? [0, 4, 0, 4] : [0]).map(value => value * this.scale))
                    context.fill()
                    context.restore()
                }

                // Finally draw character with all correct formatting and such
                // + this.fontSize is slightly incorrect, as it is not exactly the height of this line, but will work well enough v
                context.fillText(this.data[i], measure.width, (lines.length + 1) * this.fontSize)
                currentLine += this.data[i]
            }
        }
        // Final line won't be pushed, so we do it now
        lines.push(currentLine)
        currentLine = ""

        if (!cursor || this.existingSelection()) {
            return
        }

        // Calculate line count up to position.
        let positionLineIndex = 0
        for (let i = 0; i < this.position; i++) {
            if (this.data[i] == '\uE001') {
                positionLineIndex++
            }
        }

        // We also count up all chars in the lines before position,
        // then negate from position to get position on this (position's) line.
        let beforePositionLine = 0
        for (let before = 0; before < positionLineIndex; before++) {
            beforePositionLine += lines[before].length
        }
        beforePositionLine = EditorDocument.toRawPosition(beforePositionLine, this.data)

        let positionLine = lines[positionLineIndex]
        // TODO: We are measuring text here as if the cursor position line is made up of all default chars, we need to
        // instead loop over each, checking against the styles to ensure we are actually getting it correctly
        context.font = this.fontSize + "px Arial, Helvetica, sans-serif"
        let positionMeasure = context.measureText(positionLine.slice(0, this.position - beforePositionLine))

        context.fillStyle = defaultTextColour
        context.fillRect(positionMeasure.width, positionLineIndex * this.fontSize + 2, 1.5, this.fontSize + 4)
    }

    optimiseData(data) {
        let i = 0
        while (i < data.length - 1) {
            if (data[i] == '\uE000' && data[i + 1] == '\uE000') {
                data = data.slice(0, i) + data.slice(i + 2)
                i++
            }

            i++
        }

        return data
    }

    realToTextPosition(offsetX, offsetY, canvas) {
        offsetX *= this.scale
        offsetY *= this.scale

        const context = canvas.getContext("2d")
        let lines = EditorDocument.getLines(this.data)
        let line = Math.floor(Math.min(lines.length - 1, offsetY / this.fontSize))
        
        // TODO: currently we are assuming there are 0 styles, that is wrong
        // we should be measuring *with* the styles at every char, but first this
        // will require a new method that gets the lines, but preserves the styles
        // at the same time
        let stylesStack = []
        context.font = this.fontSize + "px Arial, Helvetica, sans-serif"

        // We measure up to every character in the line, then subtract it from the mouse
        // offset X, allowing us to see which is closest (using a king of the hill approach)
        let closestIndex = 0
        let closestValue = Number.MAX_SAFE_INTEGER
        let beforeLength = (lines.length > 1 ? lines.slice(0, line).reduce((accumulator, value) => accumulator + value.length, 0) : 0)
        for (let i = 0; i <= lines[line].length; i++) {
            let measure = context.measureText(lines[line].slice(0, i))
            let distance = Math.abs(offsetX - measure.width)
            if (distance < closestValue) {
                closestIndex = EditorDocument.toRawPosition(i + beforeLength, this.data)
                closestValue = distance
            }
            else {
                // As distance is always going to decrease, reach a turning point, and then increase, we optimise
                // by breaking as soon as we see diatnce increasing to avoid testing obviously false indexes
                break
            }
        }

        return closestIndex
    }

    static toTextPosition(rawPosition, data) {
        let rawI = 0
        let textI = 0
        let inStyle = EditorDocument.inStyle(rawPosition, data)

        while (rawI < rawPosition) {
            if (data[rawI] == '\uE000') {
                inStyle = !inStyle
                continue
            }

            if (!inStyle && data[rawI] != '\uE001' && data[rawI] != '\uE002') {
                textI++
            }

            rawI++
        }

        return textI
    }

    static toRawPosition(textPosition, data) {
        let rawI = 0
        let textI = 0
        let inStyle = EditorDocument.inStyle(textPosition, data)

        for (let i = 0; i < data.length; i++) {
            if (textI >= textPosition) {
                break
            }

            if (data[textI] == '\uE000') {
                inStyle = !inStyle
            }
            else if (!inStyle && data[rawI] != '\uE001' && data[rawI] != '\uE002') {
                textI++
            }

            rawI++
        }

        return rawI
    }

    movePosition(movement, shiftPressed) {
        if (shiftPressed && !this.selection.shiftKeyPivot) {
            this.selection.shiftKeyPivot = editor.position
        }

        if (movement == positionMovements.left) {
            this.position = Math.max(0, this.position - 1)
        }
        else if (movement == positionMovements.right) {
            this.position = Math.min(this.data.length, this.position + 1)
        }
        else if (movement == positionMovements.up || movement == positionMovements.down) {
            let textPosition = EditorDocument.toTextPosition(this.position, this.data)
            let lines = EditorDocument.getLines(this.data);
            let linePosition = this.positionInLine(textPosition, lines)

            // Current line is the line count up to this line
            let currentLine = EditorDocument.getLines(this.data.slice(0, this.position)).length - 1

            let offset = movement == positionMovements.up ?
                Math.max(0, lines[currentLine].slice(0, linePosition).length + lines[currentLine].slice(linePosition).length) :
                Math.min(this.data.length, lines[currentLine].slice(linePosition).length + lines[currentLine].slice(0, linePosition).length)

            this.position += movement == positionMovements.up ? -offset : offset
        }

        if (shiftPressed && this.selection.shiftKeyPivot) {
            editor.selection.position = Math.min(this.selection.shiftKeyPivot, editor.position)
            editor.selection.end = Math.max(this.selection.shiftKeyPivot, editor.position)
        }
    }

    // Returns textposition in text line, requires a textposition
    positionInLine(globalIndex, lines) {
        let globalLineIndex = 0
        for (let i = 0; i < globalIndex; i++) {
            if (this.data[i] == '\uE001') {
                globalLineIndex++
            }
        }

        // Count all lines before position
        let linesCharLength = 0
        for (let i = 0; i < globalLineIndex; i++) {
            linesCharLength += lines[i].length
        }

        return globalIndex - linesCharLength
    }

    // Returns height of text line, requires a textposition
    static getLineHeights(globalIndex, lines, spacing = 0) {
        let lineHeights = 0
        for (let line of lines.slice(0, globalIndex)) {
            let heightMeasure = context.measureText(line)
            lineHeights += heightMeasure.actualBoundingBoxAscent + heightMeasure.actualBoundingBoxDescent
            lineHeights += spacing
        }
        return lineHeights
    }

    // Returns only text lines
    static getLines(data) {
        let lines = []
        let current = ""
        let inStyle = false

        for (let i = 0; i < data.length; i++) {
            if (data[i] == '\uE000') {
                inStyle = !inStyle
                continue
            }
            if (data[i] == '\uE001') {
                lines.push(current)
                current = ""
                continue
            }

            if (!inStyle) {
                current += data[i]
            }
        }
        lines.push(current)
        current = ""

        return lines
    }

    addStyle(code, value = null) {
        if (this.existingSelection()) {
            let buffer = new Uint8Array(code == styleCodes.colour ? 7 : 3)
            buffer[0] = 0
            buffer[1] = code.charCodeAt(0)
            buffer[2] = 0

            if (code == styleCodes.colour) {
                buffer[2] = value & 0xff
                buffer[3] = (value >> 8) & 0xff
                buffer[4] = (value >> 16) & 0xff
                buffer[5] = (value >> 24) & 0xff
                buffer[6] = 0
            }

            this.data = this.data.slice(0, this.selection.position)
                + String.fromCharCode(...buffer)
                + this.data.slice(this.selection.position)

            this.data = this.data.slice(0, this.selection.end)
                + '\uE002'
                + this.data.slice(this.selection.end)
        }
        else {
            let buffer = new Uint8Array(code == styleCodes.colour ? 7 : 3)
            buffer[0] = 0
            buffer[1] = code.charCodeAt(0)
            buffer[2] = 0

            if (code == styleCodes.colour) {
                buffer[2] = value & 0xff
                buffer[3] = (value >> 8) & 0xff
                buffer[4] = (value >> 16) & 0xff
                buffer[5] = (value >> 24) & 0xff
                buffer[6] = 0
            }

            this.data = this.data.slice(0, this.position)
                + String.fromCharCode(...buffer)
                + this.data.slice(this.position)

            this.position += buffer.length

            // Add a closure after to avoid weird stuff from hapenning
            this.data = this.data.slice(0, this.position)
                + '\uE002'
                + this.data.slice(this.position)
        }
    }

    addText(value) {
        if (this.existingSelection()) {
            this.deleteSelection()
        }

        this.data = this.data.slice(0, this.position) + value + this.data.slice(this.position)
        this.position += value.length
    }

    addNewLine() {
        if (this.existingSelection()) {
            this.deleteSelection()
        }

        this.data = this.data.slice(0, this.position) + '\uE001' + this.data.slice(this.position)
        this.position++
    }

    deleteSelection() {
        this.data = this.data.slice(0, this.selection.position) + this.data.slice(this.selection.end)
        this.position = this.selection.position
        this.position = Math.max(0, this.position)
        this.clearSelection()
    }

    deleteText(count = 1) {
        if (this.existingSelection()) {
            this.deleteSelection()
        }
        else {
            if (count > 0) {
                this.data = this.data.slice(0, this.position - count) + this.data.slice(this.position)
                this.position = Math.max(0, this.position - count)
            }
            else {
                this.data = this.data.slice(0, this.position) + this.data.slice(this.position - count)
            }
        }
    }

    getSelectionText() {
        return this.data.slice(this.selection.position, this.selection.end)
    }

    setSelection(start, end = null) {
        if (end == null) {
            this.position = this.toRawPosition(start, this.data)
        }
        else {
            this.selection.position = this.toRawPosition(start < end ? start : end, this.data)
            this.selection.end = this.toRawPosition(start < end ? end : start, this.data)
        }
    }

    clearSelection() {
        this.selection.position = 0
        this.selection.end = 0
        this.selection.shiftKeyPivot = 0
    }

    selectAll() {
        this.position = 0
        this.selection.position = 0
        this.selection.end = this.data.length
    }

    existingSelection() {
        return !((this.selection.position == 0 && this.selection.end == 0)
            || this.selection.end - this.selection.position == 0)
    }

    static inStyle(position, data) {
        let count = 0
        for (let i = 0; i < data.slice(0, position); i++) {
            if (data[i] == '\uE000') {
                count++
            }
        }

        return count % 2 == 1
    }
}