// Code that handles logic for complex poem editor interactions
// We make use of private use areas in uncode for the data in our format
// http://www.alanwood.net/unicode/private_use_area.html, '\uE002' == ""
//  = 57344 = \uE000 = start style
//  = 57345 = \uE001 = new line (break)
//  = 57346 = \uE002 = end style
"use strict";
const positionMovements = {
    up: 0,
    down: 1,
    left: 2,
    right: 3,
    none: 4
}

// Document objects
class DocumentFragment {
    constructor() {
        this.styles = []
        this.children = []
        this.type = "fragment"
    }
}

class Text {
    constructor(text="") {
        this.content = text
        this.type = "text"
    }
}

class NewLine {
    constructor(count=1) {
        this.count = count
        this.type = "newline"
    }
}

// Document fragment styles
class Bold {
    constructor() {
        this.type = "bold"
    }
}

class Font {
    constructor(name="Arial, Helvetica, sans-serif", size=18) {
        this.name = name
        this.size = size
        this.type = "font"
    }
}

class Colour {
    constructor(hex="#000") {
        this.hex = hex
        this.type = "colour"
    }
}

class EditorDocument {
    // Data, text data that canvas will be initialised with, Scale, oversample factor of canvas
    constructor(data=null, scale=1, fontSize=18, colourHex=getComputedStyle(document.documentElement).getPropertyValue("--text-colour")) {
        if (typeof data === "string") {
            this.data = new DocumentFragment(data)
            this.data.children.push(new Text(data))
        }
        else if (data) {
            this.data = data
        }
        else {
            throw new Error("Could not create editor document, supplied data was invalid")
        }
        this.position = this.getText().length // Raw position at end of text
        this.selection = { position: 0, end: 0, shiftKeyPivot: 0 } // Raw position
        this.workingStyles = []
        this.encoder = new TextEncoder()
        this.scale = scale
        // These will be used at the root level or when no styles are specified by a document fragment 
        this.fontSize = fontSize * scale
        this.colourHex = colourHex || "#000"
    }

    renderHtmlData(root) {
        root.innerHTML = ""
        this.formatToHtml(root)
    }

    formatToHtml(baseElement=document.createElement("div")) {
        const root = baseElement
        const cssFontSize = this.fontSize / this.scale
        // Wrapping poems should generally be discouraged, as formatting changes may affect how it is paced
        // and read, however we do not want to cut off content either so such compromise must be made...
        root.style.overflow = "auto"
        root.style.fontFamily = "Arial, Helvetica, sans-serif"
        root.style.fontSize = `${cssFontSize}px`
        root.style.whiteSpace = "nowrap"

        function renderFragment(data, html, _this) {
            switch (data.type) {
                case "fragment": {
                    const fragment = document.createElement("span")

                    for (let i = 0; i < data.styles.length; i++) {
                        const style = data.styles[i]
                        switch (style.type) {
                            case "subscript":
                                fragment.style.verticalAlign = "sub"
                                fragment.style.fontSize = "smaller"
                                break
                            case "lineheight":
                                const scaledHeight = data.height * _this.scale
                                fragment.style.display = "inline-block"
                                fragment.style.lineHeight = `${scaledHeight}px`
                                break
                            case "bold":
                                fragment.style.fontWeight = "bold"
                                break
                            case "italic":
                                fragment.style.fontStyle = "italic"
                                break
                            case "colour":
                                fragment.style.color = style.hex
                                break
                            case "font":
                                fragment.style.fontFamily = style.name
                                fragment.style.fontSize = style.size
                                break
                        }
                        html.appendChild(fragment)
                    }

                    for (let i = 0; i < data.children.length; i++) {
                        const child = data.children[i]
                        renderFragment(child, fragment, _this)
                    }
                    html.appendChild(fragment)
                    break
                }
                case "text": {
                    const text = document.createTextNode(data.content)
                    html.appendChild(text)
                    break
                }
                case "newline": {
                    for (let i = 0; i < data.count; i++) {
                        const newLine = document.createElement("br")
                        html.appendChild(newLine)
                    }
                    break
                }
            }
        }
        renderFragment(this.data, root, this)
        return root
    }

