function createFromData(name, data) {
    let element = document.createElement(name)
    for (const [key, value] of Object.entries(data)) {
        element.setAttribute(key, value)
    }
    element.initialise()
    return element
}