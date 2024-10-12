using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using SubliminalServer.DataModel.Account;

namespace SubliminalServer.DataModel.Purgatory;

[PrimaryKey(nameof(Id))]
public class PurgatoryEntry : IDatabasePoem
{
    // Unique, Primary key
    [Required]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

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
    public int? AuthorId { get; set; }
    [JsonIgnore]
    public AccountData? Author { get; set; }
    
    // Foreign key PurgatoryEntry
    [ForeignKey(nameof(Amends))]
    [JsonPropertyName("Amends")]
    public int? AmendsId { get; set; }
    [JsonIgnore]
    public PurgatoryEntry? Amends { get; set;  }

    // Foreign key PurgatoryEntry
    [ForeignKey(nameof(Edits))]
    [JsonPropertyName("Edits")]
    public int? EditsId { get; set; }
    [JsonIgnore]
    public PurgatoryEntry? Edits { get; set; }
    
    // Server managed
    public int Approves { get; set; }
    public int Vetoes { get; set; }
    public DateTime DateCreated { get; set; }
    // TODO: Make pick object instead to track who assigned what pick
    public bool Pick { get; set; }
}