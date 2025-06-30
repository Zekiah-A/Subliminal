"use strict";

// Contents searchbar and header
let requestedFrame = null
window.addEventListener("scroll", (event) => {
	if (requestedFrame !== null) {
		return
	}
	requestedFrame = requestAnimationFrame(() => {
		const headerStuck = contentsHeader.getBoundingClientRect().y < 80
		if (headerStuck) {
			contentsHeader.classList.add("stuck")
		}
		else {
			contentsHeader.classList.remove("stuck")
		}
		requestedFrame = null
	})
})

function searchContents(value) {
	// Search through poem, authors, etc
	document.querySelectorAll(".section-body a").forEach((link) => {
		link.style.display = 'inline-block'
		if (!value.toLowerCase().trim()) return
		if (!link.textContent.toLowerCase().includes(value.toLowerCase().trim())) {
			link.style.display = 'none'
			return
		}

		openContentsSection(link.parentElement.parentElement)
	})
	document.querySelectorAll(".section-body br").forEach((lnb) => {
		lnb.style.display = 'inline-block'
		if (!value.toLowerCase().trim()) return
		else lnb.style.display = 'none'
	})
}

// Contents section initialisation
function toggleContentsSection(container) {
	if (container.getAttribute("collapsed")) {
		openContentsSection(container)
	}
	else {
		collapseContentsSection(container)
	}
}

function openContentsSection(container) {
	container.removeAttribute("collapsed")
	for (const link of container.querySelectorAll("a")) {
		link.tabIndex = "0"
	}
}

function collapseContentsSection(container) {
	container.setAttribute("collapsed", "true")
	for (const link of container.querySelectorAll("a")) {
		link.tabIndex = "-1"
	}
}

async function initialise() {
	const res = await fetch("/subliminal-classics/methallyne-blue/contents.json");
	if (!res.ok) {
		console.error("Failed to load contents:", res.status, res.statusText);
		return;
	}
	const anthology = await res.json();
	const authors = new Map();
	for (const author of anthology.authors) {
		authors.set(author.id, author);
	}

	anthologyTitle.textContent = anthology.title;
	// TODO: Parse markdown in description
	anthologyDescription.innerHTML = anthology.description.replaceAll("\n", "<br>");

	const container = document.getElementById("contentsGridContainer");
	for (const volume of anthology.volumes) {
		const volumeDiv = document.createElement("div");
		volumeDiv.innerHTML = `<h3>${volume.title}:</h3>`;
		container.appendChild(volumeDiv);

		for (const section of volume.sections) {
			const sectionDiv = document.createElement("div");
			sectionDiv.className = "grid-sub-container elevated";
			sectionDiv.tabIndex = "0";
			sectionDiv.setAttribute("collapsed", "true");
			sectionDiv.innerHTML = `
				<p class="section-title">${section.title}:</p>
				<p class="section-description">${section.summary}</p>
				<span class="section-collapsed"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" height="36" width="36"><path d="m24 30.75-12-12 2.15-2.15L24 26.5l9.85-9.85L36 18.8Z"></path></svg></span>
				<ol class="section-body">
					${section.contents.map(poem => {
						const author = poem.author || authors.get(poem.authorId);
						return `
							<li>
								<a href="./poem?path=${encodeURIComponent(poem.path)}">${poem.title} - By ${author?.name ?? "Unknown"}</a>
							</li>`;
					}).join("\n")}
				</ol>
			`;


			collapseContentsSection(sectionDiv)
			sectionDiv.addEventListener("click", event => {
				openContentsSection(sectionDiv)
			})

			sectionDiv.addEventListener("keypress", event => {
				if (event.target.classList.contains("grid-sub-container") && event.key == "Enter") {
					toggleContentsSection(event.target)
				}
			})

			sectionDiv.querySelectorAll(".section-title, .section-collapsed").forEach(collapseLabel => {
				collapseLabel.addEventListener("click", event => {
					let section = event.target.parentElement
					while (!section.classList.contains("grid-sub-container")) {
						section = section.parentElement
					}
					toggleContentsSection(section)
					event.stopPropagation()
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
if (document.readyState !== "loading") {
	initialise();
}
else {
	window.addEventListener("DOMContentLoaded", initialise);
}