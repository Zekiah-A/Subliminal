import { EditorDocument } from "./editor/editor-document.js";
import { PoemCanvasEditor } from "./components/poem-canvas-editor-template.js";

"use strict";
const params = new URLSearchParams(document.location.search);
const edit = params.get("edit");
const amend = params.get("amend");
const decoder = new TextDecoder();
let currentGuid = "";
/**@type {string[]}*/ let poemTags = [];

const licenseAgreePopup = /**@type {HTMLDialogElement}*/(document.getElementById("licenseAgreePopup"));
const licenseAgreement = /**@type {HTMLElement}*/(document.getElementById("licenseAgreement"));
const builtinFreePopup = /**@type {HTMLDialogElement}*/(document.getElementById("builtinFreePopup"));
const loadPoemPopup = /**@type {HTMLDialogElement}*/(document.getElementById("loadPoemPopup"));
const poemImportInput = /**@type {HTMLInputElement}*/(document.getElementById("poemImportInput"));
const loadedContainer = /**@type {HTMLElement}*/(document.getElementById("loadedContainer"));
const editorsPopup = /**@type {HTMLDialogElement}*/(document.getElementById("editorsPopup"));
const editorsResults = /**@type {HTMLElement}*/(document.getElementById("editorsResults"));
const poemName = /**@type {HTMLElement}*/(document.getElementById("poemName"));
const poemAuthor = /**@type {HTMLElement}*/(document.getElementById("poemAuthor"));
const formattingToolbar = /**@type {HTMLElement}*/(document.getElementById("formattingToolbar"));
const formatColourInput = /**@type {HTMLInputElement}*/(document.getElementById("formatColourInput"));
const formattingColourRect = /**@type {HTMLElement}*/(document.getElementById("formattingColourRect"));
const poemEditor = /**@type {PoemCanvasEditor}*/(document.getElementById("poemEditor"));
const side = /**@type {HTMLElement}*/(document.getElementById("side"));
const summaryArea = /**@type {HTMLTextAreaElement}*/(document.getElementById("summaryArea"));
const tagContainer = /**@type {HTMLElement}*/(document.getElementById("tagContainer"));
const cWarningContainer = /**@type {HTMLElement}*/(document.getElementById("cWarningContainer"));
const cWarningCheckbox = /**@type {HTMLInputElement}*/(document.getElementById("cWarningCheckbox"));
const cWarningNotesInput = /**@type {HTMLTextAreaElement}*/(document.getElementById("cWarningNotesInput"));
const sideRhymeMatches = /**@type {HTMLElement}*/(document.getElementById("sideRhymeMatches"));

const editor = new EditorDocument("Click On Me to Start Editing", 1.5, 18)
poemEditor.useDocument(editor)

// format title to subliminal title format, used in poem download files, remove all non-fs friendly chars
function formatDash(text) {
	return text
		.trim()
		.toLowerCase()
		.replaceAll(" ", "-")
		.replaceAll(/(^\.|[<>:"/\|?*])/g, "");
}

// Save poem with a unique GUID so that we do not encounter overlaps
function newGuid() {
	return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11)
		.replace(/[018]/g, (char) =>
			(char ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (char / 4)))).toString(16))
}

async function fetchStorage() {
	// Clear anything that may already be in the laoded container
	while (loadedContainer.firstChild) {
		loadedContainer.removeChild(loadedContainer.firstChild)
	}

	// Fetch poems in localstorage
	for (let i = 0; i < localStorage.length; i++) {
		const poemGuid = localStorage.key(i)
		if (poemGuid?.length != 36) {
			continue
		}

		const item = localStorage.getItem(poemGuid)
		if (!item) {
			continue
		}
		const current = JSON.parse(item)
		const cardEl = document.createElement("div")
		cardEl.className = "poem-card"
		cardEl.onclick = () => {
			loadKey(localStorage.key(i))
			loadPoemPopup.close()
		};

		const cardTitle = document.createElement("h4")
		cardTitle.textContent = current.poemName
		cardEl.appendChild(cardTitle)

		const cardPreview = document.createElement("p")
		cardPreview.className = "poem-preview"
		let pContent = null
		try {
			pContent = current.poemContent
		} catch (e) {
			continue
		}
		cardPreview.textContent = pContent

		cardEl.appendChild(cardPreview)
		loadedContainer.appendChild(cardEl)
	}

	// If logged in, try to fetch poems from the subliminal cloud
	// TODO: Check for login PROPERLY! And wait for login event as well to check again
	if (localStorage.code) {
		let draftPoemIds = await getAccountData().draftPoemIds

		for (let id of draftPoemIds) {
			let draft = await executeAccountAction(
				actionType.GetDraft,
				id
			).json()
			let cardEl = document.createElement("div")
			cardEl.className = "poem-card"

			cardEl.onclick = async () => {
				load(await executeAccountAction(actionType.GetDraft, id).json())
				loadPoemPopup.close()
			};

			let cardTitle = document.createElement("h4")
			cardTitle.textContent = draft.poemName
			cardEl.appendChild(cardTitle)

			let cardPreview = document.createElement("p")
			cardPreview.className = "poem-preview"
			cardPreview.textContent = draft.poemContent
		}
	}
}

