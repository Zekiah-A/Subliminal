/**
 * Will instance the given element, returning it so that it can be inserted into the DOM.
 * @param {HTMLElement} name Element to be instanced
 * @param {object} data Data attributes that element will be instanced with
 * @returns 
 */
function createFromData(name, data = null) {
    let element = document.createElement(name)
    if (data) {
        for (const [key, value] of Object.entries(data)) {
            element.setAttribute(key, value.toString())
        }
    }
    element.connectedCallback()
    return element
}

/**
 * Will instance a singleton of the given element, if an instance of the element
 * already exists, it will be updated with the new data.
 * @param {HTMLElement} element Element singleton to be instanced
 * @param {object} data Data attributes that element will be instanced with
 * @returns {HTMLElement|null} Element if a new element is created, otherwise null
 */
function createOrUpdateFromData(name, data = null) {
    let existing = document.querySelector(name)
    if (existing) {
        if (data) {
            for (const [key, value] of Object.entries(data)) {
                existing.setAttribute(key, value.toString())
            }
        }
        existing.shadowRoot.innerHTML = ""
        existing.connectedCallback()
        return null
    }

    return createFromData(name, data)
}

/**
 * Used by components to expose their own contexts and define all their elements within themselves
 * Allows compoennts to use HTML element IDs inlinely in the component inner HTML & defines
 * all elements with IDs on the component's `this`. Also gives the element access to its containing `document`.
 * @param {*} _this The `this` of the custom component
 * @param {*} element The shadow root element used to locate all elements with IDs
 */
function defineAndInject(_this, element) {
    element.parentDocument = document
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
        return result + string + value
    }, "")
}

// Custom implementation of the css function
function css(strings, ...values) {
    return strings.reduce((result, string, i) => {
        const value = values[i] !== undefined ? values[i] : ""
        return result + string + value
    }, "")
}