"use strict";
import { LitElement, html, css } from "lit";
import { FormValidator } from "../../form-validator.js";

export class SigninForm extends LitElement {
	static styles = css`
		:host {
			display: block;
		}

		.form {
			display: flex;
			flex-direction: column;
			row-gap: 4px;
		}

		.button-row {
			display: flex;
			column-gap: 8px;
			margin-top: 8px;
		}

		input[type="file"] {
			display: none;
		}
	`;

	render() {
		return html`
			<link rel="stylesheet" href="/styles.css">
			<form class="form" @submit=${this.#handleSubmit}>
				<input 
					name="username"
					maxlength="16"
					type="text"
					class="popup-input"
					placeholder="Username"
					@input=${this.#handleUsernameInput}>
				<input 
					name="email"
					type="text"
					class="popup-input"
					placeholder="Email">
				<input 
					name="qrCode"
					type="file"
					accept="image/*"
					capture="environment">
				<button 
					type="submit"
					class="popup-button"
					style="margin-bottom: 8px;">
					Login
				</button>
			</form>
			<div class="button-row">
				<button 
					type="button"
					class="popup-button"
					@click=${this.#handleSignupClick}>
					I don't have an account
				</button>
				<button type="button" class="popup-button" disabled>
					Account recovery
				</button>
			</div>
		`;
	}

	/**
	 * @param {Event} e
	 */
	#handleUsernameInput(e) {
		const target = /** @type {HTMLInputElement} */(e.target);
		target.value = FormValidator.sanitizeUsername(target.value);
	}

	/**
	 * @param {SubmitEvent} e
	 */
	#handleSubmit(e) {
		e.preventDefault();
		
		const form = /** @type {HTMLFormElement} */(e.target);
		const formData = new FormData(form);
		
		const username = /** @type {string} */(formData.get("username"));
		const email = /** @type {string} */(formData.get("email"));

		this.dispatchEvent(new CustomEvent("signin-submit", {
			detail: { username, email },
			bubbles: true,
			composed: true
		}));
	}

	#handleSignupClick() {
		this.dispatchEvent(new CustomEvent("goto-signup", {
			bubbles: true,
			composed: true
		}));
	}
}
customElements.define("sb-signin-form", SigninForm);