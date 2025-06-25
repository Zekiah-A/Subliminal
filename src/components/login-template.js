"use strict";
class LoginSignup extends HTMLElement {
	#nocancel = false

	constructor() {
		super()
		this.attachShadow({ mode: "open" })
	}

	connectedCallback() {
		// if ('value' in document.activeElement) checks done on the contents page are broken
		// by this element (will return <login-signup>) so this hack will tell it that this
		// this element does in fact catch input 
		this.value = true

		this.shadowRoot.innerHTML = html`
			<link rel="stylesheet" href="styles.css">
			<dialog id="login" class="popup" currentpage="signin">
				<div style="display: flex;flex-grow: 1;">
					<div id="back" onclick="this.shadowThis.login.setAttribute('currentpage', 'signin')">
						<svg style="fill: var(--text-colour);" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" height="32" width="32"><path d="m274-450 248 248-42 42-320-320 320-320 42 42-248 248h526v60H274Z"></path></svg>
					</div>
					<h2>Login to Subliminal:</h2>
					<div id="close" onclick="this.shadowThis.cancel()">
						<svg style="fill: var(--text-colour);" xmlns="http://www.w3.org/2000/svg" height="32" viewBox="0 -960 960 960" width="32" fill="#e8eaed"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
					</div>
				</div>
				<div id="loginSignin" class="page">
					<input id="loginSigninUsername" maxlength="16" type="text" class="popup-input" placeholder="Username" oninput="
						this.shadowThis.validateUsername(this)">
					<input id="loginSigninEmail" type="text" class="popup-input" placeholder="Email">
					<input id="loginQRInput" type="file" accept="image/*" capture="environment" style="display: none;">
					<button class="popup-button" onclick="this.shadowThis.signin(this.shadowThis.loginSigninUsername.value, this.shadowThis.loginSigninEmail.value);"
						style="margin-bottom: 8px;">Login</button>

					<div style="display:flex;column-gap:8px;margin-top:8px">
						<button class="popup-button" onclick="this.shadowThis.login.setAttribute('currentpage', 'signup');">
							I don't have an account
						</button>
						<button class="popup-button" disabled>Account recovery</button>
					</div>
				</div>
				<div id="loginSignup" class="page">
					<input id="signupUsername" type="text" class="popup-input" maxlength="16" oninput="
							this.shadowThis.validateUsername(this)        
							this.shadowThis.validateLoginSignup()"
						placeholder="Username*"
						onblur="this.reportValidity()"
						onchange="this.reportValidity()">
					<input id="signupEmail" type="text"
						oninput="this.shadowThis.validateLoginSignup()"
						onblur="this.reportValidity()"
						onchange="this.reportValidity()" class="popup-input" placeholder="Email*">
					<div>
						<label for="signupPromise">I promise to be a cool member of subliminal*</label>
						<input id="signupPromise" type="checkbox"
							oninput="this.shadowThis.validateLoginSignup()"
							onblur="this.reportValidity()"
							onchange="this.reportValidity()">
					</div>
					<div style="display:flex;column-gap:8px;margin-top:8px">
						<div id="signupButton" class="popup-button"
							onclick="
								this.shadowThis.signup(this.shadowThis.signupUsername.value, this.shadowThis.signupEmail.value)
									.then(() => this.shadowThis.login.setAttribute('currentpage', 'code'))
							" disabled>Create account
						</div>
					</div>
				</div>
				<div id="loginCode" class="page">
					<div class="login-code-banner">
						<img src="./assets/SmallLogo.png" width="32" height="32">
						<h3>It's time to confirm your account!</h3>
					</div>
					<p>If you're lucky we have sent you an email to verify your account, enter the code we sent you below to continue!</p>
					<input id="signupCode" type="text" class="popup-input" placeholder="email-code">
					<br>
					<div id="loginClose" class="popup-button" onclick="
							this.shadowThis.login.setAttribute('currentpage', 'signin')
							this.shadowThis.login.close()
							const finishEvent = new CustomEvent('finished', { type: 'signup' })
							this.dispatchEvent(finishEvent)
						" disabled="">Finish
					</div>
				</div>
				<div id="loginError" class="page">
					<div id="errorMessage"><!--Erorr message text--></div>
					<div style="display:flex;column-gap:8px;margin-top:8px">
						<button class="popup-button" onclick="this.shadowThis.login.close();">Ok</button>
					</div>
				</div>
			</dialog>
		`

		const style = document.createElement("style")
		style.innerHTML = css`
			#login[open] {
				display: flex;
				flex-direction: column;
				max-width: 400px;
				height: 236px;
				transition: .2s height;
			}

			#login[currentpage="signup"] {
				height: 220px;
			}

			#login[currentpage="code"] {
				height: 316px;
			}

			#close {
				cursor: pointer;
				position: absolute;
				top: 8px;
				right: 8px;
			}

			#back {
				cursor: pointer;
				max-width: 64px;
				transition: .2s max-width; 
			}
			#back > svg {
				transform: rotate(0deg) scale(1, 1);
				opacity: 1;
				transition: .2s transform, .2s opacity;
			}

			#login[currentpage="signin"] #back {
				max-width: 0px;
			}
			#login[currentpage="signin"] #back > svg {
				transform: rotate(180deg) scale(0.1, 1);
				opacity: 0;
			}

			.page {
				display: none;
			}
			
			#login > .page {
				flex-direction: column;
				row-gap: 4px;
			}

			#login[currentpage="signin"] > #loginSignin, #login[currentpage="signup"] > #loginSignup,
				#login[currentpage="error"] > #loginError, #login[currentpage="code"] > #loginCode {
				display: flex !important;
			}

			.login-code-banner {
				display: flex;
				column-gap: 16px;
				align-items: center;
				justify-content: center;
			}

			.login-code-banner > h3 {
				margin: 0;
			}

			#signupCode {
				height: 64px;
				font-size: 48px;
				text-align: center;
			}
		`
		this.shadowRoot.append(style)
	 
		// Allows us to use HTML element IDs inlinely in the component inner HTML & defines
		// all elements with IDs on this component's `this` 
		defineAndInject(this, this.shadowRoot)

		this.#nocancel = this.getAttribute("nocancel") !== null
		if (this.#nocancel) {
			this.close.style.display = "none"
		}
	}

