using System.Globalization;
using SubliminalServer.Account;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using SubliminalServer;
using SubliminalServer.AccountActions;
using SubliminalServer.LiveEdit;
using UnbloatDB;
using UnbloatDB.Keys;
using UnbloatDB.Serialisers;
using Config = SubliminalServer.Config;
using JsonOptions = Microsoft.AspNetCore.Http.Json.JsonOptions;

//Webserver configuration
const string base64Alphabet = @"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

var purgatoryDir = new DirectoryInfo(@"Purgatory");
var purgatoryBackupDir = new DirectoryInfo(@"PurgatoryBackups");
var purgatoryDraftsDir = new DirectoryInfo(@"Drafts");
var accountsDir = new DirectoryInfo(@"Data");
var configFile = new FileInfo("config.txt");

var aes = Aes.Create();
var random = new Random();

var database = new Database(new UnbloatDB.Config(accountsDir.Name, new JsonSerialiser()));

if (!File.Exists(configFile.Name))
{
	File.WriteAllText(configFile.Name, "cert: " + Environment.NewLine + "key: " + Environment.NewLine + "port: " + Environment.NewLine + "use_https: ");
	Console.ForegroundColor = ConsoleColor.Green;
	Console.WriteLine("[LOG]: Config created! Please check {0} and run this program again!", configFile);
	Console.ResetColor();
	Environment.Exit(0);
}

var config = File.ReadAllLines(configFile.Name).Select(line => { line = line.Split(": ")[1]; return line; }).ToArray();

Console.ForegroundColor = ConsoleColor.Yellow;
//Regenerate required directories
foreach (var path in new[] { purgatoryDir.FullName, purgatoryBackupDir.FullName, accountsDir.FullName, purgatoryDraftsDir.FullName })
{
    if (Directory.Exists(path)) continue;
    Console.WriteLine("[WARN] Could not find " + path + " directory, creating.");
    Directory.CreateDirectory(path);
}
Console.ResetColor();

var builder = WebApplication.CreateBuilder(args);
builder.Configuration["Kestrel:Certificates:Default:Path"] = config[(int) Config.Cert];
builder.Configuration["Kestrel:Certificates:Default:KeyPath"] = config[(int) Config.Key];
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

var httpServer = builder.Build();
httpServer.Urls.Add(
    $"{(bool.Parse(config[(int) Config.UseHttps]) ? "https" : "http")}://*:{int.Parse(config[(int) Config.Port])}"
);
httpServer.UseCors(policy =>
    policy.AllowAnyMethod().AllowAnyHeader().SetIsOriginAllowed(_ => true).AllowCredentials()
);

static string HashSha256String(string text)
{
    var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(text));
    return bytes.Aggregate("", (current, b) => current + b.ToString("x2"));
}

//TODO: Add ability for account ratings, fix undoapprove/vetologic and make it so that it is 1 per account too, with credential argument for rating.
httpServer.MapPost("/PurgatoryRate", async (PurgatoryAuthenticatedRating rating) =>
{
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

    await database.UpdateRecord(entry);

    return Results.Ok();
});

httpServer.MapGet("/PurgatoryReport/{poemKey}", (string poemKey) =>
{
    Console.ForegroundColor = ConsoleColor.Yellow;
    Console.WriteLine($"WIP: Report function - Poem {poemKey} has been reported, please investigate!");
    Console.ResetColor();
    return Results.Ok();
});

httpServer.MapGet("/PurgatoryPicks", async () =>
    // TODO: REWRITE
    Results.Text("")
);

httpServer.MapGet("/PurgatoryNew", () =>
    Directory.GetFiles(purgatoryDir.Name)
        .Take(10)
        .Select(file => new FileInfo(file))
        .OrderBy(file => file.CreationTime)
        .Reverse()
        .Select(file => file.Name)
        .ToArray()
);

