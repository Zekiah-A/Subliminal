// error-display.js
"use strict";
import { LitElement, html, css } from "lit";

export class ErrorDisplay extends LitElement {
	static properties = {
		errorMessage: { type: String }
	};

	static styles = css`
		:host {
			display: block;
		}

		.error-message {
			color: var(--error-color, #dc3545);
			padding: 16px;
			background: var(--error-background, #f8d7da);
			border: 1px solid var(--error-border, #f5c6cb);
			border-radius: 4px;
			margin-bottom: 16px;
		}

		.button-row {
			display: flex;
			column-gap: 8px;
		}
	`;

	constructor() {
		super();
		this.errorMessage = "";
	}

	render() {
		return html`
			<link rel="stylesheet" href="/styles.css">
			<div class="error-message">${this.errorMessage}</div>
			<div class="button-row">
				<button type="button" class="popup-button" @click=${this.#handleClose}>
					Ok
				</button>
			</div>
		`;
	}

	#handleClose() {
		this.dispatchEvent(new CustomEvent("error-close", {
			bubbles: true,
			composed: true
		}));
	}
}
customElements.define("sb-error-display", ErrorDisplay);