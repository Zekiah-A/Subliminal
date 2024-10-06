using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SubliminalServer.DataModel.Account;

namespace SubliminalServer.DataModel.Configurations;

public class AccountAddressConfiguration : IEntityTypeConfiguration<AccountAddress>
{
    public void Configure(EntityTypeBuilder<AccountAddress> builder)
    {
        builder.HasKey(address => address.Id);
        builder.Property(address => address.Id)
            .ValueGeneratedOnAdd();

        // One to many (AccountData)
        builder.HasOne(address => address.Account)
            .WithMany(account => account.KnownIPs)
            .HasForeignKey(address => address.Id);
    }
}
