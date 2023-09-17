using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using SubliminalServer.DataModel.Purgatory;

namespace SubliminalServer.DataModel.Account;

/// <summary>
/// TODO: This should be combined into AccountData, then data we want to expose to the
/// TODO: API should be done through UploadableProfile.
/// The public facing account info anyone can see/access via the user's account key.
/// Customisable by the user via account actions. This is not part of the DB,
/// but is instead inherited by AccountData
/// </summary>
public class AccountProfile
{
    // Unique, Primary key
    [Required]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int AccountKey { get; set; }
    
    // Unique
    [Required]
    [MaxLength(32)]
    public string Username { get; set; }
    
    [MaxLength(32)]
    public string? PenName { get; set; }
    [MaxLength(300)]
    public string? Biography { get; set; }
    [MaxLength(32)]
    public string? Location { get; set; }
    [MaxLength(12)]
    public string? Role { get; set; }
    
    // Path to locally hosted avatar
    public string? AvatarUrl { get; set; }
    
    // Navigation property
    [JsonIgnore]
    public List<AccountBadge> Badges { get; set; }
    // Navigation property
    [JsonIgnore]
    public List<PurgatoryEntry> PinnedPoems { get; set; }
    // Navigation property
    [JsonIgnore]
    public List<PurgatoryEntry> Poems { get; set; }
    // Navigation property
    [JsonIgnore]
    public List<AccountData> Following { get; set; }
    public DateTime JoinDate { get; set; } // Must be unix

    public AccountProfile(string username, DateTime joinDate)
    {
        Username = username;
        JoinDate = joinDate;
        Badges = new List<AccountBadge>();
        PinnedPoems = new List<PurgatoryEntry>();
        Poems = new List<PurgatoryEntry>();
        Following = new List<AccountData>();
    }
}