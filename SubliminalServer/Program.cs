using System.Globalization;
using System.Net.Mime;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using SubliminalServer;
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
    if (!File.Exists(target)) return;
    
    await using var openStream = File.OpenRead(target);
    var entry = await JsonSerializer.DeserializeAsync<PurgatoryEntry>(openStream, Utils.DefaultJsonOptions);
    if (entry is null) return;
    
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
});

httpServer.MapGet("/PurgatoryReport/{guid}", (string guid) =>
{
    Console.ForegroundColor = ConsoleColor.Yellow;
    Console.WriteLine($"WIP: Report function - Poem {guid} has been reported, please investigate!");
    Console.ResetColor();
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
        accountData.Profile.PoemGuids ??= new List<string>();
        accountData.Profile.PoemGuids.Add(guid.ToString());
        await Account.SaveAccountData(accountData);
    }

    await using var createStream = File.Create(Path.Join(purgatoryDir.Name, guid.ToString()));
    await using var backupStream = File.Create(Path.Join(purgatoryBackupDir.Name, guid.ToString()));
    
    //We convert them back to PurgatoryEntry when saving to not leak code (safety)
    await JsonSerializer.SerializeAsync(createStream, entry as PurgatoryEntry, Utils.DefaultJsonOptions);
    await JsonSerializer.SerializeAsync(backupStream, entry as PurgatoryEntry, Utils.DefaultJsonOptions);
    return Results.Ok();
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
    accountData.Drafts ??= new List<string>();
    accountData.Drafts.Add(guid.ToString());
    await Account.SaveAccountData(accountData);
    
    //Save draft to fs
    await using var createStream = File.Create(Path.Join(purgatoryDir.Name, guid.ToString()));
    await JsonSerializer.SerializeAsync(createStream, entry as PurgatoryEntry, Utils.DefaultJsonOptions);
    return Results.Ok();
});

//Creates a new account with a provided pen name, and then gives the client the credentials for their created account
httpServer.MapPost("/Signup", async ([FromBody] string penName) =>
{
    var code = "";
    var guid = Guid.NewGuid();
    for (var i = 0; i < 10; i++) code += base64Alphabet[random.Next(0, 63)];
    
    var profile = new AccountProfile
    {
        PenName = penName,
        JoinDate = DateTime.Now.ToString(CultureInfo.InvariantCulture),
        Badges = new List<AccountBadge> { AccountBadge.New }
    };
    var account = new AccountData(Account.HashSha256String(code), guid.ToString())
    {
        Profile = profile
    };

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
    
    return Results.Json(await File.ReadAllTextAsync(Path.Join(accountsDir.Name, guid)));
});
/*
var ip = context.Connection.RemoteIpAddress?.ToString();
if (ip is null) return Results.Problem("Remote IP address was null");
accountData.KnownIPs ??= new List<byte[]>();

var ips = accountData.KnownIPs.Select(encryptedIp => AesEncryptor.DecryptStringFromBytes(encryptedIp, aes.IV, aes.Key));
if (!ips.Contains(ip)) accountData.KnownIPs.Add(AesEncryptor.EncryptStringToBytes(ip, aes.IV, aes.Key));
*/


//Updates an accounts profile with new data, such as a snazzy new profile image (only if they are authenticated).
httpServer.MapPost("/UpdateAccountProfile", async (AccountAuthenticatedProfile profileUpdate) =>
{
    if (!await Account.CodeIsValid(profileUpdate.Code))
    {
        return Results.Problem("You are not authenticated to modify this account profile.");
    }

    var guid = await Account.GetGuid(profileUpdate.Code);
    var accountData = await Account.GetAccountData(guid);
    
    //TODO: Cleanup
    if (profileUpdate.PenName is {Length: >= 16}) profileUpdate.PenName = profileUpdate.PenName[..16];
    if (profileUpdate.Biography is {Length: >= 360}) profileUpdate.Biography = profileUpdate.Biography[..360];
    if (profileUpdate.Role is {Length: >= 8}) profileUpdate.Role = profileUpdate.Role[..8];

    //Equals ignores any user changeable/mutable properties, therefore we can ensure client does not change anything they shouldn't 
    if (!accountData.Profile.CheckUserUnchanged(profileUpdate))
    {
        return Results.Problem("You attempted to change a profile property that is not user modifiable.");
    }
    
    accountData.Profile = profileUpdate;
    
    await Account.SaveAccountData(accountData);
    return Results.Ok();
});

//Get public facing data for an account
httpServer.MapGet("/AccountProfile/{guid}", async (string guid) =>
{
    var target = Path.Join(accountsDir.Name, guid);
    if (!File.Exists(target)) return Results.Problem($"Profile with account GUID {guid} does not exist.");
    
    await using var openStream = File.OpenRead(target);
    var accountData = await JsonSerializer.DeserializeAsync<AccountData>(openStream, Utils.DefaultJsonOptions);
    
    //Only return profile, not private data
    return accountData is null ? Results.Problem("Account data was null.") : Results.Json(accountData.Profile);
});

httpServer.Run();
//await liveEditServer.Start();
