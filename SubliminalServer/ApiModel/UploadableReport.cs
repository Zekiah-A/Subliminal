using SubliminalServer.DataModel.Report;

namespace SubliminalServer.ApiModel;

public class UploadableReport
{
    public int TargetKey { get; set; }
    public string Reason { get; set; }
    public ReportType ReportType { get; set; }
    public ReportTargetType TargetType { get; set; }
    public DateTime DateCreated { get; set; }
}