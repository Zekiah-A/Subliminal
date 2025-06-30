using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SubliminalServer.ApiModel;
using SubliminalServer.DataModel.Account;
using SubliminalServer.DataModel.Report;
using SubliminalServer.Middlewares;

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