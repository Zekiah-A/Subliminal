using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace SubliminalServer.DataModel.Purgatory;

[PrimaryKey(nameof(Id))]
public class PurgatoryTag
{
    // Unique, Primary key
    [Required]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }
    public string TagName { get; set; }

    // Foreign key
    [ForeignKey(nameof(PurgatoryEntry))]
    public int EntryId { get; set; }
    
    // Navigation property to the parent PurgatoryEntry
    public PurgatoryEntry PurgatoryEntry { get; set; }
}