"use strict";
import sources from "../anthology-sources.json";
import "./components/anthology-list-item.js";

const container = /**@type {HTMLElement}*/(document.getElementById("staticAnthologiesList"));

async function initialise() {
	for (const source of sources) {
		if (source.type !== "static" || !source.anthologies) {
			continue;
		}

		for (const anthology of source.anthologies) {
			const listItemEl = /**@type {import("./components/anthology-list-item.js").AnthologyListItem}*/(
				document.createElement("anthology-list-item"));
			listItemEl.anthology = anthology;
			listItemEl.source = source;
			container.appendChild(listItemEl);
		}
	}
}
if (document.readyState !== "loading") {
	initialise();
}
else {
	window.addEventListener("DOMContentLoaded", initialise);
}
