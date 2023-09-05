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
        builder.HasKey(account => new { account.AccountKey, account.Username });

        // Unique email
        builder.HasIndex(account => account.Email).IsUnique();

        // One to many Drafts (PurgatoryEntry)
        builder.HasMany(account => account.Drafts)
            .WithOne(entry => entry.Author)
            .HasForeignKey(entry => entry.AuthorKey);
        
        // Many to many between AccountData (Blocked) and AccountData (BlockedBy)
        builder.HasMany(account => account.Blocked)
            .WithMany()
            .UsingEntity<Dictionary<string, object>>( // Join / linker table to associate blocked accounts BlockedAccounts(BlockedId AccountData, BlockedById AccountData)
                "BlockedAccounts",
                right => right.HasOne<AccountData>().WithMany().HasForeignKey("Blocked"),
                left => left.HasOne<AccountData>().WithMany().HasForeignKey("BlockedBy"),
                joinEntity => joinEntity.HasKey("Blocked", "BlockedBy"));
        
        // Many to many Liked poems (PurgatoryEntry)
        builder.HasMany(account => account.LikedPoems)
            .WithMany()
            .UsingEntity<Dictionary<string, object>>(
                "LikedPoems",
                right => right.HasOne<PurgatoryEntry>().WithMany().HasForeignKey("LikedPoem"),
                left =>  left.HasOne<AccountData>().WithMany().HasForeignKey("LikerAccount"),
                joinEntity => joinEntity.HasKey("LikedPoem", "LikerAccount"));
    }
}
