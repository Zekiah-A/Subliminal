namespace SubliminalServer.DataModel.Account;

/// <summary>
/// Constructor for account data, contains the private info for an account, and inherits from account profile
/// </summary>
public class AccountData : AccountProfile
{
    // Unique
    public string Token { get; set; }
    // Unique
    public string Email { get; set; }

    // Navigation property
    public List<string> KnownIPs { get; set; }
    // Navigation property
    public List<string> Drafts { get; set; }
    // Navigation property
    public List<string> Blocked { get; set; }
    // Navigation property
    public List<string> LikedPoems { get; set; }

    public AccountData()
    {
        KnownIPs = new List<string>();
        Drafts = new List<string>();
        Blocked = new List<string>();
        LikedPoems = new List<string>();
    }
};