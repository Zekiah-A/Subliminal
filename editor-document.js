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

class EditorDocument {
    constructor(data) {
        this.data = data || ""
        this.position = 0 // Raw position
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