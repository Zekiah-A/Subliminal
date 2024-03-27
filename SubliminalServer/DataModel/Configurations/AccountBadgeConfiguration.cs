using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SubliminalServer.DataModel.Account;

namespace SubliminalServer.DataModel.Configurations;

public class AccountBadgeConfiguration : IEntityTypeConfiguration<AccountBadge>
{
    public void Configure(EntityTypeBuilder<AccountBadge> builder)
    {
        builder.HasKey(badge => badge.BadgeKey);

        // One to many (AccountData)
        builder.HasOne(badge => badge.Account)
            .WithMany(account => account.Badges)
            .HasForeignKey(badge => badge.AccountKey);
    }
}
