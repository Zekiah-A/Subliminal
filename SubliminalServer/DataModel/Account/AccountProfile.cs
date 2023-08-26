namespace SubliminalServer.DataModel.Account;

/// <summary>
/// The public facing account info anyone can see/access via the user's account GUID.
/// Customisable by the user via account actions.
/// </summary>
public class AccountProfile
{
    public AccountProfile(string penName, string joinDate)
    {
        JoinDate = joinDate;
        PenName = penName;
    }

    public string ProfileKey { get; set; }
    public string PenName { get; set; }
    public string? Biography { get; set; }
    public string? Location { get; set; }
    public string? Role { get; set; }
    public string? AvatarUrl { get; set; }
    public List<AccountBadge> Badges { get; set; } = new() { AccountBadge.New };
    public List<string> PinnedPoems { get; set; } = new();
    public List<string> Poems { get; set; } = new();
    public List<string> Following { get; set; } = new();

    /// <summary>Account join date used miscellaneously. (Necessary)</summary>
    public string JoinDate { get; set; }
}