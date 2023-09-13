using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using SubliminalServer;
using SubliminalServer.DataModel.Account;
using SubliminalServer.DataModel.Api;
using SubliminalServer.DataModel.Purgatory;
using JsonOptions = Microsoft.AspNetCore.Http.Json.JsonOptions;

// EFCore database setup:
// dotnet tool install --global dotnet-ef
// dotnet ef migrations add InitialCreate
// dotnet ef database update
// Prerelease .NET 8 may require "dotnet tool install --global dotnet-ef --prerelease"
// to update from a non-prerelease, do "dotnet tool update --global dotnet-ef --prerelease"

//Webserver configuration
const string base64Alphabet = @"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
var defaultJsonOptions = new JsonSerializerOptions
{
    PropertyNameCaseInsensitive = true,
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    WriteIndented = true,
    IncludeFields = true
};

var dataDir = new DirectoryInfo("Data");
var profileImageDir = new DirectoryInfo(Path.Join(dataDir.FullName, "ProfileImages"));
var soundsDir = new DirectoryInfo(Path.Join(dataDir.FullName, "Sounds"));
var configFile = new FileInfo("config.json");
var dbPath = Path.Join(dataDir.FullName, "subliminal.db");

ServerConfig? config = null;

if (File.Exists(configFile.Name))
{
    var configText = File.ReadAllText(configFile.Name);
    config = JsonSerializer.Deserialize<ServerConfig>(configText);
}

if (config is null)
{
    await using var stream = File.OpenWrite(configFile.Name);
    await JsonSerializer.SerializeAsync(stream, new ServerConfig("", "", 1234, false), new JsonSerializerOptions
    {
        WriteIndented = true,
    });
    await stream.FlushAsync();
	Console.ForegroundColor = ConsoleColor.Green;
	Console.WriteLine("[LOG]: Config created! Please edit {0} and run this program again!", configFile);
	Console.ResetColor();
	Environment.Exit(0);
}

Console.ForegroundColor = ConsoleColor.Yellow;
foreach (var dirPath in new[] { dataDir, profileImageDir,new DirectoryInfo(Path.Join(dataDir.FullName, nameof(PurgatoryEntry))) })
{
    if (!Directory.Exists(dirPath.FullName))
    {
        Directory.CreateDirectory(dirPath.FullName);
        Console.WriteLine($"[WARN] Could not find {dirPath.Name} directory, creating.");

    }
}
Console.ResetColor();

// Helpers
static string HashSha256String(string text)
{
    var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(text));
    return bytes.Aggregate("", (current, b) => current + b.ToString("x2"));
}

// Build web application and configure services
var builder = WebApplication.CreateBuilder(args);

builder.Configuration["Kestrel:Certificates:Default:Path"] = config.Certificate;
builder.Configuration["Kestrel:Certificates:Default:KeyPath"] = config.Key;

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("https://poemanthology.org", "*")
              .WithOrigins("https://zekiah-a.github.io/", "*");
    });
});

builder.Services.Configure<JsonOptions>(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.PropertyNameCaseInsensitive = true;
});

builder.Services.AddDbContext<DatabaseContext>(options =>
{
    options.UseSqlite($"Data Source={dbPath}");
});
builder.Services.AddDatabaseDeveloperPageExceptionFilter();

// Configure middlewares and runtime services, including global authorization middleware that will
// validate accounts for all site endpoints
var httpServer = builder.Build();
httpServer.Urls.Add($"{(config.UseHttps ? "https" : "http")}://*:{config.Port}");

httpServer.UseCors(policy =>
    policy.AllowAnyMethod().AllowAnyHeader().SetIsOriginAllowed(_ => true).AllowCredentials()
);

httpServer.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(profileImageDir.FullName),
    RequestPath = "/ProfileImage"
});

static string GenerateToken()
{
    var tokenBytes = RandomNumberGenerator.GetBytes(32);
    var tokenString = Convert.ToBase64String(tokenBytes)
        + ";" + DateTimeOffset.Now.AddMonths(1).ToUnixTimeSeconds();
    return tokenString;
}

// This is some straightup weirdness to force inject the DB, it seems to work for out current use though
var scope = httpServer.Services.CreateScope();
var serviceProvider = scope.ServiceProvider;
httpServer.UseMiddleware<AuthorizationMiddleware>(serviceProvider.GetRequiredService<DatabaseContext>());

