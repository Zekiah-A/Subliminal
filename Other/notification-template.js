class SubliminalNotification extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({ mode: "open" })
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = html`<div id="message"></div>`

        const style = document.createElement("style")
        style.innerHTML = css`
            div {
                user-select: none;
                position: fixed;
                height: 36px;
                background: #000000b8;
                bottom: 32px;
                left: 16px;
                display: flex;
                justify-content: center;
                flex-direction: column;
                padding: 8px 16px 8px 16px;
                color: white;
                border-radius: 16px;
                overflow: clip;
            }
        `
        this.shadowRoot.append(style)

        let messageElement = this.shadowRoot.getElementById("message")
        messageElement.textContent = "🔔 " + this.getAttribute("message")
        messageElement.animate([
            { opacity: "0", maxWidth: "0" },
            { opacity: "1", maxWidth: "100%" }
        ], {
            duration: 2000,
            easing: "ease-out",
            fill: 'forwards'
        })
        setTimeout(() => {
            messageElement.animate([
                { bottom: "-36px", opacity: "0" }
            ], {
                duration: 400,
                easing: "cubic-bezier(0.25, 1, 0.5, 1)",
                fill: 'forwards'
            })
            setTimeout(() => this.remove(), 400)
        }, Number(this.getAttribute("lifetime")) || 4000)
    }
}

customElements.define("subliminal-notification", SubliminalNotification)