    renderCanvasData(canvas, cursor = true) {
        const context = canvas.getContext("2d")
        let hasSelection = this.hasSelection()
        let stylesStack = [] // Every style on this stack gets applied to a char

        // We precalculate how many lines the canvas will be
        let preCalcHeightCss = Math.max(360, this.getLines().length * (this.fontSize / this.scale) + this.fontSize)
        canvas.style.height = preCalcHeightCss + "px"
        canvas.height = preCalcHeightCss * this.scale
        context.clearRect(0, 0, canvas.width, canvas.height)

        let line = 1
        const positionContainer = this.getPositionContainer()
        const containerNode = positionContainer.node
        function renderFragment(data, _this) {
            switch (data.type) {
                case "fragment": {
                    stylesStack.push(data.styles)
                    for (let i = 0; i < data.children.length; i++) {
                        const child = data.children[i]
                        renderFragment(child, _this)
                    }
                    stylesStack.pop()
                    break
                }
                case "text": {
                    const font = []
                    let colour = _this.colourHex
                    for (let fragmentStyleI = 0; fragmentStyleI < stylesStack.length; fragmentStyleI++) {
                        const fragmentStyle = stylesStack[fragmentStyleI]
                        for (let styleI = 0; styleI < fragmentStyle.length; styleI++) {
                            const style = fragmentStyle[styleI]
                            switch (style.type) {
                                case "bold":
                                    font.push("bold")
                                    break
                                case "italic":
                                    font.push("italic")
                                    break
                                case "colour":
                                    colour = style.hex
                                    break
                            }
                        }
                    }
                    let hasFont = false
                    for (let fragmentStyleI = 0; fragmentStyleI < stylesStack.length; fragmentStyleI++) {
                        const fragmentStyle = stylesStack[fragmentStyleI]
                        for (let styleI = 0; styleI < fragmentStyle.length; styleI++) {
                            const style = fragmentStyle[styleI]
                            if (style.type == "font") {
                                font.push(`${style.size * _this.scale}px ${style.name}`)
                                hasFont = true
                                break
                            }
                        }
                    }
                    if (!hasFont) {
                        font.push(_this.fontSize + "px " + "Arial, Helvetica, sans-serif")
                    }
            
                    context.font = font.join(" ")
                    context.fillStyle = colour
                    context.fillText(data.content, 0, line * _this.fontSize)

                    if (data === containerNode) {
                        // Draw cursor (x, y, width, height)
                        const thisLeft = context.measureText(data.content.slice(0, positionContainer.relativePosition))
                        // TODO: Maintain measure width for currently line
                        context.fillStyle = _this.colourHex
                        context.fillRect(
                            thisLeft.width,
                            (line - 1) * _this.fontSize + 2,
                            1.5 * _this.scale,
                            _this.fontSize + 4)
                    }
                    break
                }
                case "newline": {
                    line += data.count
                    break
                }
            }
        }
        renderFragment(this.data, this)


        /*for (let i = 0; i < this.data.length; i++) {
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
                if (hasSelection && i >= this.selection.position && i < this.selection.end) {
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
                // + this.fontSize is slightly incorrect, as it is not exactly the height of this line, but will work well enough
                context.fillText(this.data[i], measure.width, (lines.length + 1) * this.fontSize)
                currentLine += this.data[i]
            }
        }
        // Final line won't be pushed, so we do it now
        lines.push(currentLine)
        currentLine = ""

        if (!cursor || this.hasSelection()) {
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
        beforePositionLine = this.toRawPosition(beforePositionLine)

        let positionLine = lines[positionLineIndex]
        // TODO: We are measuring text here as if the cursor position line is made up of all default chars, we need to
        // instead loop over each, checking against the styles to ensure we are actually getting it correctly
        context.font = this.fontSize + "px Arial, Helvetica, sans-serif"
        let positionMeasure = context.measureText(positionLine.slice(0, this.position - beforePositionLine))

        context.fillStyle = defaultTextColour
        context.fillRect(positionMeasure.width, positionLineIndex * this.fontSize + 2, 1.5, this.fontSize + 4)*/
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
        let lines = this.getLines()
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
                closestIndex = this.toRawPosition(i + beforeLength)
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

    toRawPosition(textPosition) {
        let rawI = 0
        let textI = 0
        let inStyle = EditorDocument.inStyle(textPosition, this.data)

        for (let i = 0; i < this.data.length; i++) {
            if (textI >= textPosition) {
                break
            }

            if (this.data[textI] == '\uE000') {
                inStyle = !inStyle
            }
            else if (!inStyle && this.data[rawI] != '\uE001' && this.data[rawI] != '\uE002') {
                textI++
            }

            rawI++
        }

        return rawI
    }

    movePosition(movement, shiftPressed) {
        if (shiftPressed && !this.selection.shiftKeyPivot) {
            this.selection.shiftKeyPivot = this.position
        }

        if (movement == positionMovements.left) {
            this.position = Math.max(0, this.position - 1)
        }
        else if (movement == positionMovements.right) {
            this.position = Math.min(this.data.length, this.position + 1)
        }
        else if (movement == positionMovements.up || movement == positionMovements.down) {
            let textPosition = EditorDocument.toTextPosition(this.position, this.data)
            let lines = this.getLines();
            let linePosition = this.positionInLine(textPosition, lines)

            // Current line is the line count up to this line
            let currentLine = this.getLines().length - 1

            let offset = movement == positionMovements.up ?
                Math.max(0, lines[currentLine].slice(0, linePosition).length + lines[currentLine].slice(linePosition).length) :
                Math.min(this.data.length, lines[currentLine].slice(linePosition).length + lines[currentLine].slice(0, linePosition).length)

            this.position += movement == positionMovements.up ? -offset : offset
        }

        if (shiftPressed && this.selection.shiftKeyPivot) {
            this.selection.position = Math.min(this.selection.shiftKeyPivot, this.position)
            this.selection.end = Math.max(this.selection.shiftKeyPivot, this.position)
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
    getLines() {
        let lines = []
        let currentLine = ""

        function visitFragment(data, _this) {
            switch (data.type) {
                case "fragment": {
                    for (let i = 0; i < data.children.length; i++) {
                        const child = data.children[i]
                        visitFragment(child, _this)
                    }
                    break
                }
                case "text": {
                    currentLine += data.content
                    break
                }
                case "newline": {
                    lines.push(currentLine)
                    currentLine = ""
                    for (let i = 1; i < data.count; i++) {
                        lines.push(currentLine)
                    }
                    break
                }
            }
        }
        visitFragment(this.data, this)

        let current = ""
        let inStyle = false

        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i] == '\uE000') {
                inStyle = !inStyle
                continue
            }
            if (this.data[i] == '\uE001') {
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
        if (this.hasSelection()) {
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

    getText() {
        let text = ""
        function visitNode(data) {
            switch (data.type) {
                case "fragment":
                    for (let i = 0; i < data.children.length; i++) {
                        const child = data.children[i]
                        visitNode(child)
                    }
                    break
                case "text":
                    text += data.content
                    break
            }
        }
        visitNode(this.data)
        return text
    }

    // Finds the node which contains the cursor currently
    getPositionContainer() {
        let nodeStart = 0
        let currentlyAt = 0
        function visitNode(data, _this) {
            switch (data.type) {
                case "fragment":
                    for (let i = 0; i < data.children.length; i++) {
                        const child = data.children[i]
                        const found = visitNode(child, _this)
                        if (found) {
                            return found
                        }
                    }
                    return data
                case "text":
                    nodeStart = currentlyAt
                    currentlyAt += data.content.length
                    if (currentlyAt >= _this.position) {
                        return data
                    }
                    break
            }

            return null
        }
        return {
            node: visitNode(this.data, this),
            relativePosition: this.position - nodeStart
        }
    }

    getParentNode(targetNode) {
        function visitNode(data, _this) {
            if (data.type === "fragment") {
                for (const child of data.children) {
                    if (child === targetNode) {
                        return child
                    }
                    return visitNode(child, _this)
                }
            }

            return null
        }

        return visitNode(this.data, _this)
    }

    // Attempts to create or append to text node at cursor position containing given text
    insertText(value) {
        if (this.hasSelection()) {
            this.deleteSelection()
        }

        const container = this.getPositionContainer()
        if (container.node === null) {
            return new Error("Couldn't add text, cursor position outside of document nodes range")
        }
        // Empty fragment, create new text node
        if (container.node.type === "fragment") {
            const textContainer = new Text(value)
            container.node.children.push(textContainer)
        }
        else if (container.node.type === "text") {
            container.node.content += value
        }
        else {
            throw new Error("Not implemented")
        }
        this.position += value.length
    }

    addNewLine() {
        if (this.hasSelection()) {
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
        if (this.hasSelection()) {
            this.deleteSelection()
        }
        else {
            // TODO: This will be painful to handle across node boundaries
            const container = this.getPositionContainer()
            const node = container.node
            if (node === null) {
                return new Error("Couldn't delete text, cursor position outside of document nodes range")
            }

            node.content = node.content.slice(0, this.position - count) + node.content.slice(this.position)
            this.position = Math.max(0, this.position - count)    
        }
    }

    getSelectionText() {
        return this.data.slice(this.selection.position, this.selection.end)
    }

    setSelection(start, end = null) {
        if (end == null) {
            this.position = this.toRawPosition(start)
        }
        else {
            this.selection.position = this.toRawPosition(start < end ? start : end)
            this.selection.end = this.toRawPosition(start < end ? end : start)
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

    hasSelection() {
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