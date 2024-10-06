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
    public int? AuthorId { get; set; }
    public AccountData? Author { get; set; }
    
    // Foreign key PurgatoryEntry
    public int? AmendsId { get; set; }
    public PurgatoryEntry? Amends { get; set;  }

    // Foreign key PurgatoryEntry
    public int? EditsId { get; set; }
    public PurgatoryEntry Edits { get; set; }

}