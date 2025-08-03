"use strict";

const params = new URLSearchParams(document.location.search)
const encoder = new TextEncoder()
const poemId = params.get("id")

async function togglePoemLike(liked) {
	if (!localStorage.liked) {
		localStorage.liked = JSON.stringify([])
	}

	if (liked == "true") {
		likeButton.setAttribute("liked", false)
		likeButton.children[0].style.fill = "transparent"

		if (await isLoggedIn()) {
			executeAccountAction(actionType.UnlikePoem, poemId)
			return
		}

		let storeLiked = JSON.parse(localStorage.liked)
		if (storeLiked.indexOf(poemId) == -1) return
		storeLiked.splice(storeLiked.indexOf(poemId), 1)
		localStorage.liked = JSON.stringify(storeLiked)
		return
	}

	likeButton.setAttribute("liked", true)
	likeButton.children[0].style.fill = "#ffd500"

	if (await isLoggedIn()) {
		executeAccountAction(actionType.LikePoem, poemId)
		return
	}

	let storeLiked = JSON.parse(localStorage.liked)
	storeLiked.push(poemId)
	localStorage.liked = JSON.stringify(storeLiked)
}

function togglePoemPin(pinned) {
	if (pinned == "true") { 
		pinButton.setAttribute("pinned", false)
		pinButton.children[1].style.fill = "transparent"
		executeAccountAction(actionType.UnpinPoem, poemId)
		return
	}

	pinButton.setAttribute('pinned', true)
	pinButton.children[1].style.fill = "url(#b)"
	executeAccountAction(actionType.PinPoem, poemId)
}

async function initialise() {
	//init localstorage
	if (!localStorage.getItem("approved")) 
		localStorage.approved = JSON.stringify(new Set())
	if (!localStorage.getItem("vetoed"))
		localStorage.vetoed = JSON.stringify(new Set())

	// You can not pin a poem unless you have an account
	if (!await isLoggedIn()) {
		pinButton.onclick = () => {
			alert("Sorry!\nYou can not pin this poem your profile without being logged in to an account!")
		}
	}

	//fetch poem data
	const res = await fetch(serverBaseAddress + "/purgatory/" + poemId)
	if (!res.ok) {
		alert("Failed to load poem")
		history.back()
	}
	const poemData = await res.json()
	
	//Set up title for vanity
	document.title = "Subliminal - " + poemData.poemName

	//Place poem data into the DOM
	if (poemData.cWarning === true) {
		document.body.insertBefore(
			createFromData("content-warning", { addition: poemData.cWarningAdditions }), contentWarning)
	}
	
	//If author has a GUID (account),link it to the poem
	if (poemData.authorGuid) {
		poemAuthor.setAttribute("onclick", "profileFrame.style.display = 'block';")
		poemAuthor.setAttribute("onmouseover", "this.style.textDecoration = 'underline';")
		poemAuthor.setAttribute("onmouseleave", "this.style.textDecoration = 'none';")
		poemAuthor.style.cursor = "pointer"
		profileIframe.src = "./profile-frame.html?guid=" + poemData.authorGuid
	}
	
	//Set up title
	poemTitle.textContent = poemData.poemName
	poemAuthor.textContent = poemData.poemAuthor
	
	//Set up main poem content
	const poemContentObject = JSON.parse(poemData.poemContent)
	const poemDocument = new EditorDocument(poemContentObject)
	poemDocument.renderHtmlData(poemContent)
	poemMain.classList.add(poemData.pageStyle)
	document.body.style.background = poemData.pageBackground

	//If the poem is an adaptation/amendment, or an edited version of another, then keep track of that as well
	if (poemData.amends) {
		amendmentNote.style.display = "block"
		amendmentLink.href = window.location.origin + 
			(poemData.amends.includes("/") ? "/poem?path=" + poemData.amends : "purgatory-poem?guid=" + poemData.amends)
	}
	else if (poemData.edits) {
		editNote.style.display = "block"
		editLink.href = window.location.origin + 
			(poemData.edits.includes("/") ? "/poem?path=" + poemData.edits : "purgatory-poem?guid=" + poemData.edits)
	}

	// Poem liking  & ratings
	const accountData = await isLoggedIn() ? await getAccountData() : null
	const localLiked = localStorage.liked ? JSON.parse(localStorage.liked) : null

	if ((accountData && accountData.likedPoems.includes(poemId)) || (localLiked && localLiked.includes(poemId))) {
		likeButton.setAttribute("liked", true)
		likeButton.children[0].style.fill = "#ffd500"
	}
	if (accountData) {
		ratingContainer.style.visibility = "visible"
	}

	//Probably useless since pages are procedurally generated...
	document.querySelector('meta[name="description"]').setAttribute("content", poemData.summary)
	document.querySelector('meta[name="keywords"]').setAttribute("content", poemData.tags)
}

initialise()
