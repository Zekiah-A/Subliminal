using System;
using System.Text.Json.Serialization;
using SubliminalServer;

//Private account info - encrypted sha256
public record AccountData
(
    string Code,
    string Guid
)
{
    //These can be changed, but is server customisable only
    
    //Encrypted
    public List<byte[]>? LikedPoems { get; set; }
    public List<byte[]>? Drafts { get; set; }
    public List<byte[]>? KnownIPs { get; set; }
    
    //Private but not encrypted
    public string? Email { get; set;  }
    public string? PhoneNumber { get; set; }
    public AccountProfile Profile { get; set; }
};