function saveCurrent() {
	currentGuid ||= newGuid()

	let saveData = {
		version: 1, //version of the poem editor
		guid: currentGuid, //unique poem identifier
		created: new Date().toISOString(), //date poem was created
		updated: new Date().toISOString(), //date poem was last updated
		summary: summaryArea.value, //meta description
		tags: poemTags.toString(), //meta keywords
		contentWarning: cWarningCheckbox.checked ? {
			enabled: true,
			notes: cWarningNotesInput.value,
			tags: []
		} : null, //content warning
		poem: {
			name: poemName.innerText,
			author: poemAuthor.innerText,
			content: editor.data
		}
	}

	localStorage.setItem(currentGuid, JSON.stringify(saveData))

	// Refresh load box with latest poem.
	fetchStorage()
}

function loadKey(key) {
	currentGuid = key
	let poemJson = JSON.parse(localStorage.getItem(key))
	load(poemJson)
}

function load(poemJson) {
	poemTags = [];
	while (!tagContainer.lastElementChild.getAttribute("add")) {
		tagContainer.removeChild(tagContainer.lastElementChild)
	}

	if (poemJson.tags) {
		for (let tag of poemJson.tags?.split(",")) {
			addPoemTag(tag)
		}
	}

	summaryArea.value = poemJson.summary ?? ""
	cWarningCheckbox.checked = poemJson.cWarning ?? ""
	cWarningNotesInput.disabled = !poemJson.cWarning
	cWarningNotesInput.value = poemJson.cWarningAdditions ?? ""
	poemName.innerText = poemJson.poemName ?? "undefined"
	poemAuthor.innerText = poemJson.poemAuthor ?? "undefined"
	editor.data = poemJson.poemContent ?? "undefined"
	document.body.style.background = poemJson.pageBackground ?? ""
	changePageStyle(poemJson.pageStyle ?? "poem-centre")
}

//This itelf is just the poem-editor, content will be moved from here to a new template file, and then downloaded
function downloadCurrent() {
	saveCurrent()
	let el = document.createElement("a")
	el.setAttribute("href", "data:text/html;charset=UTF-8," + encodeURIComponent(localStorage.getItem(currentGuid)))
	el.setAttribute("download", formatDash(poemName.innerText) + ".json")
	el.style.display = "none"
	document.body.appendChild(el)
	el.click()
	document.body.removeChild(el)
}

async function uploadCurrent() {
	saveCurrent()
	let loadObject = JSON.parse(localStorage.getItem(currentGuid))

	await upload(loadObject)
}

async function upload(poemJson) {
	if (await isLoggedIn()) {
		poemJson.code = localStorage.accountCode
	}

	fetch(serverBaseAddress + "/purgatory", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(poemJson),
	})
		.then((res) => {
			if (!res.ok) {
				console.error("Cricical error in uploading" + res)
				licenseAgreePopup.close()
				alert("Sorry!\n\nFailed to upload poem to purgatory. Maybe try again...")
				return null
			}

			return res.text()
		})
		.then((guidResponse) => {
			if (guidResponse == null) {
				return
			}

			console.log("Upload sucessful, redirecting.")
			window.onbeforeunload = () => { }
			window.location.href = "./poems?purgatorynew=" + guidResponse
		});
}

function changePageStyle(newStyle) {
	throw new Error("Not implemented")
	main.className = newStyle
	poemEditor.updateCanvas()
}

function applyBuiltinBackground(target) {
	if (!target.src) return
	document.body.style.background = `url('${target.src}')`
}

function addPoemTag(tagName) {
	if (!tagName || poemTags.includes(tagName) || poemTags.length >= 5) {
		return
	}
	tagName = tagName.replace(/\W+/g, "").slice(0, 12)
	poemTags.push(tagName)
	let newTag = document.createElement("button")
	let newLabel = document.createElement("span")
	newLabel.textContent = tagName
	newTag.appendChild(newLabel)
	newTag.onclick = () => {
		removePoemTag(tagName)
	}
	tagContainer.appendChild(newTag)
}

function removePoemTag(tagName) {
	poemTags.splice(poemTags.indexOf(tagName), 1)
	for (let tag of tagContainer.children) {
		if (tag.innerText == tagName) tagContainer.removeChild(tag)
	}
}

async function fetchPathJson(path) {
	return await (
		await fetch((path.includes("/") ? window.location.origin : serverBaseAddress + "/purgatory/") + path)
	).json()
}

async function initialiseAmendMode() {
	throw new Error("Not implemented")
	loadPoemPopup.close()
	//Load up amendment poem
	let currentJson = await fetchPathJson(amend);
	currentJson.amends = amend
	/*TODO: Reimplement
		originalContent.style.display = "block"
		originalContent.style.top = content.offsetTop + "px"
		originalContent.style.maxWidth = content.offsetWidth + "px"
		originalContent.innerHTML = currentJson.poemContent || ""*/
	load(currentJson)
}

