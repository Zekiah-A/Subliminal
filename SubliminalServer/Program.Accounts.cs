using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using SubliminalServer.ApiModel;
using SubliminalServer.DataModel.Account;
using SubliminalServer.DataModel.Purgatory;
using SubliminalServer.DataModel.Report;

namespace SubliminalServer;

internal static partial class Program
{
    // /accounts/{id:int}
    [GeneratedRegex(@"^\/accounts\/\d+\/report\/*$")]
    private static partial Regex AccountReportEndpointRegex();
    
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
            var report = new AccountReport()
            {
                ReporterId = account.Id,
                AccountId = reportUpload.TargetKey,
                Reason = reportUpload.Reason,
                ReportType = reportUpload.ReportType,
                ReportTargetType = reportUpload.TargetType,
                DateCreated = DateTime.UtcNow
            };
            database.AccountReports.Add(report);
            database.SaveChanges();

            return Results.Ok();
        }).UseMiddleware<EnsuredAuthorizationMiddleware>(httpServer, AccountReportEndpointRegex);
        if (!httpServer.Environment.IsDevelopment())
        {
            httpServer.UseWhen
            (
                context => AccountReportEndpointRegex().IsMatch(context.Request.Path),
                appBuilder => appBuilder.UseMiddleware<RateLimitMiddleware>(1, TimeSpan.FromSeconds(60))
            );
        }

        httpServer.MapPost("/accounts/{accountId}/unfollow", ([FromBody] string userId, HttpContext context) =>
        {
            throw new NotImplementedException();
        });
        
        // Personal account endpoints
        httpServer.MapGet("/accounts/me", (HttpContext context, DatabaseContext dbContext) =>
        {
            var account = context.Items["Account"] as AccountData;
            return Results.Ok(account);
        });

        httpServer.MapPost("/accounts/me/email", async ([FromBody] string email, HttpContext context, DatabaseContext dbContext) =>
        {
            var account = context.Items["Account"] as AccountData;
            account!.Email = email;
            await dbContext.SaveChangesAsync();
            return Results.Ok();
        });

        httpServer.MapPost("/accounts/me/pen-name", async ([FromBody] string penName, HttpContext context, DatabaseContext dbContext) =>
        {
            var account = context.Items["Account"] as AccountData;
            account!.PenName = penName;
            await dbContext.SaveChangesAsync();
            return Results.Ok();
        });

        httpServer.MapPost("/accounts/me/biography", async ([FromBody] string biography, HttpContext context, DatabaseContext dbContext) =>
        {
            var account = context.Items["Account"] as AccountData;
            account!.Biography = biography;
            await dbContext.SaveChangesAsync();
            return Results.Ok();
        });

        httpServer.MapPost("/accounts/me/location", async ([FromBody] string location, HttpContext context, DatabaseContext dbContext) =>
        {
            var account = context.Items["Account"] as AccountData;
            account!.Location = location;
            await dbContext.SaveChangesAsync();
            return Results.Ok();
        });

        httpServer.MapPost("/accounts/me/role", async ([FromBody] string role, HttpContext context, DatabaseContext dbContext) =>
        {
            var account = context.Items["Account"] as AccountData;
            account!.Role = role;
            await dbContext.SaveChangesAsync();
            return Results.Ok();
        });
        
        var allowedAvatarMimes = new Dictionary<string, string>
        {
            { "image/png",  ".png" },
            { "image/jpeg", ".jpg" },
            { "image/webp", ".webp" },
            { "image/gif", ".gif" }
        };
        httpServer.MapPost("/accounts/me/avatar", async ([FromBody] AvatarRequest pictureRequest, HttpContext context, DatabaseContext dbContext) =>
        {
            // Only allow user to access their own account
            var account = (AccountData)context.Items["Account"]!;

            if (!allowedAvatarMimes.TryGetValue(pictureRequest.MimeType, out var fileExtension))
            {
                return Results.BadRequest(new { Message = "Supplied image was not of a valid format" });
            }
            var fileName = account.Id + fileExtension;
            var savePath = Path.Combine(profileImagesDir.FullName, fileName);
            var fileData = Convert.FromBase64String(pictureRequest.Data);
            if (fileData.Length > 25e5)
            {
                return Results.BadRequest(new { Message = "Supplied image can not be more than 2.5MB" });
            }

            if (account.AvatarUrl is not null)
            {
                var previousFile = Path.Combine(profileImagesDir.FullName, account.AvatarUrl.Split("/").Last());
                File.Delete(previousFile);
            }

            await File.WriteAllBytesAsync(savePath, fileData);
            account.AvatarUrl = $"/profiles/avatars/{fileName}";
            await dbContext.SaveChangesAsync();
            return Results.Ok();
        });
        
        // Protect personal endpoints with the auth required middleware to ensure they can not be called otherwise
        authRequiredEndpoints.Add("/accounts/me");
    }
}