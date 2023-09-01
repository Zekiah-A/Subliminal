namespace SubliminalServer.DataModel.Account;

/// <summary>
/// The public facing account info anyone can see/access via the user's account key.
/// Customisable by the user via account actions.
/// </summary>
public class AccountProfile
{
    // Unique, Primary key
    public string AccountKey { get; set; }
    
    // Unique
    public string Username { get; set; }
    
    public string PenName { get; set; }
    public string? Biography { get; set; }
    public string? Location { get; set; }
    public string? Role { get; set; }
    public string? AvatarUrl { get; set; }
    
    // Navigation property
    public List<BadgeType> Badges { get; set; }
    // Navigation property
    public List<string> PinnedPoems { get; set; }
    // Navigation property
    public List<string> Poems { get; set; }
    // Navigation property
    public List<string> Following { get; set; }
    public string JoinDate { get; set; }
}