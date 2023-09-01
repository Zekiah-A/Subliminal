using Microsoft.EntityFrameworkCore;
using SubliminalServer.DataModel.Account;
using SubliminalServer.DataModel.Purgatory;

namespace SubliminalServer;

public class DatabaseContext : DbContext
{
    public DbSet<AccountData> Accounts { get; set; }
    public DbSet<PurgatoryEntry> PurgatoryEntries { get; set; }
    public DbSet<PurgatoryAnnotation> PurgatoryAnnotations { get; set; }
    public DbSet<PurgatoryRating> PurgatoryRatings { get; set; }

    private string DatabasePath { get; }

    public DatabaseContext(string dbPath)
    {
        DatabasePath = dbPath;
    }

    protected override void OnConfiguring(DbContextOptionsBuilder options)
    {
        options.UseSqlite($"Data Source={DatabasePath}");
    }
}