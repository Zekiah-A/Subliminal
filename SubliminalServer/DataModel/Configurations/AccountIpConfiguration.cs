using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SubliminalServer.DataModel.Account;

namespace SubliminalServer.DataModel.Configurations;

public class AccountIpConfiguration : IEntityTypeConfiguration<AccountIp>
{
    public void Configure(EntityTypeBuilder<AccountIp> builder)
    {
        builder.HasKey(address => address.AddressKey);
        builder.Property(address => address.AddressKey).HasDefaultValueSql("NEWID()");

        // One to many (AccountData)
        builder.HasOne(address => address.Account)
            .WithMany(account => account.KnownIPs)
            .HasForeignKey(address => address.AddressKey);
    }
}
