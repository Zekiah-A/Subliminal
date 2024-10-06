using Microsoft.AspNetCore.Mvc;
using SubliminalServer.ApiModel;
using SubliminalServer.DataModel.Account;
using SubliminalServer.DataModel.Purgatory;
using SubliminalServer.DataModel.Report;

namespace SubliminalServer;

public static partial class Program
{
    private static void AddAccountEndpoints()
    {
        // Account action endpoints
        httpServer.MapPost("/accounts/{accountId}/block", ([FromBody] int accountId, [FromServices] DatabaseContext database, HttpContext context) =>
        {
            throw new NotImplementedException();
        });

        httpServer.MapPost("/accounts/{accountId}/unblock", ([FromBody] int accountId, HttpContext context) =>
        {
            throw new NotImplementedException();
        });

        httpServer.MapPost("/accounts/{accountId}/follow", ([FromBody] int accountId, HttpContext context) =>
        {
            throw new NotImplementedException();
        });

        httpServer.MapPost("/accounts/{accountId}/report", (int accountId, [FromBody] UploadableReport reportUpload, [FromServices] DatabaseContext database, HttpContext context) =>
        {
            var validationIssues = new Dictionary<string, string[]>();
            if (reportUpload.Reason.Length > 300)
            {
                validationIssues.Add(nameof(reportUpload.Reason), ValidationFails.ReportReasonTooLong);
            }
            var validKey = reportUpload.TargetType switch
            {
                ReportTargetType.Entry => database.PurgatoryEntries
                    .Any(entry => entry.Id == reportUpload.TargetKey),
                ReportTargetType.Account => database.Accounts
                    .Any(account => account.Id == reportUpload.TargetKey),
                ReportTargetType.Annotation => database.PurgatoryAnnotations
                    .Any(entry => entry.Id == reportUpload.TargetKey),
                _ => throw new ArgumentOutOfRangeException(nameof(reportUpload.TargetType))
            };
            if (!validKey)
            {
                validationIssues.Add(nameof(reportUpload.TargetType), ValidationFails.ReportTargetDoesntExist);
            }
            if (validationIssues.Count > 0)
            {
                return Results.ValidationProblem(validationIssues);
            }

            var account = (AccountData) context.Items["Account"]!;
            /*var report = new Report()
            {
                ReporterKey = account.Id,
                TargetKey = reportUpload.TargetKey,
                Reason = reportUpload.Reason,
                ReportType = reportUpload.ReportType,
                ReportTargetType = reportUpload.TargetType,
                DateCreated = DateTime.UtcNow
            };
            database.Reports.Add(report);
            database.SaveChanges();*/

            return Results.Ok();
        });
        // TODO: Reimplement this
        //rateLimitEndpoints.Add("/accounts/{accountId}/report", (1, TimeSpan.FromSeconds(60)));
        //authRequiredEndpoints.Add("/accounts/{accountId}/report");

        httpServer.MapPost("/accounts/{accountId}/unfollow", ([FromBody] string userId, HttpContext context) =>
        {
            throw new NotImplementedException();
        });
        
        
        // Personal account endpoints
        httpServer.MapPost("/accounts/me/email", ([FromBody] string email, HttpContext context) =>
        {
            throw new NotImplementedException();
        });

        httpServer.MapPost("/accounts/me/pen-name", ([FromBody] string penName, HttpContext context) =>
        {
            throw new NotImplementedException();
        });

        httpServer.MapPost("/accounts/me/biography", ([FromBody] string biography, HttpContext context) =>
        {
    
            throw new NotImplementedException();
        });

        httpServer.MapPost("/accounts/me/location", ([FromBody] string location, HttpContext context) =>
        {
            throw new NotImplementedException();
        });

        httpServer.MapPost("/accounts/me/role", ([FromBody] string role, HttpContext context) =>
        {
            throw new NotImplementedException();
        });

        httpServer.MapPost("/accounts/me/avatar", ([FromBody] string avatarUrl, HttpContext context) =>
        {
            throw new NotImplementedException();
        });
    }
}