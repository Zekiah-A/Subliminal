using Microsoft.EntityFrameworkCore;

namespace SubliminalServer.DataModel.Account;

[PrimaryKey(nameof(BadgeKey))]
public class AccountBadge
{
    public string BadgeKey { get; set; }

    public BadgeType BadgeType { get; set; }
    public DateTime DateAwarded { get; set; }

    // Foreign key AccountData
    public string AccountKey { get; set; }
    
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