"use strict";
import { LitElement, html, css } from "lit";
import { AuthService } from "../../auth-service.js";
import "./signin-form.js";
import "./signup-form.js";
import "./verification-form.js";
import "./error-display.js";

/**
 * @typedef {"signin" | "signup" | "verification" | "error"} PageType
 */

/**
 * @typedef {Object} SigninData
 * @property {string} username
 * @property {string} email
 */

export class AuthDialog extends LitElement {
	static properties = {
		currentPage: { type: String, reflect: true, attribute: "currentpage" },
		noCancel: { type: Boolean, reflect: true, attribute: "nocancel" },
		errorMessage: { type: String, state: true }
	};

	static styles = css`
		:host {
			display: block;
		}

		dialog {
			display: flex;
			flex-direction: column;
			max-width: 400px;
			height: 236px;
			transition: 0.2s height;
			overflow: hidden;
		}

		:host([currentpage="signup"]) dialog {
			height: 220px;
		}

		:host([currentpage="verification"]) dialog {
			height: 316px;
		}

		.header {
			display: flex;
			align-items: center;
			margin-bottom: 16px;
		}

		.back-button {
			cursor: pointer;
			max-width: 64px;
			transition: 0.2s max-width;
		}

		.back-button svg {
			transform: rotate(0deg) scale(1, 1);
			opacity: 1;
			transition: 0.2s transform, 0.2s opacity;
			fill: var(--text-colour, #333);
		}

		:host([currentpage="signin"]) .back-button {
			max-width: 0px;
		}

		:host([currentpage="signin"]) .back-button svg {
			transform: rotate(180deg) scale(0.1, 1);
			opacity: 0;
		}

		h2 {
			margin: 0;
		}

		.close-button {
			margin-left: auto;
			cursor: pointer;
		}

		.close-button svg {
			fill: var(--text-colour, #333);
		}

		.close-button[hidden] {
			display: none;
		}

		.page {
			display: none;
		}

		.page[active] {
			display: block;
		}
	`;

	constructor() {
		super();
		/** @type {PageType} */
		this.currentPage = "signin";
		this.noCancel = false;
		this.errorMessage = "";
	}

	render() {
		return html`
			<link rel="stylesheet" href="/styles.css">
			<dialog @click=${this.#handleDialogClick} class="popup">
				<div class="header">
					<div class="back-button" @click=${this.#goToSignin}>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" height="32" width="32">
							<path d="m274-450 248 248-42 42-320-320 320-320 42 42-248 248h526v60H274Z"></path>
						</svg>
					</div>
					${this.currentPage === "signin" ? html`
						<h2>Login to Subliminal:</h2>`
						: this.currentPage === "signup" ? html`
							<h2>Create a new account</h2>`
							: this.currentPage === "verification" ? html`
								<h2>Verify your account</h2>`
								: html`<h2>Error</h2>`
					} 
					<div class="close-button" ?hidden=${this.noCancel} @click=${this.#cancel}>
						<svg xmlns="http://www.w3.org/2000/svg" height="32" viewBox="0 -960 960 960" width="32">
							<path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
						</svg>
					</div>
				</div>
				<div class="page" ?active=${this.currentPage === "signin"}>
					<sb-signin-form 
						@signin-submit=${this.#handleSigninSubmit}
						@goto-signup=${this.#goToSignup}>
					</sb-signin-form>
				</div>
				<div class="page" ?active=${this.currentPage === "signup"}>
					<sb-signup-form @signup-submit=${this.#handleSignupSubmit}></sb-signup-form>
				</div>
				<div class="page" ?active=${this.currentPage === "verification"}>
					<sb-verification-form @verification-submit=${this.#handleVerificationSubmit}></sb-verification-form>
				</div>
				<div class="page" ?active=${this.currentPage === "error"}>
					<sb-error-display 
						.errorMessage=${this.errorMessage}
						@error-close=${this.#closeDialog}>
					</sb-error-display>
				</div>
			</dialog>
		`;
	}

	open() {
		const dialog = /** @type {HTMLDialogElement} */(this.shadowRoot?.querySelector("dialog"));
		dialog.showModal();
	}

	#closeDialog() {
		const dialog = /** @type {HTMLDialogElement} */(this.shadowRoot?.querySelector("dialog"));
		dialog.close();
	}

	/**
	 * @param {MouseEvent} e
	 */
	#handleDialogClick(e) {
		if (e.target instanceof HTMLDialogElement) {
			e.preventDefault();
		}
	}

	#goToSignin() {
		this.currentPage = "signin";
	}

	#goToSignup() {
		this.currentPage = "signup";
	}

	#cancel() {
		if (this.noCancel) {
			return;
		}
	
		this.#closeDialog();
		this.#dispatchFinishedEvent("cancel");
	}

	/**
	 * @param {CustomEvent} e
	 */
	async #handleSigninSubmit(e) {
		const { username, email } = e.detail;
		const result = await AuthService.signin(username, email);
		
		if (result.success) {
			this.#closeDialog();
			this.#dispatchFinishedEvent("signin", result.data);
		} else {
			this.#showError(result.error);
		}
	}

	/**
	 * @param {CustomEvent} e
	 */
	async #handleSignupSubmit(e) {
		const { username, email } = e.detail;
		const result = await AuthService.signup(username, email);
		
		if (result.success) {
			this.currentPage = "verification";
		} else {
			this.#showError(result.error);
		}
	}

	/**
	 * @param {CustomEvent} e
	 */
	#handleVerificationSubmit(e) {
		// For now, just close and dispatch signup success
		this.currentPage = "signin";
		this.#closeDialog();
		this.#dispatchFinishedEvent("signup");
	}

	/**
	 * @param {string | null} error
	 */
	#showError(error) {
		this.errorMessage = error || "An unknown error occurred";
		this.currentPage = "error";
	}

	/**
	 * @param {"signin" | "signup" | "cancel"} type
	 * @param {SigninData | null} data
	 */
	#dispatchFinishedEvent(type, data = null) {
		const finishEvent = new CustomEvent("auth-finished", { 
			detail: { type, data },
			bubbles: true,
			composed: true
		});
		this.dispatchEvent(finishEvent);
	}
}

customElements.define("sb-auth-dialog", AuthDialog);