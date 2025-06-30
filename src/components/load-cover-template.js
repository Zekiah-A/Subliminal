"use strict";
import { css } from "./component-registrar.js";

class PoemLoadCover extends HTMLElement {
	constructor() {
		super()
	}

	connectedCallback() {
		const loadContainer = document.createElement("div")
		loadContainer.classList.add("load-content") 
		const logoContainer = document.createElement("div")
		logoContainer.classList.add("load-logo")
		const logoImage = document.createElement("img")
		logoImage.classList.add("icon-image")
		logoImage.src = "assets/AbbstraktDog.png"
		logoImage.width = 96
		logoImage.height = 96
		logoImage.alt = "Subliminal"
		logoContainer.appendChild(logoImage)
		const brand = document.createElement("span")
		brand.textContent = "poemanthology.org"
		logoContainer.appendChild(brand)
		loadContainer.appendChild(logoContainer)
		const loadLabel = document.createElement("h2")
		loadLabel.classList.add("load-label")
		const loadingMessages = [
			"Loading: Preparing for it...",
			"Loading: Crossing the Ts...",
			"Loading: Dotting every I...",
			"Loading: Looking busy...",
			"Loading: Getting things ready...",
		]
		loadLabel.textContent = loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
		loadContainer.appendChild(loadLabel)
		this.appendChild(loadContainer)

		const style = document.createElement("style")
		style.innerHTML = css`
			subliminal-load-cover {
				position: fixed;
				padding: 0;
				margin: 0;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				z-index: 1000;
				background: #ffffff33;
				backdrop-filter: blur(15px);
				display: flex;
				text-align: center;
				justify-content: center;
				align-items: center;        
			}

			.load-content {
				display: flex;
				text-align: center;
				column-gap: 8px;
				justify-content: center;
				align-items: center;
				padding: 16px;
				border: 1px solid gray;
				border-radius: 8px;
				background: var(--background-transparent);
			}

			.load-label {
				margin: 0px;
			}

			.load-logo {
				display: flex;
				flex-direction: column;
				fill: var(--text-colour);
			}

			.load-logo > span {
				font-weight: bold;
				font-size: 8px;
				opacity: 0.6;
			}
			@media screen and (orientation:portrait) {
				.load-content {
					width: calc(100% - 32px);
				}    
			}
		`
		this.appendChild(style)
	}
}

customElements.define("subliminal-load-cover", PoemLoadCover)
