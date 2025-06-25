namespace SubliminalServer;

public class ServerConfig
{
    public const int LatestVersion = 1;
    public int Version = 1;
    public string? Certificate = null;
    public string? Key = null;
    public int Port = 1234;
    public bool UseHttps = false;
    public bool CorsCookie = false;
}