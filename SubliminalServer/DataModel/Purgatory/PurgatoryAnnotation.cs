namespace SubliminalServer.DataModel.Purgatory;

public class PurgatoryAnnotation
{
    public string PoemKey { get; set; }
    public string ProfileKey { get; set; }
    public int Start { get; set; }
    public int End { get; set; }
    public string Content { get; set; }
}