var authRequiredEndpoints = new List<string>();
var rateLimitEndpoints = new Dictionary<string, (int RequestLimit, TimeSpan TimeInterval)>();
var sizeLimitEndpoints = new Dictionary<string, PayloadSize>(); // Should only really be needed on POST endpoints

httpServer.MapGet("/PurgatoryReport/{poemKey}", (string poemKey) =>
{
    Console.ForegroundColor = ConsoleColor.Yellow;
    Console.WriteLine($"WIP: Report function - Poem {poemKey} has been reported, please investigate!");
    Console.ResetColor();
    return Results.Ok();
});
authRequiredEndpoints.Add("/PurgatoryReport");
rateLimitEndpoints.Add("/PurgatoryReport", (1, TimeSpan.FromSeconds(5)));
sizeLimitEndpoints.Add("/PurgatoryReport", PayloadSize.FromKilobytes(100));

httpServer.MapGet("/PurgatoryPicks", ([FromServices] DatabaseContext database) =>
{
    var records = database.PurgatoryEntries.Where(entry => entry.Pick == true);
    return Results.Json(records);
});
rateLimitEndpoints.Add("/PurgatoryPicks", (1, TimeSpan.FromSeconds(2)));

httpServer.MapGet("/PurgatoryAfter", ([FromBody] PurgatoryBeforeAfter since, [FromServices] DatabaseContext database) =>
{
    return Results.Problem();
});
rateLimitEndpoints.Add("/PurgatoryAfter", (1, TimeSpan.FromSeconds(2)));


httpServer.MapGet("/PurgatoryBefore", ([FromBody] PurgatoryBeforeAfter before, [FromServices] DatabaseContext database) =>
{
    return Results.Problem();
});
rateLimitEndpoints.Add("/PurgatoryBefore", (1, TimeSpan.FromSeconds(2)));


httpServer.MapGet("/PurgatoryRecommended", () =>
{
    return Results.Problem();
});
authRequiredEndpoints.Add("/PurgatoryRecommended");
rateLimitEndpoints.Add("/PurgatoryRecommended", (1, TimeSpan.FromSeconds(5)));

httpServer.MapPost("/PurgatoryUpload", ([FromBody] UploadableEntry entryUpload, [FromServices] DatabaseContext database, HttpContext context) =>
{
    var entry = (PurgatoryEntry) entryUpload;
    entry.Approves = 0;
    entry.Vetoes = 0;
    entry.DateCreated = DateTime.Now;
    entry.Pick = false;

    for (var i = 0; i < Math.Min(5, entryUpload.UploadTags.Count); i++)
    {
        var tag = entryUpload.UploadTags[i];

        if (!PermissibleTagRegex().IsMatch(tag))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>()
                { { nameof(UploadableEntry.UploadTags), new[] { "Invalid tag supplied", i.ToString() } }});
        }
        
        entry.Tags.Add(new PurgatoryTag()
        {
            TagName = tag
        });
    }

    var account = (AccountData) context.Items["Account"]!;
    entry.Author = account;
    
    database.PurgatoryEntries.Add(entry);
    database.SaveChanges();

    return Results.Ok(entry.EntryKey);
});
authRequiredEndpoints.Add("/PurgatoryUpload");
rateLimitEndpoints.Add("/PurgatoryUpload", (1, TimeSpan.FromSeconds(60)));
sizeLimitEndpoints.Add("/PurgatoryUpload", PayloadSize.FromMegabytes(5));

