using SubliminalServer.DataModel.Account;

namespace SubliminalServer;

public class EnsureAuthorizationMiddleware
{
    private readonly RequestDelegate nextRequest;

    public EnsureAuthorizationMiddleware(RequestDelegate nextReq)
    {
        nextRequest = nextReq;
    }

    public async Task Invoke(HttpContext context)
    {
        var account = context.Items["Account"];
        if (account is not AccountData)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsync("This endpoint requires account authorisation.");
        }

        await nextRequest(context);
    }
}