using System.Text.Json.Serialization;

namespace SubliminalServer;

//Public data - can be seen by anyone
public record AccountProfile
{
    //Customisable by the user
    [JsonInclude] public string PenName { get; set; }
    [JsonInclude] public string Biography { get; set; }
    [JsonInclude] public string Location { get; set; }
    [JsonInclude] public string[] PinnedPoems { get; set; }
    [JsonInclude] public string Role { get; set; }
    [JsonInclude] public string AvatarUrl { get; set; }
    
    
    //Immutable, you don't want user to change these
    [JsonInclude] public string? JoinDate { get; set; }
    [JsonInclude] public List<AccountBadge>? Badges { get; set; }
    [JsonInclude] public List<string>? PoemGuids { get; set; }
    
    public bool CheckUserUnchanged(AccountProfile comparison) => JoinDate == comparison.JoinDate && Badges == comparison.Badges && PoemGuids == comparison.PoemGuids;
}