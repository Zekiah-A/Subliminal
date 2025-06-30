"use strict";
let role = ""
let avatarUrl = ""
let number = ""
let email = ""

function setProfileAvatar(newUrl) {
	if (newUrl == null) return

	avatarUrl = newUrl
	profileAvatar.src = avatarUrl
}

function setProfileRole(newRole) {
	if (newRole == null || newRole.length == 0) return

	role = role.substring(0, 8)
	role = newRole
	profileRoleText.textContent = (["a", "e", "i", "o", "u"].indexOf(role[0].toLowerCase()) !== -1 ? "an " : "a ") + role
}

function setProfileEmail(newEmail) {
	if (newEmail == null) return

	if (!email) {
		accountEmailInput.value = newEmail
	}

	email = newEmail
}

function setProfileName(value) {
	profileName.value = value

	if (value) {
		profileName.style.width = "0"
		profileName.style.minWidth = ""

		requestAnimationFrame(() => {
			profileName.style.setProperty("--contentWidth", profileName.scrollWidth + "px")
			profileName.style.width = "var(--contentWidth)"
		})
	}
	else {
		// Placeholder min-width: 196px
		profileName.style.minWidth = "198px"
	}
}
// This method should produce:
// <div class="following-card">
//		<img src="https://user-images.githubusercontent.com/11250/39013954-f5091c3a-43e6-11e8-9cac-37cf8e8c8e4e.jpg">
//		<div>
//			<h4>Zekiah</h4>
//			<p class="poem-preview">✍️&nbsp;I live in a society. This is one of the sites ever, and I write some of the poems ever. I also run this ship (to the bottom of the ocean).</p>
//		</div>
// </div>
async function setProfileFollowing(newGuids) { // TODO: Move to component system
	if (newGuids == null) return

	while (followingAccounts.firstChild) {
		followingAccounts.removeChild(followingAccounts.lastChild)
	}

	for (let guid of newGuids) {
		let profile = await getPublicProfile(guid)
		if (profile == null) continue 

		let el = document.createElement("div")
		el.className = "following-card"
		
		let profileImage = document.createElement("img")
		profileImage.avatarUrl = profile.avatarUrl || "https://user-images.githubusercontent.com/11250/39013954-f5091c3a-43e6-11e8-9cac-37cf8e8c8e4e.jpg" 
		el.appendChild(profileImage)

		let profileInfo = document.createElement("div")

		let profileName = document.createElement("h4")
		profileName.textContent = profile.penName || "Nameless"
		profileInfo.appendChild(profileName)

		let profileBio = document.createElement("p")
		profileBio.className = "poem-preview"
		profileBio.textContent = "✍️&nbsp;" + profile.biography || "I have no biography, I am the unknown."
		profileInfo.appendChild(profileBio)
		el.appendChild(profileInfo)

		followingAccounts.appendChild(el)
	}
}

// This method should produce:
// <div class="poem-card">
//		<h4>London</h4>
//		<p class="poem-preview">I walk through each chartered street, near where the chartered thames do flow. And marks on every face I meet, marks of weakness, marks of woe.</p>
// </div>
async function setProfileRecent(newGuids) { // TODO: Move to component system
	if (newGuids == null) return

	while (recentWorks.firstChild) {
		recentWorks.removeChild(recentWorks.lastChild)
	}

	for (let guid of newGuids) {
		let poem = await (await fetch(serverBaseAddress + "/purgatory/" + guid)).json()

		let el = document.createElement("div")
		el.className = "poem-card"

		let title = document.createElement("h4")
		title.textContent = poem.poemName
		el.appendChild(title)

		let preview = document.createElement("p")
		preview.textContent = poem.poemContent
		el.appendChild(preview)

		recentWorks.appendChild(el)
	}
}

