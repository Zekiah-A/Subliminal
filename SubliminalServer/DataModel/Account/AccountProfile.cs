using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace SubliminalServer.DataModel.Account;

/// <summary>
/// The public facing account info anyone can see/access via the user's account key.
/// Customisable by the user via account actions. This is not part of the DB,
/// but is instead inherited by AccountData
/// </summary>
public class AccountProfile
{
    // Unique, Primary key
    [Required]
    public string AccountKey { get; set; }
    
    // Unique
    [Required]
    [MaxLength(32)]
    public string Username { get; set; }
    
    [Required]
    [MaxLength(32)]
    public string PenName { get; set; }
    [MaxLength(300)]
    public string? Biography { get; set; }
    [MaxLength(32)]
    public string? Location { get; set; }
    [MaxLength(12)]
    public string? Role { get; set; }
    
    // Path to locally hosted avatar
    public string? AvatarUrl { get; set; }
    
    // Navigation property
    public List<BadgeType> Badges { get; set; }
    // Navigation property
    public List<string> PinnedPoems { get; set; }
    // Navigation property
    public List<string> Poems { get; set; }
    // Navigation property
    public List<string> Following { get; set; }
    public DateTime JoinDate { get; set; }
}