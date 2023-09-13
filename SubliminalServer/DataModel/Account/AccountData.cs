using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using SubliminalServer.DataModel.Purgatory;

namespace SubliminalServer.DataModel.Account;

/// <summary>
/// Constructor for account data, contains the private info for an account, and inherits from account profile
/// </summary>
[PrimaryKey(nameof(AccountKey))]
public class AccountData : AccountProfile
{
    // Unique
    // Tokens expire after 1 month, formed up of {~32 byte random string};{unix time offset seconds when token will expire}. 
    public string Token { get; set; }
    // Unique
    [Required]
    public string Email { get; set; }

    // Navigation property
    public List<AccountIp> KnownIPs { get; set; }
    // Navigation property
    public List<PurgatoryDraft> Drafts { get; set; }
    // Navigation property
    public List<AccountData> Blocked { get; set; }
    // Navigation property
    public List<PurgatoryEntry> LikedPoems { get; set; }

    public AccountData()
    {
        KnownIPs = new List<AccountIp>();
        Drafts = new List<PurgatoryDraft>();
        Blocked = new List<AccountData>();
        LikedPoems = new List<PurgatoryEntry>();
    }
}