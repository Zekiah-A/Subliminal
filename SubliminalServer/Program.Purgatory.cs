using Microsoft.AspNetCore.Mvc;
using SubliminalServer.ApiModel;
using SubliminalServer.DataModel.Account;
using SubliminalServer.DataModel.Purgatory;

namespace SubliminalServer;

public static partial class Program
{
    private static void AddPurgatoryEndpoints()
    {
        httpServer.MapGet("/purgatory/{poemId}/report", (string poemId) =>
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine($"WIP: Report function - Poem {poemId} has been reported, please investigate!");
            Console.ResetColor();
            return Results.Ok();
        });
        // TODO: Reimplement this
        //authRequiredEndpoints.Add("/purgatory/{poemId}/report");
        //rateLimitEndpoints.Add("/purgatory/{poemId}/report", (1, TimeSpan.FromSeconds(5)));
        //sizeLimitEndpoints.Add("/purgatory/{poemId}/report", PayloadSize.FromKilobytes(100));

        httpServer.MapGet("/purgatory/picks", ([FromServices] DatabaseContext database) =>
        {
            var entries = database.PurgatoryEntries
                .Where(entry => entry.Pick == true)
                .Select(entry => entry.Id);
            return Results.Json(entries);
        });
        rateLimitEndpoints.Add("/purgatory/picks", (1, TimeSpan.FromSeconds(2)));

        httpServer.MapGet("/purgatory/after", ([FromQuery(Name = "date")] DateTime date, [FromQuery(Name = "count")] int count, [FromServices] DatabaseContext database) =>
        {
            var poemIds = database.PurgatoryEntries
                .Where(entry => entry.DateCreated > date)
                .Take(Math.Clamp(count, 1, 50))
                .Select(poem => poem.Id);
            return Results.Json(poemIds);
        });
        rateLimitEndpoints.Add("/purgatory/after", (1, TimeSpan.FromSeconds(2)));


        httpServer.MapGet("/purgatory/before", ([FromQuery(Name = "date")] DateTime date, [FromQuery(Name = "count")] int count, [FromServices] DatabaseContext database) =>
        {
            var poemIds = database.PurgatoryEntries
                .Where(entry => entry.DateCreated < date)
                .Take(Math.Clamp(count, 1, 50))
                .Select(poem => poem.Id);
            return Results.Json(poemIds);
        });
        rateLimitEndpoints.Add("/purgatory/before", (1, TimeSpan.FromSeconds(2)));

        // Take into account genres that they have liked, accounts they have blocked, new poems and interactions when reccomending
        httpServer.MapGet("/purgatory/recommended", () =>
        {
            return Results.Problem();
        });
        authRequiredEndpoints.Add("/purgatory/recommended");
        rateLimitEndpoints.Add("/purgatory/recommended", (1, TimeSpan.FromSeconds(5)));

        httpServer.MapPost("/purgatory", ([FromBody] UploadableEntry entryUpload, [FromServices] DatabaseContext database, HttpContext context) =>
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
        authRequiredEndpoints.Add("/purgatory");
        if (!httpServer.Environment.IsDevelopment())
        {
            rateLimitEndpoints.Add("/purgatory", (1, TimeSpan.FromSeconds(60)));
            sizeLimitEndpoints.Add("/purgatory", PayloadSize.FromMegabytes(5));
        }
        
        httpServer.MapPost("/purgatory/{id}/like", ([FromBody] int poemId, HttpContext context) =>
        {
            throw new NotImplementedException();
        });

        httpServer.MapPost("/purgatory/{id}/unlike", ([FromBody] int poemId, HttpContext context) =>
        {
            throw new NotImplementedException();
        });

        httpServer.MapPost("/purgatory/{id}/pin", ([FromBody] int poemId, HttpContext context) =>
        {
            throw new NotImplementedException();
        });

        httpServer.MapPost("/purgatory/{id}/unpin", ([FromBody] int poemId, HttpContext context) =>
        {
            throw new NotImplementedException();
        });

        httpServer.MapPost("/purgatory/{id}/rate", ([FromBody] UploadableRating ratingUpload, HttpContext context) =>
        {
            throw new NotImplementedException();
        });
    }
}