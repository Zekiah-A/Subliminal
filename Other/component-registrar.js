function createFromData(name, data) {
    let element = document.createElement(name)
    for (const [key, value] of Object.entries(data)) {
        element.setAttribute(key, value.toString())
    }
    element.connectedCallback()
    return element
}

/**
 * Used by components to expose their own contexts and define all their elements within themselves
 * Allows compoennts to use HTML element IDs inlinely in the component inner HTML & defines
 * all elements with IDs on the component's `this`.
 * @param {*} _this The `this` of the custom component
 * @param {*} element The shadow root element used to locate all elements with IDs
 */
function defineAndInject(_this, element) {
    element.shadowThis = _this
    if (element.id) _this[element.id] = element

    element = element.firstElementChild
    while (element) {
        defineAndInject(_this, element)
        element = element.nextElementSibling
    }
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