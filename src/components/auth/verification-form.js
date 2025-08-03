"use strict";
import { LitElement, html, css } from "lit";

export class VerificationForm extends LitElement {
	static styles = css`
		:host {
			display: block;
		}

		.form {
			display: flex;
			flex-direction: column;
			row-gap: 4px;
		}

		.login-code-banner {
			display: flex;
			column-gap: 16px;
			align-items: center;
			justify-content: center;
		}

		.login-code-banner h3 {
			margin: 0;
		}

		.code-input {
			height: 64px;
			font-size: 48px;
			text-align: center;
		}

		p {
			margin: 16px 0;
		}
	`;

	render() {
		return html`
			<link rel="stylesheet" href="/styles.css">
			<div class="login-code-banner">
				<img src="./assets/SmallLogo.png" width="32" height="32">
				<h3>It's time to confirm your account!</h3>
			</div>
			<p>If you're lucky we have sent you an email to verify your account, enter the code we sent you below to continue!</p>
			<form class="form" @submit=${this.#handleSubmit}>
				<input 
					name="code"
					type="text"
					class="popup-input code-input"
					placeholder="email-code">
				<button 
					type="submit"
					class="popup-button">
					Finish
				</button>
			</form>
		`;
	}

	/**
	 * @param {SubmitEvent} e
	 */
	#handleSubmit(e) {
		e.preventDefault();
		
		const form = /** @type {HTMLFormElement} */(e.target);
		const formData = new FormData(form);
		
		const code = /** @type {string} */(formData.get("code"));

		this.dispatchEvent(new CustomEvent("verification-submit", {
			detail: { code },
			bubbles: true,
			composed: true
		}));
	}
}
customElements.define("sb-verification-form", VerificationForm);