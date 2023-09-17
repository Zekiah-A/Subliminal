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
    [Required]
    [ForeignKey(nameof(Reporter))]
    public int ReporterKey { get; set; }
    public AccountData Reporter { get; set;  }

    // Foreign key PurgatoryEntry | PurgatoryAnnotation | AccountData
    [Required]
    [ForeignKey(nameof(Target))]
    public int TargetKey { get; set; }
    // Navigation property PurgatoryEntry | PurgatoryAnnotation | AccountData
    public object Target { get; set; }
    
    [MaxLength(300)]
    public string Reason { get; set; }
    public ReportType ReportType { get; set; }
    public ReportTargetType ReportTargetType { get; set; }
    public DateTime DateCreated { get; set; }
}