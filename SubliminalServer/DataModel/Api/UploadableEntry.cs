using SubliminalServer.DataModel.Purgatory;

namespace SubliminalServer.DataModel.Api;

public class UploadableEntry
{
    public string? Summary { get; set; }
    public bool ContentWarning { get; set; }
    public PageStyle PageStyle { get; set; }
    public string? Background { get; set; }
    
    public IReadOnlyList<string> PoemTags { get; set; }
    public string PoemName { get; set; }
    public string PoemContent { get; set; }
    
    public int? Amends { get; init; }
    public int? Edits { get; init; }
}