async function rhymeFinderFind(word, apiPath) {
	let path = "https://api.datamuse.com/words?" + apiPath + "=" + word.replaceAll(" ", "+")
	if ((word.includes("*") || word.includes("?")) && apiPath != "sp") {
		path += "&sp=" + word
	}

	let response = await fetch(path);
	let matches = response.ok ? await response.json() : []

	while (sideRhymeMatches.lastElementChild) {
		sideRhymeMatches.removeChild(sideRhymeMatches.lastElementChild)
	}

	matches.sort((a, b) => a.score > b.score ? -1 : a.score == b.score ? 0 : 1)

	for (let match of matches) {
		let el = document.createElement("div")
		el.textContent = match.word
		let score = document.createElement("span")
		score.style.opacity = "0.6"
		score.textContent = " (" + match.score + " score)"
		el.appendChild(score)
		sideRhymeMatches.appendChild(el)
	}
}

async function getRhymes(word) {
	let response = await fetch("https:\/\/rhymebrain.com/talk?function=getRhymes&word=" + word)
	return response.ok ? await response.json() : []
}

async function getWordInfo(word) {
	let response = await fetch("https://rhymebrain.com/talk?function=getWordInfo&word=" + word)
	return response.ok ? await response.json() : null
}

async function spawnRhymePopup(event) {
	const findWord = (text, position) => {
		const after = text.substring(position).match(/^[a-zA-Z0-9-_]+/)
		const before = text.substring(0, position).match(/[a-zA-Z0-9-_]+$/)
		return (before || "") + (after || "");
	};

	// TODO: Fix for new poem editor system
	let offset =
		document.getSelection().baseOffset ||
		document.getSelection().getRangeAt(0).startOffset
	let selectedWord = findWord(event.target.textContent, offset)
	let rhymes = await getRhymes(selectedWord)
	let selectedSyllables = (await getWordInfo(selectedWord))?.syllables || 2
	if (offset == null || rhymes == null) return

	rhymes.sort((a, b) => Math.abs(selectedSyllables - a.syllables) < Math.abs(selectedSyllables - b.syllables)
		? -1
		: Math.abs(selectedSyllables - a.syllables) == Math.abs(selectedSyllables - b.syllables) ? 0 : 1)

	while (suggestions.lastElementChild) {
		suggestions.removeChild(suggestions.lastElementChild)
	}

	for (let rhyme of rhymes) {
		if (!rhyme.word || rhyme.word.length <= 1) continue
		let item = document.createElement("div")
		item.className = "suggestions-item"
		item.innerHTML = `<span>${rhyme.word}</span><span>(${rhyme.syllables} syllable${rhyme.syllables > 1 ? "s" : ""})</span>`
		suggestions.appendChild(item)
	}

	let item = document.createElement("div")
	item.className = "suggestions-item"
	item.innerHTML = `<span>❤️&nbsp;</span><span>All credits goes to rhymebrain for their fantastic API. https://rhymebrain.com</span>`
	suggestions.appendChild(item)

	suggestions.style.display = "block"
	suggestions.style.top = event.offsetY + 48 + "px"
	suggestions.style.left = event.offsetX + 16 + "px"
	suggestions.scrollTo(0, 0)
	suggestions.animate([{ maxHeight: "0px" }, { maxHeight: "256px" }], {
		duration: 200,
		iterations: 1,
		fill: "both",
	})
}

async function initialiseEditMode() {
	loadPoemPopup.close()
	let currentJson = await fetchPathJson(edit)
	currentJson.edits = edit
	load(currentJson)
}

function initialise() {
	if (amend) {
		initialiseAmendMode(); //enter poem amendment mode
	}
	else if (edit) {
		initialiseEditMode();
	}
	else fetchStorage(); //Load saved poems from local storage
}
if (document.readyState !== "loading") {
	initialise();
}
else {
	window.addEventListener("DOMContentLoaded", initialise);
}

formattingToolbar.addEventListener("mousemove", (event) => {
	for (const button of Array.from(formattingToolbar.children)) {
		if (button.className == "separator" || !(button instanceof HTMLElement)) {
			continue;
		}

		button.style.background =
			"radial-gradient(at left " +
			(event.screenX - button.offsetLeft) +
			"px top " +
			(event.screenY - button.offsetTop) +
			"px, darkgray, var(--background-opaque)"
	}
});

formattingToolbar.addEventListener("mouseleave", (event) => {
	for (const button of Array.from(formattingToolbar.children)) {
		if (button.className == "separator" || !(button instanceof HTMLElement)) {
			continue;
		}

		button.style.background = "none";
	}
});


// Make user confirm that they want to leave the page.
window.addEventListener("beforeunload", (event) => {
	event.preventDefault();
	return "Are you sure you want to leave without saving changes?";
});