namespace SubliminalServer;

//Public data - can be seen by anyone
public record AccountProfile
(
    string Guid,
    
    //Profile account info
    string PenName,
    string Biography,
    string Location,
    string[] PinnedPoems,
    string JoinDate,
    AccountBadge[] Badges,
    string[] PoemGuids

);