	open() {
		this.login.showModal()
	}

	async signup(username, email) {
		try {
			const response = await fetch(serverBaseAddress + "/auth/signup", {
				method: "POST",
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ Username: username, Email: email }) // Convert to JSON format
			})

			if (!response.ok) {
				this.confirmFail("Signup response was denied.")
				return
			}

			const dataObject = await response.json()
			console.log(dataObject)
		}
		catch (error) {
			this.confirmFail(error)
		}
	}

	async signin(username, email) {
		let signinData = null
		try {
			const signinResponse = await fetch(serverBaseAddress + "/auth/signin", {
				method: "POST",
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, email })
			})

			if (!signinResponse.ok) {
				this.confirmFail("Signin response was denied.")
				return
			}

			signinData = await signinResponse.json()
			//sessionStorage.accountId = signinData.id
			//sessionStorage.accountToken = signinData.token
			this.login.close()
		}
		catch (error) {
			this.confirmFail(error)
		}

		const finishEvent = new CustomEvent("finished", { type: "signin", data: signinData })
		this.dispatchEvent(finishEvent)
	}

	cancel() {
		if (this.#nocancel) {
			return
		}
		this.login.close()
		const finishEvent = new CustomEvent("finished", { type: "cancel" })
		this.dispatchEvent(finishEvent)
	}


	validateUsername(input) {
		input.value = input.value.replace(/\W+/g, '').toLowerCase()
	}

	confirmFail(err) {
		this.errorMessage.textContent = err
		this.login.setAttribute("currentpage", "error")
	}

	validateLoginSignup() {
		const validUsernamePattern = /^[a-z][a-z0-9_.]{0,15}$/;
		const validEmailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
		let valid = true
		if (this.signupUsername.value.length == 0 || !this.signupUsername.value.match(validUsernamePattern)) {
			this.signupUsername.setCustomValidity("Invalid username, usernames should be lowercase with only digit, _ and . special characters")
			valid = false
		}
		else {
			this.signupUsername.setCustomValidity("")
		}
		if (!this.signupPromise.checked) {
			this.signupPromise.setCustomValidity("You have to agree to this!")
			valid = false
		}
		else {
			this.signupPromise.setCustomValidity("")
		}
		if (!this.signupEmail.value.match(validEmailPattern)) {
			this.signupEmail.setCustomValidity("Invalid email!")
			valid = false
		}
		else {
			this.signupEmail.setCustomValidity("")
		}

		if (!valid) {
			this.signupButton.setAttribute("disabled", "true")
		}
		else {
			this.signupButton.removeAttribute('disabled')
		}
	}
}


customElements.define("login-signup", LoginSignup)