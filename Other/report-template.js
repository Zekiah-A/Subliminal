class ReportPopup extends HTMLElement {
	constructor() {
		super()
		this.attachShadow({ mode: "open" })
	}

	connectedCallback() {
		this.shadowRoot.innerHTML = html`
		`

		const style = document.createElement("style")
		style.innerHTML = css`
		`
		this.shadowRoot.append(style)
	}
}

customElements.define("report-popup", ReportPopup)