using System;
using System.Text.Json.Serialization;
using SubliminalServer;

// Private account info - encrypted sha256
public record AccountData
(
    string Code,
    string Guid
)
{
    // These can be changed, but is server customisable only
    
    // Hashed/Encrypted
    public List<byte[]>? KnownIPs { get; set; } // Use - Moderation
    public string? Email { get; set;  } // Use - 2fa
    public string? PhoneNumber { get; set; } // Use - 2fa

    // Private but not encrypted
    public List<string>? LikedPoems { get; set; }
    public List<string>? Drafts { get; set; }
    public AccountProfile Profile { get; set; }
};