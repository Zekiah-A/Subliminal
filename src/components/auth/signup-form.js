"use strict";
import { LitElement, html, css } from "lit";
import { FormValidator } from "../../form-validator.js";

export class SignupForm extends LitElement {
	static properties = {
		isValid: { type: Boolean, state: true }
	};

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

		.checkbox-row {
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.checkbox-row label {
			flex: 1;
		}
	`;

	constructor() {
		super();
		this.isValid = false;
	}

	render() {
		return html`
			<link rel="stylesheet" href="/styles.css">
			<form class="form" @submit=${this.#handleSubmit}>
				<input 
					name="username"
					type="text"
					class="popup-input"
					maxlength="16"
					placeholder="Username*"
					@input=${this.#handleUsernameInput}
					@blur=${this.#handleInputValidation}
					@change=${this.#handleInputValidation}>
				<input 
					name="email"
					type="text"
					class="popup-input"
					placeholder="Email*"
					@input=${this.#validateForm}
					@blur=${this.#handleInputValidation}
					@change=${this.#handleInputValidation}>
				<div class="checkbox-row">
					<label for="signupPromise">I promise to be a cool member of subliminal*</label>
					<input 
						id="signupPromise"
						name="promise"
						type="checkbox"
						@input=${this.#validateForm}
						@blur=${this.#handleInputValidation}
						@change=${this.#handleInputValidation}>
				</div>
				<div class="button-row">
					<button 
						type="submit"
						class="popup-button"
						?disabled=${!this.isValid}>
						Create account
					</button>
				</div>
			</form>
		`;
	}

	/**
	 * @param {Event} e
	 */
	#handleUsernameInput(e) {
		const target = /** @type {HTMLInputElement} */(e.target);
		target.value = FormValidator.sanitizeUsername(target.value);
		this.#validateForm();
	}

	/**
	 * @param {Event} e
	 */
	#handleInputValidation(e) {
		const target = /** @type {HTMLInputElement} */(e.target);
		target.reportValidity();
	}

	#validateForm() {
		const form = /** @type {HTMLFormElement} */(this.shadowRoot?.querySelector(".form"));
		if (!form) return;

		const formData = new FormData(form);
		const username = /** @type {string} */(formData.get("username") || "");
		const email = /** @type {string} */(formData.get("email") || "");
		const promise = formData.get("promise") === "on";

		const usernameInput = /** @type {HTMLInputElement} */(form.querySelector("input[name='username']"));
		const emailInput = /** @type {HTMLInputElement} */(form.querySelector("input[name='email']"));
		const promiseCheckbox = /** @type {HTMLInputElement} */(form.querySelector("input[name='promise']"));

		const usernameValidation = FormValidator.validateUsername(username);
		const emailValidation = FormValidator.validateEmail(email);

		usernameInput.setCustomValidity(usernameValidation.isValid ? "" : usernameValidation.message);
		emailInput.setCustomValidity(emailValidation.isValid ? "" : emailValidation.message);
		promiseCheckbox.setCustomValidity(promise ? "" : "You have to agree to this!");

		this.isValid = usernameValidation.isValid && emailValidation.isValid && promise;
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

		this.dispatchEvent(new CustomEvent("signup-submit", {
			detail: { username, email },
			bubbles: true,
			composed: true
		}));
	}
}
customElements.define("sb-signup-form", SignupForm);