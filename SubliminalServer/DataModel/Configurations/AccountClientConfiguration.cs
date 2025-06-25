using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SubliminalServer.DataModel.Account;

namespace SubliminalServer.DataModel.Configurations;

public class AccountClientConfiguration : IEntityTypeConfiguration<AccountClient>
{
    public void Configure(EntityTypeBuilder<AccountClient> builder)
    {
        // One to many (AccountData)
        builder.HasOne(client => client.Account)
            .WithMany(account => account.KnownIPs)
            .HasForeignKey(client => client.AccountId);
    }
}
