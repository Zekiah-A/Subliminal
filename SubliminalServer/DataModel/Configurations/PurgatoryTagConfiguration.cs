using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SubliminalServer.DataModel.Purgatory;

namespace SubliminalServer.DataModel.Configurations;

public class PurgatoryTagConfiguration : IEntityTypeConfiguration<PurgatoryTag>
{
    public void Configure(EntityTypeBuilder<PurgatoryTag> builder)
    {
        builder.HasKey(tag => tag.Id);
        
        // One to many (PurgatoryEntry)
        builder.HasOne(tag => tag.PurgatoryEntry)
            .WithMany(entry => entry.Tags)
            .HasForeignKey(tag => tag.EntryId);
    }
}