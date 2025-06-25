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
class DocumentNode {
	type = ""
	#bounds
	#parent
	#globalBoundsCache = null
	#boundsCache = null
	static validTypes = [ "fragment", "text", "newline", "bold", "font", "colour" ]

	constructor(type, bounds = { x: 0, y: 0, width: 0, height: 0 }) {
	    if (!DocumentNode.validTypes.includes(type)) {
			throw new Error(`Invalid type: ${type}`);
		}
		this.type = type
		this.#bounds = bounds
		this.#parent = null
	}

	get bounds() {
		return { ...this.#bounds }
	}

	set bounds(newBounds) {
		this.#bounds = { ...this.#bounds, ...newBounds }
		this.onBoundsChanged();
	}

	get parent() {
		return this.#parent;
	}

	set parent(value) {
		this.#parent = value
	}

	invalidateGlobalBounds() {
		this.#globalBoundsCache = null;
		if (this.#parent) {
			this.#parent.invalidateGlobalBounds()
		}
	}

	traverse(callback) {
		callback(this)
	}

	getGlobalBounds() {
		if (!this.#globalBoundsCache) {
			if (!this.#parent) {
				this.#globalBoundsCache = this.bounds;
			}
			else {
				const parentBounds = this.#parent.getGlobalBounds();
				this.#globalBoundsCache = {
					x: parentBounds.x + this.#bounds.x,
					y: parentBounds.y + this.#bounds.y,
					width: this.#bounds.width,
					height: this.#bounds.height,
				}
			}
		}
		return this.#globalBoundsCache;
	}

	calculateBounds(context, parentStyles = [], lineState = { x: 0, y: 0, lineHeight: 0 }) {
		const computedStyles = this.getComputedStyle(parentStyles)
		let bounds = { startX: lineState.x, startY: lineState.y, endX: 0, endY: 0 }

		switch (this.type) {
			case "text": {
				//const font = computedStyles.find(s => s.type === "font") || { size: 16, name: "Arial" }
				//context.font = `${font.size}px ${font.name}`
				const metrics = context.measureText(this.content)

				bounds.endX = bounds.startX + metrics.width
				const height = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent
				bounds.endY = bounds.startY + height

				// Update line state
				lineState.x = bounds.endX
				lineState.lineHeight = Math.max(lineState.lineHeight, height)
				break
			}
			case "newline": {
				lineState.x = 0
				lineState.y += lineState.lineHeight
				lineState.lineHeight = 0
				bounds.endX = bounds.startX
				bounds.endY = lineState.y
				break
			}
			case "fragment": {
				const childBounds = this.#children.map(child =>
					child.calculateBounds(context, computedStyles, lineState)
				)
				bounds.startX = Math.min(...childBounds.map(b => b.startX))
				bounds.startY = Math.min(...childBounds.map(b => b.startY))
				bounds.endX = Math.max(...childBounds.map(b => b.endX))
				bounds.endY = Math.max(...childBounds.map(b => b.endY))
				break;
			}
		}

		this.#boundsCache = bounds;
		return bounds;
	}

	renderBounds(context) {
		if (!this.#boundsCache) throw new Error("Bounds not calculated!");
		const { startX, startY, endX, endY } = this.#boundsCache;

		// Render this node's bounds
		context.strokeStyle = "black";
		context.lineWidth = 1;
		context.strokeRect(startX, startY, endX - startX, endY - startY);

		// Render children
		this.#children.forEach(child => child.renderBounds(context));
	}
}

/**
 * @class DocumentFragment
 * @description Represents a fragment of the document
 */
class DocumentFragment extends DocumentNode {
	#children

	constructor() {
		super("fragment")
		this.styles = []
		this.#children = []
	}

	get children() {
		return [...this.#children]
	}

	traverse(callback) {
		callback(this)
		this.#children.forEach(child => child.traverse(callback))
	}

	hasChildren() {
		return this.#children.length > 0
	}

	addChild(childNode) {
		if (childNode instanceof DocumentNode) {
			childNode.setParent(this)
			this.#children.push(childNode)
		}
		else {
			throw new Error("Child must be an instance of DocumentNode.")
		}
		this.invalidateGlobalBounds()
	}

	removeChild(childNode) {
		const index = this.#children.indexOf(childNode);
		if (index > -1) {
			this.#children.splice(index, 1);
			childNode.#parent = null;
		}
		else {
			throw new Error("Child node not found.")
		}
		this.invalidateGlobalBounds()
	}

	onChildBoundsChanged() {

	}

	alignChildrenHorizontally() {
		let xOffset = 0;
		this.#children.forEach(child => {
			child.bounds = { ...child.bounds, x: xOffset };
			xOffset += child.bounds.width + padding;
		});
	}

	onBoundsChanged() {
		if (this.#parent) {
			this.#parent.onChildBoundsChanged(this)
		}
	}
}

