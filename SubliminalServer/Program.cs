using System.Globalization;
using SubliminalServer.Account;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using SubliminalServer;
using SubliminalServer.AccountActions;
using SubliminalServer.LiveEdit;
using JsonOptions = Microsoft.AspNetCore.Http.Json.JsonOptions;

//Webserver configuration
const string base64Alphabet = @"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

var purgatoryDir = new DirectoryInfo(@"Purgatory");
var purgatoryBackupDir = new DirectoryInfo(@"PurgatoryBackups");
var purgatoryDraftsDir = new DirectoryInfo(@"Drafts");
var accountsDir = new DirectoryInfo(@"Accounts");
var codeHashGuidFile = new FileInfo(Path.Join(accountsDir.Name, "code-hash-guid.txt"));
var purgatoryPicksFile = new FileInfo(Path.Join(purgatoryDir.Name, "purgatory-picks.txt"));
var configFile = new FileInfo("config.txt");

var aes = Aes.Create();
var random = new Random();

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

//Regenerate required files
foreach (var path in new[] { codeHashGuidFile.FullName, purgatoryPicksFile.FullName })
{
    if (File.Exists(path)) continue;
    Console.WriteLine("[WARN] Could not find " + path + " file, creating.");
    File.WriteAllText(path, "");
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

var liveEditServer = new LiveEditSocketServer(1235, false);

//TODO: Add ability for account ratings, fix undoapprove/vetologic and make it so that it is 1 per account too, with credential argument for rating.
httpServer.MapPost("/PurgatoryRate", async (PurgatoryAuthenticatedRating rating) => {
    var target = Path.Join(purgatoryDir.Name, rating.Guid);
    if (!File.Exists(target)) return Results.Problem("Poem with GUID " + rating.Guid + " could not be found.");
    
    await using var openStream = File.OpenRead(target);
    var entry = await JsonSerializer.DeserializeAsync<PurgatoryEntry>(openStream, Utils.DefaultJsonOptions);
    if (entry is null) return Results.Problem("Purgatory entry was null");
    
    entry.Approves = rating.Type switch
    {
        PurgatoryRatingType.Approve => entry.Approves + 1,
        PurgatoryRatingType.UndoApprove => entry.Approves - 1,
        _ => entry.Approves
    };

    entry.Vetoes = rating.Type switch
    {
        PurgatoryRatingType.Veto => entry.Vetoes + 1,
        PurgatoryRatingType.UndoVeto => entry.Vetoes - 1,
        _ => entry.Vetoes
    };

    await using var stream = new FileStream(target, FileMode.Truncate);
    await JsonSerializer.SerializeAsync(stream, entry, Utils.DefaultJsonOptions);
    return Results.Ok();
});

httpServer.MapGet("/PurgatoryReport/{guid}", (string guid) =>
{
    Console.ForegroundColor = ConsoleColor.Yellow;
    Console.WriteLine($"WIP: Report function - Poem {guid} has been reported, please investigate!");
    Console.ResetColor();
    return Results.Ok();
});

httpServer.MapGet("/PurgatoryPicks", async () =>
    await File.ReadAllLinesAsync(purgatoryPicksFile.FullName)
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
        .Where(file => file.Name != purgatoryPicksFile.Name)
        .Reverse()
        .Select(file => file.Name)
        .ToArray()
);


httpServer.MapGet("/Purgatory/{guid}", async (string guid) =>
    await File.ReadAllTextAsync(Path.Join(purgatoryDir.Name, guid))
);

httpServer.MapPost("/PurgatoryUpload", async (PurgatoryAuthenticatedEntry entry) =>
{
    var guid = Guid.NewGuid();
    entry.Guid = guid.ToString();
    entry.Approves = 0;
    entry.Vetoes = 0;
    entry.AdminApproves = 0;
    entry.DateCreated = DateTime.Now.ToString(CultureInfo.InvariantCulture);
    
    //Account-poem link if uploaded by a user who is signed in
    if (entry.Code is not null && await Account.CodeIsValid(entry.Code))
    {
        var accountGuid = await Account.GetGuid(entry.Code);
        entry.AuthorGuid = accountGuid; 
        
        //Link newly uploaded poem to account profile
        var accountData = await Account.GetAccountData(accountGuid);
        accountData.Profile.PoemGuids.Add(guid.ToString());
        await Account.SaveAccountData(accountData);
    }

    await using var createStream = File.Create(Path.Join(purgatoryDir.Name, guid.ToString()));
    await using var backupStream = File.Create(Path.Join(purgatoryBackupDir.Name, guid.ToString()));
    
    //We convert them back to PurgatoryEntry when saving to not leak code (safety)
    await JsonSerializer.SerializeAsync(createStream, entry as PurgatoryEntry, Utils.DefaultJsonOptions);
    await JsonSerializer.SerializeAsync(backupStream, entry as PurgatoryEntry, Utils.DefaultJsonOptions);
    return Results.Text(entry.Guid);
});

httpServer.MapGet("/Drafts/{guid}", (string guid) =>
    Results.Json(File.ReadAllTextAsync(Path.Join(purgatoryDir.Name, guid)))
);

httpServer.MapPost("/DraftsUpload", async (PurgatoryAuthenticatedEntry entry) =>
{
    if (entry.Code is null || !await Account.CodeIsValid(entry.Code)) return Results.Problem("Could not authorise upload");

    var guid = Guid.NewGuid();
    var accountGuid = await Account.GetGuid(entry.Code);

    entry.Guid = guid.ToString();
    entry.Approves = 0;
    entry.Vetoes = 0;
    entry.AdminApproves = 0;
    entry.DateCreated = DateTime.Now.ToString(CultureInfo.InvariantCulture);
    entry.AuthorGuid = accountGuid;
    entry.AuthorisedEditors = new List<string>();
    
    //Link newly uploaded draft to account data
    var accountData = await Account.GetAccountData(accountGuid);
    accountData.Drafts.Add(guid.ToString());
    await Account.SaveAccountData(accountData);
    
    //Save draft to fs
    await using var createStream = File.Create(Path.Join(purgatoryDir.Name, guid.ToString()));
    await JsonSerializer.SerializeAsync(createStream, entry as PurgatoryEntry, Utils.DefaultJsonOptions);
    return Results.Text(entry.Guid);
});

//Creates a new account with a provided pen name, and then gives the client the credentials for their created account
httpServer.MapPost("/Signup", async ([FromBody] string penName) =>
{
    var code = "";
    var guid = Guid.NewGuid();
    for (var i = 0; i < 10; i++) code += base64Alphabet[random.Next(0, 63)];
    
    var profile = new AccountProfile(penName, DateTime.Now.ToString(CultureInfo.InvariantCulture));
    var account = new AccountData(Account.HashSha256String(code), guid.ToString(), profile);

    await using var createStream = File.Create(Path.Join(accountsDir.Name, guid.ToString()));
    await JsonSerializer.SerializeAsync(createStream, account, Utils.DefaultJsonOptions);
    
    await using var codeHashGuid = File.AppendText(codeHashGuidFile.FullName);
    await codeHashGuid.WriteAsync(Account.HashSha256String(code) + " " + guid + "\n");
    
    var response = new AccountCredentials(code, guid.ToString());
    return Results.Json(response, Utils.DefaultJsonOptions);
});

//Allows a user to retrieve signin account data, and validate clientside credentials are valid. Contains logging for moderation. 
httpServer.MapPost("/Signin", async ([FromBody] string signinCode, HttpContext context) =>
{
    if (!await Account.CodeIsValid(signinCode))
    {
        return Results.Problem("Could not sign in to retrieve account data.");
    }
    
    var guid = await Account.GetGuid(signinCode);
    var account = await Account.GetAccountData(guid);
    
    var ip = context.Connection.RemoteIpAddress?.ToString();
    if (ip is null)
    {
        return Results.Problem("Could not sign in, IP address was null");
    }
    
    //TODO: Investigate problems with AES *cryption
    //var ips = account.KnownIPs.Select(encryptedIp => AesEncryptor.DecryptStringFromBytes(encryptedIp, aes.Key, aes.IV));
    //if (!ips.Contains(ip)) account.KnownIPs.Add(AesEncryptor.EncryptStringToBytes(ip, aes.IV, aes.Key));
    await Account.SaveAccountData(account);
    
    return Results.Json(account);
});
/*
*/

//Get public facing data for an account
httpServer.MapGet("/AccountProfile/{guid}", async (string guid) =>
{
    if (!Account.GuidIsValid(guid)) return Results.Problem($"Profile with account GUID {guid} does not exist.");
    var accountData = await Account.GetAccountData(guid);
    return Results.Json(accountData.Profile);
});

//TODO: Switch to base account action, or another dynamic solution so we can have account actions.
httpServer.MapPost("/ExecuteAccountAction", async (SingleValueAccountAction action) =>
{
    if (!await Account.CodeIsValid(action.Code))
    {
        return Results.Problem("Failed to authorise account action.");
    }
    
    var account = await Account.GetAccountData(await Account.GetGuid(action.Code));

    switch (action.ActionType)
    {
        case SingleValueAccountActionType.BlockUser:
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
        }
        
        case SingleValueAccountActionType.UnfollowUser:
        {
            if (action.Value is not string userGuid) break;
            if (!Account.GuidIsValid(userGuid)) break;
            var targetUser = await Account.GetAccountData(userGuid);

            account.UnfollowUser(ref targetUser);
            await Account.SaveAccountData(targetUser);
            break;
        }
        
        case SingleValueAccountActionType.LikePoem:
        {
            if (action.Value is not string poemGuid) break;
            if (poemGuid.Length != 36 || account.LikedPoems.Contains(poemGuid)) break;
            account.LikedPoems.Add(poemGuid);
            break;
        }
        
        case SingleValueAccountActionType.UnlikePoem:
        {
            if (action.Value is not string poemGuid) break;
            if (!account.LikedPoems.Contains(poemGuid)) break;
            account.LikedPoems.Remove(poemGuid);
            break;
        }
        
        case SingleValueAccountActionType.PinPoem:
        {
            if (action.Value is not string poemGuid) break;
            if (poemGuid.Length != 36 || account.Profile.PinnedPoems.Contains(poemGuid)) break;
            account.Profile.PinnedPoems.Add(poemGuid);
            break;
        }
        
        case SingleValueAccountActionType.UnpinPoem:
        {
            if (action.Value is not string poemGuid) break;
            if (!account.Profile.PinnedPoems.Contains(poemGuid)) break;
            account.Profile.PinnedPoems.Remove(poemGuid);
            break;
        }
        
        case SingleValueAccountActionType.UpdateEmail:
        {
            if (action.Value is not string email) break;
            //TODO: Investigate possible problems with AES decryption.
            account.Email = AesEncryptor.EncryptStringToBytes(email, aes.Key, aes.IV);
            break;
        }
        
        case SingleValueAccountActionType.UpdateNumber:
        {
            if (action.Value is not string number) break;
            //TODO: Investigate possible problems with AES decryption.
            account.PhoneNumber = AesEncryptor.EncryptStringToBytes(number, aes.Key, aes.IV);
            break;
        }
        
        case SingleValueAccountActionType.UpdatePenName:
        {
            if (action.Value is not string penName) break;
            account.Profile.PenName = penName.Length <= 16 ? penName : penName[..16];
            break;
        }
        
        case SingleValueAccountActionType.UpdateBiography:
        {
            if (action.Value is not string biography) break;
            account.Profile.Biography = biography.Length <= 360 ? biography : biography[..360];
            break;
        }

        case SingleValueAccountActionType.UpdateLocation:
        {
            if (action.Value is not string location) break;
            account.Profile.Location = location.Length <= 16 ? location : location[..16];
            break;
        }

        case SingleValueAccountActionType.UpdateRole:
        {
            if (action.Value is not string role) break;
            account.Profile.Role = role.Length <= 16 ? role : role[..16];
            break;
        }

        case SingleValueAccountActionType.UpdateAvatar:
        {
            if (action.Value is not string avatarUrl) break;
            var simplifiedUrl = avatarUrl
                [..(avatarUrl.Length <= 512 ? avatarUrl.Length : 256)] //Trim URL length to a maximum reasonable value
                [..(avatarUrl.IndexOf("?", StringComparison.Ordinal) == 0 ? avatarUrl.Length : avatarUrl.IndexOf("?", StringComparison.Ordinal))] //Remove all URL queries
                .Replace("http://", "https://"); //Use HTTPS if url contains a HTTP link

            account.Profile.AvatarUrl = simplifiedUrl;
            break;
        }

        default:
        {
            var stream = new MemoryStream();
            await JsonSerializer.SerializeAsync(stream, action);
            await stream.FlushAsync();
            return Results.Problem("Specified account action failed or did not exist." + stream);
        }
    }
    
    await Account.SaveAccountData(account);
    return Results.Ok();
});


httpServer.Run();
//await liveEditServer.Start();
