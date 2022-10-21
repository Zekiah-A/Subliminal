using System;

public record Account
(
    //Profile account info
    string PenName,
    string Biography,
    string Location,
    string[] PinnedPoems,
    string JoinDate,
    Badge[] Badges,
    bool Admin

    //Private account info
    string[] Drafts,
    string[] LikedPoems,
    string[] KnownIPs
);