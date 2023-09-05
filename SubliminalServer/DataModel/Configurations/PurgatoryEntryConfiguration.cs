using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SubliminalServer.DataModel.Purgatory;

namespace SubliminalServer.DataModel.Configurations;

public class PurgatoryEntryConfiguration : IEntityTypeConfiguration<PurgatoryEntry>
{
    public void Configure(EntityTypeBuilder<PurgatoryEntry> builder)
    {
        // Define the primary key
        builder.HasKey(entry => entry.EntryKey);
        
        // One author to many
        builder.HasOne(entry => entry.Author)
            .WithMany()
            .HasForeignKey(entry => entry.AuthorKey);
        
        // Define the one to many relationship between PurgatoryEntry (Amends) and PurgatoryEntry (AmendedBy)
        builder.HasOne(p => p.Amends)
            .WithMany();
    }
}