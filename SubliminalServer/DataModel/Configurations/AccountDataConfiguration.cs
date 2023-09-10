using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SubliminalServer.DataModel.Account;
using SubliminalServer.DataModel.Purgatory;

namespace SubliminalServer.DataModel.Configurations;

public class AccountDataConfiguration : IEntityTypeConfiguration<AccountData>
{
    public void Configure(EntityTypeBuilder<AccountData> builder)
    {
        // Define the primary key
        builder.HasKey(account => new { account.AccountKey });

        // Unique email
        builder.HasIndex(account => account.Username).IsUnique();
        builder.HasIndex(account => account.Email).IsUnique();

        // One to many Poems (PurgatoryEntry)
        builder.HasMany(account => account.Poems)
            .WithOne(entry => entry.Author)
            .HasForeignKey(entry => entry.AuthorKey);

        // One to many Drafts (PurgatoryEntry)
        builder.HasMany(account => account.Drafts)
            .WithOne(draft => draft.Author)
            .HasForeignKey(draft => draft.AuthorKey);

        // One to many Badges (AccountBadge)
        builder.HasMany(account => account.Badges)
            .WithOne(badge => badge.AccountData)
            .HasForeignKey(badge => badge.AccountKey);
        
        // One to many IPs (AccountBadge)
        builder
            .HasMany(mainEntity => mainEntity.KnownIPs)
            .WithOne(address => address.AccountData)
            .HasForeignKey(address => address.AccountKey);

        // Many to many AccountData (Blocked), AccountData (BlockedBy)
        builder.HasMany(account => account.Blocked)
            .WithMany()
            .UsingEntity<Dictionary<string, object>>( // Join / linker table to associate blocked accounts BlockedAccounts(BlockedId AccountData, BlockedById AccountData)
                "BlockedAccounts",
                right => right.HasOne<AccountData>().WithMany().HasForeignKey("Blocked"),
                left => left.HasOne<AccountData>().WithMany().HasForeignKey("BlockedBy"),
                joinEntity => joinEntity.HasKey("Blocked", "BlockedBy"));

        // Many to many following (Followed), AccountData (FollowedBy)
        builder.HasMany(account => account.Following)
            .WithMany()
            .UsingEntity<Dictionary<string, object>>(
                "FollowingAccounts",
                right => right.HasOne<AccountData>().WithMany().HasForeignKey("Followed"),
                left => left.HasOne<AccountData>().WithMany().HasForeignKey("FollowedBy"),
                joinEntity => joinEntity.HasKey("Followed", "FollowedBy"));

        // Many to many Liked poems (PurgatoryEntry)
        builder.HasMany(account => account.LikedPoems)
            .WithMany()
            .UsingEntity<Dictionary<string, object>>(
                "LikedPoems",
                right => right.HasOne<PurgatoryEntry>().WithMany().HasForeignKey("LikedPoem"),
                left =>  left.HasOne<AccountData>().WithMany().HasForeignKey("LikerAccount"),
                joinEntity => joinEntity.HasKey("LikedPoem", "LikerAccount"));

        // Many to many Pinned poems (PurgatoryEntry)
        builder.HasMany(account => account.PinnedPoems)
            .WithMany()
            .UsingEntity<Dictionary<string, object>>(
                "PinnedPoem",
                right => right.HasOne<PurgatoryEntry>().WithMany().HasForeignKey("PinnedPoem"),
                left =>  left.HasOne<AccountData>().WithMany().HasForeignKey("PinnerAccount"),
                joinEntity => joinEntity.HasKey("PinnedPoem", "PinnerAccount"));
    }
}
