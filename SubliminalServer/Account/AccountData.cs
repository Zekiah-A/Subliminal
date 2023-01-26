using UnbloatDB.Keys;

namespace SubliminalServer.Account;

public class AccountData
{
    public string CodeHash { get; init; }
    public InterKey<AccountProfile> ProfileReference { get; init; }

    public List<string> KnownIPs { get; set; } = new();
    public string Email { get; set; }
    public string PhoneNumber { get; set; }
    public List<InterKey<PurgatoryEntry>> Drafts { get; set; }
    public List<InterKey<AccountProfile>> Blocked { get; set; }
    public List<InterKey<PurgatoryEntry>> LikedPoems { get; set; }


    /// <summary>
    /// Constructor for account data, contains the private info for an account (encrypted), account login code (hashed), and public facing account profile.
    /// </summary>
    /// <param name="code"></param>
    /// <param name="guid"></param>
    /// <param name="profile"></param>
    public AccountData(string code, InterKey<AccountProfile> accountProfileReference)
    {
        CodeHash = code;
        ProfileReference = accountProfileReference;

        KnownIPs = new List<string>();
        Drafts = new List<InterKey<PurgatoryEntry>>();
        Blocked = new List<InterKey<AccountProfile>>();
        LikedPoems = new List<InterKey<PurgatoryEntry>>();
    }
};