/**
 * @class Text
 * @description Represents a text node in the document
 */
class Text extends DocumentNode {
	constructor(text="") {
		super("text")
		this.content = text
	}
}


/**
 * @class NewLine
 * @description Represents a new line in the document
 */
class NewLine extends DocumentNode {
	constructor(count=1) {
		super("newline")
		this.count = count
	}
}

// Document fragment styles
/**
 * @class Bold
 * @description Represents bold style
 */
class Bold extends DocumentNode {
	constructor() {
		super("bold")
	}
}

/**
 * @class Font
 * @description Represents font style
 */
class Font extends DocumentNode {
	constructor(name="Arial, Helvetica, sans-serif", size=18) {
		super("font")
		this.name = name
		this.size = size
	}
}

/**
 * @class Colour
 * @description Represents colour style
 */
class Colour extends DocumentNode {
	constructor(hex="#000") {
		super("colour")
		this.hex = hex
	}
}

class EditorDocument {
	position = 0
	selection = { position: 0, end: 0, shiftKeyPivot: 0 }
	data = null
	workingStyles = []
	encoder = new TextEncoder()
	canvasScale = 1
	canvasDebug = false
	fontSize = 18
	colourHex = "#000"

	/**
	 * 
	 * @param {string|DocumentFragment} data Text data / document fragmentt that document will be initialised with
	 * @param {number} canvasScale Oversample factor of canvas output
	 * @param {number} fontSize CSS pixel default size of rendered text 
	 * @param {string} colourHex CSS default colour of rendered text
	 */
	constructor(data=null, canvasScale=1, fontSize=18, colourHex=getComputedStyle(document.documentElement).getPropertyValue("--text-colour")) {
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
		this.canvasScale = canvasScale
		this.canvasDebug = false
		// These will be used at the root level or when no styles are specified by a document fragment 
		this.fontSize = fontSize * canvasScale
		this.colourHex = colourHex || "#000"
	}

	/**
	 * @method renderHtmlData
	 * @description Renders the document data as HTML
	 * @param {HTMLElement} root - The root element to render into
	 */
	renderHtmlData(root) {
		root.innerHTML = ""
		this.formatToHtml(root)
	}

