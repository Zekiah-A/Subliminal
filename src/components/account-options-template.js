"use strict";
import { LitElement, html, css } from "lit";
import { isLoggedIn as getLoginState, getAccountData, signout } from "../account-manager.js";
import "./auth/auth-dialog.js";

/**
 * @typedef {Object} AccountData
 * @property {string} name
 * @property {string} image
 */

/**
 * @typedef {Object} LoginFinishedEventDetail
 * @property {"signin" | "signup" | "cancel"} type
 * @property {Object | null} data
 */

class AccountOptions extends LitElement {
	static properties = {
		isLoggedIn: { type: Boolean, state: true },
		accountData: { type: Object, state: true }
	};

	static styles = css`
		.account-options {
			display: flex;
		}

		.login-button {
			height: 100%;
		}
		
		.account-image {
			height: 48px;
			aspect-ratio: 1/1;
			object-fit: cover;
			border-radius: 4px;
		}
		
		.account-link {
			display: flex;
			height: 100%;
			justify-content: center;
			width: 100px;
			column-gap: 8px;
			align-items: center;
		}
	`;

	constructor() {
		super();
		/** @type {boolean} */
		this.isLoggedIn = false;
		/** @type {AccountData | null} */
		this.accountData = null;
	}

	/** @returns {void} */
	connectedCallback() {
		super.connectedCallback();
		this.#checkLoginState();
	}

	/** @returns {import("lit").TemplateResult} */
	render() {
		return html`
			<link rel="stylesheet" href="styles.css">
			${this.isLoggedIn ? this.#renderAccountOptions() : this.#renderLoginButton()}
		`;
	}

	/** @returns {import("lit").TemplateResult} */
	#renderLoginButton() {
		return html`
			<input 
				type="button" 
				class="login-button" 
				value="Login to Subliminal"
				@click=${this.#handleLoginClick}>
		`;
	}

	/** @returns {import("lit").TemplateResult} */
	#renderAccountOptions() {
		return html`
			<div class="account-options">
				<a href="account" class="account-link">
					<span>${this.accountData?.name || "Me"}</span>
					<img 
						class="account-image" 
						src=${this.accountData?.image || "https://user-images.githubusercontent.com/11250/39013954-f5091c3a-43e6-11e8-9cac-37cf8e8c8e4e.jpg"}
						alt="Account image">
				</a>
				<input 
					type="button" 
					value="Logout" 
					@click=${this.#trySignout}>
			</div>
		`;
	}

	async #handleLoginClick() {
		/**@type {(import("./auth/auth-dialog.js").AuthDialog)|null}*/
		const authDialogOld = document.querySelector("sb-auth-dialog");
		if (authDialogOld) {
			authDialogOld.remove();
		}

		const loginSignup = /**@type {(import("./auth/auth-dialog.js").AuthDialog)}*/(document.createElement("sb-auth-dialog"));
		document.body.appendChild(loginSignup);

		loginSignup.addEventListener("finished", (/**@type {Event}*/e) => {
			if (!(e instanceof CustomEvent)) {
				throw new Error("Login signup finished event was not of type CustomEvent");
			}

			this.#loginCallback();
		});

        await loginSignup.updateComplete;
		loginSignup.open();
	}

	/** @returns {Promise<void>} */
	async #checkLoginState() {
		try {
			const loggedIn = await getLoginState();
			if (loggedIn) {
				await this.#loginCallback();
			}
		}
		catch (err) {
			console.error("Error checking login state:", err);
			this.isLoggedIn = false;
		}
	}

	/** @returns {void} */
	#trySignout() {
		signout();
	}

	/** @returns {Promise<void>} */
	async #loginCallback() {
		this.isLoggedIn = true;
		
		try {
			/** @type {AccountData | null} */
			const accountData = await getAccountData();
			if (accountData) {
				this.accountData = accountData;
			}
		}
		catch (err) {
			console.error("Error getting account data:", err);
		}
	}
}
customElements.define("account-options", AccountOptions);