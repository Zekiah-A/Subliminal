namespace SubliminalServer;

public record ServerConfig(string Certificate, string Key, int Port, bool UseHttps);