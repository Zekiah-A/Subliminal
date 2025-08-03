"use strict";

const params = new URLSearchParams(document.location.search)

async function addPurgatoryEntries(filter) {
	while (purgatoryFlex.firstChild) { purgatoryFlex.removeChild(purgatoryFlex.lastChild) }
	while (purgatoryGrid.firstChild) { purgatoryGrid.removeChild(purgatoryGrid.lastChild) }

	purgatoryGrid.style.display = "none"
	purgatoryFlex.style.display = "flex"

	let entries = []
	let element = purgatoryFlex

	if (filter === "new") {        
		purgatoryFlex.style.display = "none"
		purgatoryGrid.style.display = "grid"
		element = purgatoryGrid
		/*for (let i = 0; i < 10; i++) {
			purgatoryGrid.appendChild(createFromData("purgatory-entry", {
				name: "Loading...",
				author: "...",
				approves: 0,
				vetoes: 0,
				preview: ""
			}))
		}*/

		const currentISO = new Date().toISOString()
		const response = await fetch(serverBaseAddress + `/purgatory/before?date=${currentISO}&count=${10}`)
		if (response.ok) {
			try {
				entries = await response.json()
			}
			catch (error) {
				console.error("Failed to load purgatory new: ", error)
			}
		}
		else {
			console.error("Failed to load purgatory new: ", response.status, response.statusText)
		}
		if (!Array.isArray(entries) || entries.length === 0) {
			purgatoryGrid.innerHTML = `<div class="purgatory-warning">
				<span>😢 Couldn't load any purgatory poems! Try again later.</span>
			</div>`
		}
	}
	else if (filter === "liked") {
		/*for (let i = 0; i < 6; i++) {
			purgatoryFlex.appendChild(createFromData("purgatory-entry", {
				name: "Loading...",
				author: "...",
				approves: 0,
				vetoes: 0,
				preview: ""
			}))
		}*/
		if (!await isLoggedIn()) {
			purgatoryFlex.innerHTML = `<div class="purgatory-warning">
					<span>😢 You are not logged in...<br>Log in or create an account to save liked poems to your profile!</span>
				</div>`
			return
		}
		
		entries = (await getAccountData()).likedPoems
		if (entries == null || entries.length === 0) {
			purgatoryFlex.innerHTML = `<div class="purgatory-warning">
					<span>😢 You haven't liked any poems...<br>Press the star icon on a poem to add one to your liked list!</span>
				</div>`
			return
		}
	}
	else if (filter === "recommended") {
		for (let i = 0; i < 6; i++) {
			purgatoryFlex.appendChild(createFromData("purgatory-entry", {
				name: "Loading...",
				author: "...",
				approves: 0,
				vetoes: 0,
				preview: ""
			}))
		}
		//Picks appear first on new, and have a different template
		let picks = []
		try { picks = await (await fetch(serverBaseAddress + "/purgatory/picks")).json() }
		catch(error) { console.warn("Error loading purgatory new: ", error) }
		
		let extraData = {
			notification: "Subliminal pick",
			tooltip: "This poem has been recommended to you based on your previous activity"
		}
		purgatoryFlex.innerHTML = `<div class="purgatory-warning">
				<span>😢 You are not logged in...<br>Log in or create an account to see your recommendations!</span>
			</div>`
		
		for (let pickEntry of picks) {
			await appendEntry(pickEntry, purgatoryFlex, extraData)
		}
		entries = await (await fetch(serverBaseAddress + "/purgatory/recommended")).json()
	}

	for (let entry of entries) { await appendEntry(entry, element/*, entryTemplate*/) }
	if (!params.get("purgatorynew") || filter !== "new" || !purgatoryFlex.children[0]) {
		return
	}

	let extraData = {
		notification: "New submission!",
		tooltip: "Well done, but only the purgatory can decide the fate of this poem now..."
	}
	let newElement = await appendEntry(params.get("purgatorynew"), purgatoryFlex, extraData)
	
	window.scrollTo(0, 0)
	purgatoryFlex.scrollTo(1e4, 0) 
	newElement.classList.add("entry-new")
	setTimeout(() => newElement.classList.remove("entry-new"), 800)
	params.delete("purgatorynew")
}

async function appendEntry(entry, element, extraData) {
	const res = await fetch(serverBaseAddress + "/purgatory/" + entry)
	if (!res.ok) {
		console.error("Failed to append purgatory entry: ", res)
		return null
	}
	let entryData = await res.json()
	if (entryData == null) {
		return null
	}
	let entryElement = createFromData("purgatory-entry", {
		id: entryData.id,
		name: entryData.poemName?.substring(0, 32),
		author: entryData.poemAuthor?.substring(0, 12),
		approves: entryData.approves || 0,
		vetoes: entryData.vetoes || 0,
		preview: new EditorDocument(JSON.parse(entryData.poemContent)).getText().slice(0, 150),
		...extraData 
	})

	element.appendChild(entryElement)
	return entryElement
}

// Purgatory initialisation
addPurgatoryEntries("new")

filtersBar.addEventListener("mousemove", event => {
	for (const button of filtersBar.children) {
		button.style.background =
			"radial-gradient(at left " + (event.clientX - button.offsetLeft) +
			"px top " + (event.clientY - button.offsetTop) + "px, darkgray, var(--background-opaque)"
	}
})

filtersBar.addEventListener("mouseleave", event => {
	for (let button of filtersBar.children) {
		if (button.className === "separator") continue
		button.style.background = "none"
	}
})
