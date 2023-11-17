using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SubliminalServer.DataModel.Account;

namespace SubliminalServer.DataModel.Report;

public class PurgatoryAnnotationReport : Report
{
    [Required]
    [ForeignKey(nameof(Annotation))]
    public int AnnotationKey { get; set; }
    public AccountData Annotation { get; set; }
}