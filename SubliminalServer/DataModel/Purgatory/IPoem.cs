using SubliminalServer.DataModel.Account;

namespace SubliminalServer.DataModel.Purgatory;

public interface IPoem
{
    // Client submitted
    public string? PageStyle { get; set; }
    public string? PageBackground { get; set; }

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