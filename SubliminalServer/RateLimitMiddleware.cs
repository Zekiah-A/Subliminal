using System.Net;
using SubliminalServer.DataModel.Account;

namespace SubliminalServer;

public class RateLimitMiddleware
{
    private readonly RequestDelegate nextReqRequest;
    private readonly Dictionary<string, RateLimitCounter> requestCounters;
    private readonly int requestReqLimit;
    private readonly TimeSpan timeInterval;

    public RateLimitMiddleware(RequestDelegate nextReq, int reqLimit, TimeSpan interval)
    {
        nextReqRequest = nextReq;
        requestReqLimit = reqLimit;
        timeInterval = interval;
        requestCounters = new Dictionary<string, RateLimitCounter>();
    }

    public async Task Invoke(HttpContext context)
    {
        var key = GetRateLimitKey(context);

        if (key is null)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsync("Unauthorised IP address.");
            return;
        }

        if (!requestCounters.TryGetValue(key, out var counter))
        {
            counter = new RateLimitCounter();
            requestCounters[key] = counter;
        }

        var currentTime = DateTime.Now;
        counter.RemoveOldRequests(currentTime - timeInterval);

        if (counter.RequestCount >= requestReqLimit)
        {
            context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
            await context.Response.WriteAsync("Rate limit exceeded.");
            return;
        }

        counter.AddRequest(currentTime);
        await nextReqRequest(context);
    }

    private static string? GetRateLimitKey(HttpContext context)
    {
        // We rate limit by account if account middleware has passed us a valid account, otherwise IP
        var account = context.Items["Account"];
        if (account is AccountData accountData)
        {
            return accountData.Token;
        }

        if (TrySanitiseIpAddress(context.Connection.RemoteIpAddress, out var sanitisedAddress))
        {
            return sanitisedAddress;
        }

        return null;
    }

    private static bool TrySanitiseIpAddress(IPAddress? address, out string? sanitised)
    {
        if (address?.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
        {
            // For IPv4 addresses, just return the IP address as a string
            sanitised = address.ToString();
            return true;
        }

        if (address?.AddressFamily == System.Net.Sockets.AddressFamily.InterNetworkV6)
        {
            var ipv6Address = address.ToString();
            var index = ipv6Address.IndexOf('%'); // Find the '%' character indicating subnet information
            if (index >= 0)
            {
                sanitised = ipv6Address[..index];
                return true;
            }

            sanitised = ipv6Address;
            return true;
        }
        
        if (address is null || !IPAddress.IsLoopback(address))
        {
            sanitised = null;
            return false;
        }
        
        sanitised = address.ToString();
        return true;
    }
}

internal class RateLimitCounter
{
    private readonly List<DateTime> requestTimes = new();

    public int RequestCount => requestTimes.Count;

    public void AddRequest(DateTime requestTime)
    {
        requestTimes.Add(requestTime);
    }

    public void RemoveOldRequests(DateTime cutoffTime)
    {
        requestTimes.RemoveAll(time => time < cutoffTime);
    }
}