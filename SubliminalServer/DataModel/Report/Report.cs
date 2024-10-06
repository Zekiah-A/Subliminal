using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using SubliminalServer.DataModel.Account;

namespace SubliminalServer.DataModel.Report;

[PrimaryKey(nameof(ReportId))]
public class Report
{
    // Unique, Primary key
    [Required]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public string ReportId { get; set; }
    
    // Foreign key Account Data
    [Required]
    [ForeignKey(nameof(Reporter))]
    public int ReporterKey { get; set; }
    public AccountData Reporter { get; set;  }
    
    [MaxLength(300)]
    public string Reason { get; set; }
    public ReportType ReportType { get; set; }
    public ReportTargetType ReportTargetType { get; set; }
    public DateTime DateCreated { get; set; }
}