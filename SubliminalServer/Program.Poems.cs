using Microsoft.AspNetCore.Mvc;
using SubliminalServer.ApiModel;
using SubliminalServer.DataModel.Account;
using SubliminalServer.DataModel.Purgatory;

namespace SubliminalServer;

internal static partial class Program
{
    private static void AddPoemEndpoints()
    {
        httpServer.MapGet("/poems/{poemId:int}", async (int poemId, DatabaseContext dbContext) =>
        {
            var poem = await dbContext.PurgatoryEntries.FindAsync(poemId);
            if (poem is null)
            {
                return Results.NotFound();
            }

            return Results.Ok(poem);
        });

        httpServer.MapPost("/poems", ([FromBody] UploadableEntry entryUpload, [FromServices] DatabaseContext database, HttpContext context) =>
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
        authRequiredEndpoints.Add("/poems");
        if (!httpServer.Environment.IsDevelopment())
        {
            rateLimitEndpoints.Add("/poems", (1, TimeSpan.FromSeconds(60)));
            sizeLimitEndpoints.Add("/poems", PayloadSize.FromMegabytes(5));
        }
    }
}