httpServer.MapGet("/PurgatoryAll", () =>
    Directory.GetFiles(purgatoryDir.Name)
        .Select(file => new FileInfo(file))
        .Reverse()
        .Select(file => file.Name)
        .ToArray()
);


httpServer.MapGet("/Purgatory/{poemKey}", async (string poemKey) =>
    await File.ReadAllTextAsync(Path.Join(purgatoryDir.Name, poemKey))
);

httpServer.MapPost("/PurgatoryUpload", async (PurgatoryAuthenticatedEntry entry) =>
{
    var guid = Guid.NewGuid();
    entry.Guid = guid.ToString();
    entry.Approves = 0;
    entry.Vetoes = 0;
    entry.AdminApproves = 0;
    entry.DateCreated = DateTime.Now.ToString(CultureInfo.InvariantCulture);
    
    var poem = await database.CreateRecord<PurgatoryEntry>(entry);
    
    //Account-poem link if uploaded by a user who is signed in
    if (entry.Code is null)
    {
        return Results.Text(entry.Guid);
    }
    
    var account = (await database.FindRecords<AccountData, string>("Code", entry.Code)).FirstOrDefault();

    if (account is null)
    {
        return Results.Unauthorized();
    }

    var profile = (await database.GetRecord<AccountProfile>(account.Data.ProfileReference))!;
    entry.AuthorProfileKey = account.Data.ProfileReference;

    profile.Data.PoemReferences.Add(new InterKey<PurgatoryEntry>(poem));
    
    await database.UpdateRecord(profile);
    return Results.Text(entry.Guid);
});

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
    await database.CreateRecord(new AccountData(HashSha256String(code), new InterKey<AccountProfile>(profileKey)));
    
    var response = new AccountCredentials(code, profileKey);
    return Results.Json(response, Utils.DefaultJsonOptions);
});

//Allows a user to retrieve signin account data, and validate clientside credentials are valid. Contains logging for moderation. 
httpServer.MapPost("/Signin", async ([FromBody] string signinCode, HttpContext context) =>
{
    var account = (await database.FindRecords<AccountData, string>("Code", signinCode)).FirstOrDefault();
    return account is null ? Results.Unauthorized() : Results.Json(account.Data);
});

//Get public facing data for an account
httpServer.MapGet("/AccountProfile/{profileKey}", async (string profileKey) =>
{
    var profile = await database.GetRecord<AccountProfile>(profileKey);
    return profile is null ? Results.NotFound() : Results.Json(profile);
});

