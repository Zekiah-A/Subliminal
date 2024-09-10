class SubliminalHeader extends HTMLElement {
	constructor() {
		super()
		this.attachShadow({ mode: "open" })
	}

	connectedCallback() {
		this.shadowRoot.innerHTML = html`
			<div>
				<img src="Resources/AbbstrakDog.png" alt="Dog" width="48" height="48" onclick="window.location.href = window.location.origin">
				<h1 style="margin: 0px; align-self: center;">Subliminal</h1>
				<a href="contents">-&gt; Poems</a>
				<a href="account">-&gt; Profile</a>
				<a href="sounds">-&gt; Sounds</a>
				<div class="hilight" id="hilight"></div>
				<div id="right">
					<input id="loginButton" type="button" value="Login to Subliminal"
						onclick="
							let loginSignup = document.querySelector('login-signup');
							if (loginSignup) { loginSignup.remove() }
							loginSignup = createFromData('login-signup');
							this.parentDocument.body.appendChild(loginSignup)
							loginSignup.open()
						">
					<input id="logoutButton" type="button" value="Logout"
						onclick="window.location.reload(true)" style="display: none;"> <!-- TODO: This -->
				</div>
			</div>
			<hr style="margin: 0px; margin-left: 8px; margin-right: 8px;">`

		const style = document.createElement("style")
		style.innerHTML = css`
			/*Main page navigation header*/
			:host {
				position: fixed;
				top: 0;
				left: 0;
				width: 100%;
				max-width: 100%;
				backdrop-filter: blur(5px);
				background: transparent;
				z-index: 3;
				user-select: none;
			}
			
			:host > div {
				display: flex;
				column-gap: 16px;
				margin: 2px;
				margin-left: 16px;
				margin-right: 16px;
				height: 64px;
				position: relative;
			}
			
			p {
				text-align: end;
				margin: 0px;
				font-style: italic;
				opacity: 0.6;
				line-height: 64px;
				white-space: nowrap;
			}
			
			a {
				align-self: center;
				white-space: nowrap;
				/*Click hitboxes*/
				padding-top: 24px;
				padding-bottom: 24px;
			}

			span, div {
				font-family: Arial, Helvetica, sans-serif;
			}

			p, a {
				font-family: Arial, Helvetica, sans-serif;
				font-size: 110%;
			}            
			
			a[current] {
				background-color: #0074d90d;
				border-bottom: 4px solid var(--input-hilight);
			}
			
			img {
				align-self: center;
				cursor: pointer;
				transition: .2s transform;
			}
			
			img:hover {
				transform: rotate(10deg) scale(1.5);
			}
			
			img:active {
				transform: rotate(8deg) scale(1.1);
			}
			
			#right {
				flex-grow: 1;
				display: flex;
				justify-content: right;
				column-gap: 8px;
				padding: 8px;
			}

			hr {
				border: none;
				border-top: 1px solid gray;
				margin: 0px;
			}

			@media screen and (orientation:portrait) {
				p {
					display: none;
				}
			
				h1 {
					display: none;
				}
			
				img {
					width: 48px;
					height: 48px;
				}
			
				a {
					font-size: 3.4vw;
					flex: 1 1 auto;
					white-space: nowrap;
					overflow: hidden;
					height: 100%;
					box-sizing: border-box;
					text-align: center;
					display: flex;
					justify-content: center;
					align-items: center;
				}
			
				:host > div {
					margin-left: 8px;
					margin-right: 8px;
					height: 48px;
					column-gap: 4px;
				}

				#right {
					padding: 2px;
				}
				#right * {
					font-size: 10px;
				}
			}

			@media(prefers-color-scheme: dark) {
				img {
					filter: invert(1);
				}

				a:link, a:visited {
					color: lightblue;
				}
			}
		`
		this.shadowRoot.append(style)
		defineAndInject(this, this.shadowRoot)

		for (let child of this.shadowRoot.children[0].childNodes) {
			if (child.href == location.toString().replace(".html", "")) {
				child.setAttribute("current", true)
			}
		}

		;(async function(_this){
			if (_this.getAttribute("nologin") || typeof isLoggedIn === "undefined" || typeof isLoggedIn !== "function") {
				_this.right.style.display = 'none'
				console.warn("WARNING: Page has not imported account.js or is requesting nologin. Login UI disabled")
				return
			}

			if (await isLoggedIn()) {
				_this.loginButton.style.display = "none"
				_this.logoutButton.style.display = "block"
			}
		})(this)
	}
}

customElements.define("subliminal-header", SubliminalHeader)
