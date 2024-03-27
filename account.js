const actionType = {
    // General account actions
    BlockUser: 0,
    UnblockUser: 1,
    FollowUser: 2,
    UnfollowUser: 3,
    LikePoem: 4,
    UnlikePoem: 5,
    RatePoem: 6,
    UploadDraft: 7,
    DeleteDraft: 8,
    GetDraft: 9,
    Report: 10,

    // Location - Account data
    UpdateEmail: 11,
    UpdateNumber: 12,
    
    //Location - Account profile
    UpdatePenName: 13,
    UpdateBiography: 14,
    UpdateLocation: 15,
    UpdateRole: 16,
    UpdateAvatar: 17,
    PinPoem: 18,
    UnpinPoem: 19
}

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
    let data = null
    
    await fetch(serverBaseAddress + "/Signin", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: '"' + localStorage.accountCode + '"'
    })
    .then((res) => res.json())
    .then((dataObject) => data = dataObject)

    return data
}

async function getPublicProfile(guid) {
    let profile = null

    await fetch(serverBaseAddress + "/AccountProfile/" + guid, {
        method: "GET",
        headers: { 'Content-Type': 'application/json' },
    })
    .then((res) => res.json())
    .then((profileObject) => profile = profileObject)

    return profile
}

async function executeAccountAction(action, value) {
    let accountAction = {
        code: localStorage.accountCode,
        actionType: action,
        value: value
    }

    return await (fetch(serverBaseAddress + "/ExecuteAccountAction", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountAction)
    }))
}

async function isLoggedIn() {
    if (!localStorage.accountCode) return false

    let response = await fetch(serverBaseAddress + "/Signin", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' }, body: '"' + localStorage.accountCode + '"'}
    )
    return response.ok
}

console.log("%cPrivate account data may be held in browser local storage, a thing that can be acessed by putting code in this browser console! If someone tells you to put something here, there is a high chance that you may get hacked!", "background: red; color: yellow; font-size: large")
console.log("%cTL;DR: Never put anything you do not understand here. Uncool things may happen.", "color: blue; font-size: x-large")