//TODO: Switch to base account action, or another dynamic solution so we can have account actions.
httpServer.MapPost("/ExecuteAccountAction", async (SingleValueAccountAction action) =>
{
    var account = (await database.FindRecords<AccountData, string>("Code", action.Code)).FirstOrDefault();
    
    if (account is null)
    {
        return Results.Unauthorized();
    }

    var profile = (await database.GetRecord<AccountProfile>(account.Data.ProfileReference))!;
    
    switch (action.ActionType)
    {
        /*case SingleValueAccountActionType.BlockUser:
        {
            if (action.Value is not string userGuid) break;
            if (!Account.GuidIsValid(userGuid)) break;
            var targetUser = await Account.GetAccountData(userGuid);
            
            if (account.Blocked.Contains(targetUser.Guid)) break;
            account.Blocked.Add(targetUser.Guid);
            break;
        }
        
        case SingleValueAccountActionType.UnblockUser:
        {
            if (action.Value is not string userGuid) break;
            var targetUser = await Account.GetAccountData(userGuid);

            if (!account.Blocked.Contains(targetUser.Guid)) break;
            account.Blocked.Remove(targetUser.Guid);
            break;
        }
        
        case SingleValueAccountActionType.FollowUser:
        {
            if (action.Value is not string userGuid) break;
            if (!Account.GuidIsValid(userGuid)) break;
            var targetUser = await Account.GetAccountData(userGuid);

            account.FollowUser(ref targetUser);
            await Account.SaveAccountData(targetUser);
            break;
        }*/
        
        case SingleValueAccountActionType.UnfollowUser:
        {
            // TODO: Reimplement
            await database.UpdateRecord(account);
            break;
        }
        
        case SingleValueAccountActionType.LikePoem:
        {
            if (action.Value is not string poemGuid) break;
            // TODO: Reimplement
            //if (poemGuid.Length != 36 || account.LikedPoems.Contains(poemGuid)) break;
            //account.LikedPoems.Add(poemGuid);
            break;
        }
        
        case SingleValueAccountActionType.UnlikePoem:
        {
            if (action.Value is not string poemGuid) break;
            // TODO: Reimplement
            //if (!account.Data.LikedPoems.Contains(poemGuid)) break;
            //account.Data.LikedPoems.Remove(poemGuid);
            await database.UpdateRecord(account);
            break;
        }
        
        case SingleValueAccountActionType.PinPoem:
        {
            if (action.Value is not string poemGuid) break;
            // TODO: Reimplement
            //if (poemGuid.Length != 36 || account.Profile.PinnedPoems.Contains(poemGuid)) break;
            //account.Profile.PinnedPoems.Add(poemGuid);
            await database.UpdateRecord(profile);
            break;
        }
        
        case SingleValueAccountActionType.UnpinPoem:
        {
            if (action.Value is not string poemKey) break;
            // TODO: Reimplement
            //if (!profile.Data.PinnedPoems.Contains(poemKey)) break;
            //profile.Data.PinnedPoems.Remove(poemKey);
            await database.UpdateRecord(profile);
            break;
        }
        
        case SingleValueAccountActionType.UpdateEmail:
        {
            if (action.Value is not string email) break;
            // TODO: Email verification
            account.Data.Email = email;
            break;
        }
        
        case SingleValueAccountActionType.UpdateNumber:
        {
            if (action.Value is not string number) break;
            // TODO: Number verification
            account.Data.PhoneNumber = number;
            break;
        }
        
        case SingleValueAccountActionType.UpdatePenName:
        {
            if (action.Value is not string penName) break;
            profile.Data.PenName = penName.Length <= 16 ? penName : penName[..16];
            await database.UpdateRecord(profile);
            break;
        }
        
        case SingleValueAccountActionType.UpdateBiography:
        {
            if (action.Value is not string biography) break;
            profile.Data.Biography = biography.Length <= 360 ? biography : biography[..360];
            await database.UpdateRecord(profile);
            break;
        }

        case SingleValueAccountActionType.UpdateLocation:
        {
            if (action.Value is not string location) break;
            profile.Data.Location = location.Length <= 16 ? location : location[..16];
            await database.UpdateRecord(profile);
            break;
        }

        case SingleValueAccountActionType.UpdateRole:
        {
            if (action.Value is not string role) break;
            profile.Data.Role = role.Length <= 16 ? role : role[..16];
            await database.UpdateRecord(profile);
            break;
        }

        case SingleValueAccountActionType.UpdateAvatar:
        {
            if (action.Value is not string avatarUrl) break;
            var simplifiedUrl = avatarUrl
                [..(avatarUrl.Length <= 512 ? avatarUrl.Length : 256)] //Trim URL length to a maximum reasonable value
                [..(avatarUrl.IndexOf("?", StringComparison.Ordinal) == 0 ? avatarUrl.Length : avatarUrl.IndexOf("?", StringComparison.Ordinal))] //Remove all URL queries
                .Replace("http://", "https://"); //Use HTTPS if url contains a HTTP link

            profile.Data.AvatarUrl = simplifiedUrl;
            await database.UpdateRecord(profile);
            break;
        }
        
        // TODO: Implement drafts here

        default:
        {
            var stream = new MemoryStream();
            await JsonSerializer.SerializeAsync(stream, action);
            await stream.FlushAsync();
            return Results.Problem("Specified account action failed or did not exist." + stream);
        }
    }
    
    return Results.Ok();
});


httpServer.Run();
//await liveEditServer.Start();
