using System.Globalization;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using SubliminalServer;
using JsonOptions = Microsoft.AspNetCore.Http.Json.JsonOptions;

//Webserver configuration
const string base64Alphabet = @"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
var purgatoryDir = new DirectoryInfo(@"Purgatory");
var purgatoryBackupDir = new DirectoryInfo(@"PurgatoryBackups");
var accountsDir = new DirectoryInfo("Accounts");
var codeHashGuidFile = new FileInfo(Path.Join(accountsDir.Name, "code-hash-guid.txt"));
var configFile = new FileInfo("config.txt");

var aes = Aes.Create();
var random = new Random();
var ipAlreadyRated = new Dictionary<string, PurgatoryRating>();

var defaultJsonOptions = new JsonSerializerOptions
{
    PropertyNameCaseInsensitive = true,
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    WriteIndented = true,
    IncludeFields = true
};

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
foreach (var path in new[] { purgatoryDir.FullName, purgatoryBackupDir.FullName, accountsDir.FullName })
{
    if (Directory.Exists(path)) continue;
    Console.WriteLine("[WARN] Could not find " + path + " directory, creating.");
    Directory.CreateDirectory(path);
}

//Regenerate required files
foreach (var path in new[] { codeHashGuidFile.FullName })
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


//TODO: Add ability for account ratings, fix undoapprove/vetologic and make it so that it is 1 per account too, with credential argument for rating.
httpServer.MapPost("/PurgatoryRate", async (PurgatoryAuthenticatedRating rating, HttpContext context) => {
    var target = Path.Join(purgatoryDir.Name, rating.Guid);
    if (!File.Exists(target)) return;
    
    //Check if this IP has already done the same rating, ofc this ain't perfect though
    var ip = context.Connection.RemoteIpAddress?.ToString();
    if (ip is null) return;
    var pair = new KeyValuePair<string, PurgatoryRating>(ip, rating);
    if (ipAlreadyRated.Contains(pair)) return;
    ipAlreadyRated.Add(pair.Key, pair.Value);
    
    await using var openStream = File.OpenRead(target);
    var entry = await JsonSerializer.DeserializeAsync<PurgatoryEntry>(openStream, defaultJsonOptions);
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
    await JsonSerializer.SerializeAsync(stream, entry, defaultJsonOptions);
});

httpServer.MapGet("/PurgatoryReport/{guid}", (string guid) =>
{
    Console.ForegroundColor = ConsoleColor.Yellow;
    Console.WriteLine($"WIP: Report function - Poem {guid} has been reported, please investigate!");
    Console.ResetColor();
});

httpServer.MapGet("/PurgatoryNew", () =>
    Directory.GetFiles(purgatoryDir.Name)
        .Take(30)
        .Select(file => new FileInfo(file))
        .OrderBy(file => file.CreationTime)
        .Reverse()
        .Select(file => file.Name)
        .ToArray()
);

httpServer.MapGet("/Purgatory/{guid}", (string guid) =>
    File.ReadAllTextAsync(Path.Join(purgatoryDir.Name, guid))
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
        var accountTarget = Path.Join(accountsDir.Name, accountGuid);
        await using var openStream = File.OpenRead(accountTarget);
        var accountData = await JsonSerializer.DeserializeAsync<AccountData>(openStream);
        if (accountData is null) return;
        accountData.Profile.PoemGuids ??= new List<string>();
        accountData.Profile.PoemGuids.Add(guid.ToString());
        
        await using var stream = new FileStream(accountTarget, FileMode.Truncate);
        await JsonSerializer.SerializeAsync(stream, accountData, defaultJsonOptions);
    }

    await using var createStream = File.Create(Path.Join(purgatoryDir.Name, guid.ToString()));
    await using var backupStream = File.Create(Path.Join(purgatoryBackupDir.Name, guid.ToString()));
    
    //We convert them back to PurgatoryEntry when saving to not leak code (safety)
    await JsonSerializer.SerializeAsync(createStream, entry as PurgatoryEntry, defaultJsonOptions);
    await JsonSerializer.SerializeAsync(backupStream, entry as PurgatoryEntry, defaultJsonOptions);
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
    await JsonSerializer.SerializeAsync(createStream, account, defaultJsonOptions);
    
    await using var codeHashGuid = File.AppendText(codeHashGuidFile.FullName);
    await codeHashGuid.WriteAsync(Account.HashSha256String(code) + " " + guid + "\n");
    
    var response = new AccountCredentials(code, guid.ToString());
    return Results.Json(JsonSerializer.Serialize(response, defaultJsonOptions));
});

