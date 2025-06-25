"use strict";
class AccountOptions extends HTMLElement {
	constructor() {
		super()
		this.attachShadow({ mode: "open" })
	}

	connectedCallback() {
		this.shadowRoot.innerHTML = html`
			<link rel="stylesheet" href="styles.css">
			<input id="loginButton" type="button" class="login-button" value="Login to Subliminal">
			<div id="accountOptions" class="account-options" style="display: none;">
				<a href="account" class="account-link">
					<span id="accountName">Me</span>
					<img id="accountImage" class="account-image" src="https://user-images.githubusercontent.com/11250/39013954-f5091c3a-43e6-11e8-9cac-37cf8e8c8e4e.jpg">
				</a>
				<input id="logoutButton" type="button" value="Logout" onclick="this.shadowThis.trySignout()">
			</div>`
		const style = document.createElement("style")
		style.innerHTML = css`
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
			}`
		this.shadowRoot.appendChild(style)
		defineAndInject(this, this.shadowRoot)

		this.loginButton.addEventListener("click", () => {
			let loginSignup = document.querySelector("login-signup");
			if (loginSignup) {
				loginSignup.remove()
			}
			loginSignup = createFromData("login-signup");
			document.body.appendChild(loginSignup)
			loginSignup.addEventListener("finished", (d, e) => {
				this.loginCallback()
			})
			loginSignup.open()
		})

		isLoggedIn().then((loggedIn) => {
			if (loggedIn) {
				this.loginCallback()
			}
		})
	}

	trySignout() {
		if (typeof signout === "undefined") {
			signout()
		}
	}

	async loginCallback() {
		this.loginButton.style.display = "none"
		this.accountOptions.style.display = "flex"

		const accountData = await getAccountData()
		if (accountData) {
			
		}
	}
}

customElements.define("account-options", AccountOptions)
