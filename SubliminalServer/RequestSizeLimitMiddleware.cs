namespace SubliminalServer;

public class RequestSizeLimitMiddleware
{
    private readonly RequestDelegate nextRequest;
    private readonly long maxSize;

    public RequestSizeLimitMiddleware(RequestDelegate nextRequestReq, long maxPayloadSize)
    {
        nextRequest = nextRequestReq;
        maxSize = maxPayloadSize;
    }

    public async Task Invoke(HttpContext context)
    {
        if (context.Request.ContentLength > maxSize)
        {
            context.Response.StatusCode = StatusCodes.Status413PayloadTooLarge;
            await context.Response.WriteAsync("Request body is too large.");
            return;
        }

        await nextRequest(context);
    }
}