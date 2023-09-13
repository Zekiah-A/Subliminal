using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using SubliminalServer.DataModel.Account;

namespace SubliminalServer.DataModel.Report;

[PrimaryKey(nameof(ReportKey))]
public class Report
{
    // Unique, Primary key
    [Required]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public string ReportKey { get; set; }
    
    // Foreign key Account Data
    [ForeignKey(nameof(Reporter))]
    public string ReporterKey { get; set; }
    public AccountData Reporter { get; set;  }

    // Foreign key PurgatoryEntry | PurgatoryAnnotation | AccountData
    [ForeignKey(nameof(Target))]
    public string? TargetKey { get; set; }
    public object Target { get; set; }
    
    public string Reason { get; set; }
    public ReportType ReportType { get; set; }
    public ReportTargetType ReportTargetType { get; set; }
    public DateTime ReportDate { get; set; }
}