//Creates a new account with a provided pen name, and then gives the client the credentials for their created account
httpServer.MapPost("/Signup", ([FromBody] LoginDetails details, [FromServices] DatabaseContext database, HttpContext context) =>
{
    if (!PermissibleUsernameRegex().IsMatch(details.Username))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>()
            { { nameof(LoginDetails.Username), new[] { "Invalid username supplied", details.Username } } });
    }
    
    // TODO: Email validation, this will all be moved elsewhere
    var account = new AccountData();
    var tokenString = GenerateToken();
    account.Token = tokenString;
    account.Username = details.Username;
    account.Email = details.Email;

    // Rate limit middleware should have passed us a nicely sanitised IP. Otherwise we will just fallback
    var requestIp = context.Items["RealIp"] as string ?? context.Connection.RemoteIpAddress?.ToString();
    if (requestIp is null)
    {
        return Results.Forbid();
    }
    account.KnownIPs.Add(new AccountIp()
    {
        Address = requestIp
    });

    database.Accounts.Add(account);

    context.Response.Cookies.Append("Token", tokenString, new CookieOptions()
    {
        HttpOnly = true,
        SameSite = SameSiteMode.Strict,
        Expires = DateTimeOffset.Now.AddMonths(1)
    });
    // If for some reason they can not persist the cookie, we also send them the token so that they may save it somwehere
    // secure on certain platforms, such as a third party non-web client.
    return Results.Text(account.Token);
});
rateLimitEndpoints.Add("/Signup", (1, TimeSpan.FromSeconds(60)));
sizeLimitEndpoints.Add("/Signup", PayloadSize.FromKilobytes(5));

// Allows a user to signin and receive account data
httpServer.MapPost("/SigninToken", ([FromBody] string? token, [FromServices] DatabaseContext database, HttpContext context) =>
{
    if (string.IsNullOrEmpty(token))
    {
        var cookieToken = context.Request.Cookies["Token"];
        if (string.IsNullOrEmpty(cookieToken))
        {
            return Results.Unauthorized();
        }

        token = cookieToken;
    }

    // Completely invalid token - Reject
    var expiryString = token.Split(";").Last();
    if (!long.TryParse(expiryString, out var expiry))
    {
        return Results.Unauthorized();
    }

    // Expired token - Reject
    if (expiry < DateTimeOffset.Now.ToUnixTimeSeconds())
    {
        return Results.Unauthorized();
    }

    // No account associated with token - Reject
    var account = database.Accounts.SingleOrDefault(data => data.Token == token);
    if (account is null)
    {
        return Results.NotFound();
    }

    // Rate limit middleware should have passed us a nicely sanitised IP. Otherwise we will just fallback
    var requestIp = context.Items["RealIp"] as string ?? context.Connection.RemoteIpAddress?.ToString();
    if (requestIp is null)
    {
        return Results.Forbid();
    }
    account.KnownIPs.Add(new AccountIp()
    {
        Address = requestIp
    });
    database.SaveChanges();

    return Results.Json(account);
});
rateLimitEndpoints.Add("/SigninToken", (1, TimeSpan.FromSeconds(1)));
sizeLimitEndpoints.Add("/SigninToken", PayloadSize.FromKilobytes(5));

httpServer.MapPost("/Signin", ([FromBody] LoginDetails details, [FromServices] DatabaseContext database, HttpContext context) =>
{
    var account = database.Accounts.SingleOrDefault(account =>
        account.Username == details.Username && account.Email == details.Email);
    if (account is null)
    {
        return Results.NotFound();
    }

    // If the current account token is expired, we will generate a new one,
    // we will also give them the token cookie regardless
    var expiryString = account.Token.Split(";").Last();
    if (long.Parse(expiryString) < DateTimeOffset.Now.ToUnixTimeSeconds())
    {
        var tokenString = GenerateToken();
        account.Token = tokenString;
        database.SaveChanges();
    }

    // Rate limit middleware should have passed us a nicely sanitised IP. Otherwise we will just fallback
    var requestIp = context.Items["RealIp"] as string ?? context.Connection.RemoteIpAddress?.ToString();
    if (requestIp is null)
    {
        return Results.Forbid();
    }
    account.KnownIPs.Add(new AccountIp()
    {
        Address = requestIp
    });
    database.SaveChanges();

    context.Response.Cookies.Append("Token", account.Token, new CookieOptions()
    {
        HttpOnly = true,
        SameSite = SameSiteMode.Strict,
        Expires = DateTimeOffset.Now.AddMonths(1)
    });

    return Results.Json(account);
});
rateLimitEndpoints.Add("/Signin", (1, TimeSpan.FromSeconds(1)));
sizeLimitEndpoints.Add("/Signin", PayloadSize.FromKilobytes(5));

//Get public facing data for an account, will accept either a username or an account key
httpServer.MapGet("/Profiles/{profileIdentifier}", (string profileIdentifier, [FromServices] DatabaseContext database) =>
{
    var account = database.Accounts.SingleOrDefault(account =>
        account.AccountKey == profileIdentifier || account.Username == profileIdentifier);
    
    // Downcast so they we only expose the account profile
    return account is AccountProfile profile
        ? Results.Json(profile)
        : Results.NotFound();
});
rateLimitEndpoints.Add("/Signin", (1, TimeSpan.FromSeconds(1)));

