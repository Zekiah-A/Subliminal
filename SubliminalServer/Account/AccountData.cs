namespace SubliminalServer.Account;

public class AccountData
{
    public string CodeHash { get; init; }
    public string Guid { get; init; }
    public AccountProfile Profile { get; init; }

    // Private and encrypted
    public List<byte[]> KnownIPs { get; set; } = new();
    public byte[]? Email { get; set; }
    public byte[]? PhoneNumber { get; set; }

    // Private but not encrypted
    public List<string> Drafts { get; set; }
    public List<string> Blocked { get; set; }
    public List<string> LikedPoems { get; set; }


    /// <summary>
    /// Constructor for account data, contains the private info for an account (encrypted), account login code (hashed), and public facing account profile.
    /// </summary>
    /// <param name="code"></param>
    /// <param name="guid"></param>
    /// <param name="profile"></param>
    public AccountData(string code, string guid, AccountProfile profile)
    {
        CodeHash = code;
        Guid = guid;
        Profile = profile;

        KnownIPs = new List<byte[]>();
        Drafts = new List<string>();
        Blocked = new List<string>();
        LikedPoems = new List<string>();
    }
    
    public void FollowUser(ref AccountData user)
    {
        if (Profile.Following.Contains(user.Guid)) return;
        Profile.Following.Add(user.Guid);
        user.Profile.Followers.Add(Guid);
    }

    public void UnfollowUser(ref AccountData user)
    {
        if (!Profile.Following.Contains(user.Guid)) return;
        Profile.Following.Remove(user.Guid);
        user.Profile.Followers?.Remove(Guid);
    }
};