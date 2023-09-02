namespace SubliminalServer.DataModel.Account;

public class AccountBadge
{
    public BadgeType BadgeType { get; set; }
    public DateTime DateAwarded { get; set; }

    // Foreign key AccountData
    public string AccountKey { get; set; }
    
    // Navigation property to the parent AccountProfile
    public AccountProfile AccountProfile { get; set; }
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