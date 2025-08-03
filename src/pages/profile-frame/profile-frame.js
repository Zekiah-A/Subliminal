"use strict";

const params = new URLSearchParams(location.search)

let stringToHtml = text => {
	let htmlObject = document.createElement('temp')
	htmlObject.innerHTML = text
	return htmlObject.firstElementChild
}

function setProfileAvatar(newUrl) {
	if (newUrl == null) return
	profileAvatar.src = newUrl
}

function setProfileRole(newRole) {
	if (newRole == null) return
	newRole = newRole.substring(0, 8)
	profileRoleText.textContent = (["a", "e", "i", "o", "u"].indexOf(newRole[0].toLowerCase()) !== -1 ? ", an " : ", a ") + newRole
}

async function setProfileBadges(newBadges) {
	if (newBadges == null) return
	
	for (let badge of newBadges) {
		let badgeName = Object.keys(badgeType)[badge]

		let badgeElement = document.createElement("div")
		badgeElement.className = "profile-badge"

		let tooltip = document.createElement("div")
		tooltip.className = "button-tooltip"
		tooltip.textContent = getBadgeInfo(badge)
		badgeElement.appendChild(tooltip)

		let icon = stringToHtml(await (await fetch("../assets/" + badgeName + "Badge.svg")).text())
		icon.setAttribute("viewBox", "0 0 64 64")
		icon.setAttribute("width", "32")
		icon.setAttribute("height", "32")
		badgeElement.appendChild(icon)

		profileBadges.appendChild(badgeElement)
	}
}

async function initialise() {
	if (!params.get("guid")) {
		console.error("Could not display profile information: No GUID provided")
		return
	}

	let profileObject = await getPublicProfile(params.get("guid"))
	profileName.textContent = profileObject.penName || "Nameless"
	profileBiography.textContent = profileObject.biography || "I have no biography, I am the unknown."
	profileLocation.textContent = profileObject.location || "Planet Earth, Milky Way"
	profilePinned.textContent = (profileObject.pinnedPoems?.length > 0 ? profileObject.pinnedPoems : "Nothing pinned yet.") || "Nothing pinned yet."
	setProfileRole(profileObject.role || "writer")
	setProfileAvatar(profileObject.avatarUrl || "https://user-images.githubusercontent.com/11250/39013954-f5091c3a-43e6-11e8-9cac-37cf8e8c8e4e.jpg")
	setProfileBadges(profileObject.badges)
}

initialise()
