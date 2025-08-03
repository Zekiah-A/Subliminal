"use strict";

async function initialise() {
	const params = new URLSearchParams(document.location.search)
	const path = params.get("path")
	const response = await fetch(window.location.origin + path + ".json")
	if (!response.ok) {
		alert("Unexpected network error - Failed to load poem")
		console.error("Poem load failed:", response.status, response.statusText)
		return
	}
	try {
		const poemData = await response.json()
		// Set up title and url bar for vanity
		window.history.replaceState(null, "Title", path)
		document.title = "Subliminal - " + poemData.poemName

		// Display content warning with additions if needed
		if (poemData.cWarning === true) {
			document.body.insertBefore(
				createFromData("content-warning", { addition: poemData.cWarningAdditions }), back)
		}

		// Place poem data into the DOM
		poemTitle.innerText = poemData.poemName + " - By " + poemData.poemAuthor
		const poemDocument = new EditorDocument(poemData.poemContent)
		poemDocument.renderHtmlData(poemContent)
		poemMain.classList.add(poemData.pageStyle)
		document.body.style.background = poemData.pageBackground

		// Probably useless since pages are procedurally generated...
		document.querySelector('meta[name="description"]').setAttribute("content", poemData.summary)
		document.querySelector('meta[name="keywords"]').setAttribute("content", poemData.tags)
	}
	catch (e) {
		alert("Unexpected format error - Failed to load poem. Invalid poem URL?")
		console.error("Poem parse failed:", e)
		return
	}
}

initialise()
