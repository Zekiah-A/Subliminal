using Microsoft.AspNetCore.Mvc;
using SubliminalServer.ApiModel;

namespace SubliminalServer;

internal static partial class Program 
{
    private static void AddProfileEndpoints()
    {
        // Get public facing data for an account, will accept either a username or an account key
        httpServer.MapGet("/profiles/{identifier}", (string identifier, [FromServices] DatabaseContext database) =>
        {
            var account = int.TryParse(identifier, out var profileId)
                ? database.Accounts.SingleOrDefault(account => account.Id == profileId)
                : database.Accounts.SingleOrDefault(account => account.Username == identifier);
            if (account is null)
            {
                return Results.NotFound();
            }

            var profile = new UploadableProfile(account);
            return Results.Ok(profile);
        });
    }
}