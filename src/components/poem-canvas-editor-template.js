"use strict";
import { html, css, defineAndInject } from "./component-registrar.js"

export class PoemCanvasEditor extends HTMLElement {
	document = null
	canvasScale = 1.5
	cursor = true

	constructor() {
		super()
		this.attachShadow({ mode: "open" })
	}

	connectedCallback() {
		this.shadowRoot.innerHTML = html`
			<link rel="stylesheet" href="styles.css">
			<div id="suggestions" class="suggestions" style="display: none">
				<!--Rhyme suggestions-->
			</div>
			<!--Hidden real input allows for mobile virtual keyboard, autocompletion and accessibility-->
			<textarea type="text" id="editorInput" virtualkeyboardpolicy="manual"></textarea>
			<!--Virtual canvas text editor to render editor document-->
			<canvas id="editorCanvas" tabindex="0"></canvas>
			<div id="editorContext">
				<button type="button" disabled>
					<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
						<path d="M280-200v-80h284q63 0 109.5-40T720-420q0-60-46.5-100T564-560H312l104 104-56 56-200-200 200-200 56 56-104 104h252q97 0 166.5 63T800-420q0 94-69.5 157T564-200H280Z" />
					</svg>
					Undo
					<span>Ctrl + Z</span>
				</button>
				<button type="button" disabled>
					<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
						<path d="M396-200q-97 0-166.5-63T160-420q0-94 69.5-157T396-640h252L544-744l56-56 200 200-200 200-56-56 104-104H396q-63 0-109.5 40T240-420q0 60 46.5 100T396-280h284v80H396Z" />
					</svg>
					Redo
					<span>Ctrl + Shift + Z</span>
				</button>
				<button type="button" onclick="
					navigator.clipboard.writeText(this.shadowThis.document.getSelectionText())
					this.shadowThis.document.deleteSelection()
					this.shadowThis.document.renderCanvasData(editorCanvas, this.cursor)
				">
					<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
						<path d="M760-120 480-400l-94 94q8 15 11 32t3 34q0 66-47 113T240-80q-66 0-113-47T80-240q0-66 47-113t113-47q17 0 34 3t32 11l94-94-94-94q-15 8-32 11t-34 3q-66 0-113-47T80-720q0-66 47-113t113-47q66 0 113 47t47 113q0 17-3 34t-11 32l494 494v40H760ZM600-520l-80-80 240-240h120v40L600-520ZM240-640q33 0 56.5-23.5T320-720q0-33-23.5-56.5T240-800q-33 0-56.5 23.5T160-720q0 33 23.5 56.5T240-640Zm240 180q8 0 14-6t6-14q0-8-6-14t-14-6q-8 0-14 6t-6 14q0 8 6 14t14 6ZM240-160q33 0 56.5-23.5T320-240q0-33-23.5-56.5T240-320q-33 0-56.5 23.5T160-240q0 33 23.5 56.5T240-160Z" />
					</svg>
					Cut
					<span>Ctrl + X</span>
				</button>
				<button type="button" onclick="
					const selectionText = this.shadowThis.document.getSelectionText()
					if (selectionText) {
						navigator.clipboard.writeText()
						document.body.appendChild(createFromData('subliminal-notification', {
							message: 'Selection copied to clipboard'
						}))
					}
					else {
						document.body.appendChild(createFromData('subliminal-notification', {
							message: 'Couldn\'t copy selection text to clipboard. No selection present'
						}))
					}
				">
					<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
						<path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z" />
					</svg>
					Copy
					<span>Ctrl + C</span>
				</button>
				<button type="button" onclick="
					if (navigator.clipboard.readText) { // HACK: See handler in input catcher
						navigator.clipboard.readText().then((clipText) => {
							this.shadowThis.document.insertText(clipText)
							this.shadowThis.renderCanvasData(this.shadowThis.editorCanvas, this.cursor)
						})
					}
					else {
						document.body.appendChild(createFromData('subliminal-notification', {
							message: 'Couldn\'t copy text to clipboard. Please give site clipboard permissions'
						}))
					}
				">
					<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
						<path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h167q11-35 43-57.5t70-22.5q40 0 71.5 22.5T594-840h166q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560h-80v120H280v-120h-80v560Zm280-560q17 0 28.5-11.5T520-800q0-17-11.5-28.5T480-840q-17 0-28.5 11.5T440-800q0 17 11.5 28.5T480-760Z" />
					</svg>
					Paste
					<span>Ctrl + V</span>
				</button>
				<button type="button" onclick="
					this.shadowThis.document.deleteSelection()
					this.shadowThis.document.renderCanvasData(this.shadowThis.editorCanvas, this.cursor)
				">
					<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
						<path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
					</svg>
					Delete
					<span>Del</span>
				</button>
				<button type="button" onclick="
					this.shadowThis.document.selectAll()
					this.shadowThis.document.renderCanvasData(this.shadowThis.editorCanvas, this.cursor)
				">
					<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
						<path d="M280-280v-400h400v400H280Zm80-80h240v-240H360v240ZM200-200v80q-33 0-56.5-23.5T120-200h80Zm-80-80v-80h80v80h-80Zm0-160v-80h80v80h-80Zm0-160v-80h80v80h-80Zm80-160h-80q0-33 23.5-56.5T200-840v80Zm80 640v-80h80v80h-80Zm0-640v-80h80v80h-80Zm160 640v-80h80v80h-80Zm0-640v-80h80v80h-80Zm160 640v-80h80v80h-80Zm0-640v-80h80v80h-80Zm160 640v-80h80q0 33-23.5 56.5T760-120Zm0-160v-80h80v80h-80Zm0-160v-80h80v80h-80Zm0-160v-80h80v80h-80Zm0-160v-80q33 0 56.5 23.5T840-760h-80Z" />
					</svg>
					Select all
					<span>Ctrl + A</span>
				</button>
			</div>`
		const style = document.createElement("style")
		style.innerHTML = css`
			#editorCanvas {
				display: block;
				width: 100%;
				height: 100%;
				cursor: text;
			}
			#editorCanvas:focus {
				outline: none;
			}
			#editorInput {
				position: absolute;
				opacity: 0;
				pointer-events: none;
			}
			#editorContext {
				display: flex;
				visibility: hidden;
				transition: left 0.1s ease 0s;
				position: fixed;
				width: 200px;
				background-color: var(--button-transparent);
				backdrop-filter: blur(5px);
				border-radius: 4px;
				box-shadow: 0px 0px 10px #656565;
				border: 1px solid darkgray;
				flex-direction: column;
				padding: 4px;
				row-gap: 4px;
			}
			#editorContext > button {
				height: 32px;
				background-color: transparent;
				border: 1px solid var(--button-opaque);
				display: flex;
				align-items: center;
				column-gap: 8px;
				transition: .05 transform;
				user-select: none;
			}
			#editorContext > button:hover {
				background-color: var(--button-opaque-hover);
			}
			#editorContext > button:active {
				transform: scale(0.98);
			}
			#editorContext > button > svg {
				opacity: 0.6;
				fill: var(--text-colour);
			}
			#editorContext > button > span {
				font-weight: bold;
				opacity: 0.4;
				flex-grow: 1;
				text-align: end;
			}
			.suggestions {
				width: 192px;
				position: absolute;
				background: #bdbdbd;
				z-index: 3;
				border-radius: 4px;
				top: 0px;
				display: flex;
				background-color: var(--button-transparent);
				flex-direction: column;
				border: 1px solid gray;
				overflow: clip;
				overflow-y: scroll;
			}
			.suggestions-item {
				padding: 8px;
				display: flex;
			}
			.suggestions-item > span:nth-child(1) {
				flex-grow: 1;
			}
			.suggestions-item > span:nth-child(2) {
				font-size: 10px;
				opacity: 0.6;
			}`
		this.shadowRoot.appendChild(style)
		defineAndInject(this, this.shadowRoot)

		// Apply attributes
		this.document = new EditorDocument(1.0, 18)
		this.canvasScale = Number(this.getAttribute("scale") || 1.5)
		this.cursor = !!this.getAttribute("cursor")
		this.tabIndex = "0"

		// Event listeners
		this.editorInput.addEventListener("keydown", (event) => {
			if (!(event.ctrlKey && event.key.toLowerCase() === 'v')) {
				this.editorCanvas.dispatchEvent(new event.constructor(event.type, event))
			}
			// Uses clipboard API if possible
			else if (navigator.clipboard.readText) {
				navigator.clipboard.readText()
					.then((paste) => {
						this.document.insertText(paste)
						this.document.renderCanvasData(this.editorCanvas)
					})
					.catch((error) => {
						alert('Could not paste text. Please give the site access to the clipboard')
					})
			}
		})
		this.editorInput.addEventListener("paste", (event) => {
			// WORKAROUND: For browsers not supporting the navigator clipboard readText API
			// we let the paste (usually handled from) keydown event trickle through to an onpaste
			// event, catch the text, and then pass it to the editor
			if (navigator.clipboard.readText) return
			const paste = (event.clipboardData || window.clipboardData).getData('text')
			this.document.insertText(paste)
			this.document.renderCanvasData(this.editorCanvas)
		})
		this.editorCanvas.addEventListener("contextmenu", (event) => {
			this.editorContext.style.left = (event.clientX) + 'px'
			this.editorContext.style.top = (event.clientY) + 'px'
			this.editorContext.style.visibility = 'visible'
			return event.preventDefault()
		})
		this.editorCanvas.addEventListener("mousedown", (event) => {
			if (event.button === 2) return
			event.preventDefault()
			// TODO: handle virtkeyboard geometry in scrolldown
			this.editorInput.focus()
			navigator.virtualKeyboard?.show()
			this.editorCanvas['pressed'] = true
			this.document.clearSelection()
			this.document.position = this.document.realToTextPosition(event.offsetX, event.offsetY, this.editorCanvas)
			this.document.renderCanvasData(this.editorCanvas, this.cursor)
			this.editorContext.style.visibility = 'hidden'
		})
		this.editorCanvas.addEventListener("mouseup", (event) => {
			this.editorCanvas['pressed'] = false
		})
		this.editorCanvas.addEventListener("mousemove", (event) => {
			if (this.editorCanvas['pressed']) {
				let endPosition = this.document.realToTextPosition(event.offsetX, event.offsetY, this.editorCanvas)
				this.document.selection.start = this.document.position > endPosition ? endPosition : this.document.position
				this.document.selection.end = this.document.position > endPosition ? this.document.position : endPosition
				this.document.renderCanvasData(this.editorCanvas, this.cursor)
			}
		})
		this.editorCanvas.addEventListener("dblclick", (event) => {
			// TODO: Select word on mobile handles
		})
		this.editorCanvas.addEventListener("keydown", (event) => {
			if (event.key === 'Backspace') {
				this.document.deleteText()
			}
			else if (event.key === 'Delete') {
				this.document.deleteText(-1)
			}
			else if (event.key === 'Enter') {
				this.document.addNewLine()
				// TODO: only scroll down if cursor becomes off the screen
				setTimeout(() => window.scrollTo(0, 1e5), 10)
			}
			else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
				this.document.movePosition(
					event.key == 'ArrowLeft'
						? positionMovements.left
						: event.key == 'ArrowRight'
						? positionMovements.right
						: event.key == 'ArrowUp'
						? positionMovements.up
						: positionMovements.down, event.shiftKey)
			}
			else if (event.key == 'Home') {
				throw new Error('\'Home\' control key is not implemented')
			}
			else if (event.key == 'End') {
				throw new Error('\'End\' control key is not implemented')
			}
			else if (event.key == 'Tab') {
				this.document.insertText('\t')
			}
			else if (event.key === 'Shift' || event.key.length > 1) {
				return
			}
			else if (event.ctrlKey) {
				switch (event.key.toLowerCase()) {
					case 'a': {
						this.document.selectAll()
						break
					}
					case 'x': {
						navigator.clipboard.writeText(this.document.getSelectionText())
						this.document.deleteSelection()
						break
					}
					case 'c': {
						navigator.clipboard.writeText(this.document.getSelectionText())
						break
					}
					case 'v': {
						if (navigator.clipboard.readText) { // HACK: See handler in input catcher
							navigator.clipboard.readText().then((clipText) => this.document.insertText(clipText))
						}
						break
					}
				}
			}
			else {
				this.document.insertText(event.key)
			}
			this.document.renderCanvasData(this.editorCanvas,this.cursor)
		})
		this.editorCanvas.addEventListener("blur", (event) => {
			this.document.renderCanvasData(this.editorCanvas, false)
		})
		this.editorCanvas.addEventListener("focus", (event) => {
			this.document.renderCanvasData(this.editorCanvas, this.cursor)
		})

		// External handlers
		this.addEventListener("blur", () => {
			this.editorContext.style.visibility = 'hidden'
		})
		window.addEventListener("resize", () => {
			this.updateCanvas()
		})
		this.updateCanvas()
		this.syncInputCatcher()
	}

	useDocument(document) {
		this.document = document
		this.updateCanvas()
		this.syncInputCatcher()
	}

	syncInputCatcher() {
		// Ideally input catcher is a 100% plaintext synced version of the canvas render
		// output, manual intervention is required for slight discrepancies between how
		// the real input catcher and emulated canvas text editor work
		this.editorInput.textContent = this.document.getText()
		this.editorInput.style.width = this.editorCanvas.offsetWidth + "px"
		this.editorInput.style.height = this.editorCanvas.offsetHeight + "px"
	}

	updateCanvas() {
		this.editorCanvas.width = this.editorCanvas.offsetWidth * this.canvasScale
		this.editorCanvas.height = this.editorCanvas.offsetHeight * this.canvasScale
		this.document.renderCanvasData(this.editorCanvas, this.cursor)
	}
}

customElements.define("poem-canvas-editor", PoemCanvasEditor)