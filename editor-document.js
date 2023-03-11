// Code that handles logic for complex poem editor interactions
// \x00 = start style
// \x01 = new line (break)
// \x02 = end style

const styleCodes = {
    colour: '\x03', // code,  uint32
    bold: '\x04',
    italic: '\x05',
    monospace: '\x06',
    superscript: '\x07',
    subscript: '\x08',
}

const positionMovements = {
    up: 0,
    down: 1,
    left: 2,
    right: 3,
    none: 4
}

class EditorDocument {
    constructor(data) {
        this.data = data || ""
        this.position = this.data.length // Raw position
        this.selection = { position: 0, end: 0 } // Raw position
        this.workingStyles = []
        this.encoder = new TextEncoder()
    }

    // Static
    formatToHtml(data) {
        let encoded = this.encoder.encode(data)
        let buffer = new ArrayBuffer(encoded.length)
        for (let i = 0; i < encoded.length; i++) {
            buffer[i] = encoded[i]
        }
        let view = new DataView(buffer)

        let inStyle = false
        let html = []
        
        for (let i = 0; i < data.length; i++) {
            if (data[i] == '\x00') {
                inStyle = !inStyle
                continue
            }
            else if (data[i] == '\x01') {
                html.push("<br>")
                continue
            }
            else if (data[i] == '\x02') {
                html.push("</span>")
                continue
            }
            
            if (inStyle) {
                switch (data[i]) {
                    case styleCodes.colour:
                        html.push(`<span style="colour: #${view.getUint32(data[i + 1])}";>`)
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
                html.push(data[i])
            }
        }

        return html.join("")
    }

    renderCanvasData(canvas) {
        const context = canvas.getContext("2d")
        const encoded = this.encoder.encode(this.data)
        const buffer = new ArrayBuffer(encoded.length)
        for (let i = 0; i < encoded.length; i++) {
            buffer[i] = encoded[i]
        }
        const view = new DataView(buffer)

        const fontSize = 18

        let inStyle = false
        let stylesStack = [] // Every style on this stack gets applied
        let colourStack = [] // Only the top style on this stack should be applied
        let lines = []
        let currentLine = ""

        // We precalculate how many lines the canvas will be 
        let preCalcHeight = Math.max(360, this.getLines(this.data).length * fontSize)
        canvas.style.height = preCalcHeight + "px"
        canvas.height = preCalcHeight
        context.clearRect(0, 0, canvas.width, canvas.height)

        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i] == '\x00') {
                inStyle = !inStyle
                continue
            }
            else if (this.data[i] == '\x01') {
                lines.push(currentLine)
                currentLine = ""
                continue
            }
            else if (this.data[i] == '\x02') {
                if (stylesStack.pop() == styleCodes.colour) {
                    colourStack.pop()
                }
                continue
            }
            
