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
                <a href="disclaimer">-&gt; Disclaimer</a>
                <a href="sounds">-&gt; Sounds</a>
                <div class="hilight" id="hilight"></div>
                <div id="right">
                    <input id="loginButton" onclick="" type="button" value="Login to Subliminal">
                    <input id="accountButton" id="accountButton" onclick="window.location.href = window.location.origin + '/account'" type="button" value="My subliminal account">
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
                    font-size: 4vw;
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

        for (let child of this.shadowRoot.children[0].childNodes) {
            if (child.href == location.toString().replace(".html", "")) {
                child.setAttribute("current", true)
            }
        }

        this.shadowRoot.getElementById("loginButton").onclick = function() {
            
        }

        ;(async function(_this){
            if (_this.getAttribute("nologin") || typeof isLoggedIn === "undefined" || typeof isLoggedIn !== "function") {
                _this.shadowRoot.getElementById("right").style.display = 'none'
                console.warn("WARN: Page has not imported account.js or is requesting nologin. Login UI disabled")
                return
            }

            _this.shadowRoot.getElementById(await isLoggedIn() ? "loginButton" : "accountButton").style.display = 'none'
        })(this)
    }
}

customElements.define("subliminal-header", SubliminalHeader)
