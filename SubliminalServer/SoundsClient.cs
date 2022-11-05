namespace SubliminalServer;

public record SoundsClient
{
    public string HostUniqueId;
    public List<SoundsClient>? Zombies;
    public bool IsZombie;
}