            if (inStyle) {
                stylesStack.push(data[i])

                if (data[i] == styleCodes.colour) {
                    colourStack.push(view.getUint32(data[i + 1]))
                    i += 4
                }
            }
            else {
                // We draw characters one by one, instead of line by line so that we can make
                // sure to apply the correct style onto each.
                
                if (colourStack.length > 0) {
                    context.fillStyle = "#" + colourStack[colourStack.length - 1]
                }

                context.font = fontSize + "px Arial, Helvetica, sans-serif"
                let measure = context.measureText(currentLine)

                // +fontSize is slightly incorrect, as it is not exactly the height of this line, but will work well enough v
                context.fillText(this.data[i], measure.width, (lines.length + 1) * fontSize)
                currentLine += this.data[i]
            }
        }
        // Final line won't be pushed, so we do it now
        lines.push(currentLine)
        currentLine = ""

        // Calculate line count up to position.
        let positionLineIndex = 0
        for (let i = 0; i < this.position; i++) {
            if (this.data[i] == '\x01') {
                positionLineIndex++
            }
        }

        // We also count up all chars in the lines before position,
        // then negate from position to get position on this (position's) line.
        let beforePositionLine = 0
        for (let before = 0; before < positionLineIndex; before++) {
            beforePositionLine += lines[before].length
        }

        let positionLine = lines[positionLineIndex]
        // TODO: We are measuring text here as if the cursor position line is made up of all default chars, we need to
        // instead loop over each, checking against the styles to ensure we are actually getting it correctly
        context.font = fontSize + "px Arial, Helvetica, sans-serif"
        let positionMeasure = context.measureText(positionLine.slice(0, this.position - beforePositionLine))

        context.fillRect(positionMeasure.width, positionLineIndex * fontSize + 2, 2, fontSize)
    }

    optimiseData(data) {
        let i = 0
        while (i < data.length - 1) {
            if (data[i] == '\x00' && data[i + 1] == '\x00') {
                data = data.slice(0, i) + data.slice(i + 2)
                i++
            }

            i++
        }

        return data
    }

    // Static
    toTextPosition(rawPosition, data) {
        let rawI = 0
        let textI = 0
        let inStyle = this.inStyle(rawPosition, data)
        
        while (rawI < rawPosition) {
            if (data[rawI] == '\x00') {
                inStyle = !inStyle
                continue
            }

            if (!inStyle && data[rawI] != '\x01' && data[rawI] != '\x02') {
                textI++
            }

            rawI++
        }

        return textI
    }

    // Static
    toRawPosition(textPosition, data) {
        let rawI = 0
        let textI = 0
        let inStyle = this.inStyle(textPosition, data)

        for (let i = 0; i < data.length; i++) {
            if (textI > textPosition) {
                break
            }

            if (data[textI] == '\x00') {
                inStyle = !inStyle
            }
            else if (!inStyle) {
                textI++
            }

            rawI++
        }

        return rawI
    }

    movePosition(movement) {
        switch (movement) {
            case positionMovements.left:
                this.position = Math.max(0, this.position - 1)
                break
            case positionMovements.right:
                // console.log(this.positionInLine(this.position, this.getLines(this.data)))
                break
        }
    }

    // Static
    positionInLine(globalIndex, lines) {
        // Count all lines before position
        let linesCharLength = 0
        for (let i = 0; i < lines.length - 1; i++) {
            linesCharLength += lines[i].length
        }

        return globalIndex - linesCharLength
    }

    // Static 
    getLineHeights(globalIndex, lines, spacing = 0) {
        let lineHeights = 0
        for (let line of lines.slice(0, globalIndex)) {
            let heightMeasure = context.measureText(line)
            lineHeights += heightMeasure.actualBoundingBoxAscent + heightMeasure.actualBoundingBoxDescent
            lineHeights += spacing
        }
        return lineHeights    
    }

    // Static
    getLines(data) {
        let lines = []
        let current = ""
        let inStyle = false

        for (let i = 0; i < data.length; i++) {
            if (data[i] == '\x00') {
                inStyle = !inStyle
                continue
            }
            if (data[i] == '\x01') {
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
                + '\x02'
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

        this.data = this.data.slice(0, this.position) + '\x01' + this.data.slice(this.position)
        this.position++
    }

    deleteSelection() {
        this.data = this.data.slice(0, this.selection.position) + this.data.slice(this.selection.end)
        this.position -= this.selection.end - this.selection.position
    }

    deleteText(count = 1) {
        if (this.existingSelection()) {
            this.deleteSelection()
        }
        else {
            if (count > 0) {
                this.data = this.data.slice(0, this.position - count) + this.data.slice(this.position)
                this.position -= count
            }
            else {
                this.data = this.data.slice(0, this.position) + this.data.slice(this.position - count)
            }    
        }
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

    selectAll() {
        this.position = 0
        this.selection.position = 0
        this.selection.end = this.data.length
    }

    existingSelection() {
        return (this.selection.position != 0 && this.selection.end != 0
                && this.selection.end - this.selection.position != 0)
    }

    // Static
    inStyle(position, data) {
        let count = 0
        for (let i = 0; i < data.slice(0, position); i++) {
            if (data[i] == '\x00') {
                count++
            }
        }

        return count % 2  == 1
    }
}