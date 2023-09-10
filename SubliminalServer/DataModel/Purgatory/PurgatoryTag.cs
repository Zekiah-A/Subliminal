using Microsoft.EntityFrameworkCore;

namespace SubliminalServer.DataModel.Purgatory;

[PrimaryKey(nameof(TagKey))]
public class PurgatoryTag
{
    public string TagKey { get; set; }
    public string TagName { get; set; }

    // Foreign key
    public string EntryKey { get; set; }
    
    // Navigation property to the parent PurgatoryEntry
    public PurgatoryEntry PurgatoryEntry { get; set; }
}