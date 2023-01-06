using UnbloatDB.Keys;

namespace SubliminalServer.Account;

/// <summary>
/// The public facing account info anyone can see/access via the user's account GUID.
/// Customisable by the user via account actions.
/// </summary>
/// <param name="PenName">Username displayed on profile. (Necessary)</param>
/// <param name="JoinDate">Account join date used miscellaneously. (Necessary)</param>
/// <param name="Biography">Account description displayed on profile. (Not necessary, nullable)</param>
/// <param name="Location">Account location displayed on profile. (Not necessary, nullable)</param>
/// <param name="Role">Account role displayed on profile. (Not necessary, nullable)</param>
/// <param name="AvatarUrl">Account avatar URL displayed on profile. (Not necessary, nullable)</param>
/// <param name="PinnedPoems">Account poems that they have pinned displayed on profile. (Necessary) (GUID)</param>
/// <param name="Badges">Account badges displayed on profile + used for authentication. (Necessary)</param>
/// <param name="PoemGuids">Account poems that they have uploaded. (Necessary) (GUID)</param>
/// <param name="Followers">Account followers displayed on profile. (Necessary) (GUID)</param>
/// <param name="Following">Account following displayed on profile. (Necessary) (GUID)</param>
public record AccountProfile(string PenName, string JoinDate)
{
    public string PenName { get; set; } = PenName;
    public string? Biography { get; set; }
    public string? Location { get; set; }
    public string? Role { get; set; }
    public string? AvatarUrl { get; set; }
    public List<AccountBadge> Badges { get; set; } = new() { AccountBadge.New };
    public List<InterKey<AccountProfile>> PinnedPoems { get; set; } = new();
    public List<InterKey<PurgatoryEntry>> PoemReferences { get; set; } = new();
    public List<InterKey<AccountProfile>> Following { get; set; } = new();
};