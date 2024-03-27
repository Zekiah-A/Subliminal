using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using SubliminalServer;
using SubliminalServer.DataModel.Account;
using SubliminalServer.DataModel.Api;
using SubliminalServer.DataModel.Purgatory;
using SubliminalServer.DataModel.Report;
using JsonOptions = Microsoft.AspNetCore.Http.Json.JsonOptions;

// EFCore database setup:
// dotnet ef migrations add InitialCreate
// dotnet ef database update
// Prerelease .NET 9 may require "dotnet tool install --global dotnet-ef --prerelease"
// to update from a non-prerelease, do "dotnet tool update --global dotnet-ef --prerelease"

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
foreach (var dirPath in new[] { dataDir, profileImageDir })
{
    if (!Directory.Exists(dirPath.FullName))
    {
        Directory.CreateDirectory(dirPath.FullName);
        Console.WriteLine($"[WARN] Could not find {dirPath.Name} directory, creating.");
    }
}
Console.ResetColor();

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

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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

if (httpServer.Environment.IsDevelopment())
{
    httpServer.UseSwagger();
    httpServer.UseSwaggerUI();
}

static string GenerateToken()
{
    var tokenBytes = RandomNumberGenerator.GetBytes(32);
    var tokenString = Convert.ToBase64String(tokenBytes)
        + ";" + DateTimeOffset.UtcNow.AddMonths(1).ToUnixTimeSeconds();
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
    var entries = database.PurgatoryEntries
        .Where(entry => entry.Pick == true)
        .Select(entry => entry.EntryKey);
    return Results.Json(entries);
});
rateLimitEndpoints.Add("/PurgatoryPicks", (1, TimeSpan.FromSeconds(2)));

httpServer.MapGet("/PurgatoryAfter", ([FromBody] PurgatoryBeforeAfter since, [FromServices] DatabaseContext database) =>
{
    var poemKeys = database.PurgatoryEntries
        .Where(entry => entry.DateCreated > since.Date)
        .Take(Math.Clamp(since.Count, 1, 50))
        .Select(poem => poem.EntryKey);
    return Results.Json(poemKeys);
});
rateLimitEndpoints.Add("/PurgatoryAfter", (1, TimeSpan.FromSeconds(2)));


httpServer.MapGet("/PurgatoryBefore", ([FromBody] PurgatoryBeforeAfter before, [FromServices] DatabaseContext database) =>
{
    var poemKeys = database.PurgatoryEntries
        .Where(entry => entry.DateCreated < before.Date)
        .Take(Math.Clamp(before.Count, 1, 50))
        .Select(poem => poem.EntryKey);
    return Results.Json(poemKeys);
});
rateLimitEndpoints.Add("/PurgatoryBefore", (1, TimeSpan.FromSeconds(2)));

// Take into account genres that they have liked, accounts they have blocked, new poems and interactions when reccomending
httpServer.MapGet("/PurgatoryRecommended", () =>
{
    return Results.Problem();
});
authRequiredEndpoints.Add("/PurgatoryRecommended");
rateLimitEndpoints.Add("/PurgatoryRecommended", (1, TimeSpan.FromSeconds(5)));

httpServer.MapPost("/PurgatoryUpload", ([FromBody] UploadableEntry entryUpload, [FromServices] DatabaseContext database, HttpContext context) =>
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
        .Where(entry => entry.EntryKey == entryUpload.Amends)
        .Select(entry => entry.EntryKey)
        .SingleOrDefault();
    var editsKey = database.PurgatoryEntries
        .Where(entry => entry.EntryKey == entryUpload.Edits)
        .Select(entry => entry.EntryKey)
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
        AuthorKey = ((AccountData) context.Items["Account"]!).AccountKey,
        AmendsKey = amendsKey,
        EditsKey = editsKey,
        Approves = 0,
        Vetoes = 0,
        DateCreated = DateTime.UtcNow,
        Pick = false
    };
    
    database.PurgatoryEntries.Add(entry);
    database.SaveChanges();

    return Results.Ok(entry.EntryKey);
});
authRequiredEndpoints.Add("/PurgatoryUpload");
//rateLimitEndpoints.Add("/PurgatoryUpload", (1, TimeSpan.FromSeconds(60)));
sizeLimitEndpoints.Add("/PurgatoryUpload", PayloadSize.FromMegabytes(5));

//Creates a new account with a provided pen name, and then gives the client the credentials for their created account
httpServer.MapPost("/Signup", static ([FromBody] LoginDetails details, [FromServices] DatabaseContext database, HttpContext context) =>
{
    if (!PermissibleUsernameRegex().IsMatch(details.Username))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>()
            { { nameof(LoginDetails.Username), ValidationFails.InvalidUsername } });
    }

    var existingAccount = database.Accounts.SingleOrDefault(account =>
        account.Email == details.Email || account.Username == details.Username);
    if (existingAccount is not null)
    {
        return Results.Conflict();
    }
    
    // TODO: Email validation, this will all be moved elsewhere
    var tokenString = GenerateToken();
    var account = new AccountData(details.Username, details.Email, DateTime.UtcNow, tokenString);

    // Rate limit middleware should have passed us a nicely sanitised IP. Otherwise we will just fallback
    var requestIp = context.Items["RealIp"] as string ?? context.Connection.RemoteIpAddress?.ToString();
    if (requestIp is null)
    {
        return Results.Forbid();
    }
    account.KnownIPs.Add(new AccountAddress()
    {
        IpAddress = requestIp
    });
    database.Accounts.Add(account);
    database.SaveChanges();

    context.Response.Cookies.Append("Token", tokenString, new CookieOptions()
    {
        HttpOnly = true,
        SameSite = SameSiteMode.Strict,
        Expires = DateTimeOffset.UtcNow.AddMonths(1)
    });
    // If for some reason they can not persist the cookie, we also send them the token so that they may save it somwehere
    // secure on certain platforms, such as a third party non-web client.
    return Results.Ok(account.Token);
});
rateLimitEndpoints.Add("/Signup", (1, TimeSpan.FromSeconds(2)));
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
    if (expiry < DateTimeOffset.UtcNow.ToUnixTimeSeconds())
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
    account.KnownIPs.Add(new AccountAddress()
    {
        IpAddress = requestIp
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
    if (long.Parse(expiryString) < DateTimeOffset.UtcNow.ToUnixTimeSeconds())
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
    account.KnownIPs.Add(new AccountAddress()
    {
        IpAddress = requestIp
    });
    database.SaveChanges();

    context.Response.Cookies.Append("Token", account.Token, new CookieOptions()
    {
        HttpOnly = true,
        SameSite = SameSiteMode.Strict,
        Expires = DateTimeOffset.UtcNow.AddMonths(1)
    });

    return Results.Json(account);
});
rateLimitEndpoints.Add("/Signin", (1, TimeSpan.FromSeconds(1)));
sizeLimitEndpoints.Add("/Signin", PayloadSize.FromKilobytes(5));

