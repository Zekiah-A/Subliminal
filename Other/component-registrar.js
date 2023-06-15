function createFromData(name, data) {
    let element = document.createElement(name)
    for (const [key, value] of Object.entries(data)) {
        element.setAttribute(key, value)
    }
    element.connectedCallback()
    return element
}

function html(strings, ...values) {
    return strings.reduce((result, string, i) => {
        const value = values[i] !== undefined ? values[i] : ""
        return result + string + value;
    }, "")
}

// Custom implementation of the css function
function css(strings, ...values) {
    return strings.reduce((result, string, i) => {
        const value = values[i] !== undefined ? values[i] : ""
        return result + string + value;
    }, "")
}