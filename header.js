async function initialiseHeader() {
    let stringToHtml = text => {
        let htmlObject = document.createElement('temp')
        htmlObject.innerHTML = text
        return htmlObject.firstElementChild
    }
    
    let header = stringToHtml(await (await fetch("./Other/header-template")).text())
    
    //if (localStorage.accountCode) {
    //      We are too limited for space to put an account button here, use a hamburger menu? Or just show a login button, or small icon instead of a fat full one
    //    header.getElementsByTagName("account")[0].style.display = "flex"
    //}
    
    document.body.appendChild(header)
}
