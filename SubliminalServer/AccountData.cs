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
    //These can be changed by the server, but is server -> user customisable only 
    public List<string> LikedPoems { get; set; }
    public List<string> Drafts { get; set; }
    public List<string> KnownIPs { get; set; }
    public string Email { get; set;  }
    public string PhoneNumber { get; set; }
    public AccountProfile Profile { get; set; }
};