using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SubliminalServer.DataModel.Purgatory;

namespace SubliminalServer.DataModel.Report;

public class PurgatoryReport : Report
{
    [Required]
    [ForeignKey(nameof(Poem))]
    public int PoemId { get; set; }
    public PurgatoryEntry Poem { get; set; }
}