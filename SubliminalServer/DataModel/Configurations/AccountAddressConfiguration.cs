using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SubliminalServer.DataModel.Account;

namespace SubliminalServer.DataModel.Configurations;

public class AccountAddressConfiguration : IEntityTypeConfiguration<AccountAddress>
{
    public void Configure(EntityTypeBuilder<AccountAddress> builder)
    {
        builder.HasKey(address => address.AddressKey);

        // One to many (AccountData)
        builder.HasOne(address => address.Account)
            .WithMany(account => account.KnownIPs)
            .HasForeignKey(address => address.AddressKey);
    }
}
