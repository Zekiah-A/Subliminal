using Microsoft.EntityFrameworkCore;

namespace SubliminalServer;

public class AuthorizationMiddleware
{
    private readonly RequestDelegate nextRequest;
    private readonly DatabaseContext databaseContext;

    public AuthorizationMiddleware(RequestDelegate nextReq, DatabaseContext dbContext)
    {
        nextRequest = nextReq;
        databaseContext = dbContext;
    }

    public async Task Invoke(HttpContext context)
    {
        var accountToken = context.Request.Cookies["Token"];

        if (accountToken != null)
        {
            var account = await databaseContext.Accounts.SingleOrDefaultAsync(account => account.Token == accountToken);
            if (account is null)
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsync("Invalid account token.");
                return;
            }

            context.Items["Account"] = account;
        }

        await nextRequest(context);
    }
}