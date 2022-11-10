namespace SubliminalServer.Sounds;

public record SoundsClient
{
    public string HostUniqueId;
    public List<SoundsClient>? Zombies;
    public bool IsZombie;
}