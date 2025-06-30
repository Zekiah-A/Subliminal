"use strict";
/**
 * Will instance the given element, returning it so that it can be inserted into the DOM.
 * @param {HTMLElement} name Element to be instanced
 * @param {object} data Data attributes that element will be instanced with
 * @returns 
 */
export function createFromData(name, data = null) {
	let element = document.createElement(name)
	if (data) {
		for (const [key, value] of Object.entries(data)) {
			if (value !== undefined) {
				element.setAttribute("data-" + key, value.toString())
			}
		}
	}
	// TODO: This causes issues with some nodes wanting to be IN the dom before methods can be used on them
	//element.connectedCallback()
	return element
}

/**
 * Used by components to expose their own contexts and define all their elements within themselves
 * Allows compoennts to use HTML element IDs inlinely in the component inner HTML & defines
 * all elements with IDs on the component's `this`. Also gives the element access to its containing `document`.
 * @param {*} _this The `this` of the custom component
 * @param {*} element The shadow root element used to locate all elements with IDs
 */
export function defineAndInject(_this, element) {
	element.parentDocument = document
	element.shadowThis = _this
	if (element.id) _this[element.id] = element

	element = element.firstElementChild
	while (element) {
		defineAndInject(_this, element)
		element = element.nextElementSibling
	}
}

export function html(strings, ...values) {
	return strings.reduce((result, string, i) => {
		const value = values[i] !== undefined ? values[i] : ""
		return result + string + value
	}, "")
}

// Custom implementation of the css function
export function css(strings, ...values) {
	return strings.reduce((result, string, i) => {
		const value = values[i] !== undefined ? values[i] : ""
		return result + string + value
	}, "")
}