using Microsoft.EntityFrameworkCore;
using SubliminalServer.DataModel.Account;
using SubliminalServer.DataModel.Configurations;
using SubliminalServer.DataModel.Purgatory;
using SubliminalServer.DataModel.Report;

namespace SubliminalServer;

public class DatabaseContext : DbContext
{
    public DbSet<AccountData> Accounts { get; set; }
    public DbSet<AccountBadge> AccountBadges { get; set; }
    public DbSet<AccountAddress> AccountAddresses { get; set; }

    public DbSet<PurgatoryDraft> PurgatoryDrafts { get; set; }
    public DbSet<PurgatoryEntry> PurgatoryEntries { get; set; }
    public DbSet<PurgatoryTag> PurgatoryTags { get; set; }
    public DbSet<PurgatoryAnnotation> PurgatoryAnnotations { get; set; }

    public DatabaseContext()
    {
    }
    public DatabaseContext(DbContextOptions<DatabaseContext> options) : base(options)
    {
    }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new AccountDataConfiguration());
        modelBuilder.ApplyConfiguration(new AccountAddressConfiguration());
        modelBuilder.ApplyConfiguration(new AccountBadgeConfiguration());
        modelBuilder.ApplyConfiguration(new PurgatoryEntryConfiguration());
        modelBuilder.ApplyConfiguration(new PurgatoryTagConfiguration());
        modelBuilder.ApplyConfiguration(new PurgatoryDraftConfiguration());
    }
}
