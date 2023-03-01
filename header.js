async function initialiseHeader() {
    let stringToHtml = text => {
        let htmlObject = document.createElement('temp')
        htmlObject.innerHTML = text
        return htmlObject.firstElementChild
    }
    
    let header = stringToHtml(await (await fetch("./Other/header-template.html")).text())    
    for (let child of header.children[0].childNodes) {
        if (child.href == location.toString().replace(".html", "")) {
            child.setAttribute("current", true)
        }
    }
    
    document.body.appendChild(header)
}
