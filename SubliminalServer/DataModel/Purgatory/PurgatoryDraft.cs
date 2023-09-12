using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using SubliminalServer.DataModel.Account;

namespace SubliminalServer.DataModel.Purgatory;

[PrimaryKey(nameof(DraftKey))]
public class PurgatoryDraft : IDatabasePoem
{
    // Unique, Primary key
    [Required]
    public string DraftKey { get; set; }

    // Client submitted
    //[MaxLength(300)]
    //public string? Summary { get; set; }
    //public bool ContentWarning { get; set; }
    public string? PageStyle { get; set; }
    public string? PageBackground { get; set; }
    // Navigation property to PurgatoryTag
    //public List<PurgatoryTag> Tags { get; set; }
    
    [Required]
    [MaxLength(32)]
    public string PoemName { get; set; }
    [Required]
    public string PoemContent { get; set; }

    // Foreign key AccountData
    [ForeignKey(nameof(Author))]
    public string? AuthorKey { get; set; }
    public AccountData? Author { get; set; }
    
    // Foreign key PurgatoryEntry
    [ForeignKey(nameof(Amends))]
    public string? AmendsKey { get; set; }
    public PurgatoryEntry? Amends { get; set;  }

    // Foreign key PurgatoryEntry
    [ForeignKey(nameof(Edits))]
    public string? EditsKey { get; set; }
    public PurgatoryEntry Edits { get; set; }
}