/*
httpServer.MapPost("/ExecuteAccountAction", (AccountAction action, HttpContext context) =>
{
     switch (action.ActionType)
    {
        case AccountActionType.BlockUser:
        {
            if (action.Value is not string userGuid) goto default;
            if (!Account.GuidIsValid(userGuid)) goto default;
            var targetUser = await Account.GetAccountData(userGuid);
            
            if (account.Blocked.Contains(targetUser.Guid)) goto default;
            account.Blocked.Add(targetUser.Guid);
            break;
        }
        case AccountActionType.UnblockUser:
        {
            if (action.Value is not string userGuid) goto default;
            var targetUser = await Account.GetAccountData(userGuid);

            if (!account.Blocked.Contains(targetUser.Guid)) goto default;
            account.Blocked.Remove(targetUser.Guid);
            break;
        }
        case AccountActionType.FollowUser:
        {
            if (action.Value is not string userGuid) goto default;
            if (!Account.GuidIsValid(userGuid)) goto default;
            var targetUser = await Account.GetAccountData(userGuid);

            account.FollowUser(ref targetUser);
            await Account.SaveAccountData(targetUser);
            break;
        }
        case AccountActionType.Report:
        {
            
            break;
        }
        case AccountActionType.UnfollowUser:
        {
            // TODO: Reimplement
            await database.UpdateRecord(account);
            break;
        }
        case AccountActionType.LikePoem:
        {
            if (action.Value is not string poemGuid) goto default;
            var poem = await database.GetRecord<PurgatoryEntry>(poemGuid);
            if (poem is not null)
            {
                profile.Data.PinnedPoems.Add(poem.MasterKey);
            }
            
            await database.UpdateRecord(account);
            break;
        }
        case AccountActionType.UnlikePoem:
        {
            if (action.Value is not string poemKey) goto default;
            var keyReference = account.Data.LikedPoems.FirstOrDefault(keyReference => keyReference.Equals(poemKey));

            if (keyReference is not null)
            {
                account.Data.LikedPoems.Remove(keyReference);
            }
            
            await database.UpdateRecord(account);
            break;
        }
        case AccountActionType.PinPoem:
        {
            if (action.Value is not string poemGuid) goto default;
            var poem = await database.GetRecord<PurgatoryEntry>(poemGuid);
            if (poem is not null)
            {
                profile.Data.PinnedPoems.Add(poem.MasterKey);
            }
            
            await database.UpdateRecord(profile);
            break;
        }
        case AccountActionType.UnpinPoem:
        {
            if (action.Value is not string poemKey) goto default;
            var keyReference = account.Data.LikedPoems.FirstOrDefault(keyReference => keyReference.Equals(poemKey));

            if (keyReference is not null)
            {
                profile.Data.PinnedPoems.Remove(keyReference);
            }
            
            await database.UpdateRecord(profile);
            break;
        }
        case AccountActionType.UpdateEmail:
        {
            if (action.Value is not string email) goto default;
            // TODO: Email verification
            account.Data.Email = email;
            await database.UpdateRecord(account);
            break;
        }
        case AccountActionType.UpdatePenName:
        {
            if (action.Value is not string penName) goto default;
            profile.Data.PenName = penName.Length <= 16 ? penName : penName[..16];
            await database.UpdateRecord(profile);
            break;
        }
        case AccountActionType.UpdateBiography:
        {
            if (action.Value is not string biography) goto default;
            profile.Data.Biography = biography.Length <= 360 ? biography : biography[..360];
            await database.UpdateRecord(profile);
            break;
        }
        case AccountActionType.UpdateLocation:
        {
            if (action.Value is not string location) goto default;
            profile.Data.Location = location.Length <= 16 ? location : location[..16];
            await database.UpdateRecord(profile);
            break;
        }
        case AccountActionType.UpdateRole:
        {
            if (action.Value is not string role) goto default;
            profile.Data.Role = role.Length <= 16 ? role : role[..16];
            await database.UpdateRecord(profile);
            break;
        }
        case AccountActionType.UpdateAvatar:
        {
            if (action.Value is not string avatarUrl) goto default;

            var permitted = new[]
            {
                "image/gif",
                "image/png",
                "image/webp",
                "image/jpg"
            };

            // If the data is base64, then we send then we will host their profile image on our CDN to their profile
            if (permitted.Any(mimeType => avatarUrl.StartsWith("data:" + mimeType)))
            {
                if (avatarUrl.Length > 10_000_000)
                {
                    break;
                }

                var imagePath = Path.Join(profileImageDir.Name, profile.MasterKey);
                await File.WriteAllTextAsync(imagePath, avatarUrl);
                profile.Data.AvatarUrl = Path.Combine(context.Request.PathBase, imagePath);
            }
            else
            {
                var simplifiedUrl = avatarUrl
                    [..(avatarUrl.Length <= 256 ? avatarUrl.Length : 256)] //Trim URL length to a maximum reasonable value
                    [..(!avatarUrl.Contains('?') ? avatarUrl.Length : avatarUrl.IndexOf("?", StringComparison.Ordinal))] //Remove all URL queries
                    .Replace("http://", "https://"); //Use HTTPS if url contains a HTTP link

                profile.Data.AvatarUrl = simplifiedUrl;
            }

            await database.UpdateRecord(profile);
            break;
        }
        case AccountActionType.RatePoem:
        {
            if (action.Value is not PurgatoryRating rating) goto default;

            var entry = await database.GetRecord<PurgatoryEntry>(rating.PoemKey);
		    if (entry is null)
		    {
		        return Results.NotFound();
		    }

		    entry.Data.Approves = rating.Type switch
		    {
		        PurgatoryRatingType.Approve => entry.Data.Approves + 1,
		        PurgatoryRatingType.UndoApprove => entry.Data.Approves - 1,
		        _ => entry.Data.Approves
		    };

		    entry.Data.Vetoes = rating.Type switch
		    {
		        PurgatoryRatingType.Veto => entry.Data.Vetoes + 1,
		        PurgatoryRatingType.UndoVeto => entry.Data.Vetoes - 1,
		        _ => entry.Data.Vetoes
		    };

            database.SaveChanges();
		    await database.UpdateRecord(entry);
            break;
        }
        // TODO: Implement purgatory drafts here
        default:
        {
            return Results.Problem("Specified account action failed, had an invalid value type, or did not exist." +
                JsonSerializer.Serialize(action));
        }
    }
    
    return Results.Ok();
});
authRequiredEndpoints.Add("/ExecuteAccountAction");
rateLimitEndpoints.Add("/ExecuteAccountAction", (1, TimeSpan.FromMilliseconds(100)));
sizeLimitEndpoints.Add("/Signin", PayloadSize.FromMegabytes(10)); // TODO: Separate out account actions so each can have their own
*/

