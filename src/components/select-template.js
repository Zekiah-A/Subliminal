"use strict";
import { html, css, defineAndInject } from "./component-registrar.js"

class SubliminalSelect extends HTMLElement {
	constructor() {
		super()
		this.attachShadow({ mode: "open" })
	}

	connectedCallback() {
		if (!this.shadowRoot) {
			throw new Error("Invalid shadowRoot");
		}

		this.shadowRoot.innerHTML = html`
			<button type="button" id="button" class="button" popovertarget="options">
				<span id="selected" class="selected"></span>
				<span id="arrow" class="arrow">⯆</span>
			</button>
			<dialog popover id="options" class="options" tabIndex="1">
				<slot></slot>
			</dialog>`;
		const style = document.createElement("style");
		style.innerHTML = css`
			@media (prefers-color-scheme: dark) {
				:root {
					--text-colour: #DADADA;
				}
			}

			:host {
				position: relative;
			}

			.button {
				background-color: var(--button-opaque);
				border: 1px solid #8f8f9d;
				border-radius: 4px;
				cursor: default;
				padding-left: 4px;
				padding-right: 4px;
				line-height: normal;
				display: flex;
				align-items: center;
				position: relative;
				user-select: none;
				width: 100%;
				height: 100%;
				color: var(--text-colour);
			}
			.button:hover {
				background-color: #85859269;
			}

			.options {
				background-color: var(--button-transparent);
				border-radius: 4px;
				margin: 8px 0 0 0;
				border: 1px solid darkgray;
				pointer-events: all !important;
				user-select: none;
				position: absolute;
				width: max-content;
				top: 100%;
				backdrop-filter: blur(8px);
				z-index: 1;
				color: var(--text-colour);
			}

			.options ::slotted(option) {
				padding-left: 4px;
				padding-right: 4px;
				height: 32px;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.options ::slotted(option[selected]) {
				background-color: darkgray;
			}

			.options ::slotted(option:hover) {
				background-color: darkgray;
			}

			.selected {
				margin-right: 4px;
			}

			.arrow {
				transition: transform 0.1s ease 0s;
			}

			@media screen and (orientation: portrait) {
				.options {
					position: fixed;
					z-index: 2;
					left: 50% !important;
					transform: translateX(-50%) scale(2);
					top: 270px;
				}
			}
		`;
		this.shadowRoot.append(style);
		defineAndInject(this, this.shadowRoot);

		const buttonElement = /**@type {HTMLButtonElement}*/(this.shadowRoot.getElementById("button"));
		const selectedElement = /**@type {HTMLElement}*/(this.shadowRoot.getElementById("selected"));
		const optionsElement = /**@type {HTMLDialogElement}*/(this.shadowRoot.getElementById("options"));
		const arrowElement = /**@type {HTMLElement}*/(this.shadowRoot.getElementById("arrow"));

		selectedElement.textContent = this.getAttribute("placeholder") + " ";

		const _this = this;
		function recalcOptionsPosition() {
			const overflowLeft =
				_this.getBoundingClientRect().right -
				optionsElement.offsetWidth;
			const top = _this.getBoundingClientRect().bottom +
				window.scrollY;

			optionsElement.style.left = overflowLeft + "px";
			optionsElement.style.top = top + "px";
		}

		optionsElement.addEventListener("toggle", () => {
			if (optionsElement.matches(":popover-open")) {
				arrowElement.style.transform = "scaleY(-1)";
				recalcOptionsPosition();
			}
			else {
				arrowElement.style.transform = "";
			}
		});

		window.addEventListener("scroll", recalcOptionsPosition);
		window.addEventListener("resize", recalcOptionsPosition);
		recalcOptionsPosition();
	}
}

customElements.define("subliminal-select", SubliminalSelect);