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
        
        builder.HasOne(entry => entry.Author)
            .WithMany(account => account.Poems) // Use the correct navigation property
            .HasForeignKey(entry => entry.AuthorKey);
        
        // One to many PurgatoryEntry (Amends), PurgatoryEntry (AmendedBy)
        builder.HasOne(entry => entry.Amends)
            .WithMany()
            .HasForeignKey(entry => entry.AmendsKey);

        // One to many PurgatoryEntry (Edits), PurgatoryEntry (AmendedBy)
        builder.HasOne(entry => entry.Edits)
            .WithMany()
            .HasForeignKey(entry => entry.EditsKey);
        
        // Many to one (PoemTags)
        builder.HasMany(entry => entry.Tags)
            .WithOne(tag => tag.PurgatoryEntry)
            .HasForeignKey(tag => tag.EntryKey);
    }
}
