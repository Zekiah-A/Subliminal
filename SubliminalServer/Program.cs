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
var defaultJsonOptions = new JsonSerializerOptions
{
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
if (!Directory.Exists(purgatoryDir.Name))
{
    Console.ForegroundColor = ConsoleColor.Yellow;
    Console.WriteLine("[WARN] Could not find purgatory directory, creating.");
    Console.ResetColor();
    Directory.CreateDirectory(purgatoryDir.Name);
}

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


httpServer.MapGet("/PurgatoryNew", () =>
    Directory.GetFiles(purgatoryDir.Name).Take(10).Select(file => Path.GetFileName(file)).ToArray()
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
    await JsonSerializer.SerializeAsync(createStream, entry, defaultJsonOptions);
    await createStream.DisposeAsync();
});

httpServer.Run();