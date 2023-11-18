class SubliminalSelect extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({ mode: "open" })
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = html`
            <span id="selected" class="selected"></span>
            <span id="arrow" class="arrow">⯆</span>
            <div id="options" class="options" style="display: none;"></div>`
        const style = document.createElement("style")
        style.innerHTML = css`
            :host {
                background-color: var(--button-opaque);
                color: var(--text-colour);
                border: 1px solid #8f8f9d;
                border-radius: 4px;
                cursor: default;

                padding-left: 4px;
                padding-right: 4px;
                line-height: normal;
                display: flex;
                align-items: center;
                position: relative;
                user-select: none;
            }
            :host(:hover) {
                background-color: #85859269;
            }
            :host(:active) {
                background-color: #B1B1BB;
            }
            
            .options {
                background-color: var(--button-transparent);
                border-radius: 4px;
                margin-top: 8px;
                border: 1px solid darkgray;
                pointer-events: all !important;
                display: none;
                user-select: none;
                position: absolute;
                width: max-content;
                top: 100%;
            }
            
            .options > option {
                padding-left: 4px;
                padding-right: 4px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .options > option[selected] {
                background-color: darkgray;
            }
            
            .options > option:hover {
                background-color: darkgray;
            }

            .selected {
                margin-right: 4px;
            }

            .arrow {
                transition: transform 0.1s ease 0s;
            }
            
            @media screen and (orientation: portrait) {
                .options {
                    position: fixed;
                    z-index: 2;
                    left: 50% !important;
                    transform: translateX(-50%) scale(2);
                    top: 270px;
                }            
            }`
        this.shadowRoot.append(style)
        defineAndInject(this, this.shadowRoot)
        const thisElement = this

        const selectedElement = this.shadowRoot.getElementById("selected")
        const optionsElement = this.shadowRoot.getElementById("options")
        const arrowElement = this.shadowRoot.getElementById("arrow")
        this.onclick = function() {
            const open = optionsElement.style.display == "block"
            optionsElement.style.display = open ? "none" : "block"
            arrowElement.style.transform = open ? "none" : "scaleY(-1)"
            recalcOptionsPosition()
        }
        this.onblur = function() {
            optionsElement.style.display = "none"
        }
        selectedElement.textContent = this.getAttribute("placeholder") + " "

        function recalcOptionsPosition() {

            const overflowLeft = (thisElement.getBoundingClientRect().left + optionsElement.offsetWidth) - window.innerWidth
            optionsElement.style.left = Math.min(0, -overflowLeft - 8) + "px"
        }

        document.addEventListener("DOMContentLoaded", () => {
            for (let i = 0; i < this.children.length; i++) {
                const node = this.children[i]

                if (node instanceof HTMLOptionElement || node instanceof HTMLHRElement) {
                    optionsElement.appendChild(node.cloneNode(true))
                }
                else {
                    throw new Error(
                        "Can not create options. Subliminal options child elements must be of either type 'option' or 'hr'")
                }
            }
        })
        window.addEventListener("resize", recalcOptionsPosition)
    }
}

customElements.define("subliminal-select", SubliminalSelect)
