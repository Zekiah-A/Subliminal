using Microsoft.AspNetCore.Mvc;
using SubliminalServer.ApiModel;

namespace SubliminalServer;

public static partial class Program 
{
    private static void AddProfileEndpoints()
    {
        // Get public facing data for an account, will accept either a username or an account key
        httpServer.MapGet("/profiles/{profileIdentifier}", (string profileIdentifier, [FromServices] DatabaseContext database) =>
        {
            var account = int.TryParse(profileIdentifier, out var profileId)
                ? database.Accounts.SingleOrDefault(account => account.Id == profileId)
                : database.Accounts.SingleOrDefault(account => account.Username == profileIdentifier);
            if (account is null)
            {
                return Results.NotFound();
            }

            var profile = new UploadableProfile(account);
            return Results.Json(profile);
        });
        rateLimitEndpoints.Add("/Profiles", (1, TimeSpan.FromMilliseconds(500)));
    }
}