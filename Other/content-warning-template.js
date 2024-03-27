class ContentWarning extends HTMLElement {
    constructor() {
        super()
    }

    hide() {
        this.querySelector("#contentWarning").style.opacity = "0"
        setTimeout(() => this.remove(), 200)
    }

    connectedCallback() {
        
        this.innerHTML = html`
            <div id="contentWarning">
                <div class="warning-centre">
                    <div style="display: flex;align-items: center;column-gap: 8px;">
                        <img src="/Resources/AbbstraktDog.svg" width="32" height="32">
                        <h2 style="margin: 0px;">Disclaimer:</h2>
                    </div>
                    <p>
                        All content of the following work is fictional, and should not be taken as moral, religious,
                        or political advice. Nor does it represent the views or the beliefs of any author in any way.
                    </p>
                    <p id="addition"></p>
                    <button class="popup-button" onclick="event.preventDefault(); document.querySelector('content-warning').hide()">Continue -></button>
                    <a href="/disclaimer">See Disclaimer -></a>
                <div>
            </div>
        `

        const style = document.createElement("style")
        style.innerHTML = css`
            #contentWarning {
                position: fixed;
                padding: 0;
                margin: 0;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #ffffff33;
                backdrop-filter: blur(15px);
                display: flex;
                justify-content: center;
                align-items: center;
                transition: .2s opacity;
            }

            .warning-centre {
                display: flex;
                width: min(40%, 512px);
                row-gap: 12px;
                padding: 16px;
                border: 1px solid gray;
                border-radius: 8px;
                flex-direction: column;
                background: var(--background-transparent);
            }

            .warning-centre button {
                border: none;
            }

            .warning-centre hr {
                border: 1px solid lightgray;
            }

            .warning-centre a, p {
                display: block;
                margin: 0;
            }

            @media(prefers-color-scheme: dark) {
                #contentWarning {
                    background: #1e1e1e33;
                }            
            }

            @media screen and (orientation:portrait) {
                .warning-centre {
                    width: calc(100% - 32px);
                }
            
                .warning-centre a {
                    font-size: 1.2em;
                }            
            }
        `
        this.appendChild(style)
        const addition = this.querySelector("#addition")
        if (addition) {
            addition.insertAdjacentElement("afterend", document.createElement("hr"))
            addition.textContent = this.getAttribute("addition")
            addition.insertAdjacentElement("beforebegin", document.createElement("hr"))    
        }
    }
}

customElements.define("content-warning", ContentWarning)
