using SubliminalServer.DataModel.Account;

namespace SubliminalServer.DataModel.Purgatory;

public interface IDatabasePoem
{
    // Client submitted
    public PageStyle PageStyle { get; set; }
    public string? PageBackgroundUrl { get; set; }

    public string PoemName { get; set; }
    public string PoemContent { get; set; }

    // Foreign key AccountData
    public string? AuthorKey { get; set; }
    public AccountData? Author { get; set; }
    
    // Foreign key PurgatoryEntry
    public string? AmendsKey { get; set; }
    public PurgatoryEntry? Amends { get; set;  }

    // Foreign key PurgatoryEntry
    public string? EditsKey { get; set; }
    public PurgatoryEntry Edits { get; set; }

}