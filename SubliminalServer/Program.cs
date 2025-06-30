using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using SubliminalServer.Configuration;
using SubliminalServer.Middlewares;
using JsonOptions = Microsoft.AspNetCore.Http.Json.JsonOptions;

namespace SubliminalServer;

// EFCore database setup:
// dotnet ef migrations add InitialCreate
// dotnet ef database update
// Prerelease .NET 9 may require "dotnet tool install --global dotnet-ef --prerelease"
// to update from a non-prerelease, do "dotnet tool update --global dotnet-ef --prerelease"

internal static partial class Program
{
    private static WebApplication httpServer;
    private static List<string> authRequiredEndpoints;
    private static Dictionary<string, (int RequestLimit, TimeSpan TimeInterval)> rateLimitEndpoints;
    // Should only really be needed on POST endpoint
    private static Dictionary<string, PayloadSize> sizeLimitEndpoints;

    private static DirectoryInfo profileImagesDir;
    private static ServerConfig? config;
    
    [GeneratedRegex("^[a-z][a-z0-9_-]{0,23}$")]
    private static partial Regex PermissibleTagRegex();
    [GeneratedRegex("^[a-z][a-z0-9_.]{0,15}$")]
    private static partial Regex PermissibleUsernameRegex();

    public static async Task Main(string[] args)
    {
        var dataDir = new DirectoryInfo("Data");
        var profilesDir = new DirectoryInfo(Path.Combine(dataDir.FullName, "Profiles", "Avatars"));
        profileImagesDir = new DirectoryInfo(Path.Combine(dataDir.FullName, "Profiles", "Avatars"));
        var soundsDir = new DirectoryInfo(Path.Join(dataDir.FullName, "Sounds"));
        var configFile = new FileInfo("config.json");
        var dbPath = Path.Join(dataDir.FullName, "subliminal.db");
 
        if (File.Exists(configFile.Name))
        {
            var configText = await File.ReadAllTextAsync(configFile.Name);
            config = JsonSerializer.Deserialize<ServerConfig>(configText);
        }

        if (config?.Version < ServerConfig.LatestVersion)
        {
            var configMoveLocation = configFile.FullName.Replace(".json", $".version{config.Version}.old.json");
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("[WARN]: Current config of version {0} older than current version {1}." +
                "Outdated config file will be moved to {2}.",
                config.Version, ServerConfig.LatestVersion, configMoveLocation);
            Console.ResetColor();
            File.Move(configFile.FullName, configMoveLocation);
            config = null;
        }
        if (config is null)
        {
            await using var stream = File.OpenWrite(configFile.Name);
            await JsonSerializer.SerializeAsync(stream, new ServerConfig(), new JsonSerializerOptions
            {
                WriteIndented = true,
            });
            await stream.FlushAsync();
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("[LOG]: New config created! Please edit {0} and run this program again!", configFile);
            Console.ResetColor();
            Environment.Exit(0);
        }

        Console.ForegroundColor = ConsoleColor.Yellow;
        foreach (var dirPath in new[] { dataDir, profilesDir, profileImagesDir, soundsDir })
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
                policy.WithOrigins("http://localhost:80", "http://localhost:1234", "https://poemanthology.org")
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
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
        httpServer = builder.Build();
        httpServer.Urls.Add($"{(config.UseHttps ? "https" : "http")}://*:{config.Port}");

        httpServer.UseCors(policy =>
            policy.AllowAnyMethod().AllowAnyHeader().SetIsOriginAllowed(_ => true).AllowCredentials()
        );

        httpServer.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(profileImagesDir.FullName),
            RequestPath = "/profiles/avatars"
        });
        
        if (httpServer.Environment.IsDevelopment())
        {
            httpServer.UseSwagger();
            httpServer.UseSwaggerUI();
        }
        
        authRequiredEndpoints = new List<string>();
        rateLimitEndpoints = new Dictionary<string, (int RequestLimit, TimeSpan TimeInterval)>();
        sizeLimitEndpoints = new Dictionary<string, PayloadSize>(); // Should only really be needed on POST endpoints

        AddPoemEndpoints();
        AddPurgatoryEndpoints();
        AddAnthologyEndpoints();
        AddAuthEndpoints();
        AddAccountEndpoints();
        AddProfileEndpoints();
        
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
                    appBuilder.UseMiddleware<EnsuredAuthorizationMiddleware>();
                }
            );
        }

        await httpServer.RunAsync();
    }
    
    private static string GenerateToken()
    {
        var tokenBytes = RandomNumberGenerator.GetBytes(32);
        var tokenString = Convert.ToBase64String(tokenBytes)
            + "_" + DateTimeOffset.UtcNow.AddMonths(1).ToUnixTimeSeconds();
        return tokenString;
    }
}
