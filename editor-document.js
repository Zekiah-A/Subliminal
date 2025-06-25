"use strict";
// Code that handles logic for complex poem editor interactions
const positionMovements = {
	up: 0,
	down: 1,
	left: 2,
	right: 3,
	none: 4
}

const controlKeys = {
	shift: 0,
	ctrl: 1,
	home: 2,
	end: 8,
	backspace: 16,
	delete: 32
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
		root.style.fontFamily = "Arial, Helvetica, sans-serif"
		root.style.fontSize = `${cssFontSize}px`
		root.style.whiteSpace = "nowrap"
		root.style.width = "max-content"
		root.style.lineHeight = `${cssFontSize}px`

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
								fragment.style.fontSize = style.size + "px"
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

	invertHex(hexString) {
		return "#" + (Number(`0x1${hexString.slice(1)}`) ^ 0xFFFFFF)
			.toString(16).slice(1).toUpperCase()
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

		let textI = 0
		let line = 1
		let preLineWidth = 0
		const positionContainer = this.getPositionContainer()
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
					for (let fragmentStyleI = stylesStack.length - 1; fragmentStyleI >= 0; fragmentStyleI--) {
						const fragmentStyle = stylesStack[fragmentStyleI]
						for (let styleI = fragmentStyle.length - 1; styleI >= 0; styleI--) {
							const style = fragmentStyle[styleI]
							switch (style.type) {
								case "bold":
									if (!font.includes("bold")) {
										font.push("bold")
									}
									break
								case "italic":
									if (!font.includes("italic")) {
										font.push("italic")
									}
									break
								case "colour":
									if (colour == _this.colourHex) {
										colour = style.hex
									}
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

					const fragmentStartI = textI
					const fragmentEndI = textI + data.content.length

					if (hasSelection && fragmentEndI > _this.selection.start && fragmentStartI < _this.selection.end) {
						const relativeStartI = Math.max(_this.selection.start, fragmentStartI) - fragmentStartI
						const relativeEndI = Math.min(_this.selection.end, fragmentEndI) - fragmentStartI
						context.save()
						
						const thisPreSelectionMeasure = context.measureText(data.content.slice(0, relativeStartI))
						const selectionText = data.content.slice(relativeStartI, relativeEndI)
						const thisSelectionMeasure = context.measureText(selectionText)
						context.fillStyle = "#4791FF63"
						context.beginPath()
						const preSelectionWidth = preLineWidth + thisPreSelectionMeasure.width

						const corners = [0, 0, 0, 0]
						if (fragmentStartI <= _this.selection.start) {
							corners[0] = 4 * _this.scale
							corners[3] = 4 * _this.scale
						}
						if (fragmentEndI <= _this.selection.end) {
							corners[1] = 4 * _this.scale
							corners[2] = 4 * _this.scale
						}
						context.roundRect(
							preSelectionWidth,
							(line - 1) * _this.fontSize - (4 * _this.scale),
							thisSelectionMeasure.width,
							_this.fontSize + (8 * _this.scale),
							corners)
						context.fill()
						context.restore()
					}
					// Draw text
					context.fillText(data.content, preLineWidth, line * _this.fontSize)

					if (data === positionContainer.node) {
						const prePositionMeasure = context.measureText(data.content.slice(0, positionContainer.relativePosition))
						// TODO: Maintain measure width for current line
						// Draw cursor (x, y, width, height)
						context.fillStyle = _this.colourHex
						context.fillRect(
							prePositionMeasure.width + preLineWidth,
							(line - 1) * _this.fontSize + 2,
							1.5 * _this.scale,
							_this.fontSize + 4)
					}
	
					const nodeMeasure = context.measureText(data.content)
					preLineWidth += nodeMeasure.width
					textI = fragmentEndI
					break
				}
				case "newline": {
					line += data.count
					textI += data.count
					preLineWidth = 0
					if (data === positionContainer.node) {
						// TODO: Maintain measure width for current line
						context.fillStyle = _this.colourHex
						context.fillRect(
							0,
							(line - 1) * _this.fontSize + 2,
							1.5 * _this.scale,
							_this.fontSize + 4)
					}
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
				if (hasSelection && i >= this.selection.start && i < this.selection.end) {
					context.save()
					let thisCharMeasure = context.measureText(this.data[i])
					context.fillStyle = "#4791FF63"// "#c1e8fb63"
					context.beginPath()
					context.roundRect(
						measure.width,
						(lines.length) * this.fontSize,
						thisCharMeasure.width,
						this.fontSize,
						(i == this.selection.start ? [4, 0, 0, 4] : i == this.selection.end - 1 ? [0, 4, 0, 4] : [0]).map(value => value * this.scale))
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
		/*let stylesStack = []
		context.font = this.fontSize + "px Arial, Helvetica, sans-serif"*/

		// We measure up to every character in the line, then subtract it from the mouse
		// offset X, allowing us to see which is closest (using a king of the hill approach)
		
		let closestIndex = 0
		let closestValue = Number.MAX_SAFE_INTEGER
		/*let beforeLength = (lines.length > 1 ? lines.slice(0, line).reduce((accumulator, value) => accumulator + value.length, 0) : 0)
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
		}*/
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

					
					break
				}
				case "newline": {
					break
				}
			}
		}
		visitFragment(this.data, this)

		return closestIndex
	}

	movePosition(movement, shiftPressed) {
		if (shiftPressed && this.selection.shiftKeyPivot === null) {
			this.selection.shiftKeyPivot = this.position
		}

		const textLength = this.getText().length
		if (movement == positionMovements.left) {
			this.position = Math.max(0, this.position - 1)
		}
		else if (movement == positionMovements.right) {
			this.position = Math.min(textLength, this.position + 1)
		}
		else if (movement == positionMovements.up || movement == positionMovements.down) {
			throw new Error("Position movements up/down not implemented!")
			let textPosition = EditorDocument.toTextPosition(this.position, this.data)
			let lines = this.getLines();
			let linePosition = this.positionInLine(textPosition, lines)

			// Current line is the line count up to this line
			let currentLine = this.getLines().length - 1

			let offset = movement == positionMovements.up ?
				Math.max(0, lines[currentLine].slice(0, linePosition).length + lines[currentLine].slice(linePosition).length) :
				Math.min(textLength, lines[currentLine].slice(linePosition).length + lines[currentLine].slice(0, linePosition).length)

			this.position += movement == positionMovements.up ? -offset : offset
		}

		if (this.selection.shiftKeyPivot !== null) {
			if (shiftPressed) {
				this.selection.start = Math.min(this.selection.shiftKeyPivot, this.position)
				this.selection.end = Math.max(this.selection.shiftKeyPivot, this.position)    
			}
			// If has selection and selection, then press the back or forwards arrow key pressed without
			// shift, cursor teleports to the start / end of the selection.
			else {
				if (movement == positionMovements.left) {
					this.position = this.selection.start
				}
				else if (movement == positionMovements.right) {
					this.position = this.selection.end
				}
				else {
					throw new Error("Up/down position movements on deselections not implemented")
				}
				this.clearSelection()
			}
		}
		else if (!shiftPressed) {
			this.clearSelection()
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

			this.data = this.data.slice(0, this.selection.start)
				+ String.fromCharCode(...buffer)
				+ this.data.slice(this.selection.start)

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
				case "newline":
					for (let i = 0; i < data.count; i++) {
						text += "\n"
					}
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
				case "newline":
					currentlyAt += data.count
					if (currentlyAt >= _this.position) {
						return data
					}
					break
			}

			return null
		}
		return {
			node: visitNode(this.data, this),
			relativePosition: this.position - nodeStart,
		}
	}

	getParentNode(targetNode) {
		function visitNode(data, _this) {
			if (data.type === "fragment") {
				for (const child of data.children) {
					if (child === targetNode) {
						return data
					}
					const result = visitNode(child, _this)
					if (result) {
						return result
					}
				}
			}
	
			return null
		}
		
		return visitNode(this.data, this)
	}

	getNextSibling(targetNode) {
		function findNextSibling(node, parent) {
			const siblings = parent.children
			const index = siblings.indexOf(node)
			if (index !== -1 && index < siblings.length - 1) {
				return siblings[index + 1]
			}

			return null
		}
	
		function visitNode(node, parent) {
			if (parent.type === "fragment") {
				for (const child of parent.children) {
					if (child === node) {
						return findNextSibling(node, parent)
					}
					const nextSibling = visitNode(node, child)
					if (nextSibling !== null) {
						return nextSibling
					}
				}
			}

			return null
		}
	
		return visitNode(targetNode, this.data)
	}

	// Attempts to create or append to text node at cursor position containing given text
	insertText(value) {
		if (this.hasSelection()) {
			this.deleteSelection()
		}

		const container = this.getPositionContainer()
		const node = container.node
		if (node === null) {
			return new Error("Couldn't add insert, cursor position outside of document nodes range")
		}
		// Empty fragment, create new text node
		if (node.type === "fragment") {
			const textContainer = new Text(value)
			node.children.push(textContainer)
		}
		else if (node.type === "text") {
			node.content = node.content.slice(0, container.relativePosition)
				+ value + node.content.slice(container.relativePosition) 
		}
		else if (node.type === "newline") {
			// Basically an inversion of the code in addNewLine
			const parent = this.getParentNode(node)
			if (parent == null) {
				throw new Error("Could not insert text, parent newline parent was null")
			}

			const newChildren = []
			const index = parent.children.indexOf(node)
			const afterNewLines = node.count - node.relativePosition
			newChildren.push(...parent.children.slice(0, index+1))
			newChildren.push(new Text(value))
			if (afterNewLines) {
				// Before new lines
				node.count = node.relativePosition
				const afterNewLine = new NewLine(afterNewLines)
				newChildren.push(afterNewLine)
			}
			newChildren.push(...parent.children.slice(index+1))
		}

		this.position += value.length
	}

	addNewLine() {
		if (this.hasSelection()) {
			this.deleteSelection()
		}

		const container = this.getPositionContainer()
		const parent = this.getParentNode(container.node)
		if (parent?.type === "fragment") {
			if (container?.node.type === "text") {
				const index = parent.children.indexOf(container.node)
				const afterText = container.node.content.slice(container.relativePosition)
				const newChildren = []
				newChildren.push(...parent.children.slice(0, index+1))
				newChildren.push(new NewLine(1))
				if (afterText) {
					const beforeText = container.node.content.slice(0, container.relativePosition)
					container.node.content = beforeText
					newChildren.push(new Text(afterText))
				}
				newChildren.push(...parent.children.slice(index+1))
				parent.children = newChildren
				this.position++    
			}
		}
		else if (parent?.type == "newline") {
			console.error("Unhandled error")
		}
		else {
			console.warn("Could not add new line, cursor out of document range?")
		}
	}

	deleteSelection() {
		throw new Error("Delete selection not implemented")
		this.data = this.data.slice(0, this.selection.start) + this.data.slice(this.selection.end)
		this.position = this.selection.start
		this.position = Math.max(0, this.position)
		this.clearSelection()
	}

	deleteText(count = 1) {
		if (this.hasSelection()) {
			this.deleteSelection()
		}
		else {
			// TODO: This will be painful to handle across node boundaries
			if (count > 0) {
				for (let i = 0; i < count; i++) {
					const container = this.getPositionContainer()
					const node = container.node
					if (node === null) {
						return new Error("Couldn't delete text, cursor position outside of document nodes range")
					}

					if (node.type == "text") {
						node.content = node.content.slice(0, this.position - 1) + node.content.slice(this.position)
						this.position = Math.max(0, this.position - 1)            
					}
					else if (node.type == "newline") {
						node.count--
						if (node.count == 0) {
							const parent = this.getParentNode(node)
							if (parent?.type !== "fragment") {
								throw new Error("Couldn't perform delete, newline parent could not be located")
							}
							parent.children.splice(parent.children.indexOf(node), 1)
						}
					}
				}
			}
			else {
				// Delete key
			}
		}
	}

	getSelectionText() {
		return this.data.slice(this.selection.start, this.selection.end)
	}

	setSelection(start, end = null) {
		if (end == null) {
			this.position = this.toRawPosition(start)
		}
		else {
			this.selection.start = this.toRawPosition(start < end ? start : end)
			this.selection.end = this.toRawPosition(start < end ? end : start)
		}
	}

	clearSelection() {
		this.selection.start = 0
		this.selection.end = 0
		this.selection.shiftKeyPivot = null
	}

	selectAll() {
		this.position = 0
		this.selection.start = 0
		this.selection.end = this.getText().length
	}

	hasSelection() {
		return !((this.selection.start == 0 && this.selection.end == 0)
			|| this.selection.end - this.selection.start == 0)
	}
}