// Endpoints that enforce Account/IP rate limiting
foreach (var endpointArgsPair in rateLimitEndpoints)
{
    httpServer.UseWhen
    (
        context => context.Request.Path.StartsWithSegments(endpointArgsPair.Key),
        appBuilder =>
        {
            appBuilder.UseMiddleware<RateLimitMiddleware>(endpointArgsPair.Value.RequestLimit, endpointArgsPair.Value.TimeInterval);
        }
    );
}

foreach (var endpointArgsPair in sizeLimitEndpoints)
{
    httpServer.UseWhen
    (
        context => context.Request.Path.StartsWithSegments(endpointArgsPair.Key),
        appBuilder =>
        {
            appBuilder.UseMiddleware<RequestSizeLimitMiddleware>(endpointArgsPair.Value.AsLong());
        }
    );
}

// Endpoints that require an account to access
foreach (var endpoint in authRequiredEndpoints)
{
    httpServer.UseWhen
    (
        context => context.Request.Path.StartsWithSegments(endpoint),
        appBuilder =>
        {
            appBuilder.UseMiddleware<EnsureAuthorizationMiddleware>();
        }
    );
}

await httpServer.RunAsync();

internal partial class Program
{
    [GeneratedRegex("^[a-z][a-z0-9_-]{0,23}$")]
    private static partial Regex PermissibleTagRegex();
    
    [GeneratedRegex("^[a-z][a-z0-9_.]{0,16}$")]
    private static partial Regex PermissibleUsernameRegex();
    
}