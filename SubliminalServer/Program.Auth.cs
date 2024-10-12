using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using SubliminalServer.ApiModel;
using SubliminalServer.DataModel.Account;

namespace SubliminalServer;

internal static partial class Program
{
    private static void AddAuthEndpoints()
    {
        //Creates a new account with a provided pen name, and then gives the client the credentials for their created account
        httpServer.MapPost("/auth/signup", async ([FromBody] LoginDetails details, [FromServices] DatabaseContext database, HttpContext context) =>
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
            database.Accounts.Add(account);
            await database.SaveChangesAsync();

            // Rate limit middleware should have passed us a nicely sanitised IP. Otherwise we will just fallback
            var requestIp = GetRequestIp(context);
            var userAgent = context.Request.Headers.UserAgent.ToString();
            if (requestIp is null)
            {
                return Results.Forbid();
            }
            await UpdateAccountClients(requestIp, userAgent, account, database);


            // Add auth cookie for subsequent requests
            AppendTokenCookie(account.Token, httpServer, context);
            
            // If for some reason they can not persist the cookie, we also send them the token so that they may save it somwehere
            // secure on certain platforms, such as a third party non-web client.
            return Results.Ok(new { account.Token, account.Id});
        });
        if (!httpServer.Environment.IsDevelopment())
        {
            rateLimitEndpoints.Add("/auth/signup", (1, TimeSpan.FromSeconds(20)));
            sizeLimitEndpoints.Add("/auth/signup", PayloadSize.FromKilobytes(5));
        }

        // Allows a user to signin and receive account data
        httpServer.MapPost("/auth/signin/token", async ([FromBody] string? token, [FromServices] DatabaseContext database, HttpContext context) =>
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
            var expiryString = token.Split("_").Last();
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
            var requestIp = GetRequestIp(context);
            var userAgent = context.Request.Headers.UserAgent.ToString();
            if (requestIp is null)
            {
                return Results.Forbid();
            }
            await UpdateAccountClients(requestIp, userAgent, account, database);
            
            // Add auth cookie for subsequent requests
            AppendTokenCookie(account.Token, httpServer, context);

            return Results.Ok(new { account.Token, account.Id});
        });
        if (!httpServer.Environment.IsDevelopment())
        {
            rateLimitEndpoints.Add("/auth/signin/token", (1, TimeSpan.FromSeconds(1)));
            sizeLimitEndpoints.Add("/auth/signin/token", PayloadSize.FromKilobytes(5));
        }

        httpServer.MapPost("/auth/signin", async ([FromBody] LoginDetails details, [FromServices] DatabaseContext database, HttpContext context) =>
        {
            var account = database.Accounts.SingleOrDefault(account =>
                account.Username == details.Username && account.Email == details.Email);
            if (account is null)
            {
                return Results.NotFound();
            }
    
            // If the current account token is expired, we will generate a new one,
            // we will also give them the token cookie regardless
            var expiryString = account.Token.Split("_").Last();
            if (long.Parse(expiryString) < DateTimeOffset.UtcNow.ToUnixTimeSeconds())
            {
                var tokenString = GenerateToken();
                account.Token = tokenString;
                await database.SaveChangesAsync();
            }

            // Rate limit middleware should have passed us a nicely sanitised IP. Otherwise we will just fallback
            var requestIp = GetRequestIp(context);
            var userAgent = context.Request.Headers.UserAgent.ToString();
            if (requestIp is null)
            {
                return Results.Forbid();
            }
            await UpdateAccountClients(requestIp, userAgent, account, database);

            // Add auth cookie for subsequent requests
            AppendTokenCookie(account.Token, httpServer, context);

            return Results.Ok(new { account.Token, account.Id});
        });
        if (!httpServer.Environment.IsDevelopment())
        {
            rateLimitEndpoints.Add("/auth/signin", (1, TimeSpan.FromSeconds(1)));
            sizeLimitEndpoints.Add("/auth/signin", PayloadSize.FromKilobytes(5));
        }
        
        httpServer.MapPost("/auth/signout", (HttpContext context) =>
        {
            if (context.Request.Cookies["Token"] != null)
            {
                context.Response.Cookies.Delete("Token", new CookieOptions()
                {
                    HttpOnly = true
                });
            }

            return Results.Ok();
        });
    }

    private static string? GetRequestIp(HttpContext context)
    {
        return context.Items["RealIp"] as string ?? context.Connection.RemoteIpAddress?.ToString();
    }

    private static async Task UpdateAccountClients(string requestIp, string userAgent, AccountData account, DatabaseContext database)
    {
        var accountClient = await database.AccountClients
            .SingleOrDefaultAsync(info =>
                info.IpAddress == requestIp
                && info.AccountId == account.Id
                && info.UserAgent == userAgent);
        if (accountClient is null)
        {
            var newClient = new AccountClient(requestIp, userAgent, account.Id);
            database.AccountClients.Add(newClient);
        }
        else
        {
            accountClient.LastUsed = DateTime.Now; 
        }
        await database.SaveChangesAsync();
    }

    private static void AppendTokenCookie(string token, WebApplication app, HttpContext context)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = config!.CorsCookie ? SameSiteMode.Lax : SameSiteMode.None,
            Expires = DateTimeOffset.UtcNow.AddMonths(1),
            Domain = context.Request.Host.Host,
            Path = "/"
        };

        context.Response.Cookies.Append("Token", token, cookieOptions);
    }
}