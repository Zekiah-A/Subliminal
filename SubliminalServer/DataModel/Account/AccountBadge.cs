using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace SubliminalServer.DataModel.Account;

[PrimaryKey(nameof(BadgeKey))]
public class AccountBadge
{
    // Unique, Primary key
    [Required]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int BadgeKey { get; set; }

    public BadgeType Badge { get; set; }
    public DateTime DateAwarded { get; set; }

    // Foreign key AccountData
    public int AccountKey { get; set; }
    
    // Navigation property to the parent AccounData
    public AccountData Account { get; set; }
}

public enum BadgeType
{
    Admin,
    Based,
    WellKnown,
    Verified,
    Original,
    New
}