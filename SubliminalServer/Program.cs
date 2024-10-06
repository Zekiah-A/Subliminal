using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using SubliminalServer.ApiModel;
using SubliminalServer.DataModel.Account;
using SubliminalServer.DataModel.Report;
using JsonOptions = Microsoft.AspNetCore.Http.Json.JsonOptions;

namespace SubliminalServer;

// EFCore database setup:
// dotnet ef migrations add InitialCreate
// dotnet ef database update
// Prerelease .NET 9 may require "dotnet tool install --global dotnet-ef --prerelease"
// to update from a non-prerelease, do "dotnet tool update --global dotnet-ef --prerelease"

public static partial class Program
{
    private static WebApplication httpServer;
    private static List<string> authRequiredEndpoints;
    private static Dictionary<string, (int RequestLimit, TimeSpan TimeInterval)> rateLimitEndpoints;
    // Should only really be needed on POST endpoint
    private static Dictionary<string, PayloadSize> sizeLimitEndpoints;
    
    [GeneratedRegex("^[a-z][a-z0-9_-]{0,23}$")]
    private static partial Regex PermissibleTagRegex();
    [GeneratedRegex("^[a-z][a-z0-9_.]{0,15}$")]
    private static partial Regex PermissibleUsernameRegex();

    public static async Task Main(string[] args)
    {
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
            await JsonSerializer.SerializeAsync(stream, new ServerConfig(), new JsonSerializerOptions
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
        httpServer = builder.Build();
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
        
        // This is some straightup weirdness to force inject the DB, it seems to work for out current use though
        var scope = httpServer.Services.CreateScope();
        var serviceProvider = scope.ServiceProvider;
        httpServer.UseMiddleware<AuthorizationMiddleware>(serviceProvider.GetRequiredService<DatabaseContext>());

        authRequiredEndpoints = new List<string>();
        rateLimitEndpoints = new Dictionary<string, (int RequestLimit, TimeSpan TimeInterval)>();
        sizeLimitEndpoints = new Dictionary<string, PayloadSize>(); // Should only really be needed on POST endpoints
        
        AddPurgatoryEndpoints();
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
                    appBuilder.UseMiddleware<EnsureAuthorizationMiddleware>();
                }
            );
        }

        await httpServer.RunAsync();
    }
    
    private static string GenerateToken()
    {
        var tokenBytes = RandomNumberGenerator.GetBytes(32);
        var tokenString = Convert.ToBase64String(tokenBytes)
            + ";" + DateTimeOffset.UtcNow.AddMonths(1).ToUnixTimeSeconds();
        return tokenString;
    }
}