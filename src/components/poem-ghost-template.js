"use strict";
class PoemGhost extends HTMLElement {
	constructor() {
		super()
	}

	seedRandom(seed) {
		let result = Math.sin(seed) * 10000
		return function() {
			result = Math.sin(result) * 10000
			return result - Math.floor(result)
		}
	}

	connectedCallback() {
		const length = +this.getAttribute("length") || 10
		const seed = +this.getAttribute("seed") || 3
		const pseudoRandom = this.seedRandom(seed)

		for (let i = 0; i < length; i++) {
			const random = pseudoRandom()
			const ghostEl = document.createElement("div")
			ghostEl.style.height = "18px"
			if (random > 0.2) {
				ghostEl.style.backgroundColor = "var(--text-colour)"
				ghostEl.style.opacity = random * 0.2 + 0.2
				ghostEl.style.borderRadius = "8px"
				ghostEl.style.marginBottom = "2px"
				ghostEl.style.width = (this.parentElement.offsetWidth * random * 0.4 + 0.5 * this.offsetWidth) + "px"    
			}

			this.appendChild(ghostEl)
		}
	}
}
customElements.define("subliminal-poem-ghost", PoemGhost)