	/**
	 * @method formatToHtml
	 * @description Formats the document data to HTML
	 * @param {HTMLElement} [baseElement=document.createElement("div")] - The base element to format into
	 * @returns {HTMLElement} The formatted HTML element
	 */
	formatToHtml(baseElement=document.createElement("div")) {
		const root = baseElement
		const cssFontSize = this.fontSize / this.canvasScale
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
								const scaledHeight = data.height * _this.canvasScale
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

    /**
	 * @method invertHex
	 * @description Inverts a hexadecimal colour
	 * @param {string} hexString - The hexadecimal colour to invert
	 * @returns {string} The inverted hexadecimal colour
	 */
	invertHex(hexString) {
		return "#" + (Number(`0x1${hexString.slice(1)}`) ^ 0xFFFFFF)
			.toString(16).slice(1).toUpperCase()
	}

	/**
	 * Gets bounding box tree of document nodes
	 * @returns {{ startX:number, startY:number, endX:number, endY:number, node:DocumentNode }}
	 */
	getBoundingBoxes() {
		const canvas = document.createElement("canvas")
		const context = canvas.getContext("2d")
		let curLineHeights = []
		let preLineWidth = 0
		let preLineHeight = 0
		let stylesStack = []
		let line = 0

		function visitNode(data, _this) {
			let startX = preLineWidth
			let startY = preLineHeight
			let endX = startX
			let endY = startY
			let children = []

			switch (data.type) {
				case "fragment": {
					const childrenBounds = []
					stylesStack.push(data.styles)
					for (let i = 0; i < data.children.length; i++) {
						const child = data.children[i]
						const childBounds = visitNode(child, _this)
						childrenBounds.push(childBounds)
					}
					stylesStack.pop()

					startX = childrenBounds.reduce((accumulator, currentValue) =>
						Math.min(accumulator, currentValue.startX), Infinity)
					startY = childrenBounds.reduce((accumulator, currentValue) =>
						Math.min(accumulator, currentValue.startY), Infinity)
					endX = childrenBounds.reduce((accumulator, currentValue) =>
						Math.max(accumulator, currentValue.endX), 0)
					endY = childrenBounds.reduce((accumulator, currentValue) =>
						Math.max(accumulator, currentValue.endY), 0)
					children = childrenBounds
					break
				}
				case "text": {
					const font = []
					for (let fragmentStyleI = stylesStack.length - 1; fragmentStyleI >= 0; fragmentStyleI--) {
						const fragmentStyle = stylesStack[fragmentStyleI]
						for (let styleI = fragmentStyle.length - 1; styleI >= 0; styleI--) {
							const style = fragmentStyle[styleI]
							switch (style.type) {
								case "bold": // affects width
									if (!font.includes("bold")) {
										font.push("bold")
									}
									break
								case "italic": // affects width
									if (!font.includes("italic")) {
										font.push("italic")
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
							if (style.type == "font") { // affects width & height
								font.push(`${style.size * _this.canvasScale}px ${style.name}`)
								hasFont = true
								break
							}
						}
					}
					if (!hasFont) {
						font.push(_this.fontSize + "px " + "Arial, Helvetica, sans-serif")
					}
					context.font = font.join(" ")
	
					const nodeMeasure = context.measureText(data.content)
					preLineWidth += nodeMeasure.width
					const textHeight = nodeMeasure.fontBoundingBoxAscent
						+ nodeMeasure.fontBoundingBoxDescent
					curLineHeights.push(textHeight)

					endX = preLineWidth
					endY = preLineHeight + textHeight
					break
				}
				case "newline": {
					line += data.count
					preLineWidth = 0

					preLineHeight += Math.max(...curLineHeights, _this.fontSize) * data.count
					endY = preLineHeight
					curLineHeights = []
					break
				}
			}

			// Debug rendering
			const bounds = { startX, startY, endX, endY, children, node: data }
			return bounds
		}
		return visitNode(this.data, this)
	}

	/**
	 * Performs debug rendering for the bounding boxes of nodes which make up a document
	 * @param {HTMLCanvasElement} canvas 
	 */
	renderBoundingBoxes(canvas) {
		const root = this.getBoundingBoxes()
		const context = canvas.getContext("2d")
		const rootHeight = (root.endY - root.startY)
		const rootWidth = (root.endX - root.startX)
		canvas.style.height = rootHeight + "px"
		canvas.style.width = rootWidth + "px"
		canvas.height = rootHeight * this.canvasScale
		canvas.width = rootWidth * this.canvasScale
		context.clearRect(0, 0, canvas.width, canvas.height)

		function renderBox(bounds) {
			context.save()
			context.strokeStyle = "#000"
			context.lineWidth = 2
			context.beginPath()
			context.rect(bounds.startX, bounds.startY, bounds.endX - bounds.startX, bounds.endY - bounds.startY)
			context.stroke()
			context.fillStyle = "rgba(0, 0, 255, 0.5)"
			context.fillRect(bounds.startX, bounds.startY, bounds.endX - bounds.startX, bounds.endY - bounds.startY)
			context.restore()

			for (const child of bounds.children) {
				renderBox(child)
			}
		}
		renderBox(root)
	}

	/**
	 * @method renderCanvasData
	 * @description Renders the document data on a canvas
	 * @param {HTMLCanvasElement} canvas - The canvas to render on
	 * @param {boolean} [cursor=true] - Whether to render the cursor
	 */
	renderCanvasData(canvas, cursor = true) {
		const context = canvas.getContext("2d")
		let hasSelection = this.hasSelection()
		// Every style on this stack gets applied to child nodes
		let stylesStack = []

		// Resize canvas to fit the size of the document
		const boundsRoot = this.getBoundingBoxes()
		let canvasHeight = boundsRoot.endY - boundsRoot.startY
		canvas.style.height = (canvasHeight / this.canvasScale) + "px"
		canvas.height = canvasHeight

		let textI = 0 // TODO: Remove
		let line = 1 // TODO: Remove
		let prevNodeWidth = 0
		let prevNodeHeight = 0
		let prevLineBounds = { startX: 0, startY: 0, endX: 0, endY: 0 }
		let curLineHeights = []
		let curLineBounds = { startX: 0, startY: 0, endX: 0, endY: 0 }
		const positionContainer = this.getPositionContainer()
		function renderNode(data, _this) {
			let startX = prevNodeWidth
			let startY = prevNodeHeight
			let endX = startX
			let endY = startY
			let bounds = null

			switch (data.type) {
				case "fragment": {
					const childrenBounds = []
					stylesStack.push(data.styles)
					for (let i = 0; i < data.children.length; i++) {
						const child = data.children[i]
						const childBounds = renderNode(child, _this)
						childrenBounds.push(childBounds)
					}
					stylesStack.pop()

					// Debug rendering
					//startX = childrenBounds.reduce((accumulator, currentValue) =>
					//	Math.min(accumulator + currentValue.startX), Infinity)
					//startY = childrenBounds.reduce((accumulator, currentValue) =>
					//	Math.min(accumulator, currentValue.startY), Infinity)
					//endX = childrenBounds.reduce((accumulator, currentValue) =>
					//	Math.max(accumulator, currentValue.endX), 0)
					//endY = childrenBounds.reduce((accumulator, currentValue) =>
					//	Math.max(accumulator, currentValue.endY), 0)
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
								font.push(`${style.size * _this.canvasScale}px ${style.name}`)
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
						const preSelectionWidth = prevNodeWidth + thisPreSelectionMeasure.width

						const corners = [0, 0, 0, 0]
						if (fragmentStartI <= _this.selection.start) {
							corners[0] = 4 * _this.canvasScale
							corners[3] = 4 * _this.canvasScale
						}
						if (fragmentEndI <= _this.selection.end) {
							corners[1] = 4 * _this.canvasScale
							corners[2] = 4 * _this.canvasScale
						}
						context.roundRect(
							preSelectionWidth,
							(line - 1) * _this.fontSize - (4 * _this.canvasScale),
							thisSelectionMeasure.width,
							_this.fontSize + (8 * _this.canvasScale),
							corners)
						context.fill()
						context.restore()
					}

					// Draw text
					const prevLineHeight = Math.max(...curLineHeights)
					const textMeasure = context.measureText(data.content)
					const textHeight = (textMeasure.actualBoundingBoxAscent - textMeasure.alphabeticBaseline)
					const textBaselineY = prevLineHeight + textHeight
					context.fillText(data.content, prevNodeWidth, textBaselineY)

					// Draw cursor
					if (data === positionContainer.node) {
						const prePositionMeasure = context.measureText(data.content.slice(0, positionContainer.relativePosition));

						const cursorHeight = textMeasure.fontBoundingBoxAscent + textMeasure.fontBoundingBoxDescent
						const cursorTopY = prevLineHeight - textMeasure.fontBoundingBoxDescent

						// Draw cursor
						context.fillStyle = _this.colourHex;
						context.fillRect(
							prePositionMeasure.width + prevNodeWidth, // X position
							cursorTopY, // Y position
							1.5 * _this.canvasScale, // Cursor width
							cursorHeight // Cursor height
						)
					}

					prevNodeWidth += textMeasure.width
					curLineHeights.push(prevLineHeight + _this.fontSize)
					break
				}
				case "newline": {
					line += data.count
					textI += data.count

					prevNodeWidth = 0
					prevNodeHeight += Math.max(...curLineHeights)

					if (data === positionContainer.node) {
						// TODO: Maintain measure width for current line
						//context.fillStyle = _this.colourHex
						//context.fillRect(
						//	0,
						//	(line - 1) * _this.fontSize + 2,
						//	1.5 * _this.canvasScale,
						//	_this.fontSize + 4)
					}
					break
				}
			}

			if (_this.canvasDebug === true) {
				// Set background color based on data.type
				if (data.type === "text") {
					context.fillStyle = "rgba(0, 0, 255, 0.1)"
				}
				else if (data.type === "fragment") {
					context.fillStyle = "rgba(200, 100, 0, 0.1)"
				}
				context.fillRect(startX, startY, endX - startX, endY - startY)

				context.save()
				context.strokeStyle =_this.colourHex
				context.lineWidth = 2
				context.beginPath()
				context.rect(startX, startY, endX - startX, endY - startY)
				context.stroke()

				// Add node type label
				context.fillStyle = "#fff"
				context.font = `${12 * _this.canvasScale}px Arial`
				const debugMeasure = context.measureText(data.type)
				context.fillRect(startX + 2, startY + 2, debugMeasure.width, 16)
				context.fillStyle = "#000"
				context.fillText(data.type, startX + 2, startY + 16)
				context.restore()
			}

			return bounds
		}
		renderNode(this.data, this)
	}

	/**
     * @method optimiseData
     * @description Optimizes the document data
     * @param {string} data - The data to optimize
     * @returns {string} The optimized data
     */
	optimiseData(data) {
		throw new Error("Optimise data not implemented")
	}

	/**
	 * @method realToTextPosition
	 * @description Converts real coordinates to text position
	 * @param {number} offsetX - The X offset
	 * @param {number} offsetY - The Y offset
	 * @param {HTMLCanvasElement} canvas - The canvas element
	 * @returns {number} The text position
	 */
	realToTextPosition(offsetX, offsetY, canvas) {
		offsetX *= this.canvasScale
		offsetY *= this.canvasScale

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

	/**
	 * @method movePosition
	 * @description Moves the cursor position
	 * @param {number} movement - The movement direction
	 * @param {boolean} shiftPressed - Whether shift key is pressed
	 */
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

	/**
	 * @method positionInLine
	 * @description Gets the text position in the current line
	 * @param {number} globalIndex - The global index
	 * @param {Array<string>} lines - The lines of text
	 * @returns {number} The position in the current line
	 */
	positionInLine(globalIndex, lines) {
		const positionContainer = this.getPositionContainer()
		const containerParent = this.getParentNode(positionContainer.node)
		const containerIndex = containerParent
		console.log(containerParent)

		throw new Error("Position in line not implemented")
	}

	/**
	 * @static
	 * @method getLineHeights
	 * @description Returns height of text line, requires a textposition
	 * @param {number} globalIndex - The global index
	 * @param {Array<string>} lines - The lines of text
	 * @param {number} [spacing=0] - The spacing between lines
	 * @returns {number} The total height of lines
	 */
	static getLineHeights(globalIndex, lines, spacing = 0) {
		let lineHeights = 0
		for (let line of lines.slice(0, globalIndex)) {
			let heightMeasure = context.measureText(line)
			lineHeights += heightMeasure.actualBoundingBoxAscent + heightMeasure.actualBoundingBoxDescent
			lineHeights += spacing
		}
		return lineHeights
	}

	/**
	 * @method getLines
	 * @description Returns only the text lines in the document
	 * @returns {Array<string>} The lines of text
	 */
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
		throw new Error("Add style not implemented ")
	}

	/**
	 * @method getText
	 * @description Gets the full text content of the document
	 * @returns {string} The text content
	 */
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

	/**
	 * @method getPositionContainer
	 * @description Gets the container node at the current position
	 * @returns {{node: DocumentFragment|Text|NewLine, relativePosition: number}} The container node and relative position
	 */
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

	/**
	 * @method getParentNode
	 * @description Gets the parent node of a given node
	 * @param {DocumentFragment|Text|NewLine} targetNode - The target node
	 * @returns {DocumentFragment|null} The parent node or null if not found
	 */
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


	/**
	 * @method getNextSibling
	 * @description Gets the next sibling of a given node
	 * @param {DocumentFragment|Text|NewLine} targetNode - The target node
	 * @returns {DocumentFragment|Text|NewLine|null} The next sibling or null if not found
	 */
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

	/**
	 * @method insertText
	 * @description Attempts to create or append to text node at cursor position containing given text
	 * @param {string} value - The text to insert
	 */
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

	/**
	 * @method addNewLine
	 * @description Adds a new line at the current position
	 */
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

	/**
	 * @method deleteSelection
	 * @description Deletes the currently selected text
	 */
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

	/**
	 * @method getSelectionText
	 * @description Gets the currently selected text
	 * @returns {string} The selected text
	 */
	getSelectionText() {
		throw new Error("Get selection text not implemented")
	}

	/**
	 * @method setSelection
	 * @description Sets the current selection
	 * @param {number} start - The start position of the selection
	 * @param {number|null} [end=null] - The end position of the selection
	 */
	setSelection(start, end = null) {
		throw new Error("Set selection not implemented")
	}

	/**
	 * @method clearSelection
	 * @description Clears the current selection
	 */
	clearSelection() {
		this.selection.start = 0
		this.selection.end = 0
		this.selection.shiftKeyPivot = null
	}

	/**
	 * @method selectAll
	 * @description Selects all text in the document
	 */
	selectAll() {
		this.position = 0
		this.selection.start = 0
		this.selection.end = this.getText().length
	}

	/**
	 * @method hasSelection
	 * @description Checks if there is currently a selection
	 * @returns {boolean} True if there is a selection, false otherwise
	 */
	hasSelection() {
		return !((this.selection.start == 0 && this.selection.end == 0)
			|| this.selection.end - this.selection.start == 0)
	}
}