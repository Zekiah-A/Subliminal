class LoginSignup extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({ mode: "open" })
    }

    connectedCallback() {
        // if ('value' in document.activeElement) checks done on the contents page are broken
        // by this element (will return <login-signup>) so this hack will tell it that this
        // this element does in fact catch input 
        this.value = true

        this.shadowRoot.innerHTML = html`
            <link rel="stylesheet" href="styles.css"> <!-- TODO: Find a more efficient way if possible, perhaps a separate popup CSS which styles imports, but just this component could import -->
            <div id="login" class="popup" currentpage="signin">
                <div style="display: flex;flex-grow: 1;">
                    <div id="back" onclick="this.shadowThis.login.setAttribute('currentpage', 'signin')">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" height="32" width="32"><path d="m274-450 248 248-42 42-320-320 320-320 42 42-248 248h526v60H274Z"></path></svg>
                    </div>
                    <h2>Login to Subliminal:</h2>
                </div>
                <div id="loginSignin" class="page">
                    <input id="loginSigninUsername" type="text" class="popup-input" placeholder="Username">
                    <input id="loginSigninEmail" type="text" class="popup-input" placeholder="Email">
                    <input id="loginQRInput" type="file" accept="image/*" capture="environment" style="display: none;">
                    <div class="popup-button" onclick="this.shadowThis.signin(this.shadowThis.loginSigninUsername.value, this.shadowThis.loginSigninEmail.value); this.shadowThis.login.style.display = 'none';"
                        style="margin-bottom: 8px;">Login</div>

                    <div style="display:flex;column-gap:8px;margin-top:8px">
                        <div class="popup-button" onclick="this.shadowThis.login.setAttribute('currentpage', 'signup');">I don't have an account
                        </div>
                        <div class="popup-button" onclick="this.shadowThis.loginQRInput.click()">Scan QR</div>
                    </div>
                </div>
                <div id="loginSignup" class="page">
                    <input id="loginUsername" type="text" class="popup-input" oninput="this.shadowThis.validateLoginSignup()"
                        placeholder="Username*">
                    <input id="loginEmail" type="text" oninput="this.shadowThis.validateLoginSignup()" class="popup-input" placeholder="Email*">
                    <div>
                        <label for="loginPromise">I promise to be a cool member of subliminal*</label>
                        <input id="loginPromise" type="checkbox" oninput="this.shadowThis.validateLoginSignup()">
                    </div>
                    <div style="display:flex;column-gap:8px;margin-top:8px">
                        <div id="signupButton" class="popup-button"
                            onclick="
                                this.shadowThis.signup(this.shadowThis.loginUsername.value, this.shadowThis.loginEmail.value)
                                    .then(() => {
                                        this.shadowThis.login.setAttribute('currentpage', 'code');
                                        setTimeout(() => this.shadowThis.loginClose.removeAttribute('disabled'), 4000);
                                })
                            " disabled>Create account
                        </div>
                    </div>
                </div>
                <div id="loginCode" class="page">
                    <p>Your account code is the key for acessing your account, keep it private!</p>
                    <p id="loginCodeText" class="signup-code-hidden"
                        onmouseenter="this.style.background = 'transparent'; this.style.color = 'black';"
                        style="background: transparent; color: black;font-size: 64px;font-weight: bold;text-align: center;margin: 0px;">00000000</p>
                    <div style="position: relative;">
                        <img id="loginCodeQR" style="filter: blur(16px); aspect-ratio: 1/1; width: 100%;"
                            onmouseenter="this.style.filter = 'blur(0px)';">
                        <img src="./Resources/SmallLogo.png"
                            style="width:64px;height:64px;position:absolute;left:50%;top:50%;opacity:0.4;transform: translate(-50%, -50%);"
                            width="64" height="64">
                    </div>
                    <br>
                    <div id="loginClose" class="popup-button" onclick="
                            this.shadowThis.login.setAttribute('currentpage', 'signin')
                            this.shadowThis.login.style.display = 'none'
                            const finishEvent = new CustomEvent('finished', { type: 'signup' })
                            this.dispatchEvent(finishEvent)
                        " disabled="">Close
                    </div>
                </div>
                <div id="loginError" class="page">
                    <div id="errorMessage"><!--Erorr message text--></div>
                    <div style="display:flex;column-gap:8px;margin-top:8px">
                        <div class="popup-button" onclick="this.shadowThis.style.display = 'none';">Ok</div>
                    </div>
                </div>
            </div>
        `

        const style = document.createElement("style")
        style.innerHTML = css`
            #login {
                display: flex;
                flex-direction: column;
                max-width: 400px;
                height: 230px;
                transition: .2s height;
            }

            #login[currentpage="signup"] {
                height: 220px;
            }

            #login[currentpage="code"] {
                height: 680px;
            }

            #back {
                cursor: pointer;
                max-width: 64px;
                transition: .2s max-width; 
            }
            #back > svg {
                transform: rotate(0deg) scale(1, 1);
                opacity: 1;
                transition: .2s transform, .2s opacity;
            }

            #login[currentpage="signin"] #back {
                max-width: 0px;
            }
            #login[currentpage="signin"] #back > svg {
                transform: rotate(180deg) scale(0.1, 1);
                opacity: 0;
            }

            .page {
                display: none;
            }
            
            #login > .page {
                flex-direction: column;
                row-gap: 4px;
            }

            #login[currentpage="signin"] > #loginSignin, #login[currentpage="signup"] > #loginSignup,
                #login[currentpage="loginerror"] > #loginError, #login[currentpage="code"] > #loginCode {
                display: flex !important;
            }
        `
        this.shadowRoot.append(style)
     
        // Allows us to use HTML element IDs inlinely in the component inner HTML & defines
        // all elements with IDs on this component's `this` 
        defineAndInject(this, this.shadowRoot)
    }

    async signup(username, email) {
        try {
            const response = await fetch(serverBaseAddress + "/Signup", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: { Username: JSON.stringify(username), Email: JSON.stringify(email) } // Convert to JSON format
            })

            if (!response.ok) {
                confirmFail("Signup response was denied.")
                return
            }

            const dataObject = await response.json()
            localStorage.accountCode = dataObject.code
            localStorage.accountGuid = dataObject.guid
            loginCodeText.textContent = dataObject.code

            const qr = new QRious({
                element: loginCodeQR,
                background: "white",
                foreground: "#007bd3",
                level: "L",
                size: 512,
                value: window.location + "?accountCode=" + dataObject.code
            })
            loginCodeQR.src = qr.toDataURL()

            showMyAccount()
        }
        catch (error) {
            this.confirmFail(error)
        }
    }

    //Impossible to log in without code, GUID can be retrieved though
    async signin(username, email) {
        try {
            const signinResponse = await fetch(serverBaseAddress + "/Signin", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Username: username, Email: email })
            })

            if (!signinResponse.ok) {
                this.confirmFail("Signin response was denied.")
                return
            }

            const signinData = await signinResponse.json()
        
            localStorage.accountUsername = username
            localStorage.accountEmail = email
            //localStorage.accountGuid = signinData.guid

            showMyAccount()
        }
        catch (error) {
            this.confirmFail(error)
        }

        const finishEvent = new CustomEvent("finished", { type: "signin" })
        this.dispatchEvent(finishEvent)
    }

    confirmFail(err) {
        this.errorMessage.textContent = err
        this.login.setAttribute("currentPage", "loginerror")
    }

    validateLoginSignup() {
        const validEmailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

        if (!this.loginPromise.checked || this.loginUsername.value.length == 0
            || !this.loginEmail.value.match(validEmailPattern)) {
            this.signupButton.setAttribute("disabled", "true")
        }
        else {
            this.signupButton.removeAttribute('disabled')
        }
    }
}


customElements.define("login-signup", LoginSignup)