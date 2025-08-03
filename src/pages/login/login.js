"use strict";

const params = new URLSearchParams(window.location.search);
const referrer = params.get("referrer")

// TODO: Kinda hacky
loginSignup.login.show()
loginSignup.login.style.top = "50%"
loginSignup.login.style.transform = "translateY(-50%)"

loginSignup.addEventListener("finished", (e) => {
    if (referrer) {
        window.location.href = window.location.origin + referrer
        return
    }
    window.location.href = window.location.origin
})
