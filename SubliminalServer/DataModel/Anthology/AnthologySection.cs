using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SubliminalServer.DataModel.Purgatory;

namespace SubliminalServer.DataModel.Anthology;

public class AnthologySection
{
    // Unique, Primary key
    [Required]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }
    
    public string Title { get; set; }
    public string Path { get; set; }
    public string Summary { get; set; }

    // Navigation property to the Section's poems
    public List<PurgatoryEntry> Contents { get; set; } = [];
}