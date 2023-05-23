using UnbloatDB.Attributes;

namespace SubliminalServer.Account;

public class AccountData
{
    public string CodeHash { get; init; }
    [KeyReference(ReferenceTargetType = typeof(AccountProfile))]
    public string ProfileKey { get; init; }

    public List<string> KnownIPs { get; set; } = new();
    public string Email { get; set; }
    public string PhoneNumber { get; set; }
    public List<string> Drafts { get; set; }
    public List<string> Blocked { get; set; }
    public List<string> LikedPoems { get; set; }


    /// <summary>
    /// Constructor for account data, contains the private info for an account (encrypted), account login code (hashed), and public facing account profile.
    /// </summary>
    /// <param name="code"></param>
    /// <param name="guid"></param>
    /// <param name="profile"></param>
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