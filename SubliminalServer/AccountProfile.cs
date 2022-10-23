using System.Text.Json.Serialization;

namespace SubliminalServer;

//Public data - can be seen by anyone
public record AccountProfile
(
    string Guid
)
{
    public string PenName { get; set; }
    public string Biography { get; set; }
    public string Location { get; set; }
    public string[] PinnedPoems { get; set; }
    public string Role { get; set; }
    public string JoinDate { get; set; }
    public AccountBadge[] Badges { get; set; }
    public List<string>? PoemGuids { get; set; }
}