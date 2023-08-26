namespace SubliminalServer.DataModel.Report;

public class Report
{
    public string ReporterKey { get; set; }
    public string? TargetKey { get; set; }
    public string Reason { get; set; }
    public ReportType ReportType { get; set; }
    public ReportTarget ReportTarget { get; set; }
    public DateTime ReportDate { get; set; }
}