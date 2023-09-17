using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using SubliminalServer.DataModel.Account;
using SubliminalServer.DataModel.Api;

namespace SubliminalServer.DataModel.Purgatory;

[PrimaryKey(nameof(EntryKey))]
public class PurgatoryEntry : IDatabasePoem
{
    // Unique, Primary key
    [Required]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int EntryKey { get; set; }

    // Client submitted
    [MaxLength(300)]
    public string? Summary { get; set; }
    public bool ContentWarning { get; set; }
    public PageStyle PageStyle { get; set; }

    // Path to locally hosted page background submission
    public string? PageBackgroundUrl { get; set; }
    
    // Navigation property to PurgatoryTag
    public List<PurgatoryTag> Tags { get; set; }
    [Required]
    [MaxLength(32)]
    public string PoemName { get; set; }
    [Required]
    public string PoemContent { get; set; }
    
    // Foreign key AccountData
    [ForeignKey(nameof(Author))]
    [JsonPropertyName("Author")]
    public int? AuthorKey { get; set; }
    [JsonIgnore]
    public AccountData? Author { get; set; }
    
    // Foreign key PurgatoryEntry
    [ForeignKey(nameof(Amends))]
    [JsonPropertyName("Amends")]
    public int? AmendsKey { get; set; }
    [JsonIgnore]
    public PurgatoryEntry? Amends { get; set;  }

    // Foreign key PurgatoryEntry
    [ForeignKey(nameof(Edits))]
    [JsonPropertyName("Edits")]
    public int? EditsKey { get; set; }
    [JsonIgnore]
    public PurgatoryEntry? Edits { get; set; }
    
    // Server managed
    public int Approves { get; set; }
    public int Vetoes { get; set; }
    public DateTime DateCreated { get; set; }
    public bool Pick { get; set; }
}