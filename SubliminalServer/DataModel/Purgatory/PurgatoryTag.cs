using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace SubliminalServer.DataModel.Purgatory;

[PrimaryKey(nameof(TagKey))]
public class PurgatoryTag
{
    // Unique, Primary key
    [Required]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int TagKey { get; set; }
    public string TagName { get; set; }

    // Foreign key
    public int EntryKey { get; set; }
    
    // Navigation property to the parent PurgatoryEntry
    public PurgatoryEntry PurgatoryEntry { get; set; }
}