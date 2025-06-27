"use strict";
import { DocumentNode } from "./nodes";

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

class EditorDocument {
	/**@type {number}*/position
	/**@type {{ position: number, end: number, shiftKeyPivot: number }}*/selection
	/**@type {DocumentFragment|null}*/data
	/**@type {TextEncoder}*/encoder
	/**@type {number}*/canvasScale
	/**@type {boolean}*/canvasDebug

	/**
	 * 
	 * @param {string|DocumentFragment|null} data Text data / document fragment that document will be initialised with
	 * @param {number} canvasScale Oversample factor of canvas output
	 * @param {number} fontSize CSS pixel default size of rendered text 
	 * @param {string} colourHex CSS default colour of rendered text
	 */
	constructor(data=null, canvasScale=1, fontSize=18, colourHex=getComputedStyle(document.documentElement).getPropertyValue("--text-colour")) {
		if (typeof data === "string") {
			this.data = new DocumentFragment();
		}
		else if (data instanceof DocumentFragment) {
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
	 * Performs debug rendering for the bounding boxes of nodes which make up a document
	 * @param {HTMLCanvasElement} canvas 
	 */
	renderBoundingBoxes(canvas) {
		throw new Error("renderBoundingBoxes not implemented!")
	}

	/**
	 * @method renderCanvasData
	 * @description Renders the document data on a canvas
	 * @param {HTMLCanvasElement} canvas - The canvas to render on
	 * @param {boolean} [cursor=true] - Whether to render the cursor
	 */
	renderCanvasData(canvas, cursor = true) {
		throw new Error("renderCanvasData not implemented!")
	}

	/**
     * @method optimiseData
     * @description Optimizes the document data
     * @param {string} data - The data to optimize
     * @returns {string} The optimized data
     */
	optimiseData(data) {
		throw new Error("optimiseData not implemented!")
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
		throw new Error("realToTextPosition not implemented!")
	}

	/**
	 * @method movePosition
	 * @description Moves the cursor position
	 * @param {number} movement - The movement direction
	 * @param {boolean} shiftPressed - Whether shift key is pressed
	 */
	movePosition(movement, shiftPressed) {
		throw new Error("movePosition not implemented!")
	}

	/**
	 * @method positionInLine
	 * @description Gets the text position in the current line
	 * @param {number} globalIndex - The global index
	 * @param {Array<string>} lines - The lines of text
	 * @returns {number} The position in the current line
	 */
	positionInLine(globalIndex, lines) {
		throw new Error("positionInLine not implemented!")
	}

	/**
	 * @method getText
	 * @description Gets the full text content of the document
	 * @returns {string} The text content
	 */
	getText() {
		throw new Error("getText not implemented!")
	}

	/**
	 * @method getPositionContainer
	 * @description Gets the container node at the current position
	 * @returns {{node: DocumentNode, relativePosition: number}} The container node and relative position
	 */
	getPositionContainer() {
		throw new Error("getPositionContainer not implemented!")
	}

	/**
	 * @method getParentNode
	 * @description Gets the parent node of a given node
	 * @param {DocumentNode} targetNode - The target node
	 * @returns {DocumentNode|null} The parent node or null if not found
	 */
	getParentNode(targetNode) {
		throw new Error("getParentNode not implemented!")
	}


	/**
	 * @method getNextSibling
	 * @description Gets the next sibling of a given node
	 * @param {DocumentNode} targetNode - The target node
	 * @returns {DocumentNode|null} The next sibling or null if not found
	 */
	getNextSibling(targetNode) {
		throw new Error("Get next sibling not implemented!")
	}

	/**
	 * @method insertText
	 * @description Attempts to create or append to text node at cursor position containing given text
	 * @param {string} value - The text to insert
	 */
	insertText(value) {
		throw new Error("Insert text not implemented!")
	}

	/**
	 * @method addNewLine
	 * @description Adds a new line at the current position
	 */
	addNewLine() {
		throw new Error("Add new line not implemented!")
	}

	/**
	 * @method deleteSelection
	 * @description Deletes the currently selected text
	 */
	deleteSelection() {
		throw new Error("Delete selection not implemented")
	}

	deleteText(count = 1) {
		throw new Error("Delete text not implemented")
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
		throw new Error("Clear selection not implemented")
	}

	/**
	 * @method selectAll
	 * @description Selects all text in the document
	 */
	selectAll() {
		throw new Error("Select all not implemented")
	}

	/**
	 * @method hasSelection
	 * @description Checks if there is currently a selection
	 * @returns {boolean} True if there is a selection, false otherwise
	 */
	hasSelection() {
		throw new Error("Has selection not implemented")
	}
}

