using System;
using System.Text.Json.Serialization;
using SubliminalServer;

//Private account info - encrypted sha256
public record AccountData
(
    string Code
)
{
    public List<string> LikedPoems { get; set; }
    public List<string> Drafts { get; set; }
    public List<string> KnownIPs { get; set; }
    public AccountProfile Profile { get; set; }
};