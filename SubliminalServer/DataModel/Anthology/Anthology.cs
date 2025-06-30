using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace SubliminalServer.DataModel.Anthology;

public class Anthology
{
    // Unique, Primary key
    [Required]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    public string Title { get; set; }
    public string Description { get; set; }
    public string CoverImagePah { get; set; }
    
    // Navigation property to the Section's poems
    [JsonIgnore]
    public List<AnthologyVolume> Volumes { get; set; } = [];
}