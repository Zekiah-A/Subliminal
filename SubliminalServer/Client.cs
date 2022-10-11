namespace SubliminalServer;

public record Client
{
    public string HostUniqueId;
    public List<Client>? Zombies;
    public bool IsZombie;
}