//Allows a user to retrieve signin account data, and validate clientside credentials are valid. Contains logging for moderation. 
httpServer.MapPost("/Signin", async ([FromBody] string signinCode, HttpContext context) =>
{
    if (!await Account.CodeIsValid(signinCode))
    {
        return Results.Problem("Could not sign in to retrieve account data.");
    }

    var guid = await Account.GetGuid(signinCode);
        
    await using var openStream = File.OpenRead(Path.Join(accountsDir.Name, guid));
    var accountData = await JsonSerializer.DeserializeAsync<AccountData>(openStream, defaultJsonOptions);
    return accountData is null ? Results.Problem("Deserialised account data was empty?") : Results.Json(accountData);
    
    /* TODO: Like this until I figure it out
    var ip = context.Connection.RemoteIpAddress?.ToString();
    if (ip is null) return Results.Problem("Remote IP address was null");
    accountData.KnownIPs ??= new List<byte[]>();
    
    var ips = accountData.KnownIPs.Select(encryptedIp => AesEncryptor.DecryptStringFromBytes(encryptedIp, aes.IV, aes.Key));
    if (!ips.Contains(ip)) accountData.KnownIPs.Add(AesEncryptor.EncryptStringToBytes(ip, aes.IV, aes.Key));
    */
});

//Updates an accounts profile with new data, such as a snazzy new profile image (only if they are authenticated).
httpServer.MapPost("/UpdateAccountProfile", async (AccountAuthenticatedProfile profileUpdate) => {

    if (!await Account.CodeIsValid(profileUpdate.Code))
    {
        return Results.Problem("You are not authenticated to modify this account profile.");
    }

    var guid = await Account.GetGuid(profileUpdate.Code);
    var target = Path.Join(accountsDir.Name, guid);
    
    await using var openStream = File.OpenRead(target);
    var data = await JsonSerializer.DeserializeAsync<AccountData>(openStream, defaultJsonOptions);
    if (data is null) return Results.Problem("Deserialised account data was empty?");

    //TODO: Cleanup
    if (profileUpdate.PenName is {Length: >= 16}) profileUpdate.PenName = profileUpdate.PenName[..16];
    if (profileUpdate.Biography is {Length: >= 360}) profileUpdate.Biography = profileUpdate.Biography[..360];
    if (profileUpdate.Role is {Length: >= 8}) profileUpdate.Role = profileUpdate.Role[..8];

    //Equals ignores any user changeable/mutable properties, therefore we can ensure client does not change anything they shouldn't 
    if (!data.Profile.CheckUserUnchanged(profileUpdate))
    {
        return Results.Problem("You attempted to change a profile property that is not user modifiable.");
    }
    
    data.Profile = profileUpdate;
    
    await using var stream = new FileStream(target, FileMode.Truncate);
    await JsonSerializer.SerializeAsync(stream, data, defaultJsonOptions);
    return Results.Ok();
});

//Get public facing data for an account
httpServer.MapGet("/AccountProfile/{guid}", async (string guid) =>
{
    var target = Path.Join(accountsDir.Name, guid);
    if (!File.Exists(target)) return Results.Problem($"Profile with account GUID {guid} does not exist.");
    
    await using var openStream = File.OpenRead(target);
    var accountData = await JsonSerializer.DeserializeAsync<AccountData>(openStream, defaultJsonOptions);
    
    //Only return profile, not private data
    return accountData is null ? Results.Problem("Account data was null.") : Results.Json(accountData.Profile);
});

httpServer.Run();
