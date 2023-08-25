namespace SubliminalServer;

public class PurgatoryAnnotation
{
    public string PoemKey { get; set; }
    public string ProfileKey { get; set; }
    public int Start { get; init; }
    public int End { get; init; }
    public string Content { get; init; }
}