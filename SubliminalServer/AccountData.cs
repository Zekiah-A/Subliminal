using System;
using System.Text.Json.Serialization;
using SubliminalServer;

//Private account info - encrypted sha256
public record AccountData
(
    string Code
)
{
    //These can be changed by the server, but is server -> user customisable only 
    public List<string> LikedPoems { get; set; }
    public List<string> Drafts { get; set; }
    public List<string> KnownIPs { get; set; }
    public AccountProfile Profile { get; set; }
};