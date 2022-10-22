using System;
using System.Buffers.Text;
using System.Globalization;
using System.Text;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Unicode;
using IronBarCode;
using Microsoft.AspNetCore.Mvc;
using SubliminalServer;
using WatsonWebsocket;
using JsonOptions = Microsoft.AspNetCore.Http.Json.JsonOptions;

//Webserver configuration
var configFile =  "config.txt";
var purgatoryDir = new DirectoryInfo(@"Purgatory");
var purgatoryBackupDir = new DirectoryInfo(@"PurgatoryBackups");
var accountsDir = new DirectoryInfo("Accounts");
var base64Alphabet = @"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
var random = new Random();
using var logoStream = File.OpenRead("SmallLogo.png");
var logo = new QRCodeLogo(logoStream);

var defaultJsonOptions = new JsonSerializerOptions
{
    PropertyNameCaseInsensitive = true,
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    WriteIndented = true
};

if (!File.Exists(configFile))
{
	File.WriteAllText(configFile, "cert: " + Environment.NewLine + "key: " + Environment.NewLine + "port: " + Environment.NewLine + "use_https: ");
	Console.ForegroundColor = ConsoleColor.Green;
	Console.WriteLine("[LOG]: Config created! Please check {0} and run this program again!", configFile);
	Console.ResetColor();
	Environment.Exit(0);
}

var config = File.ReadAllLines(configFile).Select(line => { line = line.Split(": ")[1]; return line; }).ToArray();

//Purgatory
Console.ForegroundColor = ConsoleColor.Yellow;

if (!Directory.Exists(purgatoryDir.Name))
{
    Console.WriteLine("[WARN] Could not find purgatory directory, creating.");
    Directory.CreateDirectory(purgatoryDir.Name);
}
if (!Directory.Exists(purgatoryBackupDir.Name))
{
    Console.WriteLine("[WARN] Could not find purgatory backup directory, creating.");
    Directory.CreateDirectory(purgatoryBackupDir.Name);
}
if (!Directory.Exists(accountsDir.Name))
{
    Console.WriteLine("[WARN] Could not find accounts directory, creating.");
    Directory.CreateDirectory(accountsDir.Name);
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

string HashSha256String(string text)
{
    var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(text));
    return bytes.Aggregate("", (current, b) => current + b.ToString("x2"));
}

httpServer.MapPost("/PurgatoryRate", async (PurgatoryRating rating) => {
    var target = Path.Join(purgatoryDir.Name, rating.Guid);
    if (!File.Exists(target)) return;

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

httpServer.MapPost("/PurgatoryUpload", async (PurgatoryEntry entry) =>
{
    var guid = Guid.NewGuid();
    entry.Guid = guid.ToString();
    entry.Approves = 0;
    entry.Vetoes = 0;
    entry.AdminApproves = 0;
    entry.DateCreated = DateTime.Now.ToString(CultureInfo.InvariantCulture); //new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds().ToString();

    await using var createStream = File.Create(Path.Join(purgatoryDir.Name, guid.ToString()));
    await using var backupStream = File.Create(Path.Join(purgatoryBackupDir.Name, guid.ToString()));
    await JsonSerializer.SerializeAsync(createStream, entry, defaultJsonOptions);
    await JsonSerializer.SerializeAsync(backupStream, entry, defaultJsonOptions);
});

httpServer.MapPost("/Signup", async ([FromBody] string penName) =>
{
    var code = "";
    for (var i = 0; i < 10; i++) code += base64Alphabet[random.Next(0, 63)];
    
    var guid = Guid.NewGuid();
    var profile = new AccountProfile(guid.ToString(), penName, "", "", Array.Empty<string>(), "", Array.Empty<AccountBadge>(), Array.Empty<string>());
    var account = new AccountData(profile, HashSha256String(code), Array.Empty<string>(), Array.Empty<string>(), Array.Empty<string>());
    
    await using var createStream = File.Create(Path.Join(accountsDir.Name, guid.ToString()));
    await JsonSerializer.SerializeAsync(createStream, account, defaultJsonOptions);
    
    await using var codeHashGuid = File.AppendText(Path.Join(accountsDir.Name, "code-hash-guid.txt"));
    await codeHashGuid.WriteAsync(HashSha256String(code) + " " + guid + "\n");
    
    var response = new SignupResponse(code, guid.ToString());
    return Results.Json(JsonSerializer.Serialize(response, defaultJsonOptions));
});

httpServer.MapPost("/Signin", async ([FromBody] string signinCode) =>
{
    var map = await File.ReadAllTextAsync(Path.Join(accountsDir.Name, "code-hash-guid.txt"));
    var signinCodeHash = HashSha256String(signinCode);
     
    foreach (var line in map.Split("\n"))
    {
        var split = line.Split(" ");
        if (split.Length < 2) continue;
        
        var codeHash = split[0];
        var guid = line.Split(" ")[1];
        if (!codeHash.Equals(signinCodeHash)) continue;

        return Results.Json(await File.ReadAllTextAsync(Path.Join(accountsDir.Name, guid)));
    }

    return Results.Problem("Could not sign in to retrieve account data.");
});


//Get public facing data for an account
httpServer.MapPost("/AccountData", async (string guid) =>
{
    var target = Path.Join(accountsDir.Name, guid);
    if (!File.Exists(target)) return Results.Problem("Account GUID does not exist.");

    await using var openStream = File.OpenRead(target);
    var accountData = await JsonSerializer.DeserializeAsync<AccountData>(openStream, defaultJsonOptions);
    
    //Only return profile, not private data
    return Results.Json(accountData?.Profile);
});

httpServer.Run();
