"use strict";
const badgeType = {
	Admin: 0,
	Based: 1,
	WellKnown: 2,
	Verified: 3,
	Original: 4,
	New: 5
}

const ratingType = {
	Approve: 0,
	Veto: 1,
	Undo: 2,
}

function getBadgeInfo(badge) {
	switch (badge) {
		case badgeType.Admin:
			return "This person has the special role of ensuring things don't get too out of hand! Admins keep subliminal as the #1 spot for poems."
		case badgeType.Based:
			return "This person skirts the edge, either by pushing the limits of content here, or exploring places in creativity that others may fear to follow."
		case badgeType.New:
			return "This person recently made an account on subliminal, say hello!"
		case badgeType.Verified:
			return "This person has been verified to be who they claim they are (no imposters here)!"
		case badgeType.WellKnown:
			return "This person is certainly known for something, and is well established here because of it!"
		case badgeType.Original:
			return "This person is a true OG of subliminal, back in the days of scribbling poems on scraps of paper during free time, and the old plaintext site."
	}
}

async function getAccountData() {
	const res = await fetch(serverBaseAddress + "/accounts/me", {
		method: "POST",
		headers: { 'Content-Type': 'application/json' }
	})
	if (!res.ok) {
		return null
	}
	const accountData = await res.json()
	return accountData
}

async function getPublicProfile(accountId) {
	let profile = null

	await fetch(serverBaseAddress + "/profiles/" + accountId, {
		method: "GET",
		headers: { 'Content-Type': 'application/json' },
	})
	.then((res) => res.json())
	.then((profileObject) => profile = profileObject)

	return profile
}

async function isLoggedIn() {
	if (sessionStorage.accountToken) {
		return true
	}

	let response = await fetch(serverBaseAddress + "/auth/signin/token", {
		method: "POST",
		headers: {'Content-Type': 'application/json'}
	})
	return response.ok
}

async function signout() {
	window.location.reload(true)
}

console.log("%cAccount credentials may be held in browser storage, a thing that can be acessed by putting code in this console! If someone tells you to put something here, there is a high chance that you may get hacked!", "background: red; color: yellow; font-size: large")
console.log("%cTL;DR: Never put anything you do not understand here. Uncool things may happen.", "color: blue; font-size: x-large")