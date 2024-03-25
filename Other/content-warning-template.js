class ContentWarning extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({ mode: "open" })
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = html`
            <div id="contentWarning">
                <span class="warning-centre">
                    <pre>
___________________________________________________________
| Disclaimer: All content of the following work is        |
| fictional, and should not be taken as moral, religious, |
| or political advice. Nor does it represent the views    |
| or the beliefs of any author in any way.                |
|                                                         |</pre><pre id="addition"></pre><pre>
|                                                         |
| <a class="continue" href="#" onclick="event.preventDefault(); this.shadowThis.contentWarning.style.visibility = 'hidden';">Continue -></a>                                             |
| <a href="../../disclaimer">See Disclaimer -></a>                                       |
|                                                         |
‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
                    </pre>
                <span>
            </div>
        `

        const style = document.createElement("style")
        style.innerHTML = css`
            pre {
                margin: 0;
            }

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
                content: center;
                visibility: visible;
            }

            .warning-centre {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: x-large;
                font-family: monospace;
            }
            
            .warning-centre a {
                font-size: x-large;
                font-family: monospace !important;
            }
            
            @media(prefers-color-scheme: dark) {
                #contentWarning {
                    background: #1e1e1e33;
                }            
            }

            @media screen and (orientation:portrait) {
                .warning-centre {
                    font-size: 2.8vw !important;
                }
            
                .warning-centre a {
                    font-size: 1em;
                }            
            }
        `
        this.shadowRoot.append(style)
        defineAndInject(this, this.shadowRoot)

        let cwInsert = ""
        let addition = this.getAttribute("addition")
        if (!addition) return
        let chunks = addition.match(/.{1,55}/g)
        for (let chunk of chunks) {
            chunk = chunk.padEnd(55) //if not taking up a whole line (is 55 chars long), pad spaces to line up
            chunk = "| ".concat(chunk) //add pipe start
            chunk = chunk.concat(" |") //add pipe end
            cwInsert = cwInsert.concat(chunk, "\n") //Add \n followed by chunk to end of cwinsert
        }
        this.addition.textContent = cwInsert
    }
}

customElements.define("content-warning", ContentWarning)
