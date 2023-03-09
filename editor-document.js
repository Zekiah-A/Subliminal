// Code that handles logic for complex poem editor interactions
const styleCodes = {
    colour: 1, // code,  uint32
    bold: 2,
    italic: 3,
    monospace: 4,
    superscript: 5,
    subscript: 6,
}


class EditorDocument {
    constructor(poem) {
        this.poem = poem || ""
        this.cursorPosition = { x: 0, y: 0 }
        this.selection = { index: 0, end: 0 }
        this.workingStyles = []
        this.encoder = new TextEncoder()
    }

    formatToHtml(data) {
        let encoded = this.encoder.encode(data)
        let buffer = new ArrayBuffer(encoded.length)
        for (let i = 0; i < encoded.length; i++)
            buffer[i] = encoded[i]
        let view = new DataView(buffer)

        let inStyle = false
        let html = []
        
        for (let i = 0; i < data.length; i++) {
            if (data[i] == '\0') {
                inStyle = !inStyle
                continue
            }
            
            if (inStyle) {
                debugger
                switch (view.getUint8(i)) {
                    case styleCodes.colour:
                        html.push(`<span style="colour: #${view.getUint32(data[i + 1])}";>`)
                        i += 4
                        break
                    case styleCodes.bold:
                        html.push(`<span style="font-weight: bold;">`)
                        debugger
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

    addStyle(code, value = null) {
        if (this.selection.end - this.selection.index == 0) {
            //poem[this.selection.index]
            // Format this range woith style
            //poem[this.selection.end]
        }
        else {
            // We are just setting the style from now on, so we can add to 
        }
    }
}