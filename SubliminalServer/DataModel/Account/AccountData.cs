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
}