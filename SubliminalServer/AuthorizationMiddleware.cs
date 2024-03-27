using Microsoft.EntityFrameworkCore;

namespace SubliminalServer;

public class AuthorizationMiddleware
{
    private readonly RequestDelegate nextRequest;
    private readonly DatabaseContext databaseContext;

    public AuthorizationMiddleware(RequestDelegate nextReq, DatabaseContext db)
    {
        nextRequest = nextReq;
        databaseContext = db;
    }

    public async Task Invoke(HttpContext context)
    {
        var accountToken = context.Request.Cookies["Token"];

        if (accountToken != null)
        {
            var account = await databaseContext.Accounts
                .SingleOrDefaultAsync(account => account.Token == accountToken);
            context.Items["Account"] = account;
        }

        await nextRequest(context);
    }
}