//Get public facing data for an account, will accept either a username or an account key
httpServer.MapGet("/Profiles/{profileIdentifier}", (string profileIdentifier, [FromServices] DatabaseContext database) =>
{
    var account = int.TryParse(profileIdentifier, out var profileKey)
        ? database.Accounts.SingleOrDefault(account => account.AccountKey == profileKey)
        : database.Accounts.SingleOrDefault(account => account.Username == profileIdentifier);
    if (account is null)
    {
        return Results.NotFound();
    }

    var profile = new UploadableProfile(account);
    return Results.Json(profile);
});
rateLimitEndpoints.Add("/Profiles", (1, TimeSpan.FromMilliseconds(500)));

// Account action endpoints
httpServer.MapPost("/Block", ([FromBody] int userKey, [FromServices] DatabaseContext database, HttpContext context) =>
{
    return Results.Problem(); // TODO: Implement
});
rateLimitEndpoints.Add("/Block", (1, TimeSpan.FromSeconds(2)));
authRequiredEndpoints.Add("/Block");

httpServer.MapPost("/Unblock", ([FromBody] int userKey, HttpContext context) =>
{
    return Results.Problem(); // TODO: Implement
});

httpServer.MapPost("/Follow", ([FromBody] int userKey, HttpContext context) =>
{
    return Results.Problem(); // TODO: Implement
});

httpServer.MapPost("/Report", ([FromBody] UploadableReport reportUpload, [FromServices] DatabaseContext database, HttpContext context) =>
{
    var validationIssues = new Dictionary<string, string[]>();
    if (reportUpload.Reason.Length > 300)
    {
        validationIssues.Add(nameof(reportUpload.Reason), ValidationFails.ReportReasonTooLong);
    }
    var validKey = reportUpload.TargetType switch
    {
        ReportTargetType.Entry => database.PurgatoryEntries
            .Any(entry => entry.EntryKey == reportUpload.TargetKey),
        ReportTargetType.Account => database.Accounts
            .Any(account => account.AccountKey == reportUpload.TargetKey),
        ReportTargetType.Annotation => database.PurgatoryAnnotations
            .Any(entry => entry.AnnotationKey == reportUpload.TargetKey),
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
        ReporterKey = account.AccountKey,
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
rateLimitEndpoints.Add("/Report", (1, TimeSpan.FromSeconds(60)));
authRequiredEndpoints.Add("/Report");

httpServer.MapPost("/UnfollowUser", ([FromBody] string userKey, HttpContext context) =>
{
    return Results.Problem(); // TODO: Implement
});

httpServer.MapPost("/LikePoem", ([FromBody] int poemKey, HttpContext context) =>
{
    return Results.Problem(); // TODO: Implement
});

httpServer.MapPost("/UnlikePoem", ([FromBody] int poemKey, HttpContext context) =>
{
    return Results.Problem(); // TODO: Implement
});

httpServer.MapPost("/PinPoem", ([FromBody] int poemKey, HttpContext context) =>
{
    return Results.Problem(); // TODO: Implement
});

httpServer.MapPost("/UnpinPoem", ([FromBody] int poemKey, HttpContext context) =>
{
    return Results.Problem(); // TODO: Implement
});

httpServer.MapPost("/UpdateEmail", ([FromBody] string email, HttpContext context) =>
{
    return Results.Problem(); // TODO: Implement
});

httpServer.MapPost("/UpdatePenName", ([FromBody] string penName, HttpContext context) =>
{
    return Results.Problem(); // TODO: Implement
});

httpServer.MapPost("/UpdateBiography", ([FromBody] string biography, HttpContext context) =>
{
    
    return Results.Problem(); // TODO: Implement
});

httpServer.MapPost("/UpdateLocation", ([FromBody] string location, HttpContext context) =>
{
    return Results.Problem(); // TODO: Implement
});

httpServer.MapPost("/UpdateRole", ([FromBody] string role, HttpContext context) =>
{
    return Results.Problem(); // TODO: Implement
});

httpServer.MapPost("/UpdateAvatar", ([FromBody] string avatarUrl, HttpContext context) =>
{
    return Results.Problem(); // TODO: Implement
});

httpServer.MapPost("/RatePoem", ([FromBody] UploadableRating ratingUpload, HttpContext context) =>
{
    
    return Results.Problem(); // TODO: Implement
});

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

    [GeneratedRegex("^[a-z][a-z0-9_.]{0,15}$")]
    private static partial Regex PermissibleUsernameRegex();

}