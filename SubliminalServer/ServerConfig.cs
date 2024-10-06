namespace SubliminalServer;

public class ServerConfig
{
    public const int LatestVersion = 0;
    public int Version = 0;
    public string? Certificate = null;
    public string? Key = null;
    public int Port = 1234;
    public bool UseHttps = false;
}