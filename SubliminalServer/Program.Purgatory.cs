using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SubliminalServer.ApiModel;
using SubliminalServer.DataModel.Account;
using SubliminalServer.DataModel.Purgatory;
using SubliminalServer.DataModel.Report;

namespace SubliminalServer;

internal static partial class Program
{
    // /accounts/{id:int}
    [GeneratedRegex(@"^\/purgatory\/\d+\/report\/*$")]
    private static partial Regex PurgatoryReportEndpointRegex();
    [GeneratedRegex(@"^\/purgatory\/\d+\/report\/*$")]
    private static partial Regex PurgatoryEndpointRegex();

    
    private static void AddPurgatoryEndpoints()
    {
        httpServer.MapGet("/purgatory/{poemId:int}", async (int poemId, DatabaseContext dbContext) =>
        {
            var poem = await dbContext.PurgatoryEntries.FindAsync(poemId);
            if (poem is null)
            {
                return Results.NotFound();
            }

            return Results.Ok(poem);
        });


        httpServer.MapPost("/purgatory/upload", ([FromBody] UploadableEntry entryUpload, [FromServices] DatabaseContext database, HttpContext context) =>
        {
            var validationIssues = new Dictionary<string, string[]>();
            var tags = new List<PurgatoryTag>();

            if (entryUpload.Summary?.Length > 300)
            {
                validationIssues.Add(nameof(entryUpload.Summary), ValidationFails.SummaryTooLong);
            }
            if (entryUpload.PoemName.Length > 32)
            {
                validationIssues.Add(nameof(entryUpload.PoemName), ValidationFails.PoemNameTooLong);
            }
            // TODO: For very long poems, loading it all as a string will rail the database and server memory.
            // TODO: Consider moving long poems such as this to have their content handled as a blob or streamed as a separate file. 
            if (entryUpload.PoemContent.Length > 100_000)
            {
                validationIssues.Add(nameof(entryUpload.PoemContent), ValidationFails.PoemContentTooLong);
            }
            for (var i = 0; i < Math.Min(5, entryUpload.PoemTags.Count); i++)
            {
                var tag = entryUpload.PoemTags[i];

                if (!PermissibleTagRegex().IsMatch(tag))
                {
                    validationIssues.Add(nameof(UploadableEntry.PoemTags), ValidationFails.InvalidTagProvided);
                }
                
                tags.Add(new PurgatoryTag()
                {
                    TagName = tag
                });
            }
            if (validationIssues.Count > 0)
            {
                return Results.ValidationProblem(validationIssues);
            }
            
            var amendsKey = database.PurgatoryEntries
                .Where(entry => entry.Id == entryUpload.Amends)
                .Select(entry => entry.Id)
                .SingleOrDefault();
            var editsKey = database.PurgatoryEntries
                .Where(entry => entry.Id == entryUpload.Edits)
                .Select(entry => entry.Id)
                .SingleOrDefault();

            var entry = new PurgatoryEntry
            {
                Summary = entryUpload.Summary,
                ContentWarning = entryUpload.ContentWarning,
                PageStyle = entryUpload.PageStyle,
                PageBackgroundUrl = null, // TODO: Handle later, might need form/multipart
                Tags = tags,
                PoemName = entryUpload.PoemName,
                PoemContent = entryUpload.PoemContent,
                AuthorId = ((AccountData) context.Items["Account"]!).Id,
                AmendsId = amendsKey,
                EditsId = editsKey,
                Approves = 0,
                Vetoes = 0,
                DateCreated = DateTime.UtcNow,
                Pick = false
            };
            
            database.PurgatoryEntries.Add(entry);
            database.SaveChanges();

            return Results.Ok(entry.Id);
        });
        authRequiredEndpoints.Add("/purgatory/upload");
        if (!httpServer.Environment.IsDevelopment())
        {
            rateLimitEndpoints.Add("/purgatory", (1, TimeSpan.FromSeconds(60)));
            sizeLimitEndpoints.Add("/purgatory", PayloadSize.FromMegabytes(5));
        }

        httpServer.MapGet("/purgatory/picks", async ([FromServices] DatabaseContext database) =>
        {
            var entriesQuery = database.PurgatoryEntries
                .Where(entry => entry.Pick == true)
                .Select(entry => entry.Id);
            var entries = await entriesQuery.ToListAsync();
            return Results.Ok(entries);
        });
        rateLimitEndpoints.Add("/purgatory/picks", (1, TimeSpan.FromSeconds(2)));

        httpServer.MapGet("/purgatory/after", ([FromQuery(Name = "date")] DateTime date, [FromQuery(Name = "count")] int count, [FromServices] DatabaseContext database) =>
        {
            var poemIds = database.PurgatoryEntries
                .Where(entry => entry.DateCreated > date)
                .Take(Math.Clamp(count, 1, 50))
                .Select(poem => poem.Id);
            return Results.Ok(poemIds);
        });
        rateLimitEndpoints.Add("/purgatory/after", (1, TimeSpan.FromSeconds(2)));


        httpServer.MapGet("/purgatory/before", ([FromQuery(Name = "date")] DateTime date, [FromQuery(Name = "count")] int count, [FromServices] DatabaseContext database) =>
        {
            var poemIds = database.PurgatoryEntries
                .Where(entry => entry.DateCreated < date)
                .Take(Math.Clamp(count, 1, 50))
                .Select(poem => poem.Id);
            return Results.Ok(poemIds);
        });
        rateLimitEndpoints.Add("/purgatory/before", (1, TimeSpan.FromSeconds(2)));

        // Take into account genres that they have liked, accounts they have blocked, new poems and interactions when reccomending
        httpServer.MapGet("/purgatory/recommended", () =>
        {
            return Results.Problem();
        });
        authRequiredEndpoints.Add("/purgatory/recommended");
        rateLimitEndpoints.Add("/purgatory/recommended", (1, TimeSpan.FromSeconds(5)));

        httpServer.MapPost("/purgatory/{poemId:int}/like", async (int poemId, HttpContext context, DatabaseContext dbContext) =>
        {
            var account = (AccountData)context.Items["Account"]!;

            var poem = await dbContext.PurgatoryEntries.FindAsync(poemId);
            if (poem is null)
            {
                return Results.NotFound();
            }

            if (!account.LikedPoems.Contains(poem))
            {
                account.LikedPoems.Add(poem);
                await dbContext.SaveChangesAsync();
            }

            return Results.Ok();
        });

        httpServer.MapPost("/purgatory/{poemId:int}/unlike", async (int poemId, HttpContext context, DatabaseContext dbContext) =>
        {
            var account = (AccountData)context.Items["Account"]!;

            var poem = await dbContext.PurgatoryEntries.FindAsync(poemId);
            if (poem is null)
            {
                return Results.NotFound();
            }

            if (account.LikedPoems.Contains(poem))
            {
                account.LikedPoems.Remove(poem);
                await dbContext.SaveChangesAsync();
            }

            return Results.Ok();
        });

        httpServer.MapPost("/purgatory/{poemId:int}/pin", async (int poemId, HttpContext context, DatabaseContext dbContext) =>
        {
            var account = (AccountData)context.Items["Account"]!;

            var poem = await dbContext.PurgatoryEntries.FindAsync(poemId);
            if (poem is null)
            {
                return Results.NotFound();
            }

            if (!account.PinnedPoems.Contains(poem))
            {
                account.PinnedPoems.Add(poem);
                await dbContext.SaveChangesAsync();
            }

            return Results.Ok();
        });

        httpServer.MapPost("/purgatory/{poemId:int}/unpin", async (int poemId, HttpContext context, DatabaseContext dbContext) =>
        {
            var account = (AccountData)context.Items["Account"]!;

            var poem = await dbContext.PurgatoryEntries.FindAsync(poemId);
            if (poem is null)
            {
                return Results.NotFound();
            }

            if (account.PinnedPoems.Contains(poem))
            {
                account.PinnedPoems.Remove(poem);
                await dbContext.SaveChangesAsync();
            }

            return Results.Ok();
        });

        httpServer.MapPost("/purgatory/{poemId:int}/rate", async (int poemId, [FromBody] UploadableRating ratingUpload, HttpContext context, DatabaseContext dbContext) =>
        {
            throw new NotImplementedException();
        });

        httpServer.MapPost("/purgatory/{poemId:int}/report", async (int poemId, DatabaseContext dbContext) =>
        {
            throw new NotImplementedException();

            var poem = await dbContext.PurgatoryEntries.FindAsync(poemId);
            if (poem is null)
            {
                return Results.NotFound();
            }

            var report = new PurgatoryReport
            {
                PoemId = poemId,
                Poem = poem,
                // Add any other necessary report details
            };

            dbContext.PurgatoryReports.Add(report);
            await dbContext.SaveChangesAsync();

            return Results.Ok();
        }).UseMiddleware<EnsuredAuthorizationMiddleware>(httpServer, PurgatoryReportEndpointRegex);
        if (!httpServer.Environment.IsDevelopment())
        {
            httpServer.UseWhen
            (
                context => PurgatoryReportEndpointRegex().IsMatch(context.Request.Path),
                appBuilder => appBuilder.UseMiddleware<RateLimitMiddleware>(1, TimeSpan.FromSeconds(5))
            );
        }
    }
}