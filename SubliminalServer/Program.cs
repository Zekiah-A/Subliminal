using System.Globalization;
using System.Net.Mime;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using SubliminalServer;
using SubliminalServer.AccountActions;
using SubliminalServer.DataModel.Account;
using SubliminalServer.DataModel.Purgatory;
using JsonOptions = Microsoft.AspNetCore.Http.Json.JsonOptions;

// EFCore database setup:
// dotnet tool install --global dotnet-ef
// dotnet add package Microsoft.EntityFrameworkCore.Design
// dotnet ef migrations add InitialCreate
// dotnet ef database update

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

//var database = new DatabaseContext(dbPath);
ServerConfig? config = null;

if (File.Exists(configFile.Name))
{
    config = await JsonSerializer.DeserializeAsync<ServerConfig>(File.OpenRead(configFile.Name));
}

if (config is null)
{
    await using var stream = File.OpenWrite(configFile.Name);
    await JsonSerializer.SerializeAsync(stream, new ServerConfig("", "", 1234, false), new JsonSerializerOptions()
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

builder.Services.AddScoped<DatabaseContext>(options =>
{
    var optionsBuilder = new DbContextOptionsBuilder<DatabaseContext>();
    optionsBuilder.UseSqlite($"Data Source={dbPath}");
    
    return new DatabaseContext(optionsBuilder.Options);
});

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

httpServer.UseMiddleware<AuthorizationMiddleware>();

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

httpServer.MapGet("/PurgatoryPicks", (HttpContext context) =>
{
    using var scope = httpServer.Services.CreateScope();
    var serviceProvider = scope.ServiceProvider;
    var database = serviceProvider.GetRequiredService<DatabaseContext>();
        
    var records = database.PurgatoryEntries.Where(entry => entry.Pick == true);
    return Results.Json(records);
});
rateLimitEndpoints.Add("/PurgatoryPicks", (1, TimeSpan.FromSeconds(2)));

httpServer.MapGet("/PurgatoryAfter", (PurgatoryBeforeAfter since) =>
{
    
});
rateLimitEndpoints.Add("/PurgatoryAfter", (1, TimeSpan.FromSeconds(2)));


httpServer.MapGet("/PurgatoryBefore", (PurgatoryBeforeAfter before) =>
{
    
});
rateLimitEndpoints.Add("/PurgatoryBefore", (1, TimeSpan.FromSeconds(2)));


httpServer.MapGet("/PurgatoryRecommended", () =>
    Directory.GetFiles(Path.Join(dataDir.FullName, nameof(PurgatoryEntry)))
        .Select(file => new FileInfo(file))
        .Reverse()
        .Select(file => file.Name)
        .ToArray()
);
authRequiredEndpoints.Add("/PurgatoryRecommended");
rateLimitEndpoints.Add("/PurgatoryRecommended", (1, TimeSpan.FromSeconds(5)));
/*
httpServer.MapPost("/PurgatoryUpload", async (PurgatoryEntry entry, HttpContext context) =>
{
    entry.Approves = 0;
    entry.Vetoes = 0;
    entry.DateCreated = DateTime.Now;
    entry.Pick = false;

    var account = (AccountData) context.Items["Account"]!;
    
    
    database.PurgatoryEntries.Add(entry);
    
    var profile = (await database.GetRecord<AccountProfile>(account.Data.ProfileKey))!;
    profile.Data.Poems.Add(poem);
    
    await database.UpdateRecord(profile);

    return Results.Ok();
});
authRequiredEndpoints.Add("/PurgatoryUpload");
rateLimitEndpoints.Add("/PurgatoryUpload", (1, TimeSpan.FromSeconds(60)));
sizeLimitEndpoints.Add("/PurgatoryUpload", PayloadSize.FromMegabytes(1));

//Creates a new account with a provided pen name, and then gives the client the credentials for their created account
httpServer.MapPost("/Signup", async ([FromBody] string penName) =>
{
    // Generate secret account code (password)
    var code = "";
    for (var i = 0; i < 10; i++)
    {
        code += base64Alphabet[random.Next(0, 63)];
    }
    
    var profileKey = await database.CreateRecord(new AccountProfile(penName, DateTime.Now.ToString(CultureInfo.InvariantCulture)));
    await database.CreateRecord(new AccountData(HashSha256String(code), profileKey));

    var credentials = new { Code = code, Guid = profileKey };
    return Results.Json(credentials);
});
rateLimitEndpoints.Add("/Signup", (1, TimeSpan.FromSeconds(60)));
sizeLimitEndpoints.Add("/PurgatoryUpload", PayloadSize.FromKilobytes(100));

// Allows a user to signin and receive account data
httpServer.MapPost("/Signin/{token}", async ([FromBody] string signinCode, HttpContext context) =>
{
    
});
httpServer.MapPost("/Signin/{name}:{email}", async (string name, string email, HttpContext context) =>
{
    var account = database.Accounts.First(account => account.Username == name && account.Email == email);
    var account = (await database.FindRecords<AccountData, string>("Code", signinCode)).FirstOrDefault();
    return account is null ? Results.Unauthorized() : Results.Json(account.Data);
});
rateLimitEndpoints.Add("/Signin", (1, TimeSpan.FromSeconds(1)));
sizeLimitEndpoints.Add("/Signin", PayloadSize.FromKilobytes(100));

//Get public facing data for an account
httpServer.MapGet("/AccountProfile/{profileKey}", async (string profileKey) =>
{
    var profile = await database.GetRecord<AccountProfile>(profileKey);
    return profile is null ? Results.NotFound() : Results.Json(profile);
});
rateLimitEndpoints.Add("/Signin", (1, TimeSpan.FromSeconds(1)));

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
    httpServer.MapWhen
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
    httpServer.MapWhen
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
    httpServer.MapWhen
    (
        context => context.Request.Path.StartsWithSegments(endpoint),
        appBuilder =>
        {
            appBuilder.UseMiddleware<EnsureAuthorizationMiddleware>();
        }
    );
}

await httpServer.RunAsync();
