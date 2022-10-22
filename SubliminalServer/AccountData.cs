using System;
using SubliminalServer;

//Private account info - encrypted sha256
public record AccountData
(
    //Account profile
    AccountProfile Profile,
    
    string Code,
    string[] Drafts,
    string[] LikedPoems,
    string[] KnownIPs
);