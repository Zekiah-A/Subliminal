using SubliminalServer.DataModel.Account;

namespace SubliminalServer.ApiModel;

public class UploadableProfile
{
    public int AccountKey { get; set; }
    public string Username { get; set; }
    
    public string? PenName { get; set; }
    public string? Biography { get; set; }
    public string? Location { get; set; }
    public string? Role { get; set; }
    
    // Path to locally hosted avatar
    public string? AvatarUrl { get; set; }
    
    // List of account keys
    public List<int> Badges { get; set; }
    // List of account keys
    public List<int> PinnedPoems { get; set; }
    // List of account keys
    public List<int> Poems { get; set; }
    // List of account keys
    public List<int> Following { get; set; }
    public DateTime JoinDate { get; set; } // Unix time

    public UploadableProfile(AccountData account)
    {
        AccountKey = account.Id;
        Username = account.Username;
        PenName = account.PenName;
        Biography = account.Biography;
        Location = account.Location;
        Role = account.Role;
        AvatarUrl = account.AvatarUrl;
        Badges = account.Badges.Select(badge => badge.Id).ToList();
        PinnedPoems = account.PinnedPoems.Select(entry => entry.Id).ToList();
        Poems = account.Poems.Select(entry => entry.Id).ToList();
        Following = account.Following.Select(profile => profile.Id).ToList();
        JoinDate = account.JoinDate;
    }
}