class ContentWarning extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({ mode: "open" })
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = html`
            <div id="contentWarning">
                <pre class="warning-centre">
___________________________________________________________
| Disclaimer: All content of the following work is        |
| fictional, and should not be taken as moral, religious, |
| or political advice. Nor does it represent the views    |
| or the beliefs of any author in any way.                |
|                                                         |
                </pre>
                <pre id="addition"><pre>
                <pre>
|                                                         |
| <a class="continue" href="#contentWarning">Continue -></a>                                             |
| <a href="../../disclaimer">See Disclaimer -></a>                                       |
|                                                         |
‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
                </pre>
            </div>
        `

        let cwInsert = ""
        let chunks = this.getAttribute("addition").match(/.{1,55}/g)
        for (let chunk of chunks) {
            chunk = chunk.padEnd(55) //if not taking up a whole line (is 55 chars long), pad spaces to line up
            chunk = "| ".concat(chunk) //add pipe start
            chunk = chunk.concat(" |") //add pipe end
            cwInsert = cwInsert.concat("\n", chunk) //Add \n followed by chunk to end of cwinsert
        }
        this.shadowRoot.getElementById("addition").textContent = cwInsert
    }
}

customElements.define("content-warning", ContentWarning)
