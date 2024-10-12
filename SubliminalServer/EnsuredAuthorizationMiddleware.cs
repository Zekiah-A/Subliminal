using Microsoft.EntityFrameworkCore;
using SubliminalServer.DataModel.Account;

namespace SubliminalServer;

public class EnsuredAuthorizationMiddleware
{
    private readonly RequestDelegate nextRequest;

    public EnsuredAuthorizationMiddleware(RequestDelegate nextRequest)
    {
        this.nextRequest = nextRequest;
    }

    public async Task InvokeAsync(HttpContext context, DatabaseContext database)
    {
        var token = GetRequestToken(context);
        if (token is null || await GetTokenAccount(token, database) is not { } account)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(new { Message = "Invalid token provided in auth header" });
            return;
        }

        context.Items["Account"] = account;
        await nextRequest(context);
    }
    
    private static async Task<AccountData?> GetTokenAccount(string token, DatabaseContext database)
    {
        var account = await database.Accounts.FirstOrDefaultAsync(account => account.Token == token);
        return account;
    }

    private static string? GetRequestToken(HttpContext context)
    {
        var token = context.Request.Headers.Authorization.FirstOrDefault()
            ?? context.Request.Cookies["Token"] ?? context.Request.Query["token"].FirstOrDefault();
        return token;
    }
}