async function setProfileBadges(newBadges) {
	if (newBadges == null) {
		return
	}

	for (const badge of newBadges) {
		const badgeElement = document.createElement("div")
		badgeElement.className = "profile-badge"

		const tooltip = document.createElement("div")
		tooltip.className = "button-tooltip"
		tooltip.textContent = getBadgeInfo(badge)
		badgeElement.appendChild(tooltip)

		try {
			const iconString = await (await fetch("./assets/" + badge + "Badge.svg")).text()
			const parser = new DOMParser()
			const svgDoc = parser.parseFromString(iconString, "image/svg+xml")
			const svgElement = svgDoc.documentElement
			svgElement.setAttribute("viewBox", "0 0 64 64")
			svgElement.setAttribute("width", "32")
			svgElement.setAttribute("height", "32")
			badgeElement.appendChild(svgElement)
		}
		catch (e) {
			console.error("Failed to load SVG for badge:", badge, e)
			const fallback = document.createElement("div")
			fallback.textContent = "🏅"
			fallback.style.fontSize = "32px"
			badgeElement.appendChild(fallback)
		}

		profileBadges.appendChild(badgeElement)
	}
}

function confirmFail() {
	if (confirm("Failed to load account profile data\nLogging out may fix such errors, proceed to logout?\nIf yes, press OK, else Cancel.")) {
		localStorage.removeItem("accountCode")
		localStorage.removeItem("accountGuid")
	}
}

async function updateAccount(propertyPath, value) {
	const response = await fetch(serverBaseAddress + "/accounts/me/" + propertyPath, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(value)
	});

	if (!response.ok) {
		confirmFail()
		return
	}
}

// https://stackoverflow.com/questions/12710001/how-to-convert-uint8-array-to-base64-encoded-string
async function bufferToBase64(buffer) {
	const base64url = await new Promise(resolve => {
		const reader = new FileReader()
		reader.onload = () => resolve(reader.result)
		reader.readAsDataURL(new Blob([buffer]))
	})

	return base64url.slice(base64url.indexOf(',') + 1);
}

async function updateProfilePicture(file) {
	let reader = new FileReader()
	reader.onload = async function (event) {
		const resultBytes = new Uint8Array(event.target.result)
		let encodedResult = await bufferToBase64(resultBytes)
		const res = await fetch(serverBaseAddress + "/accounts/me/avatar", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				mimeType: file.type,
				data: encodedResult
			})
		})
		if (res.ok) {
			profileAvatar.src = imageUrl
		}
		else {
			confirmFail("Failed to update profile avatar")
		}
	}
	reader.readAsArrayBuffer(file)
	const imageUrl = URL.createObjectURL(file)
}

async function initialise() {
	if (!await isLoggedIn()) {
		if (confirm("You don't seem to have an account here, or are not logged in. Log in now?")) {
			window.location.href = window.location.origin + "/login?referrer=/account"
		}
		else {
			history.back()
		}				
		return
	}

	try {
		const response = await fetch(serverBaseAddress + "/accounts/me", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			confirmFail()
			return
		}

		const accountData = await response.json()
		setProfileName(accountData.penName || "Nameless")
		profileUsername.textContent = "@" + accountData.username
		profileBiography.value = accountData.biography || "Click here to start writing your bio!"
		profileLocation.value = accountData.location || "Planet Earth, Milky Way"
		profilePinned.textContent = accountData.pinnedPoems?.length > 0 ? accountData.pinnedPoems : "Nothing pinned yet."
		setProfileRole(accountData.role || "writer")
		setProfileAvatar(accountData.avatarUrl 
			? serverBaseAddress + accountData.avatarUrl
			: "https://user-images.githubusercontent.com/11250/39013954-f5091c3a-43e6-11e8-9cac-37cf8e8c8e4e.jpg")
		setProfileBadges(accountData.badges || [])
		setProfileFollowing(accountData.following || [])
		setProfileRecent(accountData.poems || [])
	}
	catch (error) {
		console.error("Sign-in failed:", error)
		confirmFail()
	}
}

initialise()
