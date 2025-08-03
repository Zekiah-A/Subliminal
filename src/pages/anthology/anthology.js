"use strict";

/**
 * @typedef {Object} Poem
 * @property {string} author
 * @property {number} authorId
 * @property {string} path
 * @property {string} title
 */

const container = /**@type {HTMLElement}*/(document.getElementById("contentsGridContainer"));
const contentsHeader = /**@type {HTMLElement}*/(document.getElementById("contentsHeader"));
const anthologyTitle = /**@type {HTMLElement}*/(document.getElementById("anthologyTitle"));
const anthologyDescription = /**@type {HTMLElement}*/(document.getElementById("anthologyDescription"));

// Contents searchbar and header
/**@type {number|null}*/let requestedFrame = null;
window.addEventListener("scroll", (event) => {
	if (requestedFrame !== null) {
		return;
	}
	requestedFrame = requestAnimationFrame(() => {
		const headerStuck = contentsHeader.getBoundingClientRect().y < 80
		if (headerStuck) {
			contentsHeader.classList.add("stuck");
		}
		else {
			contentsHeader.classList.remove("stuck");
		}
		requestedFrame = null;
	})
})

/**
 * @param {string} value 
 */
function searchContents(value) {
	// Search through poem, authors, etc
	document.querySelectorAll(".section-body a").forEach((link) => {
		if (!(link instanceof HTMLAnchorElement)) {
			return;
		}

		link.style.display = "inline-block"
		if (!value.toLowerCase().trim()) return
		if (!link.textContent?.toLowerCase().includes(value.toLowerCase().trim())) {
			link.style.display = "none";
			return;
		}

		const contentsSection = link.parentElement?.parentElement;
		if (contentsSection) {
			openContentsSection(contentsSection);
		}
	})
	document.querySelectorAll(".section-body br").forEach((lineBreak) => {
		if (!(lineBreak instanceof HTMLBRElement)) {
			return;
		}

		lineBreak.style.display = "inline-block";
		if (!value.toLowerCase().trim()) {
			return;
		}
		else {
			lineBreak.style.display = "none";
		}
	})
}

// Contents section initialisation
/**
 * @param {HTMLElement} container 
 */
function toggleContentsSection(container) {
	if (container.getAttribute("collapsed")) {
		openContentsSection(container);
	}
	else {
		collapseContentsSection(container);
	}
}

/**
 * @param {HTMLElement} container 
 */
function openContentsSection(container) {
	container.removeAttribute("collapsed")
	for (const link of Array.from(container.querySelectorAll("a"))) {
		link.tabIndex = 0;
	}
}

/**
 * @param {HTMLElement} container 
 */
function collapseContentsSection(container) {
	container.setAttribute("collapsed", "true")
	for (const link of Array.from(container.querySelectorAll("a"))) {
		link.tabIndex = -1
	}
}

async function initialise() {
	const params = new URLSearchParams(window.location.search);
	const anthologyUrl = params.get("url");
	if (!anthologyUrl || params.get("type") !== "static") {
		// TODO: This will actually be OK in future when central server just uses 'path' for anthologies
		// TODO: but don't handle yet
		throw new Error("No anthology URL, or invalid anthology type");
	}

	try {
		const contentsUrl = `${decodeURIComponent(anthologyUrl)}/contents.json`;
		const res = await fetch(contentsUrl);
		if (!res.ok) {
			throw new Error(`Received response ${res.status} (${res.statusText})`)
		}
		const anthology = await res.json();
		const authors = new Map();
		for (const author of anthology.authors) {
			authors.set(author.id, author);
		}

		anthologyTitle.textContent = anthology.title;
		// TODO: Parse markdown in description, use DomPurify + Marked
		anthologyDescription.innerHTML = anthology.description.replaceAll("\n", "<br>");

		for (const volume of anthology.volumes) {
			const volumeDiv = document.createElement("div");
			volumeDiv.innerHTML = `<h3>${volume.title}:</h3>`;
			container.appendChild(volumeDiv);

			for (const section of volume.sections) {
				// TODO: This is very naive and unsafe - move to lit component for real implementation
				const sectionDiv = document.createElement("div");
				sectionDiv.className = "grid-sub-container elevated";
				sectionDiv.tabIndex = 0;
				sectionDiv.setAttribute("collapsed", "true");
				sectionDiv.innerHTML = `
					<p class="section-title">${section.title}:</p>
					<p class="section-description">${section.summary}</p>
					<span class="section-collapsed"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" height="36" width="36"><path d="m24 30.75-12-12 2.15-2.15L24 26.5l9.85-9.85L36 18.8Z"></path></svg></span>
					<ol class="section-body">
						${section.contents.map((/**@type {Poem}*/poem) => {
							const author = poem.author || authors.get(poem.authorId);
							return `
								<li>
									<a href="./poem?path=${encodeURIComponent(poem.path)}">${poem.title} - By ${author?.name ?? "Unknown"}</a>
								</li>`;
						}).join("\n")}
					</ol>
				`;

				collapseContentsSection(sectionDiv);
				sectionDiv.addEventListener("click", (event) => {
					openContentsSection(sectionDiv);
				})

				sectionDiv.addEventListener("keypress", (event) => {
					if (!(event.target instanceof HTMLElement)) {
						return;
					}

					if (event.target.classList.contains("grid-sub-container") && event.key == "Enter") {
						toggleContentsSection(event.target);
					}
				})

				sectionDiv.querySelectorAll(".section-title, .section-collapsed").forEach(collapseLabel => {
					collapseLabel.addEventListener("click", (event) => {
						if (!(event.target instanceof HTMLElement)) {
							return;
						}

						// Bubble input up to section
						let section = event.target.parentElement;
						while (section && !section.classList.contains("grid-sub-container")) {
							section = section.parentElement;
						}
						if (section) {
							toggleContentsSection(section);
							event.stopPropagation();
						}
					})
				})

				volumeDiv.appendChild(sectionDiv);
			}
		}

		const anthologyLoadCover = document.getElementById("anthologyLoadCover");
		if (anthologyLoadCover) {
			document.querySelector("main")?.classList.remove("hidden");
			anthologyLoadCover.remove();
		}

	}
	catch (e) {
		console.error("Failed to load contents:", e);
	}
}
if (document.readyState !== "loading") {
	initialise();
}
else {
	window.addEventListener("DOMContentLoaded", initialise);
}