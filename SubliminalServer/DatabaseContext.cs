using Microsoft.EntityFrameworkCore;
using SubliminalServer.Account;

namespace SubliminalServer;

public class DatabaseContext : DbContext
{
    public DbSet<AccountProfile> AccountProfiles { get; set; }
    public DbSet<AccountData> AccountDatas { get; set; }
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