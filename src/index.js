"use strict";
/**
 * @param {IntersectionObserverEntry[]} entries
 * @param {IntersectionObserver} observer
 */
function handleIntersect(entries, observer) {
	entries.forEach(entry => {
		if (entry.isIntersecting) {
			entry.target.classList.add("scroll-in")
		}
	})
}

const aboutSection = /**@type {HTMLElement}*/(document.getElementById("aboutSection"));
const aboutInfo = /**@type {HTMLElement}*/(document.getElementById("aboutInfo"));
const getStartedSection = /**@type {HTMLElement}*/(document.getElementById("getStartedSection"));
const getStartedInfo = /**@type {HTMLElement}*/(document.getElementById("getStartedInfo"));
const rplaceAdSection = /**@type {HTMLElement}*/(document.getElementById("rplaceAdSection"));
const supportAdSection = /**@type {HTMLElement}*/(document.getElementById("supportAdSection"));
const poemProcessSubInfo = /**@type {HTMLElement}*/(document.getElementById("poemProcessSubInfo"));

// A threshold of 0.1 means that when 10% of section is in view, it will be animated.
const observer = new IntersectionObserver(handleIntersect, { root: null, rootMargin: "0px", threshold: 0.1 })
const observables = [aboutSection, aboutInfo, getStartedSection, getStartedInfo, rplaceAdSection, supportAdSection, poemProcessSubInfo]
observables.forEach((element) => {
	observer.observe(element)
	element.classList.add("scroll-unseen")
})
