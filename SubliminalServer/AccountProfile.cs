using System.Text.Json.Serialization;

namespace SubliminalServer;

//Public data - can be seen by anyone
public record AccountProfile()
{
    //Customisable by the user
    [JsonInclude] public string PenName { get; set; }
    [JsonInclude] public string Biography { get; set; }
    [JsonInclude] public string Location { get; set; }
    [JsonInclude] public string[] PinnedPoems { get; set; }
    [JsonInclude] public string Role { get; set; }
    
    //Immutable, does not have to be serialisable
     public string JoinDate { get; set; }
     public AccountBadge[] Badges { get; set; }
     public List<string>? PoemGuids { get; set; }
}