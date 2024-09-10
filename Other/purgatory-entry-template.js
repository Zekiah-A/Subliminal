class PurgatoryEntry extends HTMLElement {
	constructor() {
		super()
		this.attachShadow({ mode: "open" })
	}

	connectedCallback() {
		// TODO: Clear up slightly XSS prone string interpolations
		this.shadowRoot.innerHTML = html`
			<div class="preview" id="poemPreview"></div>
			${this.getAttribute('notification')
				? html`
					<p class="special-notification">
						${this.getAttribute('notification')}
					</p>`
				: ''}
			${this.getAttribute('tooltip')
				? html`<div class="button-tooltip" id="tooltip"></div></p>`
				: ''}
			<h4 id="poemName"></h4>
			<div class="info">
				<span style="flex: 2;">By ${this.getAttribute('author')}</span>
				<div style="flex: 1;">
					<svg viewBox="0 0 16 16" width="24" xmlns="http://www.w3.org/2000/svg" height="16"><path clip-rule="evenodd" d="m8 .200001c.17143 0 .33468.073332.44854.201491l7.19996 8.103998c.157.17662.1956.42887.0988.64437-.0968.21551-.3111.35414-.5473.35414h-3.4v5.496c0 .3314-.2686.6-.6.6h-6.4c-.33137 0-.6-.2686-.6-.6v-5.496h-3.4c-.236249 0-.450507-.13863-.547314-.35414-.096807-.2155-.058141-.46775.09877-.64437l7.200004-8.103998c.11386-.128159.27711-.201491.44854-.201491zm-5.86433 8.103999h2.66433c.33137 0 .6.26863.6.6v5.496h5.2v-5.496c0-.33137.2686-.6.6-.6h2.6643l-5.8643-6.60063" fill-rule="evenodd"></path></svg>
					<span id="approves"></span>
				</div>
				<div style="flex: 1;">
					<svg viewBox="0 0 16 16" width="24" xmlns="http://www.w3.org/2000/svg" height="16" style="rotate: 180deg;"><path clip-rule="evenodd" d="m8 .200001c.17143 0 .33468.073332.44854.201491l7.19996 8.103998c.157.17662.1956.42887.0988.64437-.0968.21551-.3111.35414-.5473.35414h-3.4v5.496c0 .3314-.2686.6-.6.6h-6.4c-.33137 0-.6-.2686-.6-.6v-5.496h-3.4c-.236249 0-.450507-.13863-.547314-.35414-.096807-.2155-.058141-.46775.09877-.64437l7.200004-8.103998c.11386-.128159.27711-.201491.44854-.201491zm-5.86433 8.103999h2.66433c.33137 0 .6.26863.6.6v5.496h5.2v-5.496c0-.33137.2686-.6.6-.6h2.6643l-5.8643-6.60063" fill-rule="evenodd"></path></svg>
					<span id="vetoes"></span>
				</div>
			</div>
		`

		const style = document.createElement("style")
		style.innerHTML = css`
			:host {
				min-width: 200px;
				height: 200px;
				border-radius: 4px;
				background-color: var(--button-transparent);
				position: relative;
				cursor: pointer;
				max-width: 200px;
				transition: scale 1s, rotate 1s, background-color 1s, transform 1s, z-index 1s, box-shadow 1s;
			}

			h4 {
				text-align: center;
				font-size: 20px;
				max-width: 100%;
				margin-left: 8px;
				margin-right: 8px;
				overflow: hidden;
				white-space: nowrap;
			}

			.preview {
				margin: 16px;
				position: relative;
				border-radius: 8px;
				overflow: clip;
				font-size: 16px;
				height: 64px;
				mask-image: linear-gradient(transparent, white, transparent);
			}

			.special-notification {
				margin-top: 0px;
				margin-bottom: 0px;
				color: #017cff;
				position: absolute;
				top: 44%;
				text-align: center;
				width: 100%;
				font-weight: bold;
				font-style: italic;
			}

			.button-tooltip {
				left: 0px !important;
				top: 0px !important;
			}

			.info {
				display: flex;
				flex-direction: row;
				margin-left: 8px;
				margin-right: 8px;
			}

			svg {
				fill: var(--text-colour);
			}

			.entry-new .preview::after {
				opacity: 0 !important;
			}

			@media(prefers-color-scheme: dark) {
				.entry-new {
					background-color: #606060;
				}
			}    
		`
		this.shadowRoot.append(style)
		defineAndInject(this, this.shadowRoot)

		if (this.getAttribute("tooltip")) {
			
		}
		
		this.poemPreview.textContent = this.getAttribute("preview") 
		this.poemName.textContent = this.getAttribute("name")
		this.approves.textContent = this.getAttribute("approves")
		this.vetoes.textContent = this.getAttribute("vetoes")
		
		if (this.getAttribute('new')) {
			setTimeout(() => {
				this.classList.add("entry-new")
				this.setAttribute("style", `
					rotate: ${Math.random() * 20 - 10}deg;
					scale: 1.1;
					background-color: #fdfdfd;
					transform: translateX(-16px);
					z-index: 1;
					box-shadow: 0px 0px 20px black;
				`)    
			}, 100)
			setTimeout(() => {
				this.removeAttribute("style")
				this.classList.remove("entry-new")
			}, 1600)
		}
		this.onclick = () =>
			window.location.href = './purgatory-poem?guid=' + this.getAttribute('guid')
	}
}

customElements.define("purgatory-entry", PurgatoryEntry)