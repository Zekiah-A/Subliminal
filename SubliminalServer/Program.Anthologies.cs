namespace SubliminalServer;

internal static partial class Program
{
    private static void AddAnthologyEndpoints()
    {
        httpServer.MapGet("/anthologies/{identifier}", async (string identifier, DatabaseContext dbContext) =>
        {
            throw new NotImplementedException();
        });

    }
}