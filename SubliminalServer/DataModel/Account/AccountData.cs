namespace SubliminalServer.DataModel.Account;

/// <summary>
/// Constructor for account data, contains the private info for an account (encrypted), account login code (hashed), and public facing account profile.
/// </summary>
public class AccountData
{
    public string AccountKey { get; set; }
    // [MustBeUnique]
    public string CodeHash { get; set; }
    // [KeyReference(ReferenceTargetType = typeof(AccountProfile))]
    public string ProfileKey { get; set; }

    public List<string> KnownIPs { get; set; } = new();
    // [MustBeUnique]
    public string Email { get; set; }
    // [MustBeUnique]
    public string PhoneNumber { get; set; }
    public List<string> Drafts { get; set; }
    public List<string> Blocked { get; set; }
    public List<string> LikedPoems { get; set; }

    public AccountData(string code, string accountProfileKey)
    {
        CodeHash = code;
        ProfileKey = accountProfileKey;

        KnownIPs = new List<string>();
        Drafts = new List<string>();
        Blocked = new List<string>();
        LikedPoems = new List<string>();
    }
};