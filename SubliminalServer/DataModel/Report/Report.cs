namespace SubliminalServer.DataModel.Report;

public class Report
{
    // Unique, Primary key
    public string ReportKey { get; set; }
    
    // Foreign key Account Data
    public string ReporterKey { get; set; }
    
    // Foreign key PurgatoryEntry | PurgatoryAnnotation | AccountData
    public string? TargetKey { get; set; }
    
    public string Reason { get; set; }
    public ReportType ReportType { get; set; }
    public ReportTargetType ReportTargetType { get; set; }
    public DateTime ReportDate { get; set; }
}