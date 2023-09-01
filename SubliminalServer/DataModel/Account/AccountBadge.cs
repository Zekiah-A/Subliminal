namespace SubliminalServer.DataModel.Account;

public class AccountBadge
{
    public int Id { get; set; }
    public string BadgeName { get; set; }

    // Foreign key property
    public string AccountProfileAccountKey { get; set; }
    
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