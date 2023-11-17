class SubliminalSelect extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({ mode: "open" })
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = html`
            <div id="selected"></div>
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

            :host:hover {
                background-color: #85859269;
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
            
            @media screen and (orientation: portrait) {
                .options {
                    position: fixed;
                    z-index: 2;
                    left: 50%;
                    transform: translateX(-50%) scale(2);
                    top: 270px;
                }            
            }`
        this.shadowRoot.append(style)
        defineAndInject(this, this.shadowRoot)

        const optionsElement = this.shadowRoot.getElementById("options")
        this.onclick = function() {
            optionsElement.style.display = optionsElement.style.display == 'block' ? 'none' : 'block'
        }
        this.onblur = function() {
            optionsElement.style.display = 'none'
        }

        const selectedElement = this.shadowRoot.getElementById("selected")
        selectedElement.textContent = this.getAttribute("placeholder") + " ⯆"
        
        document.addEventListener("DOMContentLoaded", () => {
            console.log(this.children)
            for (let i = 0; i < this.children.length; i++) {
                const node = this.children[i]
                console.log(node)

                if (node instanceof HTMLOptionElement || node instanceof HTMLHRElement) {
                    optionsElement.appendChild(node.cloneNode(true))
                }
                else {
                    throw new Error(
                        "Can not create options. Subliminal options child elements must be of either type 'option' or 'hr'")
                }
            }
        })
    }
}

customElements.define("subliminal-select", SubliminalSelect)
