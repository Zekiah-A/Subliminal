async function initialiseHeader(customHtml = null) {
    let stringToHtml = text => {
        let htmlObject = document.createElement('temp')
        htmlObject.innerHTML = text
        return htmlObject.firstElementChild
    }
    
    let header = stringToHtml(await (await fetch("./Other/header-template")).text())
    if (customHtml) {
        header.getElementsByTagName("custom")[0].innerHTML = customHtml
    }
    document.body.appendChild(header)
}
