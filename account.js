const actionType = {
    // General account actions
    BlockUser: 0,
    UnblockUser: 1,
    FollowUser: 2,
    UnfollowUser: 3,
    LikePoem: 4,
    UnlikePoem: 5,
    
    // Location - Account data
    UpdateEmail: 6,
    UpdateNumber: 7,
    
    //Location - Account profile
    UpdatePenName: 8,
    UpdateBiography: 9,
    UpdateLocation: 10,
    UpdateRole: 11,
    UpdateAvatar: 12,
    PinPoem: 13,
    UnpinPoem: 14
}

const badgeType = {
    Admin: 0,
    Based: 1,
    WellKnown: 2,
    Verified: 3,
    Original: 4,
    New: 5
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
    
}

async function getPublicProfile(guid) {
    let profile = null

    fetch('https://server.poemanthology.org:81/AccountProfile/' + guid, {
        method: "GET",
        headers: { 'Content-Type': 'application/json' },
    })
    .then((res) => res.json())
    .then((profileObject) => profile = profileObject)

    return profile
}

async function executeAccountAction(action, value) {
    let accountAction = { }
    accountAction.code = localStorage.accountCode
    accountAction.actionType = action
    accountAction.value = value

    fetch('https://server.poemanthology.org:81/ExecuteAccountAction', {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountAction)
    })
}