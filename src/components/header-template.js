"use strict";
class SubliminalHeader extends HTMLElement {
	constructor() {
		super()
		this.attachShadow({ mode: "open" })
	}

	connectedCallback() {
		this.shadowRoot.innerHTML = html`
			<link rel="stylesheet" href="styles.css">
			<div>
				<a href="/" class="logo-button">
					<img src="assets/AbbstraktDog.png" loading="eager" class="logo" alt="Subliminal dog logo" width="48" height="48">
				</a>
				<h1 style="margin: 0px; align-self: center;">Subliminal</h1>
				<nav id="pageLinks">
					<a href="contents">-&gt; Poems</a>
					<a href="anthologies">-&gt; Anthologies</a>
					<a href="create" class="disabled">-&gt; Create</a>
				</nav>
				<div class="hilight" id="hilight"></div>
				<div id="right">
					<account-options id="accountOptions"></account-options>
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
			
			.disabled {
				opacity: 0.6;
				pointer-events: none;
			}
			
			p {
				text-align: end;
				margin: 0px;
				font-style: italic;
				opacity: 0.6;
				line-height: 64px;
				white-space: nowrap;
			}

			nav > a {
				align-self: center;
				white-space: nowrap;
				/*Click hitboxes*/
				padding-top: 24px;
				padding-bottom: 24px;
			}

			nav > a[current] {
				background-color: #0074d90d;
				border-bottom: 4px solid var(--input-hilight);
			}

			span, div {
				font-family: Arial, Helvetica, sans-serif;
			}

			p, a {
				font-family: Arial, Helvetica, sans-serif;
				font-size: 110%;
			}
			
			.logo-button {
				display: flex;
				cursor: pointer;
			}
			
			.logo {
				align-self: center;
				transition: .2s transform;
			}

			.logo:hover {
				transform: rotate(10deg) scale(1.5);
			}

			.logo:active {
				transform: rotate(8deg) scale(1.1);
			}
			
			#pageLinks {
				display: flex;
				column-gap: 16px;
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
			
				.logo {
					width: 48px;
					height: 48px;
				}
			
				nav > a {
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
				.logo {
					filter: invert(1);
				}

				a:link, a:visited {
					color: lightblue;
				}
			}
		`
		this.shadowRoot.append(style)
		defineAndInject(this, this.shadowRoot)

		for (const child of this.pageLinks.childNodes) {
			if (child.href == location.toString().replace(".html", "")) {
				child.setAttribute("current", true)
			}
		}

		if (this.getAttribute("nologin") || typeof isLoggedIn === "undefined" || typeof isLoggedIn !== "function") {
			// TODO: Potentially change right to just display 'The coolest crowdsourced anthology on the web' (delete buttons)
			this.right.style.display = 'none'
			console.warn("WARNING: Page has not imported account.js or is requesting nologin. Login UI disabled")
			return
		}
	}
}

customElements.define("subliminal-header", SubliminalHeader)
