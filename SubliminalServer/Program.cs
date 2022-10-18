using System;
using System.Text;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.AspNetCore.Http.Json;
using SubliminalServer;
using WatsonWebsocket;

//Webserver configuration
var configFile =  "config.txt";
var purgatoryDir = new DirectoryInfo(@"Purgatory");
var purgatoryBackupDir = new DirectoryInfo(@"PurgatoryBackups");
var defaultJsonOptions = new JsonSerializerOptions
{
    PropertyNameCaseInsensitive = true,
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    WriteIndented = true
};

if (!File.Exists(configFile))
{





un this program again!", configFile);
        Console.ResetColor();
        Environment.Exit(0);
}

var config = File.ReadAllLines(configFile).Select(line => { line = line.Split(": ")[1]; return line; }).ToArray();

//Purgatory
Console.ForegroundColor = ConsoleColor.Yellow;

if (!Directory.Exists(purgatoryDir.Name))
{
    Console.WriteLine("[WARN] Could not find purgatory directory, creating.");
    Directory.CreateDirectory(purgatoryDir.Name);                       }
if (!Directory.Exists(purgatoryBackupDir.Name))
{
        Console.WriteLine("[WARN] Could not find purgatory backup directory, creating.");
    Directory.CreateDirectory(purgatoryBackupDir.Name);
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
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.Camel
    await JsonSerializer.SerializeAsync(stream, entry, defaultJsonOptions);
});

httpServer.MapGet("/PurgatoryReport/{guid}", (string guid) => {

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
    entry.DateCreated = new DateTimeOffset().ToUnixTimeSeconds();

    await using var createStream = File.Create(Path.Join(purgatoryDir.Name, guid.ToString()));
    await using var backupStream = File.Create(Path.Join(purgatoryBackupDir.Name, guid.ToString()));
    await JsonSerializer.SerializeAsync(createStream, entry, defaultJsonOptions);
    await JsonSerializer.SerializeAsync(backupStream, entry, defaultJsonOptions);
});

httpServer.Run();
