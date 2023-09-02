namespace SubliminalServer.DataModel.Purgatory;

public class PurgatoryTag
{
    public string TagName { get; set; }

    // Foreign key
    public string EntryKey { get; set; }
    
    // Navigation property to the parent PurgatoryEntry
    public PurgatoryEntry PurgatoryEntry { get; set; }
}